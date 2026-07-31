import { cn } from '../../utils/cn';

export function Skeleton({ className }) {
  return <div className={cn('skeleton', className)} />;
}

export function ParticipantSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <Skeleton className="h-9 w-9 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-2.5 w-16" />
      </div>
    </div>
  );
}

export function PlayerSkeleton() {
  return <Skeleton className="aspect-video w-full rounded-2xl" />;
}

export function MessageSkeleton() {
  return (
    <div className="flex items-start gap-2.5 px-3 py-2">
      <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-2.5 w-16" />
        <Skeleton className="h-8 w-4/5 rounded-xl" />
      </div>
    </div>
  );
}
