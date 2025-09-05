/**
 * Unit Tests for MerchantService
 * Tests merchant registration, dashboard statistics, and management functionality
 */

const MerchantService = require('../../../src/services/merchantService');
const { generators, validators } = require('../../utils/testHelpers');

describe('MerchantService', () => {
  let merchantService;

  beforeEach(() => {
    generators.sequence.reset();
    merchantService = new MerchantService();
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    test('should initialize with empty merchant storage', () => {
      const service = new MerchantService();
      
      expect(service).toBeDefined();
      expect(service.merchants).toBeDefined();
      expect(service.merchants).toBeInstanceOf(Map);
      expect(service.merchants.size).toBe(0);
    });

    test('should initialize merchant stats storage', () => {
      const service = new MerchantService();
      
      expect(service.merchantStats).toBeDefined();
      expect(service.merchantStats).toBeInstanceOf(Map);
      expect(service.merchantStats.size).toBe(0);
    });
  });

  describe('register', () => {
    const validRegistrationData = {
      businessName: 'Test Coffee Shop',
      email: 'owner@testcoffee.com',
      stacksAddress: 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE'
    };

    test('should register new merchant with valid data', async () => {
      const result = await merchantService.register(validRegistrationData);

      expect(result).toBeDefined();
      expect(result.merchantId).toBeDefined();
      expect(result.apiKey).toBeDefined();
      expect(result.secretKey).toBeDefined();
      expect(result.message).toContain('registered successfully');
      
      // Verify API key format
      expect(result.apiKey).toMatch(/^pk_live_[a-zA-Z0-9]+$/);
      expect(result.secretKey).toMatch(/^sk_live_[a-zA-Z0-9]+$/);
    });

    test('should store merchant data internally', async () => {
      const result = await merchantService.register(validRegistrationData);

      const storedMerchant = merchantService.merchants.get(result.merchantId);
      expect(storedMerchant).toBeDefined();
      expect(storedMerchant.businessName).toBe(validRegistrationData.businessName);
      expect(storedMerchant.email).toBe(validRegistrationData.email);
      expect(storedMerchant.stacksAddress).toBe(validRegistrationData.stacksAddress);
      expect(storedMerchant.apiKey).toBe(result.apiKey);
      expect(storedMerchant.secretKey).toBe(result.secretKey);
      expect(storedMerchant.createdAt).toBeDefined();
    });

    test('should initialize merchant stats to zero', async () => {
      const result = await merchantService.register(validRegistrationData);

      const stats = merchantService.merchantStats.get(result.merchantId);
      expect(stats).toBeDefined();
      expect(stats.totalProcessed).toBe(0);
      expect(stats.feeCollected).toBe(0);
      expect(stats.paymentsCount).toBe(0);
      expect(stats.activePayments).toBe(0);
      expect(stats.successfulPayments).toBe(0);
      expect(stats.recentPayments).toEqual([]);
    });

    test('should generate unique merchant IDs for concurrent registrations', async () => {
      const registrationPromises = Array.from({ length: 10 }, (_, i) => 
        merchantService.register({
          ...validRegistrationData,
          email: `test${i}@example.com`
        })
      );

      const results = await Promise.all(registrationPromises);
      const merchantIds = results.map(r => r.merchantId);
      const uniqueIds = new Set(merchantIds);

      expect(uniqueIds.size).toBe(results.length);
    });

    test('should generate unique API keys', async () => {
      const results = await Promise.all([
        merchantService.register({ ...validRegistrationData, email: 'test1@example.com' }),
        merchantService.register({ ...validRegistrationData, email: 'test2@example.com' }),
        merchantService.register({ ...validRegistrationData, email: 'test3@example.com' })
      ]);

      const apiKeys = results.map(r => r.apiKey);
      const secretKeys = results.map(r => r.secretKey);
      
      expect(new Set(apiKeys).size).toBe(apiKeys.length);
      expect(new Set(secretKeys).size).toBe(secretKeys.length);
    });

    describe('validation errors', () => {
      test('should throw error for missing business name', async () => {
        const invalidData = {
          email: 'test@example.com',
          stacksAddress: 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE'
        };

        await expect(merchantService.register(invalidData))
          .rejects.toThrow('Missing required fields');
      });

      test('should throw error for empty business name', async () => {
        const invalidData = {
          businessName: '',
          email: 'test@example.com',
          stacksAddress: 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE'
        };

        await expect(merchantService.register(invalidData))
          .rejects.toThrow('Missing required fields');
      });

      test('should throw error for missing email', async () => {
        const invalidData = {
          businessName: 'Test Business',
          stacksAddress: 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE'
        };

        await expect(merchantService.register(invalidData))
          .rejects.toThrow('Missing required fields');
      });

      test('should throw error for invalid email format', async () => {
        const invalidData = {
          businessName: 'Test Business',
          email: 'invalid-email-format',
          stacksAddress: 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE'
        };

        await expect(merchantService.register(invalidData))
          .rejects.toThrow('Invalid email format');
      });

      test('should throw error for missing stacks address', async () => {
        const invalidData = {
          businessName: 'Test Business',
          email: 'test@example.com'
        };

        await expect(merchantService.register(invalidData))
          .rejects.toThrow('Missing required fields');
      });

      test('should throw error for invalid stacks address format', async () => {
        const invalidData = {
          businessName: 'Test Business',
          email: 'test@example.com',
          stacksAddress: 'invalid_stacks_address'
        };

        await expect(merchantService.register(invalidData))
          .rejects.toThrow('Invalid Stacks address format');
      });

      test('should throw error for duplicate email registration', async () => {
        await merchantService.register(validRegistrationData);

        await expect(merchantService.register(validRegistrationData))
          .rejects.toThrow('Merchant with this email is already registered');
      });

      test('should throw error for duplicate stacks address', async () => {
        await merchantService.register(validRegistrationData);

        const duplicateAddressData = {
          businessName: 'Different Business',
          email: 'different@example.com',
          stacksAddress: validRegistrationData.stacksAddress
        };

        await expect(merchantService.register(duplicateAddressData))
          .rejects.toThrow('Merchant with this Stacks address is already registered');
      });
    });

    describe('edge cases', () => {
      test('should handle very long business names', async () => {
        const longBusinessName = 'A'.repeat(200);
        const data = {
          ...validRegistrationData,
          businessName: longBusinessName
        };

        const result = await merchantService.register(data);
        expect(result.merchantId).toBeDefined();
        
        const storedMerchant = merchantService.merchants.get(result.merchantId);
        expect(storedMerchant.businessName).toBe(longBusinessName);
      });

      test('should handle special characters in business name', async () => {
        const specialBusinessName = 'Café & Restaurant "Le Spécial" - München';
        const data = {
          ...validRegistrationData,
          businessName: specialBusinessName,
          email: 'special@example.com'
        };

        const result = await merchantService.register(data);
        expect(result.merchantId).toBeDefined();
        
        const storedMerchant = merchantService.merchants.get(result.merchantId);
        expect(storedMerchant.businessName).toBe(specialBusinessName);
      });

      test('should handle mainnet stacks addresses', async () => {
        const mainnetAddress = 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE';
        const data = {
          ...validRegistrationData,
          stacksAddress: mainnetAddress,
          email: 'mainnet@example.com'
        };

        const result = await merchantService.register(data);
        expect(result.merchantId).toBeDefined();
        
        const storedMerchant = merchantService.merchants.get(result.merchantId);
        expect(storedMerchant.stacksAddress).toBe(mainnetAddress);
      });
    });
  });

  describe('findById', () => {
    let registeredMerchant;

    beforeEach(async () => {
      const registrationData = {
        businessName: 'Test Business for Lookup',
        email: 'lookup@example.com',
        stacksAddress: 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE'
      };
      registeredMerchant = await merchantService.register(registrationData);
    });

    test('should find merchant by valid ID', async () => {
      const found = await merchantService.findById(registeredMerchant.merchantId);

      expect(found).toBeDefined();
      expect(found.id).toBe(registeredMerchant.merchantId);
      expect(found.businessName).toBe('Test Business for Lookup');
      expect(found.email).toBe('lookup@example.com');
      expect(found.apiKey).toBe(registeredMerchant.apiKey);
    });

    test('should return null for non-existent merchant ID', async () => {
      const found = await merchantService.findById('non_existent_merchant_id');
      expect(found).toBeNull();
    });

    test('should return null for null merchant ID', async () => {
      const found = await merchantService.findById(null);
      expect(found).toBeNull();
    });

    test('should return null for undefined merchant ID', async () => {
      const found = await merchantService.findById(undefined);
      expect(found).toBeNull();
    });

    test('should return null for empty merchant ID', async () => {
      const found = await merchantService.findById('');
      expect(found).toBeNull();
    });
  });

  describe('getDashboardStats', () => {
    let merchantId;

    beforeEach(async () => {
      const registrationData = {
        businessName: 'Stats Test Business',
        email: 'stats@example.com',
        stacksAddress: 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE'
      };
      const registered = await merchantService.register(registrationData);
      merchantId = registered.merchantId;
    });

    test('should return initial stats for new merchant', async () => {
      const stats = await merchantService.getDashboardStats(merchantId);

      expect(stats).toBeDefined();
      expect(stats.totalProcessed).toBe(0);
      expect(stats.feeCollected).toBe(0);
      expect(stats.paymentsCount).toBe(0);
      expect(stats.activePayments).toBe(0);
      expect(stats.successfulPayments).toBe(0);
      expect(stats.recentPayments).toEqual([]);
    });

    test('should return updated stats after merchant activity', async () => {
      // Simulate merchant activity by updating stats
      await merchantService.updateStats(merchantId, {
        totalProcessed: 500000,
        feeCollected: 5000,
        paymentsCount: 3,
        activePayments: 1,
        successfulPayments: 2
      });

      const stats = await merchantService.getDashboardStats(merchantId);

      expect(stats.totalProcessed).toBe(500000);
      expect(stats.feeCollected).toBe(5000);
      expect(stats.paymentsCount).toBe(3);
      expect(stats.activePayments).toBe(1);
      expect(stats.successfulPayments).toBe(2);
    });

    test('should throw error for non-existent merchant', async () => {
      await expect(merchantService.getDashboardStats('non_existent_merchant'))
        .rejects.toThrow('Merchant not found');
    });

    test('should handle multiple concurrent stats requests', async () => {
      const promises = Array.from({ length: 10 }, () => 
        merchantService.getDashboardStats(merchantId)
      );

      const results = await Promise.all(promises);

      results.forEach(stats => {
        expect(stats).toBeDefined();
        expect(typeof stats.totalProcessed).toBe('number');
        expect(typeof stats.feeCollected).toBe('number');
        expect(typeof stats.paymentsCount).toBe('number');
      });
    });
  });

  describe('updateStats', () => {
    let merchantId;

    beforeEach(async () => {
      const registrationData = {
        businessName: 'Update Stats Test Business',
        email: 'updatestats@example.com',
        stacksAddress: 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE'
      };
      const registered = await merchantService.register(registrationData);
      merchantId = registered.merchantId;
    });

    test('should update individual stat fields', async () => {
      await merchantService.updateStats(merchantId, {
        totalProcessed: 100000
      });

      const stats = await merchantService.getDashboardStats(merchantId);
      expect(stats.totalProcessed).toBe(100000);
      expect(stats.feeCollected).toBe(0); // Should remain unchanged
    });

    test('should update multiple stat fields', async () => {
      await merchantService.updateStats(merchantId, {
        totalProcessed: 250000,
        feeCollected: 2500,
        paymentsCount: 5
      });

      const stats = await merchantService.getDashboardStats(merchantId);
      expect(stats.totalProcessed).toBe(250000);
      expect(stats.feeCollected).toBe(2500);
      expect(stats.paymentsCount).toBe(5);
    });

    test('should accumulate stats across multiple updates', async () => {
      // First update
      await merchantService.updateStats(merchantId, {
        totalProcessed: 100000,
        feeCollected: 1000,
        paymentsCount: 1
      });

      // Second update
      await merchantService.updateStats(merchantId, {
        totalProcessed: 150000,
        feeCollected: 1500,
        paymentsCount: 1
      });

      const stats = await merchantService.getDashboardStats(merchantId);
      expect(stats.totalProcessed).toBe(250000); // 100000 + 150000
      expect(stats.feeCollected).toBe(2500); // 1000 + 1500
      expect(stats.paymentsCount).toBe(2); // 1 + 1
    });

    test('should handle zero and negative values appropriately', async () => {
      await merchantService.updateStats(merchantId, {
        totalProcessed: 0,
        feeCollected: -500, // This should be handled appropriately
        paymentsCount: 0
      });

      const stats = await merchantService.getDashboardStats(merchantId);
      expect(stats.totalProcessed).toBe(0);
      expect(stats.feeCollected).toBe(0); // Should not go negative
      expect(stats.paymentsCount).toBe(0);
    });

    test('should add recent payment to history', async () => {
      const paymentData = {
        id: 'pi_test_123456',
        amount: 100000,
        status: 'succeeded',
        createdAt: new Date().toISOString(),
        description: 'Test payment'
      };

      await merchantService.updateStats(merchantId, {
        totalProcessed: paymentData.amount,
        feeCollected: 1000,
        paymentsCount: 1
      }, paymentData);

      const stats = await merchantService.getDashboardStats(merchantId);
      expect(stats.recentPayments).toHaveLength(1);
      expect(stats.recentPayments[0]).toMatchObject({
        id: paymentData.id,
        amount: paymentData.amount,
        status: paymentData.status
      });
    });

    test('should limit recent payments to maximum count', async () => {
      // Add more than the maximum number of recent payments
      for (let i = 0; i < 15; i++) {
        const paymentData = {
          id: `pi_test_${i}`,
          amount: 50000,
          status: 'succeeded',
          createdAt: new Date().toISOString(),
          description: `Test payment ${i}`
        };

        await merchantService.updateStats(merchantId, {
          totalProcessed: 50000,
          feeCollected: 500,
          paymentsCount: 1
        }, paymentData);
      }

      const stats = await merchantService.getDashboardStats(merchantId);
      expect(stats.recentPayments.length).toBeLessThanOrEqual(10); // Assuming max is 10
    });

    test('should throw error for non-existent merchant', async () => {
      await expect(merchantService.updateStats('non_existent_merchant', {
        totalProcessed: 100000
      })).rejects.toThrow('Merchant not found');
    });

    test('should handle concurrent stats updates safely', async () => {
      const updates = Array.from({ length: 10 }, (_, i) => 
        merchantService.updateStats(merchantId, {
          totalProcessed: 10000,
          feeCollected: 100,
          paymentsCount: 1
        })
      );

      await Promise.all(updates);

      const stats = await merchantService.getDashboardStats(merchantId);
      expect(stats.totalProcessed).toBe(100000); // 10 * 10000
      expect(stats.feeCollected).toBe(1000); // 10 * 100
      expect(stats.paymentsCount).toBe(10); // 10 * 1
    });
  });

  describe('findByEmail', () => {
    let testMerchants;

    beforeEach(async () => {
      testMerchants = [];
      
      // Register multiple merchants
      for (let i = 0; i < 3; i++) {
        const registration = await merchantService.register({
          businessName: `Test Business ${i}`,
          email: `test${i}@example.com`,
          stacksAddress: global.testUtils.generateStacksAddress()
        });
        testMerchants.push(registration);
      }
    });

    test('should find merchant by email', async () => {
      const found = await merchantService.findByEmail('test1@example.com');
      
      expect(found).toBeDefined();
      expect(found.email).toBe('test1@example.com');
      expect(found.businessName).toBe('Test Business 1');
    });

    test('should return null for non-existent email', async () => {
      const found = await merchantService.findByEmail('nonexistent@example.com');
      expect(found).toBeNull();
    });

    test('should be case insensitive', async () => {
      const found = await merchantService.findByEmail('TEST1@EXAMPLE.COM');
      expect(found).toBeDefined();
      expect(found.email).toBe('test1@example.com');
    });
  });

  describe('findByStacksAddress', () => {
    let testAddress;

    beforeEach(async () => {
      testAddress = global.testUtils.generateStacksAddress();
      await merchantService.register({
        businessName: 'Address Test Business',
        email: 'addresstest@example.com',
        stacksAddress: testAddress
      });
    });

    test('should find merchant by stacks address', async () => {
      const found = await merchantService.findByStacksAddress(testAddress);
      
      expect(found).toBeDefined();
      expect(found.stacksAddress).toBe(testAddress);
      expect(found.businessName).toBe('Address Test Business');
    });

    test('should return null for non-existent address', async () => {
      const fakeAddress = global.testUtils.generateStacksAddress();
      const found = await merchantService.findByStacksAddress(fakeAddress);
      expect(found).toBeNull();
    });
  });

  describe('performance and scalability', () => {
    test('should handle large numbers of merchant registrations efficiently', async () => {
      const merchantCount = 100;
      const start = Date.now();

      const promises = Array.from({ length: merchantCount }, (_, i) => 
        merchantService.register({
          businessName: `Performance Test Business ${i}`,
          email: `perftest${i}@example.com`,
          stacksAddress: global.testUtils.generateStacksAddress()
        })
      );

      await Promise.all(promises);

      const duration = Date.now() - start;
      const avgTime = duration / merchantCount;

      expect(avgTime).toBeLessThan(20); // Should take less than 20ms per registration on average
      expect(merchantService.merchants.size).toBe(merchantCount);
    });

    test('should retrieve merchant data efficiently at scale', async () => {
      // Register merchants first
      const merchants = [];
      for (let i = 0; i < 50; i++) {
        const merchant = await merchantService.register({
          businessName: `Scale Test Business ${i}`,
          email: `scaletest${i}@example.com`,
          stacksAddress: global.testUtils.generateStacksAddress()
        });
        merchants.push(merchant);
      }

      // Measure retrieval performance
      const start = Date.now();
      
      for (const merchant of merchants) {
        await merchantService.findById(merchant.merchantId);
        await merchantService.getDashboardStats(merchant.merchantId);
      }

      const duration = Date.now() - start;
      const avgTime = duration / (merchants.length * 2); // 2 operations per merchant

      expect(avgTime).toBeLessThan(10); // Should take less than 10ms per operation on average
    });

    test('should handle concurrent dashboard stat requests efficiently', async () => {
      const merchant = await merchantService.register({
        businessName: 'Concurrent Test Business',
        email: 'concurrent@example.com',
        stacksAddress: global.testUtils.generateStacksAddress()
      });

      const concurrentRequests = 20;
      const start = Date.now();

      const promises = Array.from({ length: concurrentRequests }, () =>
        merchantService.getDashboardStats(merchant.merchantId)
      );

      const results = await Promise.all(promises);

      const duration = Date.now() - start;

      expect(results.length).toBe(concurrentRequests);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      
      // All results should be identical
      results.forEach(result => {
        expect(result).toEqual(results[0]);
      });
    });
  });

  describe('data integrity and consistency', () => {
    test('should maintain data consistency across service restarts', async () => {
      const originalData = {
        businessName: 'Consistency Test Business',
        email: 'consistency@example.com',
        stacksAddress: global.testUtils.generateStacksAddress()
      };

      const registered = await merchantService.register(originalData);
      
      // Update stats
      await merchantService.updateStats(registered.merchantId, {
        totalProcessed: 100000,
        feeCollected: 1000,
        paymentsCount: 2
      });

      // Simulate service restart by creating new instance
      const newService = new MerchantService();
      
      // Data should not be accessible after restart (in-memory storage)
      const found = await newService.findById(registered.merchantId);
      expect(found).toBeNull();
    });

    test('should maintain referential integrity between merchants and stats', async () => {
      const merchant = await merchantService.register({
        businessName: 'Integrity Test Business',
        email: 'integrity@example.com',
        stacksAddress: global.testUtils.generateStacksAddress()
      });

      // Verify both merchant and stats exist
      const foundMerchant = await merchantService.findById(merchant.merchantId);
      const stats = await merchantService.getDashboardStats(merchant.merchantId);

      expect(foundMerchant).toBeDefined();
      expect(stats).toBeDefined();
      expect(merchantService.merchants.has(merchant.merchantId)).toBe(true);
      expect(merchantService.merchantStats.has(merchant.merchantId)).toBe(true);
    });
  });
});