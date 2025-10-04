/**
 * sBTC Payment Gateway SDK
 * JavaScript/TypeScript SDK for integrating with sBTC Payment Gateway
 * "Stripe for Bitcoin" - Making Bitcoin payments as simple as traditional payments
 */

export { sBTCPaymentGateway } from './client';
export { sBTCError, sBTCApiError, sBTCNetworkError } from './errors';
export * from './types';

// React hooks (optional - only if React is available)
export * from './react';

// Utilities
export * from './utils';

// Version
export const VERSION = '1.0.0';