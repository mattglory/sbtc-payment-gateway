/**
 * Test Data Fixtures
 * Pre-defined test data for consistent testing scenarios
 */

const { generators } = require('../utils/testHelpers');

/**
 * Sample merchants for testing
 */
const sampleMerchants = [
  {
    businessName: 'Coffee & Code Café',
    email: 'owner@coffeeandcode.com',
    stacksAddress: 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE',
    apiKey: 'pk_test_coffee_1234567890',
    secretKey: 'sk_test_coffee_1234567890'
  },
  {
    businessName: 'Digital Bookstore LLC',
    email: 'info@digitalbooks.com',
    stacksAddress: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
    apiKey: 'pk_test_books_2345678901',
    secretKey: 'sk_test_books_2345678901'
  },
  {
    businessName: 'Tech Gadgets Store',
    email: 'sales@techgadgets.com',
    stacksAddress: 'ST3PF13W7Z0RRZ85EG7XEBF1K20FGJ7G95W8P4FD2',
    apiKey: 'pk_test_gadgets_3456789012',
    secretKey: 'sk_test_gadgets_3456789012'
  }
];

/**
 * Sample payment intents for testing
 */
const samplePaymentIntents = [
  {
    amount: 50000,
    description: 'Coffee and pastry',
    status: 'requires_payment_method'
  },
  {
    amount: 150000,
    description: 'Programming book collection',
    status: 'requires_payment_method'
  },
  {
    amount: 2500000,
    description: 'Premium laptop purchase',
    status: 'processing',
    customerAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    transactionId: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef01'
  },
  {
    amount: 75000,
    description: 'Monthly subscription',
    status: 'succeeded',
    customerAddress: 'ST2F2BZPV2M0MRBK2F2J6VXKPXBCWK0H48TT7T7YK',
    transactionId: 'b2c3d4e5f6789012345678901234567890123456789abcdef0123456789abcdef0'
  },
  {
    amount: 25000,
    description: 'Failed payment test',
    status: 'payment_failed',
    customerAddress: 'ST3QM7K7T8ZRN9P3Q4R5S6T7U8V9W0X1Y2Z3A4B5C6',
    transactionId: 'c3d4e5f6789012345678901234567890123456789abcdef0123456789abcdef01',
    failureReason: 'Insufficient funds'
  }
];

/**
 * Sample API key validation scenarios
 */
const apiKeyValidationScenarios = {
  validLiveKey: {
    apiKey: 'pk_live_1234567890abcdef1234567890abcdef',
    expected: {
      valid: true,
      type: 'live'
    }
  },
  validTestKey: {
    apiKey: 'pk_test_1234567890abcdef1234567890abcdef',
    expected: {
      valid: true,
      type: 'test'
    }
  },
  validDemoKey: {
    apiKey: 'pk_demo_1234567890abcdef1234567890abcdef',
    expected: {
      valid: true,
      type: 'demo'
    }
  },
  invalidKeyFormat: {
    apiKey: 'invalid_key_format',
    expected: {
      valid: false,
      error: 'Invalid API key format',
      code: 'INVALID_FORMAT'
    }
  },
  expiredKey: {
    apiKey: 'pk_test_expired_key_123456789',
    expected: {
      valid: false,
      error: 'API key expired',
      code: 'EXPIRED'
    }
  },
  missingKey: {
    apiKey: null,
    expected: {
      valid: false,
      error: 'API key is required',
      code: 'MISSING_API_KEY'
    }
  }
};

/**
 * Sample error scenarios for testing error handling
 */
