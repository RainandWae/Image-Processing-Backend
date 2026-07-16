const path = require('path');
const sharp = require('sharp');
const Image = require('../models/Image');
const {
    applyTransformation,
    buildTransformedFilename,
} = require('../services/image.service');


const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'Image file is required',
      });
    }

    const metadata = await sharp(req.file.path).metadata();

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
  } catch (error) {
    return res.status(500).json({
      message: 'Server error during image upload',
      error: error.message,
    });
  }
};

const listImages = async (req, res) => {
  try {
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
  } catch (error) {
    return res.status(500).json({
      message: 'Server error while listing images',
      error: error.message,
    });
  }
};

const getImageById = async (req, res) => {
  try {
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
  } catch (error) {
    return res.status(500).json({
      message: 'Server error while retrieving image',
      error: error.message,
    });
  }
};

const transformImage = async (req, res) => {
  try {
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

    const outputFormat = transformations.format || originalImage.format || 'jpeg';
    const transformedFilename = buildTransformedFilename(
      originalImage.filename,
      outputFormat
    );

    const outputPath = path.join(
      'uploads',
      'transformed',
      transformedFilename
    );

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
    });

    return res.status(201).json({
      id: transformedImage._id,
      originalImage: originalImage._id,
      url: transformedImage.url,
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
  } catch (error) {
    return res.status(500).json({
      message: 'Server error during image transformation',
      error: error.message,
    });
  }
};

module.exports = {
  uploadImage,
  listImages,
  getImageById,
  transformImage,
};