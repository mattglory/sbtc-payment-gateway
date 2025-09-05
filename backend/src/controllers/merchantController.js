/**
 * Merchant Controller
 * Production-ready merchant operations with comprehensive error handling and monitoring
 */

const MerchantService = require('../services/merchantService');
const ApiKeyService = require('../services/apiKeyService');
const logger = require('../utils/logger');
const { Validator } = require('../utils/validation');
const { ErrorFactory } = require('../utils/errors');
const { performanceMonitor } = require('../utils/monitoring');

class MerchantController {
  constructor() {
    this.merchantService = new MerchantService();
    this.apiKeyService = new ApiKeyService();
  }

  /**
   * Register a new merchant with comprehensive validation and monitoring
   */
  async register(req, res) {
    const requestId = req.requestId || 'unknown';
    
    try {
      // Performance monitoring
      performanceMonitor.start('merchant_registration');
      
      // Log request details
      logger.merchant('register_start', null, {
        requestId,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        email: req.body?.email
      });

      // Validate input data
      const validatedData = Validator.validateMerchantRegistration(req.body);
      
      // Register the merchant
      const result = await this.merchantService.register(validatedData);
      
      // Log successful registration
      logger.merchant('register_success', result.merchantId, {
        requestId,
        email: result.email,
        businessName: result.businessName
      });

      // Record performance metrics
      const performanceResult = performanceMonitor.end('merchant_registration');
      if (performanceResult && performanceResult.duration > 2000) {
        logger.performance('Slow merchant registration', performanceResult.duration, {
          requestId,
          merchantId: result.merchantId
        });
      }

      res.status(201).json(result);

    } catch (error) {
      // End performance monitoring
      performanceMonitor.end('merchant_registration');
      
      // Log error with context
      logger.error('Merchant registration failed', error, {
        requestId,
        body: req.body,
        ip: req.ip
      });

      // Handle different error types
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          ...error.toJSON(),
          requestId
        });
      }

      if (error.statusCode) {
        return res.status(error.statusCode).json({
          ...error.toJSON(),
          requestId
        });
      }

      // Handle legacy error messages
      if (error.message?.includes('Missing required fields')) {
        const validationError = ErrorFactory.validation('Missing required fields for merchant registration');
        return res.status(400).json({
          ...validationError.toJSON(),
          requestId
        });
      }
      
      if (error.message?.includes('already registered')) {
        const conflictError = ErrorFactory.conflict('Merchant with this email is already registered');
        return res.status(409).json({
          ...conflictError.toJSON(),
          requestId
        });
      }
      
      // Generic error response
      const genericError = ErrorFactory.internal('Failed to register merchant');
      res.status(500).json({
        ...genericError.toJSON(),
        requestId,
        ...(process.env.NODE_ENV === 'development' && { originalError: error.message })
      });
    }
  }

  /**
   * Get merchant dashboard statistics with comprehensive authentication and monitoring
   */
  async getDashboard(req, res) {
    const requestId = req.requestId || 'unknown';
    
    try {
      // Performance monitoring
      performanceMonitor.start('dashboard_stats');
      
      // Get merchant information from API key
      const apiKey = req.apiKeyInfo?.key || req.headers.authorization?.replace('Bearer ', '');
      const merchantId = this.apiKeyService.getMerchantFromApiKey(apiKey);
      
      if (!merchantId) {
        throw ErrorFactory.authentication('Invalid API key or merchant not found');
      }

      // Log request details
      logger.merchant('dashboard_start', merchantId, {
        requestId,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      // Get dashboard statistics
      const stats = await this.merchantService.getDashboardStats(merchantId);
      
      // Log successful retrieval
      logger.merchant('dashboard_success', merchantId, {
        requestId,
        totalPayments: stats.totalPayments,
        totalRevenue: stats.totalRevenue
      });

      // Record performance metrics
      const performanceResult = performanceMonitor.end('dashboard_stats');
      if (performanceResult && performanceResult.duration > 1000) {
        logger.performance('Slow dashboard stats retrieval', performanceResult.duration, {
          requestId,
          merchantId
        });
      }

      res.json(stats);

    } catch (error) {
      // End performance monitoring
      performanceMonitor.end('dashboard_stats');
      
      // Log error with context
      logger.error('Dashboard stats retrieval failed', error, {
        requestId,
        ip: req.ip,
        apiKeyPrefix: req.headers.authorization?.substring(0, 20) + '...'
      });

      // Handle different error types
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          ...error.toJSON(),
          requestId
        });
      }
      
      // Generic error response
      const genericError = ErrorFactory.internal('Failed to retrieve dashboard statistics');
      res.status(500).json({
        ...genericError.toJSON(),
        requestId,
        ...(process.env.NODE_ENV === 'development' && { originalError: error.message })
      });
    }
  }

  /**
   * Validate API key endpoint for debugging with comprehensive logging
   */
  async validateKey(req, res) {
    const requestId = req.requestId || 'unknown';
    
    try {
      // Performance monitoring
      performanceMonitor.start('api_key_validation');
      
      // Log request details
      logger.info('API key validation request', {
        requestId,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        hasApiKey: !!req.body?.apiKey
      });

      // Validate input
      const { apiKey } = req.body;
      if (!apiKey) {
        throw ErrorFactory.validation('API key is required in request body');
      }

      // Validate the API key
      const validation = this.apiKeyService.validateApiKey(apiKey);
      
      const response = {
        valid: validation.valid,
        type: validation.type,
        timestamp: new Date().toISOString(),
        requestId
      };
      
      if (!validation.valid) {
        response.error = validation.error;
        response.code = validation.code;
        response.hint = validation.code === 'MISSING_API_KEY' 
          ? 'Provide an API key to validate'
          : this.apiKeyService.DEMO_MODE 
            ? `Try one of the demo keys: ${this.apiKeyService.DEMO_KEYS.join(', ')}` 
            : 'Contact support for a valid API key';

        // Log validation failure
        logger.warn('API key validation failed', {
          requestId,
          error: validation.error,
          code: validation.code,
          apiKeyPrefix: apiKey?.substring(0, 10) + '...'
        });
      } else {
        // Log successful validation
        logger.info('API key validation successful', {
          requestId,
          type: validation.type,
          apiKeyPrefix: apiKey?.substring(0, 10) + '...'
        });
      }

      // Record performance metrics
      const performanceResult = performanceMonitor.end('api_key_validation');
      if (performanceResult && performanceResult.duration > 100) {
        logger.performance('Slow API key validation', performanceResult.duration, {
          requestId
        });
      }
      
      res.json(response);

    } catch (error) {
      // End performance monitoring
      performanceMonitor.end('api_key_validation');
      
      // Log error with context
      logger.error('API key validation error', error, {
        requestId,
        body: req.body,
        ip: req.ip
      });

      // Handle different error types
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          ...error.toJSON(),
          requestId
        });
      }

      if (error.statusCode) {
        return res.status(error.statusCode).json({
          ...error.toJSON(),
          requestId
        });
      }
      
      // Generic error response
      const genericError = ErrorFactory.internal('Failed to validate API key');
      res.status(500).json({
        ...genericError.toJSON(),
        requestId,
        ...(process.env.NODE_ENV === 'development' && { originalError: error.message })
      });
    }
  }
}

module.exports = MerchantController;