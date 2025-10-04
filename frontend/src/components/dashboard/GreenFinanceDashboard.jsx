import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Leaf,
  Target,
  BarChart3,
  PieChart,
  DollarSign,
  Shield,
  Award,
  Star,
  Globe,
  Zap,
  TreePine,
  Users,
  Bell,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Calendar,
  Clock,
  Filter,
  Search,
  Settings,
  Download,
  Share2
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart
} from 'recharts';
import { clsx } from 'clsx';
import { format, subDays, subMonths } from 'date-fns';

// Import our AI services
import { portfolioAnalyzer } from '../../lib/ai/portfolio-analyzer';
import { fractionalInvestmentSystem } from '../../lib/blockchain/fractional-investments';
import { carbonIntegration } from '../../lib/blockchain/carbon-integration';
import { esgDataService } from '../../services/esg-data-service';
import { useWallet } from '../../hooks/useWallet';
import AIInsightsSidebar from './AIInsightsSidebar';

// Import additional chart components for enhanced visualizations
import {
  ScatterChart,
  Scatter,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend
} from 'recharts';

const GreenFinanceDashboard = () => {
  const { isConnected, connection } = useWallet();

  // Core state
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1M');
  const [activeSection, setActiveSection] = useState('overview');
  const [portfolioMetrics, setPortfolioMetrics] = useState(null);
  const [sustainabilityGoals, setSustainabilityGoals] = useState([]);
  const [esgNews, setESGNews] = useState([]);
  const [marketData, setMarketData] = useState([]);

  // UI state
  const [expandedCards, setExpandedCards] = useState(new Set());
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [isConnected, selectedTimeframe]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadPortfolioData(),
        loadSustainabilityMetrics(),
        loadMarketData(),
        loadESGNews(),
        loadGoalsData()
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPortfolioData = async () => {
    try {
      const positions = fractionalInvestmentSystem.getUserPositions();
      const portfolioMetrics = fractionalInvestmentSystem.getPortfolioMetrics();

      // Simulate some holdings for demo if none exist
      const holdings = positions.length > 0 ? positions.map(pos => ({
        symbol: pos.symbol,
        name: pos.symbol,
        quantity: pos.fractionalShares,
        currentPrice: pos.currentValue / pos.fractionalShares,
        sector: 'Technology', // Would come from investment details
        esgScore: 75
      })) : [
        {
          symbol: 'ICLN',
          name: 'iShares Clean Energy ETF',
          quantity: 10.5,
          currentPrice: 95.50,
          sector: 'Clean Energy',
          esgScore: 89
        },
        {
          symbol: 'TSLA',
          name: 'Tesla Inc.',
          quantity: 2.3,
          currentPrice: 242.75,
          sector: 'Electric Vehicles',
          esgScore: 76
        },
        {
          symbol: 'GRNBND',
          name: 'Green Bonds Portfolio',
          quantity: 15.0,
          currentPrice: 100.00,
          sector: 'Fixed Income',
          esgScore: 92
        }
      ];

      if (holdings.length > 0) {
        const analysis = await portfolioAnalyzer.analyzePortfolio(holdings, {
          sustainabilityFocus: 'high'
        });
        setPortfolioMetrics(analysis);
      }
    } catch (error) {
      console.error('Failed to load portfolio data:', error);
    }
  };

  const loadSustainabilityMetrics = async () => {
    try {
      const carbonImpact = carbonIntegration.getTotalCarbonImpact();
      const portfolioMetrics = fractionalInvestmentSystem.getPortfolioMetrics();

      setDashboardData(prev => ({
        ...prev,
        sustainabilityScore: Math.round((portfolioMetrics.esgScore + (100 - Math.min(100, Math.abs(carbonImpact.netEmissions) / 10))) / 2),
        carbonFootprint: carbonImpact.totalEmissions,
        carbonOffset: carbonImpact.totalOffsets,
        netEmissions: carbonImpact.netEmissions,
        investmentImpact: carbonImpact.totalInvestmentImpact
      }));
    } catch (error) {
      console.error('Failed to load sustainability metrics:', error);
    }
  };

  const loadMarketData = async () => {
    try {
      const trends = await esgDataService.getESGTrends();
      const mockMarketData = generateMockMarketData();
      setMarketData(mockMarketData);

      setDashboardData(prev => ({
        ...prev,
        marketTrends: trends?.trends || {}
      }));
    } catch (error) {
      console.error('Failed to load market data:', error);
    }
  };

  const loadESGNews = async () => {
    try {
      const news = await esgDataService.getESGNews([], 10);
      setESGNews(news);
    } catch (error) {
      console.error('Failed to load ESG news:', error);
      // Mock news data as fallback
      setESGNews([
        {
          headline: 'Global ESG ETF Assets Reach $3.9 Trillion',
          summary: 'Sustainable investing continues rapid growth with record inflows',
          impact: 'positive',
          source: 'Financial Times',
          publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          headline: 'New EU Climate Disclosure Rules Take Effect',
          summary: 'Companies must now report comprehensive sustainability metrics',
          impact: 'regulatory',
          source: 'Reuters',
          publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        }
      ]);
    }
  };

  const loadGoalsData = async () => {
    try {
      // Mock sustainability goals - in production, load from user preferences
      setSustainabilityGoals([
        {
          id: 'carbon-neutral',
          title: 'Achieve Carbon Neutrality',
          description: 'Offset all portfolio carbon emissions',
          target: 0,
          current: dashboardData?.netEmissions || 150,
          unit: 'kg CO₂e',
          progress: Math.max(0, Math.min(100, 100 - (Math.abs(dashboardData?.netEmissions || 150) / 500) * 100)),
          deadline: '2024-12-31',
          category: 'carbon'
        },
        {
          id: 'esg-score',
          title: 'ESG Portfolio Score 85+',
          description: 'Maintain high ESG standards across investments',
          target: 85,
          current: portfolioMetrics?.portfolioAnalysis?.currentESGScore || 78,
          unit: 'score',
          progress: Math.min(100, ((portfolioMetrics?.portfolioAnalysis?.currentESGScore || 78) / 85) * 100),
          deadline: '2024-06-30',
          category: 'esg'
        },
        {
          id: 'green-allocation',
          title: '80% Green Investments',
          description: 'Allocate majority of portfolio to sustainable investments',
          target: 80,
          current: 65,
          unit: '%',
          progress: (65 / 80) * 100,
          deadline: '2024-09-30',
          category: 'allocation'
        }
      ]);
    } catch (error) {
      console.error('Failed to load goals data:', error);
    }
  };

  const generateMockMarketData = () => {
    const days = selectedTimeframe === '1D' ? 1 : selectedTimeframe === '1W' ? 7 : selectedTimeframe === '1M' ? 30 : 90;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      data.push({
        date: format(date, selectedTimeframe === '1D' ? 'HH:mm' : 'MMM dd'),
        cleanEnergy: 100 + Math.random() * 20 - 10,
        esgETFs: 105 + Math.random() * 15 - 7.5,
        greenBonds: 102 + Math.random() * 5 - 2.5,
        sustainableStocks: 110 + Math.random() * 25 - 12.5,
        volume: Math.floor(Math.random() * 1000000) + 500000
      });
    }
    return data;
  };

  const toggleCardExpansion = (cardId) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(cardId)) {
      newExpanded.delete(cardId);
    } else {
      newExpanded.add(cardId);
    }
    setExpandedCards(newExpanded);
  };

  const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'];

  if (isLoading && !dashboardData) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" className="absolute">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="m 60 0 l 0 60 l -60 0 l 0 -60 z" fill="none" stroke="#10B981" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Green Finance Dashboard</h1>
                <p className="text-sm text-gray-600">Sustainable investing made intelligent</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Timeframe Selector */}
              <div className="hidden md:flex bg-gray-100 rounded-lg p-1">
                {['1D', '1W', '1M', '3M'].map((timeframe) => (
                  <button
                    key={timeframe}
                    onClick={() => setSelectedTimeframe(timeframe)}
                    className={clsx(
                      'px-3 py-1 text-sm font-medium rounded-md transition-all duration-200',
                      selectedTimeframe === timeframe
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    )}
                  >
                    {timeframe}
                  </button>
                ))}
              </div>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-gray-400 hover:text-gray-600 relative"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-10">
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                    </div>
                    <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
                      <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                        <TrendingUp className="w-4 h-4 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-900">ESG Score Improved</p>
                          <p className="text-xs text-green-700">Your portfolio ESG score increased to 82</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                        <Award className="w-4 h-4 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-900">Goal Progress</p>
                          <p className="text-xs text-blue-700">65% progress toward carbon neutrality</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Refresh */}
              <button
                onClick={loadDashboardData}
                disabled={isLoading}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>

              {/* Settings */}
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Welcome back, {isConnected ? 'Investor' : 'Guest'}
                </h2>
                <p className="text-lg text-gray-600 mb-4">
                  Your sustainable portfolio is {isConnected ? 'performing excellently' : 'ready to start growing'}
                </p>
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600">Live market data</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-gray-600">ESG verified</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TreePine className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-600">Carbon tracked</span>
                  </div>
                </div>
              </div>
              <div className="hidden lg:block">
                <ResponsiveContainer width={200} height={120}>
                  <RadialBarChart cx={100} cy={60} innerRadius={20} outerRadius={50} data={[
                    { name: 'ESG Score', value: dashboardData?.sustainabilityScore || 82, fill: '#10B981' }
                  ]}>
                    <RadialBar dataKey="value" cornerRadius={10} fill="#10B981" />
                    <text x={100} y={65} textAnchor="middle" dominantBaseline="middle" className="fill-gray-900 text-xl font-bold">
                      {dashboardData?.sustainabilityScore || 82}
                    </text>
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Sustainability Score"
            value={dashboardData?.sustainabilityScore || 82}
            unit="/100"
            icon={Star}
            color="from-green-500 to-emerald-600"
            trend={5.2}
            subtitle="↗ Excellent rating"
          />
          <MetricCard
            title="Portfolio Value"
            value={fractionalInvestmentSystem.getPortfolioMetrics().currentValue}
            unit=""
            icon={DollarSign}
            color="from-blue-500 to-blue-600"
            trend={8.7}
            subtitle="Total investment value"
            format="currency"
          />
          <MetricCard
            title="Carbon Impact"
            value={Math.abs(dashboardData?.netEmissions || -45)}
            unit="kg CO₂e"
            icon={TreePine}
            color="from-purple-500 to-purple-600"
            trend={-12.3}
            subtitle="Net emissions saved"
            inverted
          />
          <MetricCard
            title="ESG Score"
            value={portfolioMetrics?.portfolioAnalysis?.currentESGScore || 78}
            unit="/100"
            icon={Shield}
            color="from-orange-500 to-red-500"
            trend={3.1}
            subtitle="Portfolio average"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
          {/* Left Column - Portfolio & Performance */}
          <div className="lg:col-span-2 xl:col-span-2 space-y-6 lg:space-y-8">
            {/* Portfolio Performance Chart */}
            <ChartCard
              title="Portfolio Performance"
              subtitle="ESG-weighted returns vs benchmarks"
              onExpand={() => toggleCardExpansion('performance')}
              isExpanded={expandedCards.has('performance')}
            >
              <ResponsiveContainer width="100%" height={expandedCards.has('performance') ? 400 : 300}>
                <ComposedChart data={marketData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
                  <YAxis stroke="#6B7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cleanEnergy"
                    stroke="#10B981"
                    fill="url(#greenGradient)"
                    strokeWidth={2}
                    name="Clean Energy"
                  />
                  <Line
                    type="monotone"
                    dataKey="esgETFs"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    name="ESG ETFs"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="sustainableStocks"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    name="Sustainable Stocks"
                    dot={false}
                  />
                  <defs>
                    <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* ESG Risk vs Return Scatter Plot */}
            <ChartCard
              title="ESG Risk vs Return Analysis"
              subtitle="Portfolio positioning relative to market"
            >
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    type="number"
                    dataKey="risk"
                    name="ESG Risk"
                    domain={[0, 100]}
                    label={{ value: 'ESG Risk Score', position: 'insideBottom', offset: -10 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="return"
                    name="Expected Return"
                    domain={[0, 20]}
                    label={{ value: 'Expected Return (%)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter
                    name="Your Portfolio"
                    data={[
                      { risk: 25, return: 12.5, size: 1000 },
                      { risk: 15, return: 8.2, size: 800 },
                      { risk: 35, return: 15.1, size: 600 },
                      { risk: 20, return: 10.8, size: 1200 }
                    ]}
                    fill="#10B981"
                  />
                  <Scatter
                    name="Market Average"
                    data={[
                      { risk: 45, return: 9.2, size: 500 },
                      { risk: 60, return: 11.5, size: 500 },
                      { risk: 55, return: 7.8, size: 500 }
                    ]}
                    fill="#6B7280"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* ESG Breakdown */}
            <ChartCard
              title="ESG Portfolio Breakdown"
              subtitle="Environmental, Social & Governance analysis"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ESG Radar Chart */}
                <div>
                  <ResponsiveContainer width="100%" height={250}>
                    <RadarChart data={[
                      {
                        subject: 'Environmental',
                        portfolio: portfolioMetrics?.portfolioAnalysis?.currentESGScore * 0.9 || 70,
                        target: 85,
                        market: 65
                      },
                      {
                        subject: 'Social',
                        portfolio: portfolioMetrics?.portfolioAnalysis?.currentESGScore * 1.1 || 85,
                        target: 85,
                        market: 72
                      },
                      {
                        subject: 'Governance',
                        portfolio: portfolioMetrics?.portfolioAnalysis?.currentESGScore * 0.95 || 75,
                        target: 85,
                        market: 78
                      },
                      {
                        subject: 'Innovation',
                        portfolio: 82,
                        target: 85,
                        market: 68
                      },
                      {
                        subject: 'Transparency',
                        portfolio: 88,
                        target: 85,
                        market: 70
                      }
                    ]}>
                      <PolarGrid stroke="#E5E7EB" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Radar name="Your Portfolio" dataKey="portfolio" stroke="#10B981" fill="#10B981" fillOpacity={0.3} strokeWidth={2} />
                      <Radar name="Target" dataKey="target" stroke="#3B82F6" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
                      <Radar name="Market Avg" dataKey="market" stroke="#6B7280" fill="transparent" strokeWidth={1} />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Enhanced Portfolio Allocation with hover effects */}
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <RechartsPieChart>
                      <Pie
                        data={[
                          { name: 'Clean Energy', value: 35, color: '#10B981' },
                          { name: 'ESG ETFs', value: 30, color: '#3B82F6' },
                          { name: 'Green Bonds', value: 20, color: '#8B5CF6' },
                          { name: 'Sustainable Tech', value: 15, color: '#F59E0B' }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {[
                          { name: 'Clean Energy', value: 35, color: '#10B981' },
                          { name: 'ESG ETFs', value: 30, color: '#3B82F6' },
                          { name: 'Green Bonds', value: 20, color: '#8B5CF6' },
                          { name: 'Sustainable Tech', value: 15, color: '#F59E0B' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, 'Allocation']} />
                    </RechartsPieChart>
                  </ResponsiveContainer>

                  {/* Allocation Legend with metrics */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { name: 'Clean Energy', value: 35, color: '#10B981', return: '+12.3%' },
                      { name: 'ESG ETFs', value: 30, color: '#3B82F6', return: '+8.7%' },
                      { name: 'Green Bonds', value: 20, color: '#8B5CF6', return: '+4.2%' },
                      { name: 'Sustainable Tech', value: 15, color: '#F59E0B', return: '+15.1%' }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: item.color }}></div>
                          <span className="font-medium text-gray-700">{item.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">{item.value}%</div>
                          <div className="text-green-600">{item.return}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ChartCard>

            {/* Carbon Impact Tracking */}
            <ChartCard
              title="Carbon Impact Timeline"
              subtitle="Monthly emissions and offsets tracking"
            >
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={generateCarbonTimelineData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                  <YAxis stroke="#6B7280" fontSize={12} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="emissions"
                    stackId="1"
                    stroke="#EF4444"
                    fill="#FEE2E2"
                    name="Emissions"
                  />
                  <Area
                    type="monotone"
                    dataKey="offsets"
                    stackId="2"
                    stroke="#10B981"
                    fill="#D1FAE5"
                    name="Offsets"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Middle Column - Goals, News, Market Data */}
          <div className="lg:col-span-1 xl:col-span-1 space-y-6 lg:space-y-8">
            {/* Sustainability Goals */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Sustainability Goals</h3>
                <Target className="w-5 h-5 text-green-600" />
              </div>
              <div className="space-y-6">
                {sustainabilityGoals.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </div>
            </div>

            {/* Market Insights */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Market Insights</h3>
                <Globe className="w-5 h-5 text-blue-600" />
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-green-900">ESG ETF Flows</p>
                      <p className="text-sm text-green-700">+$2.3B this week</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-blue-900">Clean Energy Index</p>
                      <p className="text-sm text-blue-700">+5.2% this month</p>
                    </div>
                    <Zap className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-purple-900">Carbon Credit Prices</p>
                      <p className="text-sm text-purple-700">$95.50 per tonne</p>
                    </div>
                    <TreePine className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* ESG News Feed */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">ESG News</h3>
                <ExternalLink className="w-5 h-5 text-gray-400" />
              </div>
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {esgNews.map((article, index) => (
                  <NewsCard key={index} article={article} />
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg p-6 text-white">
              <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full bg-white/20 backdrop-blur-sm rounded-xl p-3 text-left hover:bg-white/30 transition-colors">
                  <div className="flex items-center space-x-3">
                    <TreePine className="w-5 h-5" />
                    <span className="font-medium">Buy Carbon Offsets</span>
                  </div>
                </button>
                <button className="w-full bg-white/20 backdrop-blur-sm rounded-xl p-3 text-left hover:bg-white/30 transition-colors">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="w-5 h-5" />
                    <span className="font-medium">View Recommendations</span>
                  </div>
                </button>
                <button className="w-full bg-white/20 backdrop-blur-sm rounded-xl p-3 text-left hover:bg-white/30 transition-colors">
                  <div className="flex items-center space-x-3">
                    <Download className="w-5 h-5" />
                    <span className="font-medium">Export Report</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - AI Insights */}
          <div className="lg:col-span-3 xl:col-span-1 space-y-6 lg:space-y-8">
            <AIInsightsSidebar
              portfolioData={portfolioMetrics}
              sustainabilityData={dashboardData}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Mobile Floating Action Button */}
        <div className="fixed bottom-6 right-6 lg:hidden z-40">
          <div className="relative">
            <button className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full shadow-2xl text-white flex items-center justify-center hover:shadow-green-500/25 hover:scale-110 transition-all duration-300 animate-pulse">
              <Brain className="w-8 h-8" />
            </button>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-bounce"></div>
          </div>
        </div>

        {/* Mobile Bottom Sheet Trigger (Hidden by default) */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-blue-500 opacity-0"></div>
      </div>
    </div>
  );

  function generateCarbonTimelineData() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      month,
      emissions: Math.floor(Math.random() * 100) + 50,
      offsets: Math.floor(Math.random() * 80) + 40,
    }));
  }
};

// Supporting Components
const MetricCard = ({ title, value, unit, icon: Icon, color, trend, subtitle, format = 'number', inverted = false }) => (
  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 bg-gradient-to-br ${color} rounded-xl shadow-lg group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      {trend && (
        <div className={`flex items-center space-x-1 ${
          inverted
            ? (trend < 0 ? 'text-green-600' : 'text-red-600')
            : (trend > 0 ? 'text-green-600' : 'text-red-600')
        }`}>
          {(inverted ? trend < 0 : trend > 0) ?
            <TrendingUp className="w-4 h-4" /> :
            <TrendingDown className="w-4 h-4" />
          }
          <span className="text-sm font-medium">{Math.abs(trend)}%</span>
        </div>
      )}
    </div>
    <div className="mb-2">
      <div className="text-2xl font-bold text-gray-900 group-hover:scale-105 transition-transform">
        {format === 'currency' ? `$${value.toLocaleString()}` : `${value}${unit}`}
      </div>
      {subtitle && <div className="text-sm text-gray-500">{subtitle}</div>}
    </div>
    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
  </div>
);

const ChartCard = ({ title, subtitle, children, onExpand, isExpanded }) => (
  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
      </div>
      {onExpand && (
        <button
          onClick={onExpand}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      )}
    </div>
    {children}
  </div>
);

const GoalCard = ({ goal }) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <h4 className="font-semibold text-gray-900">{goal.title}</h4>
      <span className="text-sm text-gray-500">
        {Math.round(goal.progress)}%
      </span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className={`h-2 rounded-full transition-all duration-1000 ${
          goal.progress >= 100
            ? 'bg-green-500'
            : goal.progress >= 75
            ? 'bg-blue-500'
            : goal.progress >= 50
            ? 'bg-yellow-500'
            : 'bg-orange-500'
        }`}
        style={{ width: `${Math.min(100, goal.progress)}%` }}
      />
    </div>
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-600">{goal.current} {goal.unit}</span>
      <span className="text-gray-500">Target: {goal.target} {goal.unit}</span>
    </div>
    <p className="text-xs text-gray-500">{goal.description}</p>
  </div>
);

const NewsCard = ({ article }) => (
  <div className="border-l-4 border-green-500 pl-4 py-2">
    <h4 className="font-semibold text-gray-900 text-sm mb-1">{article.headline}</h4>
    <p className="text-xs text-gray-600 mb-2">{article.summary}</p>
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-500">{article.source}</span>
      <span className="text-xs text-gray-400">
        {format(new Date(article.publishedAt), 'MMM dd, HH:mm')}
      </span>
    </div>
  </div>
);

const DashboardSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50">
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="bg-white border-b border-gray-200 h-16"></div>

      {/* Content skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Metrics row skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-gray-200 rounded-xl mb-4"></div>
              <div className="w-24 h-6 bg-gray-200 rounded mb-2"></div>
              <div className="w-32 h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>

        {/* Charts skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="w-48 h-6 bg-gray-200 rounded mb-6"></div>
              <div className="w-full h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div>
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="w-36 h-6 bg-gray-200 rounded mb-6"></div>
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-full h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default GreenFinanceDashboard;