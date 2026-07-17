const multer = require('multer');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Server error';

  if (err instanceof multer.MulterError) {
    statusCode = 400;

    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'Image file must be 5 MB or smaller';
    }
  }

  return res.status(statusCode).json({
    message,
  });
};

const notFound = (req, res, next) => {
  const error = new Error('Route not found');
  error.statusCode = 404;
  next(error);
};

module.exports = {
  errorHandler,
  notFound,
};
