/**
 * Utility functions for sBTC Payment Gateway SDK
 */

import type { SatoshiAmount, FeeCalculation } from './types';

// ==================== BITCOIN / SATOSHI UTILITIES ====================

/**
 * Convert satoshis to BTC
 * @param satoshis Amount in satoshis
 * @returns Amount in BTC
 */
export function satoshisToBTC(satoshis: number): number {
  return satoshis / 100_000_000;
}

/**
 * Convert BTC to satoshis
 * @param btc Amount in BTC
 * @returns Amount in satoshis
 */
export function btcToSatoshis(btc: number): number {
  return Math.round(btc * 100_000_000);
}

/**
 * Format satoshi amount with BTC conversion and readable format
 * @param satoshis Amount in satoshis
 * @returns Formatted amount object
 */
export function formatSatoshiAmount(satoshis: number): SatoshiAmount {
  const btc = satoshisToBTC(satoshis);
  
  return {
    satoshis,
    btc,
    formatted: `${satoshis.toLocaleString()} sats (${btc.toFixed(8)} BTC)`,
  };
}

/**
 * Parse amount string to satoshis
 * Supports formats: "1000", "0.00001", "1000 sats", "0.00001 BTC"
 * @param amount Amount string
 * @returns Amount in satoshis
 */
export function parseAmountToSatoshis(amount: string): number {
  const normalized = amount.toLowerCase().trim();
  
  if (normalized.includes('btc')) {
    const btcAmount = parseFloat(normalized.replace(/[^\d.-]/g, ''));
    return btcToSatoshis(btcAmount);
  }
  
  if (normalized.includes('sat')) {
    return parseInt(normalized.replace(/[^\d]/g, ''), 10);
  }
  
  const numericAmount = parseFloat(normalized);
  
  // If it's a very small decimal (less than 0.1), treat as BTC
  if (numericAmount < 0.1) {
    return btcToSatoshis(numericAmount);
  }
  
  // Otherwise treat as satoshis
  return Math.round(numericAmount);
}

// ==================== FEE CALCULATION ====================

/**
 * Calculate fee based on amount and fee percentage
 * @param amount Payment amount in satoshis
 * @param feePercentage Fee percentage (default 1%)
 * @returns Fee calculation details
 */
export function calculateFee(amount: number, feePercentage: number = 1.0): FeeCalculation {
  const fee = Math.round(amount * (feePercentage / 100));
  const total = amount + fee;
  
  return {
    amount,
    fee,
    total,
    feePercentage,
  };
}

/**
 * Calculate net amount after deducting fee
 * @param grossAmount Gross amount in satoshis
 * @param feePercentage Fee percentage (default 1%)
 * @returns Net amount after fee deduction
 */
export function calculateNetAmount(grossAmount: number, feePercentage: number = 1.0): number {
  return Math.round(grossAmount / (1 + feePercentage / 100));
}

// ==================== VALIDATION UTILITIES ====================

/**
 * Validate Stacks address format
 * @param address Stacks address to validate
 * @returns true if valid, false otherwise
 */
export function isValidStacksAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }
  
  // Stacks addresses start with SP (mainnet) or ST (testnet)
  // and are followed by 39 alphanumeric characters
  const stacksAddressRegex = /^S[PT][123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{39}$/;
  return stacksAddressRegex.test(address);
}

/**
 * Validate transaction ID format (64-character hex string)
 * @param txId Transaction ID to validate
 * @returns true if valid, false otherwise
 */
export function isValidTransactionId(txId: string): boolean {
  if (!txId || typeof txId !== 'string') {
    return false;
  }
  
  const txIdRegex = /^[0-9a-fA-F]{64}$/;
  return txIdRegex.test(txId);
}

/**
 * Validate email address format
 * @param email Email address to validate
 * @returns true if valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate payment amount (must be positive and above minimum)
 * @param amount Amount in satoshis
 * @param minAmount Minimum amount (default 1000 sats)
 * @returns true if valid, false otherwise
 */
export function isValidPaymentAmount(amount: number, minAmount: number = 1000): boolean {
  return typeof amount === 'number' && 
         !isNaN(amount) && 
         amount > 0 && 
         amount >= minAmount &&
         Number.isInteger(amount);
}

