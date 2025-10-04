import {
  fractionalInvestmentSystem,
  InvestmentError,
  TransactionError
} from '../../lib/blockchain/fractional-investments';
import { carbonIntegration } from '../../lib/blockchain/carbon-integration';
import {
  mocksBTCTransaction,
  mockBlockchainData,
  mockPortfolioData,
  mockCarbonData
} from '../utils/test-utils';

// Mock Stacks Connect
jest.mock('@stacks/connect', () => require('../__mocks__/@stacks/connect'));

// Mock external APIs
global.fetch = jest.fn();

describe('sBTC Payment Gateway Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();

    // Mock Stacks API responses
    fetch.mockImplementation((url) => {
      if (url.includes('api.mainnet.hiro.so')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            balance: '125000000', // 1.25 sBTC in satoshis
            transactions: [mocksBTCTransaction]
          })
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  describe('Fractional Investment System', () => {
    describe('Investment purchases', () => {
      test('should successfully purchase fractional investment with sBTC', async () => {
        const investmentData = {
          investmentId: 'ICLN-001',
          usdAmount: 100,
          walletConnection: {
            address: 'SP1ABC123DEF456GHI789',
            balance: 1.25,
            network: 'mainnet'
          }
        };

        const result = await fractionalInvestmentSystem.purchaseFractionalInvestment(
          investmentData.investmentId,
          investmentData.usdAmount,
          investmentData.walletConnection
        );

        expect(result.success).toBe(true);
        expect(result.transactionId).toBeDefined();
        expect(result.fractionalShares).toBeGreaterThan(0);
        expect(result.totalCost).toBe(investmentData.usdAmount);
      });

      test('should handle insufficient balance gracefully', async () => {
        const investmentData = {
          investmentId: 'ICLN-001',
          usdAmount: 10000, // Exceeds wallet balance
          walletConnection: {
            address: 'SP1ABC123DEF456GHI789',
            balance: 0.01, // Low balance
            network: 'mainnet'
          }
        };

        await expect(
          fractionalInvestmentSystem.purchaseFractionalInvestment(
            investmentData.investmentId,
            investmentData.usdAmount,
            investmentData.walletConnection
          )
        ).rejects.toThrow(InvestmentError);
      });

      test('should validate investment parameters', async () => {
        // Test invalid investment ID
        await expect(
          fractionalInvestmentSystem.purchaseFractionalInvestment(
            '', // Empty investment ID
            100,
            mockBlockchainData
          )
        ).rejects.toThrow('Invalid investment ID');

        // Test negative amount
        await expect(
          fractionalInvestmentSystem.purchaseFractionalInvestment(
            'ICLN-001',
            -100, // Negative amount
            mockBlockchainData
          )
        ).rejects.toThrow('Investment amount must be positive');

        // Test missing wallet connection
        await expect(
          fractionalInvestmentSystem.purchaseFractionalInvestment(
            'ICLN-001',
            100,
            null // No wallet
          )
        ).rejects.toThrow('Wallet connection required');
      });

      test('should calculate fees correctly', async () => {
        const investmentAmount = 1000;
        const result = await fractionalInvestmentSystem.calculateInvestmentFees(
          investmentAmount
        );

        expect(result.totalFee).toBeGreaterThan(0);
        expect(result.totalFee).toBeLessThan(investmentAmount * 0.05); // Max 5% fee
        expect(result.networkFee).toBeDefined();
        expect(result.platformFee).toBeDefined();
        expect(result.netAmount).toBe(investmentAmount - result.totalFee);
      });
    });

    describe('Portfolio management', () => {
      test('should retrieve user portfolio correctly', async () => {
        const userAddress = 'SP1ABC123DEF456GHI789';
        const portfolio = await fractionalInvestmentSystem.getUserPortfolio(userAddress);

        expect(portfolio).toHaveProperty('totalValue');
        expect(portfolio).toHaveProperty('holdings');
        expect(portfolio).toHaveProperty('performance');
        expect(Array.isArray(portfolio.holdings)).toBe(true);

        // Validate holding structure
        portfolio.holdings.forEach(holding => {
          expect(holding).toHaveProperty('symbol');
          expect(holding).toHaveProperty('fractionalShares');
          expect(holding).toHaveProperty('currentValue');
          expect(holding).toHaveProperty('totalInvested');
        });
      });

      test('should calculate portfolio metrics accurately', () => {
        const metrics = fractionalInvestmentSystem.getPortfolioMetrics();

        expect(metrics).toHaveProperty('totalValue');
        expect(metrics).toHaveProperty('dayChange');
        expect(metrics).toHaveProperty('totalReturn');
        expect(metrics).toHaveProperty('esgScore');

        // Validate metric ranges
        expect(metrics.esgScore).toBeGreaterThanOrEqual(0);
        expect(metrics.esgScore).toBeLessThanOrEqual(100);
        expect(typeof metrics.totalValue).toBe('number');
        expect(typeof metrics.dayChange).toBe('number');
      });

      test('should handle empty portfolio', async () => {
        const emptyAddress = 'SP0000000000000000000';
        const portfolio = await fractionalInvestmentSystem.getUserPortfolio(emptyAddress);

        expect(portfolio.totalValue).toBe(0);
        expect(portfolio.holdings).toHaveLength(0);
        expect(portfolio.performance.totalReturn).toBe(0);
      });

      test('should track investment history', async () => {
        const userAddress = 'SP1ABC123DEF456GHI789';
        const history = await fractionalInvestmentSystem.getInvestmentHistory(userAddress);

        expect(Array.isArray(history)).toBe(true);

        history.forEach(transaction => {
          expect(transaction).toHaveProperty('txId');
          expect(transaction).toHaveProperty('timestamp');
          expect(transaction).toHaveProperty('type');
          expect(transaction).toHaveProperty('amount');
          expect(transaction).toHaveProperty('status');
        });
      });
    });

    describe('Real-time updates', () => {
      test('should update portfolio values in real-time', async () => {
        const initialMetrics = fractionalInvestmentSystem.getPortfolioMetrics();

        // Simulate market price change
        await fractionalInvestmentSystem.updateMarketPrices({
          'ICLN': 98.50, // Price drop
          'TSLA': 245.30, // Price increase
          'GRNBND': 100.10 // Slight increase
        });

        const updatedMetrics = fractionalInvestmentSystem.getPortfolioMetrics();

        expect(updatedMetrics.totalValue).not.toBe(initialMetrics.totalValue);
        expect(updatedMetrics.dayChange).toBeDefined();
      });

      test('should handle price update errors gracefully', async () => {
        const invalidPrices = {
          'INVALID': -50, // Negative price
          'ICLN': 'not-a-number' // Invalid type
        };

        await expect(
          fractionalInvestmentSystem.updateMarketPrices(invalidPrices)
        ).not.toThrow();

        // Should maintain previous valid prices
        const metrics = fractionalInvestmentSystem.getPortfolioMetrics();
        expect(metrics.totalValue).toBeGreaterThan(0);
      });
    });

    describe('Transaction handling', () => {
      test('should retry failed transactions', async () => {
        // Mock transaction failure followed by success
        const { openContractCall } = require('@stacks/connect');
        openContractCall
          .mockRejectedValueOnce(new Error('Network error'))
          .mockResolvedValueOnce({ txId: 'SP123ABC456DEF789GHI' });

        const result = await fractionalInvestmentSystem.purchaseFractionalInvestment(
          'ICLN-001',
          100,
          mockBlockchainData
        );

        expect(result.success).toBe(true);
        expect(openContractCall).toHaveBeenCalledTimes(2);
      });

      test('should handle transaction confirmation', async () => {
        const txId = 'SP123ABC456DEF789GHI';

        // Mock confirmed transaction
        fetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            tx_status: 'success',
            block_height: 150234,
            confirmations: 6
          })
        });

        const status = await fractionalInvestmentSystem.getTransactionStatus(txId);

        expect(status.confirmed).toBe(true);
        expect(status.confirmations).toBeGreaterThanOrEqual(6);
        expect(status.blockHeight).toBe(150234);
      });

      test('should handle pending transactions', async () => {
        const txId = 'SP123ABC456DEF789GHI';

        // Mock pending transaction
        fetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            tx_status: 'pending',
            confirmations: 0
          })
        });

        const status = await fractionalInvestmentSystem.getTransactionStatus(txId);

        expect(status.confirmed).toBe(false);
        expect(status.confirmations).toBe(0);
        expect(status.status).toBe('pending');
      });
    });
  });

  describe('Carbon Integration', () => {
    describe('Carbon footprint tracking', () => {
      test('should calculate portfolio carbon impact', async () => {
        const portfolioHoldings = mockPortfolioData.holdings;
        const carbonImpact = await carbonIntegration.calculatePortfolioCarbonImpact(
          portfolioHoldings
        );

        expect(carbonImpact).toHaveProperty('totalEmissions');
        expect(carbonImpact).toHaveProperty('totalOffsets');
        expect(carbonImpact).toHaveProperty('netEmissions');
        expect(carbonImpact).toHaveProperty('carbonIntensity');

        expect(typeof carbonImpact.totalEmissions).toBe('number');
        expect(typeof carbonImpact.totalOffsets).toBe('number');
        expect(carbonImpact.netEmissions).toBe(
          carbonImpact.totalEmissions - carbonImpact.totalOffsets
        );
      });

      test('should track carbon offsets', () => {
        const totalImpact = carbonIntegration.getTotalCarbonImpact();

        expect(totalImpact).toMatchObject({
          totalEmissions: expect.any(Number),
          totalOffsets: expect.any(Number),
          netEmissions: expect.any(Number),
          offsetProjects: expect.any(Array)
        });

        // Validate offset projects
        totalImpact.offsetProjects.forEach(project => {
          expect(project).toHaveProperty('id');
          expect(project).toHaveProperty('name');
          expect(project).toHaveProperty('type');
          expect(project).toHaveProperty('credits');
          expect(project).toHaveProperty('verification');
        });
      });
    });

    describe('Carbon offset purchases', () => {
      test('should purchase carbon offsets with sBTC', async () => {
        const offsetData = {
          projectId: 'amazon-rainforest-001',
          credits: 10, // 10 tonnes CO2
          walletConnection: mockBlockchainData
        };

        const result = await carbonIntegration.purchaseCarbonOffsets(
          offsetData.projectId,
          offsetData.credits,
          offsetData.walletConnection
        );

        expect(result.success).toBe(true);
        expect(result.transactionId).toBeDefined();
        expect(result.creditsAcquired).toBe(offsetData.credits);
        expect(result.totalCost).toBeGreaterThan(0);
      });

      test('should validate offset project availability', async () => {
        const invalidProjectId = 'non-existent-project';

        await expect(
          carbonIntegration.purchaseCarbonOffsets(
            invalidProjectId,
            5,
            mockBlockchainData
          )
        ).rejects.toThrow('Invalid or unavailable offset project');
      });

      test('should calculate offset prices correctly', async () => {
        const projectId = 'amazon-rainforest-001';
        const credits = 5;

        const pricing = await carbonIntegration.calculateOffsetPricing(projectId, credits);

        expect(pricing).toHaveProperty('pricePerCredit');
        expect(pricing).toHaveProperty('totalPrice');
        expect(pricing).toHaveProperty('fees');
        expect(pricing).toHaveProperty('finalPrice');

        expect(pricing.totalPrice).toBe(pricing.pricePerCredit * credits);
        expect(pricing.finalPrice).toBe(pricing.totalPrice + pricing.fees);
      });
    });

    describe('Carbon tracking integration', () => {
      test('should integrate with investment tracking', async () => {
        const userAddress = 'SP1ABC123DEF456GHI789';

        // Make an investment
        await fractionalInvestmentSystem.purchaseFractionalInvestment(
          'ICLN-001',
          500,
          mockBlockchainData
        );

        // Check updated carbon impact
        const updatedImpact = await carbonIntegration.getUserCarbonImpact(userAddress);

        expect(updatedImpact).toHaveProperty('investmentImpact');
        expect(updatedImpact.investmentImpact).toBeGreaterThan(0);
      });

      test('should provide carbon impact recommendations', async () => {
        const currentImpact = carbonIntegration.getTotalCarbonImpact();
        const recommendations = await carbonIntegration.getCarbonRecommendations(
          currentImpact
        );

        expect(Array.isArray(recommendations)).toBe(true);
        expect(recommendations.length).toBeGreaterThan(0);

        recommendations.forEach(rec => {
          expect(rec).toHaveProperty('type');
          expect(rec).toHaveProperty('action');
          expect(rec).toHaveProperty('impact');
          expect(rec).toHaveProperty('cost');
        });
      });
    });
  });

  describe('Blockchain connectivity', () => {
    test('should connect to Stacks network', async () => {
      const networkInfo = await fractionalInvestmentSystem.getNetworkInfo();

      expect(networkInfo).toHaveProperty('network');
      expect(networkInfo).toHaveProperty('blockHeight');
      expect(networkInfo).toHaveProperty('isConnected');

      expect(networkInfo.isConnected).toBe(true);
      expect(['mainnet', 'testnet']).toContain(networkInfo.network);
    });

    test('should handle network errors gracefully', async () => {
      // Mock network failure
      fetch.mockRejectedValueOnce(new Error('Network unavailable'));

      const networkInfo = await fractionalInvestmentSystem.getNetworkInfo();

      expect(networkInfo.isConnected).toBe(false);
      expect(networkInfo.error).toBeDefined();
    });

    test('should validate wallet connections', () => {
      const validWallet = {
        address: 'SP1ABC123DEF456GHI789',
        balance: 1.25,
        network: 'mainnet'
      };

      const invalidWallet = {
        address: 'INVALID',
        balance: -1,
        network: 'unknown'
      };

      expect(fractionalInvestmentSystem.validateWalletConnection(validWallet)).toBe(true);
      expect(fractionalInvestmentSystem.validateWalletConnection(invalidWallet)).toBe(false);
      expect(fractionalInvestmentSystem.validateWalletConnection(null)).toBe(false);
    });
  });

  describe('Error handling and recovery', () => {
    test('should handle Stacks API rate limiting', async () => {
      // Mock rate limit response
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ error: 'Rate limit exceeded' })
      });

      const result = await fractionalInvestmentSystem.getUserPortfolio(
        'SP1ABC123DEF456GHI789'
      );

      // Should implement retry logic or graceful degradation
      expect(result).toBeDefined();
    });

    test('should handle transaction failures', async () => {
      const { openContractCall } = require('@stacks/connect');
      openContractCall.mockRejectedValue(new TransactionError('Transaction failed'));

      await expect(
        fractionalInvestmentSystem.purchaseFractionalInvestment(
          'ICLN-001',
          100,
          mockBlockchainData
        )
      ).rejects.toThrow(TransactionError);
    });

    test('should provide fallback data during outages', async () => {
      // Mock complete API failure
      fetch.mockRejectedValue(new Error('Service unavailable'));

      const metrics = fractionalInvestmentSystem.getPortfolioMetrics();

      // Should return cached or default data
      expect(metrics).toBeDefined();
      expect(typeof metrics.totalValue).toBe('number');
    });

    test('should handle malformed blockchain responses', async () => {
      // Mock malformed response
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve('invalid json structure')
      });

      const portfolio = await fractionalInvestmentSystem.getUserPortfolio(
        'SP1ABC123DEF456GHI789'
      );

      // Should handle gracefully with default structure
      expect(portfolio).toHaveProperty('totalValue');
      expect(portfolio).toHaveProperty('holdings');
    });
  });

  describe('Security and validation', () => {
    test('should validate transaction amounts', () => {
      const validAmount = 100;
      const invalidAmounts = [0, -50, NaN, 'invalid', null, undefined];

      expect(fractionalInvestmentSystem.validateAmount(validAmount)).toBe(true);

      invalidAmounts.forEach(amount => {
        expect(fractionalInvestmentSystem.validateAmount(amount)).toBe(false);
      });
    });

    test('should validate wallet addresses', () => {
      const validAddresses = [
        'SP1ABC123DEF456GHI789',
        'ST1ABC123DEF456GHI789'
      ];

      const invalidAddresses = [
        'invalid',
        '0x123', // Ethereum address
        '',
        null,
        undefined
      ];

      validAddresses.forEach(address => {
        expect(fractionalInvestmentSystem.validateAddress(address)).toBe(true);
      });

      invalidAddresses.forEach(address => {
        expect(fractionalInvestmentSystem.validateAddress(address)).toBe(false);
      });
    });

    test('should sanitize user inputs', () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        'DROP TABLE users;',
        '../../../etc/passwd'
      ];

      maliciousInputs.forEach(input => {
        const sanitized = fractionalInvestmentSystem.sanitizeInput(input);
        expect(sanitized).not.toContain('<script>');
        expect(sanitized).not.toContain('DROP TABLE');
        expect(sanitized).not.toContain('../');
      });
    });

    test('should implement proper access controls', async () => {
      const unauthorizedAddress = 'SP0000000000000000000';

      // Should not allow access to other users' data
      await expect(
        fractionalInvestmentSystem.getUserPortfolio(unauthorizedAddress)
      ).rejects.toThrow('Unauthorized access');
    });
  });
});