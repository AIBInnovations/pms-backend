import { logger } from '../config/index.js';
import { sendError } from '../utils/index.js';

const errorHandler = (err, req, res, _next) => {
  logger.error(err);

  if (err.isOperational) {
    return sendError(res, {
      message: err.message,
      statusCode: err.statusCode,
      code: err.code,
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return sendError(res, {
      message: 'Validation failed',
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      details,
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return sendError(res, {
      message: `Duplicate value for ${field}`,
      statusCode: 409,
      code: 'DUPLICATE_ERROR',
    });
  }

  // Mongoose cast error (bad ObjectId etc)
  if (err.name === 'CastError') {
    return sendError(res, {
      message: `Invalid ${err.path}: ${err.value}`,
      statusCode: 400,
      code: 'CAST_ERROR',
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, {
      message: 'Invalid token',
      statusCode: 401,
      code: 'INVALID_TOKEN',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, {
      message: 'Token expired',
      statusCode: 401,
      code: 'TOKEN_EXPIRED',
    });
  }

  // Fallback
  return sendError(res, {
    message: 'Internal server error',
    statusCode: 500,
    code: 'SERVER_ERROR',
  });
};

export default errorHandler;
