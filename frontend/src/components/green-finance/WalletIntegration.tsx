import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Bitcoin,
  Send,
  Download,
  History,
  Shield,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  RefreshCw,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Zap
} from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useWallet } from '../../hooks/useWallet';

interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'investment' | 'reward';
  amount: number;
  currency: 'BTC' | 'sBTC' | 'USD';
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: string;
  description: string;
  txHash?: string;
  blockHeight?: number;
}

interface WalletStats {
  totalValue: number;
  btcBalance: number;
  sbtcBalance: number;
  usdBalance: number;
  pendingTransactions: number;
  totalTransactions: number;
  stakingRewards: number;
}

const WalletIntegration: React.FC = () => {
  const { actualTheme: theme } = useTheme();
  const { isConnected, connection, isConnecting, connectWallet, disconnectWallet, refreshBalance } = useWallet();

  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'staking'>('overview');
  const [walletStats, setWalletStats] = useState<WalletStats>({
    totalValue: 0,
    btcBalance: 0.5423,
    sbtcBalance: 2.1876,
    usdBalance: 1250.00,
    pendingTransactions: 1,
    totalTransactions: 47,
    stakingRewards: 0.0234
  });

  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'investment',
      amount: 0.1,
      currency: 'sBTC',
      status: 'confirmed',
      timestamp: '2024-01-15T10:30:00Z',
      description: 'Green Energy ETF Investment',
      txHash: '0x1234...5678',
      blockHeight: 847293
    },
    {
      id: '2',
      type: 'receive',
      amount: 0.0234,
      currency: 'sBTC',
      status: 'confirmed',
      timestamp: '2024-01-14T15:45:00Z',
      description: 'Staking Rewards',
      txHash: '0x2345...6789',
      blockHeight: 847156
    },
    {
      id: '3',
      type: 'send',
      amount: 0.05,
      currency: 'sBTC',
      status: 'pending',
      timestamp: '2024-01-14T09:20:00Z',
      description: 'Carbon Offset Purchase',
      txHash: '0x3456...7890'
    },
    {
      id: '4',
      type: 'investment',
      amount: 0.2,
      currency: 'sBTC',
      status: 'confirmed',
      timestamp: '2024-01-13T14:15:00Z',
      description: 'Tesla Stock Purchase',
      txHash: '0x4567...8901',
      blockHeight: 846890
    }
  ]);

  useEffect(() => {
    if (isConnected) {
      setWalletStats(prev => ({
        ...prev,
        totalValue: (prev.btcBalance * 67000) + (prev.sbtcBalance * 67000) + prev.usdBalance,
        sbtcBalance: connection?.balance || prev.sbtcBalance
      }));
    }
  }, [isConnected, connection?.balance]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'send':
        return <Send className="w-4 h-4 text-red-600" />;
      case 'receive':
        return <Download className="w-4 h-4 text-green-600" />;
      case 'investment':
        return <TrendingUp className="w-4 h-4 text-blue-600" />;
      case 'reward':
        return <Zap className="w-4 h-4 text-purple-600" />;
      default:
        return <History className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Add toast notification here
  };

  if (!isConnected) {
    return (
      <div className={`rounded-xl shadow-lg border p-8 text-center ${
        theme === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      }`}>
        <div className="max-w-md mx-auto">
          <div className="p-4 bg-orange-100 rounded-full w-fit mx-auto mb-6">
            <Wallet className="w-12 h-12 text-orange-600" />
          </div>

          <h2 className={`text-2xl font-bold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Connect Your Wallet
          </h2>

          <p className={`mb-6 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Connect your Bitcoin or sBTC wallet to start investing in sustainable assets and track your green portfolio.
          </p>

          <div className="space-y-4 mb-6">
            <div className={`p-4 rounded-lg ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <div className="flex items-center space-x-3 mb-2">
                <Bitcoin className="w-5 h-5 text-orange-600" />
                <span className={`font-medium ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  sBTC Integration
                </span>
              </div>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Use Bitcoin with smart contract features for green investments
              </p>
            </div>

            <div className={`p-4 rounded-lg ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <div className="flex items-center space-x-3 mb-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <span className={`font-medium ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Secure & Decentralized
                </span>
              </div>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Your keys, your crypto. Non-custodial wallet integration
              </p>
            </div>
          </div>

          <button
            onClick={connectWallet}
            disabled={isConnecting}
            className="w-full py-3 px-6 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors"
          >
            {isConnecting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <Wallet className="w-5 h-5" />
                <span>Connect Wallet</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wallet Header */}
      <div className={`rounded-xl shadow-lg border p-6 ${
        theme === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Wallet className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Wallet Dashboard
              </h2>
              <div className="flex items-center space-x-2">
                <span className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {shortenAddress(connection?.address!)}
                </span>
                <button
                  onClick={() => copyToClipboard(connection?.address!)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={refreshBalance}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={disconnectWallet}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Disconnect
            </button>
          </div>
        </div>

        {/* Balance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className={`p-4 rounded-lg ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Total Value
              </span>
              <button onClick={() => setShowBalance(!showBalance)}>
                {showBalance ?
                  <Eye className="w-4 h-4 text-gray-400" /> :
                  <EyeOff className="w-4 h-4 text-gray-400" />
                }
              </button>
            </div>
            <div className={`text-2xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {showBalance ? `$${walletStats.totalValue.toLocaleString()}` : '****'}
            </div>
          </div>

          <div className={`p-4 rounded-lg ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <div className="flex items-center space-x-2 mb-2">
              <Bitcoin className="w-4 h-4 text-orange-600" />
              <span className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                sBTC Balance
              </span>
            </div>
            <div className={`text-xl font-bold text-orange-600`}>
              {showBalance ? `${walletStats.sbtcBalance.toFixed(4)} sBTC` : '****'}
            </div>
          </div>

          <div className={`p-4 rounded-lg ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <div className="flex items-center space-x-2 mb-2">
              <Bitcoin className="w-4 h-4 text-orange-500" />
              <span className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                BTC Balance
              </span>
            </div>
            <div className={`text-xl font-bold text-orange-500`}>
              {showBalance ? `${walletStats.btcBalance.toFixed(4)} BTC` : '****'}
            </div>
          </div>

          <div className={`p-4 rounded-lg ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="w-4 h-4 text-purple-600" />
              <span className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Staking Rewards
              </span>
            </div>
            <div className={`text-xl font-bold text-purple-600`}>
              {showBalance ? `${walletStats.stakingRewards.toFixed(4)} sBTC` : '****'}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={`rounded-xl shadow-lg border p-6 ${
        theme === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          Quick Actions
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className={`p-4 rounded-lg border transition-colors ${
            theme === 'dark'
              ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
          }`}>
            <Send className="w-6 h-6 text-red-600 mx-auto mb-2" />
            <span className={`text-sm font-medium ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Send sBTC
            </span>
          </button>

          <button className={`p-4 rounded-lg border transition-colors ${
            theme === 'dark'
              ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
          }`}>
            <Download className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <span className={`text-sm font-medium ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Receive sBTC
            </span>
          </button>

          <button className={`p-4 rounded-lg border transition-colors ${
            theme === 'dark'
              ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
          }`}>
            <TrendingUp className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <span className={`text-sm font-medium ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Invest
            </span>
          </button>

          <button className={`p-4 rounded-lg border transition-colors ${
            theme === 'dark'
              ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
          }`}>
            <Zap className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <span className={`text-sm font-medium ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Stake
            </span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className={`rounded-xl shadow-lg border ${
        theme === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'overview', label: 'Overview', icon: Wallet },
            { id: 'transactions', label: 'Transactions', icon: History },
            { id: 'staking', label: 'Staking', icon: Zap }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-6 py-4 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? theme === 'dark'
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-blue-600 border-b-2 border-blue-600'
                  : theme === 'dark'
                    ? 'text-gray-400 hover:text-gray-300'
                    : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'transactions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className={`text-lg font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Recent Transactions
                </h4>
                <span className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {walletStats.totalTransactions} total
                </span>
              </div>

              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(tx.type)}
                      {getStatusIcon(tx.status)}
                    </div>
                    <div>
                      <div className={`font-medium ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {tx.description}
                      </div>
                      <div className={`text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {formatDate(tx.timestamp)}
                        {tx.txHash && (
                          <button
                            onClick={() => copyToClipboard(tx.txHash!)}
                            className="ml-2 text-blue-600 hover:text-blue-700"
                          >
                            <ExternalLink className="w-3 h-3 inline" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`font-medium ${
                      tx.type === 'send' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {tx.type === 'send' ? '-' : '+'}
                      {tx.amount} {tx.currency}
                    </div>
                    <div className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      ${(tx.amount * 67000).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`p-4 rounded-lg ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <h4 className={`font-semibold mb-3 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Portfolio Performance
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                      Total Invested:
                    </span>
                    <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                      $89,432
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                      Current Value:
                    </span>
                    <span className="text-green-600">
                      $102,847
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                      Total Return:
                    </span>
                    <span className="text-green-600">
                      +15.0% ($13,415)
                    </span>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <h4 className={`font-semibold mb-3 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  ESG Impact
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                      ESG Score:
                    </span>
                    <span className="text-green-600">
                      A+ (87/100)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                      Carbon Reduced:
                    </span>
                    <span className="text-green-600">
                      -12.7 tons CO₂
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                      Trees Equivalent:
                    </span>
                    <span className="text-green-600">
                      156 trees
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'staking' && (
            <div className="space-y-4">
              <h4 className={`text-lg font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                sBTC Staking
              </h4>

              <div className={`p-4 rounded-lg ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h5 className={`font-medium ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      Active Staking
                    </h5>
                    <p className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Earn rewards by securing the network
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold text-purple-600`}>
                      8.5% APR
                    </div>
                    <div className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Current rate
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Staked Amount:
                    </span>
                    <div className={`font-medium ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      1.5876 sBTC
                    </div>
                  </div>
                  <div>
                    <span className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Rewards Earned:
                    </span>
                    <div className="font-medium text-purple-600">
                      0.0234 sBTC
                    </div>
                  </div>
                </div>

                <button className="w-full mt-4 py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                  Stake More sBTC
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletIntegration;