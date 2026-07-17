const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { env } = require('../config/env');

const hashRefreshToken = (refreshToken) => {
  return crypto
    .createHash('sha256')
    .update(refreshToken)
    .digest('hex');
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    env.refreshTokenSecret,
    {
      expiresIn: env.refreshTokenExpiresIn,
    }
  );
};

module.exports = {
  hashRefreshToken,
  generateRefreshToken,
};
