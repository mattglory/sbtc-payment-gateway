/**
 * Contract Controller
 * Production-ready Stacks blockchain contract interactions with monitoring
 */

const ContractService = require('../services/contractService');
const logger = require('../utils/logger');
const { Validator } = require('../utils/validation');
const { ErrorFactory } = require('../utils/errors');
const { performanceMonitor } = require('../utils/monitoring');

class ContractController {
  constructor() {
    this.contractService = new ContractService();
  }

  /**
   * Get contract information with comprehensive logging
   */
  async getInfo(req, res) {
    const requestId = req.requestId || 'unknown';
    
    try {
      // Performance monitoring
      performanceMonitor.start('contract_info');
      
      // Log request details
      logger.contract('get_info_start', null, {
        requestId,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Get contract information
      const contractInfo = this.contractService.getContractInfo();
      
      // Log successful retrieval
      logger.contract('get_info_success', null, {
        requestId,
        contractAddress: contractInfo.address
      });

      // Record performance metrics
      const performanceResult = performanceMonitor.end('contract_info');
      if (performanceResult && performanceResult.duration > 200) {
        logger.performance('Slow contract info retrieval', performanceResult.duration, {
          requestId
        });
      }
      
      res.json(contractInfo);

    } catch (error) {
      // End performance monitoring
      performanceMonitor.end('contract_info');
      
      // Log error with context
      logger.error('Contract info retrieval failed', error, {
        requestId,
        ip: req.ip
      });

      // Handle different error types
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          ...error.toJSON(),
          requestId
        });
      }
      
      // Generic error response
      const genericError = ErrorFactory.internal('Failed to retrieve contract information');
      res.status(500).json({
        ...genericError.toJSON(),
        requestId,
        ...(process.env.NODE_ENV === 'development' && { originalError: error.message })
      });
    }
  }

  /**
   * Create smart contract payment intent with comprehensive validation
   */
  async createPayment(req, res) {
    const requestId = req.requestId || 'unknown';
    
    try {
      // Performance monitoring
      performanceMonitor.start('contract_payment_creation');
      
      // Log request details
      logger.contract('create_payment_start', null, {
        requestId,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        amount: req.body?.amount
      });

      // Validate input data
      const validatedData = Validator.validateContractPayment(req.body);
      
      // Create contract payment
      const result = await this.contractService.createPayment(validatedData);
      
      // Log successful creation
      logger.contract('create_payment_success', result.id, {
        requestId,
        amount: result.amount,
        recipient: result.recipient
      });

      // Record performance metrics
      const performanceResult = performanceMonitor.end('contract_payment_creation');
      if (performanceResult && performanceResult.duration > 3000) {
        logger.performance('Slow contract payment creation', performanceResult.duration, {
          requestId,
          paymentId: result.id
        });
      }
      
      res.json(result);

    } catch (error) {
      // End performance monitoring
      performanceMonitor.end('contract_payment_creation');
      
      // Log error with context
      logger.error('Contract payment creation failed', error, {
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
        const validationError = ErrorFactory.validation('Missing required fields for contract payment');
        return res.status(400).json({
          ...validationError.toJSON(),
          requestId
        });
      }
      
      // Generic error response
      const genericError = ErrorFactory.internal('Failed to create contract payment');
      res.status(500).json({
        ...genericError.toJSON(),
        requestId,
        ...(process.env.NODE_ENV === 'development' && { originalError: error.message })
      });
    }
  }

  /**
   * Process smart contract payment with comprehensive monitoring
   */
  async processPayment(req, res) {
    const requestId = req.requestId || 'unknown';
    
    try {
      // Performance monitoring
      performanceMonitor.start('contract_payment_processing');
      
      // Log request details
      logger.contract('process_payment_start', req.body?.paymentId, {
        requestId,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        paymentId: req.body?.paymentId
      });

      // Validate input data
      const validatedData = Validator.validateContractPaymentProcessing(req.body);
      
      // Process contract payment
      const result = await this.contractService.processPayment(validatedData);
      
      // Log successful processing
      logger.contract('process_payment_success', result.paymentId, {
        requestId,
        paymentId: result.paymentId,
        status: result.status,
        transactionId: result.transactionId
      });

      // Record performance metrics
      const performanceResult = performanceMonitor.end('contract_payment_processing');
      if (performanceResult && performanceResult.duration > 5000) {
        logger.performance('Slow contract payment processing', performanceResult.duration, {
          requestId,
          paymentId: result.paymentId
        });
      }
      
      res.json(result);

    } catch (error) {
      // End performance monitoring
      performanceMonitor.end('contract_payment_processing');
      
      // Log error with context
      logger.error('Contract payment processing failed', error, {
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
        const validationError = ErrorFactory.validation('Missing required fields for payment processing');
        return res.status(400).json({
          ...validationError.toJSON(),
          requestId
        });
      }
      
      // Generic error response
      const genericError = ErrorFactory.internal('Failed to process contract payment');
      res.status(500).json({
        ...genericError.toJSON(),
        requestId,
        ...(process.env.NODE_ENV === 'development' && { originalError: error.message })
      });
    }
  }

  /**
   * Register merchant on smart contract with comprehensive validation
   */
  async registerMerchant(req, res) {
    const requestId = req.requestId || 'unknown';
    
    try {
      // Performance monitoring
      performanceMonitor.start('contract_merchant_registration');
      
      // Log request details
      logger.contract('register_merchant_start', null, {
        requestId,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        merchantAddress: req.body?.merchantAddress
      });

      // Validate input data
      const validatedData = Validator.validateContractMerchantRegistration(req.body);
      
      // Register merchant on contract
      const result = await this.contractService.registerMerchant(validatedData);
      
      // Log successful registration
      logger.contract('register_merchant_success', result.merchantId, {
        requestId,
        merchantId: result.merchantId,
        merchantAddress: result.merchantAddress,
        transactionId: result.transactionId
      });

      // Record performance metrics
      const performanceResult = performanceMonitor.end('contract_merchant_registration');
      if (performanceResult && performanceResult.duration > 3000) {
        logger.performance('Slow contract merchant registration', performanceResult.duration, {
          requestId,
          merchantId: result.merchantId
        });
      }
      
      res.json(result);

    } catch (error) {
      // End performance monitoring
      performanceMonitor.end('contract_merchant_registration');
      
      // Log error with context
      logger.error('Contract merchant registration failed', error, {
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
      
      // Generic error response
      const genericError = ErrorFactory.internal('Failed to register merchant on contract');
      res.status(500).json({
        ...genericError.toJSON(),
        requestId,
        ...(process.env.NODE_ENV === 'development' && { originalError: error.message })
      });
    }
  }
}

module.exports = ContractController;