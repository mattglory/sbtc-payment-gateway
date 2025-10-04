/**
 * Fractional Blockchain Investment System
 * Enables fractional ownership of sustainable investments using sBTC
 */

import { PaymentTransaction } from '../../services/wallet';

export interface FractionalInvestment {
  id: string;
  symbol: string;
  name: string;
  type: 'stock' | 'etf' | 'bond' | 'reit' | 'green_bond' | 'carbon_credit';
  totalValue: number; // USD value
  totalShares: number; // Total fractional shares available
  pricePerShare: number; // USD per fractional share
  minimumInvestment: number; // Minimum USD investment
  esgScore: number;
  carbonImpact: number; // kg CO2e per $1000 invested
  expectedReturn: number; // Annual percentage
  riskScore: number; // 1-10 scale
  sector: string;
  provider: string;
  contractAddress: string; // Smart contract address
  isActive: boolean;
  metadata: {
    description: string;
    keyFeatures: string[];
    riskFactors: string[];
    esgRating: string;
    certifications: string[];
    lastPriceUpdate: string;
  };
}

export interface UserInvestmentPosition {
  investmentId: string;
  symbol: string;
  fractionalShares: number;
  totalInvested: number; // sBTC amount invested
  currentValue: number; // Current USD value
  unrealizedGainLoss: number;
  unrealizedGainLossPercent: number;
  dividendsEarned: number; // sBTC received as dividends
  purchaseHistory: InvestmentTransaction[];
  lastUpdated: string;
}

export interface InvestmentTransaction {
  id: string;
  type: 'buy' | 'sell' | 'dividend';
  symbol: string;
  fractionalShares: number;
  amountsBTC: number;
  amountUSD: number;
  pricePerShare: number;
  txHash: string;
  timestamp: string;
  status: 'pending' | 'confirmed' | 'failed';
}

export class FractionalInvestmentSystem {
  private static instance: FractionalInvestmentSystem;
  private availableInvestments: FractionalInvestment[] = [];
  private userPositions: UserInvestmentPosition[] = [];
  private transactionHistory: InvestmentTransaction[] = [];

  public static getInstance(): FractionalInvestmentSystem {
    if (!FractionalInvestmentSystem.instance) {
      FractionalInvestmentSystem.instance = new FractionalInvestmentSystem();
    }
    return FractionalInvestmentSystem.instance;
  }

  constructor() {
    this.initializeMockInvestments();
    this.loadUserData();
  }

