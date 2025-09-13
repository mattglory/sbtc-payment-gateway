/**
 * Payment Service
 * Business logic for payment operations with PostgreSQL persistence and Stacks blockchain integration
 */

const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const StacksService = require('./stacksService');
const BitcoinService = require('./bitcoinService');
const database = require('../config/database');
const logger = require('../utils/logger');
const { ErrorFactory } = require('../utils/errors');

class PaymentService {
  constructor() {
    this.stacksService = new StacksService();
    this.bitcoinService = new BitcoinService();
    
    // Start transaction monitoring
    this.startTransactionMonitoring();
  }

  /**
   * Create payment intent with blockchain integration and database persistence
   */
  async createPaymentIntent(merchantId, { amount, description, currency = 'BTC' }) {
    try {
      const requestId = uuidv4().substring(0, 8);
      const timestamp = new Date();
      
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

      // Verify merchant exists and is active
      const merchant = await this.getMerchant(merchantId);
      if (!merchant) {
        throw ErrorFactory.validation('Invalid merchant ID');
      }
      if (!merchant.is_active) {
        throw ErrorFactory.validation('Merchant account is inactive');
      }

      // Generate payment intent
      const paymentId = `pi_${uuidv4()}`;
      const intentId = uuidv4();
      const amountInSats = Math.floor(amount);
      const FEE_PERCENTAGE = 0.025; // 2.5% processing fee
      const fee = Math.floor(amountInSats * FEE_PERCENTAGE);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      const paymentIntent = {
        id: intentId,
        paymentId,
        merchantId,
        amount: amountInSats,
        fee,
        currency,
        description: description || 'Payment',
        status: 'pending',
        clientSecret: `${paymentId}_secret_${crypto.randomBytes(16).toString('hex')}`,
        createdAt: timestamp,
        expiresAt: expiresAt,
        blockchainTxId: null,
        blockchainStatus: 'pending',
        metadata: { requestId }
      };

      // Create payment intent on blockchain
      try {
        const blockchainResult = await this.stacksService.createPaymentIntent(
          paymentId,
          amountInSats,
          description,
          144 // expires in 144 blocks (~24 hours)
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

      // Store payment intent in database
      const savedPayment = await this.create(paymentIntent);
      
      // Generate Bitcoin deposit address for Bitcoin → sBTC flow
      let bitcoinDepositInfo = null;
      try {
        bitcoinDepositInfo = await this.bitcoinService.generateDepositAddress(paymentId, merchantId);
        
        logger.info('Bitcoin deposit address generated for payment intent', {
          paymentId,
          bitcoinAddress: bitcoinDepositInfo.address,
          network: bitcoinDepositInfo.network
        });
      } catch (bitcoinError) {
        logger.error('Failed to generate Bitcoin deposit address', bitcoinError, { paymentId });
        // Continue without Bitcoin address - payment can still work with direct sBTC
      }
      
      // Log payment event
      await this.logPaymentEvent(paymentId, 'payment_intent_created', {
        amount: amountInSats,
        fee,
        merchantId,
        blockchainTxId: paymentIntent.blockchainTxId,
        bitcoinAddress: bitcoinDepositInfo?.address
      });
      
      logger.info('Payment intent created successfully', {
        intentId,
        paymentId,
        blockchainStatus: paymentIntent.blockchainStatus,
        hasBitcoinAddress: !!bitcoinDepositInfo
      });

      const response = {
        id: savedPayment.id,
        paymentId: savedPayment.payment_id,
        amount: savedPayment.amount_in_sats,
        fee: savedPayment.fee_amount,
        currency: savedPayment.currency,
        description: savedPayment.description,
        status: savedPayment.status,
        clientSecret: paymentIntent.clientSecret,
        createdAt: savedPayment.created_at,
        expiresAt: savedPayment.expires_at,
        blockchainTxId: savedPayment.stacks_tx_id,
        blockchainStatus: savedPayment.blockchain_status
      };

      // Add Bitcoin deposit information if available
      if (bitcoinDepositInfo) {
        response.bitcoin = {
          depositAddress: bitcoinDepositInfo.address,
          network: bitcoinDepositInfo.network,
          addressType: bitcoinDepositInfo.addressType,
          qrCode: bitcoinDepositInfo.qrCode,
          explorerUrl: bitcoinDepositInfo.explorerUrl,
          instructions: {
            step1: `Send Bitcoin to: ${bitcoinDepositInfo.address}`,
            step2: `Wait for ${this.bitcoinService.confirmationsRequired} confirmations`,
            step3: 'sBTC will be minted automatically after confirmation',
            amount: `${amountInSats / 100000000} BTC (${amountInSats} satoshis)`
          }
        };
      }

      return response;
    } catch (error) {
      logger.error('Failed to create payment intent', error, { merchantId, amount });
      throw error;
    }
  }

  /**
   * Confirm payment with real blockchain processing
   */
  async confirmPayment(paymentId, { customerAddress, transactionId }) {
    return database.transaction(async (client) => {
      try {
        // Get payment intent with row lock
        const result = await client.query(
          'SELECT * FROM payments WHERE payment_id = $1 FOR UPDATE',
          [paymentId]
        );

        if (result.rows.length === 0) {
          throw ErrorFactory.notFound('Payment intent', paymentId);
        }

        const payment = result.rows[0];

        // Check if payment has expired
        if (new Date() > new Date(payment.expires_at)) {
          throw ErrorFactory.validation('Payment intent has expired');
        }

        // Validate Stacks address
        if (customerAddress && !this.stacksService.isValidStacksAddress(customerAddress)) {
          throw ErrorFactory.validation('Invalid Stacks address format');
        }

        // Update payment status
        await client.query(
          'UPDATE payments SET status = $1, customer_address = $2, updated_at = CURRENT_TIMESTAMP WHERE payment_id = $3',
          ['processing', customerAddress, paymentId]
        );

        logger.info('Payment confirmation started', {
          paymentId,
          customerAddress,
          transactionId
        });

        let processingTxId = null;

        // Process payment on blockchain if we have a customer address
        if (customerAddress) {
          try {
            const blockchainResult = await this.stacksService.processPayment(
              paymentId,
              customerAddress
            );
            
            processingTxId = blockchainResult.txId;
            
            // Update blockchain processing info
            await client.query(
              'UPDATE payments SET stacks_tx_id = $1, blockchain_status = $2, updated_at = CURRENT_TIMESTAMP WHERE payment_id = $3',
              [processingTxId, 'processing', paymentId]
            );
            
            logger.info('Payment processing initiated on blockchain', {
              paymentId,
              processingTxId
            });
            
            // Start monitoring this transaction
            this.monitorTransaction(paymentId, processingTxId);
            
          } catch (blockchainError) {
            logger.error('Failed to process payment on blockchain', blockchainError, {
              paymentId,
              customerAddress
            });
            
            // Revert status
            await client.query(
              'UPDATE payments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE payment_id = $2',
              ['pending', paymentId]
            );
            
            throw blockchainError;
          }
        }

        // Log payment event
        await this.logPaymentEvent(paymentId, 'payment_processing_started', {
          customerAddress,
          processingTxId,
          transactionId
        });

        return {
          id: payment.id,
          status: 'processing',
          amount: payment.amount_in_sats,
          customerAddress,
          transactionId,
          processingTxId,
          message: 'Payment is being processed on the Stacks blockchain'
        };
      } catch (error) {
        logger.error('Failed to confirm payment', error, { paymentId });
        throw error;
      }
    });
  }

  /**
   * Get detailed payment intent information with Bitcoin status
   */
  async getPaymentIntent(paymentId) {
    try {
      const result = await database.query(
        'SELECT * FROM payments WHERE payment_id = $1',
        [paymentId]
      );
      
      if (result.rows.length === 0) {
        throw ErrorFactory.notFound('Payment intent', paymentId);
      }

      const payment = result.rows[0];

      // Update blockchain status if we have a transaction ID
      if (payment.stacks_tx_id && payment.status === 'processing') {
        await this.updateBlockchainStatus(payment);
        
        // Fetch updated payment data
        const updatedResult = await database.query(
          'SELECT * FROM payments WHERE payment_id = $1',
          [paymentId]
        );
        const updatedPayment = updatedResult.rows[0];
        payment = updatedPayment;
      }

      // Get Bitcoin deposit information if available
      const bitcoinInfo = await this.bitcoinService.getPaymentBitcoinAddress(paymentId);
      let bitcoinStatus = null;

      if (bitcoinInfo) {
        // Get current Bitcoin monitoring status
        const monitoringResult = await this.bitcoinService.monitorAddress(paymentId, bitcoinInfo.address);
        
        bitcoinStatus = {
          depositAddress: bitcoinInfo.address,
          network: bitcoinInfo.network,
          qrCode: bitcoinInfo.qrCode,
          explorerUrl: bitcoinInfo.explorerUrl,
          hasDeposit: monitoringResult.hasDeposit,
          totalReceived: monitoringResult.totalReceived,
          confirmations: monitoringResult.confirmations,
          isFullyConfirmed: monitoringResult.isFullyConfirmed,
          confirmedTransactions: monitoringResult.confirmedTransactions || [],
          nextStep: this.getBitcoinNextStep(payment.status, monitoringResult)
        };
      }

      const response = this.formatPaymentResponse(payment);
      
      // Add Bitcoin information to response
      if (bitcoinStatus) {
        response.bitcoin = bitcoinStatus;
      }

      return response;
    } catch (error) {
      logger.error('Failed to get payment intent', error, { paymentId });
      throw error;
    }
  }

  /**
   * Get next step instruction for Bitcoin flow
   */
  getBitcoinNextStep(paymentStatus, monitoringResult) {
    if (paymentStatus === 'pending' && !monitoringResult.hasDeposit) {
      return 'Send Bitcoin to the deposit address above';
    } else if (paymentStatus === 'pending' && monitoringResult.hasDeposit && !monitoringResult.isFullyConfirmed) {
      const remaining = this.bitcoinService.confirmationsRequired - monitoringResult.confirmations;
      return `Waiting for ${remaining} more confirmations (${monitoringResult.confirmations}/${this.bitcoinService.confirmationsRequired})`;
    } else if (paymentStatus === 'deposit_detected') {
      const remaining = this.bitcoinService.confirmationsRequired - monitoringResult.confirmations;
      return remaining > 0 
        ? `Waiting for ${remaining} more confirmations (${monitoringResult.confirmations}/${this.bitcoinService.confirmationsRequired})`
        : 'Bitcoin deposit fully confirmed, processing sBTC mint...';
    } else if (paymentStatus === 'deposit_confirmed' || paymentStatus === 'processing') {
      return 'Bitcoin confirmed! sBTC minting in progress...';
    } else if (paymentStatus === 'completed') {
      return 'Payment completed! sBTC tokens have been minted.';
    } else {
      return 'Payment status updated';
    }
  }

  /**
   * Create a new payment intent in database
   */
  async create(paymentData) {
    try {
      const result = await database.query(`
        INSERT INTO payments (
          payment_id, merchant_id, amount_in_sats, fee_amount, currency,
          status, description, expires_at, stacks_tx_id, blockchain_status,
          metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [
        paymentData.paymentId,
        paymentData.merchantId,
        paymentData.amount,
        paymentData.fee,
        paymentData.currency,
        paymentData.status,
        paymentData.description,
        paymentData.expiresAt,
        paymentData.blockchainTxId,
        paymentData.blockchainStatus,
        JSON.stringify(paymentData.metadata)
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to create payment in database', error, { paymentData });
      throw error;
    }
  }

  /**
   * Find payment by ID
   */
  async findById(paymentId) {
    try {
      const result = await database.query(
        'SELECT * FROM payments WHERE payment_id = $1',
        [paymentId]
      );
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      logger.error('Failed to find payment by ID', error, { paymentId });
      throw error;
    }
  }

  /**
   * Find payments by merchant ID
   */
  async findByMerchantId(merchantId, limit = 100, offset = 0) {
    try {
      const result = await database.query(
        'SELECT * FROM payments WHERE merchant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [merchantId, limit, offset]
      );
      
      const countResult = await database.query(
        'SELECT COUNT(*) FROM payments WHERE merchant_id = $1',
        [merchantId]
      );

      return {
        payments: result.rows,
        total: parseInt(countResult.rows[0].count),
        limit,
        offset
      };
    } catch (error) {
      logger.error('Failed to find payments by merchant ID', error, { merchantId });
      throw error;
    }
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

      // Build dynamic update query
      const fields = Object.keys(updateData);
      const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
      const values = [paymentId, ...Object.values(updateData)];

      const query = `
        UPDATE payments 
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE payment_id = $1
        RETURNING *
      `;

      const result = await database.query(query, values);
      
      if (result.rows.length === 0) {
        throw ErrorFactory.notFound('Payment', paymentId);
      }
      
      logger.debug('Payment updated successfully', {
        paymentId,
        updatedFields: fields
      });
      
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to update payment', error, { paymentId, updateData });
      throw error;
    }
  }

  /**
   * Find payments by status
   */
  async findByStatus(status, limit = 100, offset = 0) {
    try {
      const result = await database.query(
        'SELECT * FROM payments WHERE status = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [status, limit, offset]
      );
      
      return result.rows;
    } catch (error) {
      logger.error('Failed to find payments by status', error, { status });
      throw error;
    }
  }

  /**
   * Find expired payments
   */
  async findExpired() {
    try {
      const result = await database.query(`
        SELECT * FROM payments 
        WHERE expires_at < CURRENT_TIMESTAMP 
        AND status = 'pending'
        ORDER BY expires_at ASC
      `);
      
      return result.rows;
    } catch (error) {
      logger.error('Failed to find expired payments', error);
      throw error;
    }
  }

  /**
   * Mark expired payments
   */
  async markExpiredPayments() {
    try {
      const result = await database.query(`
        UPDATE payments 
        SET status = 'expired', updated_at = CURRENT_TIMESTAMP
        WHERE expires_at < CURRENT_TIMESTAMP 
        AND status = 'pending'
        RETURNING payment_id
      `);
      
      const expiredCount = result.rows.length;
      
      if (expiredCount > 0) {
        logger.info('Marked expired payments', {
          expiredCount
        });

        // Log events for expired payments
        for (const row of result.rows) {
          await this.logPaymentEvent(row.payment_id, 'payment_expired', {
            markedAt: new Date()
          });
        }
      }
      
      return expiredCount;
    } catch (error) {
      logger.error('Failed to mark expired payments', error);
      throw error;
    }
  }

  /**
   * Get payment statistics
   */
  async getStats(merchantId = null) {
    try {
      let whereClause = '';
      let params = [];

      if (merchantId) {
        whereClause = 'WHERE merchant_id = $1';
        params = [merchantId];
      }

      const result = await database.query(`
        SELECT 
          COUNT(*) as total_payments,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as succeeded_payments,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments,
          COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_payments,
          COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_payments,
          COALESCE(SUM(CASE WHEN status = 'completed' THEN amount_in_sats ELSE 0 END), 0) as total_amount,
          COALESCE(SUM(CASE WHEN status = 'completed' THEN fee_amount ELSE 0 END), 0) as total_fees,
          COALESCE(AVG(CASE WHEN status = 'completed' THEN amount_in_sats ELSE NULL END), 0) as average_amount
        FROM payments 
        ${whereClause}
      `, params);

      const stats = result.rows[0];
      
      return {
        totalPayments: parseInt(stats.total_payments),
        succeededPayments: parseInt(stats.succeeded_payments),
        failedPayments: parseInt(stats.failed_payments),
        processingPayments: parseInt(stats.processing_payments),
        expiredPayments: parseInt(stats.expired_payments),
        totalAmount: parseInt(stats.total_amount),
        totalFees: parseInt(stats.total_fees),
        averageAmount: parseFloat(stats.average_amount) || 0
      };
    } catch (error) {
      logger.error('Failed to get payment statistics', error);
      throw error;
    }
  }

  /**
   * Delete payment (admin function)
   */
  async delete(paymentId) {
    try {
      const result = await database.query(
        'DELETE FROM payments WHERE payment_id = $1 RETURNING payment_id',
        [paymentId]
      );
      
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Failed to delete payment', error, { paymentId });
      throw error;
    }
  }

  /**
   * Get all payments (admin function)
   */
  async findAll(limit = 100, offset = 0) {
    try {
      const result = await database.query(
        'SELECT * FROM payments ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [limit, offset]
      );
      
      const countResult = await database.query('SELECT COUNT(*) FROM payments');

      return {
        payments: result.rows,
        total: parseInt(countResult.rows[0].count),
        limit,
        offset
      };
    } catch (error) {
      logger.error('Failed to get all payments', error);
      throw error;
    }
  }

  /**
   * Get merchant information
   */
  async getMerchant(merchantId) {
    try {
      const result = await database.query(
        'SELECT * FROM merchants WHERE merchant_id = $1',
        [merchantId]
      );
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      logger.error('Failed to get merchant', error, { merchantId });
      throw error;
    }
  }

  /**
   * Log payment event for audit trail
   */
  async logPaymentEvent(paymentId, eventType, eventData = {}) {
    try {
      await database.query(`
        INSERT INTO payment_events (payment_id, event_type, event_data)
        VALUES ($1, $2, $3)
      `, [paymentId, eventType, JSON.stringify(eventData)]);
    } catch (error) {
      logger.error('Failed to log payment event', error, { paymentId, eventType });
      // Don't throw - event logging should not break main flow
    }
  }

  /**
   * Update blockchain status for a payment
   */
  async updateBlockchainStatus(payment) {
    try {
      const txId = payment.stacks_tx_id;
      if (!txId) return;

      const status = await this.stacksService.getTransactionStatus(txId);
      
      if (status.isConfirmed && payment.status === 'processing') {
        await database.query(`
          UPDATE payments 
          SET status = 'completed', blockchain_status = 'confirmed', confirmed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE payment_id = $1
        `, [payment.payment_id]);
        
        await this.logPaymentEvent(payment.payment_id, 'payment_completed', {
          txId,
          confirmedAt: new Date()
        });
        
        logger.info('Payment confirmed on blockchain', {
          paymentId: payment.payment_id,
          txId
        });
      } else if (status.isFailed && payment.status === 'processing') {
        await database.query(`
          UPDATE payments 
          SET status = 'failed', blockchain_status = 'failed', updated_at = CURRENT_TIMESTAMP
          WHERE payment_id = $1
        `, [payment.payment_id]);
        
        await this.logPaymentEvent(payment.payment_id, 'payment_failed', {
          txId,
          failedAt: new Date()
        });
        
        logger.error('Payment failed on blockchain', {
          paymentId: payment.payment_id,
          txId
        });
      } else if (status.isPending) {
        await database.query(`
          UPDATE payments 
          SET blockchain_status = 'pending', updated_at = CURRENT_TIMESTAMP
          WHERE payment_id = $1
        `, [payment.payment_id]);
      }
    } catch (error) {
      logger.error('Failed to update blockchain status', error, {
        paymentId: payment.payment_id
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
        .then(async (result) => {
          const payment = await this.findById(paymentId);
          if (!payment) return;

          if (result.confirmed) {
            await database.query(`
              UPDATE payments 
              SET status = 'completed', blockchain_status = 'confirmed', confirmed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
              WHERE payment_id = $1
            `, [paymentId]);
            
            await this.logPaymentEvent(paymentId, 'payment_completed', {
              txId,
              confirmedAt: new Date()
            });
            
            logger.info('Payment monitoring: Transaction confirmed', {
              paymentId,
              txId
            });
          } else if (result.failed) {
            await database.query(`
              UPDATE payments 
              SET status = 'failed', blockchain_status = 'failed', updated_at = CURRENT_TIMESTAMP
              WHERE payment_id = $1
            `, [paymentId]);
            
            await this.logPaymentEvent(paymentId, 'payment_failed', {
              txId,
              failedAt: new Date()
            });
            
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
        // Check if database is initialized before proceeding
        if (!database.isConnected) {
          logger.debug('Database not ready, skipping transaction monitoring');
          return;
        }

        // Database-agnostic query for recent processing payments
        const poolStatus = database.getPoolStatus();
        let timeQuery;
        if (poolStatus.database === 'PostgreSQL') {
          timeQuery = `
            SELECT * FROM payments 
            WHERE status = 'processing' 
            AND stacks_tx_id IS NOT NULL
            AND updated_at > CURRENT_TIMESTAMP - INTERVAL '1 hour'
          `;
        } else {
          timeQuery = `
            SELECT * FROM payments 
            WHERE status = 'processing' 
            AND stacks_tx_id IS NOT NULL
            AND updated_at > datetime('now', '-1 hour')
          `;
        }
        
        const processingPayments = await database.query(timeQuery);

        for (const payment of processingPayments.rows) {
          await this.updateBlockchainStatus(payment);
        }
      } catch (error) {
        logger.error('Error in transaction monitoring loop', error);
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Format payment response for API
   */
  formatPaymentResponse(payment) {
    return {
      id: payment.id,
      paymentId: payment.payment_id,
      amount: payment.amount_in_sats,
      fee: payment.fee_amount,
      currency: payment.currency,
      description: payment.description,
      status: payment.status,
      createdAt: payment.created_at,
      expiresAt: payment.expires_at,
      customerAddress: payment.customer_address,
      blockchainTxId: payment.stacks_tx_id,
      blockchainStatus: payment.blockchain_status,
      confirmedAt: payment.confirmed_at,
      metadata: payment.metadata
    };
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