const allowedFormats = ['jpeg', 'jpg', 'png', 'webp'];

const validateTransform = (req, res, next) => {
  const { transformations } = req.body;

  if (!transformations || typeof transformations !== 'object') {
    return res.status(400).json({
      message: 'Transformations object is required',
    });
  }

  if (Object.keys(transformations).length === 0) {
    return res.status(400).json({
      message: 'At least one transformation is required',
    });
  }

  if (transformations.resize) {
    const { width, height } = transformations.resize;

    if (
      width !== undefined &&
      (!Number.isInteger(width) || width <= 0 || width > 5000)
    ) {
      return res.status(400).json({
        message: 'Resize width must be a positive integer up to 5000',
      });
    }

    if (
      height !== undefined &&
      (!Number.isInteger(height) || height <= 0 || height > 5000)
    ) {
      return res.status(400).json({
        message: 'Resize height must be a positive integer up to 5000',
      });
    }

    if (width === undefined && height === undefined) {
      return res.status(400).json({
        message: 'Resize requires width or height',
      });
    }
  }

  if (
    transformations.rotate !== undefined &&
    typeof transformations.rotate !== 'number'
  ) {
    return res.status(400).json({
      message: 'Rotate must be a number',
    });
  }

  if (
    transformations.flip !== undefined &&
    typeof transformations.flip !== 'boolean'
  ) {
    return res.status(400).json({
      message: 'Flip must be a boolean',
    });
  }

  if (
    transformations.mirror !== undefined &&
    typeof transformations.mirror !== 'boolean'
  ) {
    return res.status(400).json({
      message: 'Mirror must be a boolean',
    });
  }

  if (
    transformations.format !== undefined &&
    !allowedFormats.includes(transformations.format)
  ) {
    return res.status(400).json({
      message: `Format must be one of: ${allowedFormats.join(', ')}`,
    });
  }

  if (transformations.filters) {
    const { grayscale, sepia } = transformations.filters;

    if (grayscale !== undefined && typeof grayscale !== 'boolean') {
      return res.status(400).json({
        message: 'Grayscale filter must be a boolean',
      });
    }

    if (sepia !== undefined && typeof sepia !== 'boolean') {
      return res.status(400).json({
        message: 'Sepia filter must be a boolean',
      });
    }
  }

  next();
};

module.exports = validateTransform;