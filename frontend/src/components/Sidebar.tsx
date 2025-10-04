import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Target,
  TrendingUp,
  Activity,
  Leaf,
  CreditCard,
  Home,
  ChevronRight
} from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const location = useLocation();

  const sidebarItems = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      path: '/dashboard',
      icon: BarChart3,
      description: 'Overview & Analytics'
    },
    {
      id: 'esg-analyzer',
      name: 'ESG Analysis',
      path: '/esg-analyzer',
      icon: Target,
      description: 'Company ESG Scoring'
    },
    {
      id: 'recommendations',
      name: 'AI Recommendations',
      path: '/recommendations',
      icon: TrendingUp,
      description: 'Investment Suggestions'
    },
    {
      id: 'carbon-tracker',
      name: 'Carbon Tracker',
      path: '/carbon-tracker',
      icon: Activity,
      description: 'Emissions & Offsets'
    },
    {
      id: 'investments',
      name: 'Green Investments',
      path: '/investments',
      icon: Leaf,
      description: 'Sustainable Investing'
    },
    {
      id: 'payment-demo',
      name: 'Payment Demo',
      path: '/payment-demo',
      icon: CreditCard,
      description: 'sBTC Payments'
    }
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 shadow-sm">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Home className="w-5 h-5 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-2">
        {sidebarItems.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            className={clsx(
              'flex items-center justify-between p-3 rounded-lg text-sm font-medium transition-all duration-200 group',
              isActive(item.path)
                ? 'bg-green-50 text-green-700 border border-green-200 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            )}
            onClick={() => onViewChange(item.id)}
          >
            <div className="flex items-center space-x-3">
              <item.icon
                className={clsx(
                  'w-5 h-5',
                  isActive(item.path) ? 'text-green-600' : 'text-gray-400'
                )}
              />
              <div>
                <div className="font-medium">{item.name}</div>
                <div className="text-xs text-gray-500">{item.description}</div>
              </div>
            </div>
            <ChevronRight
              className={clsx(
                'w-4 h-4 transition-transform',
                isActive(item.path)
                  ? 'text-green-600 transform rotate-90'
                  : 'text-gray-400 group-hover:text-gray-600'
              )}
            />
          </Link>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <div className="flex items-center space-x-2 mb-2">
            <Leaf className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Green Finance</span>
          </div>
          <p className="text-xs text-green-700">
            Sustainable investing powered by sBTC blockchain technology
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;