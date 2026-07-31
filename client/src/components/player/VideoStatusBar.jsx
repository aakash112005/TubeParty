import { useEffect, useState } from 'react';
import { LuPlay, LuPause } from 'react-icons/lu';
import { useRoom } from '../../context/RoomContext';
import { formatTime } from '../../utils/format';

export function VideoStatusBar() {
  const { currentVideo } = useRoom();
  const [displayTime, setDisplayTime] = useState(currentVideo.currentTime);

  useEffect(() => {
    setDisplayTime(currentVideo.currentTime);
  }, [currentVideo.currentTime]);

  useEffect(() => {
    if (!currentVideo.isPlaying) return;
    const interval = setInterval(() => setDisplayTime((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [currentVideo.isPlaying]);

  if (!currentVideo.videoId) return null;

  return (
    <div className="mt-3 flex items-center gap-2 text-sm text-muted">
      {currentVideo.isPlaying ? (
        <LuPlay className="h-3.5 w-3.5 text-accent" />
      ) : (
        <LuPause className="h-3.5 w-3.5 text-warning" />
      )}
      <span className="font-mono">{formatTime(displayTime)}</span>
      <span>{currentVideo.isPlaying ? 'Playing' : 'Paused'}</span>
    </div>
  );
}
