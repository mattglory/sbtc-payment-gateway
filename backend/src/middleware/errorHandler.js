/**
 * Enhanced Error Handler Middleware
 * Production-ready error handling with logging and monitoring
 */

const logger = require('../utils/logger');
const { APIError, ErrorFactory } = require('../utils/errors');

/**
 * Error Handler Middleware
 */
const errorHandler = (error, req, res, _next) => {
  // Generate request ID if not present
  const requestId = req.requestId || req.headers['x-request-id'] || 'unknown';
  
  // Convert to APIError if needed
  const apiError = error instanceof APIError ? error : ErrorFactory.fromError(error);
  
  // Log error with context
  const errorContext = {
    requestId,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    body: req.body,
    query: req.query,
    params: req.params,
    headers: {
      authorization: req.headers.authorization ? '[REDACTED]' : undefined,
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent'],
      'x-forwarded-for': req.headers['x-forwarded-for']
    }
  };

  // Log based on error severity
  if (apiError.statusCode >= 500) {
    logger.error('Server Error', apiError, errorContext);
  } else if (apiError.statusCode >= 400) {
    logger.warn('Client Error', errorContext);
  } else {
    logger.info('Request Error', errorContext);
  }

  // Set security headers
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  });

  // Add request ID to response
  res.set('X-Request-ID', requestId);

  // Add rate limit headers if it's a rate limit error
  if (apiError.code === 'RATE_LIMIT_EXCEEDED') {
    res.set('Retry-After', apiError.retryAfter || 60);
  }

  // Send error response
  res.status(apiError.statusCode).json({
    ...apiError.toJSON(),
    requestId,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && {
      stack: apiError.stack
    })
  });
};

/**
 * Not Found Handler
 */
const notFoundHandler = (req, res, _next) => {
  const requestId = req.requestId || req.headers['x-request-id'] || 'unknown';
  
  logger.warn('Route Not Found', {
    requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress
  });

  res.status(404).json({
    error: {
      type: 'not_found_error',
      code: 'ROUTE_NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
      timestamp: new Date().toISOString()
    },
    requestId
  });
};

/**
 * Async Error Handler Wrapper
 * Wraps async route handlers to catch errors
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Validation Error Handler
 * Specifically for handling validation errors
 */
const validationErrorHandler = (error, req, res, next) => {
  if (error.name === 'ValidationError') {
    const requestId = req.requestId || req.headers['x-request-id'] || 'unknown';
    
    logger.warn('Validation Error', {
      requestId,
      method: req.method,
      url: req.originalUrl,
      errors: error.details,
      body: req.body
    });

    return res.status(400).json({
      error: {
        type: 'validation_error',
        code: 'VALIDATION_FAILED',
        message: 'Request validation failed',
        details: error.details,
        timestamp: new Date().toISOString()
      },
      requestId
    });
  }
  
  next(error);
};

/**
 * Security Error Handler
 * Handle security-related errors
 */
const securityErrorHandler = (error, req, res, next) => {
  const securityErrors = [
    'UnauthorizedError',
    'JsonWebTokenError',
    'TokenExpiredError',
    'NotBeforeError'
  ];

  if (securityErrors.includes(error.name)) {
    const requestId = req.requestId || req.headers['x-request-id'] || 'unknown';
    
    logger.security('Authentication Failure', {
      requestId,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      error: error.message
    });

    return res.status(401).json({
      error: {
        type: 'authentication_error',
        code: 'AUTHENTICATION_FAILED',
        message: 'Authentication failed',
        timestamp: new Date().toISOString()
      },
      requestId
    });
  }

  next(error);
};

/**
 * Rate Limit Error Handler
 */
const rateLimitErrorHandler = (error, req, res, next) => {
  if (error.type === 'RateLimitError' || error.code === 'RATE_LIMIT_EXCEEDED') {
    const requestId = req.requestId || req.headers['x-request-id'] || 'unknown';
    const retryAfter = error.retryAfter || 60;
    
    logger.security('Rate Limit Exceeded', {
      requestId,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      retryAfter
    });

    res.set('Retry-After', retryAfter);
    
    return res.status(429).json({
      error: {
        type: 'rate_limit_error',
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
        retryAfter,
        timestamp: new Date().toISOString()
      },
      requestId
    });
  }

  next(error);
};

/**
 * Development Error Handler
 * Enhanced error information for development
 */
const developmentErrorHandler = (error, req, res, _next) => {
  if (process.env.NODE_ENV === 'development') {
    const requestId = req.requestId || req.headers['x-request-id'] || 'unknown';
    
    console.error('\n=== DEVELOPMENT ERROR ===');
    console.error('Request ID:', requestId);
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('Request:', {
      method: req.method,
      url: req.originalUrl,
      body: req.body,
      query: req.query,
      params: req.params
    });
    console.error('========================\n');
  }

  _next(error);
};

/**
 * Global Error Handlers
 */
const setupGlobalErrorHandlers = () => {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.fatal('Uncaught Exception', error, {
      component: 'global-error-handler',
      event: 'uncaught-exception'
    });
    
    // Give logger time to write before exiting
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.fatal('Unhandled Promise Rejection', reason, {
      component: 'global-error-handler',
      event: 'unhandled-rejection',
      promise: promise.toString()
    });
    
    // Give logger time to write before exiting
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  // Handle SIGTERM gracefully
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully', {
      component: 'global-error-handler',
      event: 'sigterm'
    });
    process.exit(0);
  });

  // Handle SIGINT gracefully
  process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully', {
      component: 'global-error-handler',
      event: 'sigint'
    });
    process.exit(0);
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  validationErrorHandler,
  securityErrorHandler,
  rateLimitErrorHandler,
  developmentErrorHandler,
  setupGlobalErrorHandlers
};