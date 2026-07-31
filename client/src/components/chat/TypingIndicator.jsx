import { AnimatePresence, motion } from 'framer-motion';

export function TypingIndicator({ typingUsers }) {
  if (typingUsers.length === 0) return <div className="h-5" />;

  const label =
    typingUsers.length === 1
      ? `${typingUsers[0]} is typing…`
      : `${typingUsers.slice(0, 2).join(', ')}${typingUsers.length > 2 ? ' and others' : ''} are typing…`;

  return (
    <AnimatePresence>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="h-5 px-1 text-xs italic text-muted"
      >
        {label}
      </motion.p>
    </AnimatePresence>
  );
}
