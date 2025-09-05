/**
 * Payment Service
 * Business logic for payment operations with comprehensive payment intent handling
 */

const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

class PaymentService {
  constructor() {
    // In-memory storage (replace with database in production)
    this.payments = new Map();
  }

  /**
   * Create payment intent with detailed validation and logging
   */
  async createPaymentIntent(merchantId, { amount, description, currency = 'BTC' }) {
    const requestId = uuidv4().substring(0, 8);
    const timestamp = new Date().toISOString();
    
    console.log(`[PAYMENT_INTENT:${requestId}] === REQUEST START === ${timestamp}`);
    console.log(`[PAYMENT_INTENT:${requestId}] Merchant ID: ${merchantId}`);
    console.log(`[PAYMENT_INTENT:${requestId}] Amount: ${amount}`);
    console.log(`[PAYMENT_INTENT:${requestId}] Description: ${description || 'Not provided'}`);
    console.log(`[PAYMENT_INTENT:${requestId}] Currency: ${currency}`);

    // Enhanced validation with detailed logging
    if (!amount) {
      console.error(`[PAYMENT_INTENT:${requestId}] VALIDATION ERROR: Amount is missing`);
      throw new Error('Amount is required');
    }

    if (typeof amount !== 'number') {
      console.error(`[PAYMENT_INTENT:${requestId}] VALIDATION ERROR: Amount is not a number: ${typeof amount}`);
      throw new Error('Amount must be a number');
    }

    if (amount <= 0) {
      console.error(`[PAYMENT_INTENT:${requestId}] VALIDATION ERROR: Amount is not positive: ${amount}`);
      throw new Error('Invalid amount. Must be greater than 0 satoshis.');
    }

    console.log(`[PAYMENT_INTENT:${requestId}] Validation passed`);

    // Generate payment intent with detailed logging
    const paymentId = `pi_${uuidv4()}`;
    const intentId = uuidv4();
    const amountInSats = Math.floor(amount);
    const FEE_PERCENTAGE = 0.025; // 2.5% processing fee
    const fee = Math.floor(amountInSats * FEE_PERCENTAGE);
    
    console.log(`[PAYMENT_INTENT:${requestId}] Generated Payment ID: ${paymentId}`);
    console.log(`[PAYMENT_INTENT:${requestId}] Generated Intent ID: ${intentId}`);
    console.log(`[PAYMENT_INTENT:${requestId}] Amount in Satoshis: ${amountInSats}`);
    console.log(`[PAYMENT_INTENT:${requestId}] Calculated Fee: ${fee} (${FEE_PERCENTAGE * 100}%)`);

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
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      metadata: {
        requestId
      }
    };

    this.payments.set(intentId, paymentIntent);
    console.log(`[PAYMENT_INTENT:${requestId}] Payment intent stored in memory`);
    console.log(`[PAYMENT_INTENT:${requestId}] SUCCESS: Payment intent created successfully`);

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
      requestId
    };
  }

  /**
   * Confirm payment with blockchain processing simulation
   */
  async confirmPayment(paymentId, { customerAddress, transactionId }) {
    const paymentIntent = this.payments.get(paymentId);
    if (!paymentIntent) {
      throw new Error('Payment intent not found');
    }

    // Check if payment has expired
    if (new Date() > new Date(paymentIntent.expiresAt)) {
      throw new Error('Payment intent has expired');
    }

    // Update payment status
    paymentIntent.status = 'processing';
    paymentIntent.customerAddress = customerAddress;
    paymentIntent.transactionId = transactionId;
    paymentIntent.processingStartedAt = new Date().toISOString();

    console.log('Payment confirmation started:', {
      paymentId: paymentIntent.paymentId,
      customer: customerAddress,
      txId: transactionId
    });

    // Simulate blockchain processing (in production, monitor the actual transaction)
    setTimeout(() => {
      try {
        const updatedPayment = this.payments.get(paymentId);
        if (updatedPayment && updatedPayment.status === 'processing') {
          updatedPayment.status = 'succeeded';
          updatedPayment.succeededAt = new Date().toISOString();

          console.log('Payment succeeded:', {
            paymentId: paymentIntent.paymentId,
            amount: paymentIntent.amount,
            customer: customerAddress
          });
        }
      } catch (error) {
        console.error('Payment processing error:', error);
        const failedPayment = this.payments.get(paymentId);
        if (failedPayment) {
          failedPayment.status = 'payment_failed';
          failedPayment.failedAt = new Date().toISOString();
          failedPayment.failureReason = error.message;
        }
      }
    }, 3000); // 3 second delay to simulate blockchain confirmation

    return {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      customer: customerAddress,
      transactionId,
      message: 'Payment is being processed on the Stacks blockchain'
    };
  }

  /**
   * Get detailed payment intent information
   */
  async getPaymentIntent(paymentId) {
    const paymentIntent = this.payments.get(paymentId);
    
    if (!paymentIntent) {
      throw new Error('Payment intent not found');
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
      transactionId: paymentIntent.transactionId,
      processingStartedAt: paymentIntent.processingStartedAt,
      succeededAt: paymentIntent.succeededAt,
      failedAt: paymentIntent.failedAt
    };
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
    const existingPayment = this.payments.get(paymentId);
    if (!existingPayment) {
      throw new Error('Payment not found');
    }
    
    const updatedPayment = { ...existingPayment, ...updateData };
    this.payments.set(paymentId, updatedPayment);
    return updatedPayment;
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
    const expiredPayments = await this.findExpired();
    for (const payment of expiredPayments) {
      await this.update(payment.id, {
        status: 'expired',
        expiredAt: new Date().toISOString()
      });
    }
    return expiredPayments.length;
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
}

module.exports = PaymentService;