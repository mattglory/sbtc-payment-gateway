/**
 * ESG Score API Client
 * Provides a convenient interface to interact with the ESG scoring API
 */

export class ESGScoreClient {
  constructor(baseUrl = '/api/ai', authToken = null) {
    this.baseUrl = baseUrl;
    this.authToken = authToken;
  }

  /**
   * Analyze a company's ESG score
   * @param {Object} params - Company analysis parameters
   * @param {string} params.companyName - Name of the company
   * @param {string} params.sector - Industry sector
   * @param {string} params.description - Company description/business model
   * @returns {Promise<Object>} ESG analysis results
   */
  async analyzeCompany({ companyName, sector, description }) {
    try {
      const response = await fetch(`${this.baseUrl}/esg-score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` }),
        },
        body: JSON.stringify({
          companyName: companyName.trim(),
          sector: sector.trim(),
          description: description.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('ESG Score API Error:', error);
      throw error;
    }
  }

  /**
   * Batch analyze multiple companies
   * @param {Array} companies - Array of company objects
   * @param {number} delayMs - Delay between requests to avoid rate limiting
   * @returns {Promise<Array>} Array of ESG analysis results
   */
  async batchAnalyze(companies, delayMs = 1000) {
    const results = [];

    for (const company of companies) {
      try {
        const result = await this.analyzeCompany(company);
        results.push({ success: true, data: result, company });
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          company
        });
      }

      // Add delay to respect rate limiting
      if (delayMs > 0 && companies.indexOf(company) < companies.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    return results;
  }

  /**
   * Get ESG score interpretation
   * @param {number} score - ESG score (0-100)
   * @returns {Object} Score interpretation
   */
  static interpretScore(score) {
    if (score >= 80) {
      return {
        rating: 'Excellent',
        description: 'Outstanding ESG performance with industry-leading practices',
        color: '#10B981' // green-500
      };
    } else if (score >= 65) {
      return {
        rating: 'Good',
        description: 'Strong ESG performance with room for improvement',
        color: '#84CC16' // lime-500
      };
    } else if (score >= 50) {
      return {
        rating: 'Average',
        description: 'Moderate ESG performance, needs significant improvement',
        color: '#EAB308' // yellow-500
      };
    } else if (score >= 35) {
      return {
        rating: 'Below Average',
        description: 'Poor ESG performance with major concerns',
        color: '#F97316' // orange-500
      };
    } else {
      return {
        rating: 'Poor',
        description: 'Very poor ESG performance requiring immediate attention',
        color: '#EF4444' // red-500
      };
    }
  }

  /**
   * Calculate portfolio ESG score from multiple companies
   * @param {Array} companies - Array of companies with ESG scores
   * @param {Array} weights - Optional weights for each company
   * @returns {Object} Portfolio ESG metrics
   */
  static calculatePortfolioESG(companies, weights = null) {
    if (!companies || companies.length === 0) {
      return null;
    }

    const totalWeight = weights ? weights.reduce((sum, w) => sum + w, 0) : companies.length;
    const defaultWeight = 1 / companies.length;

    const portfolioScores = companies.reduce((acc, company, index) => {
      const weight = weights ? weights[index] / totalWeight : defaultWeight;
      const scores = company.esgScores || company;

      acc.environmental += scores.environmental * weight;
      acc.social += scores.social * weight;
      acc.governance += scores.governance * weight;
      acc.overall += scores.overall * weight;

      return acc;
    }, {
      environmental: 0,
      social: 0,
      governance: 0,
      overall: 0
    });

    return {
      scores: {
        environmental: Math.round(portfolioScores.environmental),
        social: Math.round(portfolioScores.social),
        governance: Math.round(portfolioScores.governance),
        overall: Math.round(portfolioScores.overall)
      },
      interpretation: this.interpretScore(portfolioScores.overall),
      companyCount: companies.length
    };
  }
}

// Usage example:
/*
const esgClient = new ESGScoreClient('/api/ai', 'your-auth-token');

const result = await esgClient.analyzeCompany({
  companyName: 'Apple Inc.',
  sector: 'Technology',
  description: 'Apple designs, manufactures, and markets smartphones, computers, tablets, and wearables.'
});

console.log('ESG Scores:', result.esgScores);
console.log('Analysis:', result.analysis);
*/

export default ESGScoreClient;