import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Eye,
  ArrowUpRight,
  Activity,
  Users,
  BarChart3,
  PieChart,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  ExternalLink,
  Calendar,
  Home
} from 'lucide-react';
import Link from 'next/link';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    failed: 0,
    totalRevenue: 0,
    successRate: 0
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch stats and recent transactions in parallel
      const [statsResponse, transactionsResponse] = await Promise.all([
        fetch('/api/transactions/stats', {
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_API_KEY || 'pk_test_demo'}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/transactions', {
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_API_KEY || 'pk_test_demo'}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (!statsResponse.ok || !transactionsResponse.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const statsData = await statsResponse.json();
      const transactionsData = await transactionsResponse.json();

      setStats(statsData.data || {});
      // Get last 5 transactions
      setRecentTransactions((transactionsData.data || []).slice(0, 5));
    } catch (err) {
      setError(err.message);
      setToast({
        type: 'error',
        message: 'Failed to load dashboard data. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatAmount = (amount) => {
    const num = parseFloat(amount) || 0;
    return num.toFixed(6) + ' STX';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statCards = [
    {
      title: 'Total Revenue',
      value: formatAmount(stats.totalRevenue),
      icon: DollarSign,
      change: '+12.5%',
      changeType: 'positive',
      description: 'From completed transactions'
    },
    {
      title: 'Total Transactions',
      value: stats.total.toLocaleString(),
      icon: CreditCard,
      change: '+8.2%',
      changeType: 'positive',
      description: 'All payment transactions'
    },
    {
      title: 'Success Rate',
      value: `${stats.successRate}%`,
      icon: TrendingUp,
      change: stats.successRate >= 90 ? '+2.1%' : '-1.4%',
      changeType: stats.successRate >= 90 ? 'positive' : 'negative',
      description: 'Payment completion rate'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-[#0A0B0D] to-orange-900 flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-[#0A0B0D] to-orange-900 relative">
      {/* Dot grid pattern background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(255,255,255,0.05)_1px,_transparent_0)] [background-size:40px_40px] pointer-events-none"></div>
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link
              href="/"
              className="inline-flex items-center text-sm text-gray-400 hover:text-[#FF6B35] mr-2 transition-all duration-300"
            >
              <Home className="w-4 h-4 mr-1" />
              Home
            </Link>
            <span className="text-gray-600 mx-2">/</span>
            <span className="text-sm bg-gradient-to-r from-[#5546FF] to-[#FF6B35] bg-clip-text text-transparent font-medium">Dashboard</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-[#5546FF] via-[#F7931A] to-[#FF6B35] bg-clip-text text-transparent">
                sBTC Payment Dashboard
              </h1>
              <p className="text-gray-300">
                Monitor your sBTC payment gateway performance and analytics
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button
                onClick={fetchDashboardData}
                className="inline-flex items-center px-4 py-2 border border-white/20 rounded-xl shadow-sm text-sm font-medium text-gray-300 bg-[#1A1B1F]/60 backdrop-blur-md hover:bg-[#1A1B1F] hover:border-[#5546FF] transition-all duration-300"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
              <Link
                href="/transactions"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[#5546FF] to-[#FF6B35] hover:shadow-[0_0_30px_rgba(85,70,255,0.5)] transition-all duration-300"
              >
                <Eye className="w-4 h-4 mr-2" />
                View All Transactions
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statCards.map((card, index) => {
            const borderColor = index === 0 ? 'border-[#5546FF]' : index === 1 ? 'border-[#FF6B35]' : 'border-green-500';
            const iconBgColor = index === 0 ? 'bg-[#5546FF]/20' : index === 1 ? 'bg-[#FF6B35]/20' : 'bg-green-500/20';
            const iconColor = index === 0 ? 'text-[#5546FF]' : index === 1 ? 'text-[#FF6B35]' : 'text-green-500';
            const glowColor = index === 0 ? 'hover:shadow-[0_20px_50px_rgba(85,70,255,0.3)]' : index === 1 ? 'hover:shadow-[0_20px_50px_rgba(255,107,53,0.3)]' : 'hover:shadow-[0_20px_50px_rgba(34,197,94,0.3)]';

            return (
              <div key={index} className={`bg-[#1A1B1F]/60 backdrop-blur-md rounded-xl shadow-xl p-6 border-l-4 ${borderColor} ${glowColor} transition-all duration-300 hover:transform hover:-translate-y-1`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className={`p-2 ${iconBgColor} rounded-lg`}>
                      <card.icon className={`w-6 h-6 ${iconColor}`} />
                    </div>
                    <h3 className="ml-3 text-lg font-semibold text-white">
                      {card.title}
                    </h3>
                  </div>
                  <div className={`flex items-center text-sm ${
                    card.changeType === 'positive' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {card.changeType === 'positive' ? (
                      <TrendingUp className="w-4 h-4 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 mr-1" />
                    )}
                    {card.change}
                  </div>
                </div>

                <div className="mb-2">
                  <div className="text-3xl font-bold text-white">
                    {card.value}
                  </div>
                </div>

                <div className="text-sm text-gray-400">
                  {card.description}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1A1B1F]/60 backdrop-blur-md rounded-xl shadow-xl p-4 border border-green-500/30 hover:border-green-500 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-green-400">{stats.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-[#1A1B1F]/60 backdrop-blur-md rounded-xl shadow-xl p-4 border border-yellow-500/30 hover:border-yellow-500 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-[#1A1B1F]/60 backdrop-blur-md rounded-xl shadow-xl p-4 border border-red-500/30 hover:border-red-500 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Failed</p>
                <p className="text-2xl font-bold text-red-400">{stats.failed}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-[#1A1B1F]/60 backdrop-blur-md rounded-xl shadow-xl p-4 border border-[#5546FF]/30 hover:border-[#5546FF] transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Processing Rate</p>
                <p className="text-2xl font-bold text-[#5546FF]">
                  {stats.total > 0 ? Math.round(((stats.completed + stats.failed) / stats.total) * 100) : 0}%
                </p>
              </div>
              <Activity className="w-8 h-8 text-[#5546FF]" />
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-[#1A1B1F]/60 backdrop-blur-md rounded-xl shadow-xl border border-white/10">
          <div className="px-6 py-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Recent Transactions</h2>
              <Link
                href="/transactions"
                className="inline-flex items-center text-sm text-[#FF6B35] hover:text-[#FF8C61] transition-all duration-300"
              >
                View all
                <ArrowUpRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>

          {error ? (
            <div className="p-8 text-center">
              <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Failed to Load Transactions</h3>
              <p className="text-gray-400 mb-4">{error}</p>
              <button
                onClick={fetchDashboardData}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[#5546FF] to-[#FF6B35] hover:shadow-[0_0_30px_rgba(85,70,255,0.5)] transition-all duration-300"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </button>
            </div>
          ) : recentTransactions.length === 0 ? (
            <div className="p-8 text-center">
              <CreditCard className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No Transactions Yet</h3>
              <p className="text-gray-400">
                Your recent transactions will appear here once you start processing payments.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="px-6 py-4 hover:bg-white/5 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(transaction.status)}
                      <div>
                        <div className="text-sm font-medium text-white">
                          {transaction.description || 'Payment Transaction'}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {transaction.id.substring(0, 12)}...
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-medium text-white">
                          {formatAmount(transaction.amount)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(transaction.timestamp)}
                        </div>
                      </div>

                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        transaction.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        transaction.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;