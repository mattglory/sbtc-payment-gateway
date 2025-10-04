import React, { useState, useEffect } from 'react';
import {
  Leaf,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Download,
  Share2,
  RefreshCw,
  Calendar,
  DollarSign,
  Zap,
  Car,
  Home,
  ShoppingCart,
  Plane,
  Target,
  Award,
  TreePine,
  Lightbulb,
  ArrowRight,
  BarChart3,
  PieChart,
  Filter
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar
} from 'recharts';
import { clsx } from 'clsx';
import { format, subDays, subMonths } from 'date-fns';

const CarbonTracker = ({ transactions = [], sbtcBalance = 0, userId = null }) => {
  const [carbonData, setCarbonData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('month');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showOffsets, setShowOffsets] = useState(false);

  // Mock transaction data if none provided (for demo)
  const mockTransactions = [
    { id: '1', amount: 120, merchant: 'Shell Gas Station', category: 'gas_station', date: '2024-01-15', description: 'Fuel' },
    { id: '2', amount: 450, merchant: 'Delta Airlines', category: 'airline', date: '2024-01-14', description: 'Flight booking' },
    { id: '3', amount: 85, merchant: 'Whole Foods', category: 'grocery', date: '2024-01-13', description: 'Groceries' },
    { id: '4', amount: 35, merchant: 'Uber', category: 'transportation', date: '2024-01-12', description: 'Ride share' },
    { id: '5', amount: 180, merchant: 'Hotel Marriott', category: 'hotel', date: '2024-01-10', description: 'Business trip' },
    { id: '6', amount: 65, merchant: 'Electric Company', category: 'utilities', date: '2024-01-08', description: 'Monthly bill' },
  ];

  const displayTransactions = transactions.length > 0 ? transactions : mockTransactions;

  useEffect(() => {
    if (displayTransactions.length > 0) {
      analyzeCarbonFootprint();
    }
  }, [timeframe, displayTransactions]);

  const analyzeCarbonFootprint = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/green-finance/carbon-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo-token' // Replace with actual auth
        },
        body: JSON.stringify({
          transactions: displayTransactions,
          timeframe,
          userLocation: 'US'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Carbon analysis failed');
      }

      setCarbonData(data);
    } catch (err) {
      console.error('Carbon analysis error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      gas_station: Car,
      airline: Plane,
      grocery: ShoppingCart,
      transportation: Car,
      hotel: Home,
      utilities: Zap,
      restaurant: ShoppingCart,
      retail: ShoppingCart,
      entertainment: Award
    };
    return icons[category] || ShoppingCart;
  };

  const formatEmissions = (kg) => {
    if (kg >= 1000) {
      return `${(kg / 1000).toFixed(2)} tonnes`;
    }
    return `${kg.toFixed(2)} kg`;
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'increasing': return TrendingUp;
      case 'decreasing': return TrendingDown;
      default: return BarChart3;
    }
  };

  const generateTimeSeriesData = () => {
    const days = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 90;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const emissions = Math.random() * 15 + 5; // Mock data
      data.push({
        date: format(date, 'MMM dd'),
        emissions: parseFloat(emissions.toFixed(2)),
        cumulative: data.length > 0 ? data[data.length - 1].cumulative + emissions : emissions
      });
    }
    return data;
  };

  const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'];

  if (isLoading) {
    return <CarbonLoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                <Leaf className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Carbon Impact Tracker</h1>
                <p className="text-gray-600">AI-powered emissions analysis for your transactions</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="quarter">Last Quarter</option>
              </select>

              <button
                onClick={analyzeCarbonFootprint}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <p className="text-red-600 font-medium">Analysis Failed</p>
            </div>
            <p className="text-red-500 text-sm mt-1">{error}</p>
          </div>
        )}

        {carbonData && (
          <div className="space-y-8 animate-fade-in">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-red-600">
                      {formatEmissions(carbonData.analysis.totalEmissions)}
                    </div>
                    <div className="text-sm text-gray-500">CO₂e</div>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Emissions</h3>
                <p className="text-sm text-gray-600">
                  From {carbonData.summary.totalTransactions} transactions
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      ${carbonData.summary.totalAmount.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">Analyzed</div>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Spending</h3>
                <p className="text-sm text-gray-600">
                  {carbonData.summary.averageEmissionPerDollar.toFixed(3)} kg CO₂e per $
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                    <TreePine className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      ${carbonData.analysis.offsetRecommendations[0]?.cost.toFixed(0) || 0}
                    </div>
                    <div className="text-sm text-gray-500">Offset Cost</div>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Carbon Offset</h3>
                <p className="text-sm text-gray-600">
                  To neutralize your footprint
                </p>
              </div>

              {sbtcBalance > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-orange-600">
                        {sbtcBalance.toFixed(4)}
                      </div>
                      <div className="text-sm text-gray-500">sBTC</div>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Green Rewards</h3>
                  <p className="text-sm text-gray-600">
                    Available for eco investments
                  </p>
                </div>
              )}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Emissions Timeline */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Emissions Timeline</h3>
                  <div className="flex items-center space-x-2 text-sm">
                    {React.createElement(getTrendIcon(carbonData.analysis.insights.trend), {
                      className: `w-4 h-4 ${carbonData.analysis.insights.trend === 'decreasing' ? 'text-green-600' : 'text-orange-600'}`
                    })}
                    <span className="capitalize text-gray-600">{carbonData.analysis.insights.trend}</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={generateTimeSeriesData()}>
                    <defs>
                      <linearGradient id="emissionsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="date" stroke="#6B7280" />
                    <YAxis stroke="#6B7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value) => [`${value} kg CO₂e`, 'Emissions']}
                    />
                    <Area
                      type="monotone"
                      dataKey="emissions"
                      stroke="#10B981"
                      strokeWidth={2}
                      fill="url(#emissionsGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Category Breakdown */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Emissions by Category</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={carbonData.analysis.emissionsByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="emissions"
                    >
                      {carbonData.analysis.emissionsByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${formatEmissions(value)}`, 'Emissions']}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {carbonData.analysis.emissionsByCategory.slice(0, 4).map((category, index) => (
                    <div key={category.category} className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm text-gray-600 truncate">
                        {category.category} ({category.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Transaction Analysis */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">Transaction Impact Analysis</h3>
                  <button
                    onClick={() => setShowOffsets(!showOffsets)}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <TreePine className="w-4 h-4" />
                    <span>Show Offsets</span>
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
                  {carbonData.analysis.transactionAnalysis.map((analysis, index) => {
                    const transaction = displayTransactions.find(t => t.id === analysis.transactionId);
                    const CategoryIcon = getCategoryIcon(transaction?.category);

                    return (
                      <div key={analysis.transactionId} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <CategoryIcon className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{transaction?.merchant}</p>
                            <p className="text-sm text-gray-600">${transaction?.amount} • {transaction?.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-red-600">
                            {formatEmissions(analysis.estimatedEmissions)}
                          </p>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <p className="text-xs text-gray-500">{analysis.confidence}% confidence</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Offset Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Carbon Offset Options</h3>
                <div className="space-y-4">
                  {carbonData.analysis.offsetRecommendations.map((offset, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-xl hover:border-green-300 transition-colors cursor-pointer group">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                          {offset.type}
                        </h4>
                        <div className="text-right">
                          <p className="font-bold text-green-600">${offset.cost.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">{offset.amount.toFixed(2)} tonnes</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{offset.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full">
                          {offset.certification}
                        </span>
                        {sbtcBalance > 0 && (
                          <button className="text-xs text-blue-600 hover:text-blue-700 flex items-center space-x-1">
                            <span>Pay with sBTC</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Green Alternatives */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Green Alternatives</h3>
                <div className="space-y-4">
                  {carbonData.analysis.greenAlternatives.map((alternative, index) => (
                    <div key={index} className="p-4 bg-green-50 rounded-xl border border-green-100">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Lightbulb className="w-5 h-5 text-green-600" />
                          <h4 className="font-semibold text-gray-900">{alternative.category}</h4>
                        </div>
                        <span className="text-sm font-semibold text-green-600">
                          -{formatEmissions(alternative.potentialSavings)} saved
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{alternative.suggestion}</p>
                      <p className="text-xs text-gray-600">{alternative.description}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl border border-blue-100">
                  <h4 className="font-semibold text-gray-900 mb-2">AI Insights</h4>
                  <ul className="space-y-1">
                    {carbonData.analysis.insights.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 border border-green-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                Take Action on Your Carbon Impact
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <button className="flex flex-col items-center justify-center space-y-2 px-6 py-4 bg-white text-green-600 rounded-xl shadow-sm hover:shadow-md transition-all border border-green-200 hover:border-green-300 group">
                  <TreePine className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span className="font-medium">Buy Offsets</span>
                  <span className="text-xs text-gray-500">Neutralize impact</span>
                </button>
                <button className="flex flex-col items-center justify-center space-y-2 px-6 py-4 bg-green-600 text-white rounded-xl shadow-sm hover:shadow-md hover:bg-green-700 transition-all group">
                  <Award className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span className="font-medium">Green Investments</span>
                  <span className="text-xs opacity-90">Earn while helping</span>
                </button>
                <button className="flex flex-col items-center justify-center space-y-2 px-6 py-4 bg-white text-blue-600 rounded-xl shadow-sm hover:shadow-md transition-all border border-blue-200 hover:border-blue-300 group">
                  <Download className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span className="font-medium">Export Report</span>
                  <span className="text-xs text-gray-500">PDF & CSV</span>
                </button>
                <button className="flex flex-col items-center justify-center space-y-2 px-6 py-4 bg-white text-purple-600 rounded-xl shadow-sm hover:shadow-md transition-all border border-purple-200 hover:border-purple-300 group">
                  <Share2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span className="font-medium">Share Progress</span>
                  <span className="text-xs text-gray-500">Social impact</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Loading skeleton component
const CarbonLoadingSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 md:p-8">
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
        <div className="animate-pulse">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
            <div className="space-y-2">
              <div className="h-6 bg-gray-200 rounded w-48"></div>
              <div className="h-4 bg-gray-200 rounded w-64"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                <div className="space-y-1">
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                  <div className="h-3 bg-gray-200 rounded w-12"></div>
                </div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {[1, 2].map(i => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-32 mb-6"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default CarbonTracker;