/**
 * Application constants
 */

export const SATOSHIS_PER_BTC = 100_000_000;
export const DEFAULT_BTC_PRICE_USD = 40_000; // Mock price for demo
export const PROCESSING_FEE_PERCENTAGE = 0.025; // 2.5%

export const PAYMENT_STATES = {
  INITIAL: 'initial',
  LOADING: 'loading', 
  SUCCESS: 'success',
  ERROR: 'error'
} as const;

export const API_ENDPOINTS = {
  HEALTH: '/health',
  REGISTER_MERCHANT: '/api/merchants/register',
  CREATE_PAYMENT_INTENT: '/api/payment-intents',
  CONFIRM_PAYMENT: (id: string) => `/api/payment-intents/${id}/confirm`,
  DASHBOARD: '/api/merchants/dashboard'
} as const;