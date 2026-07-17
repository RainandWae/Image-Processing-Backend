const morgan = require('morgan');

const requestLogger = morgan(':method :url :status :response-time ms', {
  skip: () => process.env.NODE_ENV === 'test',
});

const errorLogger = (err, req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error({
      message: err.message,
      statusCode: err.statusCode || 500,
      method: req.method,
      path: req.originalUrl,
      userId: req.user?._id || req.user?.id || null,
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    });
  }

  next(err);
};

module.exports = {
  requestLogger,
  errorLogger,
};
