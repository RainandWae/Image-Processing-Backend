const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const asyncHandler = require('../utils/asyncHandler');

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

  const token = generateToken(user._id);

  return res.status(201).json({
    user: {
      id: user._id,
      username: user.username,
    },
    token,
  });
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

  const token = generateToken(user._id);

  return res.status(200).json({
    user: {
      id: user._id,
      username: user.username,
    },
    token,
  });
});

module.exports = {
  registerUser,
  loginUser,
};
