// Minimal dependency-free logger. Timestamps + tagged levels are
// enough for a project this size - pulling in winston/pino would be
// overkill and harder to explain in an interview.
const isDev = process.env.NODE_ENV !== 'production';

function timestamp() {
  return new Date().toISOString();
}

export const logger = {
  info: (...args) => console.log(`[INFO ${timestamp()}]`, ...args),
  warn: (...args) => console.warn(`[WARN ${timestamp()}]`, ...args),
  error: (...args) => console.error(`[ERROR ${timestamp()}]`, ...args),
  debug: (...args) => {
    if (isDev) console.log(`[DEBUG ${timestamp()}]`, ...args);
  },
};