  /**
   * Initialize mock fractional investments
   */
  private initializeMockInvestments() {
    this.availableInvestments = [
      {
        id: 'ICLN-FRAC',
        symbol: 'ICLN',
        name: 'iShares Global Clean Energy ETF',
        type: 'etf',
        totalValue: 1000000, // $1M pool
        totalShares: 10000,
        pricePerShare: 100,
        minimumInvestment: 10,
        esgScore: 89,
        carbonImpact: -45,
        expectedReturn: 8.5,
        riskScore: 6,
        sector: 'Clean Energy',
        provider: 'Green Investment Fund',
        contractAddress: 'SP1HTBVD3JG9C05J7HBJTHGR0GGW7KX17XHQMQDF',
        isActive: true,
        metadata: {
          description: 'Tracks global clean energy companies across solar, wind, and renewable technologies',
          keyFeatures: ['Diversified clean energy exposure', 'Low carbon footprint', 'Professional management'],
          riskFactors: ['Sector volatility', 'Regulatory changes', 'Technology risks'],
          esgRating: 'AA',
          certifications: ['MSCI ESG Rated', 'Climate Action 100+'],
          lastPriceUpdate: new Date().toISOString()
        }
      },
      {
        id: 'TSLA-FRAC',
        symbol: 'TSLA',
        name: 'Tesla Inc. Fractional Shares',
        type: 'stock',
        totalValue: 2000000,
        totalShares: 8000,
        pricePerShare: 250,
        minimumInvestment: 25,
        esgScore: 76,
        carbonImpact: -55,
        expectedReturn: 12.5,
        riskScore: 9,
        sector: 'Electric Vehicles',
        provider: 'Sustainable Equity Fund',
        contractAddress: 'SP2D5BGGJ956A635JG7CJQ59FTRFRB0893514EZPJ',
        isActive: true,
        metadata: {
          description: 'Leading electric vehicle and sustainable energy company',
          keyFeatures: ['EV market leader', 'Energy storage solutions', 'Autonomous driving tech'],
          riskFactors: ['High volatility', 'Execution risk', 'Competition'],
          esgRating: 'A-',
          certifications: ['Sustainable Transportation Leader'],
          lastPriceUpdate: new Date().toISOString()
        }
      },
      {
        id: 'GREEN-BONDS-FRAC',
        symbol: 'GRNBND',
        name: 'Green Climate Bonds Portfolio',
        type: 'green_bond',
        totalValue: 5000000,
        totalShares: 50000,
        pricePerShare: 100,
        minimumInvestment: 50,
        esgScore: 92,
        carbonImpact: -30,
        expectedReturn: 4.5,
        riskScore: 3,
        sector: 'Fixed Income',
        provider: 'Climate Finance Initiative',
        contractAddress: 'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9',
        isActive: true,
        metadata: {
          description: 'Diversified portfolio of verified green bonds funding climate projects',
          keyFeatures: ['Climate impact verified', 'Fixed income', 'Low risk profile'],
          riskFactors: ['Interest rate risk', 'Credit risk', 'Liquidity risk'],
          esgRating: 'AAA',
          certifications: ['Climate Bonds Standard', 'Green Bond Principles'],
          lastPriceUpdate: new Date().toISOString()
        }
      },
      {
        id: 'CARBON-CREDITS-FRAC',
        symbol: 'CARBON',
        name: 'Verified Carbon Credits Fund',
        type: 'carbon_credit',
        totalValue: 1500000,
        totalShares: 15000,
        pricePerShare: 100,
        minimumInvestment: 100,
        esgScore: 95,
        carbonImpact: -100,
        expectedReturn: 15.0,
        riskScore: 8,
        sector: 'Carbon Markets',
        provider: 'Carbon Finance Collective',
        contractAddress: 'SP1PA2PZ3BG2Q4RBN3CPSQ8FPCH8H3YA6ZTFZXYT4',
        isActive: true,
        metadata: {
          description: 'Portfolio of high-quality verified carbon offset credits',
          keyFeatures: ['Direct climate impact', 'High return potential', 'Market growth exposure'],
          riskFactors: ['Price volatility', 'Regulatory risk', 'Verification standards'],
          esgRating: 'AAA',
          certifications: ['VCS Verified', 'Gold Standard', 'CAR Protocol'],
          lastPriceUpdate: new Date().toISOString()
        }
      },
      {
        id: 'WATER-TECH-FRAC',
        symbol: 'H2OTECH',
        name: 'Water Technology Innovation Fund',
        type: 'etf',
        totalValue: 800000,
        totalShares: 4000,
        pricePerShare: 200,
        minimumInvestment: 20,
        esgScore: 85,
        carbonImpact: -25,
        expectedReturn: 9.2,
        riskScore: 7,
        sector: 'Water Technology',
        provider: 'Blue Economy Fund',
        contractAddress: 'SP3N4AJFZZYC4BHR0XKG8A05HL3T7XH2N1B4AXRDP',
        isActive: true,
        metadata: {
          description: 'Investments in companies solving global water challenges',
          keyFeatures: ['Water scarcity solutions', 'Filtration technology', 'Infrastructure development'],
          riskFactors: ['Technology adoption', 'Regulatory requirements', 'Competition'],
          esgRating: 'A+',
          certifications: ['UN SDG 6 Aligned', 'Water Stewardship Certified'],
          lastPriceUpdate: new Date().toISOString()
        }
      }
    ];
  }

  /**
   * Get all available fractional investments
   */
  getAvailableInvestments(filters?: {
    minESGScore?: number;
    maxRisk?: number;
    sectors?: string[];
    types?: string[];
    minReturn?: number;
  }): FractionalInvestment[] {
    let investments = this.availableInvestments.filter(inv => inv.isActive);

    if (filters) {
      if (filters.minESGScore) {
        investments = investments.filter(inv => inv.esgScore >= filters.minESGScore!);
      }
      if (filters.maxRisk) {
        investments = investments.filter(inv => inv.riskScore <= filters.maxRisk!);
      }
      if (filters.sectors && filters.sectors.length > 0) {
        investments = investments.filter(inv => filters.sectors!.includes(inv.sector));
      }
      if (filters.types && filters.types.length > 0) {
        investments = investments.filter(inv => filters.types!.includes(inv.type));
      }
      if (filters.minReturn) {
        investments = investments.filter(inv => inv.expectedReturn >= filters.minReturn!);
      }
    }

    return investments;
  }

