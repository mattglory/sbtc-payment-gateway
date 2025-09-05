/**
 * TypeScript type definitions for sBTC Payment Gateway SDK
 */

export interface SBTCClientConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

export interface ApiError {
  error: string;
  code?: string;
  hint?: string;
  requestId?: string;
}

// Health & System Types
export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  demoMode?: string;
  apiKeysConfigured?: number;
  timestamp: string;
  network: 'mainnet' | 'testnet';
  contract: string;
  apiKeySystem: {
    demoMode: boolean;
    configuredKeysCount: number;
    registeredKeysCount: number;
    demoKeysAvailable: boolean;
    demoKeys: string[];
  };
}

// Merchant Types
export interface MerchantRegistration {
  businessName: string;
  email: string;
  stacksAddress: string;
}

export interface MerchantRegistrationResponse {
  merchantId: string;
  apiKey: string;
  secretKey: string;
  message: string;
}

export interface ApiKeyValidation {
  apiKey: string;
}

export interface ApiKeyValidationResponse {
  valid: boolean;
  type?: 'demo' | 'configured' | 'registered' | 'demo_fallback';
  timestamp: string;
  error?: string;
  code?: string;
  hint?: string;
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
  description?: string;
}

// Payment Types
export type PaymentStatus = 
  | 'requires_payment_method'
  | 'processing'
  | 'succeeded'
  | 'payment_failed'
  | 'expired';

export interface PaymentIntentRequest {
  amount: number;
  description?: string;
  currency?: string;
}

export interface PaymentIntent {
  id: string;
  paymentId: string;
  amount: number;
  fee: number;
  currency: string;
  description: string;
  status: PaymentStatus;
  clientSecret: string;
  createdAt: string;
  expiresAt: string;
  requestId?: string;
  customerAddress?: string;
  transactionId?: string;
  processingStartedAt?: string;
  succeededAt?: string;
  failedAt?: string;
}

export interface PaymentConfirmation {
  customerAddress: string;
  transactionId: string;
}

export interface PaymentConfirmationResponse {
  id: string;
  status: PaymentStatus;
  amount: number;
  customer: string;
  transactionId: string;
  message: string;
}

// Smart Contract Types
export interface ContractInfo {
  contractAddress: string;
  contractName: string;
  network: string;
  explorerUrl: string;
}

export interface ContractPaymentRequest {
  paymentId: string;
  amount: number;
  description?: string;
  expiresInBlocks?: number;
  merchantPrivateKey: string;
}

export interface ContractPaymentResponse {
  success: boolean;
  transactionId: string;
  paymentId: string;
  amount: number;
  expiresInBlocks: number;
}

export interface ContractProcessRequest {
  paymentId: string;
  customerAddress: string;
  merchantPrivateKey: string;
}

export interface ContractProcessResponse {
  success: boolean;
  transactionId: string;
  paymentId: string;
  customerAddress: string;
  status: string;
}

export interface ContractMerchantRequest {
  businessName: string;
  email: string;
  merchantPrivateKey: string;
}

export interface ContractMerchantResponse {
  success: boolean;
  transactionId: string;
  businessName: string;
  email: string;
}

// Utility Types
export interface SatoshiAmount {
  satoshis: number;
  btc: number;
  formatted: string;
}

export interface FeeCalculation {
  amount: number;
  fee: number;
  total: number;
  feePercentage: number;
}

// Event Types for React hooks and listeners
export type PaymentEventType = 
  | 'payment.created'
  | 'payment.processing'
  | 'payment.succeeded'
  | 'payment.failed'
  | 'payment.expired';

export interface PaymentEvent {
  type: PaymentEventType;
  paymentIntent: PaymentIntent;
  timestamp: string;
}