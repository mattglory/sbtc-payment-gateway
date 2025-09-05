/**
 * Security Middleware
 * Comprehensive security measures for production deployment
 */

const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const logger = require('../utils/logger');
const { AuthenticationError, AuthorizationError, RateLimitError } = require('../utils/errors');

/**
 * Generate request ID middleware
 */
const requestId = (req, res, next) => {
  req.requestId = req.headers['x-request-id'] || crypto.randomUUID();
  res.set('X-Request-ID', req.requestId);
  next();
};

/**
 * Security Headers Middleware
 */
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false, // Allow embedding for payment widgets
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  }
});

/**
 * Rate Limiting Configuration
 */
const createRateLimit = (windowMs = 15 * 60 * 1000, max = 100, message = 'Too many requests') => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: {
        type: 'rate_limit_error',
        code: 'RATE_LIMIT_EXCEEDED',
        message,
        retryAfter: Math.ceil(windowMs / 1000)
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.security('Rate Limit Exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl,
        method: req.method,
        requestId: req.requestId
      });

      res.status(429).json({
        error: {
          type: 'rate_limit_error',
          code: 'RATE_LIMIT_EXCEEDED',
          message,
          retryAfter: Math.ceil(windowMs / 1000),
          timestamp: new Date().toISOString()
        },
        requestId: req.requestId
      });
    }
  });
};

/**
 * API Key Authentication Middleware
 */
const authenticateApiKey = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'] || (authHeader && authHeader.split(' ')[1]);

  if (!apiKey) {
    logger.security('Missing API Key', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      method: req.method,
      requestId: req.requestId
    });
    
    return next(new AuthenticationError('API key is required'));
  }

  // Basic API key format validation
  if (!apiKey.match(/^pk_(test|live|demo)_[a-zA-Z0-9]{32,64}$/)) {
    logger.security('Invalid API Key Format', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      method: req.method,
      requestId: req.requestId,
      apiKeyPrefix: apiKey.substring(0, 10) + '...'
    });
    
    return next(new AuthenticationError('Invalid API key format'));
  }

  // Extract environment from API key
  const keyParts = apiKey.split('_');
  const environment = keyParts[1]; // test, live, or demo

  // In production, validate against database/cache
  // For now, accept any properly formatted key
  req.merchant = {
    id: `merchant_${crypto.createHash('sha256').update(apiKey).digest('hex').substring(0, 16)}`,
    environment,
    apiKey
  };

  next();
};

/**
 * Input Sanitization Middleware
 */
const sanitizeInput = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  
  next();
};

/**
 * Sanitize object recursively
 */
const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Remove null bytes
      let clean = value.replace(/\0/g, '');
      
      // Limit string length
      if (clean.length > 10000) {
        clean = clean.substring(0, 10000);
      }
      
      sanitized[key] = clean;
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => sanitizeObject(item));
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

/**
 * CORS Configuration
 */
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://sbtcpaymentgateway.vercel.app',
      'https://sbtcpaymentgateway-matt-glorys-projects.vercel.app',
      'https://sbtc-payment-gateway.vercel.app'
    ];
    
    // Allow any Vercel preview URLs
    const vercelPattern = /^https:\/\/.*\.vercel\.app$/;
    
    if (allowedOrigins.includes(origin) || vercelPattern.test(origin)) {
      callback(null, true);
    } else {
      logger.security('CORS Violation', {
        origin,
        timestamp: new Date().toISOString()
      });
      
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID', 'X-Total-Count']
};

/**
 * Request Logging Middleware
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  logger.info('Incoming Request', {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    referer: req.get('Referer'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length')
  });

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(body) {
    const responseTime = Date.now() - startTime;
    
    logger.info('Outgoing Response', {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime,
      contentType: res.get('Content-Type'),
      contentLength: res.get('Content-Length')
    });
    
    return originalJson.call(this, body);
  };

  next();
};

/**
 * IP Whitelisting Middleware (for admin endpoints)
 */
const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
      logger.security('IP Whitelist Violation', {
        ip: clientIP,
        url: req.originalUrl,
        method: req.method,
        requestId: req.requestId
      });
      
      return next(new AuthorizationError('IP address not allowed'));
    }
    
    next();
  };
};

/**
 * Webhook Signature Verification
 */
const verifyWebhookSignature = (secret) => {
  return (req, res, next) => {
    const signature = req.headers['x-sbtcpay-signature'];
    
    if (!signature) {
      return next(new AuthenticationError('Missing webhook signature'));
    }
    
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(req.body, 'utf8')
      .digest('hex');
    
    if (!crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'))) {
      logger.security('Invalid Webhook Signature', {
        ip: req.ip,
        url: req.originalUrl,
        requestId: req.requestId
      });
      
      return next(new AuthenticationError('Invalid webhook signature'));
    }
    
    next();
  };
};

/**
 * SQL Injection Prevention
 */
const preventSqlInjection = (req, res, next) => {
  const sqlPatterns = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
    /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
    /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
    /((\%27)|(\'))union/i,
    /exec(\s|\+)+(s|x)p\w+/i
  ];
  
  const checkValue = (value, path = '') => {
    if (typeof value === 'string') {
      for (const pattern of sqlPatterns) {
        if (pattern.test(value)) {
          logger.security('SQL Injection Attempt', {
            ip: req.ip,
            url: req.originalUrl,
            method: req.method,
            requestId: req.requestId,
            path,
            pattern: pattern.toString(),
            value: value.substring(0, 100) + (value.length > 100 ? '...' : '')
          });
          
          throw new AuthenticationError('Potentially malicious input detected');
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      for (const [key, val] of Object.entries(value)) {
        checkValue(val, `${path}.${key}`);
      }
    }
  };
  
  try {
    if (req.body) checkValue(req.body, 'body');
    if (req.query) checkValue(req.query, 'query');
    if (req.params) checkValue(req.params, 'params');
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Performance Monitoring
 */
const performanceMonitor = (req, res, next) => {
  const startTime = process.hrtime();
  const startUsage = process.cpuUsage();
  
  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const responseTime = seconds * 1000 + nanoseconds / 1000000;
    const cpuUsage = process.cpuUsage(startUsage);
    
    // Log slow requests
    if (responseTime > 1000) {
      logger.performance('Slow Request', responseTime, {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        cpuUser: cpuUsage.user / 1000,
        cpuSystem: cpuUsage.system / 1000
      });
    }
    
    // Log performance metrics
    logger.performance('Response Time', responseTime, {
      requestId: req.requestId,
      method: req.method,
      endpoint: req.route?.path || req.originalUrl,
      statusCode: res.statusCode
    });
  });
  
  next();
};

module.exports = {
  requestId,
  securityHeaders,
  createRateLimit,
  authenticateApiKey,
  sanitizeInput,
  corsOptions,
  requestLogger,
  ipWhitelist,
  verifyWebhookSignature,
  preventSqlInjection,
  performanceMonitor
};