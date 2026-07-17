const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const Image = require('../models/Image');
const {
  applyTransformations,
  buildTransformedFilename,
} = require('../services/image.service');
const stableStringify = require('../utils/stableStringify');
const asyncHandler = require('../utils/asyncHandler');

const deleteFileIfExists = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      message: 'Image file is required',
    });
  }

  let metadata;

  try {
    metadata = await sharp(req.file.path).metadata();
  } catch (error) {
    deleteFileIfExists(req.file.path);

    return res.status(400).json({
      message: 'Uploaded file is not a valid image',
    });
  }

  const image = await Image.create({
    user: req.user._id,
    originalName: req.file.originalname,
    filename: req.file.filename,
    path: req.file.path,
    url: `${process.env.BASE_URL}/uploads/originals/${req.file.filename}`,
    mimeType: req.file.mimetype,
    size: req.file.size,
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
  });

  return res.status(201).json({
    id: image._id,
    url: image.url,
    metadata: {
      originalName: image.originalName,
      filename: image.filename,
      mimeType: image.mimeType,
      size: image.size,
      width: image.width,
      height: image.height,
      format: image.format,
    },
  });
});

const listImages = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const total = await Image.countDocuments({
    user: req.user._id,
  });

  const images = await Image.find({
    user: req.user._id,
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return res.status(200).json({
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    images,
  });
});

const getImageById = asyncHandler(async (req, res) => {
  const image = await Image.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!image) {
    return res.status(404).json({
      message: 'Image not found',
    });
  }

  return res.status(200).json({
    image,
  });
});

const transformImage = asyncHandler(async (req, res) => {
  const { transformations } = req.body;

  if (!transformations || Object.keys(transformations).length === 0) {
    return res.status(400).json({
      message: 'At least one transformation is required',
    });
  }

  const originalImage = await Image.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!originalImage) {
    return res.status(404).json({
      message: 'Image not found',
    });
  }

  const transformationKey = stableStringify(transformations);

  const cachedImage = await Image.findOne({
    user: req.user._id,
    parentImage: originalImage._id,
    transformationKey,
  });

  if (cachedImage) {
    return res.status(200).json({
      id: cachedImage._id,
      originalImage: originalImage._id,
      url: cachedImage.url,
      cached: true,
      metadata: {
        filename: cachedImage.filename,
        mimeType: cachedImage.mimeType,
        size: cachedImage.size,
        width: cachedImage.width,
        height: cachedImage.height,
        format: cachedImage.format,
      },
      transformations: cachedImage.transformations,
    });
  }

  const outputFormat = transformations.format || originalImage.format || 'jpeg';
  const transformedFilename = buildTransformedFilename(
    originalImage.filename,
    outputFormat
  );

  const outputPath = path.join('uploads', 'transformed', transformedFilename);

  const metadata = await applyTransformations(
    originalImage.path,
    outputPath,
    transformations
  );

  const transformedImage = await Image.create({
    user: req.user._id,
    originalName: originalImage.originalName,
    filename: transformedFilename,
    path: outputPath,
    url: `${process.env.BASE_URL}/uploads/transformed/${transformedFilename}`,
    mimeType: `image/${metadata.format}`,
    size: metadata.size || 0,
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    isTransformed: true,
    parentImage: originalImage._id,
    transformations,
    transformationKey,
  });

  return res.status(201).json({
    id: transformedImage._id,
    originalImage: originalImage._id,
    url: transformedImage.url,
    cached: false,
    metadata: {
      filename: transformedImage.filename,
      mimeType: transformedImage.mimeType,
      size: transformedImage.size,
      width: transformedImage.width,
      height: transformedImage.height,
      format: transformedImage.format,
    },
    transformations: transformedImage.transformations,
  });
});

const deleteImage = asyncHandler(async (req, res) => {
  const image = await Image.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!image) {
    return res.status(404).json({
      message: 'Image not found',
    });
  }

  const imagesToDelete = image.isTransformed
    ? [image]
    : await Image.find({
        user: req.user._id,
        $or: [
          { _id: image._id },
          { parentImage: image._id },
        ],
      });

  imagesToDelete.forEach((imageToDelete) => {
    deleteFileIfExists(imageToDelete.path);
  });

  await Image.deleteMany({
    _id: {
      $in: imagesToDelete.map((imageToDelete) => imageToDelete._id),
    },
  });

  return res.status(200).json({
    message: image.isTransformed
      ? 'Image deleted successfully'
      : 'Original image and transformed children deleted successfully',
    id: image._id,
    deletedCount: imagesToDelete.length,
  });
});

module.exports = {
  uploadImage,
  listImages,
  getImageById,
  transformImage,
  deleteImage,
};
