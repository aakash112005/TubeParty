import { cn } from '../../utils/cn';

export function EmptyState({ icon, title, description, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 px-6 py-10 text-center', className)}>
      {icon ? <div className="mb-1 text-3xl text-muted">{icon}</div> : null}
      <p className="font-display text-sm font-semibold text-ink">{title}</p>
      {description ? <p className="max-w-[220px] text-xs text-muted">{description}</p> : null}
    </div>
  );
}
