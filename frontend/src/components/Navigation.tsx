import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Leaf,
  BarChart3,
  TrendingUp,
  Target,
  Activity,
  CreditCard,
  Settings,
  HelpCircle,
  Bell,
  User,
  Monitor,
  Globe,
  Wallet,
  Bot,
  PieChart,
  Bitcoin,
  Sun,
  Moon
} from 'lucide-react';
import { clsx } from 'clsx';
import { useTheme } from '../hooks/useTheme';

interface NavigationProps {
  currentView: string;
  setCurrentView: (view: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({
  currentView,
  setCurrentView
}) => {
  const location = useLocation();
  const { actualTheme: theme, toggleTheme } = useTheme();

  const navigationItems = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      path: '/dashboard',
      icon: BarChart3,
      description: 'Overview & Analytics'
    },
    {
      id: 'esg-analysis',
      name: 'ESG Analysis',
      path: '/esg-analysis',
      icon: Bot,
      description: 'AI-Powered ESG Scoring'
    },
    {
      id: 'recommendations',
      name: 'AI Recommendations',
      path: '/recommendations',
      icon: TrendingUp,
      description: 'Investment Suggestions'
    },
    {
      id: 'portfolio',
      name: 'Portfolio',
      path: '/portfolio',
      icon: PieChart,
      description: 'Investment Management'
    },
    {
      id: 'carbon-tracker',
      name: 'Carbon Tracker',
      path: '/carbon-tracker',
      icon: Activity,
      description: 'Environmental Impact'
    },
    {
      id: 'wallet',
      name: 'Wallet',
      path: '/wallet',
      icon: Wallet,
      description: 'sBTC Integration'
    },
    {
      id: 'analytics',
      name: 'Analytics',
      path: '/analytics',
      icon: Target,
      description: 'Performance Insights'
    },
    {
      id: 'payments',
      name: 'Payments',
      path: '/payments',
      icon: Bitcoin,
      description: 'sBTC Payments'
    }
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className={`backdrop-blur-sm border-b sticky top-0 z-50 shadow-sm transition-colors ${
      theme === 'dark'
        ? 'bg-gray-900/95 border-gray-800'
        : 'bg-white/95 border-gray-200'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <Link to="/dashboard" className="flex items-center space-x-3 group">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className={`text-xl font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Green Finance Platform
                </h1>
                <p className={`text-xs ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Bitcoin Frontier Fund Demo
                </p>
              </div>
            </Link>

            <div className="hidden md:flex items-center space-x-1 ml-8">
              {navigationItems.slice(0, 6).map((item) => (
                <Link
                  key={item.id}
                  to={item.path}
                  className={clsx(
                    'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive(item.path)
                      ? theme === 'dark'
                        ? 'bg-green-900/50 text-green-400 border border-green-800'
                        : 'bg-green-50 text-green-700 border border-green-200 shadow-sm'
                      : theme === 'dark'
                        ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  )}
                  onClick={() => setCurrentView(item.id)}
                >
                  <item.icon className={clsx(
                    'w-4 h-4',
                    isActive(item.path)
                      ? theme === 'dark' ? 'text-green-400' : 'text-green-600'
                      : theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                  )} />
                  <span className="hidden lg:block">{item.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {/* Bitcoin Frontier Fund Badge */}
            <div className={`hidden md:flex items-center space-x-2 px-3 py-1 rounded-full border ${
              theme === 'dark'
                ? 'bg-orange-900/20 border-orange-800 text-orange-400'
                : 'bg-orange-50 border-orange-200 text-orange-600'
            }`}>
              <Bitcoin className="w-4 h-4" />
              <span className="text-sm font-medium">BFF Demo</span>
            </div>

            {/* Status Indicator */}
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className={`text-sm hidden sm:block ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Live
              </span>
            </div>

            {/* Notifications */}
            <button className={`p-2 relative rounded-lg transition-colors ${
              theme === 'dark'
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}>
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Settings Dropdown */}
            <div className="relative group">
              <button className={`p-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}>
                <Settings className="w-5 h-5" />
              </button>
            </div>

            {/* User Profile */}
            <div className="relative group">
              <button className={`flex items-center space-x-2 p-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}>
                <User className="w-5 h-5" />
                <span className={`hidden sm:block text-sm ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Demo User
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-4">
          <div className="flex space-x-2 overflow-x-auto">
            {navigationItems.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                className={clsx(
                  'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200',
                  isActive(item.path)
                    ? theme === 'dark'
                      ? 'bg-green-900/50 text-green-400 border border-green-800'
                      : 'bg-green-50 text-green-700 border border-green-200'
                    : theme === 'dark'
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                )}
                onClick={() => setCurrentView(item.id)}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navigation;