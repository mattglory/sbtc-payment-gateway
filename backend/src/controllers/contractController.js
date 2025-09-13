/**
 * Contract Controller
 * Production-ready Stacks blockchain contract interactions with monitoring
 */

const ContractService = require('../services/contractService');
const logger = require('../utils/logger');
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
      logger.info('Contract info request started', {
        requestId,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Get contract information
      const contractInfo = await this.contractService.getContractInfo();
      
      // Log successful retrieval
      logger.info('Contract info retrieved successfully', {
        requestId,
        contractAddress: contractInfo.contractAddress,
        contractName: contractInfo.contractName
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
      const genericError = ErrorFactory.internal('Failed to retrieve contract information');
      res.status(500).json({
        ...genericError.toJSON(),
        requestId,
        ...(process.env.NODE_ENV === 'development' && { originalError: error.message })
      });
    }
  }

  /**
   * Get contract statistics with comprehensive monitoring
   */
  async getStats(req, res) {
    const requestId = req.requestId || 'unknown';
    
    try {
      // Performance monitoring
      performanceMonitor.start('contract_stats');
      
      // Log request details
      logger.info('Contract stats request started', {
        requestId,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Get contract statistics
      const stats = await this.contractService.getContractStats();
      
      // Log successful retrieval
      logger.info('Contract stats retrieved successfully', {
        requestId,
        totalMerchants: stats.totalMerchants,
        totalPayments: stats.totalPayments,
        totalVolume: stats.totalVolume
      });

      // Record performance metrics
      const performanceResult = performanceMonitor.end('contract_stats');
      if (performanceResult && performanceResult.duration > 1000) {
        logger.performance('Slow contract stats retrieval', performanceResult.duration, {
          requestId
        });
      }
      
      res.json(stats);

    } catch (error) {
      // End performance monitoring
      performanceMonitor.end('contract_stats');
      
      // Log error with context
      logger.error('Contract stats retrieval failed', error, {
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
      const genericError = ErrorFactory.internal('Failed to retrieve contract statistics');
      res.status(500).json({
        ...genericError.toJSON(),
        requestId,
        ...(process.env.NODE_ENV === 'development' && { originalError: error.message })
      });
    }
  }

  /**
   * Get payment status from smart contract
   */
  async getPaymentStatus(req, res) {
    const requestId = req.requestId || 'unknown';
    const { paymentId } = req.params;
    
    try {
      // Performance monitoring
      performanceMonitor.start('contract_payment_status');
      
      // Log request details
      logger.info('Contract payment status request started', {
        requestId,
        paymentId,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Get payment status from contract
      const status = await this.contractService.getPaymentStatus(paymentId);
      
      // Log successful retrieval
      logger.info('Contract payment status retrieved successfully', {
        requestId,
        paymentId,
        status: status.status,
        isValid: status.isValid
      });

      // Record performance metrics
      const performanceResult = performanceMonitor.end('contract_payment_status');
      if (performanceResult && performanceResult.duration > 500) {
        logger.performance('Slow contract payment status retrieval', performanceResult.duration, {
          requestId,
          paymentId
        });
      }
      
      res.json(status);

    } catch (error) {
      // End performance monitoring
      performanceMonitor.end('contract_payment_status');
      
      // Log error with context
      logger.error('Contract payment status retrieval failed', error, {
        requestId,
        paymentId,
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
      const genericError = ErrorFactory.internal('Failed to retrieve payment status');
      res.status(500).json({
        ...genericError.toJSON(),
        requestId,
        ...(process.env.NODE_ENV === 'development' && { originalError: error.message })
      });
    }
  }
}

module.exports = ContractController;