import rateLimit from 'express-rate-limit';

const rateLimitMessage = {
  success: false,
  error: {
    code: 'RATE_LIMIT',
    message: 'Too many requests. Please try again later.',
  },
};

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: rateLimitMessage,
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: rateLimitMessage,
  standardHeaders: true,
  legacyHeaders: false,
});

export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: rateLimitMessage,
  standardHeaders: true,
  legacyHeaders: false,
});

export const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: rateLimitMessage,
  standardHeaders: true,
  legacyHeaders: false,
});
