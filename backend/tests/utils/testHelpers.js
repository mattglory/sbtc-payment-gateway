/**
 * Test Helper Utilities
 * Common testing utilities and mock functions
 */

const request = require('supertest');

/**
 * Mock implementations for external services
 */
const mockImplementations = {
  // Mock Stacks API responses
  stacksApi: {
    getAccountInfo: jest.fn().mockResolvedValue({
      balance: '1000000000000', // 1M STX
      nonce: 0,
      balance_proof: '',
      nonce_proof: ''
    }),

    broadcastTransaction: jest.fn().mockResolvedValue({
      txid: 'mock_transaction_id_123456789abcdef',
      error: null
    }),

    getTransactionById: jest.fn().mockResolvedValue({
      tx_id: 'mock_transaction_id_123456789abcdef',
      tx_status: 'success',
      tx_result: {
        hex: '0x0703',
        repr: '(ok true)'
      },
      block_height: 12345
    })
  },

  // Mock blockchain operations
  blockchain: {
    callReadOnlyFunction: jest.fn().mockResolvedValue({
      okay: true,
      result: '(ok u100000)' // Mock successful result
    }),

    estimateContractFunctionCall: jest.fn().mockResolvedValue({
      estimated_cost: {
        total_cost: {
          read_count: 10,
          read_length: 1000,
          runtime: 5000,
          write_count: 5,
          write_length: 500
        }
      }
    })
  }
};

/**
 * Test data generators
 */
const generators = {
  /**
   * Generate sequential test data
   */
  sequence: {
    counter: 0,
    next: () => ++generators.sequence.counter,
    reset: () => { generators.sequence.counter = 0; }
  },

  /**
   * Generate test payment intent with realistic data
   */
  paymentIntent: (status = 'pending', overrides = {}) => {
    const id = `pi_test_${generators.sequence.next().toString().padStart(6, '0')}`;
    const paymentId = `payment_${id.replace('pi_test_', '')}`;
    
    const baseIntent = {
      id,
      paymentId,
      amount: 100000 + (generators.sequence.counter * 10000),
      fee: Math.floor((100000 + (generators.sequence.counter * 10000)) * 0.01),
      currency: 'BTC',
      description: `Test payment ${generators.sequence.counter}`,
      status,
      clientSecret: `${id}_secret_${Math.random().toString(36).substring(2, 15)}`,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      merchantId: `merchant_test_${generators.sequence.counter}`,
      requestId: `req_${Math.random().toString(36).substring(2, 15)}`
    };

    // Add status-specific fields
    switch (status) {
    case 'processing':
      baseIntent.processingStartedAt = new Date().toISOString();
      baseIntent.customerAddress = global.testUtils.generateStacksAddress();
      baseIntent.transactionId = global.testUtils.generateTxId();
      break;
    case 'succeeded':
      baseIntent.processingStartedAt = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      baseIntent.succeededAt = new Date().toISOString();
      baseIntent.customerAddress = global.testUtils.generateStacksAddress();
      baseIntent.transactionId = global.testUtils.generateTxId();
      break;
    case 'payment_failed':
      baseIntent.processingStartedAt = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      baseIntent.failedAt = new Date().toISOString();
      baseIntent.failureReason = 'Insufficient funds';
      break;
    case 'expired':
      baseIntent.expiresAt = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      break;
    }

    return { ...baseIntent, ...overrides };
  },

  /**
   * Generate test merchant data
   */
  merchant: (overrides = {}) => ({
    id: `merchant_test_${generators.sequence.next().toString().padStart(6, '0')}`,
    businessName: `Test Business ${generators.sequence.counter}`,
    email: `test${generators.sequence.counter}@example.com`,
    stacksAddress: global.testUtils.generateStacksAddress(),
    apiKey: global.testUtils.generateApiKey(),
    secretKey: global.testUtils.generateApiKey('sk_test'),
    createdAt: new Date().toISOString(),
    stats: {
      totalProcessed: 0,
      feeCollected: 0,
      paymentsCount: 0,
      activePayments: 0,
      successfulPayments: 0
    },
    ...overrides
  }),

  /**
   * Generate API request/response pairs for testing
   */
  apiScenarios: {
    createPaymentIntent: {
      validRequest: {
        amount: 150000,
        description: 'API test payment',
        currency: 'BTC'
      },
      invalidRequests: [
        { amount: -1000, description: 'Invalid negative amount' },
        { amount: 'invalid', description: 'Invalid amount type' },
        { description: 'Missing amount' },
        { amount: 500, description: 'Amount too small' }
      ]
    },

    confirmPayment: {
      validRequest: {
        customerAddress: global.testUtils.generateStacksAddress(),
        transactionId: global.testUtils.generateTxId()
      },
      invalidRequests: [
        { customerAddress: 'invalid_address', transactionId: global.testUtils.generateTxId() },
        { customerAddress: global.testUtils.generateStacksAddress(), transactionId: 'invalid_tx' },
        { customerAddress: global.testUtils.generateStacksAddress() }, // Missing txId
        { transactionId: global.testUtils.generateTxId() } // Missing address
      ]
    },

    merchantRegistration: {
      validRequest: {
        businessName: 'Test API Business',
        email: 'api-test@example.com',
        stacksAddress: global.testUtils.generateStacksAddress()
      },
      invalidRequests: [
        { businessName: '', email: 'test@example.com', stacksAddress: global.testUtils.generateStacksAddress() },
        { businessName: 'Test', email: 'invalid-email', stacksAddress: global.testUtils.generateStacksAddress() },
        { businessName: 'Test', email: 'test@example.com', stacksAddress: 'invalid_address' }
      ]
    }
  }
};

