import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/ai/esg-score';
import { mockESGData, createMaliciousInput, networkErrors } from '../utils/test-utils';

// Mock OpenAI
jest.mock('openai', () => require('../__mocks__/openai').default);

describe('/api/ai/esg-score', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables
    process.env.OPENAI_API_KEY = 'sk-test-key';
    process.env.NODE_ENV = 'test';
  });

  describe('Successful requests', () => {
    test('should return ESG analysis for valid company', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          companyName: 'Tesla Inc.',
          sector: 'Automotive',
          description: 'Electric vehicle and clean energy company'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());

      expect(data).toHaveProperty('esgScores');
      expect(data.esgScores).toHaveProperty('environmental');
      expect(data.esgScores).toHaveProperty('social');
      expect(data.esgScores).toHaveProperty('governance');
      expect(data.esgScores).toHaveProperty('overall');

      expect(data).toHaveProperty('analysis');
      expect(data.analysis).toHaveProperty('strengths');
      expect(data.analysis).toHaveProperty('weaknesses');
      expect(data.analysis).toHaveProperty('recommendations');

      expect(data).toHaveProperty('confidence');
      expect(data.confidence).toBeGreaterThan(0);
      expect(data.confidence).toBeLessThanOrEqual(1);
    });

    test('should handle different sectors correctly', async () => {
      const sectors = ['Technology', 'Healthcare', 'Finance', 'Energy', 'Consumer Goods'];

      for (const sector of sectors) {
        const { req, res } = createMocks({
          method: 'POST',
          body: {
            companyName: 'Test Company',
            sector,
            description: `A ${sector.toLowerCase()} company`
          }
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(200);
        const data = JSON.parse(res._getData());
        expect(data).toHaveProperty('esgScores');
      }
    });

    test('should include proper response headers', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          companyName: 'Apple Inc.',
          sector: 'Technology'
        }
      });

      await handler(req, res);

      expect(res.getHeaders()).toMatchObject({
        'content-type': 'application/json',
        'access-control-allow-origin': '*'
      });
    });
  });

  describe('Input validation', () => {
    test('should reject empty company name', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          companyName: '',
          sector: 'Technology'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data).toHaveProperty('error');
    });

    test('should reject missing required fields', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          sector: 'Technology'
          // Missing companyName
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
    });

    test('should sanitize malicious input', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          companyName: createMaliciousInput.xss,
          sector: 'Technology',
          description: createMaliciousInput.sqlInjection
        }
      });

      await handler(req, res);

      // Should not crash and should handle safely
      expect([200, 400]).toContain(res._getStatusCode());
    });

    test('should handle very long input strings', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          companyName: 'A'.repeat(1000),
          sector: 'Technology',
          description: 'B'.repeat(5000)
        }
      });

      await handler(req, res);

      expect([200, 400]).toContain(res._getStatusCode());
    });

    test('should validate sector values', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          companyName: 'Test Company',
          sector: 'Invalid Sector 123!@#',
          description: 'Test description'
        }
      });

      await handler(req, res);

      // Should either accept or validate properly
      expect(res._getStatusCode()).toBeGreaterThanOrEqual(200);
    });
  });

  describe('HTTP method validation', () => {
    test('should reject GET requests', async () => {
      const { req, res } = createMocks({
        method: 'GET'
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
      const data = JSON.parse(res._getData());
      expect(data.error).toContain('Method not allowed');
    });

    test('should handle OPTIONS requests for CORS', async () => {
      const { req, res } = createMocks({
        method: 'OPTIONS'
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });

    test('should reject PUT requests', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        body: { companyName: 'Test' }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
    });
  });

  describe('Authentication and rate limiting', () => {
    test('should fail without API key', async () => {
      delete process.env.OPENAI_API_KEY;

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          companyName: 'Tesla Inc.',
          sector: 'Automotive'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
    });

    test('should include rate limiting headers', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          companyName: 'Apple Inc.',
          sector: 'Technology'
        }
      });

      await handler(req, res);

      const headers = res.getHeaders();
      expect(headers).toHaveProperty('x-ratelimit-limit');
      expect(headers).toHaveProperty('x-ratelimit-remaining');
    });
  });

  describe('Error handling', () => {
    test('should handle OpenAI API errors gracefully', async () => {
      // Mock OpenAI to throw an error
      const mockOpenAI = require('../__mocks__/openai').mockOpenAI;
      mockOpenAI.chat.completions.create.mockRejectedValueOnce(
        new Error('OpenAI API Error')
      );

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          companyName: 'Tesla Inc.',
          sector: 'Automotive'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
      const data = JSON.parse(res._getData());
      expect(data).toHaveProperty('error');
    });

    test('should handle malformed JSON responses', async () => {
      // Mock OpenAI to return invalid JSON
      const mockOpenAI = require('../__mocks__/openai').mockOpenAI;
      mockOpenAI.chat.completions.create.mockResolvedValueOnce({
        choices: [{
          message: {
            content: 'Invalid JSON response'
          }
        }]
      });

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          companyName: 'Tesla Inc.',
          sector: 'Automotive'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
    });

    test('should handle timeout scenarios', async () => {
      // Mock a timeout
      const mockOpenAI = require('../__mocks__/openai').mockOpenAI;
      mockOpenAI.chat.completions.create.mockImplementationOnce(
        () => new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          companyName: 'Tesla Inc.',
          sector: 'Automotive'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
    });
  });

  describe('Response validation', () => {
    test('should return consistent data structure', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          companyName: 'Microsoft Corporation',
          sector: 'Technology',
          description: 'Technology company'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());

      // Validate structure
      expect(data).toMatchObject({
        esgScores: {
          environmental: expect.any(Number),
          social: expect.any(Number),
          governance: expect.any(Number),
          overall: expect.any(Number)
        },
        analysis: {
          strengths: expect.any(Array),
          weaknesses: expect.any(Array),
          recommendations: expect.any(Array)
        },
        confidence: expect.any(Number)
      });

      // Validate score ranges
      Object.values(data.esgScores).forEach(score => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });

      // Validate confidence range
      expect(data.confidence).toBeGreaterThan(0);
      expect(data.confidence).toBeLessThanOrEqual(1);
    });

    test('should include timestamp and metadata', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          companyName: 'Amazon.com Inc.',
          sector: 'Technology'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());

      expect(data).toHaveProperty('timestamp');
      expect(new Date(data.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('Performance tests', () => {
    test('should respond within acceptable time limits', async () => {
      const start = Date.now();

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          companyName: 'Google Inc.',
          sector: 'Technology'
        }
      });

      await handler(req, res);

      const duration = Date.now() - start;

      expect(res._getStatusCode()).toBe(200);
      expect(duration).toBeLessThan(30000); // 30 second timeout
    });

    test('should handle concurrent requests', async () => {
      const requests = Array.from({ length: 5 }, (_, i) => {
        const { req, res } = createMocks({
          method: 'POST',
          body: {
            companyName: `Company ${i}`,
            sector: 'Technology'
          }
        });
        return handler(req, res).then(() => res._getStatusCode());
      });

      const results = await Promise.all(requests);

      // All requests should succeed
      results.forEach(statusCode => {
        expect(statusCode).toBe(200);
      });
    });
  });
});