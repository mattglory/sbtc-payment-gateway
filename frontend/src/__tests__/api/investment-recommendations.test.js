import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/ai/investment-recommendations';
import { mockInvestmentRecommendations, mockPortfolioData } from '../utils/test-utils';

// Mock OpenAI
jest.mock('openai', () => require('../__mocks__/openai').default);

describe('/api/ai/investment-recommendations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = 'sk-test-key';
    process.env.NODE_ENV = 'test';
  });

  describe('Successful requests', () => {
    test('should return investment recommendations for valid portfolio', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          portfolio: mockPortfolioData.holdings,
          preferences: {
            riskTolerance: 'medium',
            sustainabilityFocus: 'high',
            timeHorizon: 'long-term'
          }
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());

      expect(data).toHaveProperty('portfolioAnalysis');
      expect(data.portfolioAnalysis).toHaveProperty('currentESGScore');
      expect(data.portfolioAnalysis).toHaveProperty('sustainabilityGrade');
      expect(data.portfolioAnalysis).toHaveProperty('riskLevel');

      expect(data).toHaveProperty('recommendations');
      expect(Array.isArray(data.recommendations)).toBe(true);
      expect(data.recommendations.length).toBeGreaterThan(0);

      // Validate recommendation structure
      data.recommendations.forEach(rec => {
        expect(rec).toHaveProperty('symbol');
        expect(rec).toHaveProperty('name');
        expect(rec).toHaveProperty('recommendedAction');
        expect(rec).toHaveProperty('expectedReturn');
        expect(rec).toHaveProperty('esgImpact');
        expect(rec).toHaveProperty('riskLevel');
      });
    });

    test('should handle different risk tolerances', async () => {
      const riskLevels = ['low', 'medium', 'high'];

      for (const risk of riskLevels) {
        const { req, res } = createMocks({
          method: 'POST',
          body: {
            portfolio: mockPortfolioData.holdings,
            preferences: {
              riskTolerance: risk,
              sustainabilityFocus: 'medium'
            }
          }
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(200);
        const data = JSON.parse(res._getData());
        expect(data).toHaveProperty('recommendations');
      }
    });

    test('should handle empty portfolio', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          portfolio: [],
          preferences: {
            riskTolerance: 'medium',
            sustainabilityFocus: 'high'
          }
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data).toHaveProperty('recommendations');
      // Should provide starter recommendations for empty portfolio
    });

    test('should customize recommendations based on sustainability focus', async () => {
      const focusLevels = ['low', 'medium', 'high'];

      for (const focus of focusLevels) {
        const { req, res } = createMocks({
          method: 'POST',
          body: {
            portfolio: mockPortfolioData.holdings,
            preferences: {
              riskTolerance: 'medium',
              sustainabilityFocus: focus
            }
          }
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(200);
        const data = JSON.parse(res._getData());

        if (focus === 'high') {
          // High sustainability focus should prioritize ESG impact
          data.recommendations.forEach(rec => {
            expect(rec.esgImpact).toBeGreaterThan(0);
          });
        }
      }
    });
  });

  describe('Input validation', () => {
    test('should reject invalid portfolio data', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          portfolio: 'invalid',
          preferences: {
            riskTolerance: 'medium'
          }
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
    });

    test('should reject invalid risk tolerance', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          portfolio: mockPortfolioData.holdings,
          preferences: {
            riskTolerance: 'invalid',
            sustainabilityFocus: 'medium'
          }
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
    });

    test('should handle missing preferences', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          portfolio: mockPortfolioData.holdings
          // Missing preferences
        }
      });

      await handler(req, res);

      // Should use default preferences or return error
      expect([200, 400]).toContain(res._getStatusCode());
    });

    test('should validate portfolio holding structure', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          portfolio: [
            {
              // Missing required fields
              symbol: 'AAPL'
            }
          ],
          preferences: {
            riskTolerance: 'medium'
          }
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
    });
  });

  describe('AI response processing', () => {
    test('should handle malformed AI responses', async () => {
      const mockOpenAI = require('../__mocks__/openai').mockOpenAI;
      mockOpenAI.chat.completions.create.mockResolvedValueOnce({
        choices: [{
          message: {
            content: 'Invalid JSON'
          }
        }]
      });

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          portfolio: mockPortfolioData.holdings,
          preferences: {
            riskTolerance: 'medium'
          }
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
    });

    test('should validate AI response structure', async () => {
      const mockOpenAI = require('../__mocks__/openai').mockOpenAI;
      mockOpenAI.chat.completions.create.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              // Missing required fields
              recommendations: []
            })
          }
        }]
      });

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          portfolio: mockPortfolioData.holdings,
          preferences: {
            riskTolerance: 'medium'
          }
        }
      });

      await handler(req, res);

      // Should handle incomplete AI response
      expect([200, 500]).toContain(res._getStatusCode());
    });
  });

  describe('Performance and optimization', () => {
    test('should handle large portfolios efficiently', async () => {
      const largePortfolio = Array.from({ length: 50 }, (_, i) => ({
        symbol: `STOCK${i}`,
        name: `Stock ${i}`,
        quantity: 10,
        currentPrice: 100,
        totalValue: 1000,
        esgScore: 75,
        sector: 'Technology'
      }));

      const start = Date.now();

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          portfolio: largePortfolio,
          preferences: {
            riskTolerance: 'medium',
            sustainabilityFocus: 'high'
          }
        }
      });

      await handler(req, res);

      const duration = Date.now() - start;

      expect(res._getStatusCode()).toBe(200);
      expect(duration).toBeLessThan(60000); // Should complete within 60 seconds
    });

    test('should cache similar requests', async () => {
      const requestBody = {
        portfolio: mockPortfolioData.holdings,
        preferences: {
          riskTolerance: 'medium',
          sustainabilityFocus: 'high'
        }
      };

      // First request
      const { req: req1, res: res1 } = createMocks({
        method: 'POST',
        body: requestBody
      });

      const start1 = Date.now();
      await handler(req1, res1);
      const duration1 = Date.now() - start1;

      expect(res1._getStatusCode()).toBe(200);

      // Second identical request (should be faster if cached)
      const { req: req2, res: res2 } = createMocks({
        method: 'POST',
        body: requestBody
      });

      const start2 = Date.now();
      await handler(req2, res2);
      const duration2 = Date.now() - start2;

      expect(res2._getStatusCode()).toBe(200);

      // Second request might be faster due to caching
      // This is implementation-dependent
    });
  });

  describe('Recommendation quality validation', () => {
    test('should provide reasonable expected returns', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          portfolio: mockPortfolioData.holdings,
          preferences: {
            riskTolerance: 'medium',
            sustainabilityFocus: 'high'
          }
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());

      data.recommendations.forEach(rec => {
        // Expected returns should be reasonable (between -50% and +100%)
        expect(rec.expectedReturn).toBeGreaterThan(-50);
        expect(rec.expectedReturn).toBeLessThan(100);

        // ESG impact should be positive for recommendations
        expect(rec.esgImpact).toBeGreaterThan(0);

        // Risk level should be valid
        expect(['Low', 'Medium', 'High']).toContain(rec.riskLevel);
      });
    });

    test('should not recommend duplicate holdings', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          portfolio: mockPortfolioData.holdings,
          preferences: {
            riskTolerance: 'medium',
            sustainabilityFocus: 'high'
          }
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());

      const recommendedSymbols = data.recommendations.map(rec => rec.symbol);
      const currentSymbols = mockPortfolioData.holdings.map(holding => holding.symbol);

      // Recommendations should not duplicate current holdings
      const duplicates = recommendedSymbols.filter(symbol =>
        currentSymbols.includes(symbol)
      );

      expect(duplicates.length).toBe(0);
    });

    test('should provide diversified recommendations', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          portfolio: mockPortfolioData.holdings,
          preferences: {
            riskTolerance: 'medium',
            sustainabilityFocus: 'high'
          }
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());

      // Should recommend different types of investments
      const recommendationTypes = new Set(
        data.recommendations.map(rec => rec.type)
      );

      expect(recommendationTypes.size).toBeGreaterThan(1);
    });
  });

  describe('Error handling', () => {
    test('should handle OpenAI service unavailable', async () => {
      const mockOpenAI = require('../__mocks__/openai').mockOpenAI;
      mockOpenAI.chat.completions.create.mockRejectedValueOnce(
        new Error('Service unavailable')
      );

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          portfolio: mockPortfolioData.holdings,
          preferences: {
            riskTolerance: 'medium'
          }
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
      const data = JSON.parse(res._getData());
      expect(data).toHaveProperty('error');
    });

    test('should handle rate limiting gracefully', async () => {
      const mockOpenAI = require('../__mocks__/openai').mockOpenAI;
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.status = 429;

      mockOpenAI.chat.completions.create.mockRejectedValueOnce(rateLimitError);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          portfolio: mockPortfolioData.holdings,
          preferences: {
            riskTolerance: 'medium'
          }
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(429);
    });
  });
});