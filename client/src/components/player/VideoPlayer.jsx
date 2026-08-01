import { useEffect, useRef, useState } from 'react';
import { LuLock, LuPlay } from 'react-icons/lu';
import { useYouTubePlayer } from '../../hooks/useYouTubePlayer';
import { useRoom } from '../../context/RoomContext';
import { PlayerSkeleton } from '../ui/Skeleton';
import { EmojiReactionsOverlay } from './EmojiReactionsOverlay';
import { CustomControls } from './Customcontrols';

const SYNC_TOLERANCE_SECONDS = 1.5;
const SEEK_POLL_INTERVAL_MS = 1000;
const AUTOPLAY_CHECK_DELAY_MS = 600;

export function VideoPlayer() {
  const containerRef = useRef(null);
  const { currentVideo, canControlPlayback, actions } = useRoom();
  
  

  // True while we're programmatically moving the player to match a
  // remote sync event - stops that resulting state change from being
  // re-broadcast back to the server (which would create an echo loop).
  const isSyncingRef = useRef(false);
  const lastKnownTimeRef = useRef(0);
  const lastVideoIdRef = useRef(null);

  // Shown when an unmuted playVideo() call got silently blocked by the
  // browser's autoplay policy (always true right after a page refresh,
  // since there's no user gesture yet on the new page load). The only
  // real fix is a genuine click - so we surface an overlay whose click
  // handler calls playVideo() directly, which counts as a valid
  // gesture and plays unmuted, no muting involved.
  const [needsResume, setNeedsResume] = useState(false);

  const checkAutoplayBlocked = (player) => {
    setTimeout(() => {
      const YTns = window.YT;
      if (!YTns || !player.getPlayerState) return;

      const state = player.getPlayerState();
      const blocked = state !== YTns.PlayerState.PLAYING && state !== YTns.PlayerState.BUFFERING;
      if (blocked) setNeedsResume(true);
    }, AUTOPLAY_CHECK_DELAY_MS);
  };

  const handleStateChange = (event, player) => {
    if (event.data === window.YT.PlayerState.PLAYING) {
      setNeedsResume(false);
    }

    if (!canControlPlayback || isSyncingRef.current) return;

    if (event.data === window.YT.PlayerState.PLAYING) {
      actions.play(player.getCurrentTime());
    } else if (event.data === window.YT.PlayerState.PAUSED) {
      actions.pause(player.getCurrentTime());
    }
  };

  const { playerRef, ready, YT } = useYouTubePlayer({
    containerRef,
    videoId: currentVideo.videoId,
    startTime: currentVideo.currentTime,
   // showControls: canControlPlayback,
    onStateChange: handleStateChange,
    onReady: (player) => {
      if (currentVideo.isPlaying) {
        player.playVideo();
        checkAutoplayBlocked(player);
      }
    },
  });

  // The player is created (in useYouTubePlayer) already pointed at
  // whatever videoId was current the moment it became ready. Record
  // that as "already handled" so the effect below doesn't immediately
  // fire a redundant loadVideoById for the exact video the player was
  // just built with. This must run before the load-new-video effect,
  // so it's declared first.
  useEffect(() => {
    if (ready) {
      lastVideoIdRef.current = currentVideo.videoId;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Load a new video into the existing player instance when the room's
  // videoId changes (host/moderator picked a different one after the
  // player already exists).
  useEffect(() => {
    if (!ready || !playerRef.current || !currentVideo.videoId) return;
    if (lastVideoIdRef.current === currentVideo.videoId) return;

    lastVideoIdRef.current = currentVideo.videoId;
    isSyncingRef.current = true;
    playerRef.current.loadVideoById(currentVideo.videoId, currentVideo.currentTime || 0);
    setTimeout(() => (isSyncingRef.current = false), 500);
  }, [ready, currentVideo.videoId, currentVideo.currentTime, playerRef]);

  // Apply remote play/pause/seek changes to the local player.
  useEffect(() => {
    if (!ready || !playerRef.current || !YT) return;
    const player = playerRef.current;
    const state = player.getPlayerState();

    isSyncingRef.current = true;

    const timeDrift = Math.abs(player.getCurrentTime() - currentVideo.currentTime);
    if (timeDrift > SYNC_TOLERANCE_SECONDS) {
      player.seekTo(currentVideo.currentTime, true);
    }

    if (currentVideo.isPlaying && state !== YT.PlayerState.PLAYING) {
      player.playVideo();
      checkAutoplayBlocked(player);
    } else if (!currentVideo.isPlaying && state === YT.PlayerState.PLAYING) {
      player.pauseVideo();
    }

    const timeout = setTimeout(() => (isSyncingRef.current = false), 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVideo.isPlaying, currentVideo.currentTime, ready]);

  // Poll for seeks made via the native YouTube scrub bar - the IFrame
  // API doesn't emit a dedicated "seek" event, so a host/moderator
  // dragging the progress bar is detected as an unexpected time jump.
  // (Now also catches drags on our own CustomControls seek bar as a
  // safety net, on top of the explicit onSeek call it makes.)
  useEffect(() => {
    if (!canControlPlayback || !ready) return;

    const interval = setInterval(() => {
      const player = playerRef.current;
      if (!player || isSyncingRef.current) return;

      const time = player.getCurrentTime();
      const expected = lastKnownTimeRef.current + SEEK_POLL_INTERVAL_MS / 1000;

      if (Math.abs(time - expected) > SYNC_TOLERANCE_SECONDS) {
        actions.seek(time);
      }
      lastKnownTimeRef.current = time;
    }, SEEK_POLL_INTERVAL_MS);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canControlPlayback, ready]);

  return (
    <div data-player-shell className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-black shadow-glass">
      {!ready ? <div className="absolute inset-0"><PlayerSkeleton /></div> : null}

      {!currentVideo.videoId ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface text-center">
          <p className="font-display text-sm font-medium text-ink">No video loaded yet</p>
          <p className="text-xs text-muted">
            {canControlPlayback ? 'Paste a YouTube link below to get started.' : 'Waiting for the host to load a video.'}
          </p>
        </div>
      ) : null}

      <div ref={containerRef} className="h-full w-full" />
      <EmojiReactionsOverlay />

      {canControlPlayback && currentVideo.videoId ? (
        <CustomControls
          playerRef={playerRef}
          ready={ready}
          YT={YT}
          videoId={currentVideo.videoId}
          onSeek={(time) => {
            isSyncingRef.current = true;
            actions.seek(time);
            lastKnownTimeRef.current = time;
            setTimeout(() => (isSyncingRef.current = false), 400);
          }}
        />
      ) : null}

      {!canControlPlayback && currentVideo.videoId ? (
        <div className="pointer-events-auto absolute inset-0" title="Only the host and moderators can control playback">
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-xs text-white backdrop-blur-sm">
            <LuLock className="h-3 w-3" />
            View only
          </div>
        </div>
      ) : null}

      {needsResume ? (
        <button
          type="button"
          onClick={() => {
            playerRef.current?.playVideo();
            setNeedsResume(false);
          }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 text-white backdrop-blur-sm z-20"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
            <LuPlay className="h-5 w-5 translate-x-0.5" />
          </span>
          <span className="text-xs font-medium">Click to resume</span>
        </button>
      ) : null}
    </div>
  );
}