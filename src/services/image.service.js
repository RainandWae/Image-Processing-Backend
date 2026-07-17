const path = require('path');
const sharp = require('sharp');

const escapeSvgText = (text) => {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
};

const getWatermarkPosition = (
  position,
  imageWidth,
  imageHeight,
  watermarkWidth,
  watermarkHeight
) => {
  const padding = 24;

  const positions = {
    'top-left': {
      left: padding,
      top: padding,
    },
    'top-right': {
      left: imageWidth - watermarkWidth - padding,
      top: padding,
    },
    'bottom-left': {
      left: padding,
      top: imageHeight - watermarkHeight - padding,
    },
    'bottom-right': {
      left: imageWidth - watermarkWidth - padding,
      top: imageHeight - watermarkHeight - padding,
    },
    center: {
      left: Math.round((imageWidth - watermarkWidth) / 2),
      top: Math.round((imageHeight - watermarkHeight) / 2),
    },
  };

  return positions[position] || positions['bottom-right'];
};

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

  if (transformations.watermark) {
    const metadata = await pipeline.metadata();

    const imageWidth = metadata.width || 600;
    const imageHeight = metadata.height || 400;
    const watermarkText = escapeSvgText(transformations.watermark.text.trim());
    const fontSize = Math.max(20, Math.round(imageWidth * 0.04));
    const watermarkWidth = Math.round(
      Math.max(220, watermarkText.length * fontSize * 0.65)
    );
    const watermarkHeight = fontSize + 28;

    const position = getWatermarkPosition(
      transformations.watermark.position || 'bottom-right',
      imageWidth,
      imageHeight,
      watermarkWidth,
      watermarkHeight
    );

    const svg = `
      <svg width="${watermarkWidth}" height="${watermarkHeight}">
        <rect
          x="0"
          y="0"
          width="${watermarkWidth}"
          height="${watermarkHeight}"
          rx="14"
          fill="rgba(0,0,0,0.45)"
        />
        <text
          x="${watermarkWidth / 2}"
          y="${watermarkHeight / 2}"
          text-anchor="middle"
          dominant-baseline="middle"
          font-family="Arial, sans-serif"
          font-size="${fontSize}"
          font-weight="700"
          fill="white"
        >${watermarkText}</text>
      </svg>
    `;

    pipeline = pipeline.composite([
      {
        input: Buffer.from(svg),
        left: Math.max(0, Math.round(position.left)),
        top: Math.max(0, Math.round(position.top)),
      },
    ]);
  }

  const outputFormat = transformations.format;

  if (outputFormat === 'jpeg' || outputFormat === 'jpg') {
    pipeline = pipeline.jpeg({
      quality: transformations.quality || 80,
    });
  } else if (outputFormat === 'png') {
    pipeline = pipeline.png({
      quality: transformations.quality || 80,
    });
  } else if (outputFormat === 'webp') {
    pipeline = pipeline.webp({
      quality: transformations.quality || 80,
    });
  } else if (outputFormat) {
    pipeline = pipeline.toFormat(outputFormat);
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
