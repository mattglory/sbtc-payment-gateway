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
    this.DEMO_KEYS = ['pk_test_demo', 'pk_test_your_key', 'pk_test_123', 'pk_railway_health', 'pk_prod_railway'];
    
    // Railway-specific configuration
    this.IS_RAILWAY = process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_NAME;
    
    // Auto-enable demo mode on Railway if no API keys are configured
    if (this.IS_RAILWAY && this.CONFIGURED_API_KEYS.length === 0) {
      console.log('[API_KEY] Railway environment detected with no configured API keys - enabling demo mode');
      this.DEMO_MODE = true;
    }
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
    try {
      // Input validation
      if (!apiKey || typeof apiKey !== 'string') {
        throw new Error('Valid API key is required');
      }
      
      if (!merchantId || typeof merchantId !== 'string') {
        throw new Error('Valid merchant ID is required');
      }

      this.apiKeys.set(apiKey, merchantId);
      
      console.log(`[API_KEY] Stored API key mapping: ${apiKey.substring(0, 12)}... -> ${merchantId}`);
      return true;
    } catch (error) {
      console.error('[API_KEY] Failed to store API key mapping:', error.message);
      throw error;
    }
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

    // Only log invalid key rejections in development or when not on Railway health checks
    if (process.env.NODE_ENV !== 'production' || process.env.LOG_LEVEL === 'debug') {
      console.log(`[API_KEY] Invalid key rejected: ${apiKey ? apiKey.substring(0, 12) + '...' : 'undefined'}`);
    }
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

    // For configured keys, generate merchant ID based on API key
    if (validation.type === 'configured') {
      // Generate consistent merchant ID from API key hash
      const crypto = require('crypto');
      const hash = crypto.createHash('sha256').update(apiKey).digest('hex');
      return `merchant-${hash.substring(0, 12)}`;
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
    try {
      // Input validation
      if (!apiKey || typeof apiKey !== 'string') {
        throw new Error('Valid API key is required');
      }

      const existed = this.apiKeys.has(apiKey);
      const deleted = this.apiKeys.delete(apiKey);
      
      if (deleted && existed) {
        console.log(`[API_KEY] Revoked API key: ${apiKey.substring(0, 12)}...`);
      } else {
        console.log(`[API_KEY] API key not found for revocation: ${apiKey.substring(0, 12)}...`);
      }
      
      return deleted;
    } catch (error) {
      console.error('[API_KEY] Failed to revoke API key:', error.message);
      throw error;
    }
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
    try {
      // Input validation
      if (!oldApiKey || typeof oldApiKey !== 'string') {
        throw new Error('Valid API key is required');
      }

      const merchantId = this.getMerchantId(oldApiKey);
      if (!merchantId) {
        throw new Error('API key not found or invalid');
      }

      // Remove old key
      const deleted = this.apiKeys.delete(oldApiKey);
      if (!deleted) {
        throw new Error('Failed to remove old API key');
      }
      
      // Generate new key
      const newApiKey = this.generateApiKey();
      this.apiKeys.set(newApiKey, merchantId);
      
      console.log(`[API_KEY] Regenerated API key for merchant: ${merchantId}`);
      console.log(`[API_KEY] Old key: ${oldApiKey.substring(0, 12)}...`);
      console.log(`[API_KEY] New key: ${newApiKey.substring(0, 12)}...`);
      
      return {
        oldApiKey,
        newApiKey,
        merchantId
      };
    } catch (error) {
      console.error('[API_KEY] Failed to regenerate API key:', error.message);
      throw error;
    }
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