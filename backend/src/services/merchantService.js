/**
 * Merchant Service
 * Business logic for merchant operations with blockchain integration
 */

const { v4: uuidv4 } = require('uuid');
const ApiKeyService = require('./apiKeyService');
const StacksService = require('./stacksService');
const logger = require('../utils/logger');
const { ErrorFactory } = require('../utils/errors');

class MerchantService {
  constructor() {
    // Database storage (implement proper database in production)
    this.merchants = new Map();
    this.merchantStats = new Map();
    this.apiKeyService = new ApiKeyService();
    this.stacksService = new StacksService();
  }


  /**
   * Register a new merchant with blockchain integration
   */
  async register(merchantData) {
    try {
      const { businessName, email, stacksAddress } = merchantData;

      logger.info('Registering new merchant', {
        businessName,
        email,
        stacksAddress
      });

      // Validation
      if (!businessName || !email || !stacksAddress) {
        throw ErrorFactory.validation('Missing required fields: businessName, email, stacksAddress');
      }

      // Validate Stacks address format
      if (!this.stacksService.isValidStacksAddress(stacksAddress)) {
        throw ErrorFactory.validation('Invalid Stacks address format');
      }

      // Check if merchant already exists
      if (await this.existsByAddress(stacksAddress)) {
        throw ErrorFactory.validation('Merchant already registered with this Stacks address');
      }

      // Generate API credentials
      const apiKey = this.apiKeyService.generateApiKey();
      const secretKey = this.apiKeyService.generateSecretKey();
      const merchantId = uuidv4();

      // Create merchant object
      const newMerchant = {
        id: merchantId,
        businessName,
        email,
        stacksAddress,
        apiKey,
        secretKey,
        isActive: false, // Activate after blockchain registration
        blockchainRegistered: false,
        registrationTxId: null,
        registeredAt: new Date().toISOString(),
        blockchainRegisteredAt: null
      };

      // Register merchant on blockchain
      try {
        const blockchainResult = await this.stacksService.registerMerchant(
          merchantId,
          stacksAddress,
          businessName
        );
        
        newMerchant.registrationTxId = blockchainResult.txId;
        newMerchant.blockchainStatus = 'pending';
        
        logger.info('Merchant registration initiated on blockchain', {
          merchantId,
          txId: blockchainResult.txId
        });
      } catch (blockchainError) {
        logger.error('Failed to register merchant on blockchain', blockchainError, {
          merchantId,
          stacksAddress
        });
        
        // Continue with off-chain registration
        newMerchant.blockchainStatus = 'failed';
        newMerchant.blockchainError = blockchainError.message;
      }

      // Store merchant data
      this.merchants.set(merchantId, newMerchant);
      await this.apiKeyService.store(apiKey, merchantId);
      
      // Initialize stats
      this.merchantStats.set(merchantId, {
        totalProcessed: 0,
        feeCollected: 0,
        paymentsCount: 0,
        successfulPayments: 0,
        failedPayments: 0,
        lastPaymentAt: null
      });

      logger.info('Merchant registered successfully', {
        merchantId,
        businessName,
        blockchainStatus: newMerchant.blockchainStatus
      });

      return {
        merchantId,
        apiKey,
        secretKey,
        registrationTxId: newMerchant.registrationTxId,
        blockchainStatus: newMerchant.blockchainStatus,
        message: 'Merchant registered successfully. Blockchain registration is in progress.'
      };
    } catch (error) {
      logger.error('Failed to register merchant', error, merchantData);
      throw error;
    }
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
    try {
      const merchant = await this.findById(merchantId);
      if (!merchant) {
        throw ErrorFactory.notFound('Merchant', merchantId);
      }

      let merchantStats = this.merchantStats.get(merchantId);
      if (!merchantStats) {
        merchantStats = {
          totalProcessed: 0,
          feeCollected: 0,
          paymentsCount: 0,
          successfulPayments: 0,
          failedPayments: 0,
          lastPaymentAt: null
        };
      }

      // Update stats
      merchantStats.totalProcessed += stats.totalProcessed || 0;
      merchantStats.feeCollected += stats.feeCollected || 0;
      merchantStats.paymentsCount += stats.paymentsCount || 0;
      
      if (stats.successful) {
        merchantStats.successfulPayments += 1;
      }
      if (stats.failed) {
        merchantStats.failedPayments += 1;
      }
      if (stats.lastPaymentAt) {
        merchantStats.lastPaymentAt = stats.lastPaymentAt;
      }

      this.merchantStats.set(merchantId, merchantStats);

      logger.info('Merchant stats updated', {
        merchantId,
        stats: merchantStats
      });

      return merchantStats;
    } catch (error) {
      logger.error('Failed to update merchant stats', error, { merchantId, stats });
      throw error;
    }
  }

