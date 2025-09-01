/**
 * Merchant Service
 * Business logic for merchant operations
 */

class MerchantService {
  constructor() {
    // In-memory storage (replace with database in production)
    this.merchants = new Map();
  }

  /**
   * Create a new merchant
   */
  async create(merchantData) {
    this.merchants.set(merchantData.stacksAddress, merchantData);
    return merchantData;
  }

  /**
   * Find merchant by ID
   */
  async findById(merchantId) {
    return [...this.merchants.values()].find(m => m.id === merchantId);
  }

  /**
   * Find merchant by Stacks address
   */
  async findByAddress(stacksAddress) {
    return this.merchants.get(stacksAddress);
  }

  /**
   * Check if merchant exists by address
   */
  async existsByAddress(stacksAddress) {
    return this.merchants.has(stacksAddress);
  }

  /**
   * Update merchant statistics
   */
  async updateStats(merchantId, stats) {
    const merchant = await this.findById(merchantId);
    if (merchant) {
      merchant.totalProcessed += stats.totalProcessed || 0;
      merchant.feeCollected += stats.feeCollected || 0;
      merchant.paymentsCount += stats.paymentsCount || 0;
      this.merchants.set(merchant.stacksAddress, merchant);
    }
    return merchant;
  }

  /**
   * Get dashboard statistics for a merchant
   */
  async getDashboardStats(merchantId) {
    const merchant = await this.findById(merchantId);
    if (!merchant) {
      throw new Error('Merchant not found');
    }

    // Get merchant's payments (this would be a database query in production)
    const PaymentService = require('./paymentService');
    const paymentService = new PaymentService();
    const merchantPayments = await paymentService.findByMerchantId(merchantId);

    return {
      totalProcessed: merchant.totalProcessed,
      feeCollected: merchant.feeCollected,
      paymentsCount: merchant.paymentsCount,
      activePayments: merchantPayments.filter(p => p.status === 'processing').length,
      successfulPayments: merchantPayments.filter(p => p.status === 'succeeded').length,
      recentPayments: merchantPayments
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10)
        .map(p => ({
          id: p.paymentId,
          amount: p.amount,
          status: p.status,
          createdAt: p.createdAt,
          customerAddress: p.customerAddress,
          description: p.description
        }))
    };
  }

  /**
   * Get all merchants (admin function)
   */
  async findAll() {
    return [...this.merchants.values()];
  }

  /**
   * Delete merchant
   */
  async delete(stacksAddress) {
    return this.merchants.delete(stacksAddress);
  }
}

module.exports = MerchantService;