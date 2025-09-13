/**
 * Integration Tests for Complete Payment Flows
 * Tests end-to-end payment scenarios from creation to completion
 */

const request = require('supertest');
const express = require('express');
const { generators, performanceHelpers } = require('../utils/testHelpers');

// Import actual services for integration testing
const PaymentService = require('../../src/services/paymentService');
const MerchantService = require('../../src/services/merchantService');
const ApiKeyService = require('../../src/services/apiKeyService');

// Import routes
const paymentRoutes = require('../../src/routes/paymentRoutes');
const merchantRoutes = require('../../src/routes/merchantRoutes');

describe('Payment Flow Integration Tests', () => {
  let app;
  let paymentService;
  let merchantService;
  let apiKeyService;
  let testMerchant;
  let testApiKey;

  beforeAll(async () => {
    // Setup Express app with actual routes
    app = express();
    app.use(express.json());
    
    // Add middleware to simulate API key authentication
    app.use((req, res, next) => {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const apiKey = authHeader.substring(7);
        req.apiKeyInfo = {
          key: apiKey,
          type: apiKey.startsWith('pk_demo_') ? 'demo' : 'live'
        };
      }
      next();
    });
    
    app.use('/api/payment-intents', paymentRoutes);
    app.use('/api/merchants', merchantRoutes);
    
    // Initialize services
    paymentService = new PaymentService();
    merchantService = new MerchantService();
    apiKeyService = new ApiKeyService();
    
    // Override service instances in routes (if needed for integration)
    // This would typically be done through dependency injection
  });

  beforeEach(async () => {
    generators.sequence.reset();
    
    // Register a test merchant for each test
    const merchantData = {
      businessName: 'Integration Test Merchant',
      email: `integration.test.${Date.now()}@example.com`,
      stacksAddress: global.testUtils.generateStacksAddress()
    };

    testMerchant = await merchantService.register(merchantData);
    testApiKey = testMerchant.apiKey;
  });

  describe('Complete Payment Flow - Happy Path', () => {
    test('should complete full payment lifecycle: create → retrieve → confirm → succeed', async () => {
      // Step 1: Create payment intent
      const paymentData = {
        amount: 150000,
        description: 'Integration test payment - full lifecycle'
      };

      const createResponse = await request(app)
        .post('/api/payment-intents')
        .set('Authorization', `Bearer ${testApiKey}`)
        .send(paymentData);

      expect(createResponse.status).toBe(201);
      expect(createResponse.body).toHaveProperty('id');
      expect(createResponse.body.status).toBe('pending');
      expect(createResponse.body.amount).toBe(paymentData.amount);

      const paymentId = createResponse.body.id;

      // Step 2: Retrieve payment intent
      const retrieveResponse = await request(app)
        .get(`/api/payment-intents/${paymentId}`);

      expect(retrieveResponse.status).toBe(200);
      expect(retrieveResponse.body.id).toBe(paymentId);
      expect(retrieveResponse.body.status).toBe('pending');

      // Step 3: Confirm payment
      const confirmationData = {
        customerAddress: global.testUtils.generateStacksAddress(),
        transactionId: global.testUtils.generateTxId()
      };

      const confirmResponse = await request(app)
        .post(`/api/payment-intents/${paymentId}/confirm`)
        .send(confirmationData);

      expect(confirmResponse.status).toBe(200);
      expect(confirmResponse.body.status).toBe('processing');
      expect(confirmResponse.body.customer).toBe(confirmationData.customerAddress);
      expect(confirmResponse.body.transactionId).toBe(confirmationData.transactionId);

      // Step 4: Verify payment is in processing state
      const processingResponse = await request(app)
        .get(`/api/payment-intents/${paymentId}`);

      expect(processingResponse.status).toBe(200);
      expect(processingResponse.body.status).toBe('processing');
      expect(processingResponse.body.customerAddress).toBe(confirmationData.customerAddress);
      expect(processingResponse.body.transactionId).toBe(confirmationData.transactionId);
      expect(processingResponse.body.processingStartedAt).toBeDefined();

      // Step 5: Simulate payment processing completion
      // In a real scenario, this would be handled by blockchain monitoring
      const finalPayment = await paymentService.processPayment(paymentId);

      expect(finalPayment.status).toBe('succeeded');
      expect(finalPayment.succeededAt).toBeDefined();
    });

    test('should handle merchant dashboard updates throughout payment lifecycle', async () => {
      // Initial dashboard state
      const initialDashboard = await request(app)
        .get('/api/merchants/dashboard')
        .set('Authorization', `Bearer ${testApiKey}`);

      expect(initialDashboard.status).toBe(200);
      const initialStats = initialDashboard.body;

      // Create payment intent
      const paymentData = {
        amount: 200000,
        description: 'Dashboard integration test'
      };

      const createResponse = await request(app)
        .post('/api/payment-intents')
        .set('Authorization', `Bearer ${testApiKey}`)
        .send(paymentData);

      expect(createResponse.status).toBe(201);
      const paymentId = createResponse.body.id;

      // Confirm payment
      const confirmationData = {
        customerAddress: global.testUtils.generateStacksAddress(),
        transactionId: global.testUtils.generateTxId()
      };

      const confirmResponse = await request(app)
        .post(`/api/payment-intents/${paymentId}/confirm`)
        .send(confirmationData);

      expect(confirmResponse.status).toBe(200);

      // Complete payment processing
      await paymentService.processPayment(paymentId);

      // Wait for async stats update
      await global.testUtils.wait(100);

      // Check updated dashboard
      const updatedDashboard = await request(app)
        .get('/api/merchants/dashboard')
        .set('Authorization', `Bearer ${testApiKey}`);

      expect(updatedDashboard.status).toBe(200);
      const updatedStats = updatedDashboard.body;

      // Verify stats were updated
      expect(updatedStats.totalProcessed).toBeGreaterThan(initialStats.totalProcessed);
      expect(updatedStats.successfulPayments).toBeGreaterThan(initialStats.successfulPayments);
      expect(updatedStats.paymentsCount).toBeGreaterThan(initialStats.paymentsCount);
      expect(updatedStats.recentPayments.length).toBeGreaterThan(initialStats.recentPayments.length);
    });
  });

  describe('Payment Flow - Error Scenarios', () => {
    test('should handle payment expiration flow', async () => {
      // Create payment intent
      const paymentData = {
        amount: 100000,
        description: 'Expiration test payment'
      };

      const createResponse = await request(app)
        .post('/api/payment-intents')
        .set('Authorization', `Bearer ${testApiKey}`)
        .send(paymentData);

      expect(createResponse.status).toBe(201);
      const paymentId = createResponse.body.id;

      // Manually expire the payment by setting past expiration time
      const payment = await paymentService.getPaymentIntent(paymentId);
      const updatedPayment = {
        ...payment,
        expiresAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        status: 'expired'
      };
      paymentService.payments.set(paymentId, updatedPayment);

      // Try to confirm expired payment
      const confirmationData = {
        customerAddress: global.testUtils.generateStacksAddress(),
        transactionId: global.testUtils.generateTxId()
      };

      const confirmResponse = await request(app)
        .post(`/api/payment-intents/${paymentId}/confirm`)
        .send(confirmationData);

      expect(confirmResponse.status).toBe(400);
      expect(confirmResponse.body.error).toContain('expired');

      // Verify payment status remains expired
      const finalResponse = await request(app)
        .get(`/api/payment-intents/${paymentId}`);

      expect(finalResponse.status).toBe(200);
      expect(finalResponse.body.status).toBe('expired');
    });

    test('should handle payment failure flow', async () => {
      // Create and confirm payment
      const paymentData = {
        amount: 100000,
        description: 'Failure test payment'
      };

      const createResponse = await request(app)
        .post('/api/payment-intents')
        .set('Authorization', `Bearer ${testApiKey}`)
        .send(paymentData);

      expect(createResponse.status).toBe(201);
      const paymentId = createResponse.body.id;

      const confirmationData = {
        customerAddress: global.testUtils.generateStacksAddress(),
        transactionId: global.testUtils.generateTxId()
      };

      await request(app)
        .post(`/api/payment-intents/${paymentId}/confirm`)
        .send(confirmationData);

      // Simulate payment processing failure
      const payment = await paymentService.getPaymentIntent(paymentId);
      const failedPayment = {
        ...payment,
        status: 'payment_failed',
        failedAt: new Date().toISOString(),
        failureReason: 'Insufficient funds'
      };
      paymentService.payments.set(paymentId, failedPayment);

      // Verify failed payment status
      const failedResponse = await request(app)
        .get(`/api/payment-intents/${paymentId}`);

      expect(failedResponse.status).toBe(200);
      expect(failedResponse.body.status).toBe('payment_failed');
      expect(failedResponse.body.failedAt).toBeDefined();
      expect(failedResponse.body.failureReason).toBe('Insufficient funds');
    });

    test('should prevent double-spending by rejecting duplicate confirmations', async () => {
      // Create payment intent
      const paymentData = {
        amount: 100000,
        description: 'Double-spending test'
      };

      const createResponse = await request(app)
        .post('/api/payment-intents')
        .set('Authorization', `Bearer ${testApiKey}`)
        .send(paymentData);

      expect(createResponse.status).toBe(201);
      const paymentId = createResponse.body.id;

      // First confirmation
      const confirmationData = {
        customerAddress: global.testUtils.generateStacksAddress(),
        transactionId: global.testUtils.generateTxId()
      };

      const firstConfirmResponse = await request(app)
        .post(`/api/payment-intents/${paymentId}/confirm`)
        .send(confirmationData);

      expect(firstConfirmResponse.status).toBe(200);
      expect(firstConfirmResponse.body.status).toBe('processing');

      // Second confirmation attempt with different data
      const secondConfirmationData = {
        customerAddress: global.testUtils.generateStacksAddress(),
        transactionId: global.testUtils.generateTxId()
      };

      const secondConfirmResponse = await request(app)
        .post(`/api/payment-intents/${paymentId}/confirm`)
        .send(secondConfirmationData);

      expect(secondConfirmResponse.status).toBe(400);
      expect(secondConfirmResponse.body.error).toContain('already processed');

      // Verify payment still has original confirmation data
      const finalResponse = await request(app)
        .get(`/api/payment-intents/${paymentId}`);

      expect(finalResponse.status).toBe(200);
      expect(finalResponse.body.customerAddress).toBe(confirmationData.customerAddress);
      expect(finalResponse.body.transactionId).toBe(confirmationData.transactionId);
    });
  });

  describe('Multiple Payment Flows', () => {
    test('should handle concurrent payment creations from same merchant', async () => {
      const paymentCount = 5;
      const paymentPromises = Array.from({ length: paymentCount }, (_, i) => 
        request(app)
          .post('/api/payment-intents')
          .set('Authorization', `Bearer ${testApiKey}`)
          .send({
            amount: 50000 + (i * 10000),
            description: `Concurrent payment ${i + 1}`
          })
      );

      const responses = await Promise.all(paymentPromises);

      responses.forEach((response, index) => {
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.amount).toBe(50000 + (index * 10000));
        expect(response.body.status).toBe('pending');
      });

      // Verify all payments have unique IDs
      const paymentIds = responses.map(r => r.body.id);
      const uniqueIds = new Set(paymentIds);
      expect(uniqueIds.size).toBe(paymentIds.length);
    });

    test('should handle payments from multiple merchants simultaneously', async () => {
      // Register additional merchants
      const additionalMerchants = await Promise.all([
        merchantService.register({
          businessName: 'Multi Merchant Test 1',
          email: 'multi1@example.com',
          stacksAddress: global.testUtils.generateStacksAddress()
        }),
        merchantService.register({
          businessName: 'Multi Merchant Test 2',
          email: 'multi2@example.com',
          stacksAddress: global.testUtils.generateStacksAddress()
        })
      ]);

      const allMerchants = [testMerchant, ...additionalMerchants];

      // Create payments from each merchant
      const paymentPromises = allMerchants.map((merchant, index) => 
        request(app)
          .post('/api/payment-intents')
          .set('Authorization', `Bearer ${merchant.apiKey}`)
          .send({
            amount: 75000,
            description: `Multi-merchant payment ${index + 1}`
          })
      );

      const responses = await Promise.all(paymentPromises);

      responses.forEach((response, index) => {
        expect(response.status).toBe(201);
        expect(response.body.amount).toBe(75000);
        expect(response.body.merchantId).toBe(allMerchants[index].merchantId);
      });
    });

    test('should maintain payment isolation between merchants', async () => {
      // Register another merchant
      const secondMerchant = await merchantService.register({
        businessName: 'Isolation Test Merchant',
        email: 'isolation@example.com',
        stacksAddress: global.testUtils.generateStacksAddress()
      });

      // Create payment for first merchant
      const payment1Response = await request(app)
        .post('/api/payment-intents')
        .set('Authorization', `Bearer ${testApiKey}`)
        .send({
          amount: 100000,
          description: 'Merchant 1 payment'
        });

      expect(payment1Response.status).toBe(201);
      const payment1Id = payment1Response.body.id;

      // Create payment for second merchant
      const payment2Response = await request(app)
        .post('/api/payment-intents')
        .set('Authorization', `Bearer ${secondMerchant.apiKey}`)
        .send({
          amount: 150000,
          description: 'Merchant 2 payment'
        });

      expect(payment2Response.status).toBe(201);
      const payment2Id = payment2Response.body.id;

      // Verify each merchant can only access their own dashboard
      const dashboard1Response = await request(app)
        .get('/api/merchants/dashboard')
        .set('Authorization', `Bearer ${testApiKey}`);

      const dashboard2Response = await request(app)
        .get('/api/merchants/dashboard')
        .set('Authorization', `Bearer ${secondMerchant.apiKey}`);

      expect(dashboard1Response.status).toBe(200);
      expect(dashboard2Response.status).toBe(200);

      // Each dashboard should show only their own merchant's data
      expect(dashboard1Response.body).not.toEqual(dashboard2Response.body);
    });
  });

  describe('Performance and Load Testing', () => {
    test('should handle high-throughput payment creation', async () => {
      const { results, stats } = await performanceHelpers.loadTest(
        async () => {
          const response = await request(app)
            .post('/api/payment-intents')
            .set('Authorization', `Bearer ${testApiKey}`)
            .send({
              amount: Math.floor(Math.random() * 100000) + 50000,
              description: 'Load test payment'
            });

          expect(response.status).toBe(201);
          return response.body;
        },
        {
          iterations: 50,
          concurrency: 10,
          label: 'Payment creation load test'
        }
      );

      expect(results.length).toBe(50);
      expect(stats.avgDuration).toBeLessThan(1000); // Should average less than 1 second
      expect(stats.p95Duration).toBeLessThan(2000); // 95th percentile under 2 seconds

      // Verify all payments were created successfully
      results.forEach(result => {
        expect(result.result).toHaveProperty('id');
        expect(result.result.status).toBe('pending');
      });
    });

    test('should handle rapid payment state changes', async () => {
      const paymentCount = 10;

      // Create multiple payments
      const createPromises = Array.from({ length: paymentCount }, () => 
        request(app)
          .post('/api/payment-intents')
          .set('Authorization', `Bearer ${testApiKey}`)
          .send({
            amount: 100000,
            description: 'Rapid state change test'
          })
      );

      const createResponses = await Promise.all(createPromises);
      const paymentIds = createResponses.map(r => r.body.id);

      // Confirm all payments simultaneously
      const confirmPromises = paymentIds.map(paymentId => 
        request(app)
          .post(`/api/payment-intents/${paymentId}/confirm`)
          .send({
            customerAddress: global.testUtils.generateStacksAddress(),
            transactionId: global.testUtils.generateTxId()
          })
      );

      const confirmResponses = await Promise.all(confirmPromises);

      confirmResponses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('processing');
      });

      // Verify all payments are in processing state
      const statusPromises = paymentIds.map(paymentId => 
        request(app).get(`/api/payment-intents/${paymentId}`)
      );

      const statusResponses = await Promise.all(statusPromises);

      statusResponses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('processing');
      });
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    test('should handle minimum payment amount', async () => {
      const minAmount = 1000; // Minimum satoshis

      const response = await request(app)
        .post('/api/payment-intents')
        .set('Authorization', `Bearer ${testApiKey}`)
        .send({
          amount: minAmount,
          description: 'Minimum amount test'
        });

      expect(response.status).toBe(201);
      expect(response.body.amount).toBe(minAmount);
      expect(response.body.fee).toBeGreaterThan(0);
    });

    test('should handle very large payment amounts', async () => {
      const largeAmount = 2100000000000000; // 21M BTC in satoshis

      const response = await request(app)
        .post('/api/payment-intents')
        .set('Authorization', `Bearer ${testApiKey}`)
        .send({
          amount: largeAmount,
          description: 'Large amount test'
        });

      expect(response.status).toBe(201);
      expect(response.body.amount).toBe(largeAmount);
      expect(response.body.fee).toBe(Math.floor(largeAmount * 0.01));
    });

    test('should handle payment with maximum description length', async () => {
      const maxDescription = 'A'.repeat(1000); // Assuming 1000 char limit

      const response = await request(app)
        .post('/api/payment-intents')
        .set('Authorization', `Bearer ${testApiKey}`)
        .send({
          amount: 100000,
          description: maxDescription
        });

      expect(response.status).toBe(201);
      expect(response.body.description).toBe(maxDescription);
    });

    test('should handle special characters in payment descriptions', async () => {
      const specialDescription = 'Payment with émojis 🚀💰 and spëcial chars & symbols!';

      const response = await request(app)
        .post('/api/payment-intents')
        .set('Authorization', `Bearer ${testApiKey}`)
        .send({
          amount: 100000,
          description: specialDescription
        });

      expect(response.status).toBe(201);
      expect(response.body.description).toBe(specialDescription);
    });
  });

  describe('Data Consistency and Integrity', () => {
    test('should maintain referential integrity between payments and merchants', async () => {
      // Create payment
      const paymentResponse = await request(app)
        .post('/api/payment-intents')
        .set('Authorization', `Bearer ${testApiKey}`)
        .send({
          amount: 100000,
          description: 'Integrity test payment'
        });

      expect(paymentResponse.status).toBe(201);
      const paymentId = paymentResponse.body.id;

      // Verify payment references correct merchant
      const payment = await paymentService.getPaymentIntent(paymentId);
      expect(payment.merchantId).toBe(testMerchant.merchantId);

      // Verify merchant exists
      const merchant = await merchantService.findById(testMerchant.merchantId);
      expect(merchant).toBeDefined();
      expect(merchant.id).toBe(testMerchant.merchantId);
    });

    test('should maintain payment state consistency across operations', async () => {
      // Create payment
      const createResponse = await request(app)
        .post('/api/payment-intents')
        .set('Authorization', `Bearer ${testApiKey}`)
        .send({
          amount: 100000,
          description: 'State consistency test'
        });

      const paymentId = createResponse.body.id;

      // Verify initial state
      let payment = await request(app).get(`/api/payment-intents/${paymentId}`);
      expect(payment.body.status).toBe('pending');
      expect(payment.body.customerAddress).toBeUndefined();
      expect(payment.body.transactionId).toBeUndefined();

      // Confirm payment
      const confirmationData = {
        customerAddress: global.testUtils.generateStacksAddress(),
        transactionId: global.testUtils.generateTxId()
      };

      await request(app)
        .post(`/api/payment-intents/${paymentId}/confirm`)
        .send(confirmationData);

      // Verify state transition
      payment = await request(app).get(`/api/payment-intents/${paymentId}`);
      expect(payment.body.status).toBe('processing');
      expect(payment.body.customerAddress).toBe(confirmationData.customerAddress);
      expect(payment.body.transactionId).toBe(confirmationData.transactionId);
      expect(payment.body.processingStartedAt).toBeDefined();

      // Complete processing
      await paymentService.processPayment(paymentId);

      // Verify final state
      payment = await request(app).get(`/api/payment-intents/${paymentId}`);
      expect(payment.body.status).toBe('succeeded');
      expect(payment.body.succeededAt).toBeDefined();
    });
  });
});