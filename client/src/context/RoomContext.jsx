import { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useSocket } from './SocketContext';
import { SOCKET_EVENTS } from '../constants/socketEvents';
import { canControlPlayback as roleCanControlPlayback, isHost as roleIsHost } from '../constants/roles';
import { getStableParticipantId } from '../utils/participantId';

const RoomContext = createContext(null);

const REACTION_LIFETIME_MS = 3000;
const TYPING_TIMEOUT_MS = 3000;

export function RoomProvider({ roomCode, username, children }) {
  const { socket } = useSocket();
  const navigate = useNavigate();

  // Generated once per (browser, room) and persisted in localStorage -
  // this is what lets a page refresh reconnect as the SAME participant
  // instead of a new one. See utils/participantId.js.
  const [participantId] = useState(() => getStableParticipantId(roomCode));

  const [isJoined, setIsJoined] = useState(false);
  const [joinError, setJoinError] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [currentVideo, setCurrentVideo] = useState({ videoId: null, isPlaying: false, currentTime: 0 });
  const [chatMessages, setChatMessages] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [settings, setSettings] = useState({ chatEnabled: true, reactionsEnabled: true });
  const [typingUsers, setTypingUsers] = useState([]);
  const [reactions, setReactions] = useState([]);

  const typingTimeoutsRef = useRef({});

  // `you` is deliberately NOT its own piece of state that gets
  // manually patched inside every event handler. That pattern is what
  // caused the "old host still has permissions after transferring"
  // bug: host_changed correctly updated the NEW host's local `you`,
  // but nothing patched the OLD host's - it just went stale. Deriving
  // `you` from the canonical `participants` list instead means there
  // is no handler left to "forget" to update it; it's always in sync
  // with whatever the server most recently said the participant list
  // is, for every event that touches that list.
  const you = useMemo(
    () => participants.find((p) => p.participantId === participantId) ?? null,
    [participants, participantId]
  );

  const pushActivity = useCallback((activity) => {
    if (!activity) return;
    setActivityLog((prev) => [...prev.slice(-49), activity]);
  }, []);

  useEffect(() => {
    if (!socket || !roomCode || !username) return;

    // Captured once per effect run so the cleanup below reads a stable
    // reference instead of `.current` (which could have been mutated
    // by the time cleanup actually runs).
    const typingTimeouts = typingTimeoutsRef.current;

    const handleSyncState = (data) => {
      setParticipants(data.participants);
      setCurrentVideo(data.currentVideo);
      setChatMessages(data.chatMessages);
      setSettings(data.settings);
      setIsJoined(true);
      setJoinError(null);
    };

    // Silent presence sync - used for reconnects (someone's tab came
    // back after a refresh) where a "user joined" toast would be
    // actively misleading. No toast, no activity log entry, just the
    // updated list (including isOnline flags).
    const handleRoomUpdated = ({ participants: list }) => {
      setParticipants(list);
    };

    const handleUserJoined = ({ participant, participants: list, activity }) => {
      setParticipants(list);
      pushActivity(activity);
      toast.success(`${participant.username} joined the room`);
    };

    const handleUserLeft = ({ username: leftUsername, participants: list, activity }) => {
      setParticipants(list);
      pushActivity(activity);
      toast(`${leftUsername} left the room`, { icon: '👋' });
    };

    const handlePlay = ({ currentTime }) => {
      setCurrentVideo((prev) => ({ ...prev, isPlaying: true, currentTime }));
    };

    const handlePause = ({ currentTime }) => {
      setCurrentVideo((prev) => ({ ...prev, isPlaying: false, currentTime }));
    };

    const handleSeek = ({ currentTime }) => {
      setCurrentVideo((prev) => ({ ...prev, currentTime }));
    };

    const handleChangeVideo = ({ videoId, currentTime, isPlaying, activity }) => {
      setCurrentVideo({ videoId, currentTime, isPlaying });
      pushActivity(activity);
      toast.success('Video changed');
    };

    const handleRoleUpdated = ({ participant, participants: list, activity }) => {
      setParticipants(list);
      pushActivity(activity);
      toast.success(`${participant.username} is now ${participant.role}`);
    };

    const handleParticipantRemoved = ({ username: removedUsername, participants: list, activity, youWereRemoved }) => {
      if (youWereRemoved) {
        toast.error('You were removed from the room by the host.');
        navigate('/', { replace: true });
        return;
      }
      if (list) setParticipants(list);
      pushActivity(activity);
      toast(`${removedUsername} was removed`, { icon: '🚪' });
    };

    const handleHostChanged = ({ newHost, participants: list, activity }) => {
      setParticipants(list);
      pushActivity(activity);
      toast.success(`${newHost.username} is now the host`, { icon: '👑' });
    };

    const handleChatMessage = (message) => {
      setChatMessages((prev) => [...prev.slice(-99), message]);
    };

    const handleTyping = ({ username: typingUsername, isTyping }) => {
      setTypingUsers((prev) => {
        if (isTyping) {
          return prev.includes(typingUsername) ? prev : [...prev, typingUsername];
        }
        return prev.filter((u) => u !== typingUsername);
      });

      clearTimeout(typingTimeoutsRef.current[typingUsername]);
      if (isTyping) {
        typingTimeoutsRef.current[typingUsername] = setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u !== typingUsername));
        }, TYPING_TIMEOUT_MS);
      }
    };

    const handleReaction = (reaction) => {
      setReactions((prev) => [...prev, reaction]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== reaction.id));
      }, REACTION_LIFETIME_MS);
    };

    const handleError = ({ message }) => {
      if (!isJoined) {
        setJoinError(message);
      } else {
        toast.error(message);
      }
    };

    socket.on(SOCKET_EVENTS.SYNC_STATE, handleSyncState);
    socket.on(SOCKET_EVENTS.ROOM_UPDATED, handleRoomUpdated);
    socket.on(SOCKET_EVENTS.USER_JOINED, handleUserJoined);
    socket.on(SOCKET_EVENTS.USER_LEFT, handleUserLeft);
    socket.on(SOCKET_EVENTS.PLAY, handlePlay);
    socket.on(SOCKET_EVENTS.PAUSE, handlePause);
    socket.on(SOCKET_EVENTS.SEEK, handleSeek);
    socket.on(SOCKET_EVENTS.CHANGE_VIDEO, handleChangeVideo);
    socket.on(SOCKET_EVENTS.ROLE_UPDATED, handleRoleUpdated);
    socket.on(SOCKET_EVENTS.PARTICIPANT_REMOVED, handleParticipantRemoved);
    socket.on(SOCKET_EVENTS.HOST_CHANGED, handleHostChanged);
    socket.on(SOCKET_EVENTS.CHAT_MESSAGE, handleChatMessage);
    socket.on(SOCKET_EVENTS.TYPING, handleTyping);
    socket.on(SOCKET_EVENTS.EMOJI_REACTION, handleReaction);
    socket.on(SOCKET_EVENTS.ERROR, handleError);

    // Sent on every connect (including reconnects) - the server tells
    // fresh joins apart from reconnects itself, keyed on participantId,
    // so the client doesn't need two different code paths here.
    const attemptJoin = () => socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomCode, username, participantId });

    if (socket.connected) attemptJoin();
    socket.on('connect', attemptJoin);

   return () => {
  socket.emit(SOCKET_EVENTS.LEAVE_ROOM);

  socket.off(SOCKET_EVENTS.SYNC_STATE, handleSyncState);
  socket.off(SOCKET_EVENTS.ROOM_UPDATED, handleRoomUpdated);
  socket.off(SOCKET_EVENTS.USER_JOINED, handleUserJoined);
  socket.off(SOCKET_EVENTS.USER_LEFT, handleUserLeft);
  socket.off(SOCKET_EVENTS.PLAY, handlePlay);
  socket.off(SOCKET_EVENTS.PAUSE, handlePause);
  socket.off(SOCKET_EVENTS.SEEK, handleSeek);
  socket.off(SOCKET_EVENTS.CHANGE_VIDEO, handleChangeVideo);
  socket.off(SOCKET_EVENTS.ROLE_UPDATED, handleRoleUpdated);
  socket.off(SOCKET_EVENTS.PARTICIPANT_REMOVED, handleParticipantRemoved);
  socket.off(SOCKET_EVENTS.HOST_CHANGED, handleHostChanged);
  socket.off(SOCKET_EVENTS.CHAT_MESSAGE, handleChatMessage);
  socket.off(SOCKET_EVENTS.TYPING, handleTyping);
  socket.off(SOCKET_EVENTS.EMOJI_REACTION, handleReaction);
  socket.off(SOCKET_EVENTS.ERROR, handleError);
  socket.off('connect', attemptJoin);
  Object.values(typingTimeouts).forEach(clearTimeout);
};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, roomCode, username, participantId]);

  const actions = {
    play: (currentTime) => socket.emit(SOCKET_EVENTS.PLAY, { currentTime }),
    pause: (currentTime) => socket.emit(SOCKET_EVENTS.PAUSE, { currentTime }),
    seek: (currentTime) => socket.emit(SOCKET_EVENTS.SEEK, { currentTime }),
    changeVideo: (videoUrlOrId) => socket.emit(SOCKET_EVENTS.CHANGE_VIDEO, { videoUrlOrId }),
    assignRole: (targetParticipantId, role) =>
      socket.emit(SOCKET_EVENTS.ASSIGN_ROLE, { targetParticipantId, role }),
    removeParticipant: (targetParticipantId) =>
      socket.emit(SOCKET_EVENTS.REMOVE_PARTICIPANT, { targetParticipantId }),
    transferHost: (targetParticipantId) =>
      socket.emit(SOCKET_EVENTS.TRANSFER_HOST, { targetParticipantId }),
    sendChatMessage: (text) => socket.emit(SOCKET_EVENTS.CHAT_MESSAGE, { text }),
    sendTyping: (isTyping) => socket.emit(SOCKET_EVENTS.TYPING, { isTyping }),
    sendReaction: (emoji) => socket.emit(SOCKET_EVENTS.EMOJI_REACTION, { emoji }),
  };

  const value = {
    roomCode,
    isJoined,
    joinError,
    you,
    participants,
    currentVideo,
    chatMessages,
    activityLog,
    settings,
    typingUsers,
    reactions,
    canControlPlayback: you ? roleCanControlPlayback(you.role) : false,
    isHost: you ? roleIsHost(you.role) : false,
    actions,
  };

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}

export function useRoom() {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error('useRoom must be used within a RoomProvider');
  return ctx;
}
