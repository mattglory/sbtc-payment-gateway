/**
 * React Hook for Stacks Wallet Management
 * Provides wallet connection state and operations
 */

import { useState, useEffect, useCallback } from 'react';
import walletService, { WalletConnection, PaymentTransaction, TransactionResult } from '../services/wallet';

interface UseWalletReturn {
  // Connection state
  connection: WalletConnection | null;
  isConnecting: boolean;
  isConnected: boolean;
  
  // Wallet operations
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  refreshBalance: () => Promise<void>;
  
  // Payment operations
  processPayment: (payment: PaymentTransaction) => Promise<TransactionResult>;
  getTransactionStatus: (txId: string) => Promise<any>;
  waitForConfirmation: (txId: string) => Promise<boolean>;
  
  // Contract operations
  getPaymentIntent: (paymentId: string) => Promise<any>;
  isMerchantRegistered: (merchantAddress: string) => Promise<boolean>;
  
  // Utility functions
  formatSTXAmount: (microSTX: number) => string;
  stxToMicroSTX: (stx: number) => number;
  isValidAddress: (address: string) => boolean;
  getNetworkInfo: () => any;
  
  // Error state
  error: string | null;
  clearError: () => void;
}

export const useWallet = (): UseWalletReturn => {
  const [connection, setConnection] = useState<WalletConnection | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if wallet is already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        if (walletService.isWalletConnected()) {
          const address = walletService.getWalletAddress();
          if (address) {
            const balance = await walletService.getWalletBalance();
            const networkInfo = walletService.getNetworkInfo();
            
            setConnection({
              isConnected: true,
              address,
              network: networkInfo.network,
              balance
            });
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to check wallet connection');
      }
    };

    checkConnection();
  }, []);

  // Connect wallet
  const connectWallet = useCallback(async () => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    setError(null);
    
    try {
      const walletConnection = await walletService.connectWallet();
      
      // Get balance after connection
      const balance = await walletService.getWalletBalance();
      
      setConnection({
        ...walletConnection,
        balance
      });
      
      // Wallet connected successfully
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(errorMessage);
      // Wallet connection failed
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting]);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    try {
      walletService.disconnectWallet();
      setConnection(null);
      setError(null);
      // Wallet disconnected
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect wallet';
      setError(errorMessage);
      // Wallet disconnection failed
    }
  }, []);

  // Refresh wallet balance
  const refreshBalance = useCallback(async () => {
    if (!connection) return;
    
    try {
      const balance = await walletService.getWalletBalance();
      setConnection(prev => prev ? { ...prev, balance } : null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh balance';
      setError(errorMessage);
      // Balance refresh failed
    }
  }, [connection]);

  // Process payment
  const processPayment = useCallback(async (payment: PaymentTransaction): Promise<TransactionResult> => {
    setError(null);
    
    try {
      const result = await walletService.processPayment(payment);
      
      if (result.success) {
        // Refresh balance after successful payment
        setTimeout(() => {
          refreshBalance();
        }, 5000); // Wait 5 seconds for transaction to propagate
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment processing failed';
      setError(errorMessage);
      // Payment processing failed
      return {
        success: false,
        error: errorMessage
      };
    }
  }, [refreshBalance]);

  // Get transaction status
  const getTransactionStatus = useCallback(async (txId: string) => {
    setError(null);
    
    try {
      return await walletService.getTransactionStatus(txId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get transaction status';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Wait for transaction confirmation
  const waitForConfirmation = useCallback(async (txId: string): Promise<boolean> => {
    setError(null);
    
    try {
      return await walletService.waitForConfirmation(txId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to wait for confirmation';
      setError(errorMessage);
      // Transaction confirmation failed
      return false;
    }
  }, []);

  // Get payment intent from contract
  const getPaymentIntent = useCallback(async (paymentId: string) => {
    setError(null);
    
    try {
      return await walletService.getPaymentIntent(paymentId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get payment intent';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Check if merchant is registered
  const isMerchantRegistered = useCallback(async (merchantAddress: string): Promise<boolean> => {
    setError(null);
    
    try {
      return await walletService.isMerchantRegistered(merchantAddress);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check merchant registration';
      setError(errorMessage);
      // Merchant registration check failed
      return false;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Utility functions
  const formatSTXAmount = useCallback((microSTX: number): string => {
    return walletService.formatSTXAmount(microSTX);
  }, []);

  const stxToMicroSTX = useCallback((stx: number): number => {
    return walletService.stxToMicroSTX(stx);
  }, []);

  const isValidAddress = useCallback((address: string): boolean => {
    return walletService.isValidStacksAddress(address);
  }, []);

  const getNetworkInfo = useCallback(() => {
    return walletService.getNetworkInfo();
  }, []);

  return {
    // Connection state
    connection,
    isConnecting,
    isConnected: connection?.isConnected ?? false,
    
    // Wallet operations
    connectWallet,
    disconnectWallet,
    refreshBalance,
    
    // Payment operations
    processPayment,
    getTransactionStatus,
    waitForConfirmation,
    
    // Contract operations
    getPaymentIntent,
    isMerchantRegistered,
    
    // Utility functions
    formatSTXAmount,
    stxToMicroSTX,
    isValidAddress,
    getNetworkInfo,
    
    // Error state
    error,
    clearError
  };
};

export default useWallet;