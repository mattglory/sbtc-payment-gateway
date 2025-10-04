/**
 * Jest Setup File
 * Global test configuration and setup
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '0'; // Use random port for tests
process.env.STACKS_NETWORK = 'testnet';
process.env.CONTRACT_ADDRESS = 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE';
process.env.CONTRACT_NAME = 'sbtc-payment-gateway-test';

// Global test timeout
jest.setTimeout(10000);

// Suppress console output during tests (optional)
if (process.env.SUPPRESS_LOGS === 'true') {
  global.console = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
}

// Global test utilities
global.testUtils = {
  // Generate test payment data
  generatePaymentData: (overrides = {}) => ({
    amount: 100000,
    description: 'Test payment',
    currency: 'BTC',
    ...overrides
  }),

  // Generate test merchant data
  generateMerchantData: (overrides = {}) => ({
    businessName: 'Test Business',
    email: 'test@example.com',
    stacksAddress: 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE',
    ...overrides
  }),

  // Generate test API key
  generateApiKey: (prefix = 'pk_test') => {
    const randomString = Math.random().toString(36).substring(2, 15);
    return `${prefix}_${randomString}`;
  },

  // Generate test payment intent
  generatePaymentIntent: (overrides = {}) => ({
    id: `pi_test_${Math.random().toString(36).substring(2, 15)}`,
    paymentId: `payment_${Math.random().toString(36).substring(2, 15)}`,
    amount: 100000,
    fee: 1000,
    currency: 'BTC',
    description: 'Test payment intent',
    status: 'pending',
    clientSecret: `pi_test_${Math.random().toString(36).substring(2, 15)}_secret`,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
    merchantId: 'test_merchant_id',
    ...overrides
  }),

  // Generate test Stacks address
  generateStacksAddress: (network = 'testnet') => {
    const prefix = network === 'mainnet' ? 'SP' : 'ST';
    const chars = '123456789ABCDEFGHJKMNPQRSTVWXYZ';
    let result = prefix;
    
    for (let i = 0; i < 39; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  },

  // Generate test transaction ID
  generateTxId: () => {
    return Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  },

  // Wait for async operations
  wait: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),

  // Create mock request object
  createMockReq: (overrides = {}) => ({
    body: {},
    params: {},
    query: {},
    headers: {},
    ip: '127.0.0.1',
    method: 'GET',
    url: '/',
    ...overrides
  }),

  // Create mock response object
  createMockRes: () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.set = jest.fn().mockReturnValue(res);
    res.cookie = jest.fn().mockReturnValue(res);
    res.clearCookie = jest.fn().mockReturnValue(res);
    return res;
  }
};

// Global test matchers
expect.extend({
  toBeValidStacksAddress(received) {
    const isValid = typeof received === 'string' && 
                   (received.startsWith('SP') || received.startsWith('ST')) && 
                   received.length === 41;
    
    if (isValid) {
      return {
        message: () => `expected ${received} not to be a valid Stacks address`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid Stacks address`,
        pass: false,
      };
    }
  },

  toBeValidTransactionId(received) {
    const isValid = typeof received === 'string' && 
                   /^[0-9a-fA-F]{64}$/.test(received);
    
    if (isValid) {
      return {
        message: () => `expected ${received} not to be a valid transaction ID`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid transaction ID`,
        pass: false,
      };
    }
  },

  toBeValidPaymentAmount(received) {
    const isValid = typeof received === 'number' && 
                   received > 0 && 
                   Number.isInteger(received) &&
                   received >= 1000; // Minimum 1000 satoshis
    
    if (isValid) {
      return {
        message: () => `expected ${received} not to be a valid payment amount`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid payment amount (positive integer >= 1000)`,
        pass: false,
      };
    }
  }
});

// Setup and teardown hooks
beforeAll(async () => {
  console.log('🧪 Starting test suite...');
});

afterAll(async () => {
  console.log('✅ Test suite completed');
});

beforeEach(() => {
  // Clear any mocks or state between tests
  jest.clearAllMocks();
});

afterEach(async () => {
  // Clean up after each test
  await global.testUtils.wait(10); // Small delay to ensure cleanup
});