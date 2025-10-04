import React, { useState, useEffect } from 'react';
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Target,
  Lightbulb,
  Star,
  Activity,
  ChevronRight,
  RefreshCw,
  Zap,
  Award,
  Shield,
  Leaf,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  XCircle,
  Sparkles
} from 'lucide-react';
import { clsx } from 'clsx';

const AIInsightsSidebar = ({ portfolioData, sustainabilityData, isLoading }) => {
  const [insights, setInsights] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [aiAnalysis, setAIAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    generateAIInsights();
  }, [portfolioData, sustainabilityData]);

  const generateAIInsights = async () => {
    setIsAnalyzing(true);

    // Simulate AI analysis with realistic insights
    setTimeout(() => {
      const newInsights = [
        {
          id: 1,
          type: 'opportunity',
          title: 'Green Bond Opportunity',
          description: 'Your portfolio could benefit from 15% green bond allocation',
          confidence: 0.87,
          impact: 'medium',
          action: 'Explore green bonds',
          priority: 'high',
          category: 'allocation'
        },
        {
          id: 2,
          type: 'risk',
          title: 'ESG Risk Alert',
          description: 'TSLA showing increased governance risk metrics',
          confidence: 0.72,
          impact: 'low',
          action: 'Monitor closely',
          priority: 'medium',
          category: 'risk'
        },
        {
          id: 3,
          type: 'performance',
          title: 'Outperforming Market',
          description: 'Your ESG strategy is beating S&P 500 by 3.2%',
          confidence: 0.94,
          impact: 'high',
          action: 'Continue strategy',
          priority: 'low',
          category: 'performance'
        },
        {
          id: 4,
          type: 'sustainability',
          title: 'Carbon Goal Progress',
          description: 'On track to achieve carbon neutrality 2 months early',
          confidence: 0.89,
          impact: 'high',
          action: 'Set new targets',
          priority: 'medium',
          category: 'sustainability'
        }
      ];

      const newRecommendations = [
        {
          id: 1,
          title: 'Increase Clean Energy Allocation',
          description: 'AI analysis suggests increasing clean energy ETF allocation to 40%',
          expectedReturn: '+2.3%',
          esgImpact: '+12 points',
          confidence: 0.85,
          timeframe: '3-6 months',
          riskLevel: 'low'
        },
        {
          id: 2,
          title: 'Diversify ESG Sectors',
          description: 'Add sustainable agriculture and water management investments',
          expectedReturn: '+1.8%',
          esgImpact: '+8 points',
          confidence: 0.78,
          timeframe: '6-12 months',
          riskLevel: 'medium'
        },
        {
          id: 3,
          title: 'Carbon Offset Strategy',
          description: 'Purchase verified carbon credits to accelerate carbon neutrality',
          expectedReturn: 'N/A',
          esgImpact: '+25 points',
          confidence: 0.92,
          timeframe: '1-3 months',
          riskLevel: 'low'
        }
      ];

      setInsights(newInsights);
      setRecommendations(newRecommendations);
      setAIAnalysis({
        overallScore: 87,
        portfolioHealth: 'excellent',
        sustainabilityTrend: 'improving',
        riskLevel: 'low',
        nextReviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
      setIsAnalyzing(false);
    }, 2000);
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case 'opportunity': return TrendingUp;
      case 'risk': return AlertTriangle;
      case 'performance': return Star;
      case 'sustainability': return Leaf;
      default: return Lightbulb;
    }
  };

  const getInsightColor = (type, priority) => {
    if (type === 'risk') return 'from-red-500 to-orange-500';
    if (type === 'opportunity') return 'from-green-500 to-emerald-500';
    if (type === 'performance') return 'from-blue-500 to-indigo-500';
    if (type === 'sustainability') return 'from-green-400 to-teal-500';
    return 'from-purple-500 to-pink-500';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const ConfidenceBar = ({ confidence }) => (
    <div className="w-full bg-gray-200 rounded-full h-1.5">
      <div
        className={clsx(
          'h-1.5 rounded-full transition-all duration-1000',
          confidence >= 0.8 ? 'bg-green-500' :
          confidence >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
        )}
        style={{ width: `${confidence * 100}%` }}
      />
    </div>
  );

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
            <div className="h-6 bg-gray-200 rounded w-32"></div>
          </div>
          {[1, 2, 3].map(i => (
            <div key={i} className="p-4 border border-gray-200 rounded-lg space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Analysis Overview */}
      <div className="bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="ai-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="1" fill="white"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#ai-pattern)"/>
          </svg>
        </div>

        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">AI Portfolio Analysis</h3>
                <p className="text-blue-100 text-sm">Powered by advanced ESG algorithms</p>
              </div>
            </div>
            <button
              onClick={generateAIInsights}
              disabled={isAnalyzing}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={clsx('w-5 h-5', isAnalyzing && 'animate-spin')} />
            </button>
          </div>

          {aiAnalysis && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-3xl font-bold">{aiAnalysis.overallScore}</div>
                <div className="text-sm text-blue-100">AI Confidence Score</div>
              </div>
              <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-lg font-semibold capitalize">{aiAnalysis.portfolioHealth}</div>
                <div className="text-sm text-blue-100">Portfolio Health</div>
              </div>
            </div>
          )}

          {isAnalyzing && (
            <div className="mt-4 flex items-center space-x-2 text-blue-100">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span className="text-sm">Analyzing your portfolio with AI...</span>
            </div>
          )}
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">AI Insights</h3>
          <Lightbulb className="w-5 h-5 text-yellow-500" />
        </div>

        <div className="space-y-4">
          {insights.map((insight) => {
            const IconComponent = getInsightIcon(insight.type);
            return (
              <div
                key={insight.id}
                className="p-4 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors group cursor-pointer"
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 bg-gradient-to-br ${getInsightColor(insight.type)} rounded-lg flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <IconComponent className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 truncate">{insight.title}</h4>
                      <span className={clsx(
                        'px-2 py-1 rounded-full text-xs font-medium border',
                        getPriorityColor(insight.priority)
                      )}>
                        {insight.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{insight.description}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div>
                          <span className="font-medium">Confidence:</span>
                          <span className="ml-1">{Math.round(insight.confidence * 100)}%</span>
                        </div>
                        <div className="w-16">
                          <ConfidenceBar confidence={insight.confidence} />
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Smart Recommendations</h3>
          <Target className="w-5 h-5 text-green-500" />
        </div>

        <div className="space-y-4">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200 hover:border-green-300 transition-colors group"
            >
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                <div className="flex items-center space-x-1 text-green-600">
                  <ArrowUpRight className="w-4 h-4" />
                  <span className="text-sm font-medium">{rec.expectedReturn}</span>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4">{rec.description}</p>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">ESG Impact:</span>
                    <span className="font-medium text-green-600">{rec.esgImpact}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Timeframe:</span>
                    <span className="font-medium">{rec.timeframe}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Risk Level:</span>
                    <span className={clsx(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      rec.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                      rec.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    )}>
                      {rec.riskLevel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Confidence:</span>
                    <span className="font-medium">{Math.round(rec.confidence * 100)}%</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-green-200">
                <button className="w-full bg-green-500 hover:bg-green-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors group-hover:bg-green-600">
                  Implement Recommendation
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick AI Actions */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-2xl p-6 text-white">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">AI Quick Actions</h3>
            <p className="text-gray-300 text-sm">One-click AI-powered operations</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <button className="flex items-center justify-between p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors group">
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <span className="font-medium">Run Portfolio Analysis</span>
            </div>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button className="flex items-center justify-between p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors group">
            <div className="flex items-center space-x-3">
              <Target className="w-5 h-5 text-green-400" />
              <span className="font-medium">Optimize ESG Allocation</span>
            </div>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button className="flex items-center justify-between p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors group">
            <div className="flex items-center space-x-3">
              <Activity className="w-5 h-5 text-purple-400" />
              <span className="font-medium">Generate Risk Report</span>
            </div>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button className="flex items-center justify-between p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors group">
            <div className="flex items-center space-x-3">
              <Leaf className="w-5 h-5 text-green-400" />
              <span className="font-medium">Calculate Carbon Offsets</span>
            </div>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIInsightsSidebar;