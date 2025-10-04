import React, { useState, useEffect } from 'react';
import {
  PieChart,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Activity,
  Plus,
  Filter,
  Download,
  RefreshCw,
  Eye,
  BarChart3,
  Leaf,
  Bitcoin
} from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

interface Investment {
  id: string;
  symbol: string;
  name: string;
  type: 'stock' | 'etf' | 'bond' | 'crypto';
  quantity: number;
  currentPrice: number;
  purchasePrice: number;
  value: number;
  change: number;
  changePercent: number;
  esgScore: number;
  carbonImpact: number;
  lastUpdated: string;
}

interface PortfolioMetrics {
  totalValue: number;
  totalReturn: number;
  totalReturnPercent: number;
  todayChange: number;
  todayChangePercent: number;
  avgESGScore: number;
  totalCarbonImpact: number;
}

const InvestmentPortfolio: React.FC = () => {
  const { actualTheme: theme } = useTheme();
  const [investments, setInvestments] = useState<Investment[]>([
    {
      id: '1',
      symbol: 'TSLA',
      name: 'Tesla Inc.',
      type: 'stock',
      quantity: 10,
      currentPrice: 248.50,
      purchasePrice: 220.00,
      value: 2485.00,
      change: 285.00,
      changePercent: 12.95,
      esgScore: 85,
      carbonImpact: -2.1,
      lastUpdated: new Date().toISOString()
    },
    {
      id: '2',
      symbol: 'ICLN',
      name: 'iShares Global Clean Energy ETF',
      type: 'etf',
      quantity: 50,
      currentPrice: 21.45,
      purchasePrice: 19.80,
      value: 1072.50,
      change: 82.50,
      changePercent: 8.33,
      esgScore: 88,
      carbonImpact: -1.8,
      lastUpdated: new Date().toISOString()
    },
    {
      id: '3',
      symbol: 'ESG',
      name: 'FlexShares STOXX US ESG Select Index Fund',
      type: 'etf',
      quantity: 25,
      currentPrice: 98.23,
      purchasePrice: 92.50,
      value: 2455.75,
      change: 143.25,
      changePercent: 6.20,
      esgScore: 91,
      carbonImpact: -1.2,
      lastUpdated: new Date().toISOString()
    },
    {
      id: '4',
      symbol: 'BTC',
      name: 'Bitcoin (sBTC)',
      type: 'crypto',
      quantity: 0.5,
      currentPrice: 67000,
      purchasePrice: 62000,
      value: 33500,
      change: 2500,
      changePercent: 8.06,
      esgScore: 45,
      carbonImpact: 0.8,
      lastUpdated: new Date().toISOString()
    }
  ]);

  const [portfolioMetrics, setPortfolioMetrics] = useState<PortfolioMetrics>({
    totalValue: 0,
    totalReturn: 0,
    totalReturnPercent: 0,
    todayChange: 0,
    todayChangePercent: 0,
    avgESGScore: 0,
    totalCarbonImpact: 0
  });

  const [selectedFilter, setSelectedFilter] = useState<'all' | 'stock' | 'etf' | 'bond' | 'crypto'>('all');
  const [sortBy, setSortBy] = useState<'value' | 'change' | 'esg' | 'carbon'>('value');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    calculatePortfolioMetrics();
  }, [investments]);

  const calculatePortfolioMetrics = () => {
    const totalValue = investments.reduce((sum, inv) => sum + inv.value, 0);
    const totalCost = investments.reduce((sum, inv) => sum + (inv.purchasePrice * inv.quantity), 0);
    const totalReturn = totalValue - totalCost;
    const totalReturnPercent = (totalReturn / totalCost) * 100;

    const todayChange = investments.reduce((sum, inv) => sum + (inv.change * inv.quantity / inv.currentPrice), 0);
    const todayChangePercent = (todayChange / totalValue) * 100;

    const avgESGScore = investments.reduce((sum, inv) => sum + (inv.esgScore * inv.value), 0) / totalValue;
    const totalCarbonImpact = investments.reduce((sum, inv) => sum + inv.carbonImpact, 0);

    setPortfolioMetrics({
      totalValue,
      totalReturn,
      totalReturnPercent,
      todayChange,
      todayChangePercent,
      avgESGScore,
      totalCarbonImpact
    });
  };

  const refreshPrices = async () => {
    setIsRefreshing(true);

    // Simulate price updates
    await new Promise(resolve => setTimeout(resolve, 2000));

    setInvestments(prev => prev.map(inv => ({
      ...inv,
      currentPrice: inv.currentPrice * (0.98 + Math.random() * 0.04),
      value: inv.quantity * inv.currentPrice * (0.98 + Math.random() * 0.04),
      change: (Math.random() - 0.5) * inv.value * 0.1,
      changePercent: (Math.random() - 0.5) * 10,
      lastUpdated: new Date().toISOString()
    })));

    setIsRefreshing(false);
  };

  const filteredInvestments = investments.filter(inv =>
    selectedFilter === 'all' || inv.type === selectedFilter
  );

  const sortedInvestments = [...filteredInvestments].sort((a, b) => {
    switch (sortBy) {
      case 'value':
        return b.value - a.value;
      case 'change':
        return b.changePercent - a.changePercent;
      case 'esg':
        return b.esgScore - a.esgScore;
      case 'carbon':
        return a.carbonImpact - b.carbonImpact;
      default:
        return 0;
    }
  });

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getESGColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'stock':
        return <TrendingUp className="w-4 h-4 text-blue-600" />;
      case 'etf':
        return <BarChart3 className="w-4 h-4 text-purple-600" />;
      case 'bond':
        return <Target className="w-4 h-4 text-green-600" />;
      case 'crypto':
        return <Bitcoin className="w-4 h-4 text-orange-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getAllocationData = () => {
    const allocation = investments.reduce((acc, inv) => {
      acc[inv.type] = (acc[inv.type] || 0) + inv.value;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(allocation).map(([type, value]) => ({
      type,
      value,
      percentage: (value / portfolioMetrics.totalValue) * 100
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className={`rounded-xl shadow-lg border p-6 ${
        theme === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <PieChart className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Investment Portfolio
              </h2>
              <p className={`${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Green investments powered by sBTC
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={refreshPrices}
              disabled={isRefreshing}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button className={`p-2 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}>
              <Download className="w-4 h-4" />
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Add Investment</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className={`text-sm ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Filter:
            </span>
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value as any)}
              className={`px-3 py-1 rounded-lg border text-sm ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="all">All Assets</option>
              <option value="stock">Stocks</option>
              <option value="etf">ETFs</option>
              <option value="bond">Bonds</option>
              <option value="crypto">Crypto</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`text-sm ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Sort by:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className={`px-3 py-1 rounded-lg border text-sm ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="value">Value</option>
              <option value="change">Performance</option>
              <option value="esg">ESG Score</option>
              <option value="carbon">Carbon Impact</option>
            </select>
          </div>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`rounded-xl shadow-lg border p-6 ${
          theme === 'dark'
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <span className={`text-2xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              ${portfolioMetrics.totalValue.toLocaleString()}
            </span>
          </div>
          <h3 className={`text-sm font-medium ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Total Portfolio Value
          </h3>
          <p className={`text-sm ${getChangeColor(portfolioMetrics.totalReturnPercent)}`}>
            {portfolioMetrics.totalReturnPercent >= 0 ? '+' : ''}
            ${portfolioMetrics.totalReturn.toLocaleString()}
            ({portfolioMetrics.totalReturnPercent.toFixed(2)}%)
          </p>
        </div>

        <div className={`rounded-xl shadow-lg border p-6 ${
          theme === 'dark'
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <span className={`text-2xl font-bold ${getChangeColor(portfolioMetrics.todayChangePercent)}`}>
              {portfolioMetrics.todayChangePercent >= 0 ? '+' : ''}{portfolioMetrics.todayChangePercent.toFixed(2)}%
            </span>
          </div>
          <h3 className={`text-sm font-medium ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Today's Change
          </h3>
          <p className={`text-sm ${getChangeColor(portfolioMetrics.todayChange)}`}>
            {portfolioMetrics.todayChange >= 0 ? '+' : ''}
            ${portfolioMetrics.todayChange.toLocaleString()}
          </p>
        </div>

        <div className={`rounded-xl shadow-lg border p-6 ${
          theme === 'dark'
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
            <span className={`text-2xl font-bold ${getESGColor(portfolioMetrics.avgESGScore)}`}>
              {portfolioMetrics.avgESGScore.toFixed(0)}
            </span>
          </div>
          <h3 className={`text-sm font-medium ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Average ESG Score
          </h3>
          <p className={`text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Sustainability rating
          </p>
        </div>

        <div className={`rounded-xl shadow-lg border p-6 ${
          theme === 'dark'
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Leaf className="w-6 h-6 text-emerald-600" />
            </div>
            <span className={`text-2xl font-bold ${getChangeColor(portfolioMetrics.totalCarbonImpact)}`}>
              {portfolioMetrics.totalCarbonImpact.toFixed(1)}
            </span>
          </div>
          <h3 className={`text-sm font-medium ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Carbon Impact
          </h3>
          <p className={`text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            tons CO₂ reduction
          </p>
        </div>
      </div>

      {/* Allocation Overview */}
      <div className={`rounded-xl shadow-lg border p-6 ${
        theme === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          Asset Allocation
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {getAllocationData().map((item, index) => (
            <div key={index} className={`p-4 rounded-lg ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <div className="flex items-center space-x-2 mb-2">
                {getTypeIcon(item.type)}
                <span className={`font-medium capitalize ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {item.type}
                </span>
              </div>
              <div className={`text-lg font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {item.percentage.toFixed(1)}%
              </div>
              <div className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                ${item.value.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Holdings List */}
      <div className={`rounded-xl shadow-lg border p-6 ${
        theme === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          Holdings ({sortedInvestments.length})
        </h3>

        <div className="space-y-4">
          {sortedInvestments.map((investment) => (
            <div
              key={investment.id}
              className={`p-4 rounded-lg border ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(investment.type)}
                    <div>
                      <h4 className={`font-semibold ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {investment.name}
                      </h4>
                      <div className="flex items-center space-x-2 text-sm">
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                          {investment.symbol}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                          {investment.quantity} shares
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <div className={`font-semibold ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      ${investment.currentPrice.toLocaleString()}
                    </div>
                    <div className={`text-sm ${getChangeColor(investment.changePercent)}`}>
                      {investment.changePercent >= 0 ? '+' : ''}{investment.changePercent.toFixed(2)}%
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`font-semibold ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      ${investment.value.toLocaleString()}
                    </div>
                    <div className={`text-sm ${getChangeColor(investment.change)}`}>
                      {investment.change >= 0 ? '+' : ''}${investment.change.toFixed(2)}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`font-semibold ${getESGColor(investment.esgScore)}`}>
                      ESG: {investment.esgScore}
                    </div>
                    <div className={`text-sm ${getChangeColor(investment.carbonImpact)}`}>
                      {investment.carbonImpact} tons CO₂
                    </div>
                  </div>

                  <button className={`p-2 rounded-lg transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                  }`}>
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InvestmentPortfolio;