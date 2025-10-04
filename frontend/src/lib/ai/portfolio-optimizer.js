/**
 * Portfolio Optimization and Risk Assessment Engine
 * Advanced algorithms for ESG-focused portfolio optimization
 */

export class PortfolioOptimizer {
  constructor() {
    this.riskFreeRate = 0.03; // 3% risk-free rate
    this.optimizationMethods = ['sharpe', 'esg_weighted', 'min_variance', 'max_diversification'];
    this.constraints = {
      maxSingleAssetWeight: 0.20, // Max 20% in single asset
      minESGScore: 50, // Minimum ESG score
      maxCarbonIntensity: 100, // Max carbon intensity
      sectorLimits: {
        'Technology': 0.30,
        'Energy': 0.15,
        'Financials': 0.25
      }
    };
  }

  /**
   * Optimize portfolio using multiple objectives
   */
  async optimizePortfolio(assets, preferences = {}, constraints = {}) {
    try {
      // Merge constraints
      const finalConstraints = { ...this.constraints, ...constraints };

      // Calculate asset statistics
      const assetStats = await this.calculateAssetStatistics(assets);

      // Generate correlation matrix
      const correlationMatrix = this.generateCorrelationMatrix(assets);

      // Run optimization based on preferences
      const optimizationMethod = preferences.optimizationMethod || 'esg_weighted';
      let optimizedWeights;

      switch (optimizationMethod) {
        case 'sharpe':
          optimizedWeights = this.optimizeForSharpeRatio(assetStats, correlationMatrix, finalConstraints);
          break;
        case 'esg_weighted':
          optimizedWeights = this.optimizeForESGWeighted(assetStats, correlationMatrix, finalConstraints);
          break;
        case 'min_variance':
          optimizedWeights = this.optimizeForMinVariance(assetStats, correlationMatrix, finalConstraints);
          break;
        case 'max_diversification':
          optimizedWeights = this.optimizeForMaxDiversification(assetStats, correlationMatrix, finalConstraints);
          break;
        default:
          optimizedWeights = this.optimizeForESGWeighted(assetStats, correlationMatrix, finalConstraints);
      }

      // Calculate portfolio metrics
      const portfolioMetrics = this.calculatePortfolioMetrics(optimizedWeights, assetStats, correlationMatrix);

      // Generate efficiency frontier
      const efficiencyFrontier = this.generateEfficiencyFrontier(assetStats, correlationMatrix, finalConstraints);

      // Risk assessment
      const riskAssessment = this.assessPortfolioRisk(optimizedWeights, assetStats, correlationMatrix);

      return {
        success: true,
        optimizedWeights,
        portfolioMetrics,
        efficiencyFrontier,
        riskAssessment,
        assetStats,
        constraints: finalConstraints,
        method: optimizationMethod,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Portfolio optimization failed:', error);
      return {
        success: false,
        error: error.message,
        fallbackRecommendation: this.getFallbackOptimization(assets)
      };
    }
  }

  /**
   * Calculate comprehensive asset statistics
   */
  async calculateAssetStatistics(assets) {
    return assets.map(asset => {
      // Mock historical data - in production, fetch real market data
      const mockReturns = this.generateMockReturns(asset);

      const returns = mockReturns;
      const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
      const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / (returns.length - 1);
      const volatility = Math.sqrt(variance);

      return {
        symbol: asset.symbol,
        name: asset.name,
        expectedReturn: avgReturn * 252, // Annualized
        volatility: volatility * Math.sqrt(252), // Annualized
        esgScore: asset.esgScore || 50,
        carbonIntensity: asset.carbonIntensity || 50,
        sector: asset.sector || 'Unknown',
        marketCap: asset.marketCap || 1000000000, // $1B default
        beta: asset.beta || 1.0,
        sharpeRatio: avgReturn / (volatility || 0.01),
        drawdown: this.calculateMaxDrawdown(returns),
        liquidity: asset.liquidity || 'high',
        returns: returns
      };
    });
  }

  /**
   * Generate mock returns for demonstration
   */
  generateMockReturns(asset, days = 252) {
    const returns = [];
    const baseReturn = (asset.expectedReturn || 0.08) / 252; // Daily return
    const baseVolatility = (asset.volatility || 0.20) / Math.sqrt(252); // Daily volatility

    for (let i = 0; i < days; i++) {
      // Generate returns with mean reversion
      const randomShock = (Math.random() - 0.5) * 2; // -1 to 1
      const dailyReturn = baseReturn + (baseVolatility * randomShock);
      returns.push(dailyReturn);
    }

    return returns;
  }

  /**
   * Generate correlation matrix
   */
  generateCorrelationMatrix(assets) {
    const n = assets.length;
    const matrix = Array(n).fill().map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          matrix[i][j] = 1.0;
        } else {
          // Mock correlation based on sector similarity
          const asset1 = assets[i];
          const asset2 = assets[j];

          let baseCorrelation = 0.3; // Base market correlation

          // Higher correlation for same sector
          if (asset1.sector === asset2.sector) {
            baseCorrelation += 0.4;
          }

          // Add some randomness
          baseCorrelation += (Math.random() - 0.5) * 0.2;
          baseCorrelation = Math.max(0.1, Math.min(0.9, baseCorrelation));

          matrix[i][j] = baseCorrelation;
        }
      }
    }

    return matrix;
  }

  /**
   * Optimize for ESG-weighted Sharpe ratio
   */
  optimizeForESGWeighted(assetStats, correlationMatrix, constraints) {
    const n = assetStats.length;
    let weights = new Array(n).fill(1 / n); // Equal weight starting point

    // ESG-weighted optimization using iterative approach
    for (let iteration = 0; iteration < 100; iteration++) {
      const newWeights = [...weights];

      for (let i = 0; i < n; i++) {
        const asset = assetStats[i];

        // Calculate ESG-adjusted Sharpe ratio
        const esgMultiplier = (asset.esgScore / 100) * 1.5; // ESG boost
        const carbonPenalty = Math.max(0, (asset.carbonIntensity - 50) / 100) * 0.3; // Carbon penalty
        const adjustedSharpe = asset.sharpeRatio * esgMultiplier - carbonPenalty;

        // Weight based on adjusted Sharpe ratio
        newWeights[i] = Math.max(0, adjustedSharpe);
      }

      // Normalize weights
      const totalWeight = newWeights.reduce((sum, w) => sum + w, 0);
      if (totalWeight > 0) {
        for (let i = 0; i < n; i++) {
          newWeights[i] = newWeights[i] / totalWeight;
        }
      }

      // Apply constraints
      this.applyConstraints(newWeights, assetStats, constraints);

      // Check convergence
      const change = weights.reduce((sum, w, i) => sum + Math.abs(w - newWeights[i]), 0);
      weights = newWeights;

      if (change < 0.001) break; // Converged
    }

    return weights;
  }

  /**
   * Optimize for maximum Sharpe ratio
   */
  optimizeForSharpeRatio(assetStats, correlationMatrix, constraints) {
    const n = assetStats.length;
    let weights = new Array(n).fill(1 / n);

    // Simplified mean-variance optimization
    for (let iteration = 0; iteration < 50; iteration++) {
      const newWeights = [...weights];

      for (let i = 0; i < n; i++) {
        // Weight by risk-adjusted return
        const excessReturn = assetStats[i].expectedReturn - this.riskFreeRate;
        newWeights[i] = Math.max(0, excessReturn / (assetStats[i].volatility || 0.01));
      }

      // Normalize
      const totalWeight = newWeights.reduce((sum, w) => sum + w, 0);
      if (totalWeight > 0) {
        for (let i = 0; i < n; i++) {
          newWeights[i] = newWeights[i] / totalWeight;
        }
      }

      this.applyConstraints(newWeights, assetStats, constraints);
      weights = newWeights;
    }

    return weights;
  }

  /**
   * Optimize for minimum variance
   */
  optimizeForMinVariance(assetStats, correlationMatrix, constraints) {
    const n = assetStats.length;
    let weights = new Array(n).fill(1 / n);

    // Inverse volatility weighting as approximation
    for (let i = 0; i < n; i++) {
      weights[i] = 1 / (assetStats[i].volatility || 0.01);
    }

    // Normalize
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    for (let i = 0; i < n; i++) {
      weights[i] = weights[i] / totalWeight;
    }

    this.applyConstraints(weights, assetStats, constraints);
    return weights;
  }

  /**
   * Optimize for maximum diversification
   */
  optimizeForMaxDiversification(assetStats, correlationMatrix, constraints) {
    const n = assetStats.length;
    const weights = new Array(n).fill(1 / n);

    // Equal weight with sector constraints for maximum diversification
    const sectorWeights = {};

    assetStats.forEach((asset, i) => {
      if (!sectorWeights[asset.sector]) {
        sectorWeights[asset.sector] = [];
      }
      sectorWeights[asset.sector].push(i);
    });

    // Distribute weights equally within sector limits
    Object.keys(sectorWeights).forEach(sector => {
      const indices = sectorWeights[sector];
      const sectorLimit = constraints.sectorLimits[sector] || 0.20;
      const weightPerAsset = sectorLimit / indices.length;

      indices.forEach(index => {
        weights[index] = Math.min(weightPerAsset, constraints.maxSingleAssetWeight);
      });
    });

    // Normalize to sum to 1
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    for (let i = 0; i < n; i++) {
      weights[i] = weights[i] / totalWeight;
    }

    return weights;
  }

  /**
   * Apply portfolio constraints
   */
  applyConstraints(weights, assetStats, constraints) {
    const n = weights.length;

    // Apply maximum single asset weight
    for (let i = 0; i < n; i++) {
      if (weights[i] > constraints.maxSingleAssetWeight) {
        weights[i] = constraints.maxSingleAssetWeight;
      }
    }

    // Apply ESG minimum
    for (let i = 0; i < n; i++) {
      if (assetStats[i].esgScore < constraints.minESGScore) {
        weights[i] = 0;
      }
    }

    // Apply sector limits
    const sectorWeights = {};
    assetStats.forEach((asset, i) => {
      if (!sectorWeights[asset.sector]) {
        sectorWeights[asset.sector] = 0;
      }
      sectorWeights[asset.sector] += weights[i];
    });

    // Adjust if sector limits exceeded
    Object.keys(constraints.sectorLimits).forEach(sector => {
      const limit = constraints.sectorLimits[sector];
      const currentWeight = sectorWeights[sector] || 0;

      if (currentWeight > limit) {
        const scaleFactor = limit / currentWeight;
        assetStats.forEach((asset, i) => {
          if (asset.sector === sector) {
            weights[i] *= scaleFactor;
          }
        });
      }
    });

    // Renormalize to sum to 1
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    if (totalWeight > 0) {
      for (let i = 0; i < n; i++) {
        weights[i] = weights[i] / totalWeight;
      }
    }
  }

  /**
   * Calculate portfolio performance metrics
   */
  calculatePortfolioMetrics(weights, assetStats, correlationMatrix) {
    const n = weights.length;

    // Expected return
    const expectedReturn = weights.reduce((sum, w, i) => sum + w * assetStats[i].expectedReturn, 0);

    // Portfolio volatility
    let portfolioVariance = 0;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const correlation = correlationMatrix[i][j];
        portfolioVariance += weights[i] * weights[j] * assetStats[i].volatility * assetStats[j].volatility * correlation;
      }
    }
    const portfolioVolatility = Math.sqrt(portfolioVariance);

    // Sharpe ratio
    const sharpeRatio = (expectedReturn - this.riskFreeRate) / portfolioVolatility;

    // ESG score
    const esgScore = weights.reduce((sum, w, i) => sum + w * assetStats[i].esgScore, 0);

    // Carbon intensity
    const carbonIntensity = weights.reduce((sum, w, i) => sum + w * (assetStats[i].carbonIntensity || 0), 0);

    // Diversification ratio
    const weightedAvgVolatility = weights.reduce((sum, w, i) => sum + w * assetStats[i].volatility, 0);
    const diversificationRatio = weightedAvgVolatility / portfolioVolatility;

    return {
      expectedReturn: Math.round(expectedReturn * 10000) / 100, // Percentage
      volatility: Math.round(portfolioVolatility * 10000) / 100, // Percentage
      sharpeRatio: Math.round(sharpeRatio * 100) / 100,
      esgScore: Math.round(esgScore),
      carbonIntensity: Math.round(carbonIntensity),
      diversificationRatio: Math.round(diversificationRatio * 100) / 100,
      maxDrawdown: this.calculatePortfolioMaxDrawdown(weights, assetStats),
      var95: this.calculateValueAtRisk(expectedReturn, portfolioVolatility, 0.95),
      var99: this.calculateValueAtRisk(expectedReturn, portfolioVolatility, 0.99)
    };
  }

  /**
   * Generate efficiency frontier
   */
  generateEfficiencyFrontier(assetStats, correlationMatrix, constraints, points = 20) {
    const frontier = [];

    // Generate portfolios with different risk/return profiles
    for (let i = 0; i < points; i++) {
      const riskAversion = 0.5 + (i / points) * 4; // Risk aversion from 0.5 to 4.5

      // Simple mean-variance optimization with different risk aversion levels
      const weights = this.optimizeWithRiskAversion(assetStats, correlationMatrix, riskAversion, constraints);
      const metrics = this.calculatePortfolioMetrics(weights, assetStats, correlationMatrix);

      frontier.push({
        expectedReturn: metrics.expectedReturn,
        volatility: metrics.volatility,
        sharpeRatio: metrics.sharpeRatio,
        esgScore: metrics.esgScore,
        weights
      });
    }

    return frontier.sort((a, b) => a.volatility - b.volatility);
  }

  /**
   * Optimize with specific risk aversion
   */
  optimizeWithRiskAversion(assetStats, correlationMatrix, riskAversion, constraints) {
    const n = assetStats.length;
    let weights = new Array(n).fill(1 / n);

    for (let iteration = 0; iteration < 30; iteration++) {
      const newWeights = [...weights];

      for (let i = 0; i < n; i++) {
        const expectedReturn = assetStats[i].expectedReturn;
        const risk = assetStats[i].volatility;
        const utility = expectedReturn - (riskAversion * risk * risk / 2);
        newWeights[i] = Math.max(0, utility);
      }

      // Normalize
      const totalWeight = newWeights.reduce((sum, w) => sum + w, 0);
      if (totalWeight > 0) {
        for (let i = 0; i < n; i++) {
          newWeights[i] = newWeights[i] / totalWeight;
        }
      }

      this.applyConstraints(newWeights, assetStats, constraints);
      weights = newWeights;
    }

    return weights;
  }

  /**
   * Comprehensive portfolio risk assessment
   */
  assessPortfolioRisk(weights, assetStats, correlationMatrix) {
    const n = weights.length;

    // Concentration risk
    const concentrationRisk = this.calculateConcentrationRisk(weights);

    // Sector concentration
    const sectorExposure = this.calculateSectorExposure(weights, assetStats);

    // ESG risk factors
    const esgRisks = this.assessESGRisks(weights, assetStats);

    // Market risk factors
    const marketRisks = this.assessMarketRisks(weights, assetStats);

    // Liquidity risk
    const liquidityRisk = this.assessLiquidityRisk(weights, assetStats);

    // Tail risk measures
    const tailRisks = this.calculateTailRisks(weights, assetStats);

    return {
      overall: this.calculateOverallRiskScore([
        concentrationRisk,
        sectorExposure.riskScore,
        esgRisks.overallRisk,
        marketRisks.overallRisk,
        liquidityRisk,
        tailRisks.riskScore
      ]),
      breakdown: {
        concentration: {
          score: concentrationRisk,
          level: concentrationRisk > 70 ? 'High' : concentrationRisk > 40 ? 'Medium' : 'Low',
          description: 'Risk from concentrated holdings'
        },
        sector: sectorExposure,
        esg: esgRisks,
        market: marketRisks,
        liquidity: {
          score: liquidityRisk,
          level: liquidityRisk > 70 ? 'High' : liquidityRisk > 40 ? 'Medium' : 'Low'
        },
        tail: tailRisks
      },
      recommendations: this.generateRiskRecommendations(weights, assetStats)
    };
  }

  /**
   * Calculate concentration risk (Herfindahl-Hirschman Index)
   */
  calculateConcentrationRisk(weights) {
    const hhi = weights.reduce((sum, weight) => sum + (weight * weight), 0);
    return Math.round(hhi * 100); // Scale to 0-100
  }

  /**
   * Calculate sector exposure and risk
   */
  calculateSectorExposure(weights, assetStats) {
    const sectorWeights = {};
    let maxSectorWeight = 0;

    assetStats.forEach((asset, i) => {
      if (!sectorWeights[asset.sector]) {
        sectorWeights[asset.sector] = 0;
      }
      sectorWeights[asset.sector] += weights[i];
      maxSectorWeight = Math.max(maxSectorWeight, sectorWeights[asset.sector]);
    });

    const riskScore = Math.round(maxSectorWeight * 100);

    return {
      sectors: sectorWeights,
      maxExposure: maxSectorWeight,
      riskScore,
      level: riskScore > 50 ? 'High' : riskScore > 30 ? 'Medium' : 'Low'
    };
  }

  /**
   * Assess ESG-related risks
   */
  assessESGRisks(weights, assetStats) {
    const weightedESGScore = weights.reduce((sum, w, i) => sum + w * assetStats[i].esgScore, 0);
    const esgVariance = weights.reduce((sum, w, i) => sum + w * Math.pow(assetStats[i].esgScore - weightedESGScore, 2), 0);

    const reputationalRisk = Math.max(0, 100 - weightedESGScore);
    const regulatoryRisk = assetStats.reduce((sum, asset, i) => {
      const riskMultiplier = asset.sector === 'Energy' ? 1.5 : asset.sector === 'Materials' ? 1.2 : 1.0;
      return sum + weights[i] * reputationalRisk * riskMultiplier;
    }, 0);

    return {
      overallRisk: Math.round((reputationalRisk + regulatoryRisk) / 2),
      reputationalRisk: Math.round(reputationalRisk),
      regulatoryRisk: Math.round(regulatoryRisk),
      esgConsistency: Math.round(100 - Math.sqrt(esgVariance)),
      carbonRisk: this.calculateCarbonRisk(weights, assetStats)
    };
  }

  /**
   * Calculate carbon-related financial risks
   */
  calculateCarbonRisk(weights, assetStats) {
    const carbonIntensity = weights.reduce((sum, w, i) => sum + w * (assetStats[i].carbonIntensity || 0), 0);
    const carbonRisk = Math.min(100, carbonIntensity); // Scale to 0-100

    return {
      score: Math.round(carbonRisk),
      level: carbonRisk > 70 ? 'High' : carbonRisk > 40 ? 'Medium' : 'Low',
      description: 'Risk from carbon-intensive investments facing transition risks'
    };
  }

  /**
   * Assess market-related risks
   */
  assessMarketRisks(weights, assetStats) {
    const weightedBeta = weights.reduce((sum, w, i) => sum + w * (assetStats[i].beta || 1), 0);
    const marketRisk = Math.abs(weightedBeta - 1) * 50; // Scale relative to market

    return {
      overallRisk: Math.round(marketRisk),
      beta: Math.round(weightedBeta * 100) / 100,
      level: marketRisk > 30 ? 'High' : marketRisk > 15 ? 'Medium' : 'Low'
    };
  }

  /**
   * Assess liquidity risks
   */
  assessLiquidityRisk(weights, assetStats) {
    const liquidityScore = assetStats.reduce((sum, asset, i) => {
      const liquidityValue = asset.liquidity === 'high' ? 90 : asset.liquidity === 'medium' ? 60 : 30;
      return sum + weights[i] * liquidityValue;
    }, 0);

    return Math.round(100 - liquidityScore);
  }

  /**
   * Calculate tail risk measures
   */
  calculateTailRisks(weights, assetStats) {
    // Simplified tail risk calculation
    const portfolioReturns = this.simulatePortfolioReturns(weights, assetStats, 1000);
    portfolioReturns.sort((a, b) => a - b);

    const var95 = portfolioReturns[Math.floor(portfolioReturns.length * 0.05)];
    const var99 = portfolioReturns[Math.floor(portfolioReturns.length * 0.01)];
    const cvar95 = portfolioReturns.slice(0, Math.floor(portfolioReturns.length * 0.05))
                                  .reduce((sum, r) => sum + r, 0) / Math.floor(portfolioReturns.length * 0.05);

    const riskScore = Math.min(100, Math.abs(var95) * 500); // Scale to 0-100

    return {
      riskScore: Math.round(riskScore),
      var95: Math.round(var95 * 10000) / 100, // Percentage
      var99: Math.round(var99 * 10000) / 100,
      cvar95: Math.round(cvar95 * 10000) / 100,
      level: riskScore > 50 ? 'High' : riskScore > 25 ? 'Medium' : 'Low'
    };
  }

  /**
   * Simulate portfolio returns for risk calculations
   */
  simulatePortfolioReturns(weights, assetStats, simulations = 1000) {
    const portfolioReturns = [];

    for (let i = 0; i < simulations; i++) {
      let portfolioReturn = 0;

      assetStats.forEach((asset, j) => {
        const randomReturn = this.generateRandomReturn(asset.expectedReturn / 252, asset.volatility / Math.sqrt(252));
        portfolioReturn += weights[j] * randomReturn;
      });

      portfolioReturns.push(portfolioReturn);
    }

    return portfolioReturns;
  }

  /**
   * Generate random return using normal distribution
   */
  generateRandomReturn(expectedReturn, volatility) {
    // Box-Muller transformation for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

    return expectedReturn + volatility * z0;
  }

  /**
   * Calculate overall risk score
   */
  calculateOverallRiskScore(riskScores) {
    const weights = [0.25, 0.20, 0.20, 0.15, 0.10, 0.10]; // Risk category weights
    const weightedScore = riskScores.reduce((sum, score, i) => sum + score * weights[i], 0);
    return Math.round(weightedScore);
  }

  /**
   * Generate risk-based recommendations
   */
  generateRiskRecommendations(weights, assetStats) {
    const recommendations = [];

    // Check concentration
    const maxWeight = Math.max(...weights);
    if (maxWeight > 0.25) {
      recommendations.push({
        type: 'concentration',
        priority: 'high',
        message: 'Consider reducing concentration in largest holding',
        impact: 'Reduce single-asset risk'
      });
    }

    // Check ESG scores
    const lowESGAssets = assetStats.filter((asset, i) => weights[i] > 0.05 && asset.esgScore < 60);
    if (lowESGAssets.length > 0) {
      recommendations.push({
        type: 'esg',
        priority: 'medium',
        message: 'Consider replacing low-ESG assets with sustainable alternatives',
        impact: 'Reduce ESG risk and improve sustainability profile'
      });
    }

    // Check sector diversification
    const sectorWeights = this.calculateSectorExposure(weights, assetStats).sectors;
    const maxSectorWeight = Math.max(...Object.values(sectorWeights));
    if (maxSectorWeight > 0.4) {
      recommendations.push({
        type: 'diversification',
        priority: 'medium',
        message: 'Consider diversifying across more sectors',
        impact: 'Reduce sector concentration risk'
      });
    }

    return recommendations;
  }

  /**
   * Calculate maximum drawdown for individual asset
   */
  calculateMaxDrawdown(returns) {
    let peak = 0;
    let maxDrawdown = 0;
    let cumulative = 0;

    for (const dailyReturn of returns) {
      cumulative += dailyReturn;
      peak = Math.max(peak, cumulative);
      const drawdown = (peak - cumulative) / (peak || 1);
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }

    return Math.round(maxDrawdown * 10000) / 100; // Percentage
  }

  /**
   * Calculate portfolio maximum drawdown
   */
  calculatePortfolioMaxDrawdown(weights, assetStats) {
    // Weighted average of individual drawdowns (simplified)
    const weightedDrawdown = weights.reduce((sum, w, i) => sum + w * (assetStats[i].drawdown || 0), 0);
    return Math.round(weightedDrawdown * 100) / 100;
  }

  /**
   * Calculate Value at Risk
   */
  calculateValueAtRisk(expectedReturn, volatility, confidence) {
    // Normal distribution approximation
    const zScore = confidence === 0.95 ? -1.645 : confidence === 0.99 ? -2.326 : -1.96;
    const var = expectedReturn + zScore * volatility;
    return Math.round(var * 10000) / 100; // Percentage
  }

  /**
   * Fallback optimization when full optimization fails
   */
  getFallbackOptimization(assets) {
    const n = assets.length;
    const weights = new Array(n).fill(1 / n);

    return {
      optimizedWeights: weights,
      method: 'equal_weight',
      note: 'Fallback to equal weighting due to optimization failure'
    };
  }
}

// Export singleton instance
export const portfolioOptimizer = new PortfolioOptimizer();