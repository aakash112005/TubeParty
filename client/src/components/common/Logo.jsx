import { cn } from '../../utils/cn';

export function Logo({ className, showWordmark = true }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
        <div className="h-3 w-3 rounded-full bg-bg" />
        <div className="absolute h-1.5 w-1.5 rounded-full bg-white animate-pulse-dot" />
      </div>
      {showWordmark ? (
        <span className="font-display text-lg font-semibold tracking-tight text-ink">
          Tube<span className="text-primary">Party</span>
        </span>
      ) : null}
    </div>
  );
}
