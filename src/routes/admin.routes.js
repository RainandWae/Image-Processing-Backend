const express = require('express');
const protect = require('../middleware/auth.middleware');
const authorize = require('../middleware/authorize.middleware');
const {
  listUsers,
  listAllImages,
  listAllJobs,
} = require('../controllers/admin.controller');

const router = express.Router();

router.get('/admin/users', protect, authorize('admin'), listUsers);

router.get('/admin/images', protect, authorize('admin'), listAllImages);

router.get('/admin/jobs', protect, authorize('admin'), listAllJobs);

module.exports = router;
