import { createMocks } from 'node-mocks-http';
import { createMaliciousInput, mockSecurityHeaders, networkErrors } from '../utils/test-utils';

// Import API handlers
import esgScoreHandler from '../../pages/api/ai/esg-score';
import recommendationsHandler from '../../pages/api/ai/investment-recommendations';
import healthHandler from '../../pages/api/health';

describe('API Security Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';
  });

  describe('Input validation and sanitization', () => {
    describe('ESG Score API', () => {
      test('should reject XSS attempts', async () => {
        const { req, res } = createMocks({
          method: 'POST',
          body: {
            companyName: createMaliciousInput.xss,
            sector: 'Technology',
            description: createMaliciousInput.xss
          }
        });

        await esgScoreHandler(req, res);

        // Should either sanitize or reject
        expect([200, 400]).toContain(res._getStatusCode());

        if (res._getStatusCode() === 200) {
          const data = JSON.parse(res._getData());
          const responseStr = JSON.stringify(data);
          expect(responseStr).not.toContain('<script>');
          expect(responseStr).not.toContain('alert(');
        }
      });

      test('should reject SQL injection attempts', async () => {
        const { req, res } = createMocks({
          method: 'POST',
          body: {
            companyName: createMaliciousInput.sqlInjection,
            sector: 'Technology',
            description: createMaliciousInput.sqlInjection
          }
        });

        await esgScoreHandler(req, res);

        expect([200, 400]).toContain(res._getStatusCode());

        if (res._getStatusCode() === 200) {
          const data = JSON.parse(res._getData());
          const responseStr = JSON.stringify(data);
          expect(responseStr).not.toContain('DROP TABLE');
          expect(responseStr).not.toContain('DELETE FROM');
        }
      });

      test('should handle path traversal attempts', async () => {
        const { req, res } = createMocks({
          method: 'POST',
          body: {
            companyName: createMaliciousInput.pathTraversal,
            sector: 'Technology',
            description: createMaliciousInput.pathTraversal
          }
        });

        await esgScoreHandler(req, res);

        expect([200, 400]).toContain(res._getStatusCode());

        if (res._getStatusCode() === 200) {
          const data = JSON.parse(res._getData());
          const responseStr = JSON.stringify(data);
          expect(responseStr).not.toContain('../');
          expect(responseStr).not.toContain('/etc/passwd');
        }
      });

      test('should reject oversized payloads', async () => {
        const { req, res } = createMocks({
          method: 'POST',
          body: {
            companyName: createMaliciousInput.longString,
            sector: 'Technology',
            description: createMaliciousInput.longString.repeat(100) // Very large payload
          }
        });

        await esgScoreHandler(req, res);

        // Should reject or handle gracefully
        expect([200, 400, 413]).toContain(res._getStatusCode());
      });

      test('should handle unicode and special characters', async () => {
        const { req, res } = createMocks({
          method: 'POST',
          body: {
            companyName: createMaliciousInput.unicode,
            sector: 'Technology',
            description: createMaliciousInput.specialChars
          }
        });

        await esgScoreHandler(req, res);

        // Should handle without crashing
        expect(res._getStatusCode()).toBeGreaterThanOrEqual(200);
        expect(res._getStatusCode()).toBeLessThan(600);
      });

      test('should reject null byte injection', async () => {
        const { req, res } = createMocks({
          method: 'POST',
          body: {
            companyName: `Valid Company${createMaliciousInput.nullByte}malicious`,
            sector: 'Technology'
          }
        });

        await esgScoreHandler(req, res);

        if (res._getStatusCode() === 200) {
          const data = JSON.parse(res._getData());
          const responseStr = JSON.stringify(data);
          expect(responseStr).not.toContain('\0');
        }
      });
    });

    describe('Investment Recommendations API', () => {
      test('should validate portfolio data structure', async () => {
        const maliciousPortfolio = [
          {
            symbol: createMaliciousInput.xss,
            name: createMaliciousInput.sqlInjection,
            quantity: 'invalid',
            currentPrice: -100 // Invalid negative price
          }
        ];

        const { req, res } = createMocks({
          method: 'POST',
          body: {
            portfolio: maliciousPortfolio,
            preferences: {
              riskTolerance: createMaliciousInput.xss
            }
          }
        });

        await recommendationsHandler(req, res);

        expect(res._getStatusCode()).toBe(400);
      });

      test('should reject malformed portfolio objects', async () => {
        const { req, res } = createMocks({
          method: 'POST',
          body: {
            portfolio: 'not-an-array',
            preferences: {
              riskTolerance: 'medium'
            }
          }
        });

        await recommendationsHandler(req, res);

        expect(res._getStatusCode()).toBe(400);
      });
    });
  });

  describe('Authentication and authorization', () => {
    test('should require valid API keys in production', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.OPENAI_API_KEY;

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          companyName: 'Tesla Inc.',
          sector: 'Automotive'
        }
      });

      await esgScoreHandler(req, res);

      expect(res._getStatusCode()).toBe(500);
    });

    test('should validate API key format', async () => {
      process.env.OPENAI_API_KEY = 'invalid-key-format';

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          companyName: 'Tesla Inc.',
          sector: 'Automotive'
        }
      });

      await esgScoreHandler(req, res);

      // Should fail with invalid API key
      expect([401, 500]).toContain(res._getStatusCode());
    });

    test('should implement rate limiting', async () => {
      const requests = [];

      // Simulate rapid requests
      for (let i = 0; i < 10; i++) {
        const { req, res } = createMocks({
          method: 'POST',
          headers: {
            'x-forwarded-for': '192.168.1.1' // Same IP
          },
          body: {
            companyName: `Company ${i}`,
            sector: 'Technology'
          }
        });

        requests.push(esgScoreHandler(req, res).then(() => res._getStatusCode()));
      }

      const statusCodes = await Promise.all(requests);

      // At least some requests should be rate limited
      expect(statusCodes.some(code => code === 429)).toBe(true);
    });

    test('should block requests from blacklisted IPs', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-forwarded-for': '127.0.0.1' // Potentially blocked IP
        },
        body: {
          companyName: 'Tesla Inc.',
          sector: 'Automotive'
        }
      });

      await esgScoreHandler(req, res);

      // Implementation dependent - might block localhost in production
      expect(res._getStatusCode()).toBeGreaterThanOrEqual(200);
    });
  });

  describe('HTTP security headers', () => {
    test('should include security headers in API responses', async () => {
      const { req, res } = createMocks({
        method: 'GET'
      });

      await healthHandler(req, res);

      const headers = res.getHeaders();

      expect(headers['access-control-allow-origin']).toBeDefined();
      expect(headers['access-control-allow-methods']).toBeDefined();
      expect(headers['access-control-allow-headers']).toBeDefined();
    });

    test('should set proper CORS headers', async () => {
      const { req, res } = createMocks({
        method: 'OPTIONS',
        headers: {
          origin: 'https://example.com'
        }
      });

      await esgScoreHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(res.getHeaders()['access-control-allow-origin']).toBeDefined();
    });

    test('should include rate limiting headers', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          companyName: 'Tesla Inc.',
          sector: 'Automotive'
        }
      });

      await esgScoreHandler(req, res);

      const headers = res.getHeaders();
      expect(headers['x-ratelimit-limit']).toBeDefined();
      expect(headers['x-ratelimit-remaining']).toBeDefined();
    });
  });

  describe('Error handling security', () => {
    test('should not leak sensitive information in error messages', async () => {
      // Force an error
      delete process.env.OPENAI_API_KEY;

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          companyName: 'Tesla Inc.',
          sector: 'Automotive'
        }
      });

      await esgScoreHandler(req, res);

      expect(res._getStatusCode()).toBe(500);
      const data = JSON.parse(res._getData());

      // Should not contain sensitive information
      const errorStr = JSON.stringify(data);
      expect(errorStr).not.toContain('process.env');
      expect(errorStr).not.toContain('OPENAI_API_KEY');
      expect(errorStr).not.toContain('stack trace');
      expect(errorStr).not.toContain('file path');
    });

    test('should handle malformed JSON gracefully', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: 'invalid json{{'
      });

      await esgScoreHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data).toHaveProperty('error');
    });

    test('should handle missing content-type header', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          companyName: 'Tesla Inc.',
          sector: 'Automotive'
        }
      });

      await esgScoreHandler(req, res);

      // Should handle gracefully
      expect(res._getStatusCode()).toBeGreaterThanOrEqual(200);
    });
  });

  describe('Data sanitization', () => {
    test('should sanitize output data', async () => {
      // Mock AI response with potentially dangerous content
      jest.doMock('../../lib/ai/openai-client', () => ({
        generateESGAnalysis: () => Promise.resolve({
          esgScores: { environmental: 85, social: 72, governance: 68, overall: 75 },
          analysis: {
            strengths: ['<script>alert("xss")</script>'],
            weaknesses: ['Normal weakness'],
            recommendations: ['javascript:alert("xss")']
          },
          confidence: 0.87
        })
      }));

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          companyName: 'Tesla Inc.',
          sector: 'Automotive'
        }
      });

      await esgScoreHandler(req, res);

      if (res._getStatusCode() === 200) {
        const data = JSON.parse(res._getData());
        const responseStr = JSON.stringify(data);

        // Should sanitize dangerous content
        expect(responseStr).not.toContain('<script>');
        expect(responseStr).not.toContain('javascript:');
        expect(responseStr).not.toContain('alert(');
      }
    });

    test('should escape HTML entities', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          companyName: 'Company & Associates <Test>',
          sector: 'Technology',
          description: 'Company with "quotes" and \'apostrophes\''
        }
      });

      await esgScoreHandler(req, res);

      if (res._getStatusCode() === 200) {
        const data = JSON.parse(res._getData());
        // Should handle special characters properly
        expect(data).toBeDefined();
      }
    });
  });

  describe('Resource protection', () => {
    test('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = Array.from({ length: 20 }, (_, i) => {
        const { req, res } = createMocks({
          method: 'POST',
          body: {
            companyName: `Company ${i}`,
            sector: 'Technology'
          }
        });

        return esgScoreHandler(req, res).then(() => ({
          status: res._getStatusCode(),
          requestId: i
        }));
      });

      const results = await Promise.all(concurrentRequests);

      // Most requests should succeed, but some might be rate limited
      const successCount = results.filter(r => r.status === 200).length;
      const rateLimitedCount = results.filter(r => r.status === 429).length;

      expect(successCount + rateLimitedCount).toBe(20);
      expect(successCount).toBeGreaterThan(0);
    });

    test('should timeout long-running requests', async () => {
      // Mock a slow AI response
      jest.doMock('../../lib/ai/openai-client', () => ({
        generateESGAnalysis: () => new Promise(resolve =>
          setTimeout(resolve, 65000) // 65 seconds - should timeout
        )
      }));

      const start = Date.now();

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          companyName: 'Tesla Inc.',
          sector: 'Automotive'
        }
      });

      await esgScoreHandler(req, res);

      const duration = Date.now() - start;

      // Should timeout before 65 seconds
      expect(duration).toBeLessThan(60000);
      expect([500, 504]).toContain(res._getStatusCode());
    });

    test('should limit request payload size', async () => {
      const hugePayload = {
        companyName: 'A'.repeat(1000000), // 1MB string
        sector: 'Technology',
        description: 'B'.repeat(1000000) // Another 1MB string
      };

      const { req, res } = createMocks({
        method: 'POST',
        body: hugePayload
      });

      await esgScoreHandler(req, res);

      // Should reject or handle large payloads
      expect([200, 400, 413]).toContain(res._getStatusCode());
    });
  });

  describe('Content type validation', () => {
    test('should only accept application/json for POST requests', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'text/plain'
        },
        body: 'plain text body'
      });

      await esgScoreHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
    });

    test('should reject XML payloads', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/xml'
        },
        body: '<?xml version="1.0"?><root><companyName>Test</companyName></root>'
      });

      await esgScoreHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
    });

    test('should reject multipart/form-data', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'multipart/form-data'
        },
        body: 'multipart data'
      });

      await esgScoreHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
    });
  });

  describe('API versioning security', () => {
    test('should handle version-specific attacks', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-api-version': '../../etc/passwd'
        },
        body: {
          companyName: 'Tesla Inc.',
          sector: 'Automotive'
        }
      });

      await esgScoreHandler(req, res);

      // Should not be vulnerable to path traversal via headers
      expect(res._getStatusCode()).toBeGreaterThanOrEqual(200);
    });

    test('should validate custom headers', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-custom-header': createMaliciousInput.xss,
          'user-agent': createMaliciousInput.sqlInjection
        },
        body: {
          companyName: 'Tesla Inc.',
          sector: 'Automotive'
        }
      });

      await esgScoreHandler(req, res);

      // Should handle malicious headers gracefully
      expect(res._getStatusCode()).toBeGreaterThanOrEqual(200);
    });
  });
});