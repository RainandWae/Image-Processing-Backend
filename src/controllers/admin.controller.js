const User = require('../models/User');
const Image = require('../models/Image');
const Job = require('../models/Job');
const AuditLog = require('../models/AuditLog');
const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');
const { createAuditLog } = require('../services/audit.service');

const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find()
    .select('-password -refreshTokenHash')
    .sort({ createdAt: -1 });

  await createAuditLog({
    actor: req.user._id,
    action: 'ADMIN_VIEWED_USERS',
    entityType: 'User',
    metadata: {
      count: users.length,
    },
    req,
  });

  res.status(200).json({
    count: users.length,
    users,
  });
});

const listAllImages = asyncHandler(async (req, res) => {
  const images = await Image.find()
    .populate('user', 'username role')
    .sort({ createdAt: -1 });

  await createAuditLog({
    actor: req.user._id,
    action: 'ADMIN_VIEWED_IMAGES',
    entityType: 'Image',
    metadata: {
      count: images.length,
    },
    req,
  });

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

  await createAuditLog({
    actor: req.user._id,
    action: 'ADMIN_VIEWED_JOBS',
    entityType: 'Job',
    metadata: {
      count: jobs.length,
    },
    req,
  });

  res.status(200).json({
    count: jobs.length,
    jobs,
  });
});

const listAuditLogs = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const filter = {};

  if (req.query.actor) {
    if (!mongoose.Types.ObjectId.isValid(req.query.actor)) {
      return res.status(400).json({
        message: 'Invalid actor id',
      });
    }

    filter.actor = req.query.actor;
  }

  if (req.query.action) {
    filter.action = req.query.action;
  }

  if (req.query.entityType) {
    filter.entityType = req.query.entityType;
  }

  if (req.query.entityId) {
    if (!mongoose.Types.ObjectId.isValid(req.query.entityId)) {
      return res.status(400).json({
        message: 'Invalid entity id',
      });
    }

    filter.entityId = req.query.entityId;
  }

  const total = await AuditLog.countDocuments(filter);

  const auditLogs = await AuditLog.find(filter)
    .populate('actor', 'username role')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  await createAuditLog({
    actor: req.user._id,
    action: 'ADMIN_VIEWED_AUDIT_LOGS',
    entityType: 'AuditLog',
    metadata: {
      filter,
      page,
      limit,
      total,
    },
    req,
  });

  res.status(200).json({
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    auditLogs,
  });
});

module.exports = {
  listUsers,
  listAllImages,
  listAllJobs,
  listAuditLogs,
};
