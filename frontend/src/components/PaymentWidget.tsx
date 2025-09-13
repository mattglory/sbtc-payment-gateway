/**
 * Payment Widget Component
 * Real Stacks blockchain payment processing with wallet integration
 */

import React, { useState, useEffect } from 'react';
import { Wallet, AlertCircle, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';
import { PaymentTransaction } from '../services/wallet';

interface PaymentWidgetProps {
  paymentId: string;
  amount: number;
  description?: string;
  merchantAddress: string;
  onPaymentSuccess?: (txId: string) => void;
  onPaymentFailure?: (error: string) => void;
  onStatusChange?: (status: PaymentStatus) => void;
  className?: string;
}

type PaymentStatus = 'idle' | 'connecting' | 'processing' | 'confirming' | 'completed' | 'failed';

interface TransactionDetails {
  txId: string;
  status: 'pending' | 'success' | 'failed';
  blockHeight?: number;
  confirmations: number;
}

export const PaymentWidget: React.FC<PaymentWidgetProps> = ({
  paymentId,
  amount,
  description,
  merchantAddress,
  onPaymentSuccess,
  onPaymentFailure,
  onStatusChange,
  className = ''
}) => {
  const {
    connection,
    isConnecting,
    isConnected,
    connectWallet,
    disconnectWallet,
    processPayment,
    waitForConfirmation,
    getTransactionStatus,
    formatSTXAmount,
    isValidAddress,
    getNetworkInfo,
    error: walletError,
    clearError
  } = useWallet();

  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [transaction, setTransaction] = useState<TransactionDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const networkInfo = getNetworkInfo();

  // Update parent component when status changes
  useEffect(() => {
    if (onStatusChange) {
      onStatusChange(paymentStatus);
    }
  }, [paymentStatus, onStatusChange]);

  // Handle wallet errors
  useEffect(() => {
    if (walletError) {
      setError(walletError);
      if (paymentStatus === 'connecting') {
        setPaymentStatus('failed');
      }
    }
  }, [walletError, paymentStatus]);

  // Validate props
  useEffect(() => {
    if (!isValidAddress(merchantAddress)) {
      setError('Invalid merchant address provided');
      setPaymentStatus('failed');
    } else if (amount <= 0) {
      setError('Invalid payment amount');
      setPaymentStatus('failed');
    }
  }, [merchantAddress, amount, isValidAddress]);

  const handleConnectWallet = async () => {
    setPaymentStatus('connecting');
    setError(null);
    clearError();
    
    try {
      await connectWallet();
      setPaymentStatus('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
      setPaymentStatus('failed');
    }
  };

  const handlePayment = async () => {
    if (!isConnected || !connection) {
      setError('Wallet not connected');
      return;
    }

    if (connection.balance < amount) {
      setError(`Insufficient balance. Required: ${formatSTXAmount(amount)}, Available: ${formatSTXAmount(connection.balance)}`);
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');
    setError(null);
    clearError();

    try {
      const paymentData: PaymentTransaction = {
        paymentId,
        amount,
        merchantAddress,
        description
      };

      // Processing payment

      const result = await processPayment(paymentData);

      if (result.success && result.txId) {
        setTransaction({
          txId: result.txId,
          status: 'pending',
          confirmations: 0
        });
        
        setPaymentStatus('confirming');
        
        // Start monitoring transaction
        monitorTransaction(result.txId);
      } else {
        throw new Error(result.error || 'Payment processing failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      setError(errorMessage);
      setPaymentStatus('failed');
      
      if (onPaymentFailure) {
        onPaymentFailure(errorMessage);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const monitorTransaction = async (txId: string) => {
    try {
      
      // Poll transaction status
      const maxAttempts = 60; // 10 minutes
      let attempts = 0;
      
      const checkStatus = async (): Promise<void> => {
        if (attempts >= maxAttempts) {
          setError('Transaction confirmation timeout');
          setPaymentStatus('failed');
          return;
        }

        try {
          const status = await getTransactionStatus(txId);
          
          setTransaction(prev => prev ? {
            ...prev,
            status: status.status,
            blockHeight: status.blockHeight,
            confirmations: status.blockHeight ? 1 : 0
          } : null);

          if (status.isConfirmed) {
            setPaymentStatus('completed');
            
            if (onPaymentSuccess) {
              onPaymentSuccess(txId);
            }
          } else if (status.isFailed) {
            setError('Transaction failed on blockchain');
            setPaymentStatus('failed');
            
            if (onPaymentFailure) {
              onPaymentFailure('Transaction failed on blockchain');
            }
          } else if (status.isPending) {
            // Continue monitoring
            attempts++;
            setTimeout(checkStatus, 10000); // Check every 10 seconds
          }
        } catch (err) {
          attempts++;
          setTimeout(checkStatus, 10000); // Retry after 10 seconds
        }
      };

      // Start monitoring
      setTimeout(checkStatus, 5000); // Initial delay of 5 seconds
    } catch (err) {
      setError('Failed to monitor transaction');
      setPaymentStatus('failed');
    }
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'connecting':
        return <Clock className="w-5 h-5 animate-spin text-blue-500" />;
      case 'processing':
        return <Clock className="w-5 h-5 animate-spin text-yellow-500" />;
      case 'confirming':
        return <Clock className="w-5 h-5 animate-spin text-orange-500" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Wallet className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case 'connecting':
        return 'Connecting to wallet...';
      case 'processing':
        return 'Processing payment...';
      case 'confirming':
        return 'Confirming transaction on blockchain...';
      case 'completed':
        return 'Payment completed successfully!';
      case 'failed':
        return error || 'Payment failed';
      default:
        return `Pay ${formatSTXAmount(amount)}`;
    }
  };

  const getExplorerUrl = (txId: string) => {
    const baseUrl = networkInfo.network === 'mainnet' 
      ? 'https://explorer.stacks.co/txid'
      : 'https://explorer.hiro.so/txid';
    return `${baseUrl}/${txId}?chain=${networkInfo.network}`;
  };

  const isPaymentDisabled = () => {
    return !isConnected || 
           isProcessing || 
           paymentStatus === 'connecting' || 
           paymentStatus === 'processing' || 
           paymentStatus === 'confirming' ||
           paymentStatus === 'completed' ||
           !!error;
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 p-6 max-w-md mx-auto ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <h3 className="text-lg font-semibold text-gray-900">
            sBTC Payment
          </h3>
        </div>
        <div className="text-sm text-gray-500">
          {networkInfo.network === 'testnet' && (
            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
              Testnet
            </span>
          )}
        </div>
      </div>

      {/* Payment Details */}
      <div className="mb-6 space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Amount:</span>
          <span className="font-semibold">{formatSTXAmount(amount)}</span>
        </div>
        
        {description && (
          <div className="flex justify-between">
            <span className="text-gray-600">Description:</span>
            <span className="text-sm text-gray-800">{description}</span>
          </div>
        )}
        
        <div className="flex justify-between">
          <span className="text-gray-600">Payment ID:</span>
          <span className="text-xs font-mono text-gray-800">{paymentId.substring(0, 12)}...</span>
        </div>
      </div>

      {/* Wallet Connection */}
      {!isConnected ? (
        <div className="mb-4">
          <button
            onClick={handleConnectWallet}
            disabled={isConnecting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            {isConnecting ? (
              <>
                <Clock className="w-4 h-4 animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4" />
                <span>Connect Wallet</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <>
          {/* Wallet Info */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Connected Wallet:</p>
                <p className="text-xs font-mono text-gray-800">
                  {connection?.address?.substring(0, 12)}...{connection?.address?.substring(-4)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Balance:</p>
                <p className="text-sm font-semibold">
                  {formatSTXAmount(connection?.balance || 0)}
                </p>
              </div>
            </div>
            
            <button
              onClick={disconnectWallet}
              className="mt-2 text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Disconnect
            </button>
          </div>

          {/* Payment Button */}
          <button
            onClick={handlePayment}
            disabled={isPaymentDisabled()}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            {getStatusIcon()}
            <span>{getStatusMessage()}</span>
          </button>
        </>
      )}

      {/* Transaction Details */}
      {transaction && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-blue-900">Transaction ID:</p>
              <p className="text-xs font-mono text-blue-800 break-all">
                {transaction.txId}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Status: {transaction.status} • Confirmations: {transaction.confirmations}
              </p>
            </div>
            <a
              href={getExplorerUrl(transaction.txId)}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-blue-600 hover:text-blue-800 flex-shrink-0"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Network Info */}
      <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500">
        <p>Network: {networkInfo.network} • Contract: {networkInfo.contractAddress}</p>
      </div>
    </div>
  );
};

export default PaymentWidget;