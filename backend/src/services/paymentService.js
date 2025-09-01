/**
 * Payment Service
 * Business logic for payment operations
 */

class PaymentService {
  constructor() {
    // In-memory storage (replace with database in production)
    this.payments = new Map();
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