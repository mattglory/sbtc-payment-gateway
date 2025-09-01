/**
 * Error Handling Middleware
 * Centralized error handling for the application
 */

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, _next) => {
  console.error('Unhandled error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    timestamp: new Date().toISOString()
  });

  // Default error response
  let statusCode = 500;
  let message = 'Internal server error';
  let details = undefined;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
    details = err.message;
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    message = 'Forbidden';
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    message = 'Not found';
  } else if (err.code === 'ECONNREFUSED') {
    statusCode = 503;
    message = 'Service unavailable';
    details = 'Database connection failed';
  }

  res.status(statusCode).json({
    error: message,
    details: process.env.NODE_ENV === 'development' ? (details || err.message) : undefined,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
};

/**
 * 404 handler for undefined routes
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Custom error classes
 */
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

class ForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

class NotFoundError extends Error {
  constructor(message = 'Not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError
};