/**
 * HTTP test helpers
 */
const httpHelpers = {
  /**
   * Create authenticated request
   */
  authenticatedRequest: (app, apiKey) => {
    return request(app).set('Authorization', `Bearer ${apiKey}`);
  },

  /**
   * Test API endpoint with various scenarios
   */
  testEndpoint: async (app, method, path, scenarios, options = {}) => {
    const results = {};
    
    for (const [scenarioName, scenario] of Object.entries(scenarios)) {
      try {
        let req = request(app)[method.toLowerCase()](path);
        
        // Add authentication if provided
        if (options.apiKey) {
          req = req.set('Authorization', `Bearer ${options.apiKey}`);
        }
        
        // Add custom headers
        if (options.headers) {
          Object.entries(options.headers).forEach(([key, value]) => {
            req = req.set(key, value);
          });
        }
        
        // Add request body
        if (scenario.body) {
          req = req.send(scenario.body);
        }
        
        const response = await req;
        
        results[scenarioName] = {
          status: response.status,
          body: response.body,
          headers: response.headers,
          success: response.status >= 200 && response.status < 300
        };
      } catch (error) {
        results[scenarioName] = {
          error: error.message,
          success: false
        };
      }
    }
    
    return results;
  }
};

/**
 * Database test helpers
 */
const dbHelpers = {
  /**
   * Mock in-memory database for tests
   */
  mockDb: {
    payments: new Map(),
    merchants: new Map(),
    apiKeys: new Map(),
    
    // Reset all data
    reset: () => {
      dbHelpers.mockDb.payments.clear();
      dbHelpers.mockDb.merchants.clear();
      dbHelpers.mockDb.apiKeys.clear();
    },
    
    // Add test data
    seedData: () => {
      // Add test merchant
      const merchant = generators.merchant();
      dbHelpers.mockDb.merchants.set(merchant.id, merchant);
      dbHelpers.mockDb.apiKeys.set(merchant.apiKey, merchant.id);
      
      // Add test payments
      for (let i = 0; i < 3; i++) {
        const payment = generators.paymentIntent(
          ['pending', 'processing', 'succeeded'][i], 
          { merchantId: merchant.id }
        );
        dbHelpers.mockDb.payments.set(payment.id, payment);
      }
      
      return { merchant, paymentIds: Array.from(dbHelpers.mockDb.payments.keys()) };
    }
  }
};

/**
 * Validation helpers
 */
const validators = {
  /**
   * Validate API response structure
   */
  validateApiResponse: (response, expectedFields = []) => {
    const issues = [];
    
    if (!response || typeof response !== 'object') {
      issues.push('Response must be an object');
      return issues;
    }
    
    expectedFields.forEach(field => {
      if (!(field in response)) {
        issues.push(`Missing required field: ${field}`);
      }
    });
    
    return issues;
  },

  /**
   * Validate payment intent structure
   */
  validatePaymentIntent: (paymentIntent) => {
    const requiredFields = [
      'id', 'paymentId', 'amount', 'fee', 'currency', 
      'description', 'status', 'clientSecret', 'createdAt', 'expiresAt'
    ];
    
    return validators.validateApiResponse(paymentIntent, requiredFields);
  },

  /**
   * Validate merchant structure
   */
  validateMerchant: (merchant) => {
    const requiredFields = [
      'id', 'businessName', 'email', 'stacksAddress', 'apiKey', 'createdAt'
    ];
    
    return validators.validateApiResponse(merchant, requiredFields);
  }
};

/**
 * Performance test helpers
 */
const performanceHelpers = {
  /**
   * Measure function execution time
   */
  measureExecutionTime: async (fn, label = 'Function') => {
    const start = process.hrtime.bigint();
    const result = await fn();
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds
    
    console.log(`⏱️  ${label} executed in ${duration.toFixed(2)}ms`);
    
    return { result, duration };
  },

  /**
   * Test function performance under load
   */
  loadTest: async (fn, options = {}) => {
    const {
      iterations = 100,
      concurrency = 10,
      label = 'Load test'
    } = options;
    
    const results = [];
    const batches = Math.ceil(iterations / concurrency);
    
    console.log(`🔄 Starting ${label}: ${iterations} iterations, ${concurrency} concurrent`);
    
    for (let batch = 0; batch < batches; batch++) {
      const promises = [];
      const currentBatchSize = Math.min(concurrency, iterations - (batch * concurrency));
      
      for (let i = 0; i < currentBatchSize; i++) {
        promises.push(
          performanceHelpers.measureExecutionTime(fn, `${label} #${batch * concurrency + i + 1}`)
        );
      }
      
      const batchResults = await Promise.all(promises);
      results.push(...batchResults);
    }
    
    const durations = results.map(r => r.duration);
    const stats = {
      total: iterations,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      p95Duration: durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.95)]
    };
    
    console.log(`📊 ${label} results:`, stats);
    
    return { results, stats };
  }
};

module.exports = {
  mockImplementations,
  generators,
  httpHelpers,
  dbHelpers,
  validators,
  performanceHelpers
};