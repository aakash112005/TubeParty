# TubeParty Architecture

This document is the short, diagram-first companion to the README - useful for a quick refresher right before a code walkthrough.

## High-level overview

```
┌─────────────┐        REST (create/check room)        ┌─────────────┐
│             │ ───────────────────────────────────────▶ │             │
│   React     │                                            │   Express   │
│   Client    │        Socket.IO (everything else)         │  + Socket.IO│
│             │ ◀────────────────────────────────────────▶ │             │
└─────────────┘                                            └──────┬──────┘
                                                                    │
                                                                    │ best-effort
                                                                    ▼
                                                             ┌─────────────┐
                                                             │  MongoDB    │
                                                             │ (room meta) │
                                                             └─────────────┘
```

Two very different kinds of "server work" happen here, and they're deliberately handled differently:

- **Room creation / lookup** is a one-off action → plain REST (`POST /api/rooms`, `GET /api/rooms/:code`).
- **Everything that happens *inside* a room** (joining, playback, chat, roles) is continuous and needs to be pushed to multiple clients instantly → Socket.IO.

## Client-side flow

```
main.jsx
 └─ App.jsx
     ├─ ThemeProvider        (dark/light, persisted)
     └─ SocketProvider       (owns the single Socket.IO connection)
         └─ Router
             ├─ Landing.jsx           (create/join room via REST)
             └─ Room.jsx
                 ├─ JoinGate           (if no saved username - direct invite link case)
                 └─ RoomProvider       (joins the room over the socket, owns room state)
                     └─ RoomContent
                         ├─ RoomHeader
                         ├─ VideoPlayer + PlaybackControls
                         ├─ ParticipantsPanel
                         ├─ ChatPanel
                         └─ ActivityFeed
```

`RoomContext` is the single place that turns raw socket events into React state (`participants`, `currentVideo`, `chatMessages`, `activityLog`, `reactions`, `typingUsers`) and exposes an `actions` object (`play`, `pause`, `seek`, `changeVideo`, `assignRole`, `removeParticipant`, `transferHost`, `sendChatMessage`, `sendTyping`, `sendReaction`) that every room component calls into. No component talks to the socket directly except `RoomContext` itself.

## Backend flow

```
server.js
 ├─ Express app  (helmet, cors, compression, rate limiting)
 │   └─ /api/rooms, /api/rooms/:code, /api/health
 │
 └─ Socket.IO server
     └─ on('connection') → registers 4 handler groups per socket:
         ├─ roomHandlers        (join/leave/disconnect, host hand-off)
         ├─ playbackHandlers    (play/pause/seek/change_video)
         ├─ moderationHandlers  (assign_role/remove_participant/transfer_host)
         └─ chatHandlers        (chat_message/typing/emoji_reaction)

 Shared state: RoomManager (singleton)
   └─ Map<roomCode, LiveRoom>
        LiveRoom
          ├─ Map<socketId, Participant>
          ├─ currentVideo { videoId, isPlaying, currentTime }
          ├─ chatMessages[], activityLog[]
          └─ settings
```

Every handler that changes room state follows the same shape:

