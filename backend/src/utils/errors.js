/**
 * Custom Error Classes
 * Structured error handling with proper HTTP status codes
 */

/**
 * Base API Error
 */
class APIError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.isOperational = true; // Distinguish operational errors from programming errors
    
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: {
        type: this.name.toLowerCase().replace('error', '_error'),
        code: this.code,
        message: this.message,
        details: this.details,
        timestamp: this.timestamp
      }
    };
  }
}

/**
 * Validation Error - 400
 */
class ValidationError extends APIError {
  constructor(message, field = null, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.field = field;
  }

  toJSON() {
    return {
      error: {
        type: 'validation_error',
        code: this.code,
        message: this.message,
        field: this.field,
        details: this.details,
        timestamp: this.timestamp
      }
    };
  }
}

/**
 * Authentication Error - 401
 */
class AuthenticationError extends APIError {
  constructor(message = 'Authentication required', details = null) {
    super(message, 401, 'AUTHENTICATION_ERROR', details);
  }

  toJSON() {
    return {
      error: {
        type: 'authentication_error',
        code: this.code,
        message: this.message,
        details: this.details,
        timestamp: this.timestamp
      }
    };
  }
}

/**
 * Authorization Error - 403
 */
class AuthorizationError extends APIError {
  constructor(message = 'Insufficient permissions', details = null) {
    super(message, 403, 'AUTHORIZATION_ERROR', details);
  }

  toJSON() {
    return {
      error: {
        type: 'authorization_error',
        code: this.code,
        message: this.message,
        details: this.details,
        timestamp: this.timestamp
      }
    };
  }
}

/**
 * Not Found Error - 404
 */
class NotFoundError extends APIError {
  constructor(resource = 'Resource', id = null) {
    const message = id ? `${resource} with ID '${id}' not found` : `${resource} not found`;
    super(message, 404, 'NOT_FOUND', { resource, id });
  }

  toJSON() {
    return {
      error: {
        type: 'not_found_error',
        code: this.code,
        message: this.message,
        resource: this.details?.resource,
        id: this.details?.id,
        timestamp: this.timestamp
      }
    };
  }
}

/**
 * Conflict Error - 409
 */
class ConflictError extends APIError {
  constructor(message, details = null) {
    super(message, 409, 'CONFLICT_ERROR', details);
  }

  toJSON() {
    return {
      error: {
        type: 'conflict_error',
        code: this.code,
        message: this.message,
        details: this.details,
        timestamp: this.timestamp
      }
    };
  }
}

/**
 * Rate Limit Error - 429
 */
class RateLimitError extends APIError {
  constructor(retryAfter = 60, message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', { retryAfter });
    this.retryAfter = retryAfter;
  }

  toJSON() {
    return {
      error: {
        type: 'rate_limit_error',
        code: this.code,
        message: this.message,
        retryAfter: this.retryAfter,
        timestamp: this.timestamp
      }
    };
  }
}

/**
 * Payment Error - 400
 */
class PaymentError extends APIError {
  constructor(message, code = 'PAYMENT_ERROR', details = null) {
    super(message, 400, code, details);
  }

  toJSON() {
    return {
      error: {
        type: 'payment_error',
        code: this.code,
        message: this.message,
        details: this.details,
        timestamp: this.timestamp
      }
    };
  }
}

/**
 * Blockchain Error - 502
 */
class BlockchainError extends APIError {
  constructor(message, originalError = null) {
    super(message, 502, 'BLOCKCHAIN_ERROR', originalError ? {
      originalMessage: originalError.message,
      originalStack: originalError.stack
    } : null);
  }

  toJSON() {
    return {
      error: {
        type: 'blockchain_error',
        code: this.code,
        message: this.message,
        details: this.details,
        timestamp: this.timestamp
      }
    };
  }
}

/**
 * Service Unavailable Error - 503
 */
class ServiceUnavailableError extends APIError {
  constructor(service = 'Service', retryAfter = 60) {
    super(`${service} is temporarily unavailable`, 503, 'SERVICE_UNAVAILABLE', { service, retryAfter });
    this.retryAfter = retryAfter;
  }

  toJSON() {
    return {
      error: {
        type: 'service_unavailable_error',
        code: this.code,
        message: this.message,
        service: this.details?.service,
        retryAfter: this.retryAfter,
        timestamp: this.timestamp
      }
    };
  }
}

/**
 * Error Factory
 */
class ErrorFactory {
  static validation(message, field = null, details = null) {
    return new ValidationError(message, field, details);
  }

  static authentication(message, details = null) {
    return new AuthenticationError(message, details);
  }

  static authorization(message, details = null) {
    return new AuthorizationError(message, details);
  }

  static notFound(resource, id = null) {
    return new NotFoundError(resource, id);
  }

  static conflict(message, details = null) {
    return new ConflictError(message, details);
  }

  static rateLimit(retryAfter, message) {
    return new RateLimitError(retryAfter, message);
  }

  static payment(message, code, details = null) {
    return new PaymentError(message, code, details);
  }

  static blockchain(message, originalError = null) {
    return new BlockchainError(message, originalError);
  }

  static serviceUnavailable(service, retryAfter) {
    return new ServiceUnavailableError(service, retryAfter);
  }

  static internal(message, details = null) {
    return new APIError(message, 500, 'INTERNAL_ERROR', details);
  }

  /**
   * Convert unknown errors to APIError
   */
  static fromError(error) {
    if (error instanceof APIError) {
      return error;
    }

    if (error.name === 'ValidationError') {
      return new ValidationError(error.message);
    }

    if (error.name === 'CastError') {
      return new ValidationError('Invalid ID format', 'id');
    }

    if (error.code === 11000) { // MongoDB duplicate key error
      return new ConflictError('Resource already exists');
    }

    // Default to internal error
    return new APIError(
      error.message || 'Internal server error',
      500,
      'INTERNAL_ERROR',
      process.env.NODE_ENV === 'development' ? { stack: error.stack } : null
    );
  }
}

module.exports = {
  APIError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  PaymentError,
  BlockchainError,
  ServiceUnavailableError,
  ErrorFactory
};