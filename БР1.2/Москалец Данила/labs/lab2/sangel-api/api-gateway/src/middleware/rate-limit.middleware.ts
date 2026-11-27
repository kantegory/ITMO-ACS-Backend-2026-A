import rateLimit from 'express-rate-limit';
import { settings } from '../config/settings';

export const rateLimiter = rateLimit({
  windowMs: settings.rateLimit.windowMs,
  max: settings.rateLimit.max,
  message: { error: { code: 429, message: 'Too many requests, please try again later.' } },
  standardHeaders: true,
  legacyHeaders: false,
});