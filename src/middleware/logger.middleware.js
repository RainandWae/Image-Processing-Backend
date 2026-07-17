const morgan = require('morgan');
const { env } = require('../config/env');

const requestLogger = morgan(':method :url :status :response-time ms', {
  skip: () => env.isTest,
});

const errorLogger = (err, req, res, next) => {
  if (!env.isTest) {
    console.error({
      message: err.message,
      statusCode: err.statusCode || 500,
      method: req.method,
      path: req.originalUrl,
      userId: req.user?._id || req.user?.id || null,
      stack: env.isProduction ? undefined : err.stack,
    });
  }

  next(err);
};

module.exports = {
  requestLogger,
  errorLogger,
};
