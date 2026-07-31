import { motion } from 'framer-motion';

// Three soft, slow-drifting gradient orbs behind the hero. Cheap to
// render (just blurred divs) and reads as "premium SaaS" without
// needing a canvas/particle library.
export function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-primary/25 blur-[100px]"
        animate={{ y: [0, 30, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-accent/20 blur-[120px]"
        animate={{ y: [0, -40, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-primary/15 blur-[110px]"
        animate={{ y: [0, 20, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgb(var(--color-ink)) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--color-ink)) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
    </div>
  );
}
