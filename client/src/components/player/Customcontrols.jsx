import { useEffect, useRef, useState, Fragment } from 'react';
import { LuPlay, LuPause, LuVolume2, LuVolumeX, LuMaximize } from 'react-icons/lu';

const POLL_MS = 250;

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = h > 0 ? String(m).padStart(2, '0') : m;
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

// Custom play/pause + seek + volume + fullscreen bar. Renders on top
// of the YouTube iframe (which has controls:0) for anyone who can
// control playback, replacing the native control bar entirely so its
// "More videos" suggested-video overlay never has a surface to show.
export function CustomControls({ playerRef, ready, YT, onSeek }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(100);
  const [scrubTime, setScrubTime] = useState(null); // non-null while dragging
  const containerRef = useRef(null);

  // Poll the player for time/state - the IFrame API has no
  // continuous "timeupdate" event, so this is the standard approach.
  useEffect(() => {
    if (!ready || !YT) return;

    const interval = setInterval(() => {
      const player = playerRef.current;
      if (!player) return;

      setIsPlaying(player.getPlayerState() === YT.PlayerState.PLAYING);
      setDuration(player.getDuration() || 0);
      if (scrubTime === null) setCurrentTime(player.getCurrentTime() || 0);
      setIsMuted(player.isMuted());
      setVolume(player.getVolume());
    }, POLL_MS);

    return () => clearInterval(interval);
  }, [ready, YT, playerRef, scrubTime]);

  const togglePlay = () => {
    const player = playerRef.current;
    if (!player) return;
    isPlaying ? player.pauseVideo() : player.playVideo();
  };

  const toggleMute = () => {
    const player = playerRef.current;
    if (!player) return;
    isMuted ? player.unMute() : player.mute();
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e) => {
    const value = Number(e.target.value);
    playerRef.current?.setVolume(value);
    setVolume(value);
    if (value > 0 && isMuted) {
      playerRef.current?.unMute();
      setIsMuted(false);
    }
  };

  const handleSeekChange = (e) => {
    setScrubTime(Number(e.target.value));
  };

  const commitSeek = (e) => {
    const time = Number(e.target.value);
    playerRef.current?.seekTo(time, true);
    setCurrentTime(time);
    setScrubTime(null);
    onSeek?.(time);
  };

  const toggleFullscreen = () => {
    const el = containerRef.current?.closest('[data-player-shell]');
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen?.();
    }
  };

  if (!ready) return null;

  const displayTime = scrubTime !== null ? scrubTime : currentTime;

  return (
    <Fragment>
      {/* Sits over the entire video, beneath the bottom control bar.
          YouTube's native paused-state suggestion panel (and its
          logo/branding link) lives inside the iframe and isn't
          affected by controls:0 - it can still render and eat clicks
          anywhere on the video. This transparent layer intercepts
          every click before it reaches the iframe at all, so nothing
          from YouTube's own UI is ever reachable. Clicking it just
          toggles play/pause, like a normal video player. */}
      <div
        className="absolute inset-0 z-[5] cursor-pointer"
        onClick={togglePlay}
        aria-hidden="true"
      />

      <div
        ref={containerRef}
        className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-1.5 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-3 pb-2 pt-8"
      >
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={displayTime}
          onChange={handleSeekChange}
          onMouseUp={commitSeek}
          onTouchEnd={commitSeek}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/25 accent-primary"
          aria-label="Seek"
        />

        <div className="flex items-center gap-3 text-white">
          <button
            type="button"
            onClick={togglePlay}
            className="rounded-full p-1.5 transition-colors hover:bg-white/15"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <LuPause className="h-4 w-4" /> : <LuPlay className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={toggleMute}
            className="rounded-full p-1.5 transition-colors hover:bg-white/15"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? <LuVolumeX className="h-4 w-4" /> : <LuVolume2 className="h-4 w-4" />}
          </button>

          <input
            type="range"
            min={0}
            max={100}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="h-1 w-16 cursor-pointer appearance-none rounded-full bg-white/25 accent-primary"
            aria-label="Volume"
          />

          <span className="text-xs tabular-nums text-white/80">
            {formatTime(displayTime)} / {formatTime(duration)}
          </span>

          <div className="flex-1" />

          <button
            type="button"
            onClick={toggleFullscreen}
            className="rounded-full p-1.5 transition-colors hover:bg-white/15"
            aria-label="Fullscreen"
          >
            <LuMaximize className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Fragment>
  );
}