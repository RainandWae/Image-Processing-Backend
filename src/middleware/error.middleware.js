const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  return res.status(statusCode).json({
    message: err.message || 'Server error',
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
