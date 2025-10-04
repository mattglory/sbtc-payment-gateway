import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Globe,
  Zap,
  TreePine,
  Droplets,
  Sun,
  Wind,
  Factory,
  Users,
  Target,
  RefreshCw,
  ExternalLink,
  Filter,
  Search,
  Calendar,
  Clock,
  DollarSign,
  Percent,
  Activity
} from 'lucide-react';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';
import { clsx } from 'clsx';
import { format } from 'date-fns';

const MarketDataFeed = ({ onInvestmentSelect }) => {
  const [marketData, setMarketData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('performance');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const categories = [
    { id: 'all', name: 'All Markets', icon: Globe },
    { id: 'clean_energy', name: 'Clean Energy', icon: Zap },
    { id: 'esg_etfs', name: 'ESG ETFs', icon: BarChart3 },
    { id: 'green_bonds', name: 'Green Bonds', icon: TreePine },
    { id: 'water', name: 'Water Tech', icon: Droplets },
    { id: 'carbon', name: 'Carbon Credits', icon: Factory }
  ];

  // Mock real-time market data
  const generateMockMarketData = () => {
    const baseData = [
      {
        symbol: 'ICLN',
        name: 'iShares Global Clean Energy ETF',
        category: 'clean_energy',
        price: 20.45,
        change: 0.32,
        changePercent: 1.59,
        volume: 2847392,
        marketCap: '2.1B',
        esgScore: 89,
        carbonImpact: -45,
        sector: 'Clean Energy',
        description: 'Global clean energy companies',
        yearHigh: 22.50,
        yearLow: 16.80,
        dividend: 0.12
      },
      {
        symbol: 'ESGD',
        name: 'iShares ESG Aware MSCI Developed Markets ETF',
        category: 'esg_etfs',
        price: 72.18,
        change: -0.45,
        changePercent: -0.62,
        volume: 1523847,
        marketCap: '12.8B',
        esgScore: 84,
        carbonImpact: -28,
        sector: 'Broad Market ESG',
        description: 'ESG-screened developed market stocks',
        yearHigh: 78.90,
        yearLow: 65.20,
        dividend: 1.42
      },
      {
        symbol: 'GRNB',
        name: 'Xtrackers USD Green Bond ETF',
        category: 'green_bonds',
        price: 48.75,
        change: 0.08,
        changePercent: 0.16,
        volume: 456789,
        marketCap: '890M',
        esgScore: 92,
        carbonImpact: -35,
        sector: 'Fixed Income',
        description: 'USD-denominated green bonds',
        yearHigh: 51.20,
        yearLow: 46.10,
        dividend: 1.85
      },
      {
        symbol: 'PIO',
        name: 'Invesco Water Resources ETF',
        category: 'water',
        price: 42.33,
        change: 0.67,
        changePercent: 1.61,
        volume: 234567,
        marketCap: '1.5B',
        esgScore: 81,
        carbonImpact: -22,
        sector: 'Water Technology',
        description: 'Companies in water-related businesses',
        yearHigh: 48.90,
        yearLow: 38.40,
        dividend: 0.31
      },
      {
        symbol: 'KRBN',
        name: 'KraneShares Global Carbon ETF',
        category: 'carbon',
        price: 35.82,
        change: 1.24,
        changePercent: 3.59,
        volume: 187456,
        marketCap: '425M',
        esgScore: 95,
        carbonImpact: -100,
        sector: 'Carbon Markets',
        description: 'Global carbon credit allowances',
        yearHigh: 42.10,
        yearLow: 28.90,
        dividend: 0.00
      },
      {
        symbol: 'TSLA',
        name: 'Tesla Inc.',
        category: 'clean_energy',
        price: 242.75,
        change: -3.42,
        changePercent: -1.39,
        volume: 45678901,
        marketCap: '771B',
        esgScore: 76,
        carbonImpact: -55,
        sector: 'Electric Vehicles',
        description: 'Electric vehicles and energy storage',
        yearHigh: 299.29,
        yearLow: 138.80,
        dividend: 0.00
      }
    ];

    // Add some randomness to simulate real-time updates
    return baseData.map(item => ({
      ...item,
      price: item.price * (0.98 + Math.random() * 0.04),
      change: (Math.random() - 0.5) * 2,
      changePercent: (Math.random() - 0.5) * 4,
      volume: Math.floor(item.volume * (0.8 + Math.random() * 0.4)),
      timestamp: new Date().toISOString()
    }));
  };

  const generateChartData = (basePrice) => {
    const data = [];
    const points = 24; // 24 hours of data

    for (let i = points - 1; i >= 0; i--) {
      const time = new Date(Date.now() - i * 60 * 60 * 1000);
      const variation = (Math.random() - 0.5) * 0.05; // ±2.5% variation
      const price = basePrice * (1 + variation);

      data.push({
        time: format(time, 'HH:mm'),
        price: parseFloat(price.toFixed(2)),
        volume: Math.floor(Math.random() * 1000000)
      });
    }

    return data;
  };

  useEffect(() => {
    loadMarketData();
    const interval = setInterval(loadMarketData, 15000); // Update every 15 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterAndSortData();
  }, [marketData, selectedCategory, searchTerm, sortBy]);

  const loadMarketData = async () => {
    setIsLoading(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      const newData = generateMockMarketData();
      setMarketData(newData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load market data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortData = () => {
    let filtered = marketData;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort data
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'performance':
          return Math.abs(b.changePercent) - Math.abs(a.changePercent);
        case 'price':
          return b.price - a.price;
        case 'volume':
          return b.volume - a.volume;
        case 'esgScore':
          return b.esgScore - a.esgScore;
        case 'alphabetical':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    setFilteredData(filtered);
  };

  const MarketItem = ({ item }) => {
    const isPositive = item.change >= 0;
    const chartData = generateChartData(item.price);

    return (
      <div
        className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer group"
        onClick={() => onInvestmentSelect && onInvestmentSelect(item)}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-gray-100 rounded-lg">
                <BarChart3 className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {item.symbol}
                </h3>
                <p className="text-sm text-gray-600 truncate">{item.name}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  ${item.price.toFixed(2)}
                </div>
                <div className={`flex items-center space-x-1 ${
                  isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span className="text-sm font-medium">
                    ${Math.abs(item.change).toFixed(2)} ({Math.abs(item.changePercent).toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Mini Chart */}
          <div className="w-24 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke={isPositive ? '#10B981' : '#EF4444'}
                  strokeWidth={2}
                  dot={false}
                  fill="none"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Key Metrics Row */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Volume:</span>
            <span className="font-medium">{(item.volume / 1000000).toFixed(1)}M</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Market Cap:</span>
            <span className="font-medium">{item.marketCap}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">ESG Score:</span>
            <span className={`font-medium ${
              item.esgScore >= 80 ? 'text-green-600' :
              item.esgScore >= 60 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {item.esgScore}/100
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Carbon Impact:</span>
            <span className={`font-medium ${
              item.carbonImpact < 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {item.carbonImpact} kg
            </span>
          </div>
        </div>

        {/* ESG Rating Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              {item.sector}
            </span>
            {item.esgScore >= 85 && (
              <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                <TreePine className="w-3 h-3 mr-1" />
                High ESG
              </span>
            )}
          </div>

          <div className="text-xs text-gray-500">
            Updated: {format(lastUpdate, 'HH:mm:ss')}
          </div>
        </div>

        {/* Hover Actions */}
        <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center justify-between">
            <button className="text-xs text-blue-600 hover:text-blue-700 flex items-center space-x-1">
              <BarChart3 className="w-3 h-3" />
              <span>View Details</span>
            </button>
            <button className="text-xs text-green-600 hover:text-green-700 flex items-center space-x-1">
              <Target className="w-3 h-3" />
              <span>Add to Watchlist</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const MarketOverview = () => {
    const overviewData = [
      {
        title: 'ESG Market Cap',
        value: '$4.2T',
        change: 12.4,
        description: 'Global sustainable investing assets'
      },
      {
        title: 'Clean Energy Index',
        value: '2,847',
        change: 5.8,
        description: 'Renewable energy sector performance'
      },
      {
        title: 'Green Bond Issuance',
        value: '$156B',
        change: 23.1,
        description: 'YTD green bond market'
      },
      {
        title: 'Carbon Credit Price',
        value: '$92.50',
        change: -2.3,
        description: 'Per tonne CO₂e (EU ETS)'
      }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {overviewData.map((item, index) => (
          <div key={index} className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <div className={`flex items-center space-x-1 ${
                item.change > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {item.change > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span className="text-sm font-medium">{Math.abs(item.change)}%</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{item.value}</div>
            <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
            <p className="text-sm text-gray-600">{item.description}</p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Market Data</h2>
          <p className="text-gray-600 mt-2">Real-time ESG and sustainable investment data</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Last update: {format(lastUpdate, 'HH:mm:ss')}</span>
          </div>
          <button
            onClick={loadMarketData}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Market Overview */}
      <MarketOverview />

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={clsx(
                  'flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200',
                  selectedCategory === category.id
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                <category.icon className="w-4 h-4" />
                <span>{category.name}</span>
              </button>
            ))}
          </div>

          {/* Search and Sort */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search investments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="performance">Performance</option>
              <option value="price">Price</option>
              <option value="volume">Volume</option>
              <option value="esgScore">ESG Score</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredData.length} of {marketData.length} investments
        </div>
      </div>

      {/* Market Data Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="animate-pulse">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                    <div className="h-3 bg-gray-200 rounded w-32"></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-24"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="grid grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-3 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : filteredData.length > 0 ? (
          filteredData.map((item) => (
            <MarketItem key={item.symbol} item={item} />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No investments found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Market Alerts */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-6 border border-blue-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Alerts</h3>
        <div className="space-y-3">
          <div className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-green-200">
            <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Clean Energy Surge</p>
              <p className="text-sm text-gray-600">Renewable energy stocks up 5.2% following new climate legislation</p>
            </div>
          </div>
          <div className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-blue-200">
            <Activity className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">ESG ETF Inflows</p>
              <p className="text-sm text-gray-600">Record $2.3B weekly inflows into sustainable investment funds</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketDataFeed;