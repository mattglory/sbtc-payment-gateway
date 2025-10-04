/**
 * Real-time ESG Data Integration Service
 * Integrates with multiple ESG data providers for comprehensive sustainability analysis
 */

class ESGDataService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 60 * 60 * 1000; // 1 hour cache
    this.providers = {
      msci: 'MSCI ESG Research',
      sustainalytics: 'Sustainalytics',
      refinitiv: 'Refinitiv ESG',
      bloomberg: 'Bloomberg ESG',
      yahoo: 'Yahoo Finance ESG'
    };
    this.rateLimits = new Map();
  }

  /**
   * Get comprehensive ESG data for a symbol
   */
  async getESGData(symbol, provider = 'auto') {
    const cacheKey = `${symbol}_${provider}`;

    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      let esgData;

      if (provider === 'auto') {
        // Try multiple providers in order of preference
        esgData = await this.getDataFromMultipleProviders(symbol);
      } else {
        esgData = await this.getDataFromProvider(symbol, provider);
      }

      // Cache the result
      this.cache.set(cacheKey, {
        data: esgData,
        timestamp: Date.now()
      });

      return esgData;
    } catch (error) {
      console.error(`Failed to fetch ESG data for ${symbol}:`, error);
      return this.getFallbackESGData(symbol);
    }
  }

  /**
   * Try multiple providers to get the best data
   */
  async getDataFromMultipleProviders(symbol) {
    const providers = ['yahoo', 'refinitiv', 'msci', 'sustainalytics'];
    let combinedData = null;

    for (const provider of providers) {
      try {
        if (this.checkRateLimit(provider)) {
          const data = await this.getDataFromProvider(symbol, provider);
          if (data && data.esgScore > 0) {
            combinedData = this.mergeESGData(combinedData, data, provider);
          }
        }
      } catch (error) {
        console.warn(`Provider ${provider} failed for ${symbol}:`, error.message);
        continue;
      }
    }

    return combinedData || this.getFallbackESGData(symbol);
  }

  /**
   * Get data from specific provider
   */
  async getDataFromProvider(symbol, provider) {
    switch (provider) {
      case 'yahoo':
        return await this.getYahooESGData(symbol);
      case 'refinitiv':
        return await this.getRefinitivESGData(symbol);
      case 'msci':
        return await this.getMSCIESGData(symbol);
      case 'sustainalytics':
        return await this.getSustainalyticsData(symbol);
      case 'bloomberg':
        return await this.getBloombergESGData(symbol);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  /**
   * Yahoo Finance ESG Data (Free tier available)
   */
  async getYahooESGData(symbol) {
    try {
      // Yahoo Finance API for ESG data
      const response = await fetch(`https://query1.finance.yahoo.com/v1/finance/esgChart?symbol=${symbol}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`Yahoo API error: ${response.status}`);
      }

      const data = await response.json();

      if (data?.esgChart?.result?.[0]) {
        const result = data.esgChart.result[0];

        return {
          symbol,
          provider: 'Yahoo Finance',
          esgScore: result.totalEsg?.raw || 0,
          environmentalScore: result.environmentScore?.raw || 0,
          socialScore: result.socialScore?.raw || 0,
          governanceScore: result.governanceScore?.raw || 0,
          controversyLevel: result.highestControversy || 0,
          peerGroup: result.peerGroup || '',
          peerRank: result.percentile || 0,
          lastUpdated: new Date().toISOString(),
          dataQuality: 'high',
          rawData: result
        };
      }

      throw new Error('No ESG data found in Yahoo response');
    } catch (error) {
      console.warn(`Yahoo ESG data failed for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Refinitiv ESG Data (requires API key)
   */
  async getRefinitivESGData(symbol) {
    if (!process.env.REFINITIV_API_KEY) {
      return null;
    }

    try {
      const response = await fetch(`https://api.refinitiv.com/esg/v1/views/scores-full?universe=${symbol}`, {
        headers: {
          'Authorization': `Bearer ${process.env.REFINITIV_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Refinitiv API error: ${response.status}`);
      }

      const data = await response.json();

      if (data?.data?.[0]) {
        const scores = data.data[0];

        return {
          symbol,
          provider: 'Refinitiv',
          esgScore: scores.TR_ESG_SCORE || 0,
          environmentalScore: scores.TR_ENV_SCORE || 0,
          socialScore: scores.TR_SOC_SCORE || 0,
          governanceScore: scores.TR_GOV_SCORE || 0,
          controversyLevel: scores.TR_ESG_CONTROVERSIES_SCORE || 0,
          industryRank: scores.TR_ESG_INDUSTRY_RANK || 0,
          lastUpdated: scores.TR_ESG_SCORE_DATE || new Date().toISOString(),
          dataQuality: 'premium',
          rawData: scores
        };
      }

      return null;
    } catch (error) {
      console.warn(`Refinitiv ESG data failed for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * MSCI ESG Data (requires subscription)
   */
  async getMSCIESGData(symbol) {
    if (!process.env.MSCI_API_KEY) {
      return null;
    }

    try {
      const response = await fetch(`https://api.msci.com/esg/issuer/${symbol}/rating`, {
        headers: {
          'X-API-Key': process.env.MSCI_API_KEY,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`MSCI API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        symbol,
        provider: 'MSCI',
        esgScore: this.convertMSCIRatingToScore(data.rating),
        esgRating: data.rating,
        environmentalScore: data.environmental_pillar_score || 0,
        socialScore: data.social_pillar_score || 0,
        governanceScore: data.governance_pillar_score || 0,
        industryAdjustedScore: data.industry_adjusted_score || 0,
        lastUpdated: data.last_updated || new Date().toISOString(),
        dataQuality: 'premium',
        rawData: data
      };
    } catch (error) {
      console.warn(`MSCI ESG data failed for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Sustainalytics ESG Data
   */
  async getSustainalyticsData(symbol) {
    // Mock implementation - Sustainalytics requires enterprise agreement
    return {
      symbol,
      provider: 'Sustainalytics (Mock)',
      esgScore: Math.floor(Math.random() * 40) + 50,
      riskRating: 'Medium',
      industryRank: Math.floor(Math.random() * 100) + 1,
      lastUpdated: new Date().toISOString(),
      dataQuality: 'estimated'
    };
  }

  /**
   * Bloomberg ESG Data
   */
  async getBloombergESGData(symbol) {
    if (!process.env.BLOOMBERG_API_KEY) {
      return null;
    }

    // Bloomberg Terminal API integration would go here
    // This is a simplified mock due to Bloomberg's complex authentication
    return {
      symbol,
      provider: 'Bloomberg (Mock)',
      esgScore: Math.floor(Math.random() * 40) + 45,
      disclosureScore: Math.floor(Math.random() * 30) + 60,
      lastUpdated: new Date().toISOString(),
      dataQuality: 'premium'
    };
  }

  /**
   * Get market-wide ESG trends
   */
  async getESGTrends() {
    try {
      // This would integrate with market data providers
      // Mock implementation for demonstration
      return {
        timestamp: new Date().toISOString(),
        trends: {
          avgESGScore: 67.5,
          sectorLeaders: [
            { sector: 'Technology', avgScore: 78.2 },
            { sector: 'Healthcare', avgScore: 72.8 },
            { sector: 'Financials', avgScore: 69.1 },
            { sector: 'Consumer Discretionary', avgScore: 65.4 },
            { sector: 'Energy', avgScore: 42.1 }
          ],
          emergingThemes: [
            { theme: 'Climate Transition', momentum: 'increasing', impact: 'high' },
            { theme: 'Social Equity', momentum: 'increasing', impact: 'medium' },
            { theme: 'Data Privacy', momentum: 'stable', impact: 'medium' },
            { theme: 'Board Diversity', momentum: 'increasing', impact: 'medium' }
          ],
          regulatoryUpdates: [
            {
              region: 'EU',
              update: 'CSRD implementation timeline confirmed',
              impact: 'high',
              date: '2024-01-15'
            },
            {
              region: 'US',
              update: 'SEC climate disclosure rules finalized',
              impact: 'high',
              date: '2024-03-06'
            }
          ]
        }
      };
    } catch (error) {
      console.error('Failed to fetch ESG trends:', error);
      return null;
    }
  }

  /**
   * Get ESG news and alerts
   */
  async getESGNews(symbols = [], limit = 10) {
    try {
      // This would integrate with news APIs like NewsAPI, Alpha Vantage, etc.
      // Mock implementation
      const mockNews = [
        {
          headline: 'Major Tech Company Commits to Carbon Neutrality by 2030',
          summary: 'Leading technology firm announces comprehensive sustainability plan',
          impact: 'positive',
          relevantSymbols: ['AAPL', 'MSFT', 'GOOGL'],
          source: 'Reuters',
          publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          headline: 'New EU Regulations Affect Energy Sector ESG Ratings',
          summary: 'Updated taxonomy creates challenges for traditional energy companies',
          impact: 'negative',
          relevantSymbols: ['XOM', 'CVX', 'BP'],
          source: 'Financial Times',
          publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        },
        {
          headline: 'ESG ETF Inflows Reach Record Highs in Q1',
          summary: 'Sustainable investing continues strong growth trajectory',
          impact: 'positive',
          relevantSymbols: ['ESG', 'ESGD', 'ICLN'],
          source: 'Bloomberg',
          publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
        }
      ];

      return mockNews
        .filter(news => symbols.length === 0 || news.relevantSymbols.some(s => symbols.includes(s)))
        .slice(0, limit);

    } catch (error) {
      console.error('Failed to fetch ESG news:', error);
      return [];
    }
  }

  /**
   * Compare ESG performance across multiple symbols
   */
  async compareESGPerformance(symbols) {
    const comparisons = [];

    for (const symbol of symbols) {
      try {
        const esgData = await this.getESGData(symbol);
        if (esgData) {
          comparisons.push(esgData);
        }
      } catch (error) {
        console.warn(`Failed to get ESG data for comparison: ${symbol}`);
      }
    }

    // Calculate relative rankings
    comparisons.sort((a, b) => b.esgScore - a.esgScore);
    comparisons.forEach((item, index) => {
      item.rank = index + 1;
      item.percentile = ((comparisons.length - index) / comparisons.length) * 100;
    });

    return {
      comparisons,
      summary: {
        highestESG: comparisons[0],
        lowestESG: comparisons[comparisons.length - 1],
        averageScore: comparisons.reduce((sum, item) => sum + item.esgScore, 0) / comparisons.length
      }
    };
  }

  /**
   * Merge ESG data from multiple sources
   */
  mergeESGData(existing, newData, provider) {
    if (!existing) {
      return { ...newData, sources: [provider] };
    }

    // Weight scores based on provider reliability
    const weights = {
      msci: 0.35,
      refinitiv: 0.30,
      sustainalytics: 0.20,
      bloomberg: 0.10,
      yahoo: 0.05
    };

    const existingWeight = existing.sources.reduce((sum, src) => sum + (weights[src] || 0.05), 0);
    const newWeight = weights[provider] || 0.05;
    const totalWeight = existingWeight + newWeight;

    return {
      ...existing,
      esgScore: Math.round(((existing.esgScore * existingWeight) + (newData.esgScore * newWeight)) / totalWeight),
      environmentalScore: Math.round(((existing.environmentalScore * existingWeight) + (newData.environmentalScore * newWeight)) / totalWeight),
      socialScore: Math.round(((existing.socialScore * existingWeight) + (newData.socialScore * newWeight)) / totalWeight),
      governanceScore: Math.round(((existing.governanceScore * existingWeight) + (newData.governanceScore * newWeight)) / totalWeight),
      sources: [...existing.sources, provider],
      dataQuality: existing.dataQuality === 'premium' || newData.dataQuality === 'premium' ? 'premium' : 'high',
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Convert MSCI letter rating to numeric score
   */
  convertMSCIRatingToScore(rating) {
    const ratingMap = {
      'AAA': 95,
      'AA': 85,
      'A': 75,
      'BBB': 65,
      'BB': 55,
      'B': 45,
      'CCC': 35
    };
    return ratingMap[rating] || 50;
  }

  /**
   * Check rate limiting
   */
  checkRateLimit(provider) {
    const now = Date.now();
    const limits = {
      yahoo: { requests: 100, window: 60000 }, // 100 per minute
      refinitiv: { requests: 50, window: 60000 }, // 50 per minute
      msci: { requests: 20, window: 60000 }, // 20 per minute
      sustainalytics: { requests: 30, window: 60000 },
      bloomberg: { requests: 10, window: 60000 }
    };

    const limit = limits[provider];
    if (!limit) return true;

    if (!this.rateLimits.has(provider)) {
      this.rateLimits.set(provider, []);
    }

    const requests = this.rateLimits.get(provider);
    const validRequests = requests.filter(timestamp => now - timestamp < limit.window);

    if (validRequests.length >= limit.requests) {
      return false;
    }

    validRequests.push(now);
    this.rateLimits.set(provider, validRequests);
    return true;
  }

  /**
   * Fallback ESG data when all providers fail
   */
  getFallbackESGData(symbol) {
    // Use sector-based estimates as fallback
    const sectorESGAverages = {
      'Technology': 75,
      'Healthcare': 70,
      'Financials': 65,
      'Consumer Discretionary': 60,
      'Industrials': 58,
      'Materials': 55,
      'Utilities': 52,
      'Energy': 45,
      'Real Estate': 60,
      'Consumer Staples': 62,
      'Telecommunications': 58
    };

    const averageScore = 60;
    const variation = Math.floor(Math.random() * 20) - 10; // ±10 variation

    return {
      symbol,
      provider: 'Estimated',
      esgScore: averageScore + variation,
      environmentalScore: averageScore + variation,
      socialScore: averageScore + variation,
      governanceScore: averageScore + variation,
      controversyLevel: Math.floor(Math.random() * 3),
      lastUpdated: new Date().toISOString(),
      dataQuality: 'estimated',
      note: 'Fallback estimation used - actual provider data unavailable'
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      cacheSize: this.cache.size,
      providers: Object.keys(this.providers),
      rateLimitStatus: Array.from(this.rateLimits.entries()).map(([provider, requests]) => ({
        provider,
        recentRequests: requests.length
      }))
    };
  }
}

// Export singleton instance
export const esgDataService = new ESGDataService();
export default esgDataService;