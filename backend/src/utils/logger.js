/**
 * Enhanced Logger Utility
 * Production-ready logging with multiple levels and structured output
 * Fixed for Railway deployment with safe JSON serialization
 */

const winston = require('winston');
const path = require('path');
const { createWriteStream } = require('fs');

/**
 * Safe JSON serializer that handles circular references and complex objects
 */
function safeJsonStringify(obj, space) {
  const seen = new WeakSet();
  const cache = new Map();
  
  return JSON.stringify(obj, function(key, value) {
    // Handle null and primitive values
    if (value === null || typeof value !== 'object') {
      return value;
    }
    
    // Handle functions
    if (typeof value === 'function') {
      return '[Function]';
    }
    
    // Handle circular references
    if (seen.has(value)) {
      return '[Circular]';
    }
    
    // Handle special objects that cause issues
    if (value instanceof Error) {
      return {
        name: value.name,
        message: value.message,
        stack: value.stack,
        type: 'Error'
      };
    }
    
    // Handle Timeout objects and similar
    if (value.constructor && value.constructor.name) {
      const constructorName = value.constructor.name;
      if (['Timeout', 'Timer', 'Immediate', 'WriteStream', 'ReadStream'].includes(constructorName)) {
        return `[${constructorName}]`;
      }
    }
    
    // Handle Node.js internal objects
    if (value && value._handle) {
      return '[NodeJS Internal Object]';
    }
    
    // Handle Buffer objects
    if (Buffer.isBuffer(value)) {
      return '[Buffer]';
    }
    
    // Handle Date objects
    if (value instanceof Date) {
      return value.toISOString();
    }
    
    // Handle RegExp objects
    if (value instanceof RegExp) {
      return value.toString();
    }
    
    // Add to seen set for circular reference detection
    seen.add(value);
    
    // For arrays and plain objects, continue normal serialization
    if (Array.isArray(value) || value.constructor === Object) {
      return value;
    }
    
    // For other objects, try to extract useful information
    try {
      const result = {};
      const keys = Object.getOwnPropertyNames(value).slice(0, 10); // Limit keys to prevent bloat
      
      for (const k of keys) {
        if (k.startsWith('_')) continue; // Skip private properties
        try {
          const val = value[k];
          if (typeof val !== 'function' && !k.includes('password') && !k.includes('secret')) {
            result[k] = val;
          }
        } catch (e) {
          result[k] = '[Getter Error]';
        }
      }
      
      result._type = value.constructor.name || 'Unknown';
      return result;
    } catch (e) {
      return '[Unserializable Object]';
    }
  }, space);
}

// Custom log format with safe JSON serialization
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, service, requestId, ...meta }) => {
    try {
      const logEntry = {
        timestamp,
        level: level.toUpperCase(),
        service: service || 'sbtc-payment-gateway',
        message: typeof message === 'string' ? message : String(message),
        requestId,
        ...meta
      };
      
      return safeJsonStringify(logEntry, process.env.NODE_ENV === 'development' ? 2 : 0);
    } catch (error) {
      // Fallback if even safe serialization fails
      return JSON.stringify({
        timestamp,
        level: level.toUpperCase(),
        service: service || 'sbtc-payment-gateway',
        message: 'Log serialization error: ' + String(message),
        error: error.message
      });
    }
  })
);

// Create logger instance optimized for Railway deployment
const isProduction = process.env.NODE_ENV === 'production';
const isRailway = process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID;

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  format: logFormat,
  defaultMeta: { 
    service: 'sbtc-payment-gateway',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Always use console transport (Railway captures this)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: !isRailway }), // No colors on Railway
        winston.format.simple()
      ),
      handleExceptions: true,
      handleRejections: true
    })
  ],
  
  // Don't exit on handled exceptions in production
  exitOnError: !isProduction,
  
  // Silence winston's internal logging
  silent: false
});

// Only add file transports in local development
if (!isRailway && !isProduction) {
  try {
    const fs = require('fs');
    const logsDir = path.join(process.cwd(), 'logs');
    
    // Ensure logs directory exists
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    logger.add(new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 3,
      format: logFormat
    }));
    
    logger.add(new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 3,
      format: logFormat
    }));
  } catch (error) {
    // Ignore file transport errors - console logging will still work
    console.warn('Could not create file transports:', error.message);
  }
}

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
   * Safe metadata processing
   */
  _safeMeta(meta = {}) {
    try {
      if (meta === null || meta === undefined) {
        return {};
      }
      
      if (typeof meta !== 'object') {
        return { data: String(meta) };
      }
      
      // Create a clean copy to avoid modifying the original
      const safeMeta = {};
      const keys = Object.keys(meta).slice(0, 20); // Limit to prevent bloat
      
      for (const key of keys) {
        try {
          const value = meta[key];
          if (value !== undefined && !key.includes('password') && !key.includes('secret')) {
            safeMeta[key] = value;
          }
        } catch (e) {
          safeMeta[key] = '[Getter Error]';
        }
      }
      
      return safeMeta;
    } catch (e) {
      return { metaError: e.message };
    }
  }

  /**
   * Log debug messages
   */
  debug(message, meta = {}) {
    try {
      this.logger.debug(String(message), this._safeMeta(meta));
    } catch (e) {
      console.error('Logger.debug error:', e.message);
    }
  }

  /**
   * Log info messages
   */
  info(message, meta = {}) {
    try {
      this.logger.info(String(message), this._safeMeta(meta));
    } catch (e) {
      console.error('Logger.info error:', e.message);
    }
  }

  /**
   * Log warning messages
   */
  warn(message, meta = {}) {
    try {
      this.logger.warn(String(message), this._safeMeta(meta));
    } catch (e) {
      console.error('Logger.warn error:', e.message);
    }
  }

  /**
   * Log error messages
   */
  error(message, error = null, meta = {}) {
    try {
      const safeMeta = this._safeMeta(meta);
      
      if (error) {
        safeMeta.error = {
          message: error.message || String(error),
          name: error.name || 'Error',
          stack: error.stack || '[No stack trace]'
        };
        
        // Include additional error properties safely
        if (error.code) safeMeta.error.code = error.code;
        if (error.errno) safeMeta.error.errno = error.errno;
        if (error.syscall) safeMeta.error.syscall = error.syscall;
      }
      
      this.logger.error(String(message), safeMeta);
    } catch (e) {
      console.error('Logger.error error:', e.message, 'Original message:', String(message));
    }
  }

  /**
   * Log critical/fatal errors
   */
  fatal(message, error = null, meta = {}) {
    try {
      const safeMeta = this._safeMeta(meta);
      safeMeta.severity = 'fatal';
      
      if (error) {
        safeMeta.error = {
          message: error.message || String(error),
          name: error.name || 'Error',
          stack: error.stack || '[No stack trace]'
        };
      }
      
      this.logger.error(`[FATAL] ${String(message)}`, safeMeta);
    } catch (e) {
      console.error('Logger.fatal error:', e.message, 'Original message:', String(message));
    }
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