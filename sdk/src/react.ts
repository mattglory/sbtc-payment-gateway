/**
 * React hooks for sBTC Payment Gateway SDK
 * Optional React integration hooks for easier frontend development
 * 
 * Note: These hooks are only available when React is present in the environment
 */

import { SBTCPaymentGateway } from './client';
import type {
  PaymentIntent,
  PaymentStatus,
  DashboardStats,
  HealthStatus,
  PaymentEvent,
  PaymentEventType,
  SBTCClientConfig,
} from './types';

// Check if React is available
const isReactAvailable = (): boolean => {
  try {
    return typeof window !== 'undefined' && 
           (window as any).React && 
           (window as any).React.useState && 
           (window as any).React.useEffect;
  } catch {
    return false;
  }
};

// Stub hooks that will be replaced if React is available
let usePaymentIntent: any = () => {
  throw new Error('React is not available. Please ensure React is installed and available in your environment.');
};

let usePaymentStatus: any = () => {
  throw new Error('React is not available. Please ensure React is installed and available in your environment.');
};

let useMerchantDashboard: any = () => {
  throw new Error('React is not available. Please ensure React is installed and available in your environment.');
};

let useSystemHealth: any = () => {
  throw new Error('React is not available. Please ensure React is installed and available in your environment.');
};

let usePaymentTimer: any = () => {
  throw new Error('React is not available. Please ensure React is installed and available in your environment.');
};

// PaymentEventEmitter stub
let PaymentEventEmitter: any = {
  on: () => {
    throw new Error('React is not available. Please ensure React is installed and available in your environment.');
  },
  off: () => {
    throw new Error('React is not available. Please ensure React is installed and available in your environment.');
  },
  emit: () => {
    throw new Error('React is not available. Please ensure React is installed and available in your environment.');
  },
};

