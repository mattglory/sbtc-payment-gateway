/**
 * Merchant Controller
 * Handles merchant-related operations
 */

const { v4: uuidv4 } = require('uuid');
// const crypto = require('crypto'); // Reserved for future use

class MerchantController {
  constructor(merchantService, apiKeyService) {
    this.merchantService = merchantService;
    this.apiKeyService = apiKeyService;
  }

  /**
   * Register a new merchant
   */
  async register(req, res) {
    try {
      const { businessName, email, stacksAddress } = req.body;

      // Validation
      if (!businessName || !email || !stacksAddress) {
        return res.status(400).json({
          error: 'Missing required fields: businessName, email, stacksAddress'
        });
      }

      // Check if merchant already exists
      if (await this.merchantService.existsByAddress(stacksAddress)) {
        return res.status(409).json({
          error: 'Merchant already registered with this Stacks address'
        });
      }

      // Generate API credentials
      const apiKey = this.apiKeyService.generateApiKey();
      const secretKey = this.apiKeyService.generateSecretKey();
      const merchantId = uuidv4();

      // Create merchant
      const merchantData = {
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

      await this.merchantService.create(merchantData);
      await this.apiKeyService.store(apiKey, merchantId);

      console.log('Merchant registered:', {
        merchantId,
        businessName,
        stacksAddress
      });

      res.status(201).json({
        merchantId,
        apiKey,
        secretKey,
        message: 'Merchant registered successfully. Please call register-merchant on the smart contract to complete setup.'
      });

    } catch (error) {
      console.error('Merchant registration error:', error);
      res.status(500).json({
        error: 'Internal server error during merchant registration'
      });
    }
  }

  /**
   * Get merchant dashboard statistics
   */
  async getDashboard(req, res) {
    try {
      const apiKey = req.headers.authorization?.replace('Bearer ', '');
      
      if (!apiKey || !this.apiKeyService.validate(apiKey)) {
        return res.status(401).json({
          error: 'Invalid or missing API key'
        });
      }

      const merchantId = this.apiKeyService.getMerchantId(apiKey);
      const merchant = await this.merchantService.findById(merchantId);
      
      if (!merchant) {
        return res.status(404).json({
          error: 'Merchant not found'
        });
      }

      const stats = await this.merchantService.getDashboardStats(merchantId);
      res.json(stats);

    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({
        error: 'Failed to retrieve dashboard statistics'
      });
    }
  }
}

module.exports = MerchantController;