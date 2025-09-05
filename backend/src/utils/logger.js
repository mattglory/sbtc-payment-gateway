/**
 * Enhanced Logger Utility
 * Production-ready logging with multiple levels and structured output
 */

const winston = require('winston');
const path = require('path');

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, service, requestId, ...meta }) => {
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      service: service || 'sbtc-payment-gateway',
      message,
      requestId,
      ...meta
    };
    
    return JSON.stringify(logEntry, null, process.env.NODE_ENV === 'development' ? 2 : 0);
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { 
    service: 'sbtc-payment-gateway',
    version: process.env.APP_VERSION || '1.0.0'
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // File transport for production
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      format: logFormat
    }),
    
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      format: logFormat
    })
  ],
  
  // Handle uncaught exceptions and unhandled rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'exceptions.log'),
      format: logFormat
    })
  ],
  
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'rejections.log'),
      format: logFormat
    })
  ]
});

// Create structured logging methods
class Logger {
  constructor() {
    this.logger = logger;
  }

  /**
   * Create a child logger with additional context
   */
  child(meta) {
    return this.logger.child(meta);
  }

  /**
   * Log debug messages
   */
  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }

  /**
   * Log info messages
   */
  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  /**
   * Log warning messages
   */
  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  /**
   * Log error messages
   */
  error(message, error = null, meta = {}) {
    const errorMeta = {
      ...meta,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : null
    };
    
    this.logger.error(message, errorMeta);
  }

  /**
   * Log critical/fatal errors
   */
  fatal(message, error = null, meta = {}) {
    const errorMeta = {
      ...meta,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : null
    };
    
    this.logger.error(`[FATAL] ${message}`, errorMeta);
  }

  /**
   * Log API requests
   */
  request(req, res, meta = {}) {
    const requestMeta = {
      ...meta,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      requestId: req.requestId,
      statusCode: res.statusCode,
      responseTime: res.responseTime
    };

    this.logger.info('API Request', requestMeta);
  }

  /**
   * Log payment operations
   */
  payment(operation, paymentId, meta = {}) {
    const paymentMeta = {
      ...meta,
      operation,
      paymentId,
      component: 'payment-service'
    };

    this.logger.info(`Payment ${operation}`, paymentMeta);
  }

  /**
   * Log merchant operations
   */
  merchant(operation, merchantId, meta = {}) {
    const merchantMeta = {
      ...meta,
      operation,
      merchantId,
      component: 'merchant-service'
    };

    this.logger.info(`Merchant ${operation}`, merchantMeta);
  }

  /**
   * Log contract operations
   */
  contract(operation, contractId, meta = {}) {
    const contractMeta = {
      ...meta,
      operation,
      contractId,
      component: 'contract-service'
    };

    this.logger.info(`Contract ${operation}`, contractMeta);
  }

  /**
   * Log security events
   */
  security(event, meta = {}) {
    const securityMeta = {
      ...meta,
      event,
      component: 'security',
      severity: 'high'
    };

    this.logger.warn(`Security Event: ${event}`, securityMeta);
  }

  /**
   * Log performance metrics
   */
  performance(metric, value, meta = {}) {
    const performanceMeta = {
      ...meta,
      metric,
      value,
      component: 'performance',
      timestamp: new Date().toISOString()
    };

    this.logger.info(`Performance: ${metric}`, performanceMeta);
  }
}

// Create singleton instance
const loggerInstance = new Logger();

// Export both the class and instance
module.exports = loggerInstance;
module.exports.Logger = Logger;
module.exports.winston = logger;