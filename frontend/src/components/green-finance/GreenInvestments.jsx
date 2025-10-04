import React, { useState, useEffect } from 'react';
import {
  TreePine,
  TrendingUp,
  Award,
  DollarSign,
  Zap,
  Shield,
  CheckCircle,
  ArrowRight,
  Leaf,
  Target,
  BarChart3,
  Clock,
  Wallet
} from 'lucide-react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { clsx } from 'clsx';
import { carbonIntegration } from '../../lib/blockchain/carbon-integration';
import { useWallet } from '../../hooks/useWallet';

const GreenInvestments = ({ onInvestmentComplete }) => {
  const { isConnected, connection, processPayment } = useWallet();
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  const [isInvesting, setIsInvesting] = useState(false);
  const [investmentHistory, setInvestmentHistory] = useState([]);
  const [portfolioMetrics, setPortfolioMetrics] = useState(null);
  const [activeTab, setActiveTab] = useState('marketplace');

  const greenInvestmentOptions = [
    {
      id: 'green-bonds',
      type: 'green_bonds',
      name: 'Green Climate Bonds',
      provider: 'Green Climate Fund',
      minInvestment: 0.01,
      expectedReturn: 6.5,
      carbonImpact: 150,
      description: 'Support renewable energy and climate adaptation projects worldwide',
      riskLevel: 'Low',
      duration: '5 years',
      certification: 'Climate Bonds Standard',
      features: ['Fixed returns', 'Low risk', 'High impact'],
      color: 'from-green-500 to-emerald-600'
    },
    {
      id: 'renewable-fund',
      type: 'renewable_energy',
      name: 'Renewable Energy Fund',
      provider: 'Renewable Energy Fund',
      minInvestment: 0.05,
      expectedReturn: 8.2,
      carbonImpact: 200,
      description: 'Invest in solar, wind, and hydroelectric projects',
      riskLevel: 'Medium',
      duration: '3-7 years',
      certification: 'RE100 Certified',
      features: ['Variable returns', 'Diversified portfolio', 'Clean tech focus'],
      color: 'from-blue-500 to-cyan-600'
    },
    {
      id: 'carbon-credits',
      type: 'carbon_credits',
      name: 'Carbon Credit Portfolio',
      provider: 'ESG Investment Trust',
      minInvestment: 0.02,
      expectedReturn: 12.0,
      carbonImpact: 300,
      description: 'Trade verified carbon credits from reforestation and clean energy',
      riskLevel: 'High',
      duration: '1-10 years',
      certification: 'VCS & Gold Standard',
      features: ['High returns', 'Market volatility', 'Direct impact'],
      color: 'from-purple-500 to-indigo-600'
    },
    {
      id: 'esg-portfolio',
      type: 'esg_portfolio',
      name: 'ESG Stock Portfolio',
      provider: 'ESG Investment Trust',
      minInvestment: 0.1,
      expectedReturn: 9.5,
      carbonImpact: 180,
      description: 'Diversified portfolio of top-rated ESG companies',
      riskLevel: 'Medium',
      duration: 'Flexible',
      certification: 'MSCI ESG Rated',
      features: ['Professional management', 'ESG screened', 'Liquid'],
      color: 'from-orange-500 to-red-600'
    }
  ];

  useEffect(() => {
    loadInvestmentData();
  }, []);

  const loadInvestmentData = () => {
    const history = carbonIntegration.getGreenInvestmentHistory();
    const metrics = carbonIntegration.getGreenRewards();

    setInvestmentHistory(history);
    setPortfolioMetrics(metrics);
  };

  const handleInvestment = async (investment, amount) => {
    if (!isConnected || !connection) {
      alert('Please connect your wallet first');
      return;
    }

    if (amount < investment.minInvestment) {
      alert(`Minimum investment is ${investment.minInvestment} sBTC`);
      return;
    }

    if (connection.balance < amount) {
      alert('Insufficient sBTC balance');
      return;
    }

    setIsInvesting(true);

    try {
      const result = await carbonIntegration.makeGreenInvestment(
        {
          investmentType: investment.type,
          amount,
          expectedReturn: investment.expectedReturn,
          carbonImpact: investment.carbonImpact,
          provider: investment.provider
        },
        connection
      );

      if (result.success) {
        alert('Green investment successful! 🌱');
        loadInvestmentData();
        setSelectedInvestment(null);

        if (onInvestmentComplete) {
          onInvestmentComplete(result);
        }
      } else {
        alert(`Investment failed: ${result.error}`);
      }
    } catch (error) {
      alert(`Investment error: ${error.message}`);
    } finally {
      setIsInvesting(false);
    }
  };

  const getRiskColor = (level) => {
    switch (level.toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const generateMockChartData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      month,
      value: 1000 + Math.random() * 500,
      returns: Math.random() * 100 + 50
    }));
  };

  const InvestmentCard = ({ investment }) => (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 bg-gradient-to-br ${investment.color} rounded-xl shadow-lg group-hover:scale-110 transition-transform`}>
          {investment.type === 'green_bonds' && <Shield className="w-6 h-6 text-white" />}
          {investment.type === 'renewable_energy' && <Zap className="w-6 h-6 text-white" />}
          {investment.type === 'carbon_credits' && <TreePine className="w-6 h-6 text-white" />}
          {investment.type === 'esg_portfolio' && <BarChart3 className="w-6 h-6 text-white" />}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600">
            {investment.expectedReturn}%
          </div>
          <div className="text-sm text-gray-500">Expected Return</div>
        </div>
      </div>

      <h3 className="text-xl font-semibold text-gray-900 mb-2">{investment.name}</h3>
      <p className="text-gray-600 text-sm mb-4">{investment.description}</p>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500">Min Investment</p>
          <p className="font-semibold">{investment.minInvestment} sBTC</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Carbon Impact</p>
          <p className="font-semibold text-green-600">{investment.carbonImpact} kg CO₂e/year</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Duration</p>
          <p className="font-semibold">{investment.duration}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Risk Level</p>
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(investment.riskLevel)}`}>
            {investment.riskLevel}
          </span>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-2">Key Features</p>
        <div className="flex flex-wrap gap-2">
          {investment.features.map((feature, index) => (
            <span key={index} className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg">
              <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
              {feature}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <Award className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-900">Certification</span>
        </div>
        <p className="text-xs text-blue-700">{investment.certification}</p>
      </div>

      <button
        onClick={() => setSelectedInvestment(investment)}
        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 flex items-center justify-center space-x-2 group-hover:scale-105"
      >
        <span>Invest Now</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );

  const InvestmentModal = ({ investment, onClose }) => {
    const [amount, setAmount] = useState(investment.minInvestment);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full max-h-90vh overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Invest in {investment.name}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Investment Amount (sBTC)
              </label>
              <input
                type="number"
                min={investment.minInvestment}
                max={connection?.balance || 1}
                step={0.01}
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Available: {connection?.balance?.toFixed(4) || '0'} sBTC
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Investment Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span className="font-semibold">{amount} sBTC</span>
                </div>
                <div className="flex justify-between">
                  <span>Expected Annual Return:</span>
                  <span className="font-semibold text-green-600">
                    {(amount * investment.expectedReturn / 100).toFixed(4)} sBTC
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Carbon Impact:</span>
                  <span className="font-semibold text-green-600">
                    {((amount / investment.minInvestment) * investment.carbonImpact).toFixed(0)} kg CO₂e/year
                  </span>
                </div>
              </div>
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
              onClick={() => handleInvestment(investment, amount)}
              disabled={isInvesting || !isConnected}
              className="flex-1 bg-green-600 text-white font-semibold py-3 rounded-xl hover:bg-green-700 transition-colors disabled:bg-gray-400 flex items-center justify-center space-x-2"
            >
              {isInvesting ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4" />
                  <span>Invest</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-3 bg-white rounded-full px-6 py-3 shadow-lg border border-gray-100 mb-6">
            <Leaf className="w-6 h-6 text-green-600" />
            <span className="text-lg font-semibold text-gray-900">Green Investment Platform</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Invest with Impact
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Earn returns while supporting sustainable projects and fighting climate change
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-xl p-1 shadow-lg border border-gray-100">
            <div className="flex space-x-1">
              {['marketplace', 'portfolio', 'history'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={clsx(
                    'px-6 py-3 rounded-lg font-medium transition-all duration-200',
                    activeTab === tab
                      ? 'bg-green-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'marketplace' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {greenInvestmentOptions.map((investment) => (
              <InvestmentCard key={investment.id} investment={investment} />
            ))}
          </div>
        )}

        {activeTab === 'portfolio' && portfolioMetrics && (
          <div className="space-y-8">
            {/* Portfolio Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {portfolioMetrics.currentValue.toFixed(4)}
                    </div>
                    <div className="text-sm text-gray-500">sBTC</div>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Total Value</h3>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      +{portfolioMetrics.totalReturns.toFixed(4)}
                    </div>
                    <div className="text-sm text-gray-500">sBTC</div>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Total Returns</h3>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-600">
                      {portfolioMetrics.totalInvested.toFixed(4)}
                    </div>
                    <div className="text-sm text-gray-500">sBTC</div>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Invested</h3>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg">
                    <TreePine className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-600">
                      {portfolioMetrics.carbonSaved.toFixed(0)}
                    </div>
                    <div className="text-sm text-gray-500">kg CO₂e</div>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Carbon Saved</h3>
              </div>
            </div>

            {/* Portfolio Performance Chart */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Portfolio Performance</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={generateMockChartData()}>
                  <defs>
                    <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
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
                    dataKey="value"
                    stroke="#10B981"
                    strokeWidth={2}
                    fill="url(#valueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900">Investment History</h3>
            </div>
            <div className="p-6">
              {investmentHistory.length === 0 ? (
                <div className="text-center py-12">
                  <TreePine className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No investments yet. Start investing to see your history here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {investmentHistory.map((investment, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-medium text-gray-900">{investment.investmentType}</p>
                        <p className="text-sm text-gray-600">{investment.provider}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">{investment.amount} sBTC</p>
                        <p className="text-sm text-gray-500">{investment.expectedReturn}% expected</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Investment Modal */}
        {selectedInvestment && (
          <InvestmentModal
            investment={selectedInvestment}
            onClose={() => setSelectedInvestment(null)}
          />
        )}
      </div>
    </div>
  );
};

export default GreenInvestments;