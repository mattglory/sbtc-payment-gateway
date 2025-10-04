import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Shield,
  Target,
  BarChart3,
  PieChart,
  Filter,
  RefreshCw,
  Star,
  AlertTriangle,
  CheckCircle,
  Leaf,
  Zap,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Settings,
  Download,
  Eye,
  Wallet,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { clsx } from 'clsx';
import { portfolioAnalyzer } from '../../lib/ai/portfolio-analyzer';
import { useWallet } from '../../hooks/useWallet';

const InvestmentRecommendationEngine = () => {
  const { isConnected, connection } = useWallet();

  // Core state
  const [currentPortfolio, setCurrentPortfolio] = useState([]);
  const [analysisData, setAnalysisData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  // UI state
  const [activeTab, setActiveTab] = useState('portfolio');
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('esgScore');
  const [sortOrder, setSortOrder] = useState('desc');

  // Filter state
  const [filters, setFilters] = useState({
    minESGScore: 0,
    maxRisk: 10,
    sectors: [],
    investmentTypes: [],
    minReturn: 0,
    maxInvestment: 100000,
    sustainabilityRating: 'all'
  });

  // Investment preferences
  const [preferences, setPreferences] = useState({
    riskTolerance: 'moderate',
    timeHorizon: 'medium',
    sustainabilityFocus: 'high',
    availableCapital: 10000,
    targetReturn: 8,
    preferredTypes: ['stocks', 'etfs'],
    excludeSectors: []
  });

  useEffect(() => {
    // Load sample portfolio data
    loadSamplePortfolio();
  }, []);

  const loadSamplePortfolio = () => {
    // Sample portfolio for demo
    const sampleHoldings = [
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        quantity: 50,
        currentPrice: 175.50,
        sector: 'Technology',
        esgScore: 72
      },
      {
        symbol: 'TSLA',
        name: 'Tesla Inc.',
        quantity: 25,
        currentPrice: 242.75,
        sector: 'Electric Vehicles',
        esgScore: 76
      },
      {
        symbol: 'MSFT',
        name: 'Microsoft Corp.',
        quantity: 30,
        currentPrice: 378.85,
        sector: 'Technology',
        esgScore: 85
      }
    ];
    setCurrentPortfolio(sampleHoldings);
  };

  const analyzePortfolio = async () => {
    if (currentPortfolio.length === 0) {
      setError('Please add holdings to your portfolio first');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const analysis = await portfolioAnalyzer.analyzePortfolio(currentPortfolio, preferences);

      setAnalysisData(analysis);
      setRecommendations(analysis.recommendations || []);

    } catch (err) {
      console.error('Portfolio analysis failed:', err);
      setError('Failed to analyze portfolio. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addHolding = (symbol, name, quantity, price, sector = 'Unknown', esgScore = 50) => {
    const newHolding = {
      symbol: symbol.toUpperCase(),
      name,
      quantity: parseFloat(quantity),
      currentPrice: parseFloat(price),
      sector,
      esgScore
    };

    setCurrentPortfolio(prev => [...prev, newHolding]);
  };

  const removeHolding = (symbol) => {
    setCurrentPortfolio(prev => prev.filter(h => h.symbol !== symbol));
  };

  const filteredRecommendations = recommendations.filter(rec => {
    if (filters.minESGScore > 0 && rec.esgScore < filters.minESGScore) return false;
    if (filters.maxRisk < 10 && rec.riskScore > filters.maxRisk) return false;
    if (filters.sectors.length > 0 && !filters.sectors.includes(rec.sector)) return false;
    if (filters.investmentTypes.length > 0 && !filters.investmentTypes.includes(rec.type)) return false;
    if (filters.minReturn > 0 && rec.expectedReturn < filters.minReturn) return false;
    if (filters.sustainabilityRating !== 'all' && rec.sustainabilityRating !== filters.sustainabilityRating) return false;
    return true;
  });

  const sortedRecommendations = [...filteredRecommendations].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
  });

  const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#6366F1', '#84CC16'];

  const getESGGradeColor = (grade) => {
    if (['A+', 'A', 'A-'].includes(grade)) return 'text-green-600';
    if (['B+', 'B', 'B-'].includes(grade)) return 'text-blue-600';
    if (['C+', 'C', 'C-'].includes(grade)) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskColor = (riskScore) => {
    if (riskScore <= 3) return 'text-green-600 bg-green-100';
    if (riskScore <= 6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const PortfolioSummaryCard = ({ title, value, subtitle, icon: Icon, color, trend }) => (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 bg-gradient-to-br ${color} rounded-xl shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center space-x-1 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            <span className="text-sm font-medium">{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div className="mb-2">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {subtitle && <div className="text-sm text-gray-500">{subtitle}</div>}
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    </div>
  );

  const RecommendationCard = ({ recommendation, onSelect }) => (
    <div
      className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer group"
      onClick={() => onSelect(recommendation)}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {recommendation.symbol}
          </h3>
          <p className="text-sm text-gray-600">{recommendation.name}</p>
          <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full mt-1">
            {recommendation.sector}
          </span>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-green-600">
            {recommendation.expectedReturn}%
          </div>
          <div className="text-xs text-gray-500">Expected Return</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500">ESG Score</p>
          <div className="flex items-center space-x-2">
            <div className="text-lg font-semibold text-gray-900">{recommendation.esgScore}</div>
            <Star className="w-4 h-4 text-yellow-500" />
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-500">Risk Level</p>
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(recommendation.riskScore)}`}>
            {recommendation.riskScore}/10
          </span>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-gray-500">Recommended Allocation</span>
          <span className="text-xs font-medium">{recommendation.recommendedAllocation}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
            style={{ width: `${recommendation.recommendedAllocation}%` }}
          />
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-700">{recommendation.reasoning}</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Leaf className="w-4 h-4 text-green-600" />
          <span className="text-sm text-green-600">
            {recommendation.carbonImpact} kg CO₂e impact
          </span>
        </div>
        <div className="text-sm text-gray-500">
          Min: ${recommendation.minimumInvestment}
        </div>
      </div>
    </div>
  );

  const RecommendationModal = ({ recommendation, onClose }) => {
    const [investmentAmount, setInvestmentAmount] = useState(recommendation.minimumInvestment);

    const handleInvestment = async () => {
      // Integration with blockchain investment system
      alert(`Investment functionality will integrate with your sBTC wallet for ${recommendation.symbol}`);
      onClose();
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-90vh overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{recommendation.symbol} - Investment Details</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Key Metrics</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Expected Return:</span>
                    <span className="font-semibold text-green-600">{recommendation.expectedReturn}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ESG Score:</span>
                    <span className="font-semibold">{recommendation.esgScore}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Risk Score:</span>
                    <span className="font-semibold">{recommendation.riskScore}/10</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Carbon Impact:</span>
                    <span className="font-semibold text-green-600">{recommendation.carbonImpact} kg CO₂e</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Investment Amount</h3>
                <input
                  type="number"
                  min={recommendation.minimumInvestment}
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(parseFloat(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum: ${recommendation.minimumInvestment}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Key Features</h3>
            <div className="flex flex-wrap gap-2">
              {recommendation.keyFeatures.map((feature, index) => (
                <span key={index} className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {feature}
                </span>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Risks</h3>
            <div className="space-y-2">
              {recommendation.risks.map((risk, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{risk}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleInvestment}
              disabled={!isConnected}
              className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center justify-center space-x-2"
            >
              <Wallet className="w-4 h-4" />
              <span>Invest with sBTC</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const AddHoldingForm = ({ onAdd }) => {
    const [formData, setFormData] = useState({
      symbol: '',
      name: '',
      quantity: '',
      price: '',
      sector: '',
      esgScore: ''
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      if (formData.symbol && formData.quantity && formData.price) {
        onAdd(
          formData.symbol,
          formData.name || formData.symbol,
          formData.quantity,
          formData.price,
          formData.sector || 'Unknown',
          formData.esgScore || 50
        );
        setFormData({ symbol: '', name: '', quantity: '', price: '', sector: '', esgScore: '' });
      }
    };

    return (
      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Portfolio Holding</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Symbol (e.g., AAPL)"
            value={formData.symbol}
            onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="number"
            placeholder="Quantity"
            value={formData.quantity}
            onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="number"
            step="0.01"
            placeholder="Current Price"
            value={formData.price}
            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <input
            type="text"
            placeholder="Company Name (optional)"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Sector (optional)"
            value={formData.sector}
            onChange={(e) => setFormData(prev => ({ ...prev, sector: e.target.value }))}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            min="0"
            max="100"
            placeholder="ESG Score (optional)"
            value={formData.esgScore}
            onChange={(e) => setFormData(prev => ({ ...prev, esgScore: e.target.value }))}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          className="mt-4 w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Holding
        </button>
      </form>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-3 bg-white rounded-full px-6 py-3 shadow-lg border border-gray-100 mb-6">
            <Target className="w-6 h-6 text-blue-600" />
            <span className="text-lg font-semibold text-gray-900">AI Investment Advisor</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Smart ESG Investment Recommendations
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            AI-powered analysis of your portfolio with personalized sustainable investment recommendations
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-xl p-1 shadow-lg border border-gray-100">
            <div className="flex space-x-1">
              {['portfolio', 'recommendations', 'analysis', 'settings'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={clsx(
                    'px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2',
                    activeTab === tab
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  {tab === 'portfolio' && <PieChart className="w-4 h-4" />}
                  {tab === 'recommendations' && <TrendingUp className="w-4 h-4" />}
                  {tab === 'analysis' && <BarChart3 className="w-4 h-4" />}
                  {tab === 'settings' && <Settings className="w-4 h-4" />}
                  <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Portfolio Tab */}
        {activeTab === 'portfolio' && (
          <div className="space-y-8">
            {/* Add Holding Form */}
            <AddHoldingForm onAdd={addHolding} />

            {/* Current Holdings */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Current Portfolio</h3>
                <button
                  onClick={analyzePortfolio}
                  disabled={isAnalyzing || currentPortfolio.length === 0}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
                >
                  <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  <span>{isAnalyzing ? 'Analyzing...' : 'Analyze Portfolio'}</span>
                </button>
              </div>
              <div className="p-6">
                {currentPortfolio.length === 0 ? (
                  <div className="text-center py-12">
                    <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No holdings in your portfolio. Add some investments to get started.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">Symbol</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">Company</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">Shares</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">Price</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">Value</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">ESG Score</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentPortfolio.map((holding, index) => (
                          <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium">{holding.symbol}</td>
                            <td className="py-3 px-4">{holding.name}</td>
                            <td className="py-3 px-4">{holding.quantity}</td>
                            <td className="py-3 px-4">${holding.currentPrice.toFixed(2)}</td>
                            <td className="py-3 px-4">${(holding.quantity * holding.currentPrice).toLocaleString()}</td>
                            <td className="py-3 px-4">
                              <span className={`font-medium ${holding.esgScore >= 70 ? 'text-green-600' : holding.esgScore >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {holding.esgScore}/100
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <button
                                onClick={() => removeHolding(holding.symbol)}
                                className="text-red-600 hover:text-red-700 text-sm"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div className="space-y-8">
            {/* Filters */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Filter & Sort</h3>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                >
                  <Filter className="w-4 h-4" />
                  <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
                  {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Min ESG Score</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={filters.minESGScore}
                      onChange={(e) => setFilters(prev => ({ ...prev, minESGScore: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-500">{filters.minESGScore}/100</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Risk Score</label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={filters.maxRisk}
                      onChange={(e) => setFilters(prev => ({ ...prev, maxRisk: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-500">{filters.maxRisk}/10</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="esgScore">ESG Score</option>
                      <option value="expectedReturn">Expected Return</option>
                      <option value="riskScore">Risk Score</option>
                      <option value="recommendedAllocation">Allocation</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Recommendations Grid */}
            {sortedRecommendations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedRecommendations.map((rec, index) => (
                  <RecommendationCard
                    key={index}
                    recommendation={rec}
                    onSelect={setSelectedRecommendation}
                  />
                ))}
              </div>
            ) : analysisData ? (
              <div className="text-center py-12">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No recommendations match your current filters.</p>
              </div>
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Analyze your portfolio first to get personalized recommendations.</p>
              </div>
            )}
          </div>
        )}

        {/* Analysis Tab */}
        {activeTab === 'analysis' && analysisData && (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <PortfolioSummaryCard
                title="ESG Score"
                value={analysisData.portfolioAnalysis.currentESGScore}
                subtitle={`Grade: ${analysisData.portfolioAnalysis.sustainabilityGrade}`}
                icon={Star}
                color="from-green-500 to-emerald-600"
              />
              <PortfolioSummaryCard
                title="Risk Level"
                value={analysisData.portfolioAnalysis.riskLevel}
                subtitle="Overall portfolio risk"
                icon={Shield}
                color="from-blue-500 to-blue-600"
              />
              <PortfolioSummaryCard
                title="Diversification"
                value={`${analysisData.portfolioAnalysis.diversificationScore}%`}
                subtitle="Portfolio spread"
                icon={PieChart}
                color="from-purple-500 to-purple-600"
              />
              <PortfolioSummaryCard
                title="Carbon Intensity"
                value={analysisData.portfolioAnalysis.carbonIntensity}
                subtitle="kg CO₂e per $1000"
                icon={Leaf}
                color="from-orange-500 to-red-600"
              />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* ESG Radar Chart */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Portfolio ESG Analysis</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={[
                    { subject: 'Environmental', score: analysisData.portfolioAnalysis.currentESGScore * 0.9 },
                    { subject: 'Social', score: analysisData.portfolioAnalysis.currentESGScore * 1.1 },
                    { subject: 'Governance', score: analysisData.portfolioAnalysis.currentESGScore * 0.95 },
                    { subject: 'Innovation', score: analysisData.portfolioAnalysis.currentESGScore * 1.05 },
                    { subject: 'Risk Management', score: analysisData.portfolioAnalysis.currentESGScore * 0.85 },
                  ]}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar dataKey="score" stroke="#10B981" fill="#10B981" fillOpacity={0.3} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Optimization Chart */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Optimization Potential</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { metric: 'Current ESG', score: analysisData.portfolioAnalysis.currentESGScore },
                    { metric: 'Target ESG', score: analysisData.optimizedPortfolio.targetESGScore },
                    { metric: 'Current Return', score: 7.2 },
                    { metric: 'Target Return', score: analysisData.optimizedPortfolio.expectedAnnualReturn },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="metric" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="score" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Improvement Opportunities */}
            {analysisData.improvementOpportunities && (
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Improvement Opportunities</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {analysisData.improvementOpportunities.map((opportunity, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{opportunity.title}</h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          opportunity.priority === 'high' ? 'bg-red-100 text-red-800' :
                          opportunity.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {opportunity.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{opportunity.description}</p>
                      <p className="text-xs text-green-600 mb-2">{opportunity.impact}</p>
                      <p className="text-xs text-gray-500">{opportunity.action}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Investment Preferences</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Risk Tolerance</label>
                <select
                  value={preferences.riskTolerance}
                  onChange={(e) => setPreferences(prev => ({ ...prev, riskTolerance: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="conservative">Conservative</option>
                  <option value="moderate">Moderate</option>
                  <option value="aggressive">Aggressive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time Horizon</label>
                <select
                  value={preferences.timeHorizon}
                  onChange={(e) => setPreferences(prev => ({ ...prev, timeHorizon: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="short">Short-term (&lt; 2 years)</option>
                  <option value="medium">Medium-term (2-5 years)</option>
                  <option value="long">Long-term (&gt; 5 years)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sustainability Focus</label>
                <select
                  value={preferences.sustainabilityFocus}
                  onChange={(e) => setPreferences(prev => ({ ...prev, sustainabilityFocus: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Available Capital ($)</label>
                <input
                  type="number"
                  min="0"
                  value={preferences.availableCapital}
                  onChange={(e) => setPreferences(prev => ({ ...prev, availableCapital: parseInt(e.target.value) }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Recommendation Modal */}
        {selectedRecommendation && (
          <RecommendationModal
            recommendation={selectedRecommendation}
            onClose={() => setSelectedRecommendation(null)}
          />
        )}
      </div>
    </div>
  );
};

export default InvestmentRecommendationEngine;