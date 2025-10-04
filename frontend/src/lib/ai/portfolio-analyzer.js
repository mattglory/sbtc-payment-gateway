/**
 * Portfolio Sustainability Analyzer
 * Analyzes portfolio holdings for ESG performance and provides sustainability insights
 */

export class PortfolioAnalyzer {
  constructor() {
    this.esgDataCache = new Map();
    this.lastCacheUpdate = null;
    this.CACHE_DURATION = 60 * 60 * 1000; // 1 hour
  }

  /**
   * Analyze portfolio for sustainability metrics
   */
  async analyzePortfolio(holdings, preferences = {}) {
    try {
      const response = await fetch('/api/ai/investment-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo-token' // Replace with actual auth
        },
        body: JSON.stringify({
          currentHoldings: holdings,
          investmentGoals: {
            riskTolerance: preferences.riskTolerance || 'moderate',
            timeHorizon: preferences.timeHorizon || 'medium',
            sustainabilityFocus: preferences.sustainabilityFocus || 'high',
            targetReturn: preferences.targetReturn || 8
          },
          availableCapital: preferences.availableCapital || 10000,
          preferredInvestmentTypes: preferences.preferredTypes || ['stocks', 'etfs'],
          excludeSectors: preferences.excludeSectors || []
        })
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const data = await response.json();
      return this.enhanceAnalysisData(data);

    } catch (error) {
      console.error('Portfolio analysis failed:', error);
      return this.getFallbackAnalysis(holdings);
    }
  }

  /**
   * Enhance analysis data with additional computed metrics
   */
  enhanceAnalysisData(apiData) {
    const analysis = apiData.portfolioAnalysis;
    const recommendations = apiData.recommendations;

    return {
      ...apiData,
      sustainabilityMetrics: {
        esgScore: analysis.currentESGScore,
        grade: analysis.sustainabilityGrade,
        carbonIntensity: analysis.carbonIntensity,
        impactScore: this.calculateImpactScore(analysis),
        diversificationIndex: analysis.diversificationScore / 100,
        alignmentScore: this.calculateAlignmentScore(recommendations)
      },
      riskMetrics: {
        overallRisk: this.mapRiskLevel(analysis.riskLevel),
        concentration: this.calculateConcentrationRisk(apiData.currentHoldings || []),
        esgRisk: this.calculateESGRisk(analysis.currentESGScore),
        volatilityEstimate: apiData.optimizedPortfolio.volatility
      },
      improvementOpportunities: this.identifyImprovements(analysis, recommendations),
      sustainabilityTrends: this.analyzeTrends(recommendations),
      complianceScore: this.calculateComplianceScore(analysis)
    };
  }

  /**
   * Calculate overall impact score combining ESG and carbon metrics
   */
  calculateImpactScore(analysis) {
    const esgWeight = 0.6;
    const carbonWeight = 0.4;

    const esgContribution = (analysis.currentESGScore / 100) * esgWeight;
    const carbonContribution = Math.max(0, (100 - analysis.carbonIntensity) / 100) * carbonWeight;

    return Math.round((esgContribution + carbonContribution) * 100);
  }

  /**
   * Calculate how well recommendations align with sustainability goals
   */
  calculateAlignmentScore(recommendations) {
    if (!recommendations || recommendations.length === 0) return 0;

    const avgESGScore = recommendations.reduce((sum, rec) => sum + rec.esgScore, 0) / recommendations.length;
    const highESGCount = recommendations.filter(rec => rec.esgScore >= 80).length;
    const alignmentRatio = highESGCount / recommendations.length;

    return Math.round((avgESGScore / 100 * 0.7 + alignmentRatio * 0.3) * 100);
  }

  /**
   * Map risk level to numeric scale
   */
  mapRiskLevel(riskLevel) {
    const riskMap = {
      'Very Low': 1,
      'Low': 2,
      'Moderate': 3,
      'High': 4,
      'Very High': 5
    };
    return riskMap[riskLevel] || 3;
  }

