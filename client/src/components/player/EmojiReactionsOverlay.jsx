import { AnimatePresence, motion } from 'framer-motion';
import { useRoom } from '../../context/RoomContext';

export function EmojiReactionsOverlay() {
  const { reactions } = useRoom();

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <AnimatePresence>
        {reactions.map((reaction, i) => (
          <motion.div
            key={reaction.id}
            initial={{ opacity: 0, y: 0, x: 0, scale: 0.5 }}
            animate={{ opacity: [0, 1, 1, 0], y: -140, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3, ease: 'easeOut' }}
            className="absolute bottom-10 text-3xl drop-shadow-lg"
            style={{ left: `${15 + ((i * 17) % 70)}%` }}
          >
            {reaction.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
