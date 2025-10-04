import React from 'react';
import { render as rtlRender } from '@testing-library/react';
import { jest } from '@jest/globals';

// Mock data generators
export const mockESGData = {
  company: 'Tesla Inc.',
  sector: 'Automotive',
  esgScores: {
    environmental: 85,
    social: 72,
    governance: 68,
    overall: 75
  },
  analysis: {
    strengths: ['Clean energy leadership', 'Innovation in sustainable transport'],
    weaknesses: ['Governance concerns', 'Labor relations'],
    recommendations: ['Improve board diversity', 'Enhance transparency']
  },
  confidence: 0.87,
  lastUpdated: '2024-01-15T10:30:00Z'
};

export const mockPortfolioData = {
  holdings: [
    {
      symbol: 'ICLN',
      name: 'iShares Clean Energy ETF',
      quantity: 10.5,
      currentPrice: 95.50,
      totalValue: 1002.75,
      esgScore: 89,
      sector: 'Clean Energy',
      allocation: 35.2
    },
    {
      symbol: 'TSLA',
      name: 'Tesla Inc.',
      quantity: 2.3,
      currentPrice: 242.75,
      totalValue: 558.33,
      esgScore: 75,
      sector: 'Electric Vehicles',
      allocation: 19.6
    },
    {
      symbol: 'GRNBND',
      name: 'Green Bonds Portfolio',
      quantity: 15.0,
      currentPrice: 100.00,
      totalValue: 1500.00,
      esgScore: 92,
      sector: 'Fixed Income',
      allocation: 52.7
    }
  ],
  totalValue: 3061.08,
  performance: {
    dayChange: 125.43,
    dayChangePercent: 4.27,
    totalReturn: 287.56,
    totalReturnPercent: 10.37
  },
  esgMetrics: {
    averageScore: 85.3,
    carbonIntensity: 12.4,
    sustainabilityRating: 'A'
  }
};

export const mockCarbonData = {
  totalEmissions: 850.5,
  totalOffsets: 720.3,
  netEmissions: 130.2,
  monthlyData: [
    { month: 'Jan', emissions: 145, offsets: 120 },
    { month: 'Feb', emissions: 132, offsets: 125 },
    { month: 'Mar', emissions: 158, offsets: 140 },
    { month: 'Apr', emissions: 142, offsets: 135 },
    { month: 'May', emissions: 138, offsets: 145 },
    { month: 'Jun', emissions: 135, offsets: 155 }
  ],
  offsetProjects: [
    {
      id: 'proj-1',
      name: 'Amazon Rainforest Protection',
      type: 'Nature-based',
      credits: 250,
      price: 15.50,
      verification: 'VCS'
    }
  ]
};

export const mockInvestmentRecommendations = {
  portfolioAnalysis: {
    currentESGScore: 78,
    sustainabilityGrade: 'B+',
    riskLevel: 'Medium',
    diversificationScore: 82
  },
  recommendations: [
    {
      id: 'rec-1',
      type: 'ETF',
      symbol: 'ESGU',
      name: 'iShares ESG MSCI USA ETF',
      recommendedAction: 'BUY',
      targetAllocation: 15,
      expectedReturn: 8.5,
      esgImpact: 12,
      riskLevel: 'Low',
      reasoning: 'Diversifies ESG exposure across US large-cap stocks'
    },
    {
      id: 'rec-2',
      type: 'Stock',
      symbol: 'NEE',
      name: 'NextEra Energy',
      recommendedAction: 'BUY',
      targetAllocation: 8,
      expectedReturn: 12.3,
      esgImpact: 18,
      riskLevel: 'Medium',
      reasoning: 'Leading renewable energy utility with strong growth'
    }
  ],
  optimizationTips: [
    'Increase clean energy allocation to 40%',
    'Add exposure to sustainable agriculture',
    'Consider green bonds for stability'
  ],
  confidence: 0.89
};

export const mockMarketData = [
  {
    date: '2024-01-10',
    cleanEnergy: 105.2,
    esgETFs: 108.7,
    greenBonds: 102.1,
    sustainableStocks: 112.5,
    volume: 1250000
  },
  {
    date: '2024-01-11',
    cleanEnergy: 107.1,
    esgETFs: 109.3,
    greenBonds: 102.3,
    sustainableStocks: 114.2,
    volume: 1380000
  },
  {
    date: '2024-01-12',
    cleanEnergy: 106.8,
    esgETFs: 110.1,
    greenBonds: 102.5,
    sustainableStocks: 113.8,
    volume: 1420000
  }
];

