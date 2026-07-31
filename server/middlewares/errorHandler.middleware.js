const AppError = require('../utils/AppError');

const isMongoNetworkError = (err) => {
  if (!err) return false;
  const name = err.name || '';
  const message = err.message || '';

  return (
    name === 'MongooseServerSelectionError' ||
    name === 'MongoNetworkError' ||
    name === 'MongoTimeoutError' ||
    name === 'MongoNetworkTimeoutError' ||
    message.includes('buffered query timed out') ||
    message.includes('topology was destroyed') ||
    message.includes('connection timed out') ||
    message.includes('ENOTFOUND') ||
    message.includes('EAI_AGAIN') ||
    message.includes('ECONNREFUSED')
  );
};

const errorHandler = (err, req, res, _next) => {
  if (isMongoNetworkError(err)) {
    console.error('Database connection error detected:', err.message);
    return res.status(503).json({
      success: false,
      error: {
        code: 'DATABASE_CONNECTION_ERROR',
        message: 'Unable to connect to the database. Please check your internet connection and try again.',
        status: 503,
      },
    });
  }

  if (err instanceof AppError) {
    const errorObj = {
      code: err.code,
      message: err.message,
      status: err.status,
    };
    Object.keys(err).forEach((key) => {
      if (!['code', 'message', 'status', 'isOperational'].includes(key)) {
        errorObj[key] = err[key];
      }
    });
    return res.status(err.status).json({
      success: false,
      error: errorObj,
    });
  }

  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code || 'REQUEST_ERROR',
        message: err.message,
        status: err.statusCode,
      },
    });
  }

  console.error('Unhandled error:', err);

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred.',
      status: 500,
    },
  });
};

module.exports = errorHandler;