// If running in a browser environment with React, replace the stubs
if (typeof window !== 'undefined' && (window as any).React) {
  const React = (window as any).React;
  const { useState, useEffect, useCallback, useRef } = React;

  /**
   * Hook for managing payment intents
   */
  usePaymentIntent = (client: SBTCPaymentGateway, paymentId?: string) => {
    const [paymentIntent, setPaymentIntent] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchPaymentIntent = useCallback(async (id: string) => {
      setLoading(true);
      setError(null);
      
      try {
        const payment = await client.getPaymentIntent(id);
        setPaymentIntent(payment);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }, [client]);

    const createPaymentIntent = useCallback(async (amount: number, description?: string) => {
      setLoading(true);
      setError(null);
      
      try {
        const payment = await client.createPaymentIntent({ amount, description });
        setPaymentIntent(payment);
        return payment;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    }, [client]);

    const confirmPayment = useCallback(async (customerAddress: string, transactionId: string) => {
      if (!paymentIntent) {
        throw new Error('No payment intent available');
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const result = await client.confirmPayment(paymentIntent.id, {
          customerAddress,
          transactionId,
        });
        
        await fetchPaymentIntent(paymentIntent.id);
        return result;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    }, [client, paymentIntent, fetchPaymentIntent]);

    useEffect(() => {
      if (paymentId) {
        fetchPaymentIntent(paymentId);
      }
    }, [paymentId, fetchPaymentIntent]);

    return {
      paymentIntent,
      loading,
      error,
      createPaymentIntent,
      confirmPayment,
      refetch: paymentId ? () => fetchPaymentIntent(paymentId) : undefined,
    };
  };

  /**
   * Hook for monitoring payment status with auto-refresh
   */
  usePaymentStatus = (client: SBTCPaymentGateway, paymentId: string, pollInterval: number = 5000) => {
    const [status, setStatus] = useState('requires_payment_method');
    const [paymentIntent, setPaymentIntent] = useState(null);
    const [error, setError] = useState(null);
    const intervalRef = useRef(null);

    const checkStatus = useCallback(async () => {
      try {
        const payment = await client.getPaymentIntent(paymentId);
        setPaymentIntent(payment);
        setStatus(payment.status);
        setError(null);
        
        if (payment.status === 'succeeded' || 
            payment.status === 'payment_failed' || 
            payment.status === 'expired') {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      } catch (err) {
        setError(err);
      }
    }, [client, paymentId]);

    useEffect(() => {
      if (!paymentId) return;

      checkStatus();

      if (status === 'requires_payment_method' || status === 'processing') {
        intervalRef.current = setInterval(checkStatus, pollInterval);
      }

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }, [paymentId, checkStatus, pollInterval, status]);

    return {
      status,
      paymentIntent,
      error,
      isComplete: status === 'succeeded',
      isFailed: status === 'payment_failed',
      isExpired: status === 'expired',
      isPending: status === 'requires_payment_method',
      isProcessing: status === 'processing',
      refetch: checkStatus,
    };
  };

  /**
   * Hook for merchant dashboard data
   */
  useMerchantDashboard = (client: SBTCPaymentGateway, refreshInterval: number = 0) => {
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchDashboard = useCallback(async () => {
      setLoading(true);
      setError(null);
      
      try {
        const stats = await client.getDashboard();
        setDashboard(stats);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }, [client]);

    useEffect(() => {
      fetchDashboard();
      
      if (refreshInterval > 0) {
        const interval = setInterval(fetchDashboard, refreshInterval);
        return () => clearInterval(interval);
      }
    }, [fetchDashboard, refreshInterval]);

    return {
      dashboard,
      loading,
      error,
      refetch: fetchDashboard,
    };
  };

  /**
   * Hook for system health monitoring
   */
  useSystemHealth = (client: SBTCPaymentGateway, checkInterval: number = 30000) => {
    const [health, setHealth] = useState(null);
    const [isHealthy, setIsHealthy] = useState(true);
    const [error, setError] = useState(null);

    const checkHealth = useCallback(async () => {
      try {
        const healthStatus = await client.getHealth();
        setHealth(healthStatus);
        setIsHealthy(healthStatus.status === 'healthy');
        setError(null);
      } catch (err) {
        setError(err);
        setIsHealthy(false);
      }
    }, [client]);

    useEffect(() => {
      checkHealth();
      
      const interval = setInterval(checkHealth, checkInterval);
      return () => clearInterval(interval);
    }, [checkHealth, checkInterval]);

    return {
      health,
      isHealthy,
      error,
      refetch: checkHealth,
    };
  };

  /**
   * Hook for payment expiration timer
   */
  usePaymentTimer = (expiresAt: string | Date | null, onExpired?: () => void) => {
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
      if (!expiresAt) {
        setTimeRemaining(0);
        setIsExpired(false);
        return;
      }

      const updateTimer = () => {
        const expiration = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
        const remaining = expiration.getTime() - Date.now();
        const expired = remaining <= 0;
        
        setTimeRemaining(Math.max(0, remaining));
        setIsExpired(expired);
        
        if (expired && onExpired) {
          onExpired();
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);

      return () => clearInterval(interval);
    }, [expiresAt, onExpired]);

    return {
      timeRemaining,
      isExpired,
      minutes: Math.floor(timeRemaining / 60000),
      seconds: Math.floor((timeRemaining % 60000) / 1000),
    };
  };

  // Event emitter for payment events
  class PaymentEventEmitterImpl {
    private listeners: Map<PaymentEventType, Function[]> = new Map();

    on(eventType: PaymentEventType, callback: (event: PaymentEvent) => void) {
      if (!this.listeners.has(eventType)) {
        this.listeners.set(eventType, []);
      }
      this.listeners.get(eventType)!.push(callback);
    }

    off(eventType: PaymentEventType, callback: (event: PaymentEvent) => void) {
      const listeners = this.listeners.get(eventType);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    }

    emit(event: PaymentEvent) {
      const listeners = this.listeners.get(event.type);
      if (listeners) {
        listeners.forEach(callback => callback(event));
      }
    }
  }

  PaymentEventEmitter = new PaymentEventEmitterImpl();
}

// Utility function to create SDK client
export const createSBTCClient = (config: SBTCClientConfig): SBTCPaymentGateway => {
  return new SBTCPaymentGateway(config);
};

// Export hooks (will be stubs if React is not available)
export {
  usePaymentIntent,
  usePaymentStatus,
  useMerchantDashboard,
  useSystemHealth,
  usePaymentTimer,
  PaymentEventEmitter,
};

// Export a helper to check React availability
export const isReactSupported = isReactAvailable;