/**
 * Carbon Footprint Integration with sBTC Payment Gateway
 * Connects payment transactions to carbon analysis and green finance features
 */

import { PaymentTransaction } from '../../services/wallet';

export interface CarbonPaymentData {
  paymentId: string;
  amount: number;
  merchant: string;
  category: string;
  description?: string;
  date: string;
  txId?: string;
  carbonEmissions?: number;
  isGreenPurchase?: boolean;
}

export interface CarbonOffsetPurchase {
  offsetType: 'forest' | 'renewable' | 'carbon_capture';
  amount: number; // tonnes CO2e
  cost: number; // USD
  provider: string;
  certification: string;
  paymentId: string;
  txId?: string;
}

export interface GreenInvestment {
  investmentType: 'green_bonds' | 'renewable_energy' | 'carbon_credits' | 'esg_portfolio';
  amount: number; // sBTC amount
  expectedReturn: number; // annual %
  carbonImpact: number; // kg CO2e saved annually
  provider: string;
  paymentId: string;
  txId?: string;
}

export class CarbonIntegration {
  private static instance: CarbonIntegration;
  private carbonHistory: CarbonPaymentData[] = [];
  private offsetPurchases: CarbonOffsetPurchase[] = [];
  private greenInvestments: GreenInvestment[] = [];

  public static getInstance(): CarbonIntegration {
    if (!CarbonIntegration.instance) {
      CarbonIntegration.instance = new CarbonIntegration();
    }
    return CarbonIntegration.instance;
  }

  /**
   * Track carbon emissions for a payment transaction
   */
  async trackPaymentCarbon(paymentData: PaymentTransaction, category?: string): Promise<CarbonPaymentData> {
    const carbonData: CarbonPaymentData = {
      paymentId: paymentData.paymentId,
      amount: paymentData.amount,
      merchant: this.extractMerchantFromDescription(paymentData.description || ''),
      category: category || this.categorizeTransaction(paymentData.description || ''),
      description: paymentData.description,
      date: new Date().toISOString(),
    };

    // Calculate carbon emissions
    try {
      const emissions = await this.calculateTransactionEmissions(carbonData);
      carbonData.carbonEmissions = emissions;
      carbonData.isGreenPurchase = this.isGreenTransaction(carbonData.category);
    } catch (error) {
      console.warn('Failed to calculate carbon emissions:', error);
    }

    // Store in history
    this.carbonHistory.push(carbonData);
    this.persistCarbonData();

    return carbonData;
  }

  /**
   * Purchase carbon offsets using sBTC
   */
  async purchaseOffset(
    offsetData: Omit<CarbonOffsetPurchase, 'paymentId' | 'txId'>,
    walletConnection: any
  ): Promise<{ success: boolean; txId?: string; error?: string }> {
    try {
      // Create payment transaction for offset purchase
      const paymentData: PaymentTransaction = {
        paymentId: `offset-${Date.now()}`,
        amount: offsetData.cost,
        merchantAddress: this.getOffsetProviderAddress(offsetData.provider),
        description: `Carbon offset purchase: ${offsetData.amount} tonnes CO2e - ${offsetData.offsetType}`
      };

      // Process payment through sBTC gateway
      // Note: This would integrate with your existing payment processing
      const paymentResult = await this.processOffsetPayment(paymentData, walletConnection);

      if (paymentResult.success && paymentResult.txId) {
        // Record offset purchase
        const offsetPurchase: CarbonOffsetPurchase = {
          ...offsetData,
          paymentId: paymentData.paymentId,
          txId: paymentResult.txId
        };

        this.offsetPurchases.push(offsetPurchase);
        this.persistCarbonData();

        return { success: true, txId: paymentResult.txId };
      } else {
        return { success: false, error: paymentResult.error };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to purchase offset'
      };
    }
  }

