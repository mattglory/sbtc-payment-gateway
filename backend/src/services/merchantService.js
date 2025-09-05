/**
 * Merchant Service
 * Business logic for merchant operations
 */

const { v4: uuidv4 } = require('uuid');
const ApiKeyService = require('./apiKeyService');

class MerchantService {
  constructor() {
    // In-memory storage (replace with database in production)
    this.merchants = new Map();
    this.apiKeyService = new ApiKeyService();
    
    // Create demo merchant for testing
    this.createDemoMerchant();
  }

  /**
   * Create demo merchant for testing
   */
  createDemoMerchant() {
    const demoMerchant = {
      id: 'demo-merchant-id',
      businessName: 'Demo Store',
      email: 'demo@example.com',
      stacksAddress: 'ST1DEMO123ABC',
      apiKey: 'pk_test_demo_key',
      secretKey: 'sk_test_demo_secret',
      isActive: true,
      totalProcessed: 0,
      feeCollected: 0,
      paymentsCount: 0,
      registeredAt: new Date().toISOString()
    };
    
    this.merchants.set('demo-merchant-id', demoMerchant);
    
    if (this.apiKeyService.DEMO_MODE) {
      console.log(`[DEMO] Demo merchant created with keys: ${this.apiKeyService.DEMO_KEYS.join(', ')}`);
    }
  }

  /**
   * Register a new merchant
   */
  async register(merchantData) {
    const { businessName, email, stacksAddress } = merchantData;

    // Validation
    if (!businessName || !email || !stacksAddress) {
      throw new Error('Missing required fields: businessName, email, stacksAddress');
    }

    // Check if merchant already exists
    if (this.merchants.has(stacksAddress)) {
      throw new Error('Merchant already registered with this Stacks address');
    }

    // Generate API credentials
    const apiKey = this.apiKeyService.generateApiKey();
    const secretKey = this.apiKeyService.generateSecretKey();
    const merchantId = uuidv4();

    // Store merchant data
    const newMerchant = {
      id: merchantId,
      businessName,
      email,
      stacksAddress,
      apiKey,
      secretKey,
      isActive: true,
      totalProcessed: 0,
      feeCollected: 0,
      paymentsCount: 0,
      registeredAt: new Date().toISOString()
    };

    this.merchants.set(stacksAddress, newMerchant);
    await this.apiKeyService.store(apiKey, merchantId);

    console.log(`[MERCHANT] Registered: ${businessName} (${merchantId})`);
    console.log(`[API_KEY] Generated key for merchant: ${apiKey.substring(0, 12)}...`);

    return {
      merchantId,
      apiKey,
      secretKey,
      message: 'Merchant registered successfully. Please call register-merchant on the smart contract to complete setup.'
    };
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