const path = require('path');
const Image = require('../models/Image');
const Job = require('../models/Job');
const {
  applyTransformations,
  buildTransformedFilename,
} = require('./image.service');
const stableStringify = require('../utils/stableStringify');

const processTransformJob = async (jobId) => {
  const job = await Job.findById(jobId);

  if (!job || job.status !== 'pending') {
    return;
  }

  job.status = 'processing';
  job.startedAt = new Date();
  await job.save();

  try {
    const originalImage = await Image.findOne({
      _id: job.image,
      user: job.user,
    });

    if (!originalImage) {
      throw new Error('Original image not found');
    }

    const transformationKey = stableStringify(job.transformations);

    const cachedImage = await Image.findOne({
      user: job.user,
      parentImage: originalImage._id,
      transformationKey,
    });

    if (cachedImage) {
      job.status = 'completed';
      job.resultImage = cachedImage._id;
      job.completedAt = new Date();
      await job.save();
      return;
    }

    const outputFormat =
      job.transformations.format || originalImage.format || 'jpeg';

    const transformedFilename = buildTransformedFilename(
      originalImage.filename,
      outputFormat
    );

    const outputPath = path.join('uploads', 'transformed', transformedFilename);

    const metadata = await applyTransformations(
      originalImage.path,
      outputPath,
      job.transformations
    );

    const transformedImage = await Image.create({
      user: job.user,
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
      transformations: job.transformations,
      transformationKey,
    });

    job.status = 'completed';
    job.resultImage = transformedImage._id;
    job.completedAt = new Date();
    await job.save();
  } catch (error) {
    await Job.findByIdAndUpdate(jobId, {
      status: 'failed',
      error: error.message,
      completedAt: new Date(),
    });
  }
};

const enqueueTransformJob = (jobId) => {
  setImmediate(() => {
    processTransformJob(jobId).catch((error) => {
      console.error(`Job processing failed: ${error.message}`);
    });
  });
};

module.exports = {
  enqueueTransformJob,
  processTransformJob,
};