// ==================== FORMATTING UTILITIES ====================

/**
 * Format currency amount with proper decimals
 * @param amount Amount to format
 * @param currency Currency type
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'BTC'): string {
  switch (currency.toUpperCase()) {
    case 'BTC':
      return `${satoshisToBTC(amount).toFixed(8)} BTC`;
    case 'SATS':
    case 'SATOSHIS':
      return `${amount.toLocaleString()} sats`;
    case 'USD':
      return `$${(amount / 100).toFixed(2)}`;
    default:
      return `${amount} ${currency}`;
  }
}

/**
 * Format date for display
 * @param date Date to format (string or Date object)
 * @returns Formatted date string
 */
export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }
  
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format payment status for display
 * @param status Payment status
 * @returns Human-readable status
 */
export function formatPaymentStatus(status: string): string {
  switch (status) {
    case 'requires_payment_method':
      return 'Awaiting Payment';
    case 'processing':
      return 'Processing';
    case 'succeeded':
      return 'Completed';
    case 'payment_failed':
      return 'Failed';
    case 'expired':
      return 'Expired';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

// ==================== TIME UTILITIES ====================

/**
 * Check if a payment has expired
 * @param expiresAt Expiration timestamp
 * @returns true if expired, false otherwise
 */
export function isPaymentExpired(expiresAt: string | Date): boolean {
  const expiration = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  return expiration < new Date();
}

/**
 * Get time remaining until expiration
 * @param expiresAt Expiration timestamp
 * @returns Time remaining in milliseconds (0 if expired)
 */
export function getTimeRemaining(expiresAt: string | Date): number {
  const expiration = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  const remaining = expiration.getTime() - Date.now();
  return Math.max(0, remaining);
}

/**
 * Format time duration
 * @param milliseconds Duration in milliseconds
 * @returns Human-readable duration string
 */
export function formatDuration(milliseconds: number): string {
  if (milliseconds <= 0) {
    return 'Expired';
  }
  
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  
  return `${seconds}s`;
}

// ==================== URL UTILITIES ====================

/**
 * Create Stacks explorer URL for transaction
 * @param txId Transaction ID
 * @param network Network type (mainnet/testnet)
 * @returns Explorer URL
 */
export function getStacksExplorerUrl(txId: string, network: 'mainnet' | 'testnet' = 'mainnet'): string {
  const baseUrl = network === 'mainnet' 
    ? 'https://explorer.stacks.co'
    : 'https://explorer.stacks.co/?chain=testnet';
  
  return `${baseUrl}/txid/${txId}`;
}

/**
 * Create Stacks explorer URL for address
 * @param address Stacks address
 * @param network Network type (mainnet/testnet)
 * @returns Explorer URL
 */
export function getAddressExplorerUrl(address: string, network: 'mainnet' | 'testnet' = 'mainnet'): string {
  const baseUrl = network === 'mainnet' 
    ? 'https://explorer.stacks.co'
    : 'https://explorer.stacks.co/?chain=testnet';
  
  return `${baseUrl}/address/${address}`;
}

// ==================== DEVELOPMENT UTILITIES ====================

/**
 * Generate a random payment ID for testing
 * @returns Random payment ID
 */
export function generateTestPaymentId(): string {
  return `pi_test_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate test Stacks address
 * @param network Network type
 * @returns Test Stacks address
 */
export function generateTestStacksAddress(network: 'mainnet' | 'testnet' = 'testnet'): string {
  const prefix = network === 'mainnet' ? 'SP' : 'ST';
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let result = prefix;
  
  for (let i = 0; i < 39; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Check if running in development mode
 * @returns true if in development
 */
export function isDevelopment(): boolean {
  return typeof process !== 'undefined' && process.env.NODE_ENV === 'development';
}

/**
 * Debug log (only logs in development)
 * @param message Message to log
 * @param data Optional data to log
 */
export function debugLog(message: string, data?: any): void {
  if (isDevelopment()) {
    console.log(`[sBTC SDK] ${message}`, data || '');
  }
}