  /**
   * Invest in green financial products using sBTC
   */
  async makeGreenInvestment(
    investmentData: Omit<GreenInvestment, 'paymentId' | 'txId'>,
    walletConnection: any
  ): Promise<{ success: boolean; txId?: string; error?: string }> {
    try {
      const paymentData: PaymentTransaction = {
        paymentId: `green-invest-${Date.now()}`,
        amount: investmentData.amount,
        merchantAddress: this.getInvestmentProviderAddress(investmentData.provider),
        description: `Green investment: ${investmentData.investmentType} - ${investmentData.amount} sBTC`
      };

      const paymentResult = await this.processGreenInvestment(paymentData, walletConnection);

      if (paymentResult.success && paymentResult.txId) {
        const greenInvestment: GreenInvestment = {
          ...investmentData,
          paymentId: paymentData.paymentId,
          txId: paymentResult.txId
        };

        this.greenInvestments.push(greenInvestment);
        this.persistCarbonData();

        return { success: true, txId: paymentResult.txId };
      } else {
        return { success: false, error: paymentResult.error };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to make green investment'
      };
    }
  }

  /**
   * Get carbon history for a user
   */
  getCarbonHistory(timeframe?: 'week' | 'month' | 'quarter' | 'year'): CarbonPaymentData[] {
    if (!timeframe) return this.carbonHistory;

    const now = new Date();
    const cutoffDate = new Date();

    switch (timeframe) {
      case 'week':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return this.carbonHistory.filter(entry =>
      new Date(entry.date) >= cutoffDate
    );
  }

  /**
   * Get offset purchase history
   */
  getOffsetHistory(): CarbonOffsetPurchase[] {
    return this.offsetPurchases;
  }

  /**
   * Get green investment history
   */
  getGreenInvestmentHistory(): GreenInvestment[] {
    return this.greenInvestments;
  }

  /**
   * Calculate total carbon impact
   */
  getTotalCarbonImpact(): {
    totalEmissions: number;
    totalOffsets: number;
    netEmissions: number;
    totalInvestmentImpact: number;
  } {
    const totalEmissions = this.carbonHistory.reduce(
      (sum, entry) => sum + (entry.carbonEmissions || 0), 0
    );

    const totalOffsets = this.offsetPurchases.reduce(
      (sum, purchase) => sum + purchase.amount, 0
    );

    const totalInvestmentImpact = this.greenInvestments.reduce(
      (sum, investment) => sum + investment.carbonImpact, 0
    );

    return {
      totalEmissions,
      totalOffsets: totalOffsets * 1000, // Convert tonnes to kg
      netEmissions: totalEmissions - (totalOffsets * 1000),
      totalInvestmentImpact
    };
  }

  /**
   * Get green investment rewards (mock calculation)
   */
  getGreenRewards(): {
    totalInvested: number;
    currentValue: number;
    totalReturns: number;
    carbonSaved: number;
  } {
    const totalInvested = this.greenInvestments.reduce(
      (sum, investment) => sum + investment.amount, 0
    );

    // Mock calculation - in production, this would fetch real market data
    const currentValue = totalInvested * 1.08; // 8% growth assumption
    const totalReturns = currentValue - totalInvested;
    const carbonSaved = this.greenInvestments.reduce(
      (sum, investment) => sum + investment.carbonImpact, 0
    );

    return {
      totalInvested,
      currentValue,
      totalReturns,
      carbonSaved
    };
  }

  // Private helper methods

  private extractMerchantFromDescription(description: string): string {
    // Extract merchant name from payment description
    const parts = description.split('-');
    return parts[0]?.trim() || 'Unknown Merchant';
  }

  private categorizeTransaction(description: string): string {
    const desc = description.toLowerCase();

    if (desc.includes('gas') || desc.includes('fuel') || desc.includes('shell') || desc.includes('chevron')) {
      return 'gas_station';
    } else if (desc.includes('airline') || desc.includes('flight') || desc.includes('airport')) {
      return 'airline';
    } else if (desc.includes('grocery') || desc.includes('supermarket') || desc.includes('whole foods')) {
      return 'grocery';
    } else if (desc.includes('uber') || desc.includes('lyft') || desc.includes('taxi')) {
      return 'transportation';
    } else if (desc.includes('hotel') || desc.includes('airbnb')) {
      return 'hotel';
    } else if (desc.includes('electric') || desc.includes('utility') || desc.includes('power')) {
      return 'utilities';
    } else if (desc.includes('restaurant') || desc.includes('food')) {
      return 'restaurant';
    }

    return 'retail';
  }

  private async calculateTransactionEmissions(carbonData: CarbonPaymentData): Promise<number> {
    // Emission factors (kg CO2e per USD spent)
    const emissionFactors: { [key: string]: number } = {
      gas_station: 2.3,
      airline: 0.5,
      grocery: 0.6,
      transportation: 1.5,
      hotel: 1.2,
      utilities: 2.0,
      restaurant: 0.8,
      retail: 0.4,
      entertainment: 0.3,
    };

    const factor = emissionFactors[carbonData.category] || 0.4;
    return carbonData.amount * factor;
  }

  private isGreenTransaction(category: string): boolean {
    const greenCategories = ['renewable_energy', 'electric_vehicle', 'organic_food', 'green_building'];
    return greenCategories.includes(category);
  }

  private getOffsetProviderAddress(provider: string): string {
    // Mock addresses - in production, these would be real verified provider addresses
    const providerAddresses: { [key: string]: string } = {
      'Verified Carbon Standard': 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
      'Gold Standard': 'SP2D5BGGJ956A635JG7CJQ59FTRFRB0893514EZPJ',
      'Climeworks': 'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9'
    };
    return providerAddresses[provider] || 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE';
  }

  private getInvestmentProviderAddress(provider: string): string {
    // Mock addresses for green investment providers
    const providerAddresses: { [key: string]: string } = {
      'Green Climate Fund': 'SP1PA2PZ3BG2Q4RBN3CPSQ8FPCH8H3YA6ZTFZXYT4',
      'ESG Investment Trust': 'SP2KAF9RF86PVX3NEE27DFV1CQX0T4WGR41X3S45C',
      'Renewable Energy Fund': 'SP3N4AJFZZYC4BHR0XKG8A05HL3T7XH2N1B4AXRDP'
    };
    return providerAddresses[provider] || 'SP1PA2PZ3BG2Q4RBN3CPSQ8FPCH8H3YA6ZTFZXYT4';
  }

  private async processOffsetPayment(
    paymentData: PaymentTransaction,
    walletConnection: any
  ): Promise<{ success: boolean; txId?: string; error?: string }> {
    // This would integrate with your existing payment processing logic
    // For now, return mock success
    return {
      success: true,
      txId: `offset-tx-${Date.now()}`
    };
  }

  private async processGreenInvestment(
    paymentData: PaymentTransaction,
    walletConnection: any
  ): Promise<{ success: boolean; txId?: string; error?: string }> {
    // This would integrate with your existing payment processing logic
    // For now, return mock success
    return {
      success: true,
      txId: `green-invest-tx-${Date.now()}`
    };
  }

  private persistCarbonData(): void {
    // Save to localStorage for now - in production, sync with backend
    const data = {
      carbonHistory: this.carbonHistory,
      offsetPurchases: this.offsetPurchases,
      greenInvestments: this.greenInvestments,
      lastUpdated: new Date().toISOString()
    };

    localStorage.setItem('carbon-integration-data', JSON.stringify(data));
  }

  public loadPersistedData(): void {
    try {
      const stored = localStorage.getItem('carbon-integration-data');
      if (stored) {
        const data = JSON.parse(stored);
        this.carbonHistory = data.carbonHistory || [];
        this.offsetPurchases = data.offsetPurchases || [];
        this.greenInvestments = data.greenInvestments || [];
      }
    } catch (error) {
      console.warn('Failed to load persisted carbon data:', error);
    }
  }
}

// Export singleton instance
export const carbonIntegration = CarbonIntegration.getInstance();