import { useEffect, useRef, useState } from 'react';
import {
  LuPlay,
  LuPause,
  LuVolume2,
  LuVolume1,
  LuVolumeX,
  LuMaximize,
  LuMinimize,
  LuLoader,
  LuSettings,
  LuChevronLeft,
  LuChevronRight,
  LuCheck,
} from 'react-icons/lu';

const POLL_MS = 250;
const AUTO_HIDE_MS = 2500;
const SEEK_STEP_SECONDS = 5;
const VOLUME_STEP = 5;
const SEEK_ACCENT = '#ff0000'; // YouTube red

const QUALITY_LABELS = {
  highres: 'Highest',
  hd2160: '2160p 4K',
  hd1440: '1440p',
  hd1080: '1080p HD',
  hd720: '720p HD',
  large: '480p',
  medium: '360p',
  small: '240p',
  tiny: '144p',
  auto: 'Auto',
};

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

// Closes an open popover on outside click or Escape - shared between
// the volume slider and settings menu instead of duplicating the
// same listener-management logic twice.
function usePopoverDismiss(open, onClose) {
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;

    const handlePointer = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, onClose]);

  return ref;
}

// A small icon button with a hover tooltip, used for every action in
// the bar so sizing/spacing/focus styling stays consistent instead of
// being hand-repeated per button.
function ControlButton({ label, onClick, active, children, className = '' }) {
  return (
    <div className="group/tt relative flex items-center">
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={`rounded-full p-1.5 text-white transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
          active ? 'bg-white/15' : ''
        } ${className}`}
      >
        {children}
      </button>
      <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/90 px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/tt:opacity-100">
        {label}
      </span>
    </div>
  );
}

