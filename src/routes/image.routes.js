const express = require('express');
const protect = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const { 
    uploadImage,
    listImages,
    getImageById,
    transformImage,
 } = require('../controllers/image.controller');

const validateTransform = require('../middleware/validateTransform.middleware');
const { transformRateLimiter } = require('../middleware/rateLimit.middleware');

const router = express.Router();

router.post('/images', protect, upload.single('image'), uploadImage);
router.get('/images', protect, listImages);
router.get('/images/:id', protect, getImageById);
router.post(
  '/images/:id/transform',
  protect,
  transformRateLimiter,
  validateTransform,
  
  transformImage
);

module.exports = router;
