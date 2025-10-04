import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Leaf,
  DollarSign,
  BarChart3,
  Target,
  Activity,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Info
} from 'lucide-react';
import { useDemoMode } from '../lib/demo-mode';

interface DashboardMetrics {
  totalPortfolioValue: number;
  totalReturns: number;
  avgESGScore: number;
  carbonFootprintReduction: number;
  activeInvestments: number;
  sustainabilityRating: string;
}

interface MarketData {
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

const GreenFinanceDashboard: React.FC = () => {
  const { isDemoMode, bannerText } = useDemoMode();

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalPortfolioValue: 48650.30,
    totalReturns: 12.7,
    avgESGScore: 84,
    carbonFootprintReduction: 3.7,
    activeInvestments: 8,
    sustainabilityRating: 'A+'
  });

  const [marketData, setMarketData] = useState<MarketData[]>([
    { name: 'Clean Energy ETF', value: 127.85, change: 2.34, changePercent: 1.87 },
    { name: 'ESG Global Fund', value: 89.12, change: -0.45, changePercent: -0.50 },
    { name: 'Renewable Tech', value: 156.78, change: 4.23, changePercent: 2.77 },
    { name: 'Sustainable Bonds', value: 98.45, change: 0.12, changePercent: 0.12 }
  ]);

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setMarketData(prev => prev.map(item => ({
        ...item,
        value: item.value + (Math.random() - 0.5) * 2,
        change: (Math.random() - 0.5) * 5,
        changePercent: (Math.random() - 0.5) * 3
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getChangeIcon = (change: number) => {
    return change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Demo Mode Banner */}
      {isDemoMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Info className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">{bannerText}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Green Finance Dashboard
        </h1>
        <p className="text-gray-600">
          AI-Powered Sustainable Investing on Bitcoin Network
        </p>
        {isDemoMode && (
          <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            ✅ Grant Review Ready - No API Keys Required
          </div>
        )}
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Portfolio Value */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Portfolio Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(metrics.totalPortfolioValue)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className={`text-sm font-medium ${getChangeColor(metrics.totalReturns)}`}>
              +{metrics.totalReturns}%
            </span>
            <span className="text-sm text-gray-500 ml-2">vs last month</span>
          </div>
        </div>

        {/* ESG Score */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average ESG Score</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.avgESGScore}/100</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <span className="text-sm font-medium text-green-600">
                Rating: {metrics.sustainabilityRating}
              </span>
              <Award className="w-4 h-4 text-yellow-500 ml-2" />
            </div>
          </div>
        </div>

        {/* Carbon Impact */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Carbon Reduction</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.carbonFootprintReduction} tons CO₂
              </p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-full">
              <Leaf className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-500">Annual reduction</span>
          </div>
        </div>
      </div>

      {/* Market Performance */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Market Performance</h2>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Activity className="w-4 h-4" />
            <span>Live Data</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {marketData.map((item, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">{item.name}</h3>
              <div className="space-y-1">
                <p className="text-lg font-bold text-gray-900">
                  ${item.value.toFixed(2)}
                </p>
                <div className={`flex items-center ${getChangeColor(item.change)}`}>
                  {getChangeIcon(item.change)}
                  <span className="text-sm font-medium ml-1">
                    {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center space-x-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg p-4 transition-colors">
            <BarChart3 className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-700">Analyze Company ESG</span>
          </button>

          <button className="flex items-center justify-center space-x-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg p-4 transition-colors">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-700">Get AI Recommendations</span>
          </button>

          <button className="flex items-center justify-center space-x-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg p-4 transition-colors">
            <Zap className="w-5 h-5 text-purple-600" />
            <span className="font-medium text-purple-700">Track Carbon Impact</span>
          </button>
        </div>
      </div>

      {/* Bitcoin Frontier Fund Feature Highlights */}
      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl shadow-lg border border-orange-200 p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            🚀 Bitcoin Frontier Fund Demo Ready
          </h2>
          <p className="text-gray-600">
            Complete sustainable finance platform built on sBTC
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-center">
              <div className="text-2xl mb-2">🧠</div>
              <h3 className="font-semibold text-gray-900">AI ESG Analysis</h3>
              <p className="text-sm text-gray-600 mt-1">Real-time sustainability scoring</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-center">
              <div className="text-2xl mb-2">₿</div>
              <h3 className="font-semibold text-gray-900">sBTC Integration</h3>
              <p className="text-sm text-gray-600 mt-1">Native Bitcoin payments</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-center">
              <div className="text-2xl mb-2">🌱</div>
              <h3 className="font-semibold text-gray-900">Carbon Tracking</h3>
              <p className="text-sm text-gray-600 mt-1">Environmental impact monitoring</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-center">
              <div className="text-2xl mb-2">📊</div>
              <h3 className="font-semibold text-gray-900">Investment Analytics</h3>
              <p className="text-sm text-gray-600 mt-1">Performance tracking & reporting</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-center">
              <div className="text-2xl mb-2">🎯</div>
              <h3 className="font-semibold text-gray-900">Fractional Investing</h3>
              <p className="text-sm text-gray-600 mt-1">Accessible green investments</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-center">
              <div className="text-2xl mb-2">📚</div>
              <h3 className="font-semibold text-gray-900">Grant Ready</h3>
              <p className="text-sm text-gray-600 mt-1">Complete documentation</p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <div className="inline-flex items-center space-x-2 bg-white rounded-full px-4 py-2 shadow-sm">
            <span className="text-sm font-medium text-gray-900">Market Opportunity:</span>
            <span className="text-sm font-bold text-green-600">$28.71T Green Finance + Bitcoin Ecosystem</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GreenFinanceDashboard;