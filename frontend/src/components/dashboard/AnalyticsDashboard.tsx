import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Target,
  Zap,
  Globe,
  Users
} from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { CustomLineChart, CustomAreaChart, CustomBarChart, CustomPieChart } from '../ui/Charts';

interface AnalyticsData {
  portfolioPerformance: Array<{
    name: string;
    value: number;
    esgScore: number;
    carbonImpact: number;
  }>;
  sectorAllocation: Array<{
    name: string;
    value: number;
    percentage: number;
  }>;
  esgTrends: Array<{
    name: string;
    environmental: number;
    social: number;
    governance: number;
    overall: number;
  }>;
  carbonReduction: Array<{
    name: string;
    reduction: number;
    cumulative: number;
  }>;
  investmentFlow: Array<{
    name: string;
    inflow: number;
    outflow: number;
    net: number;
  }>;
}

const AnalyticsDashboard: React.FC = () => {
  const { actualTheme: theme } = useTheme();
  const [timeRange, setTimeRange] = useState<'1M' | '3M' | '6M' | '1Y' | 'ALL'>('6M');
  const [selectedMetric, setSelectedMetric] = useState<'performance' | 'esg' | 'carbon' | 'flow'>('performance');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    portfolioPerformance: [
      { name: 'Jan', value: 85000, esgScore: 78, carbonImpact: -2.1 },
      { name: 'Feb', value: 88500, esgScore: 81, carbonImpact: -2.8 },
      { name: 'Mar', value: 92000, esgScore: 83, carbonImpact: -3.2 },
      { name: 'Apr', value: 89750, esgScore: 85, carbonImpact: -3.9 },
      { name: 'May', value: 96200, esgScore: 87, carbonImpact: -4.5 },
      { name: 'Jun', value: 102847, esgScore: 89, carbonImpact: -5.1 }
    ],
    sectorAllocation: [
      { name: 'Clean Energy', value: 35, percentage: 35 },
      { name: 'Technology', value: 25, percentage: 25 },
      { name: 'Healthcare', value: 15, percentage: 15 },
      { name: 'Sustainable Transport', value: 12, percentage: 12 },
      { name: 'Green Bonds', value: 8, percentage: 8 },
      { name: 'Crypto (sBTC)', value: 5, percentage: 5 }
    ],
    esgTrends: [
      { name: 'Jan', environmental: 75, social: 72, governance: 68, overall: 72 },
      { name: 'Feb', environmental: 78, social: 74, governance: 71, overall: 74 },
      { name: 'Mar', environmental: 82, social: 76, governance: 73, overall: 77 },
      { name: 'Apr', environmental: 85, social: 79, governance: 75, overall: 80 },
      { name: 'May', environmental: 88, social: 82, governance: 78, overall: 83 },
      { name: 'Jun', environmental: 91, social: 85, governance: 81, overall: 86 }
    ],
    carbonReduction: [
      { name: 'Jan', reduction: -1.2, cumulative: -1.2 },
      { name: 'Feb', reduction: -1.8, cumulative: -3.0 },
      { name: 'Mar', reduction: -2.1, cumulative: -5.1 },
      { name: 'Apr', reduction: -1.9, cumulative: -7.0 },
      { name: 'May', reduction: -2.4, cumulative: -9.4 },
      { name: 'Jun', reduction: -2.7, cumulative: -12.1 }
    ],
    investmentFlow: [
      { name: 'Week 1', inflow: 15000, outflow: 2000, net: 13000 },
      { name: 'Week 2', inflow: 18500, outflow: 3500, net: 15000 },
      { name: 'Week 3', inflow: 22000, outflow: 1500, net: 20500 },
      { name: 'Week 4', inflow: 16800, outflow: 4200, net: 12600 }
    ]
  });

  const refreshData = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };

  const exportData = () => {
    // Simulate data export
    console.log('Exporting analytics data...');
  };

  const getMetricTitle = () => {
    switch (selectedMetric) {
      case 'performance':
        return 'Portfolio Performance';
      case 'esg':
        return 'ESG Score Trends';
      case 'carbon':
        return 'Carbon Impact Reduction';
      case 'flow':
        return 'Investment Flow';
      default:
        return 'Analytics';
    }
  };

  const renderMainChart = () => {
    switch (selectedMetric) {
      case 'performance':
        return (
          <CustomAreaChart
            data={analyticsData.portfolioPerformance}
            dataKey="value"
            height={350}
            color="#10B981"
          />
        );
      case 'esg':
        return (
          <CustomLineChart
            data={analyticsData.esgTrends}
            dataKey="overall"
            height={350}
            color="#3B82F6"
          />
        );
      case 'carbon':
        return (
          <CustomBarChart
            data={analyticsData.carbonReduction}
            dataKey="reduction"
            height={350}
            color="#059669"
          />
        );
      case 'flow':
        return (
          <CustomBarChart
            data={analyticsData.investmentFlow}
            dataKey="net"
            height={350}
            color="#8B5CF6"
          />
        );
      default:
        return null;
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Analytics Dashboard
              </h2>
              <p className={`${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Comprehensive insights into your green investment performance
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={exportData}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className={`text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Metric:
              </span>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value as any)}
                className={`px-3 py-1 rounded-lg border text-sm ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="performance">Portfolio Performance</option>
                <option value="esg">ESG Trends</option>
                <option value="carbon">Carbon Impact</option>
                <option value="flow">Investment Flow</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className={`text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Period:
              </span>
              <div className="flex space-x-1">
                {['1M', '3M', '6M', '1Y', 'ALL'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range as any)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      timeRange === range
                        ? 'bg-blue-600 text-white'
                        : theme === 'dark'
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`rounded-xl shadow-lg border p-6 ${
          theme === 'dark'
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-2xl font-bold text-green-600">
              +15.0%
            </span>
          </div>
          <h3 className={`text-sm font-medium ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Total Return
          </h3>
          <p className={`text-lg font-bold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            $13,415
          </p>
        </div>

        <div className={`rounded-xl shadow-lg border p-6 ${
          theme === 'dark'
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-2xl font-bold text-blue-600">
              86
            </span>
          </div>
          <h3 className={`text-sm font-medium ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Average ESG Score
          </h3>
          <p className={`text-lg font-bold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            A+ Rating
          </p>
        </div>

        <div className={`rounded-xl shadow-lg border p-6 ${
          theme === 'dark'
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <TrendingDown className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-2xl font-bold text-emerald-600">
              -12.1
            </span>
          </div>
          <h3 className={`text-sm font-medium ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Carbon Reduction
          </h3>
          <p className={`text-lg font-bold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            tons CO₂
          </p>
        </div>

        <div className={`rounded-xl shadow-lg border p-6 ${
          theme === 'dark'
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-2xl font-bold text-purple-600">
              8.5%
            </span>
          </div>
          <h3 className={`text-sm font-medium ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            sBTC Staking APR
          </h3>
          <p className={`text-lg font-bold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            0.0234 sBTC earned
          </p>
        </div>
      </div>

      {/* Main Chart */}
      <div className={`rounded-xl shadow-lg border p-6 ${
        theme === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          {getMetricTitle()}
        </h3>
        {renderMainChart()}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sector Allocation */}
        <div className={`rounded-xl shadow-lg border p-6 ${
          theme === 'dark'
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Sector Allocation
          </h3>
          <CustomPieChart
            data={analyticsData.sectorAllocation}
            dataKey="value"
            nameKey="name"
            height={300}
            colors={['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316']}
          />
        </div>

        {/* ESG Breakdown */}
        <div className={`rounded-xl shadow-lg border p-6 ${
          theme === 'dark'
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            ESG Score Breakdown
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-green-600 rounded"></div>
                <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                  Environmental
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '91%' }}></div>
                </div>
                <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  91
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-blue-600 rounded"></div>
                <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                  Social
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
                <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  85
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-purple-600 rounded"></div>
                <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                  Governance
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '81%' }}></div>
                </div>
                <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  81
                </span>
              </div>
            </div>
          </div>

          <div className={`mt-6 p-4 rounded-lg ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`font-medium ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Overall ESG Score
              </span>
              <span className="text-2xl font-bold text-green-600">86</span>
            </div>
            <p className={`text-sm mt-1 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Excellent sustainability performance
            </p>
          </div>
        </div>
      </div>

      {/* Insights & Recommendations */}
      <div className={`rounded-xl shadow-lg border p-6 ${
        theme === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 flex items-center space-x-2 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          <Globe className="w-5 h-5 text-blue-600" />
          <span>Key Insights</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-green-50'
          }`}>
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className={`font-medium ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Strong Performance
              </span>
            </div>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Your portfolio has outperformed the market by 7.3% while maintaining high ESG standards.
            </p>
          </div>

          <div className={`p-4 rounded-lg ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-blue-50'
          }`}>
            <div className="flex items-center space-x-2 mb-2">
              <Target className="w-4 h-4 text-blue-600" />
              <span className={`font-medium ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                ESG Leader
              </span>
            </div>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Your average ESG score of 86 places you in the top 15% of sustainable investors.
            </p>
          </div>

          <div className={`p-4 rounded-lg ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-emerald-50'
          }`}>
            <div className="flex items-center space-x-2 mb-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <span className={`font-medium ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Carbon Impact
              </span>
            </div>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Your investments have contributed to reducing 12.1 tons of CO₂, equivalent to planting 156 trees.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;