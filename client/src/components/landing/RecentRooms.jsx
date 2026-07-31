import { LuHistory, LuTrash2, LuArrowRight } from 'react-icons/lu';
import { formatRelativeTime } from '../../utils/format';

export function RecentRooms({ rooms, onRejoin, onClear }) {
  if (rooms.length === 0) return null;

  return (
    <div className="glass-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-muted">
          <LuHistory className="h-4 w-4" />
          Recent rooms
        </div>
        <button
          onClick={onClear}
          className="flex items-center gap-1 text-xs text-muted transition-colors hover:text-danger"
        >
          <LuTrash2 className="h-3.5 w-3.5" />
          Clear
        </button>
      </div>
      <div className="space-y-1.5">
        {rooms.map((room) => (
          <button
            key={room.code}
            onClick={() => onRejoin(room.code)}
            className="group flex w-full items-center justify-between rounded-xl border border-border bg-surface px-3.5 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-surface-hover"
          >
            <div>
              <p className="font-mono text-sm font-semibold tracking-wider text-ink">{room.code}</p>
              <p className="text-xs text-muted">{formatRelativeTime(room.joinedAt)}</p>
            </div>
            <LuArrowRight className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
          </button>
        ))}
      </div>
    </div>
  );
}
