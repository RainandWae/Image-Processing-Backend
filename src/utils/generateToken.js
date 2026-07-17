const jwt = require('jsonwebtoken');
const { env } = require('../config/env');


// create JWT contaning user's MongoDB ID
// Uses .env secret 

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn,
    }
  );
};

module.exports = generateToken;