1. Look up the `LiveRoom` from `RoomManager` using `socket.data.roomCode`.
2. Look up the caller's `Participant` inside that room.
3. Ask `PermissionManager` whether that participant's role is allowed to do this.
4. If yes: mutate the `LiveRoom`, then broadcast the result to `io.to(roomCode)` (or `socket.to(roomCode)` to exclude the sender where an echo isn't needed).
5. If no: emit `error_event` back to just that socket.

This is the enforcement boundary - the frontend disabling a button is just UX, step 3 is what actually stops an unauthorized action.

## Room lifecycle

```
POST /api/rooms { username }
   → RoomManager.createRoom(code, hostUsername)   [registers room, no participants yet]
   → Room.create({ code, hostUsername })            [persists to MongoDB, best-effort]
   → returns { roomCode, inviteLink }

First socket to emit join_room(roomCode, username, participantId)
   → becomes Host (room.isEmpty was true)

Every later join_room with a NEW participantId
   → becomes Participant by default

join_room with a participantId that ALREADY has a slot in the room
   → treated as a reconnect: role/identity restored as-is, no new
     participant created, any pending grace-period removal is cancelled

A participant's socket disconnects (raw 'disconnect' event)
   → marked offline immediately (visible to others), but NOT removed
   → a grace-period timer starts (PARTICIPANT_RECONNECT_GRACE_MS, default 10s)
   → if they reconnect with the same participantId before it fires, the
     timer is cancelled and they're restored exactly as they were
   → if it fires without a reconnect: NOW they're actually removed,
     and if they were host, pickNextHost() runs → Moderator, then
     Participant, then Viewer (only considering currently-online people)

A participant clicks "Leave Room" (explicit leave_room event)
   → removed immediately, no grace period - this is unambiguous intent,
     unlike a raw disconnect which could just be a refresh in progress
```

## Participant identity model

This is the piece that was missing in the first version of the project
and caused a cluster of refresh/role bugs (documented in the "Bug Fix
Log" below). The fix: a participant's identity is **not** their
Socket.IO `socket.id`.

- The client generates a random `participantId` the first time it
  joins a given room, and persists it in `localStorage` keyed by that
  room's code (`utils/participantId.js`). It sends this on every
  `join_room` call, including ones triggered by a page refresh.
- On the server, `LiveRoom.participants` is keyed by `participantId`,
  not `socket.id`. A `Participant`'s `socketId` field just tracks
  "whichever live connection currently represents this person" and is
  expected to change across reconnects.
- Every socket handler that needs to act on "the current caller"
  reads `socket.data.participantId` (set once at join time, valid for
  that connection's whole lifetime) rather than scanning for a
  matching `socket.id`.
- Every moderation action (`assign_role`, `remove_participant`,
  `transfer_host`) targets a `targetParticipantId`, never a socketId -
  a socketId captured in the host's UI goes stale the instant the
  target refreshes, which was the concrete cause of "host transfer
  sometimes doesn't give the new host permissions."

On the client, `RoomContext` mirrors this: instead of maintaining a
separate `you` piece of state that has to be manually patched inside
every single event handler (the old design - and the actual root
cause of "old host still has permissions after transferring", since
one handler forgot to patch it), `you` is now derived with `useMemo`
from `participants.find(p => p.participantId === myParticipantId)`.
There is no handler left to "forget" - `you` is always whatever the
canonical participants list says it is.


## Synchronization logic

The core problem: everyone's YouTube player needs to show the same video, at the same time, in the same play/pause state - despite each client running its own independent player instance with its own network latency.

The approach taken here is **server-authoritative, tolerant sync**:

- The server is the single source of truth for `{ videoId, isPlaying, currentTime }` - it's never derived from any one client.
- Late joiners and reconnects don't get a stale, stored `currentTime` - `LiveRoom.getCurrentVideoSnapshot()` extrapolates it forward by however long has elapsed in real time since the last play/pause/seek, if the video is currently playing (and leaves it untouched if paused). Without this, someone joining 30 seconds into playback would land 30 seconds behind everyone else and it would look like the video had restarted.
- Clients don't try to be frame-perfect. On receiving a sync event, a client only seeks if its local player has drifted more than 1.5 seconds from the target - this avoids constant tiny corrective seeks (which look janky) while still catching real desync.
- Native YouTube scrub-bar drags are caught by polling `getCurrentTime()` once per second (Host/Moderator clients only) and comparing it against the time we'd expect if playback had continued normally; a big enough gap is treated as a manual seek and re-broadcast.

## Role permission flow

```
Action requested (e.g. change_video)
   → PermissionManager.canControlPlayback(participant.role)?
        Host / Moderator → proceed
        Participant / Viewer → reject, emit error_event

Action requested (e.g. assign_role, remove_participant, transfer_host)
   → PermissionManager.canAssignRole / canRemoveParticipant / canTransferHost(participant.role)?
        Host → proceed
        anyone else → reject, emit error_event
```

## Database design

Only one collection is used: `rooms`. It intentionally does **not** try to mirror the live in-memory state 1:1 - see "Room Persistence & Cleanup" in the README for why hot state (participants, chat, activity) stays in memory only.

```js
Room {
  code: String (unique, indexed)
  hostUsername: String
  currentVideo: { videoId, isPlaying, currentTime }
  settings: { chatEnabled, reactionsEnabled, moderatorsCanChangeVideo }
  status: 'active' | 'closed'
  lastActivityAt: Date
  createdAt / updatedAt (timestamps)
}
```

## Scalability

Not implemented (see README for why it isn't needed at this project's scale), but the code is structured so it's a swap, not a rewrite:

- `RoomManager`'s `Map<roomCode, LiveRoom>` is the only place that assumes single-process memory. Replacing its internals with Redis-backed storage wouldn't require touching any socket handler, because they all go through `roomManager.getRoom()` / `roomManager.createRoom()` rather than touching the `Map` directly.
- Adding the Socket.IO Redis adapter in `server.js` would let multiple Node processes share broadcast delivery with no handler changes.

---

## Bug Fix Log (synchronization & role-management audit)

A full audit was performed after reports of refresh/role/host-transfer bugs. Every issue traced back to one architectural gap: **participants had no identity that survived a page refresh.** They were keyed purely by the ephemeral Socket.IO `socket.id`, so a refresh produced a brand-new socket, which the server had no way to distinguish from a brand-new stranger. That single gap explains most of what follows; a few independent bugs were also found during the audit.

| # | Bug | Root cause | Fix |
|---|-----|------------|-----|
| 1 | Refreshing lost Host/Moderator role, resetting to Participant | Participants keyed by `socket.id`; a refresh = new socket = new Participant with default role | Introduced a stable, client-generated `participantId` (persisted in `localStorage` per room, sent on every `join_room`). Server now looks up by `participantId` first; if found, it's a **reconnect** that restores the existing role instead of creating a new participant |
| 2 | Refreshing sometimes caused a false "username already taken" error | Old socket's `disconnect` event could lag behind the new socket's `join_room` (both fire around the same moment during a refresh), so the reconnecting user briefly looked like "someone else with my name" | Same identity fix as #1 - a matching `participantId` is recognized as a reconnect and skips the username-collision check against itself entirely |
| 3 | Video stopped/restarted for a refreshed or newly-joining participant | `sync_state` sent the raw, stored `currentTime` from the last play/pause/seek event with no adjustment for elapsed real time - a joiner 30s into playback would seek back 30 seconds | Added `LiveRoom.getCurrentVideoSnapshot()`, which extrapolates `currentTime` forward by the elapsed time since the last update whenever the video is playing (left untouched when paused). Used by every `sync_state` emission |
| 4 | Promoting a participant to Moderator sometimes didn't grant them playback control | Not actually a permission-check bug (the assign_role handler was always correct) - the real cause was #1: if the newly-promoted moderator refreshed shortly after being promoted, their role reset to Participant, since it hadn't survived the refresh | Fixed by #1 - role now survives any refresh |
| 5 | After transferring host, the old host sometimes still had (visible) permissions | The *server* correctly demoted the old host, but the *client's* local `you` state was only ever patched inside `handleHostChanged` for the **new** host - nothing updated the old host's own `you`, so their UI kept showing enabled controls the server would actually reject | Removed the manually-patched `you` state entirely. `RoomContext` now derives `you` with `useMemo` from `participants.find(p => p.participantId === myParticipantId)` - every event that updates the participants list automatically keeps `you` correct for everyone, with no handler-by-handler patching to forget |
| 6 | Host transfer sometimes silently failed or targeted the wrong person | `assign_role` / `remove_participant` / `transfer_host` all targeted `targetSocketId`. If the target had refreshed since the host's UI last received the participant list, that socketId no longer existed in the room | All three moderation actions now target `targetParticipantId` instead - stable across the target's own refreshes |
| 7 | A host disconnecting (even briefly, e.g. a refresh) immediately triggered auto host hand-off to someone else | `disconnect` was treated identically to an intentional leave - immediate removal, immediate host reassignment | Added a reconnect grace period (`PARTICIPANT_RECONNECT_GRACE_MS`, default 10s). A raw `disconnect` now marks the participant offline and starts a timer; reconnecting with the same `participantId` cancels it and restores them exactly as they were. Removal (and host hand-off, if applicable) only happens if the timer expires without a reconnect. An explicit "Leave Room" click is unambiguous and still removes immediately, bypassing the grace period entirely |
| 8 | A stale, superseded `disconnect` event could incorrectly tear down a participant who had already reconnected with a new socket | The old socket's `disconnect` event can arrive *after* the new socket's `join_room` has already rebound the participant to the new connection | The disconnect handler now checks `participant.socketId !== socket.id` and ignores the event entirely if the participant's live connection has already moved on |
| 9 | A kicked participant's own cleanup-triggered `leave_room` (fired when their client redirects home) rebroadcast a phantom "left the room" activity | The leave handler didn't guard against the participant already being gone | Added an early return if the participant no longer exists in the room; the removing handler also clears `socket.data` on the kicked socket so its later disconnect/leave events are no-ops too |
| 10 | New joins/reconnects fired a misleading "X joined the room" toast for what was actually just a refresh | `user_joined` was the only broadcast event available for "someone's presence changed" | Reconnects now broadcast the previously-unused `room_updated` event instead - a silent participant-list sync with no toast, no activity-log entry |

### Testing performed

26 automated end-to-end tests (via a real `socket.io-client`, not mocks) were written and run against the fixed server, covering: basic join/host-assignment, role promotion with instant permission grant, refresh preserving Moderator role, refresh not producing a false username-taken error, late-join/refresh sync extrapolation (both playing and paused), host transfer + old host refresh (stays demoted), host transfer + new host refresh (stays host), demoted host correctly rejected by server, disconnect grace period (not immediately removed, marked offline, then actually removed once the grace period truly expires), auto host reassignment after real disconnect, duplicate/idempotent `join_room` calls, explicit leave being immediate, and two participants "simultaneously" refreshing without cross-contaminating each other's identity.

**All 26 tests pass.**

Scenarios from the original request not independently re-verified by an automated test (validated by code review / already covered by the above): multiple rapid play/pause/seek operations (covered by the same authorization + broadcast path as single operations, no additional state), chat/reactions/invite links/QR join (unaffected by this audit - no changes were made to those code paths), room cleanup (unaffected, still governed by `ROOM_INACTIVITY_TIMEOUT_MINUTES`), mobile/desktop browser rendering (a layout/CSS concern, not a synchronization concern - out of scope for this audit).
