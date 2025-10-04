import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import axios from 'axios';

// Rate limiting store
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 15; // 15 requests per minute per IP

// Portfolio analysis request schema
const portfolioAnalysisSchema = z.object({
  currentHoldings: z.array(z.object({
    symbol: z.string(),
    name: z.string().optional(),
    quantity: z.number().positive(),
    currentPrice: z.number().positive(),
    sector: z.string().optional(),
    esgScore: z.number().min(0).max(100).optional(),
  })),
  investmentGoals: z.object({
    riskTolerance: z.enum(['conservative', 'moderate', 'aggressive']),
    timeHorizon: z.enum(['short', 'medium', 'long']), // < 2 years, 2-5 years, > 5 years
    sustainabilityFocus: z.enum(['low', 'medium', 'high']),
    targetReturn: z.number().min(0).max(50).optional(),
  }),
  availableCapital: z.number().min(0),
  preferredInvestmentTypes: z.array(z.enum(['stocks', 'etfs', 'bonds', 'reits', 'commodities'])).optional(),
  excludeSectors: z.array(z.string()).optional(),
});

// AI response schema for investment recommendations
const investmentRecommendationsSchema = z.object({
  portfolioAnalysis: z.object({
    currentESGScore: z.number().min(0).max(100),
    sustainabilityGrade: z.enum(['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F']),
    riskLevel: z.enum(['Very Low', 'Low', 'Moderate', 'High', 'Very High']),
    diversificationScore: z.number().min(0).max(100),
    carbonIntensity: z.number().min(0), // kg CO2e per $1000 invested
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
  }),
  recommendations: z.array(z.object({
    symbol: z.string(),
    name: z.string(),
    type: z.enum(['stock', 'etf', 'bond', 'reit']),
    sector: z.string(),
    recommendedAllocation: z.number().min(0).max(100), // percentage
    expectedReturn: z.number(), // annual %
    riskScore: z.number().min(1).max(10),
    esgScore: z.number().min(0).max(100),
    sustainabilityRating: z.enum(['Excellent', 'Good', 'Fair', 'Poor']),
    carbonImpact: z.number(), // kg CO2e reduction per $1000 invested
    minimumInvestment: z.number().min(0),
    reasoning: z.string(),
    keyFeatures: z.array(z.string()),
    risks: z.array(z.string()),
  })),
  optimizedPortfolio: z.object({
    targetESGScore: z.number().min(0).max(100),
    expectedAnnualReturn: z.number(),
    volatility: z.number().min(0),
    sharpeRatio: z.number(),
    maxDrawdown: z.number(),
    carbonReduction: z.number(), // % reduction in carbon intensity
    allocations: z.array(z.object({
      symbol: z.string(),
      allocation: z.number().min(0).max(100),
    })),
  }),
  marketInsights: z.object({
    trendingESGThemes: z.array(z.string()),
    marketConditions: z.string(),
    regulatoryImpacts: z.array(z.string()),
    opportunitiesAlert: z.array(z.string()),
  }),
});

// Mock ESG and market data (in production, integrate with real APIs like Bloomberg, MSCI, etc.)
const ESG_DATABASE = {
  // Green Bonds
  'ICLN': { esgScore: 89, carbonImpact: -45, sector: 'Clean Energy', expectedReturn: 8.5, riskScore: 6 },
  'QCLN': { esgScore: 87, carbonImpact: -42, sector: 'Clean Energy', expectedReturn: 9.2, riskScore: 7 },
  'PBW': { esgScore: 85, carbonImpact: -38, sector: 'Clean Energy', expectedReturn: 10.1, riskScore: 8 },

  // ESG ETFs
  'ESG': { esgScore: 82, carbonImpact: -25, sector: 'Broad Market ESG', expectedReturn: 7.8, riskScore: 5 },
  'ESGD': { esgScore: 84, carbonImpact: -28, sector: 'Developed Markets ESG', expectedReturn: 7.5, riskScore: 5 },
  'SUSB': { esgScore: 79, carbonImpact: -15, sector: 'ESG Bonds', expectedReturn: 4.2, riskScore: 3 },

  // Sustainable Stocks
  'TSLA': { esgScore: 76, carbonImpact: -55, sector: 'Electric Vehicles', expectedReturn: 12.5, riskScore: 9 },
  'ENPH': { esgScore: 88, carbonImpact: -48, sector: 'Solar Energy', expectedReturn: 11.8, riskScore: 8 },
  'NEE': { esgScore: 81, carbonImpact: -35, sector: 'Renewable Utilities', expectedReturn: 8.9, riskScore: 4 },
  'BEP': { esgScore: 92, carbonImpact: -52, sector: 'Renewable Energy', expectedReturn: 9.5, riskScore: 6 },

  // Green REITs
  'HASI': { esgScore: 86, carbonImpact: -30, sector: 'Green Infrastructure', expectedReturn: 7.2, riskScore: 5 },

  // Water & Waste Management
  'PHO': { esgScore: 83, carbonImpact: -20, sector: 'Water Resources', expectedReturn: 8.1, riskScore: 5 },
  'AQWA': { esgScore: 85, carbonImpact: -22, sector: 'Water Technology', expectedReturn: 8.7, riskScore: 6 },
};

// Authentication and rate limiting (same as previous APIs)
function authenticate(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing or invalid authorization header' };
  }
  return { valid: true };
}

function rateLimit(ip) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }

  const requests = rateLimitMap.get(ip);
  const validRequests = requests.filter(timestamp => timestamp > windowStart);
  rateLimitMap.set(ip, validRequests);

  if (validRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return { limited: true, error: 'Rate limit exceeded. Try again later.' };
  }

  validRequests.push(now);
  return { limited: false };
}

function getClientIP(req) {
  return req.headers['x-forwarded-for'] ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         'unknown';
}

// Portfolio analysis functions
function analyzeCurrentPortfolio(holdings) {
  if (!holdings || holdings.length === 0) {
    return {
      currentESGScore: 0,
      sustainabilityGrade: 'F',
      riskLevel: 'Unknown',
      diversificationScore: 0,
      carbonIntensity: 100, // High default
      strengths: [],
      weaknesses: ['No holdings to analyze']
    };
  }

  const totalValue = holdings.reduce((sum, holding) => sum + (holding.quantity * holding.currentPrice), 0);

  // Calculate weighted ESG score
  let weightedESGScore = 0;
  let weightedCarbonIntensity = 0;
  let weightedRisk = 0;

  holdings.forEach(holding => {
    const weight = (holding.quantity * holding.currentPrice) / totalValue;
    const esgData = ESG_DATABASE[holding.symbol] || { esgScore: 50, carbonImpact: 0, riskScore: 5 };

    weightedESGScore += esgData.esgScore * weight;
    weightedCarbonIntensity += Math.abs(esgData.carbonImpact) * weight;
    weightedRisk += esgData.riskScore * weight;
  });

  // Calculate diversification score (simplified)
  const uniqueSectors = new Set(holdings.map(h => h.sector || 'Unknown')).size;
  const diversificationScore = Math.min(100, (uniqueSectors / Math.max(holdings.length, 10)) * 100);

  // Determine sustainability grade
  const sustainabilityGrade = weightedESGScore >= 90 ? 'A+' :
                             weightedESGScore >= 85 ? 'A' :
                             weightedESGScore >= 80 ? 'A-' :
                             weightedESGScore >= 75 ? 'B+' :
                             weightedESGScore >= 70 ? 'B' :
                             weightedESGScore >= 65 ? 'B-' :
                             weightedESGScore >= 60 ? 'C+' :
                             weightedESGScore >= 55 ? 'C' :
                             weightedESGScore >= 50 ? 'C-' :
                             weightedESGScore >= 40 ? 'D+' :
                             weightedESGScore >= 30 ? 'D' : 'F';

  const riskLevel = weightedRisk <= 3 ? 'Very Low' :
                   weightedRisk <= 4 ? 'Low' :
                   weightedRisk <= 6 ? 'Moderate' :
                   weightedRisk <= 8 ? 'High' : 'Very High';

  return {
    currentESGScore: Math.round(weightedESGScore),
    sustainabilityGrade,
    riskLevel,
    diversificationScore: Math.round(diversificationScore),
    carbonIntensity: Math.round(weightedCarbonIntensity),
    strengths: weightedESGScore > 70 ? ['Strong ESG focus'] : [],
    weaknesses: weightedESGScore < 60 ? ['Low sustainability rating'] : []
  };
}

function generateRecommendations(portfolioAnalysis, investmentGoals, availableCapital) {
  const recommendations = [];

  // Filter investments based on goals
  const sustainabilityThreshold = investmentGoals.sustainabilityFocus === 'high' ? 80 :
                                 investmentGoals.sustainabilityFocus === 'medium' ? 65 : 50;

  const riskThreshold = investmentGoals.riskTolerance === 'conservative' ? 4 :
                       investmentGoals.riskTolerance === 'moderate' ? 7 : 10;

  // Get suitable investments from database
  Object.entries(ESG_DATABASE).forEach(([symbol, data]) => {
    if (data.esgScore >= sustainabilityThreshold && data.riskScore <= riskThreshold) {
      recommendations.push({
        symbol,
        name: `${symbol} - ${data.sector}`,
        type: symbol.includes('ETF') ? 'etf' : 'stock',
        sector: data.sector,
        recommendedAllocation: Math.min(20, Math.max(5, 15 - data.riskScore)),
        expectedReturn: data.expectedReturn,
        riskScore: data.riskScore,
        esgScore: data.esgScore,
        sustainabilityRating: data.esgScore >= 85 ? 'Excellent' :
                             data.esgScore >= 70 ? 'Good' :
                             data.esgScore >= 55 ? 'Fair' : 'Poor',
        carbonImpact: Math.abs(data.carbonImpact),
        minimumInvestment: 100, // $100 minimum
        reasoning: `Strong ESG score of ${data.esgScore} with ${data.carbonImpact < 0 ? 'positive' : 'neutral'} environmental impact`,
        keyFeatures: [
          `ESG Score: ${data.esgScore}/100`,
          `Expected Return: ${data.expectedReturn}%`,
          `Carbon Impact: ${data.carbonImpact} kg CO2e per $1000`
        ],
        risks: data.riskScore > 6 ? ['High volatility', 'Market risk'] : ['Market risk']
      });
    }
  });

  return recommendations.slice(0, 8); // Return top 8 recommendations
}

function optimizePortfolio(recommendations, investmentGoals) {
  // Simplified portfolio optimization
  const totalAllocation = recommendations.reduce((sum, rec) => sum + rec.recommendedAllocation, 0);

  // Normalize allocations to 100%
  const normalizedRecommendations = recommendations.map(rec => ({
    symbol: rec.symbol,
    allocation: (rec.recommendedAllocation / totalAllocation) * 100
  }));

  // Calculate portfolio metrics
  const expectedReturn = recommendations.reduce((sum, rec, idx) => {
    const weight = normalizedRecommendations[idx].allocation / 100;
    return sum + (rec.expectedReturn * weight);
  }, 0);

  const targetESGScore = recommendations.reduce((sum, rec, idx) => {
    const weight = normalizedRecommendations[idx].allocation / 100;
    return sum + (rec.esgScore * weight);
  }, 0);

  return {
    targetESGScore: Math.round(targetESGScore),
    expectedAnnualReturn: Math.round(expectedReturn * 100) / 100,
    volatility: 15 + (investmentGoals.riskTolerance === 'aggressive' ? 5 :
                     investmentGoals.riskTolerance === 'moderate' ? 0 : -5),
    sharpeRatio: expectedReturn / 15, // Simplified calculation
    maxDrawdown: investmentGoals.riskTolerance === 'conservative' ? 8 :
                investmentGoals.riskTolerance === 'moderate' ? 15 : 25,
    carbonReduction: 35, // Average carbon reduction %
    allocations: normalizedRecommendations
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'This endpoint only accepts POST requests'
    });
  }

  const clientIP = getClientIP(req);

  try {
    // Authentication check
    const auth = authenticate(req);
    if (!auth.valid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: auth.error
      });
    }

    // Rate limiting check
    const rateCheck = rateLimit(clientIP);
    if (rateCheck.limited) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: rateCheck.error
      });
    }

    // Input validation
    const parseResult = portfolioAnalysisSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Please check your portfolio data',
        details: parseResult.error.errors
      });
    }

    const { currentHoldings, investmentGoals, availableCapital, preferredInvestmentTypes, excludeSectors } = parseResult.data;

    // Analyze current portfolio
    const portfolioAnalysis = analyzeCurrentPortfolio(currentHoldings);

    // Generate recommendations
    let recommendations = generateRecommendations(portfolioAnalysis, investmentGoals, availableCapital);

    // Filter by preferred investment types
    if (preferredInvestmentTypes && preferredInvestmentTypes.length > 0) {
      recommendations = recommendations.filter(rec => preferredInvestmentTypes.includes(rec.type));
    }

    // Exclude sectors
    if (excludeSectors && excludeSectors.length > 0) {
      recommendations = recommendations.filter(rec => !excludeSectors.includes(rec.sector));
    }

    // Use AI for enhanced analysis if available
    let aiEnhancedAnalysis = null;
    if (process.env.OPENAI_API_KEY && recommendations.length > 0) {
      try {
        const prompt = `As an expert sustainable investment advisor, analyze this portfolio and provide enhanced investment recommendations:

Current Portfolio: ${currentHoldings.map(h => `${h.symbol} (${h.quantity} shares at $${h.currentPrice})`).join(', ')}

Investment Goals:
- Risk Tolerance: ${investmentGoals.riskTolerance}
- Time Horizon: ${investmentGoals.timeHorizon}
- Sustainability Focus: ${investmentGoals.sustainabilityFocus}
- Available Capital: $${availableCapital}

Top Recommendations: ${recommendations.slice(0, 5).map(r => `${r.symbol} (${r.sector})`).join(', ')}

Provide detailed analysis including:
1. Portfolio ESG assessment
2. Risk-adjusted recommendations
3. Market insights and trends
4. Optimization suggestions

Focus on sustainable investing, ESG factors, and long-term value creation.`;

        const result = await generateObject({
          model: openai('gpt-4o'),
          schema: investmentRecommendationsSchema,
          prompt,
          temperature: 0.3,
        });

        if (result.object) {
          aiEnhancedAnalysis = result.object;
        }
      } catch (aiError) {
        console.warn('AI enhancement failed, using standard analysis:', aiError.message);
      }
    }

    // Generate optimized portfolio
    const optimizedPortfolio = optimizePortfolio(recommendations, investmentGoals);

    // Prepare response
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      analysisType: aiEnhancedAnalysis ? 'ai-enhanced' : 'standard',
      portfolioAnalysis: aiEnhancedAnalysis?.portfolioAnalysis || portfolioAnalysis,
      recommendations: aiEnhancedAnalysis?.recommendations || recommendations,
      optimizedPortfolio: aiEnhancedAnalysis?.optimizedPortfolio || optimizedPortfolio,
      marketInsights: aiEnhancedAnalysis?.marketInsights || {
        trendingESGThemes: ['Clean Energy Transition', 'Water Scarcity Solutions', 'Circular Economy'],
        marketConditions: 'ESG investments showing strong momentum with institutional adoption',
        regulatoryImpacts: ['EU Taxonomy implementation', 'SEC climate disclosure rules'],
        opportunitiesAlert: ['Renewable energy infrastructure', 'Electric vehicle supply chain']
      },
      metadata: {
        totalRecommendations: recommendations.length,
        averageESGScore: Math.round(recommendations.reduce((sum, rec) => sum + rec.esgScore, 0) / recommendations.length),
        portfolioCapacity: availableCapital,
        analysisDate: new Date().toISOString()
      }
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Investment Recommendations API Error:', error);

    if (error.message?.includes('rate limit') || error.status === 429) {
      return res.status(429).json({
        error: 'API rate limit exceeded',
        message: 'Too many requests. Please try again later.'
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred while analyzing investments',
      requestId: Date.now().toString()
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '2mb',
    },
  },
};