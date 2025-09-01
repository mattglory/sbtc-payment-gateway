/**
 * API Service for sBTC Payment Gateway
 * Handles all communication with the backend payment API
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

export interface PaymentIntent {
  id: string;
  paymentId: string;
  amount: number;
  fee: number;
  currency: string;
  status: string;
  description?: string;
  clientSecret: string;
  createdAt: string;
  expiresAt: string;
  customerAddress?: string;
  transactionId?: string;
}

export interface Merchant {
  merchantId: string;
  businessName?: string;
  email?: string;
  apiKey: string;
  secretKey: string;
  message: string;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  /**
   * Generic HTTP request method with error handling
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const error = await response.json();
        errorMessage = error.error || errorMessage;
      } catch {
        // If response isn't JSON, use default error message
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  /**
   * Register a new merchant with the payment gateway
   */
  async registerMerchant(data: {
    businessName: string;
    email: string;
    stacksAddress: string;
  }): Promise<Merchant> {
    return this.request<Merchant>("/api/merchants/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Create a new payment intent for processing
   */
  async createPaymentIntent(
    apiKey: string,
    data: {
      amount: number;
      currency?: string;
      description?: string;
    }
  ): Promise<PaymentIntent> {
    return this.request<PaymentIntent>("/api/payment-intents", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(data),
    });
  }

  /**
   * Confirm and process a payment intent
   */
  async confirmPayment(
    id: string,
    data: { customerAddress: string; transactionId?: string }
  ): Promise<{ id: string; status: string; message: string; amount: number; customer: string; transactionId?: string }> {
    return this.request(`/api/payment-intents/${id}/confirm`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Get payment intent details
   */
  async getPaymentIntent(id: string): Promise<PaymentIntent> {
    return this.request<PaymentIntent>(`/api/payment-intents/${id}`);
  }

  /**
   * Get merchant dashboard statistics
   */
  async getDashboard(apiKey: string): Promise<{
    totalProcessed: number;
    feeCollected: number;
    paymentsCount: number;
    activePayments: number;
    successfulPayments: number;
    recentPayments: Array<{
      id: string;
      amount: number;
      status: string;
      createdAt: string;
      customerAddress?: string;
      description: string;
    }>;
  }> {
    return this.request('/api/merchants/dashboard', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
  }

  /**
   * Get contract information
   */
  async getContractInfo(): Promise<{
    contractAddress: string;
    contractName: string;
    network: string;
    explorerUrl: string;
  }> {
    return this.request('/api/contract/info');
  }
}

export const apiService = new ApiService();
