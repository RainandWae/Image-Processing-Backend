const jwt = require('jsonwebtoken');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const {
  generateRefreshToken,
  hashRefreshToken,
} = require('../utils/refreshToken');
const asyncHandler = require('../utils/asyncHandler');
const { env } = require('../config/env');
const { createAuditLog } = require('../services/audit.service');

const buildAuthResponse = async (user, statusCode, req, res, action) => {
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshTokenHash = hashRefreshToken(refreshToken);
  await user.save();

  await createAuditLog({
    actor: user._id,
    action,
    entityType: 'User',
    entityId: user._id,
    req,
  });

  return res.status(statusCode).json({
    user: {
      id: user._id,
      username: user.username,
      role: user.role,
    },
    token,
    refreshToken,
  });
};

const registerUser = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      message: 'Username and password are required',
    });
  }

  const existingUser = await User.findOne({ username });

  if (existingUser) {
    return res.status(400).json({
      message: 'Username already exists',
    });
  }

  const user = await User.create({
    username,
    password,
  });

  return buildAuthResponse(user, 201, req, res, 'USER_REGISTERED');
});

const loginUser = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      message: 'Username and password are required',
    });
  }

  const user = await User.findOne({ username });

  if (!user) {
    return res.status(401).json({
      message: 'Invalid username or password',
    });
  }

  const passwordMatches = await user.matchPassword(password);

  if (!passwordMatches) {
    return res.status(401).json({
      message: 'Invalid username or password',
    });
  }

  return buildAuthResponse(user, 200, req, res, 'USER_LOGGED_IN');
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      message: 'Refresh token is required',
    });
  }

  let decoded;

  try {
    decoded = jwt.verify(refreshToken, env.refreshTokenSecret);
  } catch (error) {
    return res.status(401).json({
      message: 'Invalid or expired refresh token',
    });
  }

  const user = await User.findById(decoded.id);

  if (!user || !user.refreshTokenHash) {
    return res.status(401).json({
      message: 'Invalid or expired refresh token',
    });
  }

  const incomingRefreshTokenHash = hashRefreshToken(refreshToken);

  if (incomingRefreshTokenHash !== user.refreshTokenHash) {
    return res.status(401).json({
      message: 'Invalid or expired refresh token',
    });
  }

  const token = generateToken(user._id);

  await createAuditLog({
    actor: user._id,
    action: 'REFRESH_TOKEN_USED',
    entityType: 'User',
    entityId: user._id,
    req,
  });

  return res.status(200).json({
    token,
  });
});

const logoutUser = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      message: 'Refresh token is required',
    });
  }

  const refreshTokenHash = hashRefreshToken(refreshToken);

  const user = await User.findOneAndUpdate(
    { refreshTokenHash },
    { refreshTokenHash: null },
    { returnDocument: 'after' }
  );

  if (user) {
    await createAuditLog({
      actor: user._id,
      action: 'USER_LOGGED_OUT',
      entityType: 'User',
      entityId: user._id,
      req,
    });
  }

  return res.status(200).json({
    message: 'Logged out successfully',
  });
});

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
};
