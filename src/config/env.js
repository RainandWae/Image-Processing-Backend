require('dotenv').config();

const requiredEnvVars = [
  'MONGO_URI',
  'JWT_SECRET',
];

const numberFromEnv = (key, fallback) => {
  const value = Number(process.env[key]);

  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const env = {
  get nodeEnv() {
    return process.env.NODE_ENV || 'development';
  },

  get isTest() {
    return this.nodeEnv === 'test';
  },

  get isProduction() {
    return this.nodeEnv === 'production';
  },

  get port() {
    return numberFromEnv('PORT', 5000);
  },

  get mongoUri() {
    return process.env.MONGO_URI;
  },

  get jwtSecret() {
    return process.env.JWT_SECRET;
  },

  get jwtExpiresIn() {
    return process.env.JWT_EXPIRES_IN || '7d';
  },

  get baseUrl() {
    return process.env.BASE_URL || `http://localhost:${this.port}`;
  },

  get uploadMaxFileSizeBytes() {
    return numberFromEnv('UPLOAD_MAX_FILE_SIZE_BYTES', 5 * 1024 * 1024);
  },

  get uploadRateLimitWindowMs() {
    return numberFromEnv('UPLOAD_RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000);
  },

  get uploadRateLimitMax() {
    return numberFromEnv('UPLOAD_RATE_LIMIT_MAX', 20);
  },

  get transformRateLimitWindowMs() {
    return numberFromEnv('TRANSFORM_RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000);
  },

  get transformRateLimitMax() {
    return numberFromEnv('TRANSFORM_RATE_LIMIT_MAX', 10);
  },
};

const validateEnv = () => {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

module.exports = {
  env,
  validateEnv,
};
