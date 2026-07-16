const path = require('path');
const sharp = require('sharp');

const applyTransformations = async (inputPath, outputPath, transformations) => {
  let pipeline = sharp(inputPath);

  if (transformations.resize) {
    pipeline = pipeline.resize({
      width: transformations.resize.width,
      height: transformations.resize.height,
      fit: 'cover',
    });
  }

  if (typeof transformations.rotate === 'number') {
    pipeline = pipeline.rotate(transformations.rotate);
  }

  if (transformations.flip === true) {
    pipeline = pipeline.flip();
  }

  if (transformations.mirror === true) {
    pipeline = pipeline.flop();
  }

  if (transformations.filters?.grayscale === true) {
    pipeline = pipeline.grayscale();
  }

  if (transformations.filters?.sepia === true) {
    pipeline = pipeline.recomb([
      [0.393, 0.769, 0.189],
      [0.349, 0.686, 0.168],
      [0.272, 0.534, 0.131],
    ]);
  }

  if (transformations.format) {
    pipeline = pipeline.toFormat(transformations.format);
  }

  await pipeline.toFile(outputPath);

  const metadata = await sharp(outputPath).metadata();

  return metadata;
};

const buildTransformedFilename = (originalFilename, format) => {
  const parsed = path.parse(originalFilename);
  const outputFormat = format || parsed.ext.replace('.', '') || 'jpg';

  return `${parsed.name}-${Date.now()}.${outputFormat}`;
};

module.exports = {
  applyTransformations,
  buildTransformedFilename,
};