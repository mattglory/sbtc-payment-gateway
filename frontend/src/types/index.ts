/**
 * TypeScript Type Definitions
 * Centralized type definitions for the frontend application
 */

export interface PaymentIntent {
  id: string;
  paymentId: string;
  amount: number;
  fee: number;
  currency: string;
  status: PaymentStatus;
  description?: string;
  clientSecret: string;
  createdAt: string;
  expiresAt: string;
  customerAddress?: string;
  transactionId?: string;
  processingStartedAt?: string;
  succeededAt?: string;
  failedAt?: string;
}

export interface Merchant {
  merchantId: string;
  businessName?: string;
  email?: string;
  apiKey: string;
  secretKey: string;
  message: string;
}

export interface DashboardStats {
  totalProcessed: number;
  feeCollected: number;
  paymentsCount: number;
  activePayments: number;
  successfulPayments: number;
  recentPayments: PaymentSummary[];
}

export interface PaymentSummary {
  id: string;
  amount: number;
  status: PaymentStatus;
  createdAt: string;
  customerAddress?: string;
  description: string;
}

export interface ContractInfo {
  contractAddress: string;
  contractName: string;
  network: string;
  explorerUrl: string;
}

export interface ApiError {
  error: string;
  details?: string;
  timestamp?: string;
  path?: string;
  method?: string;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

export type PaymentStatus = 
  | 'requires_payment_method'
  | 'processing'
  | 'succeeded'
  | 'payment_failed'
  | 'expired';

export type PaymentWidgetState = 
  | 'initial'
  | 'loading'
  | 'success'
  | 'error';

export interface PaymentWidgetProps {
  amount: number;
  description?: string;
  apiKey: string;
  onSuccess?: (payment: PaymentIntent) => void;
  onError?: (error: string) => void;
  theme?: 'light' | 'dark';
  showLogo?: boolean;
  className?: string;
}

export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  isTestnet: boolean;
}

// Stacks-specific types
export interface StacksTransaction {
  txId: string;
  status: 'pending' | 'success' | 'failed';
  blockHeight?: number;
  confirmations?: number;
}

export interface WalletConnection {
  address: string;
  publicKey: string;
  network: NetworkConfig;
  isConnected: boolean;
}