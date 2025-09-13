/**
 * Unit Tests for PaymentService
 * Tests core payment functionality including creation, retrieval, and confirmation
 */

const PaymentService = require('../../../src/services/paymentService');
const { generators, mockImplementations, validators } = require('../../utils/testHelpers');

// Mock external dependencies
jest.mock('@stacks/transactions');
jest.mock('@stacks/network');

describe('PaymentService', () => {
  let paymentService;
  let mockStacksApi;

  beforeEach(() => {
    // Reset sequence counter for consistent test data
    generators.sequence.reset();
    
    // Initialize service
    paymentService = new PaymentService();
    
    // Setup mocks
    mockStacksApi = mockImplementations.stacksApi;
    paymentService.stacksApi = mockStacksApi;
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    test('should initialize with default configuration', () => {
      const service = new PaymentService();
      
      expect(service).toBeDefined();
      expect(service.payments).toBeDefined();
      expect(service.payments).toBeInstanceOf(Map);
    });

    test('should initialize with custom configuration', () => {
      const config = {
        network: 'testnet',
        contractAddress: 'ST123456789',
        contractName: 'custom-contract'
      };
      
      const service = new PaymentService(config);
      expect(service).toBeDefined();
    });
  });

  describe('createPaymentIntent', () => {
    const merchantId = 'merchant_test_123';
    
    test('should create a valid payment intent with minimum required data', async () => {
      const paymentRequest = {
        amount: 100000,
        description: 'Test payment'
      };

      const result = await paymentService.createPaymentIntent(merchantId, paymentRequest);

      expect(result).toBeDefined();
      expect(validators.validatePaymentIntent(result)).toEqual([]);
      expect(result.amount).toBe(paymentRequest.amount);
      expect(result.description).toBe(paymentRequest.description);
      expect(result.status).toBe('pending');
      expect(result.merchantId).toBe(merchantId);
      expect(result.fee).toBeGreaterThan(0);
      expect(result.currency).toBe('BTC');
    });

    test('should create payment intent with all optional fields', async () => {
      const paymentRequest = {
        amount: 250000,
        description: 'Complete test payment',
        currency: 'BTC'
      };

      const result = await paymentService.createPaymentIntent(merchantId, paymentRequest);

      expect(result.amount).toBe(paymentRequest.amount);
      expect(result.description).toBe(paymentRequest.description);
      expect(result.currency).toBe(paymentRequest.currency);
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('paymentId');
      expect(result).toHaveProperty('clientSecret');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('expiresAt');
    });

    test('should calculate fee correctly (1% of amount)', async () => {
      const paymentRequest = {
        amount: 100000,
        description: 'Fee calculation test'
      };

      const result = await paymentService.createPaymentIntent(merchantId, paymentRequest);

      const expectedFee = Math.floor(paymentRequest.amount * 0.01);
      expect(result.fee).toBe(expectedFee);
    });

    test('should generate unique payment IDs', async () => {
      const paymentRequest = {
        amount: 100000,
        description: 'Uniqueness test'
      };

      const result1 = await paymentService.createPaymentIntent(merchantId, paymentRequest);
      const result2 = await paymentService.createPaymentIntent(merchantId, paymentRequest);

      expect(result1.id).not.toBe(result2.id);
      expect(result1.paymentId).not.toBe(result2.paymentId);
      expect(result1.clientSecret).not.toBe(result2.clientSecret);
    });

    test('should set expiration 30 minutes from creation', async () => {
      const beforeCreation = Date.now();
      
      const paymentRequest = {
        amount: 100000,
        description: 'Expiration test'
      };

      const result = await paymentService.createPaymentIntent(merchantId, paymentRequest);
      
      const afterCreation = Date.now();
      const createdAt = new Date(result.createdAt).getTime();
      const expiresAt = new Date(result.expiresAt).getTime();
      const thirtyMinutes = 30 * 60 * 1000;

      expect(createdAt).toBeGreaterThanOrEqual(beforeCreation);
      expect(createdAt).toBeLessThanOrEqual(afterCreation);
      expect(expiresAt - createdAt).toBeCloseTo(thirtyMinutes, -3); // Within 1 second
    });

    describe('validation errors', () => {
      test('should throw error for missing amount', async () => {
        const paymentRequest = {
          description: 'Missing amount test'
        };

        await expect(paymentService.createPaymentIntent(merchantId, paymentRequest))
          .rejects.toThrow('Amount is required');
      });

      test('should throw error for invalid amount type', async () => {
        const paymentRequest = {
          amount: 'invalid_amount',
          description: 'Invalid amount type test'
        };

        await expect(paymentService.createPaymentIntent(merchantId, paymentRequest))
          .rejects.toThrow('Amount must be a number');
      });

      test('should throw error for negative amount', async () => {
        const paymentRequest = {
          amount: -5000,
          description: 'Negative amount test'
        };

        await expect(paymentService.createPaymentIntent(merchantId, paymentRequest))
          .rejects.toThrow('Invalid amount');
      });

      test('should throw error for zero amount', async () => {
        const paymentRequest = {
          amount: 0,
          description: 'Zero amount test'
        };

        await expect(paymentService.createPaymentIntent(merchantId, paymentRequest))
          .rejects.toThrow('Invalid amount');
      });

      test('should throw error for amount below minimum (1000 satoshis)', async () => {
        const paymentRequest = {
          amount: 500,
          description: 'Below minimum test'
        };

        await expect(paymentService.createPaymentIntent(merchantId, paymentRequest))
          .rejects.toThrow('Amount must be at least 1000 satoshis');
      });

      test('should throw error for missing merchant ID', async () => {
        const paymentRequest = {
          amount: 100000,
          description: 'Missing merchant test'
        };

        await expect(paymentService.createPaymentIntent(null, paymentRequest))
          .rejects.toThrow('Merchant ID is required');
      });
    });
  });

  describe('getPaymentIntent', () => {
    let createdPayment;

    beforeEach(async () => {
      const paymentRequest = {
        amount: 100000,
        description: 'Test payment for retrieval'
      };
      createdPayment = await paymentService.createPaymentIntent('merchant_test_123', paymentRequest);
    });

    test('should retrieve existing payment intent', async () => {
      const retrieved = await paymentService.getPaymentIntent(createdPayment.id);

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(createdPayment.id);
      expect(retrieved.amount).toBe(createdPayment.amount);
      expect(retrieved.status).toBe(createdPayment.status);
    });

    test('should return the same object for multiple retrievals', async () => {
      const retrieved1 = await paymentService.getPaymentIntent(createdPayment.id);
      const retrieved2 = await paymentService.getPaymentIntent(createdPayment.id);

      expect(retrieved1).toEqual(retrieved2);
    });

    test('should throw error for non-existent payment', async () => {
      const fakeId = 'pi_fake_123456789';

      await expect(paymentService.getPaymentIntent(fakeId))
        .rejects.toThrow('Payment intent not found');
    });

    test('should throw error for null payment ID', async () => {
      await expect(paymentService.getPaymentIntent(null))
        .rejects.toThrow('Payment ID is required');
    });

    test('should throw error for undefined payment ID', async () => {
      await expect(paymentService.getPaymentIntent(undefined))
        .rejects.toThrow('Payment ID is required');
    });

    test('should throw error for empty payment ID', async () => {
      await expect(paymentService.getPaymentIntent(''))
        .rejects.toThrow('Payment ID is required');
    });
  });

  describe('confirmPayment', () => {
    let paymentToConfirm;

    beforeEach(async () => {
      const paymentRequest = {
        amount: 150000,
        description: 'Test payment for confirmation'
      };
      paymentToConfirm = await paymentService.createPaymentIntent('merchant_test_123', paymentRequest);
    });

    test('should confirm payment with valid data', async () => {
      const confirmationData = {
        customerAddress: global.testUtils.generateStacksAddress(),
        transactionId: global.testUtils.generateTxId()
      };

      // Mock successful blockchain verification
      mockStacksApi.getTransactionById.mockResolvedValue({
        tx_id: confirmationData.transactionId,
        tx_status: 'success',
        tx_result: { repr: '(ok true)' }
      });

      const result = await paymentService.confirmPayment(paymentToConfirm.id, confirmationData);

      expect(result).toBeDefined();
      expect(result.id).toBe(paymentToConfirm.id);
      expect(result.status).toBe('processing');
      expect(result.customer).toBe(confirmationData.customerAddress);
      expect(result.transactionId).toBe(confirmationData.transactionId);
      expect(result.message).toContain('confirmed');
    });

    test('should update payment intent status to processing', async () => {
      const confirmationData = {
        customerAddress: global.testUtils.generateStacksAddress(),
        transactionId: global.testUtils.generateTxId()
      };

      mockStacksApi.getTransactionById.mockResolvedValue({
        tx_id: confirmationData.transactionId,
        tx_status: 'success'
      });

      await paymentService.confirmPayment(paymentToConfirm.id, confirmationData);

      const updatedPayment = await paymentService.getPaymentIntent(paymentToConfirm.id);
      expect(updatedPayment.status).toBe('processing');
      expect(updatedPayment.customerAddress).toBe(confirmationData.customerAddress);
      expect(updatedPayment.transactionId).toBe(confirmationData.transactionId);
      expect(updatedPayment.processingStartedAt).toBeDefined();
    });

    test('should handle blockchain verification failure', async () => {
      const confirmationData = {
        customerAddress: global.testUtils.generateStacksAddress(),
        transactionId: global.testUtils.generateTxId()
      };

      // Mock failed blockchain verification
      mockStacksApi.getTransactionById.mockResolvedValue({
        tx_id: confirmationData.transactionId,
        tx_status: 'abort_by_response'
      });

      await expect(paymentService.confirmPayment(paymentToConfirm.id, confirmationData))
        .rejects.toThrow('Transaction verification failed');
    });

    describe('validation errors', () => {
      test('should throw error for invalid customer address', async () => {
        const confirmationData = {
          customerAddress: 'invalid_address',
          transactionId: global.testUtils.generateTxId()
        };

        await expect(paymentService.confirmPayment(paymentToConfirm.id, confirmationData))
          .rejects.toThrow('Invalid customer address format');
      });

      test('should throw error for invalid transaction ID', async () => {
        const confirmationData = {
          customerAddress: global.testUtils.generateStacksAddress(),
          transactionId: 'invalid_transaction_id'
        };

        await expect(paymentService.confirmPayment(paymentToConfirm.id, confirmationData))
          .rejects.toThrow('Invalid transaction ID format');
      });

      test('should throw error for missing customer address', async () => {
        const confirmationData = {
          transactionId: global.testUtils.generateTxId()
        };

        await expect(paymentService.confirmPayment(paymentToConfirm.id, confirmationData))
          .rejects.toThrow('Customer address is required');
      });

      test('should throw error for missing transaction ID', async () => {
        const confirmationData = {
          customerAddress: global.testUtils.generateStacksAddress()
        };

        await expect(paymentService.confirmPayment(paymentToConfirm.id, confirmationData))
          .rejects.toThrow('Transaction ID is required');
      });

      test('should throw error for non-existent payment', async () => {
        const confirmationData = {
          customerAddress: global.testUtils.generateStacksAddress(),
          transactionId: global.testUtils.generateTxId()
        };

        await expect(paymentService.confirmPayment('pi_fake_123', confirmationData))
          .rejects.toThrow('Payment intent not found');
      });
    });

    describe('payment state validation', () => {
      test('should throw error when trying to confirm already processing payment', async () => {
        const confirmationData = {
          customerAddress: global.testUtils.generateStacksAddress(),
          transactionId: global.testUtils.generateTxId()
        };

        // First confirmation
        mockStacksApi.getTransactionById.mockResolvedValue({
          tx_id: confirmationData.transactionId,
          tx_status: 'success'
        });
        
        await paymentService.confirmPayment(paymentToConfirm.id, confirmationData);

        // Second confirmation attempt
        await expect(paymentService.confirmPayment(paymentToConfirm.id, confirmationData))
          .rejects.toThrow('Payment intent already processed');
      });

      test('should throw error when trying to confirm expired payment', async () => {
        // Create payment with past expiration
        const expiredPayment = await paymentService.createPaymentIntent('merchant_test_123', {
          amount: 100000,
          description: 'Expired payment test'
        });

        // Manually set expiration to past
        const payment = paymentService.payments.get(expiredPayment.id);
        payment.expiresAt = new Date(Date.now() - 5 * 60 * 1000).toISOString();

        const confirmationData = {
          customerAddress: global.testUtils.generateStacksAddress(),
          transactionId: global.testUtils.generateTxId()
        };

        await expect(paymentService.confirmPayment(expiredPayment.id, confirmationData))
          .rejects.toThrow('Payment intent has expired');
      });
    });
  });

  describe('processPayment', () => {
    let processingPayment;

    beforeEach(async () => {
      // Create and start processing a payment
      const paymentRequest = {
        amount: 200000,
        description: 'Payment for processing test'
      };
      
      processingPayment = await paymentService.createPaymentIntent('merchant_test_123', paymentRequest);
      
      const confirmationData = {
        customerAddress: global.testUtils.generateStacksAddress(),
        transactionId: global.testUtils.generateTxId()
      };

      mockImplementations.stacksApi.getTransactionById.mockResolvedValue({
        tx_id: confirmationData.transactionId,
        tx_status: 'success'
      });

      await paymentService.confirmPayment(processingPayment.id, confirmationData);
    });

    test('should process payment to successful completion', async () => {
      // Mock successful blockchain processing
      mockImplementations.blockchain.callReadOnlyFunction.mockResolvedValue({
        okay: true,
        result: '(ok true)'
      });

      const result = await paymentService.processPayment(processingPayment.id);

      expect(result).toBeDefined();
      expect(result.status).toBe('succeeded');
      expect(result.succeededAt).toBeDefined();
    });

    test('should handle processing failure', async () => {
      // Mock failed blockchain processing
      mockImplementations.blockchain.callReadOnlyFunction.mockResolvedValue({
        okay: false,
        result: '(err u404)'
      });

      const result = await paymentService.processPayment(processingPayment.id);

      expect(result.status).toBe('payment_failed');
      expect(result.failedAt).toBeDefined();
      expect(result.failureReason).toBeDefined();
    });

    test('should throw error for payment not in processing state', async () => {
      const newPayment = await paymentService.createPaymentIntent('merchant_test_123', {
        amount: 100000,
        description: 'Not processing payment'
      });

      await expect(paymentService.processPayment(newPayment.id))
        .rejects.toThrow('Payment is not in processing state');
    });
  });

  describe('edge cases and error handling', () => {
    test('should handle concurrent payment creations', async () => {
      const merchantId = 'merchant_concurrent_test';
      const paymentRequest = {
        amount: 100000,
        description: 'Concurrent test payment'
      };

      // Create multiple payments concurrently
      const promises = Array.from({ length: 10 }, () => 
        paymentService.createPaymentIntent(merchantId, paymentRequest)
      );

      const results = await Promise.all(promises);

      // Verify all payments were created with unique IDs
      const ids = results.map(r => r.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(results.length);

      // Verify all payments are valid
      results.forEach(payment => {
        expect(validators.validatePaymentIntent(payment)).toEqual([]);
      });
    });

    test('should handle service reinitialization', async () => {
      const payment1 = await paymentService.createPaymentIntent('merchant_test', {
        amount: 100000,
        description: 'Before reinit'
      });

      // Simulate service restart
      paymentService = new PaymentService();

      // Old payment should not be accessible
      await expect(paymentService.getPaymentIntent(payment1.id))
        .rejects.toThrow('Payment intent not found');

      // Should be able to create new payments
      const payment2 = await paymentService.createPaymentIntent('merchant_test', {
        amount: 100000,
        description: 'After reinit'
      });

      expect(payment2).toBeDefined();
      expect(validators.validatePaymentIntent(payment2)).toEqual([]);
    });

    test('should handle very large payment amounts', async () => {
      const largeAmount = 21000000 * 100000000; // 21M BTC in satoshis
      
      const paymentRequest = {
        amount: largeAmount,
        description: 'Large amount test'
      };

      const result = await paymentService.createPaymentIntent('merchant_test', paymentRequest);

      expect(result.amount).toBe(largeAmount);
      expect(result.fee).toBe(Math.floor(largeAmount * 0.01));
      expect(validators.validatePaymentIntent(result)).toEqual([]);
    });

    test('should handle payment with special characters in description', async () => {
      const paymentRequest = {
        amount: 100000,
        description: 'Payment with émojis 🚀💰 and spëcial chars & symbols!'
      };

      const result = await paymentService.createPaymentIntent('merchant_test', paymentRequest);

      expect(result.description).toBe(paymentRequest.description);
      expect(validators.validatePaymentIntent(result)).toEqual([]);
    });
  });

  describe('performance tests', () => {
    test('should create payment intents efficiently', async () => {
      const iterations = 100;
      const start = Date.now();

      for (let i = 0; i < iterations; i++) {
        await paymentService.createPaymentIntent(`merchant_perf_${i}`, {
          amount: 100000 + i,
          description: `Performance test payment ${i}`
        });
      }

      const duration = Date.now() - start;
      const avgTime = duration / iterations;

      expect(avgTime).toBeLessThan(10); // Should take less than 10ms per payment on average
    });

    test('should retrieve payment intents efficiently', async () => {
      // Create test payments
      const paymentIds = [];
      for (let i = 0; i < 50; i++) {
        const payment = await paymentService.createPaymentIntent('merchant_perf', {
          amount: 100000,
          description: `Retrieval test payment ${i}`
        });
        paymentIds.push(payment.id);
      }

      // Measure retrieval performance
      const start = Date.now();
      
      for (const id of paymentIds) {
        await paymentService.getPaymentIntent(id);
      }

      const duration = Date.now() - start;
      const avgTime = duration / paymentIds.length;

      expect(avgTime).toBeLessThan(5); // Should take less than 5ms per retrieval on average
    });
  });
});