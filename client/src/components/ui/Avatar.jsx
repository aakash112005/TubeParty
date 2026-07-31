import { getInitials } from '../../utils/format';
import { cn } from '../../utils/cn';

const SIZES = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-12 w-12 text-base',
};

export function Avatar({ username, color = '#7C6CFF', size = 'md', online, className }) {
  return (
    <div className={cn('relative shrink-0', className)}>
      <div
        className={cn(
          'flex items-center justify-center rounded-full font-display font-semibold text-white shadow-sm',
          SIZES[size]
        )}
        style={{ backgroundColor: color }}
      >
        {getInitials(username) || '?'}
      </div>
      {online !== undefined ? (
        <span
          className={cn(
            'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface',
            online ? 'bg-accent' : 'bg-muted'
          )}
        />
      ) : null}
    </div>
  );
}
