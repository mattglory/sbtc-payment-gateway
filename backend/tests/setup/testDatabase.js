/**
 * Test Database Setup and Teardown
 * Manages test data isolation and cleanup for comprehensive testing
 */

/**
 * In-Memory Test Database Implementation
 * Since the current backend uses in-memory storage, this provides
 * utilities for managing test data isolation
 */
class TestDatabase {
  constructor() {
    this.reset();
  }

  reset() {
    this.payments = new Map();
    this.merchants = new Map();
    this.apiKeys = new Map(); // apiKey -> merchantId mapping
    this.merchantStats = new Map();
    this.sequences = {
      payment: 0,
      merchant: 0
    };
  }

  // Payment operations
  createPayment(payment) {
    const id = payment.id || this.generatePaymentId();
    const paymentData = {
      ...payment,
      id,
      createdAt: payment.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.payments.set(id, paymentData);
    return paymentData;
  }

  getPayment(id) {
    return this.payments.get(id) || null;
  }

  updatePayment(id, updates) {
    const existing = this.payments.get(id);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.payments.set(id, updated);
    return updated;
  }

  deletePayment(id) {
    return this.payments.delete(id);
  }

  getAllPayments() {
    return Array.from(this.payments.values());
  }

  getPaymentsByMerchant(merchantId) {
    return Array.from(this.payments.values())
      .filter(payment => payment.merchantId === merchantId);
  }

  getPaymentsByStatus(status) {
    return Array.from(this.payments.values())
      .filter(payment => payment.status === status);
  }

  // Merchant operations
  createMerchant(merchant) {
    const id = merchant.id || this.generateMerchantId();
    const merchantData = {
      ...merchant,
      id,
      createdAt: merchant.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.merchants.set(id, merchantData);
    
    // Create API key mapping
    if (merchantData.apiKey) {
      this.apiKeys.set(merchantData.apiKey, id);
    }

    // Initialize merchant stats
    this.merchantStats.set(id, {
      totalProcessed: 0,
      feeCollected: 0,
      paymentsCount: 0,
      activePayments: 0,
      successfulPayments: 0,
      recentPayments: []
    });

    return merchantData;
  }

  getMerchant(id) {
    return this.merchants.get(id) || null;
  }

  getMerchantByApiKey(apiKey) {
    const merchantId = this.apiKeys.get(apiKey);
    return merchantId ? this.getMerchant(merchantId) : null;
  }

  getMerchantByEmail(email) {
    return Array.from(this.merchants.values())
      .find(merchant => merchant.email.toLowerCase() === email.toLowerCase()) || null;
  }

  getMerchantByStacksAddress(stacksAddress) {
    return Array.from(this.merchants.values())
      .find(merchant => merchant.stacksAddress === stacksAddress) || null;
  }

  updateMerchant(id, updates) {
    const existing = this.merchants.get(id);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.merchants.set(id, updated);

    // Update API key mapping if changed
    if (updates.apiKey && updates.apiKey !== existing.apiKey) {
      this.apiKeys.delete(existing.apiKey);
      this.apiKeys.set(updates.apiKey, id);
    }

    return updated;
  }

  deleteMerchant(id) {
    const merchant = this.merchants.get(id);
    if (!merchant) return false;

    // Clean up related data
    this.apiKeys.delete(merchant.apiKey);
    this.merchantStats.delete(id);
    
    // Delete merchant payments
    const payments = this.getPaymentsByMerchant(id);
    payments.forEach(payment => this.deletePayment(payment.id));

    return this.merchants.delete(id);
  }

  getAllMerchants() {
    return Array.from(this.merchants.values());
  }

  // Merchant stats operations
  getMerchantStats(merchantId) {
    return this.merchantStats.get(merchantId) || null;
  }

  updateMerchantStats(merchantId, updates) {
    const existing = this.merchantStats.get(merchantId);
    if (!existing) return null;

    // Accumulate numeric values
    const updated = {
      totalProcessed: existing.totalProcessed + (updates.totalProcessed || 0),
      feeCollected: existing.feeCollected + (updates.feeCollected || 0),
      paymentsCount: existing.paymentsCount + (updates.paymentsCount || 0),
      activePayments: Math.max(0, existing.activePayments + (updates.activePayments || 0)),
      successfulPayments: existing.successfulPayments + (updates.successfulPayments || 0),
      recentPayments: existing.recentPayments
    };

    // Add recent payment if provided
    if (updates.recentPayment) {
      updated.recentPayments.unshift(updates.recentPayment);
      // Keep only last 10 payments
      updated.recentPayments = updated.recentPayments.slice(0, 10);
    }

    this.merchantStats.set(merchantId, updated);
    return updated;
  }

  // Utility methods
  generatePaymentId() {
    return `pi_test_${++this.sequences.payment}`.padEnd(20, '0');
  }

  generateMerchantId() {
    return `merchant_test_${++this.sequences.merchant}`.padEnd(25, '0');
  }

  // Test data seeding
  seedTestData() {
    const testData = {
      merchants: [],
      payments: []
    };

    // Create test merchants
    for (let i = 1; i <= 3; i++) {
      const merchant = this.createMerchant({
        businessName: `Test Business ${i}`,
        email: `test${i}@example.com`,
        stacksAddress: this.generateTestStacksAddress(),
        apiKey: `pk_test_${i.toString().padStart(10, '0')}`,
        secretKey: `sk_test_${i.toString().padStart(10, '0')}`
      });
      testData.merchants.push(merchant);

      // Create test payments for each merchant
      const paymentStatuses = ['pending', 'processing', 'succeeded', 'payment_failed', 'expired'];
      
      for (let j = 0; j < 5; j++) {
        const payment = this.createPayment({
          merchantId: merchant.id,
          amount: 50000 + (j * 25000),
          fee: Math.floor((50000 + (j * 25000)) * 0.01),
          currency: 'BTC',
          description: `Test payment ${j + 1} for ${merchant.businessName}`,
          status: paymentStatuses[j],
          clientSecret: `pi_test_secret_${merchant.id}_${j}`,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
        });

        testData.payments.push(payment);

        // Update merchant stats for successful payments
        if (payment.status === 'succeeded') {
          this.updateMerchantStats(merchant.id, {
            totalProcessed: payment.amount,
            feeCollected: payment.fee,
            paymentsCount: 1,
            successfulPayments: 1,
            recentPayment: {
              id: payment.id,
              amount: payment.amount,
              status: payment.status,
              createdAt: payment.createdAt,
              description: payment.description
            }
          });
        }
      }
    }

    return testData;
  }

  generateTestStacksAddress(network = 'testnet') {
    const prefix = network === 'mainnet' ? 'SP' : 'ST';
    const chars = '123456789ABCDEFGHJKMNPQRSTVWXYZ';
    let result = prefix;
    
    for (let i = 0; i < 39; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  generateTestTransactionId() {
    return Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  // Database state management
  getSnapshot() {
    return {
      payments: new Map(this.payments),
      merchants: new Map(this.merchants),
      apiKeys: new Map(this.apiKeys),
      merchantStats: new Map(this.merchantStats),
      sequences: { ...this.sequences }
    };
  }

  restoreSnapshot(snapshot) {
    this.payments = new Map(snapshot.payments);
    this.merchants = new Map(snapshot.merchants);
    this.apiKeys = new Map(snapshot.apiKeys);
    this.merchantStats = new Map(snapshot.merchantStats);
    this.sequences = { ...snapshot.sequences };
  }

  // Statistics and analysis
  getStatistics() {
    return {
      totalPayments: this.payments.size,
      totalMerchants: this.merchants.size,
      totalApiKeys: this.apiKeys.size,
      paymentsByStatus: this.getPaymentStatusDistribution(),
      merchantsWithPayments: this.getMerchantsWithPayments(),
      averagePaymentAmount: this.getAveragePaymentAmount(),
      totalVolume: this.getTotalVolume()
    };
  }

  getPaymentStatusDistribution() {
    const distribution = {};
    for (const payment of this.payments.values()) {
      distribution[payment.status] = (distribution[payment.status] || 0) + 1;
    }
    return distribution;
  }

  getMerchantsWithPayments() {
    const merchantsWithPayments = new Set();
    for (const payment of this.payments.values()) {
      merchantsWithPayments.add(payment.merchantId);
    }
    return merchantsWithPayments.size;
  }

  getAveragePaymentAmount() {
    if (this.payments.size === 0) return 0;
    
    const total = Array.from(this.payments.values())
      .reduce((sum, payment) => sum + payment.amount, 0);
    
    return total / this.payments.size;
  }

  getTotalVolume() {
    return Array.from(this.payments.values())
      .reduce((sum, payment) => sum + payment.amount, 0);
  }

  // Validation helpers
  validatePayment(payment) {
    const errors = [];
    
    if (!payment.amount || typeof payment.amount !== 'number' || payment.amount <= 0) {
      errors.push('Invalid amount');
    }
    
    if (!payment.merchantId) {
      errors.push('Missing merchant ID');
    }
    
    if (!payment.description) {
      errors.push('Missing description');
    }
    
    if (!['pending', 'processing', 'succeeded', 'payment_failed', 'expired'].includes(payment.status)) {
      errors.push('Invalid status');
    }
    
    return errors;
  }

  validateMerchant(merchant) {
    const errors = [];
    
    if (!merchant.businessName) {
      errors.push('Missing business name');
    }
    
    if (!merchant.email || !this.isValidEmail(merchant.email)) {
      errors.push('Invalid email');
    }
    
    if (!merchant.stacksAddress || !this.isValidStacksAddress(merchant.stacksAddress)) {
      errors.push('Invalid Stacks address');
    }
    
    return errors;
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidStacksAddress(address) {
    const stacksAddressRegex = /^S[PT][123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{39}$/;
    return stacksAddressRegex.test(address);
  }
}

// Global test database instance
let testDb = null;

/**
 * Database utilities for tests
 */
const DatabaseUtils = {
  /**
   * Get or create global test database instance
   */
  getInstance() {
    if (!testDb) {
      testDb = new TestDatabase();
    }
    return testDb;
  },

  /**
   * Reset test database to clean state
   */
  reset() {
    const db = this.getInstance();
    db.reset();
    return db;
  },

  /**
   * Setup test database with seed data
   */
  setup() {
    const db = this.reset();
    const seedData = db.seedTestData();
    return { db, seedData };
  },

  /**
   * Teardown test database
   */
  teardown() {
    if (testDb) {
      testDb.reset();
    }
  },

  /**
   * Create isolated test environment
   */
  createIsolatedEnvironment() {
    const db = new TestDatabase();
    return db;
  },

  /**
   * Backup and restore utilities
   */
  backup() {
    const db = this.getInstance();
    return db.getSnapshot();
  },

  restore(snapshot) {
    const db = this.getInstance();
    db.restoreSnapshot(snapshot);
    return db;
  }
};

module.exports = {
  TestDatabase,
  DatabaseUtils
};