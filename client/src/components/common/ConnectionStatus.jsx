import { cn } from '../../utils/cn';
import { CONNECTION_STATUS } from '../../context/SocketContext';

const STATUS_META = {
  [CONNECTION_STATUS.CONNECTED]: { label: 'Connected', dot: 'bg-accent', pulse: false },
  [CONNECTION_STATUS.CONNECTING]: { label: 'Connecting…', dot: 'bg-warning', pulse: true },
  [CONNECTION_STATUS.RECONNECTING]: { label: 'Reconnecting…', dot: 'bg-warning', pulse: true },
  [CONNECTION_STATUS.DISCONNECTED]: { label: 'Disconnected', dot: 'bg-danger', pulse: true },
};

export function ConnectionStatus({ status, className }) {
  const meta = STATUS_META[status] ?? STATUS_META[CONNECTION_STATUS.CONNECTING];

  return (
    <div className={cn('flex items-center gap-2 text-xs text-muted', className)}>
      <span className={cn('h-2 w-2 rounded-full', meta.dot, meta.pulse && 'animate-pulse-dot')} />
      {meta.label}
    </div>
  );
}
