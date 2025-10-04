import React, { useState, useEffect } from 'react';
import {
  Bot,
  TrendingUp,
  Target,
  Star,
  DollarSign,
  Leaf,
  BarChart3,
  Shield,
  Zap,
  RefreshCw,
  ChevronRight
} from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

interface Investment {
  symbol: string;
  name: string;
  type: 'stocks' | 'etf' | 'bonds' | 'crypto';
  esgScore: number;
  expectedReturn: number;
  riskLevel: 'low' | 'medium' | 'high';
  sustainabilityFocus: string[];
  currentPrice: number;
  recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell';
  reasoning: string;
  carbonImpact: number;
}

interface PortfolioRecommendation {
  title: string;
  description: string;
  targetAllocation: {
    stocks: number;
    bonds: number;
    etfs: number;
    crypto: number;
  };
  expectedReturn: number;
  riskLevel: 'conservative' | 'moderate' | 'aggressive';
  esgAlignment: number;
  investments: Investment[];
}

const AIRecommendations: React.FC = () => {
  const { actualTheme: theme } = useTheme();
  const [recommendations, setRecommendations] = useState<PortfolioRecommendation[]>([]);
  const [selectedRecommendation, setSelectedRecommendation] = useState<PortfolioRecommendation | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userPreferences, setUserPreferences] = useState({
    riskTolerance: 'moderate',
    investmentAmount: 10000,
    sustainabilityFocus: ['renewable_energy', 'clean_tech']
  });

  const mockRecommendations: PortfolioRecommendation[] = [
    {
      title: 'Green Tech Growth Portfolio',
      description: 'AI-optimized portfolio focusing on high-growth sustainable technology companies with strong ESG fundamentals.',
      targetAllocation: {
        stocks: 60,
        bonds: 20,
        etfs: 15,
        crypto: 5
      },
      expectedReturn: 12.5,
      riskLevel: 'moderate',
      esgAlignment: 92,
      investments: [
        {
          symbol: 'TSLA',
          name: 'Tesla Inc.',
          type: 'stocks',
          esgScore: 85,
          expectedReturn: 15.2,
          riskLevel: 'high',
          sustainabilityFocus: ['electric_vehicles', 'clean_energy'],
          currentPrice: 248.50,
          recommendation: 'buy',
          reasoning: 'Leading EV manufacturer with expanding energy storage business and strong ESG fundamentals.',
          carbonImpact: -2.1
        },
        {
          symbol: 'ICLN',
          name: 'iShares Global Clean Energy ETF',
          type: 'etf',
          esgScore: 88,
          expectedReturn: 11.8,
          riskLevel: 'medium',
          sustainabilityFocus: ['renewable_energy', 'solar', 'wind'],
          currentPrice: 21.45,
          recommendation: 'strong_buy',
          reasoning: 'Diversified exposure to global clean energy sector with consistent performance.',
          carbonImpact: -1.8
        },
        {
          symbol: 'ESG',
          name: 'FlexShares STOXX US ESG Select Index Fund',
          type: 'etf',
          esgScore: 91,
          expectedReturn: 10.5,
          riskLevel: 'medium',
          sustainabilityFocus: ['broad_esg', 'sustainable_practices'],
          currentPrice: 98.23,
          recommendation: 'buy',
          reasoning: 'Broad market exposure with strong ESG screening and sustainable investment practices.',
          carbonImpact: -1.2
        }
      ]
    },
    {
      title: 'Sustainable Income Portfolio',
      description: 'Conservative approach focusing on dividend-paying sustainable companies and green bonds for steady income.',
      targetAllocation: {
        stocks: 40,
        bonds: 45,
        etfs: 15,
        crypto: 0
      },
      expectedReturn: 8.2,
      riskLevel: 'conservative',
      esgAlignment: 89,
      investments: [
        {
          symbol: 'JNJ',
          name: 'Johnson & Johnson',
          type: 'stocks',
          esgScore: 82,
          expectedReturn: 8.5,
          riskLevel: 'low',
          sustainabilityFocus: ['healthcare', 'social_impact'],
          currentPrice: 162.30,
          recommendation: 'hold',
          reasoning: 'Stable healthcare giant with strong ESG practices and consistent dividend payments.',
          carbonImpact: -0.5
        }
      ]
    }
  ];

  const generateRecommendations = async () => {
    setIsGenerating(true);

    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 3000));

    setRecommendations(mockRecommendations);
    setSelectedRecommendation(mockRecommendations[0]);
    setIsGenerating(false);
  };

  useEffect(() => {
    generateRecommendations();
  }, []);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
      case 'conservative':
        return 'text-green-600';
      case 'medium':
      case 'moderate':
        return 'text-yellow-600';
      case 'high':
      case 'aggressive':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'strong_buy':
        return 'text-green-700 bg-green-100';
      case 'buy':
        return 'text-green-600 bg-green-50';
      case 'hold':
        return 'text-yellow-600 bg-yellow-50';
      case 'sell':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`rounded-xl shadow-lg border p-6 ${
        theme === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Bot className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                AI Investment Recommendations
              </h2>
              <p className={`${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Personalized sustainable investment strategies powered by machine learning
              </p>
            </div>
          </div>

          <button
            onClick={generateRecommendations}
            disabled={isGenerating}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Generating...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Portfolio Recommendations */}
      {recommendations.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recommendation List */}
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedRecommendation === rec
                    ? theme === 'dark'
                      ? 'bg-purple-900 border-purple-600'
                      : 'bg-purple-50 border-purple-300'
                    : theme === 'dark'
                      ? 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedRecommendation(rec)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {rec.title}
                  </h3>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>

                <p className={`text-sm mb-3 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {rec.description}
                </p>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                      Expected Return:
                    </span>
                    <span className="text-green-600 font-medium">
                      {rec.expectedReturn}%
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                      Risk Level:
                    </span>
                    <span className={`font-medium ${getRiskColor(rec.riskLevel)}`}>
                      {rec.riskLevel}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                      ESG Score:
                    </span>
                    <span className="text-green-600 font-medium">
                      {rec.esgAlignment}/100
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detailed View */}
          {selectedRecommendation && (
            <div className="lg:col-span-2 space-y-6">
              {/* Portfolio Overview */}
              <div className={`rounded-xl shadow-lg border p-6 ${
                theme === 'dark'
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-white border-gray-200'
              }`}>
                <h3 className={`text-xl font-bold mb-4 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {selectedRecommendation.title}
                </h3>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className={`p-3 rounded-lg ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <div className="flex items-center space-x-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className={`text-xs ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Expected Return
                      </span>
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      {selectedRecommendation.expectedReturn}%
                    </div>
                  </div>

                  <div className={`p-3 rounded-lg ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <div className="flex items-center space-x-2 mb-1">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <span className={`text-xs ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Risk Level
                      </span>
                    </div>
                    <div className={`text-lg font-bold ${getRiskColor(selectedRecommendation.riskLevel)}`}>
                      {selectedRecommendation.riskLevel}
                    </div>
                  </div>

                  <div className={`p-3 rounded-lg ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <div className="flex items-center space-x-2 mb-1">
                      <Leaf className="w-4 h-4 text-green-600" />
                      <span className={`text-xs ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        ESG Score
                      </span>
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      {selectedRecommendation.esgAlignment}
                    </div>
                  </div>

                  <div className={`p-3 rounded-lg ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <div className="flex items-center space-x-2 mb-1">
                      <Target className="w-4 h-4 text-purple-600" />
                      <span className={`text-xs ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Holdings
                      </span>
                    </div>
                    <div className={`text-lg font-bold ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {selectedRecommendation.investments.length}
                    </div>
                  </div>
                </div>

                {/* Asset Allocation */}
                <div className="mb-6">
                  <h4 className={`text-sm font-medium mb-3 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Target Allocation
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(selectedRecommendation.targetAllocation).map(([type, percentage]) => (
                      <div key={type} className="text-center">
                        <div className={`text-lg font-bold ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {percentage}%
                        </div>
                        <div className={`text-xs capitalize ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {type}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Individual Investments */}
              <div className={`rounded-xl shadow-lg border p-6 ${
                theme === 'dark'
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-white border-gray-200'
              }`}>
                <h4 className={`text-lg font-semibold mb-4 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Recommended Investments
                </h4>

                <div className="space-y-4">
                  {selectedRecommendation.investments.map((investment, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h5 className={`font-semibold ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            {investment.name} ({investment.symbol})
                          </h5>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className={`text-sm ${
                              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                            }`}>
                              ${investment.currentPrice}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${getRecommendationColor(investment.recommendation)}`}>
                              {investment.recommendation.replace('_', ' ')}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-green-600 font-bold">
                            +{investment.expectedReturn}%
                          </div>
                          <div className={`text-sm ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            ESG: {investment.esgScore}
                          </div>
                        </div>
                      </div>

                      <p className={`text-sm mb-3 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {investment.reasoning}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Leaf className="w-4 h-4 text-green-600" />
                          <span className={`text-sm ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            Carbon Impact: {investment.carbonImpact} tons CO₂
                          </span>
                        </div>

                        <div className="flex space-x-2">
                          {investment.sustainabilityFocus.slice(0, 2).map((focus, i) => (
                            <span
                              key={i}
                              className={`text-xs px-2 py-1 rounded-full ${
                                theme === 'dark'
                                  ? 'bg-green-900 text-green-300'
                                  : 'bg-green-100 text-green-700'
                              }`}
                            >
                              {focus.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIRecommendations;