import { LuActivity, LuLogIn, LuLogOut, LuVideo, LuCrown, LuUserCog, LuUserX } from 'react-icons/lu';
import { useRoom } from '../../context/RoomContext';
import { formatRelativeTime } from '../../utils/format';
import { EmptyState } from '../ui/EmptyState';

const ICONS = {
  user_joined: { icon: LuLogIn, className: 'text-accent' },
  user_left: { icon: LuLogOut, className: 'text-muted' },
  video_changed: { icon: LuVideo, className: 'text-primary' },
  host_changed: { icon: LuCrown, className: 'text-amber-400' },
  role_updated: { icon: LuUserCog, className: 'text-primary' },
  participant_removed: { icon: LuUserX, className: 'text-danger' },
};

export function ActivityFeed() {
  const { activityLog } = useRoom();

  return (
    <div className="glass-card p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
        <LuActivity className="h-4 w-4 text-muted" />
        Activity
      </div>

      {activityLog.length === 0 ? (
        <EmptyState icon={<LuActivity />} title="Nothing yet" description="Room activity will show up here." className="py-6" />
      ) : (
        <ul className="max-h-48 space-y-2.5 overflow-y-auto pr-1">
          {activityLog
            .slice()
            .reverse()
            .map((activity, i) => {
              const meta = ICONS[activity.type] || ICONS.user_joined;
              const Icon = meta.icon;
              return (
                <li key={`${activity.timestamp}-${i}`} className="flex items-start gap-2.5 text-xs">
                  <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${meta.className}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-ink/90">{activity.message}</p>
                    <p className="text-muted">{formatRelativeTime(activity.timestamp)}</p>
                  </div>
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
}
