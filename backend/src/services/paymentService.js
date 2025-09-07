/**
 * Payment Service
 * Business logic for payment operations with real Stacks blockchain integration
 */

const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const StacksService = require('./stacksService');
const logger = require('../utils/logger');
const { ErrorFactory } = require('../utils/errors');

class PaymentService {
  constructor() {
    // Database storage (implement proper database in production)
    this.payments = new Map();
    this.stacksService = new StacksService();
    
    // Start transaction monitoring
    this.startTransactionMonitoring();
  }

  /**
   * Create payment intent with blockchain integration
   */
  async createPaymentIntent(merchantId, { amount, description, currency = 'BTC' }) {
    try {
      const requestId = uuidv4().substring(0, 8);
      const timestamp = new Date().toISOString();
      
      logger.info('Creating payment intent', {
        requestId,
        merchantId,
        amount,
        description,
        currency
      });

      // Validation
      if (!amount || typeof amount !== 'number' || amount <= 0) {
        throw ErrorFactory.validation('Amount must be a positive number in satoshis');
      }

      if (!merchantId) {
        throw ErrorFactory.validation('Merchant ID is required');
      }

      // Generate payment intent
      const paymentId = `pi_${uuidv4()}`;
      const intentId = uuidv4();
      const amountInSats = Math.floor(amount);
      const FEE_PERCENTAGE = 0.025; // 2.5% processing fee
      const fee = Math.floor(amountInSats * FEE_PERCENTAGE);
      
      const paymentIntent = {
        id: intentId,
        paymentId,
        merchantId,
        amount: amountInSats,
        fee,
        currency,
        description: description || 'Payment',
        status: 'requires_payment_method',
        clientSecret: `${paymentId}_secret_${crypto.randomBytes(16).toString('hex')}`,
        createdAt: timestamp,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        blockchainTxId: null,
        blockchainStatus: 'pending',
        metadata: { requestId }
      };

      // Create payment intent on blockchain
      try {
        const blockchainResult = await this.stacksService.createPaymentIntent(
          paymentId,
          amountInSats,
          merchantId,
          description
        );
        
        paymentIntent.blockchainTxId = blockchainResult.txId;
        paymentIntent.blockchainStatus = blockchainResult.blockchainStatus;
        
        logger.info('Payment intent created on blockchain', {
          paymentId,
          txId: blockchainResult.txId
        });
      } catch (blockchainError) {
        logger.error('Failed to create payment intent on blockchain', blockchainError, {
          paymentId,
          merchantId
        });
        
        // Continue without blockchain for now, mark as off-chain
        paymentIntent.blockchainStatus = 'off-chain';
        paymentIntent.blockchainError = blockchainError.message;
      }

      // Store payment intent
      this.payments.set(intentId, paymentIntent);
      
      logger.info('Payment intent created successfully', {
        intentId,
        paymentId,
        blockchainStatus: paymentIntent.blockchainStatus
      });

      return {
        id: paymentIntent.id,
        paymentId: paymentIntent.paymentId,
        amount: paymentIntent.amount,
        fee: paymentIntent.fee,
        currency: paymentIntent.currency,
        description: paymentIntent.description,
        status: paymentIntent.status,
        clientSecret: paymentIntent.clientSecret,
        createdAt: paymentIntent.createdAt,
        expiresAt: paymentIntent.expiresAt,
        blockchainTxId: paymentIntent.blockchainTxId,
        blockchainStatus: paymentIntent.blockchainStatus
      };
    } catch (error) {
      logger.error('Failed to create payment intent', error, { merchantId, amount });
      throw error;
    }
  }

  /**
   * Confirm payment with real blockchain processing
   */
  async confirmPayment(paymentId, { customerAddress, transactionId }) {
    try {
      const paymentIntent = this.payments.get(paymentId);
      if (!paymentIntent) {
        throw ErrorFactory.notFound('Payment intent', paymentId);
      }

      // Check if payment has expired
      if (new Date() > new Date(paymentIntent.expiresAt)) {
        throw ErrorFactory.validation('Payment intent has expired');
      }

      // Validate Stacks address
      if (customerAddress && !this.stacksService.isValidStacksAddress(customerAddress)) {
        throw ErrorFactory.validation('Invalid Stacks address format');
      }

      // Update payment status
      paymentIntent.status = 'processing';
      paymentIntent.customerAddress = customerAddress;
      paymentIntent.customerTransactionId = transactionId;
      paymentIntent.processingStartedAt = new Date().toISOString();

      logger.info('Payment confirmation started', {
        paymentId: paymentIntent.paymentId,
        customerAddress,
        transactionId
      });

      // Process payment on blockchain if we have a customer address
      if (customerAddress) {
        try {
          const blockchainResult = await this.stacksService.processPayment(
            paymentIntent.paymentId,
            customerAddress,
            paymentIntent.amount
          );
          
          paymentIntent.processingTxId = blockchainResult.txId;
          paymentIntent.blockchainStatus = 'processing';
          
          logger.info('Payment processing initiated on blockchain', {
            paymentId: paymentIntent.paymentId,
            processingTxId: blockchainResult.txId
          });
          
          // Start monitoring this transaction
          this.monitorTransaction(paymentId, blockchainResult.txId);
          
        } catch (blockchainError) {
          logger.error('Failed to process payment on blockchain', blockchainError, {
            paymentId: paymentIntent.paymentId,
            customerAddress
          });
          
          paymentIntent.status = 'requires_payment_method';
          paymentIntent.blockchainError = blockchainError.message;
          throw blockchainError;
        }
      }

      return {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        customerAddress,
        transactionId,
        processingTxId: paymentIntent.processingTxId,
        message: 'Payment is being processed on the Stacks blockchain'
      };
    } catch (error) {
      logger.error('Failed to confirm payment', error, { paymentId });
      throw error;
    }
  }