  /**
   * Get dashboard statistics for a merchant
   */
  async getDashboardStats(merchantId) {
    try {
      const merchant = await this.findById(merchantId);
      if (!merchant) {
        throw ErrorFactory.notFound('Merchant', merchantId);
      }

      // Get merchant stats
      const stats = this.merchantStats.get(merchantId) || {
        totalProcessed: 0,
        feeCollected: 0,
        paymentsCount: 0,
        successfulPayments: 0,
        failedPayments: 0,
        lastPaymentAt: null
      };

      // Get merchant's payments
      const PaymentService = require('./paymentService');
      const paymentService = new PaymentService();
      const merchantPayments = await paymentService.findByMerchantId(merchantId);

      // Update blockchain registration status
      await this.updateBlockchainRegistrationStatus(merchant);

      return {
        merchant: {
          id: merchant.id,
          businessName: merchant.businessName,
          email: merchant.email,
          stacksAddress: merchant.stacksAddress,
          isActive: merchant.isActive,
          blockchainRegistered: merchant.blockchainRegistered,
          registeredAt: merchant.registeredAt
        },
        stats: {
          totalProcessed: stats.totalProcessed,
          feeCollected: stats.feeCollected,
          paymentsCount: stats.paymentsCount,
          successfulPayments: stats.successfulPayments,
          failedPayments: stats.failedPayments,
          activePayments: merchantPayments.filter(p => p.status === 'processing').length,
          lastPaymentAt: stats.lastPaymentAt
        },
        recentPayments: merchantPayments
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 10)
          .map(p => ({
            id: p.paymentId,
            amount: p.amount,
            status: p.status,
            createdAt: p.createdAt,
            customerAddress: p.customerAddress,
            description: p.description,
            blockchainTxId: p.blockchainTxId,
            blockchainStatus: p.blockchainStatus
          }))
      };
    } catch (error) {
      logger.error('Failed to get dashboard stats', error, { merchantId });
      throw error;
    }
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
  async delete(merchantId) {
    try {
      const merchant = await this.findById(merchantId);
      if (!merchant) {
        return false;
      }
      
      // Remove from API key service
      await this.apiKeyService.revoke(merchant.apiKey);
      
      // Remove merchant and stats
      this.merchants.delete(merchantId);
      this.merchantStats.delete(merchantId);
      
      logger.info('Merchant deleted', { merchantId });
      return true;
    } catch (error) {
      logger.error('Failed to delete merchant', error, { merchantId });
      throw error;
    }
  }

  /**
   * Update blockchain registration status
   */
  async updateBlockchainRegistrationStatus(merchant) {
    try {
      if (!merchant.registrationTxId || merchant.blockchainRegistered) {
        return;
      }

      const txStatus = await this.stacksService.getTransactionStatus(merchant.registrationTxId);
      
      if (txStatus.isConfirmed) {
        merchant.blockchainRegistered = true;
        merchant.isActive = true;
        merchant.blockchainRegisteredAt = new Date().toISOString();
        merchant.blockchainStatus = 'confirmed';
        
        logger.info('Merchant blockchain registration confirmed', {
          merchantId: merchant.id,
          txId: merchant.registrationTxId
        });
      } else if (txStatus.isFailed) {
        merchant.blockchainStatus = 'failed';
        logger.error('Merchant blockchain registration failed', {
          merchantId: merchant.id,
          txId: merchant.registrationTxId
        });
      }
    } catch (error) {
      logger.error('Failed to update blockchain registration status', error, {
        merchantId: merchant.id,
        registrationTxId: merchant.registrationTxId
      });
    }
  }

  /**
   * Get merchant by API key
   */
  async findByApiKey(apiKey) {
    try {
      // Input validation
      if (!apiKey || typeof apiKey !== 'string') {
        throw ErrorFactory.validation('Valid API key is required');
      }

      const merchantId = this.apiKeyService.getMerchantFromApiKey(apiKey);
      if (!merchantId) {
        return null;
      }
      return await this.findById(merchantId);
    } catch (error) {
      logger.error('Failed to find merchant by API key', error, { 
        apiKey: apiKey?.substring(0, 10) + '...' 
      });
      
      if (error.name === 'ValidationError') {
        throw error;
      }
      
      return null;
    }
  }

  /**
   * Validate merchant blockchain registration
   */
  async validateBlockchainRegistration(merchantId) {
    try {
      const merchant = await this.findById(merchantId);
      if (!merchant) {
        throw ErrorFactory.notFound('Merchant', merchantId);
      }

      // Check blockchain registration status
      await this.updateBlockchainRegistrationStatus(merchant);

      return {
        isRegistered: merchant.blockchainRegistered,
        registrationTxId: merchant.registrationTxId,
        blockchainStatus: merchant.blockchainStatus,
        isActive: merchant.isActive
      };
    } catch (error) {
      logger.error('Failed to validate blockchain registration', error, { merchantId });
      throw error;
    }
  }

  /**
   * Get blockchain network information
   */
  getBlockchainInfo() {
    return this.stacksService.getNetworkInfo();
  }

  /**
   * Check merchant balance on blockchain
   */
  async checkBalance(merchantId) {
    try {
      const merchant = await this.findById(merchantId);
      if (!merchant) {
        throw ErrorFactory.notFound('Merchant', merchantId);
      }

      const balance = await this.stacksService.getAccountBalance(merchant.stacksAddress);
      
      logger.debug('Retrieved merchant balance', {
        merchantId,
        stacksAddress: merchant.stacksAddress,
        balance: balance.stx.balance
      });

      return balance;
    } catch (error) {
      logger.error('Failed to check merchant balance', error, { merchantId });
      throw error;
    }
  }
}

module.exports = MerchantService;