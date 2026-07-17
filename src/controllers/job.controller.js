const Image = require('../models/Image');
const Job = require('../models/Job');
const asyncHandler = require('../utils/asyncHandler');
const { enqueueTransformJob } = require('../services/job.service');
const { createAuditLog } = require('../services/audit.service');

const createTransformJob = asyncHandler(async (req, res) => {
  const { transformations } = req.body;

  if (!transformations || Object.keys(transformations).length === 0) {
    return res.status(400).json({
      message: 'At least one transformation is required',
    });
  }

  const image = await Image.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!image) {
    return res.status(404).json({
      message: 'Image not found',
    });
  }

  const job = await Job.create({
    user: req.user._id,
    image: image._id,
    type: 'transform',
    status: 'pending',
    transformations,
  });

  await createAuditLog({
    actor: req.user._id,
    action: 'TRANSFORM_JOB_CREATED',
    entityType: 'Job',
    entityId: job._id,
    metadata: {
      image: image._id,
      transformations,
    },
    req,
  });

  enqueueTransformJob(job._id);

  return res.status(202).json({
    id: job._id,
    type: job.type,
    status: job.status,
    image: job.image,
    transformations: job.transformations,
  });
});

const getJobById = asyncHandler(async (req, res) => {
  const job = await Job.findOne({
    _id: req.params.id,
    user: req.user._id,
  }).populate('resultImage');

  if (!job) {
    return res.status(404).json({
      message: 'Job not found',
    });
  }

  return res.status(200).json({
    job,
  });
});

module.exports = {
  createTransformJob,
  getJobById,
};