const errorScenarios = {
  payment: {
    missingAmount: {
      data: { description: 'No amount provided' },
      expectedError: 'Amount is required',
      expectedStatus: 400
    },
    invalidAmount: {
      data: { amount: 'invalid', description: 'Invalid amount type' },
      expectedError: 'Amount must be a number',
      expectedStatus: 400
    },
    negativeAmount: {
      data: { amount: -5000, description: 'Negative amount' },
      expectedError: 'Invalid amount',
      expectedStatus: 400
    },
    belowMinimum: {
      data: { amount: 500, description: 'Below minimum' },
      expectedError: 'Amount must be at least 1000 satoshis',
      expectedStatus: 400
    },
    paymentNotFound: {
      paymentId: 'pi_nonexistent_123',
      expectedError: 'Payment intent not found',
      expectedStatus: 404
    },
    paymentExpired: {
      expectedError: 'Payment intent has expired',
      expectedStatus: 400
    },
    alreadyProcessed: {
      expectedError: 'Payment intent already processed',
      expectedStatus: 400
    }
  },
  merchant: {
    missingBusinessName: {
      data: {
        email: 'test@example.com',
        stacksAddress: 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE'
      },
      expectedError: 'Missing required fields',
      expectedStatus: 400
    },
    invalidEmail: {
      data: {
        businessName: 'Test Business',
        email: 'invalid-email',
        stacksAddress: 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE'
      },
      expectedError: 'Invalid email format',
      expectedStatus: 400
    },
    invalidStacksAddress: {
      data: {
        businessName: 'Test Business',
        email: 'test@example.com',
        stacksAddress: 'invalid_address'
      },
      expectedError: 'Invalid Stacks address format',
      expectedStatus: 400
    },
    duplicateEmail: {
      expectedError: 'Merchant with this email is already registered',
      expectedStatus: 409
    },
    duplicateStacksAddress: {
      expectedError: 'Merchant with this Stacks address is already registered',
      expectedStatus: 409
    },
    merchantNotFound: {
      expectedError: 'Merchant not found',
      expectedStatus: 404
    }
  },
  authentication: {
    missingApiKey: {
      expectedError: 'API key is required',
      expectedStatus: 401
    },
    invalidApiKey: {
      apiKey: 'invalid_api_key',
      expectedError: 'Invalid API key',
      expectedStatus: 401
    },
    expiredApiKey: {
      apiKey: 'pk_test_expired_key',
      expectedError: 'API key expired',
      expectedStatus: 401
    }
  }
};

/**
 * Sample dashboard statistics for testing
 */
const sampleDashboardStats = {
  empty: {
    totalProcessed: 0,
    feeCollected: 0,
    paymentsCount: 0,
    activePayments: 0,
    successfulPayments: 0,
    recentPayments: []
  },
  withActivity: {
    totalProcessed: 5750000,
    feeCollected: 57500,
    paymentsCount: 15,
    activePayments: 2,
    successfulPayments: 12,
    recentPayments: [
      {
        id: 'pi_recent_001',
        amount: 150000,
        status: 'succeeded',
        createdAt: '2023-10-15T14:30:00.000Z',
        description: 'Book purchase'
      },
      {
        id: 'pi_recent_002',
        amount: 75000,
        status: 'processing',
        createdAt: '2023-10-15T13:45:00.000Z',
        description: 'Coffee order'
      },
      {
        id: 'pi_recent_003',
        amount: 200000,
        status: 'succeeded',
        createdAt: '2023-10-15T12:20:00.000Z',
        description: 'Electronics purchase'
      }
    ]
  },
  highVolume: {
    totalProcessed: 125000000,
    feeCollected: 1250000,
    paymentsCount: 500,
    activePayments: 25,
    successfulPayments: 467,
    recentPayments: Array.from({ length: 10 }, (_, i) => ({
      id: `pi_volume_${i + 1}`,
      amount: 100000 + (i * 50000),
      status: i % 4 === 0 ? 'processing' : 'succeeded',
      createdAt: new Date(Date.now() - i * 3600000).toISOString(),
      description: `High volume payment ${i + 1}`
    }))
  }
};

/**
 * Performance test scenarios
 */
const performanceScenarios = {
  lightLoad: {
    iterations: 10,
    concurrency: 2,
    expectedAvgTime: 100 // ms
  },
  mediumLoad: {
    iterations: 50,
    concurrency: 5,
    expectedAvgTime: 200 // ms
  },
  heavyLoad: {
    iterations: 100,
    concurrency: 10,
    expectedAvgTime: 500 // ms
  },
  stressTest: {
    iterations: 500,
    concurrency: 20,
    expectedAvgTime: 1000 // ms
  }
};

