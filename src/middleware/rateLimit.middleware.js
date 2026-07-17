const rateLimit = require('express-rate-limit');
const { env } = require('../config/env');

const transformRateLimiter = rateLimit({
  windowMs: env.transformRateLimitWindowMs,
  max: env.transformRateLimitMax,
  skip: () => env.isTest,
  message: {
    message: 'Too many transformation requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadRateLimiter = rateLimit({
  windowMs: env.uploadRateLimitWindowMs,
  max: env.uploadRateLimitMax,
  skip: () => env.isTest,
  message: {
    message: 'Too many upload requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  transformRateLimiter,
  uploadRateLimiter,
};
