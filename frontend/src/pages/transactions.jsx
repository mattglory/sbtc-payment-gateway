import React, { useState, useEffect } from 'react';
import {
  Clock,
  Filter,
  Search,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Calendar,
  DollarSign,
  Hash,
  Home,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);

  const statusOptions = [
    { value: 'all', label: 'All Transactions' },
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
    { value: 'failed', label: 'Failed' }
  ];

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query params
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/transactions?${params}`, {
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_API_KEY || 'pk_test_demo'}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      setTransactions(data.data || []);
    } catch (err) {
      setError(err.message);
      setToast({
        type: 'error',
        message: 'Failed to load transactions. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [statusFilter]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (status) {
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'failed':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount) => {
    const num = parseFloat(amount) || 0;
    return num.toFixed(6) + ' STX';
  };

  const filteredTransactions = transactions.filter(transaction =>
    transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-[#0A0B0D] to-orange-900 flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading transactions..." />
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
            <Link
              href="/dashboard"
              className="inline-flex items-center text-sm text-gray-400 hover:text-[#5546FF] mr-2 transition-all duration-300"
            >
              <BarChart3 className="w-4 h-4 mr-1" />
              Dashboard
            </Link>
            <span className="text-gray-600 mx-2">/</span>
            <span className="text-sm bg-gradient-to-r from-[#5546FF] to-[#FF6B35] bg-clip-text text-transparent font-medium">Transactions</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-[#5546FF] via-[#F7931A] to-[#FF6B35] bg-clip-text text-transparent">
                sBTC Transaction History
              </h1>
              <p className="text-gray-300">
                Monitor and track all your sBTC payment transactions
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button
                onClick={fetchTransactions}
                className="inline-flex items-center px-4 py-2 border border-white/20 rounded-xl shadow-sm text-sm font-medium text-gray-300 bg-[#1A1B1F]/60 backdrop-blur-md hover:bg-[#1A1B1F] hover:border-[#5546FF] transition-all duration-300"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
              <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[#5546FF] to-[#FF6B35] hover:shadow-[0_0_30px_rgba(85,70,255,0.5)] transition-all duration-300">
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[#1A1B1F]/60 backdrop-blur-md rounded-xl shadow-xl p-6 mb-6 border border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-white/20 bg-[#0A0B0D]/80 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5546FF] focus:border-[#5546FF] transition-all duration-300"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-white/20 bg-[#0A0B0D]/80 text-white placeholder-gray-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] transition-all duration-300"
                />
              </div>
            </div>

            <div className="text-sm text-gray-400">
              {filteredTransactions.length} of {transactions.length} transactions
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        {error ? (
          <div className="bg-[#1A1B1F]/60 backdrop-blur-md rounded-xl shadow-xl p-8 text-center border border-white/10">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Failed to Load Transactions</h3>
            <p className="text-gray-400 mb-4">{error}</p>
            <button
              onClick={fetchTransactions}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[#5546FF] to-[#FF6B35] hover:shadow-[0_0_30px_rgba(85,70,255,0.5)] transition-all duration-300"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </button>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="bg-[#1A1B1F]/60 backdrop-blur-md rounded-xl shadow-xl p-8 text-center border border-white/10">
            <Clock className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Transactions Found</h3>
            <p className="text-gray-400">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : 'Your transactions will appear here once you start processing payments.'}
            </p>
          </div>
        ) : (
          <div className="bg-[#1A1B1F]/60 backdrop-blur-md rounded-xl shadow-xl overflow-hidden border border-white/10">
            {/* Desktop Table */}
            <div className="hidden md:block">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-[#0A0B0D]/80">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      <div className="flex items-center">
                        <Hash className="w-4 h-4 mr-2" />
                        Transaction ID
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-2" />
                        Amount
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        Date
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-[#1A1B1F]/40 divide-y divide-white/10">
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-white/5 transition-all duration-300">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-300">
                          {transaction.id.substring(0, 8)}...
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-white">
                          {formatAmount(transaction.amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(transaction.status)}
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            transaction.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                            transaction.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-300 max-w-xs truncate">
                          {transaction.description || 'No description'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formatDate(transaction.timestamp)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/transactions/${transaction.id}`}
                          className="text-[#FF6B35] hover:text-[#FF8C61] inline-flex items-center transition-all duration-300"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden">
              <div className="space-y-4 p-4">
                {filteredTransactions.map((transaction) => (
                  <div key={transaction.id} className="border border-white/10 bg-[#0A0B0D]/60 rounded-xl p-4 hover:bg-white/5 transition-all duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        {getStatusIcon(transaction.status)}
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          transaction.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          transaction.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-white">
                        {formatAmount(transaction.amount)}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Transaction ID</div>
                        <div className="text-sm font-mono text-gray-300">
                          {transaction.id.substring(0, 16)}...
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-gray-500 mb-1">Description</div>
                        <div className="text-sm text-gray-300">
                          {transaction.description || 'No description'}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-gray-500 mb-1">Date</div>
                        <div className="text-sm text-gray-500">
                          {formatDate(transaction.timestamp)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-white/10">
                      <Link
                        href={`/transactions/${transaction.id}`}
                        className="text-[#FF6B35] hover:text-[#FF8C61] inline-flex items-center text-sm transition-all duration-300"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;