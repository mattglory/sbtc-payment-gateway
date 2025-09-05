/**
 * API Key Service
 * Business logic for API key management with enhanced validation
 */

const crypto = require('crypto');

class ApiKeyService {
  constructor() {
    // In-memory storage (replace with database in production)
    this.apiKeys = new Map();
    
    // Configuration from environment
    this.DEMO_MODE = process.env.DEMO_MODE === 'true';
    this.CONFIGURED_API_KEYS = process.env.API_KEYS ? process.env.API_KEYS.split(',').map(key => key.trim()) : [];
    this.DEMO_KEYS = ['pk_test_demo', 'pk_test_your_key', 'pk_test_123'];
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
   * Professional API key validation with comprehensive error handling
   */
  validateApiKey(apiKey) {
    if (!apiKey) {
      return { valid: false, error: 'API key is required', code: 'MISSING_API_KEY' };
    }

    // Demo mode check
    if (this.DEMO_MODE && this.DEMO_KEYS.includes(apiKey)) {
      console.log(`[API_KEY] Demo key accepted in demo mode: ${apiKey}`);
      return { valid: true, type: 'demo', key: apiKey };
    }

    // Check configured API keys from environment
    if (this.CONFIGURED_API_KEYS.length > 0 && this.CONFIGURED_API_KEYS.includes(apiKey)) {
      console.log(`[API_KEY] Configured key accepted: ${apiKey.substring(0, 12)}...`);
      return { valid: true, type: 'configured', key: apiKey };
    }

    // Check dynamically registered API keys
    if (this.apiKeys.has(apiKey)) {
      console.log(`[API_KEY] Registered key accepted: ${apiKey.substring(0, 12)}...`);
      return { valid: true, type: 'registered', key: apiKey };
    }

    // Fallback to demo keys if no configuration is set and not in strict mode
    if (this.CONFIGURED_API_KEYS.length === 0 && !process.env.STRICT_API_MODE && this.DEMO_KEYS.includes(apiKey)) {
      console.log(`[API_KEY] Demo key accepted as fallback: ${apiKey}`);
      return { valid: true, type: 'demo_fallback', key: apiKey };
    }

    console.log(`[API_KEY] Invalid key rejected: ${apiKey ? apiKey.substring(0, 12) + '...' : 'undefined'}`);
    return { valid: false, error: 'Invalid API key', code: 'INVALID_API_KEY' };
  }

  /**
   * Validate if an API key exists and is valid (legacy method)
   */
  validate(apiKey) {
    const validation = this.validateApiKey(apiKey);
    return validation.valid;
  }

  /**
   * Get merchant ID from API key with validation
   */
  getMerchantFromApiKey(apiKey) {
    const validation = this.validateApiKey(apiKey);
    
    if (!validation.valid) {
      return null;
    }

    // Return demo merchant ID for demo API keys
    if (validation.type === 'demo' || validation.type === 'demo_fallback') {
      return 'demo-merchant-id';
    }

    // For configured keys, also return demo merchant (in production you'd map these properly)
    if (validation.type === 'configured') {
      return 'demo-merchant-id'; // TODO: Implement proper merchant mapping for configured keys
    }

    // For registered keys, use the mapping
    return this.apiKeys.get(apiKey);
  }

  /**
   * Get merchant ID from API key (legacy method)
   */
  getMerchantId(apiKey) {
    return this.getMerchantFromApiKey(apiKey);
  }

  /**
   * Get API key system status
   */
  getSystemStatus() {
    return {
      demoMode: this.DEMO_MODE,
      configuredKeysCount: this.CONFIGURED_API_KEYS.length,
      registeredKeysCount: this.apiKeys.size,
      demoKeysAvailable: this.DEMO_MODE || (!this.CONFIGURED_API_KEYS.length && !process.env.STRICT_API_MODE),
      demoKeys: this.DEMO_MODE ? this.DEMO_KEYS : []
    };
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