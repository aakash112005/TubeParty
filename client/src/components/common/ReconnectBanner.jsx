import { AnimatePresence, motion } from 'framer-motion';
import { LuWifiOff } from 'react-icons/lu';
import { CONNECTION_STATUS } from '../../context/SocketContext';

export function ReconnectBanner({ status }) {
  const visible = status === CONNECTION_STATUS.DISCONNECTED || status === CONNECTION_STATUS.RECONNECTING;

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="flex items-center justify-center gap-2 bg-warning/10 px-4 py-2 text-sm text-warning">
            <LuWifiOff className="h-4 w-4" />
            {status === CONNECTION_STATUS.RECONNECTING
              ? 'Connection lost - trying to reconnect…'
              : 'You are offline. Attempting to reconnect…'}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
