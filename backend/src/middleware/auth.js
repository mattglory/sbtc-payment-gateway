/**
 * Authentication Middleware
 * Handles API key validation and authentication with enhanced error handling
 */

const ApiKeyService = require('../services/apiKeyService');
const apiKeyService = new ApiKeyService();

/**
 * API Key validation middleware with comprehensive error handling
 */
const requireApiKey = (req, res, next) => {
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  const validation = apiKeyService.validateApiKey(apiKey);
  
  if (!validation.valid) {
    const errorResponse = {
      error: validation.error,
      code: validation.code,
      hint: validation.code === 'MISSING_API_KEY' 
        ? 'Include your API key in the Authorization header as "Bearer your_api_key"'
        : apiKeyService.DEMO_MODE 
          ? `Try one of the demo keys: ${apiKeyService.DEMO_KEYS.join(', ')}` 
          : 'Contact support for a valid API key'
    };
    
    // Only log rejections in development, debug mode, or if not a Railway health check
    if ((process.env.NODE_ENV !== 'production' || process.env.LOG_LEVEL === 'debug') && !req.skipApiKeyLogging) {
      console.log(`[API_KEY] Request rejected from ${req.ip}: ${validation.error}`);
    }
    return res.status(401).json(errorResponse);
  }

  // Add validation info to request for debugging
  req.apiKeyInfo = validation;
  console.log(`[API_KEY] Request authorized with ${validation.type} key from ${req.ip}`);
  next();
};

/**
 * Legacy validate API key middleware (for backward compatibility)
 */
const validateApiKey = (req, res, next) => {
  try {
    const apiKey = req.headers.authorization?.replace('Bearer ', '');
    
    if (!apiKey) {
      return res.status(401).json({
        error: 'Missing API key in Authorization header'
      });
    }

    if (!apiKeyService.validate(apiKey)) {
      return res.status(401).json({
        error: 'Invalid API key'
      });
    }

    // Add merchant ID to request
    req.merchantId = apiKeyService.getMerchantId(apiKey);
    req.apiKey = apiKey;
    
    next();
  } catch (error) {
    console.error('API key validation error:', error);
    res.status(500).json({
      error: 'Internal server error during authentication'
    });
  }
};

/**
 * Optional API key middleware (for endpoints that work with or without auth)
 */
const optionalApiKey = (req, res, next) => {
  try {
    const apiKey = req.headers.authorization?.replace('Bearer ', '');
    
    if (apiKey && apiKeyService.validate(apiKey)) {
      req.merchantId = apiKeyService.getMerchantId(apiKey);
      req.apiKey = apiKey;
    }
    
    next();
  } catch (error) {
    console.error('Optional API key validation error:', error);
    // Don't fail the request, just continue without auth
    next();
  }
};

/**
 * Rate limiting middleware (basic implementation)
 */
const rateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old requests
    if (requests.has(key)) {
      const userRequests = requests.get(key).filter(time => time > windowStart);
      requests.set(key, userRequests);
    }
    
    const currentRequests = requests.get(key) || [];
    
    if (currentRequests.length >= max) {
      return res.status(429).json({
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    currentRequests.push(now);
    requests.set(key, currentRequests);
    
    next();
  };
};

module.exports = {
  validateApiKey,
  requireApiKey,
  optionalApiKey,
  rateLimit,
  apiKeyService
};