export const mocksBTCTransaction = {
  txId: 'SP123...ABC',
  from: 'SP1ABC...DEF',
  to: 'SP2DEF...GHI',
  amount: 0.05,
  fee: 0.0001,
  blockHeight: 150234,
  timestamp: 1705398600,
  status: 'confirmed',
  confirmations: 6
};

export const mockBlockchainData = {
  balance: 1.25,
  address: 'SP1ABC123DEF456GHI789',
  transactions: [
    {
      ...mocksBTCTransaction,
      type: 'investment',
      investmentId: 'inv-123',
      shares: 0.5,
      symbol: 'ICLN'
    }
  ],
  investments: [
    {
      id: 'inv-123',
      symbol: 'ICLN',
      fractionalShares: 0.5,
      totalInvested: 47.75,
      currentValue: 52.33,
      gainLoss: 4.58,
      gainLossPercent: 9.59
    }
  ]
};

// Test utilities
export const mockApiResponse = (data, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data,
  text: async () => JSON.stringify(data)
});

export const createMockFetch = (responses = {}) => {
  return jest.fn((url, options) => {
    const method = options?.method || 'GET';
    const key = `${method} ${url}`;

    if (responses[key]) {
      return Promise.resolve(mockApiResponse(responses[key]));
    }

    // Default responses
    if (url.includes('/api/ai/esg-score')) {
      return Promise.resolve(mockApiResponse(mockESGData));
    }
    if (url.includes('/api/ai/investment-recommendations')) {
      return Promise.resolve(mockApiResponse(mockInvestmentRecommendations));
    }
    if (url.includes('/api/green-finance/carbon-analysis')) {
      return Promise.resolve(mockApiResponse(mockCarbonData));
    }

    return Promise.resolve(mockApiResponse({ error: 'Not found' }, 404));
  });
};

export const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

export const mockWallet = {
  isConnected: true,
  connection: {
    address: 'SP1ABC123DEF456GHI789',
    balance: 1.25,
    network: 'mainnet'
  },
  connect: jest.fn(),
  disconnect: jest.fn(),
  sendTransaction: jest.fn()
};

// Custom render function
export const renderWithProviders = (ui, options = {}) => {
  const {
    initialState = {},
    ...renderOptions
  } = options;

  // Mock providers if needed
  const Wrapper = ({ children }) => {
    return (
      <div data-testid="test-wrapper">
        {children}
      </div>
    );
  };

  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
};

// Wait utilities
export const waitForApiCall = async (mockFn, timeout = 5000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (mockFn.mock.calls.length > 0) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('API call did not happen within timeout');
};

export const waitForCondition = async (condition, timeout = 5000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('Condition not met within timeout');
};

// Performance testing utilities
export const measurePerformance = async (fn) => {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  return { result, duration };
};

export const mockPerformanceObserver = {
  observe: jest.fn(),
  disconnect: jest.fn(),
  takeRecords: jest.fn(() => [])
};

// Security testing utilities
export const createMaliciousInput = {
  xss: '<script>alert("xss")</script>',
  sqlInjection: "'; DROP TABLE users; --",
  pathTraversal: '../../../etc/passwd',
  longString: 'A'.repeat(10000),
  specialChars: '!@#$%^&*()_+{}|:"<>?`~[]\\;\'.,/',
  unicode: '𝕏𝕊𝕊 𝔸𝕥𝕥𝕒𝕔𝕜 💀',
  emptyString: '',
  nullByte: '\0',
  controlChars: '\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0A\x0B\x0C\x0D\x0E\x0F'
};

export const mockSecurityHeaders = {
  'Content-Security-Policy': "default-src 'self'",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};

// Error simulation utilities
export const createApiError = (status, message) => ({
  ok: false,
  status,
  statusText: message,
  json: async () => ({ error: message }),
  text: async () => JSON.stringify({ error: message })
});

export const networkErrors = {
  timeout: () => Promise.reject(new Error('Network timeout')),
  connectionRefused: () => Promise.reject(new Error('Connection refused')),
  networkError: () => Promise.reject(new Error('Network error')),
  rateLimited: () => Promise.resolve(createApiError(429, 'Rate limited')),
  serverError: () => Promise.resolve(createApiError(500, 'Internal server error')),
  unauthorized: () => Promise.resolve(createApiError(401, 'Unauthorized')),
  forbidden: () => Promise.resolve(createApiError(403, 'Forbidden'))
};

export { rtlRender as render };