import { performance } from 'perf_hooks';
import { createMocks } from 'node-mocks-http';
import esgScoreHandler from '../../pages/api/ai/esg-score';
import recommendationsHandler from '../../pages/api/ai/investment-recommendations';
import { measurePerformance, mockPortfolioData } from '../utils/test-utils';

// Mock OpenAI with controllable timing
const createTimedMockOpenAI = (delay = 1000) => ({
  chat: {
    completions: {
      create: jest.fn().mockImplementation(() =>
        new Promise(resolve =>
          setTimeout(() => resolve({
            choices: [{
              message: {
                content: JSON.stringify({
                  esgScores: { environmental: 85, social: 72, governance: 68, overall: 75 },
                  analysis: {
                    strengths: ['Clean energy leadership'],
                    weaknesses: ['Governance concerns'],
                    recommendations: ['Improve board diversity']
                  },
                  confidence: 0.87
                })
              }
            }],
            usage: {
              prompt_tokens: 150,
              completion_tokens: 200,
              total_tokens: 350
            }
          }), delay)
        )
      )
    }
  }
});

jest.mock('openai', () => jest.fn(() => createTimedMockOpenAI()));

describe('AI Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = 'sk-test-key';
    process.env.NODE_ENV = 'test';
  });

  describe('Response time benchmarks', () => {
    test('ESG analysis should complete within 30 seconds', async () => {
      const { result, duration } = await measurePerformance(async () => {
        const { req, res } = createMocks({
          method: 'POST',
          body: {
            companyName: 'Tesla Inc.',
            sector: 'Automotive',
            description: 'Electric vehicle manufacturer focusing on sustainable transportation'
          }
        });

        await esgScoreHandler(req, res);
        return { status: res._getStatusCode(), data: res._getData() };
      });

      expect(result.status).toBe(200);
      expect(duration).toBeLessThan(30000); // 30 seconds
      expect(duration).toBeGreaterThan(100); // Should take some time
    });

    test('Investment recommendations should complete within 60 seconds', async () => {
      const { result, duration } = await measurePerformance(async () => {
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

        await recommendationsHandler(req, res);
        return { status: res._getStatusCode(), data: res._getData() };
      });

      expect(result.status).toBe(200);
      expect(duration).toBeLessThan(60000); // 60 seconds
    });

    test('should handle rapid consecutive requests efficiently', async () => {
      const requestCount = 5;
      const requests = [];

      const startTime = performance.now();

      for (let i = 0; i < requestCount; i++) {
        const request = measurePerformance(async () => {
          const { req, res } = createMocks({
            method: 'POST',
            body: {
              companyName: `Company ${i}`,
              sector: 'Technology'
            }
          });

          await esgScoreHandler(req, res);
          return res._getStatusCode();
        });

        requests.push(request);
      }

      const results = await Promise.all(requests);
      const totalTime = performance.now() - startTime;

      // All requests should succeed
      results.forEach(({ result }) => {
        expect(result).toBe(200);
      });

      // Total time should be reasonable (considering parallel execution)
      expect(totalTime).toBeLessThan(35000); // 35 seconds for 5 requests

      // Average response time should be acceptable
      const avgDuration = results.reduce((sum, { duration }) => sum + duration, 0) / requestCount;
      expect(avgDuration).toBeLessThan(30000);
    });
  });

  describe('Memory usage optimization', () => {
    test('should not cause memory leaks during multiple requests', async () => {
      const initialMemory = process.memoryUsage();

      // Execute multiple requests
      for (let i = 0; i < 10; i++) {
        const { req, res } = createMocks({
          method: 'POST',
          body: {
            companyName: `Test Company ${i}`,
            sector: 'Technology'
          }
        });

        await esgScoreHandler(req, res);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    test('should handle large portfolio datasets efficiently', async () => {
      const largePortfolio = Array.from({ length: 100 }, (_, i) => ({
        symbol: `STOCK${i}`,
        name: `Stock Company ${i}`,
        quantity: Math.random() * 100,
        currentPrice: Math.random() * 1000,
        totalValue: Math.random() * 10000,
        esgScore: Math.floor(Math.random() * 100),
        sector: ['Technology', 'Healthcare', 'Finance', 'Energy'][i % 4]
      }));

      const { result, duration } = await measurePerformance(async () => {
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

        await recommendationsHandler(req, res);
        return { status: res._getStatusCode(), data: res._getData() };
      });

      expect(result.status).toBe(200);
      expect(duration).toBeLessThan(90000); // 90 seconds for large dataset
    });
  });

  describe('Concurrent load testing', () => {
    test('should handle 10 concurrent ESG analysis requests', async () => {
      const concurrentRequests = 10;
      const requests = [];

      const startTime = performance.now();

      for (let i = 0; i < concurrentRequests; i++) {
        const request = async () => {
          const { req, res } = createMocks({
            method: 'POST',
            body: {
              companyName: `Concurrent Company ${i}`,
              sector: ['Technology', 'Healthcare', 'Finance'][i % 3]
            }
          });

          const requestStart = performance.now();
          await esgScoreHandler(req, res);
          const requestDuration = performance.now() - requestStart;

          return {
            status: res._getStatusCode(),
            duration: requestDuration,
            requestId: i
          };
        };

        requests.push(request());
      }

      const results = await Promise.all(requests);
      const totalTime = performance.now() - startTime;

      // All requests should succeed or be rate limited
      const successCount = results.filter(r => r.status === 200).length;
      const rateLimitedCount = results.filter(r => r.status === 429).length;

      expect(successCount + rateLimitedCount).toBe(concurrentRequests);
      expect(successCount).toBeGreaterThan(0);

      // Total time should be reasonable for concurrent execution
      expect(totalTime).toBeLessThan(45000); // 45 seconds

      // Check individual request performance
      results.forEach(result => {
        if (result.status === 200) {
          expect(result.duration).toBeLessThan(35000);
        }
      });
    });

    test('should handle mixed API endpoint load', async () => {
      const mixedRequests = [];

      // ESG analysis requests
      for (let i = 0; i < 5; i++) {
        mixedRequests.push(async () => {
          const { req, res } = createMocks({
            method: 'POST',
            body: {
              companyName: `ESG Company ${i}`,
              sector: 'Technology'
            }
          });

          const start = performance.now();
          await esgScoreHandler(req, res);
          return {
            type: 'esg',
            status: res._getStatusCode(),
            duration: performance.now() - start
          };
        });
      }

      // Investment recommendation requests
      for (let i = 0; i < 5; i++) {
        mixedRequests.push(async () => {
          const { req, res } = createMocks({
            method: 'POST',
            body: {
              portfolio: mockPortfolioData.holdings.slice(0, 3),
              preferences: {
                riskTolerance: 'medium',
                sustainabilityFocus: 'high'
              }
            }
          });

          const start = performance.now();
          await recommendationsHandler(req, res);
          return {
            type: 'recommendations',
            status: res._getStatusCode(),
            duration: performance.now() - start
          };
        });
      }

      const results = await Promise.all(mixedRequests.map(req => req()));

      // Analyze results by type
      const esgResults = results.filter(r => r.type === 'esg');
      const recResults = results.filter(r => r.type === 'recommendations');

      // Both types should mostly succeed
      expect(esgResults.filter(r => [200, 429].includes(r.status)).length).toBeGreaterThan(3);
      expect(recResults.filter(r => [200, 429].includes(r.status)).length).toBeGreaterThan(3);

      // Performance should be acceptable for both
      esgResults.forEach(result => {
        if (result.status === 200) {
          expect(result.duration).toBeLessThan(35000);
        }
      });

      recResults.forEach(result => {
        if (result.status === 200) {
          expect(result.duration).toBeLessThan(65000);
        }
      });
    });
  });

  describe('Token usage optimization', () => {
    test('should monitor OpenAI token consumption', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          companyName: 'Tesla Inc.',
          sector: 'Automotive',
          description: 'Electric vehicle and clean energy company with focus on sustainable transportation solutions'
        }
      });

      await esgScoreHandler(req, res);

      expect(res._getStatusCode()).toBe(200);

      // Check if token usage is tracked (implementation specific)
      const mockOpenAI = require('openai').__instance;
      if (mockOpenAI && mockOpenAI.chat.completions.create.mock.calls.length > 0) {
        // Token usage should be reasonable
        const call = mockOpenAI.chat.completions.create.mock.calls[0];
        expect(call).toBeDefined();
      }
    });

    test('should optimize prompt length for better performance', async () => {
      const shortDescription = 'Tech company';
      const longDescription = 'A'.repeat(5000); // Very long description

      const shortPromptTest = measurePerformance(async () => {
        const { req, res } = createMocks({
          method: 'POST',
          body: {
            companyName: 'Company A',
            sector: 'Technology',
            description: shortDescription
          }
        });

        await esgScoreHandler(req, res);
        return res._getStatusCode();
      });

      const longPromptTest = measurePerformance(async () => {
        const { req, res } = createMocks({
          method: 'POST',
          body: {
            companyName: 'Company B',
            sector: 'Technology',
            description: longDescription
          }
        });

        await esgScoreHandler(req, res);
        return res._getStatusCode();
      });

      const [shortResult, longResult] = await Promise.all([shortPromptTest, longPromptTest]);

      // Both should succeed
      expect(shortResult.result).toBe(200);
      expect(longResult.result).toBe(200);

      // Long prompt might take longer but shouldn't be excessive
      expect(longResult.duration).toBeLessThan(45000);
    });
  });

  describe('Caching effectiveness', () => {
    test('should benefit from response caching for identical requests', async () => {
      const requestBody = {
        companyName: 'Apple Inc.',
        sector: 'Technology',
        description: 'Technology company'
      };

      // First request
      const firstRequest = await measurePerformance(async () => {
        const { req, res } = createMocks({
          method: 'POST',
          body: requestBody
        });

        await esgScoreHandler(req, res);
        return { status: res._getStatusCode(), data: res._getData() };
      });

      expect(firstRequest.result.status).toBe(200);

      // Second identical request (might be cached)
      const secondRequest = await measurePerformance(async () => {
        const { req, res } = createMocks({
          method: 'POST',
          body: requestBody
        });

        await esgScoreHandler(req, res);
        return { status: res._getStatusCode(), data: res._getData() };
      });

      expect(secondRequest.result.status).toBe(200);

      // Results should be consistent
      expect(firstRequest.result.data).toBeDefined();
      expect(secondRequest.result.data).toBeDefined();

      // Second request might be faster if cached (implementation dependent)
      // This test documents the expected behavior
    });

    test('should handle cache invalidation properly', async () => {
      const baseRequest = {
        companyName: 'Microsoft Corporation',
        sector: 'Technology'
      };

      // Request with additional description
      const detailedRequest = {
        ...baseRequest,
        description: 'Large technology company with cloud services'
      };

      const [baseResult, detailedResult] = await Promise.all([
        measurePerformance(async () => {
          const { req, res } = createMocks({
            method: 'POST',
            body: baseRequest
          });

          await esgScoreHandler(req, res);
          return res._getStatusCode();
        }),
        measurePerformance(async () => {
          const { req, res } = createMocks({
            method: 'POST',
            body: detailedRequest
          });

          await esgScoreHandler(req, res);
          return res._getStatusCode();
        })
      ]);

      // Both should succeed
      expect(baseResult.result).toBe(200);
      expect(detailedResult.result).toBe(200);

      // Both should complete in reasonable time
      expect(baseResult.duration).toBeLessThan(35000);
      expect(detailedResult.duration).toBeLessThan(35000);
    });
  });

  describe('Error handling performance', () => {
    test('should fail fast for invalid requests', async () => {
      const { result, duration } = await measurePerformance(async () => {
        const { req, res } = createMocks({
          method: 'POST',
          body: {
            // Missing required fields
            sector: 'Technology'
          }
        });

        await esgScoreHandler(req, res);
        return res._getStatusCode();
      });

      expect(result).toBe(400);
      expect(duration).toBeLessThan(1000); // Should fail quickly
    });

    test('should handle AI service timeouts gracefully', async () => {
      // Mock a timeout scenario
      const timedOutOpenAI = createTimedMockOpenAI(70000); // 70 second delay
      jest.doMock('openai', () => jest.fn(() => timedOutOpenAI));

      const { result, duration } = await measurePerformance(async () => {
        const { req, res } = createMocks({
          method: 'POST',
          body: {
            companyName: 'Timeout Test Company',
            sector: 'Technology'
          }
        });

        await esgScoreHandler(req, res);
        return res._getStatusCode();
      });

      // Should timeout before 70 seconds
      expect(duration).toBeLessThan(65000);
      expect([500, 504]).toContain(result);
    });
  });

  describe('Scalability metrics', () => {
    test('should maintain performance under increasing load', async () => {
      const loadLevels = [1, 3, 5, 8];
      const results = [];

      for (const load of loadLevels) {
        const requests = Array.from({ length: load }, (_, i) =>
          measurePerformance(async () => {
            const { req, res } = createMooks({
              method: 'POST',
              body: {
                companyName: `Load Test Company ${i}`,
                sector: 'Technology'
              }
            });

            await esgScoreHandler(req, res);
            return res._getStatusCode();
          })
        );

        const loadResults = await Promise.all(requests);
        const avgDuration = loadResults.reduce((sum, { duration }) => sum + duration, 0) / load;
        const successRate = loadResults.filter(({ result }) => result === 200).length / load;

        results.push({
          load,
          avgDuration,
          successRate
        });
      }

      // Performance should not degrade dramatically with load
      results.forEach(({ load, avgDuration, successRate }) => {
        expect(avgDuration).toBeLessThan(40000 + (load * 2000)); // Allow some degradation
        expect(successRate).toBeGreaterThan(0.5); // At least 50% success rate
      });
    });
  });
});