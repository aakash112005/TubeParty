import { LuTv, LuMessageCircle, LuUsers } from 'react-icons/lu';
import { cn } from '../../utils/cn';
import { useRoom } from '../../context/RoomContext';

const TABS = [
  { key: 'watch', label: 'Watch', icon: LuTv },
  { key: 'chat', label: 'Chat', icon: LuMessageCircle },
  { key: 'people', label: 'People', icon: LuUsers },
];

export function MobileTabBar({ active, onChange }) {
  const { participants } = useRoom();

  return (
    <nav className="glass fixed inset-x-0 bottom-0 z-30 flex items-center justify-around px-2 py-2 lg:hidden">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={cn(
              'relative flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-xs',
              isActive ? 'text-primary' : 'text-muted'
            )}
          >
            <span className="relative">
              <Icon className="h-5 w-5" />
              {tab.key === 'people' && participants.length > 0 ? (
                <span className="absolute -right-2 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[9px] text-white">
                  {participants.length}
                </span>
              ) : null}
            </span>
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