/**
 * Edge case test data
 */
const edgeCases = {
  amounts: {
    minimum: 1000, // Minimum satoshis
    maximum: 2100000000000000, // 21M BTC in satoshis
    verySmall: 1,
    veryLarge: Number.MAX_SAFE_INTEGER
  },
  strings: {
    empty: '',
    veryLong: 'A'.repeat(10000),
    unicode: 'Café & Restaurant "Le Spécial" - München 🚀💰',
    specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    sqlInjection: "'; DROP TABLE payments; --",
    xss: '<script>alert("xss")</script>'
  },
  addresses: {
    testnetValid: 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE',
    mainnetValid: 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
    invalid: 'invalid_stacks_address',
    tooShort: 'ST123',
    tooLong: 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE12345',
    wrongPrefix: 'XX1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE'
  },
  transactionIds: {
    valid: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef01',
    invalid: 'invalid_transaction_id',
    tooShort: 'a1b2c3',
    tooLong: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0123456789',
    nonHex: 'g1h2i3j4k5l67890123456789abcdef0123456789abcdef0123456789abcdef01'
  }
};

/**
 * Time-related test data
 */
const timeScenarios = {
  past: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
  recentPast: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
  now: new Date().toISOString(),
  nearFuture: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes from now
  future: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
  defaultExpiration: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes from now
};

/**
 * Helper functions to generate test data
 */
const TestDataGenerators = {
  /**
   * Generate a complete merchant with all required fields
   */
  createMerchant(overrides = {}) {
    const base = sampleMerchants[0];
    return {
      ...base,
      id: `merchant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: `test_${Date.now()}@example.com`,
      stacksAddress: this.generateStacksAddress(),
      apiKey: this.generateApiKey(),
      secretKey: this.generateSecretKey(),
      createdAt: new Date().toISOString(),
      ...overrides
    };
  },

  /**
   * Generate a complete payment intent
   */
  createPaymentIntent(merchantId, overrides = {}) {
    const base = samplePaymentIntents[0];
    const id = `pi_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      ...base,
      id,
      paymentId: `payment_${id.replace('pi_test_', '')}`,
      merchantId,
      fee: Math.floor((overrides.amount || base.amount) * 0.01),
      currency: 'BTC',
      clientSecret: `${id}_secret_${Math.random().toString(36).substr(2, 15)}`,
      createdAt: new Date().toISOString(),
      expiresAt: timeScenarios.defaultExpiration,
      ...overrides
    };
  },

  /**
   * Generate random Stacks address
   */
  generateStacksAddress(network = 'testnet') {
    const prefix = network === 'mainnet' ? 'SP' : 'ST';
    const chars = '123456789ABCDEFGHJKMNPQRSTVWXYZ';
    let result = prefix;
    
    for (let i = 0; i < 39; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  },

  /**
   * Generate API key
   */
  generateApiKey(type = 'test') {
    const randomString = Math.random().toString(36).substring(2, 15);
    return `pk_${type}_${randomString}`;
  },

  /**
   * Generate secret key
   */
  generateSecretKey(type = 'test') {
    const randomString = Math.random().toString(36).substring(2, 15);
    return `sk_${type}_${randomString}`;
  },

  /**
   * Generate transaction ID
   */
  generateTransactionId() {
    return Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  },

  /**
   * Create payment confirmation data
   */
  createConfirmationData(overrides = {}) {
    return {
      customerAddress: this.generateStacksAddress(),
      transactionId: this.generateTransactionId(),
      ...overrides
    };
  }
};

module.exports = {
  sampleMerchants,
  samplePaymentIntents,
  apiKeyValidationScenarios,
  errorScenarios,
  sampleDashboardStats,
  performanceScenarios,
  edgeCases,
  timeScenarios,
  TestDataGenerators
};