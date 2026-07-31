import { useState } from 'react';
import { LuPlus, LuX, LuPlay, LuListVideo } from 'react-icons/lu';
//import { extractYouTubeId } from '../../utils/youtube';
import { extractYouTubeId } from '../../utils/youtube';
// variant="panel"   -> full manager: add form + removable list (rendered below the player)
// variant="overlay" -> compact horizontal thumbnail strip (rendered inside the paused/ended overlay)
export function UpNextQueue({ queue, onAdd, onRemove, onPlay, variant = 'panel' }) {
  const [input, setInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async (e) => {
    e.preventDefault(); 
    if (!input.trim()) return;
    if (!extractYouTubeId(input)) {
      setError('Could not read a video ID from that link.');
      return;
    }
    setError('');
    setAdding(true);
    const ok = await onAdd(input);
    setAdding(false);
    if (ok) setInput('');
  };

  if (variant === 'overlay') {
    if (queue.length === 0) return null;
    return (
      <div className="flex gap-2 overflow-x-auto px-1 pb-1">
        {queue.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPlay(item);
            }}
            className="group relative w-28 shrink-0 overflow-hidden rounded-lg border border-white/20"
          >
            <img src={item.thumbnail} alt={item.title} className="h-16 w-28 object-cover" />
            <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
              <LuPlay className="h-5 w-5 text-white" />
            </span>
            <span className="absolute inset-x-0 bottom-0 truncate bg-black/70 px-1 py-0.5 text-[10px] text-white">
              {item.title}
            </span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-2xl border border-border bg-surface p-3">
      <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-ink">
        <LuListVideo className="h-4 w-4" />
        Up next
      </div>

      <form onSubmit={handleAdd} className="mb-2 flex gap-2">
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (error) setError('');
          }}
          placeholder="Paste a YouTube URL or video ID to queue"
          className="flex-1 rounded-lg border border-border bg-black/20 px-3 py-1.5 text-xs text-ink placeholder:text-muted"
        />
        <button
          type="submit"
          disabled={adding}
          className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-ink hover:bg-white/20 disabled:opacity-50"
        >
          <LuPlus className="h-3.5 w-3.5" />
          {adding ? 'Adding…' : 'Add'}
        </button>
      </form>
      {error ? <p className="mb-2 text-xs text-red-400">{error}</p> : null}

      {queue.length === 0 ? (
        <p className="text-xs text-muted">Nothing queued yet. Add a video to line it up next.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {queue.map((item) => (
            <li key={item.id} className="flex items-center gap-2 rounded-lg bg-black/10 p-1.5">
              <img src={item.thumbnail} alt={item.title} className="h-9 w-16 shrink-0 rounded object-cover" />
              <span className="flex-1 truncate text-xs text-ink">{item.title}</span>
              <button
                type="button"
                onClick={() => onPlay(item)}
                title="Play now"
                className="rounded-full p-1.5 text-ink hover:bg-white/10"
              >
                <LuPlay className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                title="Remove"
                className="rounded-full p-1.5 text-muted hover:bg-white/10 hover:text-ink"
              >
                <LuX className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}



