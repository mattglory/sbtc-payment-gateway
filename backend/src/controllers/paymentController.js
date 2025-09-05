/**
 * Payment Controller
 * Production-ready payment operations with comprehensive error handling and monitoring
 */

const PaymentService = require('../services/paymentService');
const MerchantService = require('../services/merchantService');
const ApiKeyService = require('../services/apiKeyService');
const logger = require('../utils/logger');
const { Validator } = require('../utils/validation');
const { ErrorFactory } = require('../utils/errors');
const { performanceMonitor } = require('../utils/monitoring');

class PaymentController {
  constructor() {
    this.paymentService = new PaymentService();
    this.merchantService = new MerchantService();
    this.apiKeyService = new ApiKeyService();
  }

  /**
   * Create payment intent with comprehensive validation, logging, and monitoring
   */
  async createIntent(req, res) {
    const requestId = req.requestId || 'unknown';
    
    try {
      // Performance monitoring
      performanceMonitor.start('payment_intent_creation');
      
      // Log request details
      logger.payment('create_intent_start', null, {
        requestId,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Validate input data
      const validatedData = Validator.validatePaymentIntent(req.body);
      
      // Get merchant information from API key
      const apiKey = req.apiKeyInfo?.key || req.headers.authorization?.replace('Bearer ', '');
      const merchantId = this.apiKeyService.getMerchantFromApiKey(apiKey);
      
      if (!merchantId) {
        throw ErrorFactory.authentication('Invalid API key or merchant not found');
      }

      const merchant = await this.merchantService.findById(merchantId);
      if (!merchant) {
        logger.warn('Merchant not found during payment creation', {
          requestId,
          merchantId,
          apiKey: apiKey?.substring(0, 10) + '...'
        });
        throw ErrorFactory.notFound('Merchant', merchantId);
      }

      // Create payment intent
      const result = await this.paymentService.createPaymentIntent(merchantId, validatedData);
      
      // Log successful creation
      logger.payment('create_intent_success', result.id, {
        requestId,
        merchantId,
        amount: result.amount,
        description: result.description
      });

      // Record performance metrics
      const performanceResult = performanceMonitor.end('payment_intent_creation');
      if (performanceResult && performanceResult.duration > 1000) {
        logger.performance('Slow payment intent creation', performanceResult.duration, {
          requestId,
          merchantId
        });
      }

      res.status(201).json(result);

    } catch (error) {
      // End performance monitoring
      performanceMonitor.end('payment_intent_creation');
      
      // Log error with context
      logger.error('Payment intent creation failed', error, {
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
      const genericError = ErrorFactory.internal('Failed to create payment intent');
      res.status(500).json({
        ...genericError.toJSON(),
        requestId,
        ...(process.env.NODE_ENV === 'development' && { originalError: error.message })
      });
    }
  }

  /**
   * Confirm payment with Stacks blockchain integration
   */
  async confirmPayment(req, res) {
    const requestId = req.requestId || 'unknown';
    const { id } = req.params;
    
    try {
      // Performance monitoring
      performanceMonitor.start('payment_confirmation');
      
      // Log request details
      logger.payment('confirm_payment_start', id, {
        requestId,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Validate payment ID
      if (!id) {
        throw ErrorFactory.validation('Payment ID is required');
      }

      // Validate confirmation data if present
      let validatedData = {};
      if (req.body && Object.keys(req.body).length > 0) {
        validatedData = Validator.validatePaymentConfirmation(req.body);
      }

      // Confirm the payment
      const result = await this.paymentService.confirmPayment(id, validatedData);
      
      // Update merchant stats asynchronously after successful payment processing
      const paymentIntent = await this.paymentService.getPaymentIntent(id);
      this.updateMerchantStatsAsync(paymentIntent);
      
      // Log successful confirmation
      logger.payment('confirm_payment_success', id, {
        requestId,
        status: result.status,
        amount: result.amount
      });

      // Record performance metrics
      const performanceResult = performanceMonitor.end('payment_confirmation');
      if (performanceResult && performanceResult.duration > 2000) {
        logger.performance('Slow payment confirmation', performanceResult.duration, {
          requestId,
          paymentId: id
        });
      }
      
      res.json(result);

    } catch (error) {
      // End performance monitoring
      performanceMonitor.end('payment_confirmation');
      
      // Log error with context
      logger.error('Payment confirmation failed', error, {
        requestId,
        paymentId: id,
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
      if (error.message?.includes('not found')) {
        const notFoundError = ErrorFactory.notFound('Payment', id);
        return res.status(404).json({
          ...notFoundError.toJSON(),
          requestId
        });
      }
      
      if (error.message?.includes('expired')) {
        const expiredError = ErrorFactory.validation('Payment has expired');
        return res.status(400).json({
          ...expiredError.toJSON(),
          requestId
        });
      }
      
      // Generic error response
      const genericError = ErrorFactory.internal('Failed to confirm payment');
      res.status(500).json({
        ...genericError.toJSON(),
        requestId,
        ...(process.env.NODE_ENV === 'development' && { originalError: error.message })
      });
    }
  }

  /**
   * Get payment intent details with comprehensive logging and error handling
   */
  async getPaymentIntent(req, res) {
    const requestId = req.requestId || 'unknown';
    const { id } = req.params;
    
    try {
      // Performance monitoring
      performanceMonitor.start('get_payment_intent');
      
      // Log request details
      logger.payment('get_payment_intent_start', id, {
        requestId,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Validate payment ID
      if (!id) {
        throw ErrorFactory.validation('Payment ID is required');
      }

      // Retrieve payment intent
      const paymentIntent = await this.paymentService.getPaymentIntent(id);
      
      // Log successful retrieval
      logger.payment('get_payment_intent_success', id, {
        requestId,
        status: paymentIntent.status,
        merchantId: paymentIntent.merchantId
      });

      // Record performance metrics
      const performanceResult = performanceMonitor.end('get_payment_intent');
      if (performanceResult && performanceResult.duration > 500) {
        logger.performance('Slow payment intent retrieval', performanceResult.duration, {
          requestId,
          paymentId: id
        });
      }
      
      res.json(paymentIntent);

    } catch (error) {
      // End performance monitoring
      performanceMonitor.end('get_payment_intent');
      
      // Log error with context
      logger.error('Payment intent retrieval failed', error, {
        requestId,
        paymentId: id,
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
      if (error.message?.includes('not found')) {
        const notFoundError = ErrorFactory.notFound('Payment intent', id);
        return res.status(404).json({
          ...notFoundError.toJSON(),
          requestId
        });
      }
      
      // Generic error response
      const genericError = ErrorFactory.internal('Failed to retrieve payment intent');
      res.status(500).json({
        ...genericError.toJSON(),
        requestId,
        ...(process.env.NODE_ENV === 'development' && { originalError: error.message })
      });
    }
  }

  /**
   * Update merchant stats asynchronously after payment success
   */
  async updateMerchantStatsAsync(paymentIntent) {
    // Wait for payment to succeed before updating stats
    setTimeout(async () => {
      try {
        logger.info('Starting merchant stats update', {
          paymentId: paymentIntent.id,
          merchantId: paymentIntent.merchantId
        });

        const updatedPayment = await this.paymentService.getPaymentIntent(paymentIntent.id);
        if (updatedPayment && updatedPayment.status === 'succeeded') {
          await this.merchantService.updateStats(updatedPayment.merchantId, {
            totalProcessed: updatedPayment.amount,
            feeCollected: updatedPayment.fee,
            paymentsCount: 1
          });

          logger.merchant('stats_updated', updatedPayment.merchantId, {
            paymentId: updatedPayment.paymentId,
            amount: updatedPayment.amount,
            fee: updatedPayment.fee
          });
        } else {
          logger.warn('Payment not succeeded, skipping merchant stats update', {
            paymentId: paymentIntent.id,
            status: updatedPayment?.status
          });
        }
      } catch (error) {
        logger.error('Error updating merchant stats', error, {
          paymentId: paymentIntent.id,
          merchantId: paymentIntent.merchantId
        });
      }
    }, 4000); // Wait a bit after payment processing completes
  }
}

module.exports = PaymentController;