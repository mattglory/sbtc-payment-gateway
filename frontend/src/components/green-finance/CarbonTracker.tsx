import React, { useState, useEffect } from 'react';
import {
  Leaf,
  TrendingDown,
  Target,
  Award,
  Activity,
  Calendar,
  TreePine,
  Zap,
  Factory,
  Plane,
  Car,
  Home
} from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

interface CarbonMetrics {
  totalReduction: number;
  monthlyReduction: number;
  yearlyProjection: number;
  offsetCredits: number;
  treesEquivalent: number;
  portfolioImpact: number;
}

interface CarbonActivity {
  date: string;
  type: 'investment' | 'offset' | 'reduction';
  description: string;
  impact: number;
  source: string;
}

interface CarbonGoal {
  target: number;
  current: number;
  deadline: string;
  description: string;
}

const CarbonTracker: React.FC = () => {
  const { actualTheme: theme } = useTheme();
  const [metrics, setMetrics] = useState<CarbonMetrics>({
    totalReduction: 12.7,
    monthlyReduction: 2.1,
    yearlyProjection: 25.4,
    offsetCredits: 847,
    treesEquivalent: 156,
    portfolioImpact: -8.9
  });

  const [activities, setActivities] = useState<CarbonActivity[]>([
    {
      date: '2024-01-15',
      type: 'investment',
      description: 'Invested in Clean Energy ETF',
      impact: -2.3,
      source: 'ICLN Portfolio'
    },
    {
      date: '2024-01-14',
      type: 'offset',
      description: 'Carbon offset purchase',
      impact: -1.8,
      source: 'Direct Purchase'
    },
    {
      date: '2024-01-12',
      type: 'reduction',
      description: 'Tesla investment impact',
      impact: -3.2,
      source: 'TSLA Holdings'
    },
    {
      date: '2024-01-10',
      type: 'investment',
      description: 'Green Bond allocation',
      impact: -1.5,
      source: 'ESG Bond Fund'
    }
  ]);

  const [goals, setGoals] = useState<CarbonGoal[]>([
    {
      target: 50,
      current: 12.7,
      deadline: '2024-12-31',
      description: 'Annual Carbon Reduction Goal'
    },
    {
      target: 1000,
      current: 847,
      deadline: '2024-06-30',
      description: 'Carbon Credit Accumulation'
    }
  ]);

  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'year'>('month');

  const getImpactColor = (impact: number) => {
    if (impact < 0) return 'text-green-600';
    if (impact > 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'investment':
        return <TrendingDown className="w-4 h-4 text-green-600" />;
      case 'offset':
        return <TreePine className="w-4 h-4 text-blue-600" />;
      case 'reduction':
        return <Leaf className="w-4 h-4 text-emerald-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getGoalProgress = (goal: CarbonGoal) => {
    return Math.min((goal.current / goal.target) * 100, 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`rounded-xl shadow-lg border p-6 ${
        theme === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <Leaf className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className={`text-2xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Carbon Impact Tracker
            </h2>
            <p className={`${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Monitor and optimize your investment portfolio's environmental impact
            </p>
          </div>
        </div>

        {/* Time Frame Selector */}
        <div className="flex space-x-2">
          {(['week', 'month', 'year'] as const).map((timeframe) => (
            <button
              key={timeframe}
              onClick={() => setSelectedTimeframe(timeframe)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedTimeframe === timeframe
                  ? 'bg-green-600 text-white'
                  : theme === 'dark'
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
            </button>
          ))}
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
              <TrendingDown className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-2xl font-bold text-green-600">
              -{metrics.totalReduction}
            </span>
          </div>
          <h3 className={`text-sm font-medium ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Total CO₂ Reduction
          </h3>
          <p className={`text-lg font-bold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            tons this year
          </p>
        </div>

        <div className={`rounded-xl shadow-lg border p-6 ${
          theme === 'dark'
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TreePine className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-2xl font-bold text-blue-600">
              {metrics.treesEquivalent}
            </span>
          </div>
          <h3 className={`text-sm font-medium ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Trees Equivalent
          </h3>
          <p className={`text-lg font-bold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            planted
          </p>
        </div>

        <div className={`rounded-xl shadow-lg border p-6 ${
          theme === 'dark'
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-2xl font-bold text-purple-600">
              {metrics.offsetCredits}
            </span>
          </div>
          <h3 className={`text-sm font-medium ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Carbon Credits
          </h3>
          <p className={`text-lg font-bold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            accumulated
          </p>
        </div>

        <div className={`rounded-xl shadow-lg border p-6 ${
          theme === 'dark'
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Target className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-2xl font-bold text-emerald-600">
              {metrics.yearlyProjection}
            </span>
          </div>
          <h3 className={`text-sm font-medium ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Yearly Projection
          </h3>
          <p className={`text-lg font-bold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            tons CO₂ saved
          </p>
        </div>
      </div>

      {/* Carbon Goals */}
      <div className={`rounded-xl shadow-lg border p-6 ${
        theme === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 flex items-center space-x-2 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          <Target className="w-5 h-5 text-green-600" />
          <span>Carbon Goals</span>
        </h3>

        <div className="space-y-4">
          {goals.map((goal, index) => (
            <div key={index} className={`p-4 rounded-lg ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`font-medium ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {goal.description}
                </span>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {new Date(goal.deadline).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Progress: {goal.current} / {goal.target}
                </span>
                <span className="text-sm font-medium text-green-600">
                  {getGoalProgress(goal).toFixed(1)}%
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getGoalProgress(goal)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activities */}
      <div className={`rounded-xl shadow-lg border p-6 ${
        theme === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 flex items-center space-x-2 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          <Activity className="w-5 h-5 text-blue-600" />
          <span>Recent Carbon Activities</span>
        </h3>

        <div className="space-y-3">
          {activities.map((activity, index) => (
            <div
              key={index}
              className={`flex items-center space-x-4 p-3 rounded-lg ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
              }`}
            >
              <div className="flex-shrink-0">
                {getActivityIcon(activity.type)}
              </div>

              <div className="flex-1">
                <div className={`font-medium ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {activity.description}
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                    {activity.source}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                    {formatDate(activity.date)}
                  </span>
                </div>
              </div>

              <div className={`text-right`}>
                <div className={`font-bold ${getImpactColor(activity.impact)}`}>
                  {activity.impact > 0 ? '+' : ''}{activity.impact} tons
                </div>
                <div className={`text-xs capitalize ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {activity.type}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Carbon Footprint Breakdown */}
      <div className={`rounded-xl shadow-lg border p-6 ${
        theme === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 flex items-center space-x-2 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          <Factory className="w-5 h-5 text-gray-600" />
          <span>Portfolio Carbon Breakdown</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`p-4 rounded-lg ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="w-4 h-4 text-yellow-600" />
              <span className={`text-sm font-medium ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Energy Sector
              </span>
            </div>
            <div className="text-lg font-bold text-green-600">-4.2 tons</div>
            <div className={`text-xs ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Renewable investments
            </div>
          </div>

          <div className={`p-4 rounded-lg ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <div className="flex items-center space-x-2 mb-2">
              <Car className="w-4 h-4 text-blue-600" />
              <span className={`text-sm font-medium ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Transportation
              </span>
            </div>
            <div className="text-lg font-bold text-green-600">-3.1 tons</div>
            <div className={`text-xs ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              EV manufacturers
            </div>
          </div>

          <div className={`p-4 rounded-lg ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <div className="flex items-center space-x-2 mb-2">
              <Home className="w-4 h-4 text-green-600" />
              <span className={`text-sm font-medium ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Real Estate
              </span>
            </div>
            <div className="text-lg font-bold text-green-600">-1.8 tons</div>
            <div className={`text-xs ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Green buildings
            </div>
          </div>

          <div className={`p-4 rounded-lg ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <div className="flex items-center space-x-2 mb-2">
              <TreePine className="w-4 h-4 text-emerald-600" />
              <span className={`text-sm font-medium ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Offsets
              </span>
            </div>
            <div className="text-lg font-bold text-green-600">-3.6 tons</div>
            <div className={`text-xs ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Direct purchases
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarbonTracker;