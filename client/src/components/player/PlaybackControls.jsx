import { useState } from 'react';
import { LuLink, LuX } from 'react-icons/lu';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useRoom } from '../../context/RoomContext';
import { extractYouTubeId } from '../../utils/youtube';
import { useLocalStorage } from '../../hooks/useLocalStorage';

const RECENT_VIDEOS_KEY = 'synctube:recent-videos';
const MAX_RECENT_VIDEOS = 4;

export function PlaybackControls() {
  const { canControlPlayback, actions } = useRoom();
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [recentVideos, setRecentVideos] = useLocalStorage(RECENT_VIDEOS_KEY, []);

  if (!canControlPlayback) return null;

  const loadVideo = (value) => {
    if (!extractYouTubeId(value)) {
      return setError('That does not look like a valid YouTube URL or video ID.');
    }
    setError('');
    actions.changeVideo(value);
    setRecentVideos((prev) => [value, ...prev.filter((v) => v !== value)].slice(0, MAX_RECENT_VIDEOS));
    setInput('');
  };

  return (
    <div className="glass-card mt-3 p-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          loadVideo(input);
        }}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <div className="flex-1">
          <Input
            id="video-url"
            icon={<LuLink className="h-4 w-4" />}
            placeholder="Paste a YouTube URL or video ID"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            error={error}
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="md">
            Load
          </Button>
          {input ? (
            <Button type="button" variant="ghost" size="icon" onClick={() => setInput('')} aria-label="Clear">
              <LuX className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </form>

      {recentVideos.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {recentVideos.map((video) => (
            <button
              key={video}
              onClick={() => loadVideo(video)}
              className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted transition-colors hover:border-primary/40 hover:text-ink"
            >
              {extractYouTubeId(video)}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
