import React, { useState, useEffect } from 'react';
import {
  Leaf,
  Target,
  TrendingUp,
  TrendingDown,
  Award,
  AlertTriangle,
  CheckCircle,
  Zap,
  TreePine,
  Globe,
  Droplets,
  Wind,
  Sun,
  Factory,
  Users,
  Shield,
  BarChart3,
  PieChart
} from 'lucide-react';
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar
} from 'recharts';
import { clsx } from 'clsx';

const SustainabilityMetrics = ({ data, onGoalUpdate }) => {
  const [selectedMetric, setSelectedMetric] = useState('overview');
  const [showDetailedView, setShowDetailedView] = useState(false);

  // Sustainability score breakdown
  const sustainabilityBreakdown = [
    { name: 'Portfolio ESG', value: data?.esgScore || 78, color: '#10B981', icon: Shield },
    { name: 'Carbon Footprint', value: Math.max(0, 100 - (Math.abs(data?.netEmissions || 0) / 10)), color: '#3B82F6', icon: Leaf },
    { name: 'Green Allocation', value: data?.greenAllocation || 65, color: '#8B5CF6', icon: TreePine },
    { name: 'Impact Investing', value: data?.impactScore || 72, color: '#F59E0B', icon: Globe }
  ];

  // Environmental impact metrics
  const environmentalMetrics = [
    {
      id: 'carbon',
      title: 'Carbon Footprint',
      value: data?.totalEmissions || 245,
      unit: 'kg CO₂e',
      change: -15.2,
      icon: Factory,
      color: 'from-red-500 to-red-600',
      description: 'Total carbon emissions from investments',
      target: 150,
      benchmark: 'Industry average: 320 kg CO₂e'
    },
    {
      id: 'offsets',
      title: 'Carbon Offsets',
      value: data?.totalOffsets || 190,
      unit: 'kg CO₂e',
      change: 23.7,
      icon: TreePine,
      color: 'from-green-500 to-green-600',
      description: 'Carbon offsets purchased',
      target: 245,
      benchmark: 'Target: Net zero by 2024'
    },
    {
      id: 'renewable',
      title: 'Renewable Energy',
      value: 42,
      unit: '% allocation',
      change: 8.3,
      icon: Sun,
      color: 'from-yellow-500 to-orange-500',
      description: 'Investment in renewable energy',
      target: 50,
      benchmark: 'Global average: 28%'
    },
    {
      id: 'water',
      title: 'Water Impact',
      value: 12.5,
      unit: 'ML saved',
      change: 5.7,
      icon: Droplets,
      color: 'from-blue-500 to-blue-600',
      description: 'Water conservation impact',
      target: 15,
      benchmark: 'Conservation projects funded'
    }
  ];

  // Social impact metrics
  const socialMetrics = [
    {
      id: 'jobs',
      title: 'Green Jobs Created',
      value: 1247,
      unit: 'jobs',
      change: 12.4,
      icon: Users,
      description: 'Jobs supported in green economy'
    },
    {
      id: 'communities',
      title: 'Communities Impacted',
      value: 34,
      unit: 'communities',
      change: 6.2,
      icon: Globe,
      description: 'Communities positively impacted'
    }
  ];

  const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'];

  const MetricCard = ({ metric, index }) => (
    <div
      className={clsx(
        "bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer group",
        selectedMetric === metric.id && "ring-2 ring-green-500 ring-opacity-50"
      )}
      onClick={() => setSelectedMetric(metric.id)}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 bg-gradient-to-br ${metric.color} rounded-xl shadow-lg group-hover:scale-110 transition-transform`}>
          <metric.icon className="w-6 h-6 text-white" />
        </div>
        <div className={`flex items-center space-x-1 ${
          metric.change > 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {metric.change > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          <span className="text-sm font-medium">{Math.abs(metric.change)}%</span>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-3xl font-bold text-gray-900 mb-1 group-hover:scale-105 transition-transform">
          {metric.value.toLocaleString()}{metric.unit && ` ${metric.unit}`}
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{metric.title}</h3>
        <p className="text-sm text-gray-600 mt-1">{metric.description}</p>
      </div>

      {metric.target && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-500">Progress to target</span>
            <span className="text-xs font-medium text-gray-700">
              {Math.round((metric.value / metric.target) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`bg-gradient-to-r ${metric.color.replace('from-', 'from-').replace('to-', 'to-')} h-2 rounded-full transition-all duration-1000`}
              style={{ width: `${Math.min(100, (metric.value / metric.target) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {metric.benchmark && (
        <p className="text-xs text-gray-500">{metric.benchmark}</p>
      )}
    </div>
  );

  const SustainabilityScore = () => (
    <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
      <div className="text-center mb-8">
        <div className="inline-flex items-center space-x-3 bg-green-50 rounded-full px-6 py-3 mb-4">
          <Award className="w-6 h-6 text-green-600" />
          <span className="text-lg font-semibold text-green-900">Sustainability Score</span>
        </div>
        <div className="text-6xl font-bold text-green-600 mb-2">
          {sustainabilityBreakdown.reduce((sum, item) => sum + item.value, 0) / sustainabilityBreakdown.length || 82}
        </div>
        <p className="text-xl text-gray-600">Excellent Rating</p>
        <p className="text-sm text-gray-500 mt-2">Top 15% of sustainable portfolios</p>
      </div>

      {/* Radial Progress Chart */}
      <div className="mb-8">
        <ResponsiveContainer width="100%" height={300}>
          <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={sustainabilityBreakdown}>
            <RadialBar
              dataKey="value"
              cornerRadius={10}
              fill={(entry, index) => COLORS[index % COLORS.length]}
            />
            <Tooltip formatter={(value, name) => [`${value}%`, name]} />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>

      {/* Breakdown Legend */}
      <div className="grid grid-cols-2 gap-4">
        {sustainabilityBreakdown.map((item, index) => (
          <div key={item.name} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
              <p className="text-lg font-bold text-gray-700">{item.value}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const DetailedMetricView = () => {
    const currentMetric = environmentalMetrics.find(m => m.id === selectedMetric);
    if (!currentMetric) return null;

    return (
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className={`p-4 bg-gradient-to-br ${currentMetric.color} rounded-xl shadow-lg`}>
              <currentMetric.icon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{currentMetric.title}</h3>
              <p className="text-gray-600">{currentMetric.description}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-gray-900">
              {currentMetric.value.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">{currentMetric.unit}</div>
          </div>
        </div>

        {/* Progress towards target */}
        {currentMetric.target && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-3">
              <span className="font-semibold text-gray-900">Progress to Target</span>
              <span className="text-2xl font-bold text-green-600">
                {Math.round((currentMetric.value / currentMetric.target) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className={`bg-gradient-to-r ${currentMetric.color} h-4 rounded-full transition-all duration-1000`}
                style={{ width: `${Math.min(100, (currentMetric.value / currentMetric.target) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-500 mt-2">
              <span>Current: {currentMetric.value.toLocaleString()} {currentMetric.unit}</span>
              <span>Target: {currentMetric.target.toLocaleString()} {currentMetric.unit}</span>
            </div>
          </div>
        )}

        {/* Historical trend chart */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-4">6-Month Trend</h4>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={generateTrendData(currentMetric.value)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="value"
                stroke={currentMetric.color.includes('green') ? '#10B981' : '#3B82F6'}
                fill={currentMetric.color.includes('green') ? '#D1FAE5' : '#DBEAFE'}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Benchmark comparison */}
        <div className="p-4 bg-gray-50 rounded-xl">
          <h4 className="font-semibold text-gray-900 mb-2">Benchmark</h4>
          <p className="text-sm text-gray-700">{currentMetric.benchmark}</p>
        </div>
      </div>
    );
  };

  const generateTrendData = (currentValue) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month, index) => ({
      month,
      value: currentValue * (0.7 + (index * 0.05) + Math.random() * 0.1)
    }));
  };

  const ImpactSummary = () => (
    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-8 text-white shadow-lg">
      <h3 className="text-2xl font-bold mb-6">Your Impact This Year</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <TreePine className="w-8 h-8" />
            <span className="text-lg font-semibold">Environmental</span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>CO₂ Reduced:</span>
              <span className="font-bold">{(data?.totalOffsets || 190).toLocaleString()} kg</span>
            </div>
            <div className="flex justify-between">
              <span>Trees Equivalent:</span>
              <span className="font-bold">{Math.round((data?.totalOffsets || 190) / 20)} trees</span>
            </div>
            <div className="flex justify-between">
              <span>Clean Energy:</span>
              <span className="font-bold">15.2 MWh supported</span>
            </div>
          </div>
        </div>

        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Users className="w-8 h-8" />
            <span className="text-lg font-semibold">Social</span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Jobs Supported:</span>
              <span className="font-bold">1,247</span>
            </div>
            <div className="flex justify-between">
              <span>Communities:</span>
              <span className="font-bold">34 impacted</span>
            </div>
            <div className="flex justify-between">
              <span>Education:</span>
              <span className="font-bold">$12K donated</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-white/20 backdrop-blur-sm rounded-xl">
        <div className="flex items-center space-x-2 mb-2">
          <Award className="w-5 h-5" />
          <span className="font-semibold">Achievement Unlocked!</span>
        </div>
        <p className="text-sm opacity-90">
          You're in the top 10% of sustainable investors. Your portfolio has achieved carbon negativity!
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Sustainability Metrics</h2>
          <p className="text-gray-600 mt-2">Track your environmental and social impact</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowDetailedView(!showDetailedView)}
            className={clsx(
              'px-4 py-2 rounded-lg font-medium transition-colors',
              showDetailedView
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Detailed View
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Sustainability Score */}
        <div>
          <SustainabilityScore />
        </div>

        {/* Middle Column - Metrics or Detailed View */}
        <div className="lg:col-span-2">
          {showDetailedView ? (
            <DetailedMetricView />
          ) : (
            <div className="space-y-6">
              {/* Environmental Metrics Grid */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Environmental Impact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {environmentalMetrics.map((metric, index) => (
                    <MetricCard key={metric.id} metric={metric} index={index} />
                  ))}
                </div>
              </div>

              {/* Social Impact Summary */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Social Impact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {socialMetrics.map((metric, index) => (
                    <div key={metric.id} className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                          <metric.icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex items-center space-x-1 text-green-600">
                          <TrendingUp className="w-4 h-4" />
                          <span className="text-sm font-medium">{metric.change}%</span>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {metric.value.toLocaleString()}{metric.unit && ` ${metric.unit}`}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{metric.title}</h3>
                      <p className="text-sm text-gray-600">{metric.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Impact Summary Card */}
      <ImpactSummary />
    </div>
  );
};

export default SustainabilityMetrics;