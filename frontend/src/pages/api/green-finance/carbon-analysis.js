import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import axios from 'axios';

// Rate limiting store
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 20; // 20 requests per minute per IP

// Carbon analysis request schema
const carbonAnalysisSchema = z.object({
  transactions: z.array(z.object({
    id: z.string(),
    amount: z.number().positive(),
    merchant: z.string(),
    category: z.string(),
    date: z.string(),
    description: z.string().optional(),
  })),
  timeframe: z.enum(['week', 'month', 'quarter', 'year']).optional().default('month'),
  userLocation: z.string().optional().default('US'),
});

// AI response schema for carbon analysis
const carbonResponseSchema = z.object({
  totalEmissions: z.number().min(0), // kg CO2e
  emissionsByCategory: z.array(z.object({
    category: z.string(),
    emissions: z.number().min(0),
    percentage: z.number().min(0).max(100),
    description: z.string(),
  })),
  transactionAnalysis: z.array(z.object({
    transactionId: z.string(),
    estimatedEmissions: z.number().min(0),
    emissionsFactor: z.number().min(0),
    confidence: z.number().min(0).max(100),
    reasoning: z.string(),
  })),
  offsetRecommendations: z.array(z.object({
    type: z.string(),
    cost: z.number().min(0),
    amount: z.number().min(0), // tonnes CO2e
    provider: z.string(),
    certification: z.string(),
    description: z.string(),
  })),
  greenAlternatives: z.array(z.object({
    category: z.string(),
    suggestion: z.string(),
    potentialSavings: z.number().min(0), // kg CO2e saved
    description: z.string(),
  })),
  insights: z.object({
    trend: z.enum(['increasing', 'decreasing', 'stable']),
    benchmark: z.string(), // comparison to average
    topEmitters: z.array(z.string()),
    recommendations: z.array(z.string()),
  }),
});

// Carbon emission factors database (simplified - in production, use comprehensive API)
const EMISSION_FACTORS = {
  // kg CO2e per USD spent
  'gas_station': 2.3,
  'airline': 0.5,
  'restaurant': 0.8,
  'grocery': 0.6,
  'retail': 0.4,
  'hotel': 1.2,
  'transportation': 1.5,
  'utilities': 2.0,
  'entertainment': 0.3,
  'healthcare': 0.2,
  'education': 0.1,
  'finance': 0.05,
  'digital': 0.02,
  'default': 0.4
};

// Authentication middleware
function authenticate(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing or invalid authorization header' };
  }
  return { valid: true };
}

// Rate limiting middleware
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

// Calculate basic emissions without AI (fallback)
function calculateBasicEmissions(transactions) {
  return transactions.map(transaction => {
    const category = transaction.category.toLowerCase();
    const emissionFactor = EMISSION_FACTORS[category] || EMISSION_FACTORS.default;
    const emissions = transaction.amount * emissionFactor;

    return {
      transactionId: transaction.id,
      estimatedEmissions: parseFloat(emissions.toFixed(2)),
      emissionsFactor: emissionFactor,
      confidence: 70, // Basic confidence level
      reasoning: `Estimated using ${category} emission factor of ${emissionFactor} kg CO2e per USD`
    };
  });
}

// Generate offset recommendations
function generateOffsetRecommendations(totalEmissions) {
  const offsetAmount = totalEmissions / 1000; // Convert to tonnes

  return [
    {
      type: 'Forest Conservation',
      cost: offsetAmount * 15,
      amount: offsetAmount,
      provider: 'Verified Carbon Standard',
      certification: 'VCS',
      description: 'Support forest conservation projects that prevent deforestation'
    },
    {
      type: 'Renewable Energy',
      cost: offsetAmount * 25,
      amount: offsetAmount,
      provider: 'Gold Standard',
      certification: 'Gold Standard',
      description: 'Fund renewable energy projects in developing countries'
    },
    {
      type: 'Carbon Capture',
      cost: offsetAmount * 40,
      amount: offsetAmount,
      provider: 'Climeworks',
      certification: 'Direct Air Capture',
      description: 'Direct air capture and permanent storage of CO2'
    }
  ];
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
    const parseResult = carbonAnalysisSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Please check your transaction data',
        details: parseResult.error.errors
      });
    }

    const { transactions, timeframe, userLocation } = parseResult.data;

    // Calculate basic emissions first
    const basicAnalysis = calculateBasicEmissions(transactions);
    const totalEmissions = basicAnalysis.reduce((sum, analysis) => sum + analysis.estimatedEmissions, 0);

    let aiEnhancedAnalysis = null;

    // Use AI for enhanced analysis if API key is available
    if (process.env.OPENAI_API_KEY) {
      try {
        const transactionSummary = transactions.map(t =>
          `${t.merchant} - ${t.category} - $${t.amount}`
        ).join('\n');

        const prompt = `As a carbon footprint expert, analyze these financial transactions for environmental impact:

${transactionSummary}

User location: ${userLocation}
Timeframe: ${timeframe}

Provide detailed carbon emissions analysis with:
1. Total emissions estimate in kg CO2e
2. Breakdown by category with percentages
3. Individual transaction analysis with confidence levels
4. Offset recommendations from verified providers
5. Green alternative suggestions
6. Trend insights and benchmarking

Consider regional factors, seasonal variations, and industry-specific emission factors. Be accurate and provide reasoning for estimates.`;

        const result = await generateObject({
          model: openai('gpt-4o'),
          schema: carbonResponseSchema,
          prompt,
          temperature: 0.2,
        });

        aiEnhancedAnalysis = result.object;
      } catch (aiError) {
        console.warn('AI analysis failed, using basic calculation:', aiError.message);
      }
    }

    // Prepare response
    const emissionsByCategory = {};
    transactions.forEach((transaction, index) => {
      const category = transaction.category;
      const emissions = basicAnalysis[index].estimatedEmissions;

      if (!emissionsByCategory[category]) {
        emissionsByCategory[category] = {
          category,
          emissions: 0,
          description: `Emissions from ${category} purchases`
        };
      }
      emissionsByCategory[category].emissions += emissions;
    });

    // Calculate percentages
    Object.values(emissionsByCategory).forEach(cat => {
      cat.percentage = parseFloat(((cat.emissions / totalEmissions) * 100).toFixed(1));
    });

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      timeframe,
      userLocation,
      summary: {
        totalTransactions: transactions.length,
        totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
        totalEmissions: parseFloat(totalEmissions.toFixed(2)),
        averageEmissionPerDollar: parseFloat((totalEmissions / transactions.reduce((sum, t) => sum + t.amount, 0)).toFixed(3))
      },
      analysis: aiEnhancedAnalysis || {
        totalEmissions: parseFloat(totalEmissions.toFixed(2)),
        emissionsByCategory: Object.values(emissionsByCategory),
        transactionAnalysis: basicAnalysis,
        offsetRecommendations: generateOffsetRecommendations(totalEmissions),
        greenAlternatives: [
          {
            category: 'Transportation',
            suggestion: 'Use public transport or electric vehicles',
            potentialSavings: totalEmissions * 0.3,
            description: 'Switch to low-carbon transportation options'
          },
          {
            category: 'Energy',
            suggestion: 'Choose renewable energy providers',
            potentialSavings: totalEmissions * 0.4,
            description: 'Switch to clean energy for your home and business'
          }
        ],
        insights: {
          trend: 'stable',
          benchmark: 'Above average carbon footprint for your region',
          topEmitters: Object.values(emissionsByCategory)
            .sort((a, b) => b.emissions - a.emissions)
            .slice(0, 3)
            .map(cat => cat.category),
          recommendations: [
            'Consider carbon offsets for high-emission purchases',
            'Look for green alternatives in your top emission categories',
            'Track your progress monthly to see improvement trends'
          ]
        }
      },
      metadata: {
        analysisMethod: aiEnhancedAnalysis ? 'AI-enhanced' : 'basic-calculation',
        dataQuality: aiEnhancedAnalysis ? 'high' : 'medium',
        lastUpdated: new Date().toISOString()
      }
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Carbon Analysis API Error:', error);

    if (error.message?.includes('rate limit') || error.status === 429) {
      return res.status(429).json({
        error: 'API rate limit exceeded',
        message: 'Too many requests to AI service. Please try again later.'
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred while analyzing carbon footprint',
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