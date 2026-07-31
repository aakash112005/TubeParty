import rateLimit from 'express-rate-limit';

// Applies to the REST API only (room creation / lookup). Socket
// events aren't rate-limited here to keep the project simple - in a
// real production app you'd add per-socket throttling too, but for
// an interview-scale app this covers the realistic abuse vector
// (someone scripting room creation).
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down.' },
});
