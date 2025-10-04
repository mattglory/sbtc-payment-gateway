/**
 * Transaction Service
 * Manages transaction history and logging for the payment gateway
 */

const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class TransactionService {
  constructor() {
    // In-memory transaction storage
    this.transactions = [];
  }

  /**
   * Log a new transaction
   */
  logTransaction(transactionData) {
    try {
      const transaction = {
        id: uuidv4(),
        merchantId: transactionData.merchantId,
        amount: transactionData.amount,
        status: transactionData.status || 'pending',
        description: transactionData.description || '',
        timestamp: new Date().toISOString(),
        paymentIntentId: transactionData.paymentIntentId,
        txId: transactionData.txId || null,
        metadata: transactionData.metadata || {}
      };

      this.transactions.push(transaction);

      logger.info('Transaction logged', {
        transactionId: transaction.id,
        merchantId: transaction.merchantId,
        amount: transaction.amount,
        status: transaction.status
      });

      return transaction;
    } catch (error) {
      logger.error('Failed to log transaction', error);
      throw error;
    }
  }

  /**
   * Update transaction status
   */
  updateTransactionStatus(transactionId, status, additionalData = {}) {
    try {
      const transaction = this.transactions.find(t => t.id === transactionId);

      if (!transaction) {
        throw new Error(`Transaction ${transactionId} not found`);
      }

      transaction.status = status;
      transaction.updatedAt = new Date().toISOString();

      // Add any additional data
      Object.assign(transaction, additionalData);

      logger.info('Transaction status updated', {
        transactionId,
        oldStatus: transaction.status,
        newStatus: status
      });

      return transaction;
    } catch (error) {
      logger.error('Failed to update transaction status', error);
      throw error;
    }
  }

  /**
   * Get all transactions with optional filtering
   */
  getTransactions(filters = {}) {
    try {
      let filteredTransactions = [...this.transactions];

      // Filter by status
      if (filters.status) {
        filteredTransactions = filteredTransactions.filter(t => t.status === filters.status);
      }

      // Filter by merchant
      if (filters.merchantId) {
        filteredTransactions = filteredTransactions.filter(t => t.merchantId === filters.merchantId);
      }

      // Sort by timestamp (newest first)
      filteredTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      return filteredTransactions;
    } catch (error) {
      logger.error('Failed to get transactions', error);
      throw error;
    }
  }

  /**
   * Get transaction by ID
   */
  getTransactionById(transactionId) {
    try {
      const transaction = this.transactions.find(t => t.id === transactionId);

      if (!transaction) {
        throw new Error(`Transaction ${transactionId} not found`);
      }

      return transaction;
    } catch (error) {
      logger.error('Failed to get transaction by ID', error);
      throw error;
    }
  }

  /**
   * Get transaction statistics
   */
  getTransactionStats(merchantId = null) {
    try {
      let transactions = this.transactions;

      if (merchantId) {
        transactions = transactions.filter(t => t.merchantId === merchantId);
      }

      const total = transactions.length;
      const completed = transactions.filter(t => t.status === 'completed').length;
      const pending = transactions.filter(t => t.status === 'pending').length;
      const failed = transactions.filter(t => t.status === 'failed').length;

      const totalRevenue = transactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

      const successRate = total > 0 ? (completed / total) * 100 : 0;

      return {
        total,
        completed,
        pending,
        failed,
        totalRevenue,
        successRate: Math.round(successRate * 100) / 100
      };
    } catch (error) {
      logger.error('Failed to get transaction stats', error);
      throw error;
    }
  }
}

module.exports = TransactionService;