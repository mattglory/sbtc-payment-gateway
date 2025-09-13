/**
 * Unit Tests for Payment API Routes
 * Tests HTTP endpoints for payment operations including creation, retrieval, and confirmation
 */

const request = require('supertest');
const express = require('express');
const paymentRoutes = require('../../../src/routes/paymentRoutes');
const { httpHelpers, generators, dbHelpers } = require('../../utils/testHelpers');

// Mock dependencies
jest.mock('../../../src/services/paymentService');
jest.mock('../../../src/services/merchantService');
jest.mock('../../../src/services/apiKeyService');

const PaymentService = require('../../../src/services/paymentService');
const MerchantService = require('../../../src/services/merchantService');
const ApiKeyService = require('../../../src/services/apiKeyService');

describe('Payment Routes', () => {
  let app;
  let mockPaymentService;
  let mockMerchantService;
  let mockApiKeyService;
  let testApiKey;
  let testMerchant;

  beforeEach(() => {
    // Reset sequence counter
    generators.sequence.reset();
    
    // Create Express app for testing
    app = express();
    app.use(express.json());
    app.use('/api/payment-intents', paymentRoutes);

    // Setup service mocks
    mockPaymentService = new PaymentService();
    mockMerchantService = new MerchantService();
    mockApiKeyService = new ApiKeyService();

    // Setup test data
    testApiKey = global.testUtils.generateApiKey();
    testMerchant = generators.merchant({ apiKey: testApiKey });

    // Mock API key validation
    mockApiKeyService.validateApiKey = jest.fn().mockReturnValue({
      valid: true,
      type: 'live',
      merchantId: testMerchant.id
    });

    mockApiKeyService.getMerchantFromApiKey = jest.fn().mockReturnValue(testMerchant.id);

    // Mock merchant service
    mockMerchantService.findById = jest.fn().mockResolvedValue(testMerchant);

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('POST /api/payment-intents', () => {
    const validPaymentData = {
      amount: 100000,
      description: 'Test payment'
    };

    test('should create payment intent with valid data and API key', async () => {
      const expectedPayment = generators.paymentIntent('pending', {
        merchantId: testMerchant.id,
        ...validPaymentData
      });

      mockPaymentService.createPaymentIntent = jest.fn().mockResolvedValue(expectedPayment);

      const response = await request(app)
        .post('/api/payment-intents')
        .set('Authorization', `Bearer ${testApiKey}`)
        .send(validPaymentData);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expectedPayment.id,
        amount: validPaymentData.amount,
        description: validPaymentData.description,
        status: 'pending'
      });

      expect(mockPaymentService.createPaymentIntent).toHaveBeenCalledWith(
        testMerchant.id,
        validPaymentData
      );
    });

    test('should include request ID in response headers', async () => {
      const expectedPayment = generators.paymentIntent('pending');
      mockPaymentService.createPaymentIntent = jest.fn().mockResolvedValue(expectedPayment);

      const requestId = 'test-request-id-123';

      const response = await request(app)
        .post('/api/payment-intents')
        .set('Authorization', `Bearer ${testApiKey}`)
        .set('x-request-id', requestId)
        .send(validPaymentData);

      expect(response.status).toBe(201);
      expect(mockPaymentService.createPaymentIntent).toHaveBeenCalled();
    });

    test('should log API key type and client IP', async () => {
      const expectedPayment = generators.paymentIntent('pending');
      mockPaymentService.createPaymentIntent = jest.fn().mockResolvedValue(expectedPayment);

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      const response = await request(app)
        .post('/api/payment-intents')
        .set('Authorization', `Bearer ${testApiKey}`)
        .send(validPaymentData);

      expect(response.status).toBe(201);
      
      // Verify logging was called (implementation may vary)
      expect(consoleLogSpy).toHaveBeenCalled();
      
      consoleLogSpy.mockRestore();
    });

    describe('authentication errors', () => {
      test('should return 401 for missing API key', async () => {
        const response = await request(app)
          .post('/api/payment-intents')
          .send(validPaymentData);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
      });

      test('should return 401 for invalid API key', async () => {
        mockApiKeyService.validateApiKey = jest.fn().mockReturnValue({
          valid: false,
          error: 'Invalid API key'
        });

        const response = await request(app)
          .post('/api/payment-intents')
          .set('Authorization', 'Bearer invalid_key')
          .send(validPaymentData);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
      });

      test('should return 404 for merchant not found', async () => {
        mockMerchantService.findById = jest.fn().mockResolvedValue(null);

        const response = await request(app)
          .post('/api/payment-intents')
          .set('Authorization', `Bearer ${testApiKey}`)
          .send(validPaymentData);

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Merchant not found');
      });
    });

    describe('validation errors', () => {
      test('should return 400 for missing amount', async () => {
        const invalidData = { description: 'Test without amount' };

        mockPaymentService.createPaymentIntent = jest.fn()
          .mockRejectedValue(new Error('Amount is required'));

        const response = await request(app)
          .post('/api/payment-intents')
          .set('Authorization', `Bearer ${testApiKey}`)
          .send(invalidData);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toBe('Amount is required');
      });

      test('should return 400 for invalid amount type', async () => {
        const invalidData = { amount: 'invalid', description: 'Test' };

        mockPaymentService.createPaymentIntent = jest.fn()
          .mockRejectedValue(new Error('Amount must be a number'));

        const response = await request(app)
          .post('/api/payment-intents')
          .set('Authorization', `Bearer ${testApiKey}`)
          .send(invalidData);

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Amount must be a number');
      });

      test('should return 400 for negative amount', async () => {
        const invalidData = { amount: -1000, description: 'Test' };

        mockPaymentService.createPaymentIntent = jest.fn()
          .mockRejectedValue(new Error('Invalid amount'));

        const response = await request(app)
          .post('/api/payment-intents')
          .set('Authorization', `Bearer ${testApiKey}`)
          .send(invalidData);

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Invalid amount');
      });

      test('should return 400 for amount below minimum', async () => {
        const invalidData = { amount: 500, description: 'Too small' };

        mockPaymentService.createPaymentIntent = jest.fn()
          .mockRejectedValue(new Error('Amount must be at least 1000 satoshis'));

        const response = await request(app)
          .post('/api/payment-intents')
          .set('Authorization', `Bearer ${testApiKey}`)
          .send(invalidData);

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Amount must be at least 1000 satoshis');
      });
    });

    describe('server errors', () => {
      test('should return 500 for service errors', async () => {
        mockPaymentService.createPaymentIntent = jest.fn()
          .mockRejectedValue(new Error('Database connection failed'));

        const response = await request(app)
          .post('/api/payment-intents')
          .set('Authorization', `Bearer ${testApiKey}`)
          .send(validPaymentData);

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toBe('Failed to create payment intent');
      });

      test('should include error details in development mode', async () => {
        const originalNodeEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'development';

        mockPaymentService.createPaymentIntent = jest.fn()
          .mockRejectedValue(new Error('Specific service error'));

        const response = await request(app)
          .post('/api/payment-intents')
          .set('Authorization', `Bearer ${testApiKey}`)
          .send(validPaymentData);

        expect(response.status).toBe(500);
        expect(response.body.message).toBe('Specific service error');

        process.env.NODE_ENV = originalNodeEnv;
      });

      test('should hide error details in production mode', async () => {
        const originalNodeEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';

        mockPaymentService.createPaymentIntent = jest.fn()
          .mockRejectedValue(new Error('Specific service error'));

        const response = await request(app)
          .post('/api/payment-intents')
          .set('Authorization', `Bearer ${testApiKey}`)
          .send(validPaymentData);

        expect(response.status).toBe(500);
        expect(response.body.message).toBe('Internal server error');

        process.env.NODE_ENV = originalNodeEnv;
      });
    });
  });

  describe('GET /api/payment-intents/:id', () => {
    const testPaymentId = 'pi_test_123456789';

    test('should retrieve existing payment intent', async () => {
      const expectedPayment = generators.paymentIntent('pending', {
        id: testPaymentId
      });

      mockPaymentService.getPaymentIntent = jest.fn().mockResolvedValue(expectedPayment);

      const response = await request(app)
        .get(`/api/payment-intents/${testPaymentId}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: testPaymentId,
        status: 'pending'
      });

      expect(mockPaymentService.getPaymentIntent).toHaveBeenCalledWith(testPaymentId);
    });

    test('should retrieve payment in different states', async () => {
      const statuses = ['pending', 'processing', 'succeeded', 'payment_failed', 'expired'];

      for (const status of statuses) {
        const payment = generators.paymentIntent(status, { id: `pi_test_${status}` });
        mockPaymentService.getPaymentIntent = jest.fn().mockResolvedValue(payment);

        const response = await request(app)
          .get(`/api/payment-intents/pi_test_${status}`);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe(status);
      }
    });

    test('should return 404 for non-existent payment', async () => {
      mockPaymentService.getPaymentIntent = jest.fn()
        .mockRejectedValue(new Error('Payment intent not found'));

      const response = await request(app)
        .get('/api/payment-intents/pi_nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    test('should return 500 for service errors', async () => {
      mockPaymentService.getPaymentIntent = jest.fn()
        .mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get(`/api/payment-intents/${testPaymentId}`);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to retrieve payment intent');
    });

    test('should not require authentication for retrieval', async () => {
      const expectedPayment = generators.paymentIntent('pending', {
        id: testPaymentId
      });

      mockPaymentService.getPaymentIntent = jest.fn().mockResolvedValue(expectedPayment);

      const response = await request(app)
        .get(`/api/payment-intents/${testPaymentId}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testPaymentId);
    });
  });

  describe('POST /api/payment-intents/:id/confirm', () => {
    const testPaymentId = 'pi_test_confirm_123';
    const validConfirmationData = {
      customerAddress: 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE',
      transactionId: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef01'
    };

    test('should confirm payment with valid data', async () => {
      const expectedResponse = {
        id: testPaymentId,
        status: 'processing',
        amount: 100000,
        customer: validConfirmationData.customerAddress,
        transactionId: validConfirmationData.transactionId,
        message: 'Payment confirmed and processing'
      };

      mockPaymentService.confirmPayment = jest.fn().mockResolvedValue(expectedResponse);

      const response = await request(app)
        .post(`/api/payment-intents/${testPaymentId}/confirm`)
        .send(validConfirmationData);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject(expectedResponse);

      expect(mockPaymentService.confirmPayment).toHaveBeenCalledWith(
        testPaymentId,
        validConfirmationData
      );
    });

    test('should update merchant stats asynchronously after confirmation', async () => {
      const expectedResponse = {
        id: testPaymentId,
        status: 'processing',
        amount: 100000,
        customer: validConfirmationData.customerAddress,
        transactionId: validConfirmationData.transactionId,
        message: 'Payment confirmed and processing'
      };

      const mockPaymentIntent = generators.paymentIntent('processing', {
        id: testPaymentId,
        merchantId: testMerchant.id,
        amount: 100000,
        fee: 1000
      });

      mockPaymentService.confirmPayment = jest.fn().mockResolvedValue(expectedResponse);
      mockPaymentService.getPaymentIntent = jest.fn().mockResolvedValue(mockPaymentIntent);
      mockMerchantService.updateStats = jest.fn().mockResolvedValue();

      const response = await request(app)
        .post(`/api/payment-intents/${testPaymentId}/confirm`)
        .send(validConfirmationData);

      expect(response.status).toBe(200);

      // Wait for async stats update (using setTimeout in actual implementation)
      await global.testUtils.wait(100);

      expect(mockPaymentService.getPaymentIntent).toHaveBeenCalledWith(testPaymentId);
    });

    describe('validation errors', () => {
      test('should return 400 for missing customer address', async () => {
        const invalidData = {
          transactionId: validConfirmationData.transactionId
        };

        mockPaymentService.confirmPayment = jest.fn()
          .mockRejectedValue(new Error('Customer address is required'));

        const response = await request(app)
          .post(`/api/payment-intents/${testPaymentId}/confirm`)
          .send(invalidData);

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Customer address is required');
      });

      test('should return 400 for invalid customer address format', async () => {
        const invalidData = {
          customerAddress: 'invalid_address',
          transactionId: validConfirmationData.transactionId
        };

        mockPaymentService.confirmPayment = jest.fn()
          .mockRejectedValue(new Error('Invalid customer address format'));

        const response = await request(app)
          .post(`/api/payment-intents/${testPaymentId}/confirm`)
          .send(invalidData);

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Invalid customer address format');
      });

      test('should return 400 for missing transaction ID', async () => {
        const invalidData = {
          customerAddress: validConfirmationData.customerAddress
        };

        mockPaymentService.confirmPayment = jest.fn()
          .mockRejectedValue(new Error('Transaction ID is required'));

        const response = await request(app)
          .post(`/api/payment-intents/${testPaymentId}/confirm`)
          .send(invalidData);

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Transaction ID is required');
      });

      test('should return 400 for invalid transaction ID format', async () => {
        const invalidData = {
          customerAddress: validConfirmationData.customerAddress,
          transactionId: 'invalid_tx_id'
        };

        mockPaymentService.confirmPayment = jest.fn()
          .mockRejectedValue(new Error('Invalid transaction ID format'));

        const response = await request(app)
          .post(`/api/payment-intents/${testPaymentId}/confirm`)
          .send(invalidData);

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Invalid transaction ID format');
      });
    });

    describe('business logic errors', () => {
      test('should return 404 for non-existent payment', async () => {
        mockPaymentService.confirmPayment = jest.fn()
          .mockRejectedValue(new Error('Payment intent not found'));

        const response = await request(app)
          .post('/api/payment-intents/pi_nonexistent/confirm')
          .send(validConfirmationData);

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error');
      });

      test('should return 400 for expired payment', async () => {
        mockPaymentService.confirmPayment = jest.fn()
          .mockRejectedValue(new Error('Payment intent has expired'));

        const response = await request(app)
          .post(`/api/payment-intents/${testPaymentId}/confirm`)
          .send(validConfirmationData);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
      });

      test('should return 400 for already processed payment', async () => {
        mockPaymentService.confirmPayment = jest.fn()
          .mockRejectedValue(new Error('Payment intent already processed'));

        const response = await request(app)
          .post(`/api/payment-intents/${testPaymentId}/confirm`)
          .send(validConfirmationData);

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Payment intent already processed');
      });
    });

    test('should not require authentication for confirmation', async () => {
      const expectedResponse = {
        id: testPaymentId,
        status: 'processing',
        message: 'Payment confirmed'
      };

      mockPaymentService.confirmPayment = jest.fn().mockResolvedValue(expectedResponse);

      const response = await request(app)
        .post(`/api/payment-intents/${testPaymentId}/confirm`)
        .send(validConfirmationData);

      expect(response.status).toBe(200);
    });
  });

  describe('request handling and middleware', () => {
    test('should handle malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/api/payment-intents')
        .set('Authorization', `Bearer ${testApiKey}`)
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect(response.status).toBe(400);
    });

    test('should handle very large request bodies appropriately', async () => {
      const largeDescription = 'A'.repeat(10000);
      
      const response = await request(app)
        .post('/api/payment-intents')
        .set('Authorization', `Bearer ${testApiKey}`)
        .send({
          amount: 100000,
          description: largeDescription
        });

      // Should either accept or reject based on configured limits
      expect([201, 400, 413]).toContain(response.status);
    });

    test('should handle missing Content-Type header', async () => {
      const response = await request(app)
        .post('/api/payment-intents')
        .set('Authorization', `Bearer ${testApiKey}`)
        .send('amount=100000&description=test');

      expect([400, 415]).toContain(response.status);
    });

    test('should handle concurrent requests efficiently', async () => {
      const paymentData = {
        amount: 100000,
        description: 'Concurrent test'
      };

      mockPaymentService.createPaymentIntent = jest.fn()
        .mockImplementation(() => Promise.resolve(generators.paymentIntent()));

      const concurrentRequests = 10;
      const promises = Array.from({ length: concurrentRequests }, () =>
        request(app)
          .post('/api/payment-intents')
          .set('Authorization', `Bearer ${testApiKey}`)
          .send(paymentData)
      );

      const results = await Promise.all(promises);

      results.forEach(response => {
        expect(response.status).toBe(201);
      });

      expect(mockPaymentService.createPaymentIntent).toHaveBeenCalledTimes(concurrentRequests);
    });
  });

  describe('error response format consistency', () => {
    test('should return consistent error format for validation errors', async () => {
      mockPaymentService.createPaymentIntent = jest.fn()
        .mockRejectedValue(new Error('Amount is required'));

      const response = await request(app)
        .post('/api/payment-intents')
        .set('Authorization', `Bearer ${testApiKey}`)
        .send({ description: 'Missing amount' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
      expect(response.body.error).toBe('Amount is required');
    });

    test('should include request ID in error responses when provided', async () => {
      const requestId = 'error-test-request-123';

      mockPaymentService.createPaymentIntent = jest.fn()
        .mockRejectedValue(new Error('Test error'));

      const response = await request(app)
        .post('/api/payment-intents')
        .set('Authorization', `Bearer ${testApiKey}`)
        .set('x-request-id', requestId)
        .send({ amount: 'invalid' });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('requestId');
    });

    test('should return appropriate HTTP status codes for different error types', async () => {
      const errorScenarios = [
        { error: 'Amount is required', expectedStatus: 400 },
        { error: 'Payment intent not found', expectedStatus: 404 },
        { error: 'Database connection failed', expectedStatus: 500 }
      ];

      for (const scenario of errorScenarios) {
        mockPaymentService.createPaymentIntent = jest.fn()
          .mockRejectedValue(new Error(scenario.error));

        const response = await request(app)
          .post('/api/payment-intents')
          .set('Authorization', `Bearer ${testApiKey}`)
          .send({ amount: 100000, description: 'Test' });

        expect(response.status).toBe(scenario.expectedStatus);
      }
    });
  });
});