  /**
   * Get detailed payment intent information
   */
  async getPaymentIntent(paymentId) {
    try {
      const paymentIntent = this.payments.get(paymentId);
      
      if (!paymentIntent) {
        throw ErrorFactory.notFound('Payment intent', paymentId);
      }

      // Update blockchain status if we have a transaction ID
      if (paymentIntent.blockchainTxId || paymentIntent.processingTxId) {
        await this.updateBlockchainStatus(paymentIntent);
      }

      return {
        id: paymentIntent.id,
        paymentId: paymentIntent.paymentId,
        amount: paymentIntent.amount,
        fee: paymentIntent.fee,
        currency: paymentIntent.currency,
        description: paymentIntent.description,
        status: paymentIntent.status,
        createdAt: paymentIntent.createdAt,
        expiresAt: paymentIntent.expiresAt,
        customerAddress: paymentIntent.customerAddress,
        transactionId: paymentIntent.customerTransactionId,
        blockchainTxId: paymentIntent.blockchainTxId,
        processingTxId: paymentIntent.processingTxId,
        blockchainStatus: paymentIntent.blockchainStatus,
        processingStartedAt: paymentIntent.processingStartedAt,
        succeededAt: paymentIntent.succeededAt,
        failedAt: paymentIntent.failedAt,
        blockchainError: paymentIntent.blockchainError
      };
    } catch (error) {
      logger.error('Failed to get payment intent', error, { paymentId });
      throw error;
    }
  }

  /**
   * Create a new payment intent
   */
  async create(paymentData) {
    this.payments.set(paymentData.id, paymentData);
    return paymentData;
  }

  /**
   * Find payment by ID
   */
  async findById(paymentId) {
    return this.payments.get(paymentId);
  }

  /**
   * Find payments by merchant ID
   */
  async findByMerchantId(merchantId) {
    return [...this.payments.values()].filter(p => p.merchantId === merchantId);
  }

  /**
   * Update payment
   */
  async update(paymentId, updateData) {
    try {
      // Input validation
      if (!paymentId) {
        throw ErrorFactory.validation('Payment ID is required');
      }
      
      if (!updateData || typeof updateData !== 'object') {
        throw ErrorFactory.validation('Valid update data is required');
      }

      const existingPayment = this.payments.get(paymentId);
      if (!existingPayment) {
        throw ErrorFactory.notFound('Payment', paymentId);
      }
      
      const updatedPayment = { ...existingPayment, ...updateData };
      this.payments.set(paymentId, updatedPayment);
      
      logger.debug('Payment updated successfully', {
        paymentId,
        updatedFields: Object.keys(updateData)
      });
      
      return updatedPayment;
    } catch (error) {
      logger.error('Failed to update payment', error, { paymentId, updateData });
      throw error;
    }
  }

  /**
   * Find payments by status
   */
  async findByStatus(status) {
    return [...this.payments.values()].filter(p => p.status === status);
  }

  /**
   * Find expired payments
   */
  async findExpired() {
    const now = new Date();
    return [...this.payments.values()].filter(p => 
      new Date(p.expiresAt) < now && p.status === 'requires_payment_method'
    );
  }

  /**
   * Mark expired payments
   */
  async markExpiredPayments() {
    try {
      const expiredPayments = await this.findExpired();
      let markedCount = 0;
      
      for (const payment of expiredPayments) {
        try {
          await this.update(payment.id, {
            status: 'expired',
            expiredAt: new Date().toISOString()
          });
          markedCount++;
        } catch (error) {
          logger.error('Failed to mark payment as expired', error, {
            paymentId: payment.id
          });
        }
      }
      
      if (markedCount > 0) {
        logger.info('Marked expired payments', {
          totalExpired: expiredPayments.length,
          successfullyMarked: markedCount
        });
      }
      
      return markedCount;
    } catch (error) {
      logger.error('Failed to mark expired payments', error);
      throw error;
    }
  }