  /**
   * Get investment details by ID
   */
  getInvestmentDetails(investmentId: string): FractionalInvestment | null {
    return this.availableInvestments.find(inv => inv.id === investmentId) || null;
  }

  /**
   * Purchase fractional investment with sBTC
   */
  async purchaseFractionalInvestment(
    investmentId: string,
    usdAmount: number,
    walletConnection: any
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      const investment = this.getInvestmentDetails(investmentId);
      if (!investment) {
        return { success: false, error: 'Investment not found' };
      }

      if (!investment.isActive) {
        return { success: false, error: 'Investment is no longer available' };
      }

      if (usdAmount < investment.minimumInvestment) {
        return { success: false, error: `Minimum investment is $${investment.minimumInvestment}` };
      }

      // Calculate fractional shares
      const fractionalShares = usdAmount / investment.pricePerShare;

      // Check availability
      const availableShares = investment.totalShares - this.getTotalSharesSold(investmentId);
      if (fractionalShares > availableShares) {
        return { success: false, error: 'Not enough shares available' };
      }

      // Convert USD to sBTC amount (mock conversion rate)
      const sbtcPrice = 65000; // $65k per sBTC (mock)
      const sbtcAmount = usdAmount / sbtcPrice;

      if (walletConnection.balance < sbtcAmount) {
        return { success: false, error: 'Insufficient sBTC balance' };
      }

      // Create payment transaction
      const paymentData: PaymentTransaction = {
        paymentId: `frac-invest-${Date.now()}`,
        amount: sbtcAmount,
        merchantAddress: investment.contractAddress,
        description: `Fractional investment in ${investment.symbol} - ${fractionalShares.toFixed(4)} shares`
      };

      // Process payment (mock implementation)
      const paymentResult = await this.processInvestmentPayment(paymentData, walletConnection);

      if (paymentResult.success && paymentResult.txId) {
        // Record transaction
        const transaction: InvestmentTransaction = {
          id: paymentData.paymentId,
          type: 'buy',
          symbol: investment.symbol,
          fractionalShares,
          amountsBTC: sbtcAmount,
          amountUSD: usdAmount,
          pricePerShare: investment.pricePerShare,
          txHash: paymentResult.txId,
          timestamp: new Date().toISOString(),
          status: 'confirmed'
        };

        this.transactionHistory.push(transaction);

        // Update user position
        this.updateUserPosition(investmentId, transaction);

        this.saveUserData();

        return {
          success: true,
          transactionId: transaction.id
        };
      } else {
        return {
          success: false,
          error: paymentResult.error || 'Payment processing failed'
        };
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Investment purchase failed'
      };
    }
  }

  /**
   * Sell fractional investment shares
   */
  async sellFractionalInvestment(
    investmentId: string,
    sharesToSell: number,
    walletConnection: any
  ): Promise<{ success: boolean; transactionId?: string; proceeds?: number; error?: string }> {
    try {
      const investment = this.getInvestmentDetails(investmentId);
      const position = this.getUserPosition(investmentId);

      if (!investment || !position) {
        return { success: false, error: 'Investment or position not found' };
      }

      if (sharesToSell > position.fractionalShares) {
        return { success: false, error: 'Not enough shares to sell' };
      }

      // Calculate proceeds
      const saleValue = sharesToSell * investment.pricePerShare;
      const sbtcPrice = 65000; // Mock conversion rate
      const sbtcProceeds = saleValue / sbtcPrice;

      // Create sell transaction
      const transaction: InvestmentTransaction = {
        id: `sell-${Date.now()}`,
        type: 'sell',
        symbol: investment.symbol,
        fractionalShares: -sharesToSell, // Negative for sale
        amountsBTC: sbtcProceeds,
        amountUSD: saleValue,
        pricePerShare: investment.pricePerShare,
        txHash: `sell-tx-${Date.now()}`, // Mock transaction hash
        timestamp: new Date().toISOString(),
        status: 'confirmed'
      };

      this.transactionHistory.push(transaction);

      // Update position
      this.updateUserPosition(investmentId, transaction);

      this.saveUserData();

      return {
        success: true,
        transactionId: transaction.id,
        proceeds: sbtcProceeds
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sale failed'
      };
    }
  }

  /**
   * Get user's investment positions
   */
  getUserPositions(): UserInvestmentPosition[] {
    return this.userPositions;
  }

  /**
   * Get specific user position
   */
  getUserPosition(investmentId: string): UserInvestmentPosition | null {
    return this.userPositions.find(pos => pos.investmentId === investmentId) || null;
  }

  /**
   * Get transaction history
   */
  getTransactionHistory(symbol?: string): InvestmentTransaction[] {
    if (symbol) {
      return this.transactionHistory.filter(tx => tx.symbol === symbol);
    }
    return this.transactionHistory;
  }

  /**
   * Calculate portfolio metrics
   */
  getPortfolioMetrics(): {
    totalInvested: number;
    currentValue: number;
    totalReturn: number;
    totalReturnPercent: number;
    dividendsEarned: number;
    esgScore: number;
    carbonImpact: number;
    positionCount: number;
  } {
    const positions = this.userPositions;

    const totalInvested = positions.reduce((sum, pos) => sum + pos.totalInvested, 0);
    const currentValue = positions.reduce((sum, pos) => sum + pos.currentValue, 0);
    const dividendsEarned = positions.reduce((sum, pos) => sum + pos.dividendsEarned, 0);

    const totalReturn = currentValue - totalInvested + dividendsEarned;
    const totalReturnPercent = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

    // Weighted ESG score
    const esgScore = currentValue > 0 ? positions.reduce((sum, pos) => {
      const investment = this.getInvestmentDetails(pos.investmentId);
      const weight = pos.currentValue / currentValue;
      return sum + (investment?.esgScore || 0) * weight;
    }, 0) : 0;

    // Weighted carbon impact
    const carbonImpact = currentValue > 0 ? positions.reduce((sum, pos) => {
      const investment = this.getInvestmentDetails(pos.investmentId);
      const weight = pos.currentValue / currentValue;
      return sum + (investment?.carbonImpact || 0) * weight;
    }, 0) : 0;

    return {
      totalInvested: Math.round(totalInvested * 10000) / 10000,
      currentValue: Math.round(currentValue * 100) / 100,
      totalReturn: Math.round(totalReturn * 10000) / 10000,
      totalReturnPercent: Math.round(totalReturnPercent * 100) / 100,
      dividendsEarned: Math.round(dividendsEarned * 10000) / 10000,
      esgScore: Math.round(esgScore),
      carbonImpact: Math.round(carbonImpact),
      positionCount: positions.length
    };
  }

  /**
   * Get investment recommendations based on user portfolio
   */
  getPersonalizedRecommendations(): {
    diversification: FractionalInvestment[];
    esgUpgrade: FractionalInvestment[];
    riskReduction: FractionalInvestment[];
  } {
    const positions = this.userPositions;
    const currentSectors = new Set(positions.map(pos => {
      const investment = this.getInvestmentDetails(pos.investmentId);
      return investment?.sector || '';
    }));

    const available = this.getAvailableInvestments();

    const diversification = available
      .filter(inv => !currentSectors.has(inv.sector))
      .sort((a, b) => b.esgScore - a.esgScore)
      .slice(0, 3);

    const currentAvgESG = this.getPortfolioMetrics().esgScore;
    const esgUpgrade = available
      .filter(inv => inv.esgScore > currentAvgESG)
      .sort((a, b) => b.esgScore - a.esgScore)
      .slice(0, 3);

    const riskReduction = available
      .filter(inv => inv.riskScore <= 5)
      .sort((a, b) => a.riskScore - b.riskScore)
      .slice(0, 3);

    return {
      diversification,
      esgUpgrade,
      riskReduction
    };
  }

  /**
   * Mock dividend distribution
   */
  async distributeDividends(): Promise<void> {
    const positions = this.userPositions;

    for (const position of positions) {
      const investment = this.getInvestmentDetails(position.investmentId);
      if (!investment) continue;

      // Mock dividend calculation (quarterly, 2% annual yield)
      const quarterlyYield = 0.005; // 0.5% quarterly
      const dividendAmount = position.currentValue * quarterlyYield;
      const sbtcPrice = 65000;
      const dividendsBTC = dividendAmount / sbtcPrice;

      if (dividendsBTC > 0.0001) { // Only process if meaningful amount
        const dividendTx: InvestmentTransaction = {
          id: `div-${position.investmentId}-${Date.now()}`,
          type: 'dividend',
          symbol: investment.symbol,
          fractionalShares: 0,
          amountsBTC: dividendsBTC,
          amountUSD: dividendAmount,
          pricePerShare: investment.pricePerShare,
          txHash: `div-tx-${Date.now()}`,
          timestamp: new Date().toISOString(),
          status: 'confirmed'
        };

        this.transactionHistory.push(dividendTx);
        position.dividendsEarned += dividendsBTC;
      }
    }

    this.saveUserData();
  }

  // Private helper methods

  private async processInvestmentPayment(
    paymentData: PaymentTransaction,
    walletConnection: any
  ): Promise<{ success: boolean; txId?: string; error?: string }> {
    // Mock payment processing - in production, integrate with actual blockchain
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          txId: `invest-tx-${Date.now()}`
        });
      }, 2000);
    });
  }

  private getTotalSharesSold(investmentId: string): number {
    return this.transactionHistory
      .filter(tx => tx.symbol === this.getInvestmentDetails(investmentId)?.symbol && tx.type === 'buy')
      .reduce((sum, tx) => sum + tx.fractionalShares, 0);
  }

  private updateUserPosition(investmentId: string, transaction: InvestmentTransaction): void {
    const existingPosition = this.userPositions.find(pos => pos.investmentId === investmentId);
    const investment = this.getInvestmentDetails(investmentId);

    if (!investment) return;

    if (existingPosition) {
      // Update existing position
      existingPosition.fractionalShares += transaction.fractionalShares;

      if (transaction.type === 'buy') {
        existingPosition.totalInvested += transaction.amountsBTC;
      }

      existingPosition.purchaseHistory.push(transaction);
      existingPosition.currentValue = existingPosition.fractionalShares * investment.pricePerShare;
      existingPosition.unrealizedGainLoss = existingPosition.currentValue - (existingPosition.totalInvested * 65000);
      existingPosition.unrealizedGainLossPercent = existingPosition.totalInvested > 0
        ? (existingPosition.unrealizedGainLoss / (existingPosition.totalInvested * 65000)) * 100
        : 0;
      existingPosition.lastUpdated = new Date().toISOString();

      // Remove position if shares are zero
      if (existingPosition.fractionalShares <= 0) {
        const index = this.userPositions.indexOf(existingPosition);
        this.userPositions.splice(index, 1);
      }
    } else if (transaction.type === 'buy') {
      // Create new position
      const newPosition: UserInvestmentPosition = {
        investmentId,
        symbol: investment.symbol,
        fractionalShares: transaction.fractionalShares,
        totalInvested: transaction.amountsBTC,
        currentValue: transaction.fractionalShares * investment.pricePerShare,
        unrealizedGainLoss: 0,
        unrealizedGainLossPercent: 0,
        dividendsEarned: 0,
        purchaseHistory: [transaction],
        lastUpdated: new Date().toISOString()
      };

      this.userPositions.push(newPosition);
    }
  }

  private loadUserData(): void {
    try {
      const stored = localStorage.getItem('fractional-investments-data');
      if (stored) {
        const data = JSON.parse(stored);
        this.userPositions = data.positions || [];
        this.transactionHistory = data.transactions || [];
      }
    } catch (error) {
      console.warn('Failed to load user investment data:', error);
    }
  }

  private saveUserData(): void {
    try {
      const data = {
        positions: this.userPositions,
        transactions: this.transactionHistory,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem('fractional-investments-data', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save user investment data:', error);
    }
  }
}

// Export singleton instance
export const fractionalInvestmentSystem = FractionalInvestmentSystem.getInstance();