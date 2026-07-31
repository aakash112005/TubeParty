import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';

export function ErrorPage({ icon, title, description, actionLabel = 'Back to home', onAction }) {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-surface text-4xl text-muted"
      >
        {icon}
      </motion.div>
      <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">{description}</p>
      <Button className="mt-8" onClick={onAction || (() => navigate('/'))}>
        {actionLabel}
      </Button>
    </div>
  );
}
