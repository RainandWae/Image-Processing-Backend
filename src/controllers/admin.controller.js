const User = require('../models/User');
const Image = require('../models/Image');
const Job = require('../models/Job');
const asyncHandler = require('../utils/asyncHandler');

const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find()
    .select('-password -refreshTokenHash')
    .sort({ createdAt: -1 });

  res.status(200).json({
    count: users.length,
    users,
  });
});

const listAllImages = asyncHandler(async (req, res) => {
  const images = await Image.find()
    .populate('user', 'username role')
    .sort({ createdAt: -1 });

  res.status(200).json({
    count: images.length,
    images,
  });
});

const listAllJobs = asyncHandler(async (req, res) => {
  const jobs = await Job.find()
    .populate('user', 'username role')
    .populate('image')
    .populate('resultImage')
    .sort({ createdAt: -1 });

  res.status(200).json({
    count: jobs.length,
    jobs,
  });
});

module.exports = {
  listUsers,
  listAllImages,
  listAllJobs,
};