  /**
   * Calculate concentration risk based on holdings distribution
   */
  calculateConcentrationRisk(holdings) {
    if (!holdings || holdings.length === 0) return 0;

    const totalValue = holdings.reduce((sum, h) => sum + (h.quantity * h.currentPrice), 0);
    const weights = holdings.map(h => (h.quantity * h.currentPrice) / totalValue);

    // Calculate Herfindahl-Hirschman Index (HHI)
    const hhi = weights.reduce((sum, weight) => sum + (weight * weight), 0);

    // Convert to risk score (0-100)
    return Math.round(hhi * 100);
  }

  /**
   * Calculate ESG-related risks
   */
  calculateESGRisk(esgScore) {
    // Higher ESG score = lower ESG risk
    return Math.round((100 - esgScore) * 0.8); // Scale to 0-80
  }

  /**
   * Identify specific improvement opportunities
   */
  identifyImprovements(analysis, recommendations) {
    const improvements = [];

    if (analysis.currentESGScore < 70) {
      improvements.push({
        type: 'esg',
        priority: 'high',
        title: 'Improve ESG Score',
        description: 'Consider replacing low-ESG holdings with sustainable alternatives',
        impact: 'Could increase ESG score by 15-25 points',
        action: 'Review bottom 20% of ESG-rated holdings'
      });
    }

    if (analysis.carbonIntensity > 50) {
      improvements.push({
        type: 'carbon',
        priority: 'high',
        title: 'Reduce Carbon Footprint',
        description: 'Shift towards low-carbon investments',
        impact: `Could reduce carbon intensity by ${Math.round(analysis.carbonIntensity * 0.3)}%`,
        action: 'Consider clean energy and technology ETFs'
      });
    }

    if (analysis.diversificationScore < 60) {
      improvements.push({
        type: 'diversification',
        priority: 'medium',
        title: 'Improve Diversification',
        description: 'Spread investments across more sectors and geographies',
        impact: 'Reduce concentration risk and improve risk-adjusted returns',
        action: 'Add international ESG ETFs or different sectors'
      });
    }

    // Add specific recommendations from AI
    if (recommendations && recommendations.length > 0) {
      const topRec = recommendations[0];
      improvements.push({
        type: 'opportunity',
        priority: 'medium',
        title: `Consider ${topRec.symbol}`,
        description: topRec.reasoning,
        impact: `Expected return: ${topRec.expectedReturn}%, ESG Score: ${topRec.esgScore}`,
        action: `Allocate ${topRec.recommendedAllocation}% to this investment`
      });
    }

    return improvements;
  }

  /**
   * Analyze sustainability trends in recommendations
   */
  analyzeTrends(recommendations) {
    if (!recommendations || recommendations.length === 0) {
      return {
        dominantSectors: [],
        averageESGScore: 0,
        sustainabilityFocus: 'low',
        emergingThemes: []
      };
    }

    // Count sectors
    const sectorCount = {};
    recommendations.forEach(rec => {
      sectorCount[rec.sector] = (sectorCount[rec.sector] || 0) + 1;
    });

    const dominantSectors = Object.entries(sectorCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([sector]) => sector);

    const averageESGScore = recommendations.reduce((sum, rec) => sum + rec.esgScore, 0) / recommendations.length;

    const sustainabilityFocus = averageESGScore >= 85 ? 'very high' :
                               averageESGScore >= 75 ? 'high' :
                               averageESGScore >= 65 ? 'medium' : 'low';

    // Identify emerging themes
    const emergingThemes = [];
    const cleanEnergyCount = recommendations.filter(r => r.sector.toLowerCase().includes('energy')).length;
    const techCount = recommendations.filter(r => r.sector.toLowerCase().includes('tech')).length;
    const waterCount = recommendations.filter(r => r.sector.toLowerCase().includes('water')).length;

    if (cleanEnergyCount >= 2) emergingThemes.push('Clean Energy Transition');
    if (techCount >= 2) emergingThemes.push('Sustainable Technology');
    if (waterCount >= 1) emergingThemes.push('Water Security');

    return {
      dominantSectors,
      averageESGScore: Math.round(averageESGScore),
      sustainabilityFocus,
      emergingThemes
    };
  }

