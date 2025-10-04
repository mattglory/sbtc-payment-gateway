import React, { useState, useEffect } from 'react';
import {
  Leaf,
  TrendingUp,
  Download,
  Share2,
  Mail,
  FileText,
  BarChart3,
  Target,
  Award,
  TreePine,
  DollarSign,
  Zap,
  Settings,
  RefreshCw
} from 'lucide-react';
import CarbonTracker from '../../components/green-finance/CarbonTracker';
import GreenInvestments from '../../components/green-finance/GreenInvestments';
import CarbonReportExporter from '../../lib/utils/carbon-export';
import { carbonIntegration } from '../../lib/blockchain/carbon-integration';
import { useWallet } from '../../hooks/useWallet';

const CarbonDashboard = () => {
  const { isConnected, connection } = useWallet();
  const [activeTab, setActiveTab] = useState('tracker');
  const [carbonData, setCarbonData] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [userMetrics, setUserMetrics] = useState({
    totalEmissions: 0,
    totalOffsets: 0,
    netEmissions: 0,
    totalInvestmentImpact: 0
  });

  useEffect(() => {
    // Load persisted carbon data
    carbonIntegration.loadPersistedData();
    updateUserMetrics();
  }, []);

  const updateUserMetrics = () => {
    const metrics = carbonIntegration.getTotalCarbonImpact();
    setUserMetrics(metrics);
  };

  const handleCarbonAnalysis = (data) => {
    setCarbonData(data);
    updateUserMetrics();
  };

  const handleInvestmentComplete = (result) => {
    updateUserMetrics();
    // Show success notification or update UI
  };

  const exportReport = async (format) => {
    if (!carbonData) {
      alert('No carbon data available to export. Please run an analysis first.');
      return;
    }

    setIsExporting(true);

    try {
      const userInfo = {
        name: connection?.address ? `${connection.address.substring(0, 8)}...` : 'User',
        address: connection?.address || '',
        exportDate: new Date().toISOString()
      };

      switch (format) {
        case 'csv':
          await CarbonReportExporter.downloadCSV(carbonData);
          break;
        case 'json':
          await CarbonReportExporter.downloadJSON(carbonData, userInfo);
          break;
        case 'pdf':
          await CarbonReportExporter.downloadPDF(carbonData, userInfo);
          break;
        case 'email':
          CarbonReportExporter.generateEmailReport(carbonData, userInfo);
          break;
        default:
          throw new Error('Unsupported export format');
      }
    } catch (error) {
      alert(`Export failed: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const shareResults = async (platform) => {
    if (!carbonData) {
      alert('No carbon data available to share. Please run an analysis first.');
      return;
    }

    try {
      await CarbonReportExporter.shareCarbonData(carbonData, platform);
    } catch (error) {
      alert(`Share failed: ${error.message}`);
    }
  };

  const ImpactSummaryCard = ({ title, value, unit, icon: Icon, color, description }) => (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 bg-gradient-to-br ${color} rounded-xl shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            {typeof value === 'number' ? value.toFixed(2) : value}
          </div>
          <div className="text-sm text-gray-500">{unit}</div>
        </div>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Carbon Impact Dashboard</h1>
                <p className="text-sm text-gray-600">Track, analyze, and offset your carbon footprint</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Export Menu */}
              <div className="relative group">
                <button
                  disabled={!carbonData || isExporting}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                >
                  <Download className="w-4 h-4" />
                  <span>{isExporting ? 'Exporting...' : 'Export'}</span>
                </button>

                {/* Dropdown menu */}
                {carbonData && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                    <div className="py-2">
                      <button
                        onClick={() => exportReport('pdf')}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        <span>PDF Report</span>
                      </button>
                      <button
                        onClick={() => exportReport('csv')}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <BarChart3 className="w-4 h-4" />
                        <span>CSV Data</span>
                      </button>
                      <button
                        onClick={() => exportReport('json')}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        <span>JSON Export</span>
                      </button>
                      <div className="border-t border-gray-200 my-1"></div>
                      <button
                        onClick={() => exportReport('email')}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        <span>Email Report</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Share Menu */}
              <div className="relative group">
                <button
                  disabled={!carbonData}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>

                {carbonData && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                    <div className="py-2">
                      <button
                        onClick={() => shareResults('twitter')}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <span>🐦</span>
                        <span>Twitter</span>
                      </button>
                      <button
                        onClick={() => shareResults('linkedin')}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <span>💼</span>
                        <span>LinkedIn</span>
                      </button>
                      <button
                        onClick={() => shareResults('generic')}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>Copy Text</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 mt-4">
            {[
              { key: 'tracker', label: 'Carbon Tracker', icon: BarChart3 },
              { key: 'investments', label: 'Green Investments', icon: TrendingUp },
              { key: 'summary', label: 'Impact Summary', icon: Target }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-t-lg font-medium transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1">
        {activeTab === 'tracker' && (
          <CarbonTracker
            sbtcBalance={connection?.balance || 0}
            userId={connection?.address}
            onAnalysisComplete={handleCarbonAnalysis}
          />
        )}

        {activeTab === 'investments' && (
          <GreenInvestments onInvestmentComplete={handleInvestmentComplete} />
        )}

        {activeTab === 'summary' && (
          <div className="p-8">
            <div className="max-w-7xl mx-auto">
              {/* Overall Impact Summary */}
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">Your Environmental Impact</h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Complete overview of your carbon footprint, offsets, and green investments
                </p>
              </div>

              {/* Impact Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <ImpactSummaryCard
                  title="Total Emissions"
                  value={userMetrics.totalEmissions}
                  unit="kg CO₂e"
                  icon={Zap}
                  color="from-red-500 to-red-600"
                  description="Total carbon footprint tracked"
                />
                <ImpactSummaryCard
                  title="Carbon Offsets"
                  value={userMetrics.totalOffsets}
                  unit="kg CO₂e"
                  icon={TreePine}
                  color="from-green-500 to-green-600"
                  description="CO₂ neutralized through offsets"
                />
                <ImpactSummaryCard
                  title="Net Emissions"
                  value={userMetrics.netEmissions}
                  unit="kg CO₂e"
                  icon={Target}
                  color={userMetrics.netEmissions <= 0 ? 'from-emerald-500 to-emerald-600' : 'from-orange-500 to-orange-600'}
                  description={userMetrics.netEmissions <= 0 ? 'Carbon neutral achieved!' : 'Remaining footprint'}
                />
                <ImpactSummaryCard
                  title="Investment Impact"
                  value={userMetrics.totalInvestmentImpact}
                  unit="kg CO₂e/year"
                  icon={Award}
                  color="from-blue-500 to-blue-600"
                  description="Annual carbon savings from investments"
                />
              </div>

              {/* Progress Visualization */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8">
                <h3 className="text-2xl font-semibold text-gray-900 mb-6">Carbon Neutrality Progress</h3>

                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Progress to Carbon Neutral</span>
                    <span className="text-sm font-medium text-gray-900">
                      {userMetrics.totalEmissions > 0
                        ? `${Math.min(100, ((userMetrics.totalOffsets / userMetrics.totalEmissions) * 100)).toFixed(1)}%`
                        : '0%'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full transition-all duration-1000 ${
                        userMetrics.netEmissions <= 0
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                          : 'bg-gradient-to-r from-orange-500 to-red-500'
                      }`}
                      style={{
                        width: `${Math.min(100, userMetrics.totalEmissions > 0
                          ? (userMetrics.totalOffsets / userMetrics.totalEmissions) * 100
                          : 0)}%`
                      }}
                    />
                  </div>
                </div>

                {userMetrics.netEmissions <= 0 ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-500 rounded-full">
                        <TreePine className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-green-900">🎉 Carbon Neutral Achieved!</h4>
                        <p className="text-green-700">
                          Congratulations! You&apos;ve successfully offset your carbon footprint.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-orange-500 rounded-full">
                        <Target className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-orange-900">Keep Going!</h4>
                        <p className="text-orange-700">
                          You need {userMetrics.netEmissions.toFixed(2)} more kg CO₂e in offsets to reach carbon neutrality.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Items */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-8 border border-blue-100">
                <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
                  Recommended Next Steps
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="p-4 bg-white rounded-xl shadow-sm mb-4">
                      <BarChart3 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <h4 className="font-semibold text-gray-900">Track More</h4>
                      <p className="text-sm text-gray-600">
                        Analyze more transactions to get a complete picture
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('tracker')}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Go to Tracker →
                    </button>
                  </div>

                  <div className="text-center">
                    <div className="p-4 bg-white rounded-xl shadow-sm mb-4">
                      <TreePine className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <h4 className="font-semibold text-gray-900">Buy Offsets</h4>
                      <p className="text-sm text-gray-600">
                        Neutralize remaining emissions with verified offsets
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('tracker')}
                      className="text-green-600 hover:text-green-700 font-medium"
                    >
                      View Offsets →
                    </button>
                  </div>

                  <div className="text-center">
                    <div className="p-4 bg-white rounded-xl shadow-sm mb-4">
                      <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <h4 className="font-semibold text-gray-900">Invest Green</h4>
                      <p className="text-sm text-gray-600">
                        Earn returns while supporting climate solutions
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('investments')}
                      className="text-purple-600 hover:text-purple-700 font-medium"
                    >
                      Explore Investments →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CarbonDashboard;