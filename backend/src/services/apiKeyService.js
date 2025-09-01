/**
 * API Key Service
 * Business logic for API key management
 */

const crypto = require('crypto');

class ApiKeyService {
  constructor() {
    // In-memory storage (replace with database in production)
    this.apiKeys = new Map();
  }

  /**
   * Generate a test API key for merchants
   */
  generateApiKey() {
    return 'pk_test_' + crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate a secret key for merchants
   */
  generateSecretKey() {
    return 'sk_test_' + crypto.randomBytes(32).toString('hex');
  }

  /**
   * Store API key mapping
   */
  async store(apiKey, merchantId) {
    this.apiKeys.set(apiKey, merchantId);
    return true;
  }

  /**
   * Validate if an API key exists and is valid
   */
  validate(apiKey) {
    return this.apiKeys.has(apiKey);
  }

  /**
   * Get merchant ID from API key
   */
  getMerchantId(apiKey) {
    return this.apiKeys.get(apiKey);
  }

  /**
   * Revoke API key
   */
  async revoke(apiKey) {
    return this.apiKeys.delete(apiKey);
  }

  /**
   * List all API keys for a merchant (admin function)
   */
  async findByMerchantId(merchantId) {
    const keys = [];
    for (const [apiKey, mId] of this.apiKeys.entries()) {
      if (mId === merchantId) {
        keys.push({
          apiKey,
          merchantId: mId,
          isTest: apiKey.startsWith('pk_test_'),
          createdAt: new Date().toISOString() // In production, store actual creation date
        });
      }
    }
    return keys;
  }

  /**
   * Regenerate API key for a merchant
   */
  async regenerate(oldApiKey) {
    const merchantId = this.getMerchantId(oldApiKey);
    if (!merchantId) {
      throw new Error('API key not found');
    }

    // Remove old key
    this.apiKeys.delete(oldApiKey);
    
    // Generate new key
    const newApiKey = this.generateApiKey();
    this.apiKeys.set(newApiKey, merchantId);
    
    return {
      oldApiKey,
      newApiKey,
      merchantId
    };
  }

  /**
   * Get API key statistics
   */
  async getStats() {
    const totalKeys = this.apiKeys.size;
    const testKeys = [...this.apiKeys.keys()].filter(key => key.startsWith('pk_test_')).length;
    const liveKeys = totalKeys - testKeys;

    return {
      totalKeys,
      testKeys,
      liveKeys
    };
  }
}

module.exports = ApiKeyService;