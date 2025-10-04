/**
 * Transaction Controller
 * Handles transaction history and statistics endpoints
 */

const TransactionService = require('../services/transactionService');
const ApiKeyService = require('../services/apiKeyService');
const logger = require('../utils/logger');
const { ErrorFactory } = require('../utils/errors');

class TransactionController {
  constructor() {
    this.transactionService = new TransactionService();
    this.apiKeyService = new ApiKeyService();
  }

  /**
   * Get all transactions with optional filtering
   */
  async getTransactions(req, res) {
    const requestId = req.requestId || 'unknown';

    try {
      // Get merchant ID from API key
      const apiKey = req.apiKeyInfo?.key || req.headers.authorization?.replace('Bearer ', '');
      const merchantId = this.apiKeyService.getMerchantFromApiKey(apiKey);

      if (!merchantId) {
        throw ErrorFactory.authentication('Invalid API key or merchant not found');
      }

      // Build filters
      const filters = {
        merchantId: merchantId // Only show transactions for this merchant
      };

      // Add status filter if provided
      if (req.query.status) {
        filters.status = req.query.status;
      }

      const transactions = this.transactionService.getTransactions(filters);

      logger.info('Transactions retrieved', {
        requestId,
        merchantId,
        count: transactions.length,
        filters
      });

      res.json({
        success: true,
        data: transactions,
        count: transactions.length
      });

    } catch (error) {
      logger.error('Failed to get transactions', error, {
        requestId,
        query: req.query
      });

      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
          requestId
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        requestId
      });
    }
  }

  /**
   * Get specific transaction by ID
   */
  async getTransactionById(req, res) {
    const requestId = req.requestId || 'unknown';
    const { id } = req.params;

    try {
      // Get merchant ID from API key
      const apiKey = req.apiKeyInfo?.key || req.headers.authorization?.replace('Bearer ', '');
      const merchantId = this.apiKeyService.getMerchantFromApiKey(apiKey);

      if (!merchantId) {
        throw ErrorFactory.authentication('Invalid API key or merchant not found');
      }

      const transaction = this.transactionService.getTransactionById(id);

      // Check if transaction belongs to this merchant
      if (transaction.merchantId !== merchantId) {
        throw ErrorFactory.forbidden('Access denied to this transaction');
      }

      logger.info('Transaction retrieved by ID', {
        requestId,
        transactionId: id,
        merchantId
      });

      res.json({
        success: true,
        data: transaction
      });

    } catch (error) {
      logger.error('Failed to get transaction by ID', error, {
        requestId,
        transactionId: id
      });

      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Transaction not found',
          requestId
        });
      }

      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
          requestId
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        requestId
      });
    }
  }

  /**
   * Get transaction statistics
   */
  async getTransactionStats(req, res) {
    const requestId = req.requestId || 'unknown';

    try {
      // Get merchant ID from API key
      const apiKey = req.apiKeyInfo?.key || req.headers.authorization?.replace('Bearer ', '');
      const merchantId = this.apiKeyService.getMerchantFromApiKey(apiKey);

      if (!merchantId) {
        throw ErrorFactory.authentication('Invalid API key or merchant not found');
      }

      const stats = this.transactionService.getTransactionStats(merchantId);

      logger.info('Transaction stats retrieved', {
        requestId,
        merchantId,
        stats
      });

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logger.error('Failed to get transaction stats', error, {
        requestId
      });

      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
          requestId
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        requestId
      });
    }
  }
}

module.exports = TransactionController;