  /**
   * Calculate compliance score with various ESG standards
   */
  calculateComplianceScore(analysis) {
    const scores = {};

    // EU Taxonomy compliance (simplified)
    scores.euTaxonomy = analysis.currentESGScore >= 70 ? 85 :
                       analysis.currentESGScore >= 50 ? 65 : 35;

    // UN SDG alignment
    scores.unSDG = analysis.currentESGScore >= 75 ? 90 :
                   analysis.currentESGScore >= 60 ? 70 : 45;

    // Paris Climate Agreement alignment
    scores.parisClimate = analysis.carbonIntensity <= 30 ? 95 :
                         analysis.carbonIntensity <= 60 ? 75 : 50;

    // TCFD (Task Force on Climate-related Financial Disclosures)
    scores.tcfd = analysis.currentESGScore >= 80 && analysis.carbonIntensity <= 40 ? 90 : 60;

    const overallCompliance = Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length;

    return {
      overall: Math.round(overallCompliance),
      breakdown: scores,
      grade: overallCompliance >= 90 ? 'Excellent' :
             overallCompliance >= 75 ? 'Good' :
             overallCompliance >= 60 ? 'Fair' : 'Needs Improvement'
    };
  }

  /**
   * Provide fallback analysis when API fails
   */
  getFallbackAnalysis(holdings) {
    return {
      success: false,
      error: 'Unable to complete full analysis',
      portfolioAnalysis: {
        currentESGScore: 50,
        sustainabilityGrade: 'C',
        riskLevel: 'Moderate',
        diversificationScore: 60,
        carbonIntensity: 70,
        strengths: [],
        weaknesses: ['Analysis incomplete']
      },
      recommendations: [],
      sustainabilityMetrics: {
        esgScore: 50,
        grade: 'C',
        carbonIntensity: 70,
        impactScore: 50,
        diversificationIndex: 0.6,
        alignmentScore: 0
      },
      riskMetrics: {
        overallRisk: 3,
        concentration: this.calculateConcentrationRisk(holdings),
        esgRisk: 40,
        volatilityEstimate: 18
      }
    };
  }

  /**
   * Get real-time ESG data for a symbol (mock implementation)
   */
  async getESGData(symbol) {
    // Check cache first
    if (this.esgDataCache.has(symbol) && this.isCacheValid()) {
      return this.esgDataCache.get(symbol);
    }

    try {
      // In production, integrate with real ESG data providers:
      // - MSCI ESG Research
      // - Sustainalytics
      // - Bloomberg ESG Data
      // - Refinitiv ESG Scores

      // Mock data for demo
      const mockData = {
        symbol,
        esgScore: Math.floor(Math.random() * 40) + 50, // 50-90
        environmentalScore: Math.floor(Math.random() * 30) + 60,
        socialScore: Math.floor(Math.random() * 30) + 55,
        governanceScore: Math.floor(Math.random() * 30) + 65,
        carbonIntensity: Math.floor(Math.random() * 100),
        controversies: Math.floor(Math.random() * 3),
        lastUpdated: new Date().toISOString()
      };

      // Cache the data
      this.esgDataCache.set(symbol, mockData);
      return mockData;

    } catch (error) {
      console.warn(`Failed to fetch ESG data for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Check if cache is still valid
   */
  isCacheValid() {
    if (!this.lastCacheUpdate) return false;
    return (Date.now() - this.lastCacheUpdate) < this.CACHE_DURATION;
  }

  /**
   * Clear ESG data cache
   */
  clearCache() {
    this.esgDataCache.clear();
    this.lastCacheUpdate = null;
  }

  /**
   * Get sector allocation analysis
   */
  analyzeSectorAllocation(holdings) {
    if (!holdings || holdings.length === 0) return {};

    const totalValue = holdings.reduce((sum, h) => sum + (h.quantity * h.currentPrice), 0);
    const sectorAllocation = {};

    holdings.forEach(holding => {
      const sector = holding.sector || 'Unknown';
      const value = holding.quantity * holding.currentPrice;
      const percentage = (value / totalValue) * 100;

      if (!sectorAllocation[sector]) {
        sectorAllocation[sector] = {
          value: 0,
          percentage: 0,
          holdings: 0
        };
      }

      sectorAllocation[sector].value += value;
      sectorAllocation[sector].percentage += percentage;
      sectorAllocation[sector].holdings += 1;
    });

    return sectorAllocation;
  }
}

// Export singleton instance
export const portfolioAnalyzer = new PortfolioAnalyzer();