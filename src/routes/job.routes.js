const express = require('express');
const protect = require('../middleware/auth.middleware');
const validateTransform = require('../middleware/validateTransform.middleware');
const validateObjectId = require('../middleware/validateObjectId.middleware');
const { transformRateLimiter } = require('../middleware/rateLimit.middleware');
const {
  createTransformJob,
  getJobById,
} = require('../controllers/job.controller');

const router = express.Router();

router.post(
  '/images/:id/jobs',
  protect,
  validateObjectId('id'),
  transformRateLimiter,
  validateTransform,
  createTransformJob
);

router.get(
  '/jobs/:id',
  protect,
  validateObjectId('id'),
  getJobById
);

module.exports = router;