// Custom play/pause + seek + volume + speed/quality + fullscreen bar.
// Renders on top of the YouTube iframe (which has controls:0) for
// anyone who can control playback, replacing the native control bar
// entirely.
//
// Also covers the video with our own opaque UI whenever it's paused.
// YouTube's native paused-state "more videos" suggestion panel isn't
// affected by controls:0 - it still renders inside the iframe and is
// only ever shown while paused, so covering the iframe during pause
// is the only way to keep it fully out of view (Google has confirmed
// there's no supported parameter to disable it).
export function CustomControls({ playerRef, ready, YT, videoId, onSeek }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedFraction, setBufferedFraction] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(100);
  const [scrubTime, setScrubTime] = useState(null); // non-null while dragging
  const [barVisible, setBarVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [playbackRate, setPlaybackRate] = useState(1);
  const [availableRates, setAvailableRates] = useState([1]);
  const [quality, setQuality] = useState('auto');
  const [availableQualities, setAvailableQualities] = useState(['auto']);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsView, setSettingsView] = useState('main'); // 'main' | 'speed' | 'quality'
  const [volumeOpen, setVolumeOpen] = useState(false);

  const wrapperRef = useRef(null);
  const hideTimeoutRef = useRef(null);
  const anyPopoverOpen = settingsOpen || volumeOpen;

  const settingsRef = usePopoverDismiss(settingsOpen, () => {
    setSettingsOpen(false);
    setSettingsView('main');
  });
  const volumeRef = usePopoverDismiss(volumeOpen, () => setVolumeOpen(false));

  // Poll the player for time/state - the IFrame API has no
  // continuous "timeupdate" event, so this is the standard approach.
  useEffect(() => {
    if (!ready || !YT) return;

    const interval = setInterval(() => {
      const player = playerRef.current;
      if (!player) return;

      const state = player.getPlayerState();
      setIsPlaying(state === YT.PlayerState.PLAYING);
      setIsBuffering(state === YT.PlayerState.BUFFERING);
      setDuration(player.getDuration() || 0);
      if (scrubTime === null) setCurrentTime(player.getCurrentTime() || 0);
      setBufferedFraction(player.getVideoLoadedFraction?.() || 0);
      setIsMuted(player.isMuted());
      setVolume(player.getVolume());
      setPlaybackRate(player.getPlaybackRate?.() || 1);
      setQuality(player.getPlaybackQuality?.() || 'auto');
    }, POLL_MS);

    return () => clearInterval(interval);
  }, [ready, YT, playerRef, scrubTime]);

  // Available speeds/qualities can depend on the specific video, so
  // re-check whenever a new video loads rather than just once.
  useEffect(() => {
    if (!ready) return;
    const player = playerRef.current;
    if (!player) return;

    const rates = player.getAvailablePlaybackRates?.();
    if (rates?.length) setAvailableRates(rates);

    // getAvailableQualityLevels() can be empty for a moment right
    // after loading, so retry briefly. Most modern videos will only
    // ever report ['auto'] - YouTube manages adaptive quality itself
    // and no longer exposes manual levels through this API for most
    // content, regardless of embedding site.
    let attempts = 0;
    let cancelled = false;
    const check = () => {
      if (cancelled) return;
      const levels = player.getAvailableQualityLevels?.() || [];
      if (levels.length) {
        setAvailableQualities([...levels, 'auto'].filter((v, i, arr) => arr.indexOf(v) === i));
      } else if (attempts < 5) {
        attempts += 1;
        setTimeout(check, 400);
      }
    };
    check();
    return () => {
      cancelled = true;
    };
  }, [ready, videoId, playerRef]);

  // Track native fullscreen state so the icon/tooltip stays accurate
  // even if the user exits via Esc instead of our own button.
  useEffect(() => {
    const handleChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  // Auto-hide the bar while playing; always visible while paused or
  // while a popover is open.
  useEffect(() => {
    clearTimeout(hideTimeoutRef.current);
    if (isPlaying && !anyPopoverOpen) {
      hideTimeoutRef.current = setTimeout(() => setBarVisible(false), AUTO_HIDE_MS);
    } else {
      setBarVisible(true);
    }
    return () => clearTimeout(hideTimeoutRef.current);
  }, [isPlaying, currentTime, anyPopoverOpen]);

  const revealBar = () => {
    setBarVisible(true);
    clearTimeout(hideTimeoutRef.current);
    if (isPlaying && !anyPopoverOpen) {
      hideTimeoutRef.current = setTimeout(() => setBarVisible(false), AUTO_HIDE_MS);
    }
  };

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

  const changeVolume = (delta) => {
    const player = playerRef.current;
    if (!player) return;
    const next = Math.min(100, Math.max(0, (isMuted ? 0 : volume) + delta));
    player.setVolume(next);
    setVolume(next);
    if (next > 0 && isMuted) {
      player.unMute();
      setIsMuted(false);
    }
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

  const handleSeekChange = (e) => setScrubTime(Number(e.target.value));

  const commitSeek = (e) => {
    const time = Number(e.target.value);
    playerRef.current?.seekTo(time, true);
    setCurrentTime(time);
    setScrubTime(null);
    onSeek?.(time);
  };

  const seekBy = (delta) => {
    const player = playerRef.current;
    if (!player) return;
    const time = Math.min(duration, Math.max(0, player.getCurrentTime() + delta));
    player.seekTo(time, true);
    setCurrentTime(time);
    onSeek?.(time);
  };

  const toggleFullscreen = () => {
    const el = wrapperRef.current?.closest('[data-player-shell]');
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen?.();
    }
  };

  const selectRate = (rate) => {
    playerRef.current?.setPlaybackRate(rate);
    setPlaybackRate(rate);
    setSettingsOpen(false);
    setSettingsView('main');
  };

  const selectQuality = (level) => {
    playerRef.current?.setPlaybackQuality(level);
    setQuality(level);
    setSettingsOpen(false);
    setSettingsView('main');
  };

  const handleKeyDown = (e) => {
    if (anyPopoverOpen) return; // Escape is handled by usePopoverDismiss

    switch (e.key) {
      case ' ':
      case 'k':
        e.preventDefault();
        togglePlay();
        break;
      case 'ArrowRight':
        e.preventDefault();
        seekBy(SEEK_STEP_SECONDS);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        seekBy(-SEEK_STEP_SECONDS);
        break;
      case 'ArrowUp':
        e.preventDefault();
        changeVolume(VOLUME_STEP);
        break;
      case 'ArrowDown':
        e.preventDefault();
        changeVolume(-VOLUME_STEP);
        break;
      case 'm':
        toggleMute();
        break;
      case 'f':
        toggleFullscreen();
        break;
      default:
        return;
    }
    revealBar();
  };

  if (!ready) return null;

  const displayTime = scrubTime !== null ? scrubTime : currentTime;
  const bufferedPct = duration ? bufferedFraction * 100 : 0;
  const playedPct = duration ? (displayTime / duration) * 100 : 0;
  const thumbnailUrl = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null;
  const effectiveVolume = isMuted ? 0 : volume;
  const VolumeIcon = effectiveVolume === 0 ? LuVolumeX : effectiveVolume < 50 ? LuVolume1 : LuVolume2;

  return (
    <div
      ref={wrapperRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseMove={revealBar}
      className="absolute inset-0 outline-none"
    >
      {/* Paused-state cover: physically hides the iframe (and
          whatever YouTube renders underneath, including the "more
          videos" panel) behind our own UI. Shows the video's own
          thumbnail, blurred, instead of flat black. */}
      {!isPlaying ? (
        <button
          type="button"
          onClick={togglePlay}
          aria-label="Play"
          className="group absolute inset-0 z-[5] flex items-center justify-center overflow-hidden bg-black"
        >
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full scale-110 object-cover opacity-50 blur-xl"
            />
          ) : null}
          <div className="absolute inset-0 bg-black/40" />
          <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white/15 shadow-xl backdrop-blur-sm transition-all duration-150 group-hover:scale-110 group-hover:bg-white/25">
            <LuPlay className="h-7 w-7 translate-x-0.5 text-white" />
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={togglePlay}
          aria-label="Pause"
          className="absolute inset-0 z-[5] cursor-pointer"
        />
      )}

      {/* Buffering spinner - shown mid-playback while YouTube is
          loading data. The video's last frame stays visible; this is
          just a small indicator, not a full cover. */}
      {isBuffering && isPlaying ? (
        <div className="pointer-events-none absolute inset-0 z-[6] flex items-center justify-center">
          <LuLoader className="h-8 w-8 animate-spin text-white/90 drop-shadow" />
        </div>
      ) : null}

      <div
        onMouseEnter={() => clearTimeout(hideTimeoutRef.current)}
        onMouseLeave={revealBar}
        className={`absolute inset-x-0 bottom-0 z-10 flex flex-col gap-1 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-3 pb-2 pt-10 transition-opacity duration-300 ${
          barVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        {/* Seek bar */}
        <div className="group/seek relative flex h-4 w-full cursor-pointer items-center">
          <div className="pointer-events-none absolute inset-x-0 h-1 rounded-full bg-white/20 transition-all duration-100 group-hover/seek:h-1.5" />
          <div
            className="pointer-events-none absolute h-1 rounded-full bg-white/40 transition-all duration-100 group-hover/seek:h-1.5"
            style={{ width: `${bufferedPct}%` }}
          />
          <div
            className="pointer-events-none absolute h-1 rounded-full transition-all duration-100 group-hover/seek:h-1.5"
            style={{ width: `${playedPct}%`, backgroundColor: SEEK_ACCENT }}
          />
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={displayTime}
            onChange={handleSeekChange}
            onMouseUp={commitSeek}
            onTouchEnd={commitSeek}
            aria-label="Seek"
            className="absolute inset-x-0 h-4 w-full cursor-pointer appearance-none bg-transparent focus-visible:outline-none [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:scale-0 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow [&::-moz-range-thumb]:transition-transform [&::-moz-range-track]:bg-transparent [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:scale-0 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:transition-transform group-hover/seek:[&::-moz-range-thumb]:scale-100 group-hover/seek:[&::-webkit-slider-thumb]:scale-100"
          />
        </div>

        <div className="flex items-center gap-1 text-white">
          <ControlButton label={isPlaying ? 'Pause (space)' : 'Play (space)'} onClick={togglePlay}>
            {isPlaying ? <LuPause className="h-4 w-4" /> : <LuPlay className="h-4 w-4" />}
          </ControlButton>

          {/* Volume: icon-only until hovered/tapped, then a slider
              pops out - matches the pattern viewers already expect
              from YouTube itself rather than a slider sitting in the
              bar permanently. */}
          <div
            ref={volumeRef}
            className="flex items-center"
            onMouseEnter={() => setVolumeOpen(true)}
            onMouseLeave={() => setVolumeOpen(false)}
          >
            <ControlButton label={isMuted ? 'Unmute (m)' : 'Mute (m)'} onClick={toggleMute}>
              <VolumeIcon className="h-4 w-4" />
            </ControlButton>
            <div
              className={`overflow-hidden transition-all duration-200 ${
                volumeOpen ? 'ml-1 w-16 opacity-100' : 'w-0 opacity-0'
              }`}
            >
              <input
                type="range"
                min={0}
                max={100}
                value={effectiveVolume}
                onChange={handleVolumeChange}
                aria-label="Volume"
                className="h-1 w-16 cursor-pointer appearance-none rounded-full bg-white/25 accent-white [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-moz-range-thumb]:h-2.5 [&::-moz-range-thumb]:w-2.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white"
              />
            </div>
          </div>

          <span className="ml-1 select-none text-xs tabular-nums text-white/85">
            {formatTime(displayTime)} <span className="text-white/50">/</span> {formatTime(duration)}
          </span>

          <div className="flex-1" />

          <div ref={settingsRef} className="relative flex items-center">
            <ControlButton
              label="Settings"
              active={settingsOpen}
              onClick={() => {
                setSettingsOpen((v) => !v);
                setSettingsView('main');
              }}
            >
              <LuSettings className={`h-4 w-4 transition-transform duration-200 ${settingsOpen ? 'rotate-45' : ''}`} />
            </ControlButton>

            <div
              className={`absolute bottom-full right-0 mb-2 w-56 origin-bottom-right overflow-hidden rounded-xl bg-[#181818]/95 py-1 text-sm text-white shadow-2xl ring-1 ring-white/10 backdrop-blur-sm transition-all duration-150 ${
                settingsOpen ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
              }`}
            >
              {settingsView === 'main' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setSettingsView('speed')}
                    className="flex w-full items-center justify-between px-3 py-2.5 hover:bg-white/10"
                  >
                    <span>Playback speed</span>
                    <span className="flex items-center gap-1 text-white/60">
                      {playbackRate === 1 ? 'Normal' : `${playbackRate}x`}
                      <LuChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettingsView('quality')}
                    className="flex w-full items-center justify-between px-3 py-2.5 hover:bg-white/10"
                  >
                    <span>Quality</span>
                    <span className="flex items-center gap-1 text-white/60">
                      {QUALITY_LABELS[quality] || quality}
                      <LuChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </button>
                </>
              ) : null}

              {settingsView === 'speed' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setSettingsView('main')}
                    className="flex w-full items-center gap-2 border-b border-white/10 px-3 py-2.5 font-medium hover:bg-white/10"
                  >
                    <LuChevronLeft className="h-3.5 w-3.5" />
                    Playback speed
                  </button>
                  <div className="max-h-52 overflow-y-auto">
                    {availableRates.map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => selectRate(rate)}
                        className="flex w-full items-center justify-between px-3 py-2.5 hover:bg-white/10"
                      >
                        <span>{rate === 1 ? 'Normal' : `${rate}x`}</span>
                        {rate === playbackRate ? <LuCheck className="h-3.5 w-3.5" style={{ color: SEEK_ACCENT }} /> : null}
                      </button>
                    ))}
                  </div>
                </>
              ) : null}

              {settingsView === 'quality' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setSettingsView('main')}
                    className="flex w-full items-center gap-2 border-b border-white/10 px-3 py-2.5 font-medium hover:bg-white/10"
                  >
                    <LuChevronLeft className="h-3.5 w-3.5" />
                    Quality
                  </button>
                  <div className="max-h-52 overflow-y-auto">
                    {availableQualities.map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => selectQuality(level)}
                        className="flex w-full items-center justify-between px-3 py-2.5 hover:bg-white/10"
                      >
                        <span>{QUALITY_LABELS[level] || level}</span>
                        {level === quality ? <LuCheck className="h-3.5 w-3.5" style={{ color: SEEK_ACCENT }} /> : null}
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          </div>

          <ControlButton label={isFullscreen ? 'Exit fullscreen (f)' : 'Fullscreen (f)'} onClick={toggleFullscreen}>
            {isFullscreen ? <LuMinimize className="h-4 w-4" /> : <LuMaximize className="h-4 w-4" />}
          </ControlButton>
        </div>
      </div>
    </div>
  );
}