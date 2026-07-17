const express = require('express');
const protect = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const validateTransform = require('../middleware/validateTransform.middleware');
const validateObjectId = require('../middleware/validateObjectId.middleware');
const {
  transformRateLimiter,
  uploadRateLimiter,
} = require('../middleware/rateLimit.middleware');
const {
  uploadImage,
  listImages,
  getImageById,
  transformImage,
  deleteImage,
} = require('../controllers/image.controller');

const router = express.Router();

/**
 * @swagger
 * /images:
 *   post:
 *     summary: Upload an image
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Image uploaded successfully
 *       400:
 *         description: Invalid or missing image file
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Too many upload requests
 */
router.post(
  '/images',
  protect,
  uploadRateLimiter,
  upload.single('image'),
  uploadImage
);

/**
 * @swagger
 * /images:
 *   get:
 *     summary: List authenticated user's images
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *     responses:
 *       200:
 *         description: Paginated image list
 *       401:
 *         description: Unauthorized
 */
router.get('/images', protect, listImages);

/**
 * @swagger
 * /images/{id}:
 *   get:
 *     summary: Get one image by ID
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Image metadata returned
 *       400:
 *         description: Invalid image ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Image not found
 */
router.get('/images/:id', protect, validateObjectId('id'), getImageById);

/**
 * @swagger
 * /images/{id}:
 *   delete:
 *     summary: Delete an image
 *     description: Deletes a transformed image by itself. If the image is an original, also deletes its transformed child images.
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Image deleted
 *       400:
 *         description: Invalid image ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Image not found
 */
router.delete('/images/:id', protect, validateObjectId('id'), deleteImage);

/**
 * @swagger
 * /images/{id}/transform:
 *   post:
 *     summary: Transform an image
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transformations:
 *                 type: object
 *                 example:
 *                   resize:
 *                     width: 300
 *                     height: 300
 *                   rotate: 90
 *                   format: webp
 *                   quality: 80
 *                   filters:
 *                     grayscale: true
 *                   watermark:
 *                     text: RainandWae
 *                     position: bottom-right
 *     responses:
 *       200:
 *         description: Cached transformed image returned
 *       201:
 *         description: Transformed image created
 *       400:
 *         description: Invalid transformation request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Image not found
 *       429:
 *         description: Too many transformation requests
 */
router.post(
  '/images/:id/transform',
  protect,
  validateObjectId('id'),
  transformRateLimiter,
  validateTransform,
  transformImage
);

module.exports = router;
