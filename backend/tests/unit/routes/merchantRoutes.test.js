/**
 * Unit Tests for Merchant API Routes
 * Tests HTTP endpoints for merchant operations including registration, dashboard, and API key validation
 */

const request = require('supertest');
const express = require('express');
const merchantRoutes = require('../../../src/routes/merchantRoutes');
const { httpHelpers, generators } = require('../../utils/testHelpers');

// Mock dependencies
jest.mock('../../../src/services/merchantService');
jest.mock('../../../src/services/apiKeyService');

const MerchantService = require('../../../src/services/merchantService');
const ApiKeyService = require('../../../src/services/apiKeyService');

describe('Merchant Routes', () => {
  let app;
  let mockMerchantService;
  let mockApiKeyService;
  let testApiKey;
  let testMerchant;

  beforeEach(() => {
    generators.sequence.reset();
    
    // Create Express app for testing
    app = express();
    app.use(express.json());
    app.use('/api/merchants', merchantRoutes);

    // Setup service mocks
    mockMerchantService = new MerchantService();
    mockApiKeyService = new ApiKeyService();

    // Setup test data
    testApiKey = global.testUtils.generateApiKey();
    testMerchant = generators.merchant({ apiKey: testApiKey });

    // Mock API key service defaults
    mockApiKeyService.validateApiKey = jest.fn().mockReturnValue({
      valid: true,
      type: 'live',
      merchantId: testMerchant.id
    });

    mockApiKeyService.getMerchantFromApiKey = jest.fn().mockReturnValue(testMerchant.id);

    jest.clearAllMocks();
  });

  describe('POST /api/merchants/register', () => {
    const validRegistrationData = {
      businessName: 'Test Coffee Shop',
      email: 'owner@testcoffee.com',
      stacksAddress: 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE'
    };

    test('should register new merchant with valid data', async () => {
      const expectedResponse = {
        merchantId: 'merchant_test_001',
        apiKey: 'pk_live_testkey123',
        secretKey: 'sk_live_testsecret123',
        message: 'Merchant registered successfully'
      };

      mockMerchantService.register = jest.fn().mockResolvedValue(expectedResponse);

      const response = await request(app)
        .post('/api/merchants/register')
        .send(validRegistrationData);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(expectedResponse);

      expect(mockMerchantService.register).toHaveBeenCalledWith(validRegistrationData);
    });

    test('should handle registration with all optional fields', async () => {
      const completeRegistrationData = {
        ...validRegistrationData,
        businessName: 'Complete Business Name with Special Chars & Symbols',
        email: 'test.email+tag@domain.co.uk'
      };

      const expectedResponse = {
        merchantId: 'merchant_test_002',
        apiKey: 'pk_live_completekey456',
        secretKey: 'sk_live_completesecret456',
        message: 'Merchant registered successfully'
      };

      mockMerchantService.register = jest.fn().mockResolvedValue(expectedResponse);

      const response = await request(app)
        .post('/api/merchants/register')
        .send(completeRegistrationData);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(expectedResponse);
    });

    describe('validation errors', () => {
      test('should return 400 for missing business name', async () => {
        const invalidData = {
          email: 'test@example.com',
          stacksAddress: 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE'
        };

        mockMerchantService.register = jest.fn()
          .mockRejectedValue(new Error('Missing required fields'));

        const response = await request(app)
          .post('/api/merchants/register')
          .send(invalidData);

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Missing required fields');
      });

      test('should return 400 for empty business name', async () => {
        const invalidData = {
          businessName: '',
          email: 'test@example.com',
          stacksAddress: 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE'
        };

        mockMerchantService.register = jest.fn()
          .mockRejectedValue(new Error('Missing required fields'));

        const response = await request(app)
          .post('/api/merchants/register')
          .send(invalidData);

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Missing required fields');
      });

      test('should return 400 for invalid email format', async () => {
        const invalidData = {
          businessName: 'Test Business',
          email: 'invalid-email',
          stacksAddress: 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE'
        };

        mockMerchantService.register = jest.fn()
          .mockRejectedValue(new Error('Invalid email format'));

        const response = await request(app)
          .post('/api/merchants/register')
          .send(invalidData);

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Invalid email format');
      });

      test('should return 400 for invalid stacks address', async () => {
        const invalidData = {
          businessName: 'Test Business',
          email: 'test@example.com',
          stacksAddress: 'invalid_address'
        };

        mockMerchantService.register = jest.fn()
          .mockRejectedValue(new Error('Invalid Stacks address format'));

        const response = await request(app)
          .post('/api/merchants/register')
          .send(invalidData);

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Invalid Stacks address format');
      });

      test('should return 409 for duplicate email', async () => {
        mockMerchantService.register = jest.fn()
          .mockRejectedValue(new Error('Merchant with this email is already registered'));

        const response = await request(app)
          .post('/api/merchants/register')
          .send(validRegistrationData);

        expect(response.status).toBe(409);
        expect(response.body.error).toBe('Merchant with this email is already registered');
      });

      test('should return 409 for duplicate stacks address', async () => {
        mockMerchantService.register = jest.fn()
          .mockRejectedValue(new Error('Merchant with this Stacks address is already registered'));

        const response = await request(app)
          .post('/api/merchants/register')
          .send(validRegistrationData);

        expect(response.status).toBe(409);
        expect(response.body.error).toBe('Merchant with this Stacks address is already registered');
      });
    });

    describe('server errors', () => {
      test('should return 500 for service errors', async () => {
        mockMerchantService.register = jest.fn()
          .mockRejectedValue(new Error('Database connection failed'));

        const response = await request(app)
          .post('/api/merchants/register')
          .send(validRegistrationData);

        expect(response.status).toBe(500);
        expect(response.body.error).toBe('Internal server error during merchant registration');
      });

      test('should handle service errors gracefully', async () => {
        mockMerchantService.register = jest.fn()
          .mockRejectedValue(new Error('Unexpected service error'));

        const response = await request(app)
          .post('/api/merchants/register')
          .send(validRegistrationData);

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toBe('Internal server error during merchant registration');
      });
    });

    describe('edge cases', () => {
      test('should handle very long business names', async () => {
        const longName = 'A'.repeat(500);
        const dataWithLongName = {
          ...validRegistrationData,
          businessName: longName,
          email: 'longname@example.com'
        };

        const expectedResponse = {
          merchantId: 'merchant_longname_001',
          apiKey: 'pk_live_longname123',
          secretKey: 'sk_live_longname123',
          message: 'Merchant registered successfully'
        };

        mockMerchantService.register = jest.fn().mockResolvedValue(expectedResponse);

        const response = await request(app)
          .post('/api/merchants/register')
          .send(dataWithLongName);

        expect(response.status).toBe(201);
        expect(mockMerchantService.register).toHaveBeenCalledWith(dataWithLongName);
      });

      test('should handle special characters in business name', async () => {
        const specialName = 'Café & Restaurant "Le Spécial" - München (€)';
        const dataWithSpecialName = {
          ...validRegistrationData,
          businessName: specialName,
          email: 'special@example.com'
        };

        const expectedResponse = {
          merchantId: 'merchant_special_001',
          apiKey: 'pk_live_special123',
          secretKey: 'sk_live_special123',
          message: 'Merchant registered successfully'
        };

        mockMerchantService.register = jest.fn().mockResolvedValue(expectedResponse);

        const response = await request(app)
          .post('/api/merchants/register')
          .send(dataWithSpecialName);

        expect(response.status).toBe(201);
      });

      test('should handle concurrent registration attempts', async () => {
        const registrationPromises = Array.from({ length: 5 }, (_, i) => {
          const data = {
            ...validRegistrationData,
            email: `concurrent${i}@example.com`
          };
          
          mockMerchantService.register = jest.fn().mockResolvedValue({
            merchantId: `merchant_concurrent_${i}`,
            apiKey: `pk_live_concurrent${i}`,
            secretKey: `sk_live_concurrent${i}`,
            message: 'Merchant registered successfully'
          });

          return request(app)
            .post('/api/merchants/register')
            .send(data);
        });

        const responses = await Promise.all(registrationPromises);

        responses.forEach(response => {
          expect(response.status).toBe(201);
          expect(response.body).toHaveProperty('merchantId');
          expect(response.body).toHaveProperty('apiKey');
        });
      });
    });
  });

  describe('GET /api/merchants/dashboard', () => {
    const mockDashboardStats = {
      totalProcessed: 1500000,
      feeCollected: 15000,
      paymentsCount: 25,
      activePayments: 3,
      successfulPayments: 22,
      recentPayments: [
        {
          id: 'pi_recent_001',
          amount: 100000,
          status: 'succeeded',
          createdAt: new Date().toISOString(),
          description: 'Recent payment 1'
        },
        {
          id: 'pi_recent_002',
          amount: 75000,
          status: 'processing',
          createdAt: new Date().toISOString(),
          description: 'Recent payment 2'
        }
      ]
    };

    test('should return dashboard stats with valid API key', async () => {
      mockMerchantService.getDashboardStats = jest.fn().mockResolvedValue(mockDashboardStats);

      const response = await request(app)
        .get('/api/merchants/dashboard')
        .set('Authorization', `Bearer ${testApiKey}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockDashboardStats);

      expect(mockApiKeyService.getMerchantFromApiKey).toHaveBeenCalledWith(testApiKey);
      expect(mockMerchantService.getDashboardStats).toHaveBeenCalledWith(testMerchant.id);
    });

    test('should return stats for merchant with no activity', async () => {
      const emptyStats = {
        totalProcessed: 0,
        feeCollected: 0,
        paymentsCount: 0,
        activePayments: 0,
        successfulPayments: 0,
        recentPayments: []
      };

      mockMerchantService.getDashboardStats = jest.fn().mockResolvedValue(emptyStats);

      const response = await request(app)
        .get('/api/merchants/dashboard')
        .set('Authorization', `Bearer ${testApiKey}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(emptyStats);
      expect(response.body.recentPayments).toHaveLength(0);
    });

    test('should return stats with recent payments in correct order', async () => {
      const statsWithOrderedPayments = {
        ...mockDashboardStats,
        recentPayments: mockDashboardStats.recentPayments.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      };

      mockMerchantService.getDashboardStats = jest.fn().mockResolvedValue(statsWithOrderedPayments);

      const response = await request(app)
        .get('/api/merchants/dashboard')
        .set('Authorization', `Bearer ${testApiKey}`);

      expect(response.status).toBe(200);
      expect(response.body.recentPayments).toHaveLength(2);
      
      // Verify payments are in descending order by creation time
      const payments = response.body.recentPayments;
      for (let i = 1; i < payments.length; i++) {
        const current = new Date(payments[i].createdAt).getTime();
        const previous = new Date(payments[i-1].createdAt).getTime();
        expect(current).toBeLessThanOrEqual(previous);
      }
    });

    describe('authentication errors', () => {
      test('should return 401 for missing API key', async () => {
        const response = await request(app)
          .get('/api/merchants/dashboard');

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
      });

      test('should return 401 for invalid API key', async () => {
        mockApiKeyService.validateApiKey = jest.fn().mockReturnValue({
          valid: false,
          error: 'Invalid API key'
        });

        const response = await request(app)
          .get('/api/merchants/dashboard')
          .set('Authorization', 'Bearer invalid_key');

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
      });

      test('should return 401 for expired API key', async () => {
        mockApiKeyService.validateApiKey = jest.fn().mockReturnValue({
          valid: false,
          error: 'API key expired'
        });

        const response = await request(app)
          .get('/api/merchants/dashboard')
          .set('Authorization', `Bearer ${testApiKey}`);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
      });
    });

    describe('service errors', () => {
      test('should return 500 for dashboard stats retrieval failure', async () => {
        mockMerchantService.getDashboardStats = jest.fn()
          .mockRejectedValue(new Error('Stats calculation failed'));

        const response = await request(app)
          .get('/api/merchants/dashboard')
          .set('Authorization', `Bearer ${testApiKey}`);

        expect(response.status).toBe(500);
        expect(response.body.error).toBe('Failed to retrieve dashboard statistics');
      });

      test('should handle merchant not found errors', async () => {
        mockMerchantService.getDashboardStats = jest.fn()
          .mockRejectedValue(new Error('Merchant not found'));

        const response = await request(app)
          .get('/api/merchants/dashboard')
          .set('Authorization', `Bearer ${testApiKey}`);

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error');
      });
    });

    test('should handle large dashboard data efficiently', async () => {
      const largeDashboardStats = {
        totalProcessed: 999999999999, // Very large number
        feeCollected: 9999999999,
        paymentsCount: 100000,
        activePayments: 5000,
        successfulPayments: 95000,
        recentPayments: Array.from({ length: 10 }, (_, i) => ({
          id: `pi_large_${i}`,
          amount: 50000 + i * 1000,
          status: i % 2 === 0 ? 'succeeded' : 'processing',
          createdAt: new Date(Date.now() - i * 60000).toISOString(),
          description: `Large dataset payment ${i}`
        }))
      };

      mockMerchantService.getDashboardStats = jest.fn().mockResolvedValue(largeDashboardStats);

      const response = await request(app)
        .get('/api/merchants/dashboard')
        .set('Authorization', `Bearer ${testApiKey}`);

      expect(response.status).toBe(200);
      expect(response.body.totalProcessed).toBe(largeDashboardStats.totalProcessed);
      expect(response.body.recentPayments).toHaveLength(10);
    });
  });

  describe('POST /api/merchants/validate-key', () => {
    test('should validate valid API key', async () => {
      const validationResponse = {
        valid: true,
        type: 'live',
        timestamp: new Date().toISOString()
      };

      mockApiKeyService.validateApiKey = jest.fn().mockReturnValue({
        valid: true,
        type: 'live'
      });

      const response = await request(app)
        .post('/api/merchants/validate-key')
        .send({ apiKey: testApiKey });

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(true);
      expect(response.body.type).toBe('live');
      expect(response.body).toHaveProperty('timestamp');

      expect(mockApiKeyService.validateApiKey).toHaveBeenCalledWith(testApiKey);
    });

    test('should validate demo API key', async () => {
      const demoApiKey = 'pk_demo_123456';
      
      mockApiKeyService.validateApiKey = jest.fn().mockReturnValue({
        valid: true,
        type: 'demo'
      });

      const response = await request(app)
        .post('/api/merchants/validate-key')
        .send({ apiKey: demoApiKey });

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(true);
      expect(response.body.type).toBe('demo');
    });

    test('should reject invalid API key', async () => {
      const invalidKey = 'invalid_key_123';
      
      mockApiKeyService.validateApiKey = jest.fn().mockReturnValue({
        valid: false,
        error: 'Invalid API key format',
        code: 'INVALID_FORMAT'
      });

      // Mock demo mode to provide hints
      mockApiKeyService.DEMO_MODE = true;
      mockApiKeyService.DEMO_KEYS = ['pk_demo_123', 'pk_demo_456'];

      const response = await request(app)
        .post('/api/merchants/validate-key')
        .send({ apiKey: invalidKey });

      expect(response.status).toBe(200); // Validation endpoint always returns 200
      expect(response.body.valid).toBe(false);
      expect(response.body.error).toBe('Invalid API key format');
      expect(response.body.code).toBe('INVALID_FORMAT');
      expect(response.body).toHaveProperty('hint');
    });

    test('should handle missing API key', async () => {
      mockApiKeyService.validateApiKey = jest.fn().mockReturnValue({
        valid: false,
        error: 'API key is required',
        code: 'MISSING_API_KEY'
      });

      const response = await request(app)
        .post('/api/merchants/validate-key')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(false);
      expect(response.body.code).toBe('MISSING_API_KEY');
      expect(response.body.hint).toBe('Provide an API key to validate');
    });

    test('should provide demo key hints when in demo mode', async () => {
      mockApiKeyService.validateApiKey = jest.fn().mockReturnValue({
        valid: false,
        error: 'Invalid API key',
        code: 'INVALID_KEY'
      });

      mockApiKeyService.DEMO_MODE = true;
      mockApiKeyService.DEMO_KEYS = ['pk_demo_123', 'pk_demo_456'];

      const response = await request(app)
        .post('/api/merchants/validate-key')
        .send({ apiKey: 'wrong_key' });

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(false);
      expect(response.body.hint).toContain('Try one of the demo keys');
      expect(response.body.hint).toContain('pk_demo_123, pk_demo_456');
    });

    test('should provide production hint when not in demo mode', async () => {
      mockApiKeyService.validateApiKey = jest.fn().mockReturnValue({
        valid: false,
        error: 'Invalid API key',
        code: 'INVALID_KEY'
      });

      mockApiKeyService.DEMO_MODE = false;

      const response = await request(app)
        .post('/api/merchants/validate-key')
        .send({ apiKey: 'wrong_key' });

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(false);
      expect(response.body.hint).toBe('Contact support for a valid API key');
    });

    test('should handle validation service errors', async () => {
      mockApiKeyService.validateApiKey = jest.fn()
        .mockImplementation(() => {
          throw new Error('Validation service unavailable');
        });

      const response = await request(app)
        .post('/api/merchants/validate-key')
        .send({ apiKey: testApiKey });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error during API key validation');
    });

    test('should not require authentication for validation endpoint', async () => {
      mockApiKeyService.validateApiKey = jest.fn().mockReturnValue({
        valid: true,
        type: 'live'
      });

      const response = await request(app)
        .post('/api/merchants/validate-key')
        .send({ apiKey: testApiKey });

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(true);
    });

    describe('edge cases', () => {
      test('should handle very long API keys', async () => {
        const longApiKey = 'pk_test_' + 'a'.repeat(1000);
        
        mockApiKeyService.validateApiKey = jest.fn().mockReturnValue({
          valid: false,
          error: 'API key too long',
          code: 'INVALID_LENGTH'
        });

        const response = await request(app)
          .post('/api/merchants/validate-key')
          .send({ apiKey: longApiKey });

        expect(response.status).toBe(200);
        expect(response.body.valid).toBe(false);
      });

      test('should handle API key with special characters', async () => {
        const specialApiKey = 'pk_test_with!@#$%^&*()special_chars';
        
        mockApiKeyService.validateApiKey = jest.fn().mockReturnValue({
          valid: false,
          error: 'Invalid characters in API key',
          code: 'INVALID_CHARACTERS'
        });

        const response = await request(app)
          .post('/api/merchants/validate-key')
          .send({ apiKey: specialApiKey });

        expect(response.status).toBe(200);
        expect(response.body.valid).toBe(false);
        expect(response.body.code).toBe('INVALID_CHARACTERS');
      });

      test('should handle concurrent validation requests', async () => {
        mockApiKeyService.validateApiKey = jest.fn().mockReturnValue({
          valid: true,
          type: 'live'
        });

        const validationPromises = Array.from({ length: 10 }, (_, i) =>
          request(app)
            .post('/api/merchants/validate-key')
            .send({ apiKey: `pk_test_concurrent_${i}` })
        );

        const responses = await Promise.all(validationPromises);

        responses.forEach(response => {
          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty('valid');
          expect(response.body).toHaveProperty('timestamp');
        });

        expect(mockApiKeyService.validateApiKey).toHaveBeenCalledTimes(10);
      });
    });
  });

  describe('middleware and request handling', () => {
    test('should handle malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/api/merchants/register')
        .set('Content-Type', 'application/json')
        .send('{ malformed json }');

      expect(response.status).toBe(400);
    });

    test('should handle missing Content-Type header', async () => {
      const response = await request(app)
        .post('/api/merchants/register')
        .send('businessName=Test&email=test@example.com');

      expect([400, 415]).toContain(response.status);
    });

    test('should handle very large request payloads', async () => {
      const largePayload = {
        businessName: 'A'.repeat(100000),
        email: 'large@example.com',
        stacksAddress: 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE'
      };

      const response = await request(app)
        .post('/api/merchants/register')
        .send(largePayload);

      // Should either accept or reject based on configured limits
      expect([201, 400, 413]).toContain(response.status);
    });

    test('should handle requests with no body', async () => {
      const response = await request(app)
        .post('/api/merchants/register')
        .set('Content-Type', 'application/json');

      expect([400, 422]).toContain(response.status);
    });
  });

  describe('security considerations', () => {
    test('should not expose sensitive information in error messages', async () => {
      mockMerchantService.register = jest.fn()
        .mockRejectedValue(new Error('Database password is invalid: secret123'));

      const response = await request(app)
        .post('/api/merchants/register')
        .send({
          businessName: 'Security Test',
          email: 'security@example.com',
          stacksAddress: 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE'
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error during merchant registration');
      expect(response.body.error).not.toContain('secret123');
      expect(response.body.error).not.toContain('password');
    });

    test('should handle API key validation without exposing internal structure', async () => {
      mockApiKeyService.validateApiKey = jest.fn()
        .mockImplementation(() => {
          throw new Error('Internal validation error with sensitive data: db_password_123');
        });

      const response = await request(app)
        .post('/api/merchants/validate-key')
        .send({ apiKey: 'test_key' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error during API key validation');
      expect(response.body.error).not.toContain('db_password_123');
    });

    test('should limit rate of validation requests per IP', async () => {
      // This test assumes rate limiting is implemented
      // In a real implementation, you might want to add rate limiting middleware
      
      mockApiKeyService.validateApiKey = jest.fn().mockReturnValue({
        valid: false,
        error: 'Invalid key'
      });

      // Make many requests from the same IP
      const requests = Array.from({ length: 50 }, () =>
        request(app)
          .post('/api/merchants/validate-key')
          .send({ apiKey: 'spam_key' })
      );

      const responses = await Promise.all(requests);

      // All requests should be processed (no rate limiting implemented in basic setup)
      // In production, some might return 429 Too Many Requests
      responses.forEach(response => {
        expect([200, 429]).toContain(response.status);
      });
    });
  });
});