  /**
   * Get payment statistics
   */
  async getStats() {
    const allPayments = [...this.payments.values()];
    const totalAmount = allPayments
      .filter(p => p.status === 'succeeded')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const totalFees = allPayments
      .filter(p => p.status === 'succeeded')
      .reduce((sum, p) => sum + p.fee, 0);

    return {
      totalPayments: allPayments.length,
      succeededPayments: allPayments.filter(p => p.status === 'succeeded').length,
      failedPayments: allPayments.filter(p => p.status === 'payment_failed').length,
      processingPayments: allPayments.filter(p => p.status === 'processing').length,
      expiredPayments: allPayments.filter(p => p.status === 'expired').length,
      totalAmount,
      totalFees,
      averageAmount: allPayments.length > 0 ? totalAmount / allPayments.length : 0
    };
  }

  /**
   * Delete payment (admin function)
   */
  async delete(paymentId) {
    return this.payments.delete(paymentId);
  }

  /**
   * Get all payments (admin function)
   */
  async findAll(limit = 100, offset = 0) {
    const allPayments = [...this.payments.values()]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return {
      payments: allPayments.slice(offset, offset + limit),
      total: allPayments.length,
      limit,
      offset
    };
  }

  /**
   * Update blockchain status for a payment intent
   */
  async updateBlockchainStatus(paymentIntent) {
    try {
      const txId = paymentIntent.processingTxId || paymentIntent.blockchainTxId;
      if (!txId) return;

      const status = await this.stacksService.getTransactionStatus(txId);
      
      if (status.isConfirmed && paymentIntent.status === 'processing') {
        paymentIntent.status = 'succeeded';
        paymentIntent.succeededAt = new Date().toISOString();
        paymentIntent.blockchainStatus = 'confirmed';
        
        logger.info('Payment confirmed on blockchain', {
          paymentId: paymentIntent.paymentId,
          txId
        });
      } else if (status.isFailed && paymentIntent.status === 'processing') {
        paymentIntent.status = 'payment_failed';
        paymentIntent.failedAt = new Date().toISOString();
        paymentIntent.blockchainStatus = 'failed';
        
        logger.error('Payment failed on blockchain', {
          paymentId: paymentIntent.paymentId,
          txId
        });
      } else if (status.isPending) {
        paymentIntent.blockchainStatus = 'pending';
      }
    } catch (error) {
      logger.error('Failed to update blockchain status', error, {
        paymentId: paymentIntent.paymentId
      });
    }
  }

  /**
   * Monitor a specific transaction
   */
  async monitorTransaction(paymentId, txId) {
    try {
      logger.info('Starting transaction monitoring', { paymentId, txId });
      
      // Monitor in background
      this.stacksService.waitForTransactionConfirmation(txId, 30, 10000)
        .then(result => {
          const paymentIntent = this.payments.get(paymentId);
          if (!paymentIntent) return;

          if (result.confirmed) {
            paymentIntent.status = 'succeeded';
            paymentIntent.succeededAt = new Date().toISOString();
            paymentIntent.blockchainStatus = 'confirmed';
            
            logger.info('Payment monitoring: Transaction confirmed', {
              paymentId,
              txId
            });
          } else if (result.failed) {
            paymentIntent.status = 'payment_failed';
            paymentIntent.failedAt = new Date().toISOString();
            paymentIntent.blockchainStatus = 'failed';
            
            logger.error('Payment monitoring: Transaction failed', {
              paymentId,
              txId
            });
          } else if (result.timeout) {
            logger.warn('Payment monitoring: Transaction timeout', {
              paymentId,
              txId,
              attempts: result.attempts
            });
          }
        })
        .catch(error => {
          logger.error('Payment monitoring error', error, {
            paymentId,
            txId
          });
        });
    } catch (error) {
      logger.error('Failed to start transaction monitoring', error, {
        paymentId,
        txId
      });
    }
  }

  /**
   * Start periodic transaction monitoring for pending payments
   */
  startTransactionMonitoring() {
    setInterval(async () => {
      try {
        const processingPayments = [...this.payments.values()].filter(
          p => p.status === 'processing' && (p.blockchainTxId || p.processingTxId)
        );

        for (const payment of processingPayments) {
          await this.updateBlockchainStatus(payment);
        }
      } catch (error) {
        logger.error('Error in transaction monitoring loop', error);
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Get blockchain network information
   */
  getBlockchainInfo() {
    return this.stacksService.getNetworkInfo();
  }

  /**
   * Validate transaction on blockchain
   */
  async validateTransaction(txId) {
    try {
      return await this.stacksService.getTransactionStatus(txId);
    } catch (error) {
      logger.error('Failed to validate transaction', error, { txId });
      throw ErrorFactory.blockchain(`Failed to validate transaction: ${error.message}`);
    }
  }
}

module.exports = PaymentService;