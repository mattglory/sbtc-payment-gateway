/**
 * Main sBTC Payment Gateway SDK Client
 * Provides a high-level interface for interacting with the sBTC Payment Gateway API
 */

import { HttpClient } from './http';
import { SBTCValidationError } from './errors';
import type {
  SBTCClientConfig,
  HealthStatus,
  MerchantRegistration,
  MerchantRegistrationResponse,
  ApiKeyValidation,
  ApiKeyValidationResponse,
  DashboardStats,
  PaymentIntentRequest,
  PaymentIntent,
  PaymentConfirmation,
  PaymentConfirmationResponse,
  ContractInfo,
  ContractPaymentRequest,
  ContractPaymentResponse,
  ContractProcessRequest,
  ContractProcessResponse,
  ContractMerchantRequest,
  ContractMerchantResponse,
} from './types';

export class SBTCPaymentGateway {
  private readonly http: HttpClient;

  constructor(config: SBTCClientConfig) {
    this.http = new HttpClient(config);
  }

  // ==================== SYSTEM & HEALTH ====================

  /**
   * Get system health status
   * @returns Health status information
   */
  async getHealth(): Promise<HealthStatus> {
    return this.http.get<HealthStatus>('/health', { requiresAuth: false });
  }

  /**
   * Validate the current API key
   * @returns API key validation result
   */
  async validateApiKey(): Promise<ApiKeyValidationResponse> {
    return this.http.validateApiKey();
  }

  /**
   * Validate a specific API key
   * @param apiKey The API key to validate
   * @returns API key validation result
   */
  async validateSpecificApiKey(apiKey: string): Promise<ApiKeyValidationResponse> {
    if (!apiKey) {
      throw new SBTCValidationError('API key is required', 'apiKey', apiKey);
    }

    const payload: ApiKeyValidation = { apiKey };
    return this.http.post<ApiKeyValidationResponse>('/api/merchants/validate-key', payload, {
      requiresAuth: false,
    });
  }

  // ==================== MERCHANT MANAGEMENT ====================

  /**
   * Register a new merchant
   * @param registration Merchant registration details
   * @returns Registration response with API keys
   */
  async registerMerchant(registration: MerchantRegistration): Promise<MerchantRegistrationResponse> {
    this.validateMerchantRegistration(registration);
    return this.http.post<MerchantRegistrationResponse>('/api/merchants/register', registration, {
      requiresAuth: false,
    });
  }

  /**
   * Get merchant dashboard statistics
   * @returns Dashboard statistics and recent payments
   */
  async getDashboard(): Promise<DashboardStats> {
    return this.http.get<DashboardStats>('/api/merchants/dashboard');
  }

  // ==================== PAYMENT OPERATIONS ====================

  /**
   * Create a new payment intent
   * @param request Payment intent details
   * @returns Created payment intent
   */
  async createPaymentIntent(request: PaymentIntentRequest): Promise<PaymentIntent> {
    this.validatePaymentIntentRequest(request);
    return this.http.post<PaymentIntent>('/api/payment-intents', request);
  }

  /**
   * Get payment intent details
   * @param paymentId The payment intent ID
   * @returns Payment intent details
   */
  async getPaymentIntent(paymentId: string): Promise<PaymentIntent> {
    if (!paymentId) {
      throw new SBTCValidationError('Payment ID is required', 'paymentId', paymentId);
    }

    return this.http.get<PaymentIntent>(`/api/payment-intents/${paymentId}`, {
      requiresAuth: false,
    });
  }

  /**
   * Confirm and process a payment
   * @param paymentId The payment intent ID
   * @param confirmation Payment confirmation details
   * @returns Payment confirmation response
   */
  async confirmPayment(
    paymentId: string,
    confirmation: PaymentConfirmation
  ): Promise<PaymentConfirmationResponse> {
    if (!paymentId) {
      throw new SBTCValidationError('Payment ID is required', 'paymentId', paymentId);
    }

    this.validatePaymentConfirmation(confirmation);

    return this.http.post<PaymentConfirmationResponse>(
      `/api/payment-intents/${paymentId}/confirm`,
      confirmation,
      { requiresAuth: false }
    );
  }

  // ==================== SMART CONTRACT OPERATIONS ====================

  /**
   * Get smart contract information
   * @returns Contract address and network details
   */
  async getContractInfo(): Promise<ContractInfo> {
    return this.http.get<ContractInfo>('/api/contract/info', { requiresAuth: false });
  }

  /**
   * Create a payment on the smart contract
   * @param request Contract payment request
   * @returns Contract payment response
   */
  async createContractPayment(request: ContractPaymentRequest): Promise<ContractPaymentResponse> {
    this.validateContractPaymentRequest(request);
    return this.http.post<ContractPaymentResponse>('/api/contract/payment', request, {
      requiresAuth: false,
    });
  }

  /**
   * Process a payment on the smart contract
   * @param request Contract process request
   * @returns Contract process response
   */
  async processContractPayment(request: ContractProcessRequest): Promise<ContractProcessResponse> {
    this.validateContractProcessRequest(request);
    return this.http.post<ContractProcessResponse>('/api/contract/process', request, {
      requiresAuth: false,
    });
  }

  /**
   * Register a merchant on the smart contract
   * @param request Contract merchant registration request
   * @returns Contract merchant response
   */
  async registerContractMerchant(request: ContractMerchantRequest): Promise<ContractMerchantResponse> {
    this.validateContractMerchantRequest(request);
    return this.http.post<ContractMerchantResponse>('/api/contract/register-merchant', request, {
      requiresAuth: false,
    });
  }

  // ==================== CONFIGURATION ====================

  /**
   * Update the API key used by this client
   * @param apiKey New API key
   */
  updateApiKey(apiKey: string): void {
    this.http.updateApiKey(apiKey);
  }

  /**
   * Get current client configuration (without sensitive data)
   * @returns Client configuration
   */
  getConfig() {
    return this.http.getConfig();
  }

  // ==================== PRIVATE VALIDATION METHODS ====================

  private validateMerchantRegistration(registration: MerchantRegistration): void {
    if (!registration.businessName) {
      throw new SBTCValidationError('Business name is required', 'businessName', registration.businessName);
    }

    if (!registration.email) {
      throw new SBTCValidationError('Email is required', 'email', registration.email);
    }

    if (!registration.stacksAddress) {
      throw new SBTCValidationError('Stacks address is required', 'stacksAddress', registration.stacksAddress);
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registration.email)) {
      throw new SBTCValidationError('Invalid email format', 'email', registration.email);
    }

    // Basic Stacks address validation (starts with SP or ST)
    if (!registration.stacksAddress.startsWith('SP') && !registration.stacksAddress.startsWith('ST')) {
      throw new SBTCValidationError(
        'Invalid Stacks address format',
        'stacksAddress',
        registration.stacksAddress
      );
    }
  }

  private validatePaymentIntentRequest(request: PaymentIntentRequest): void {
    if (!request.amount) {
      throw new SBTCValidationError('Amount is required', 'amount', request.amount);
    }

    if (typeof request.amount !== 'number' || request.amount <= 0) {
      throw new SBTCValidationError('Amount must be a positive number', 'amount', request.amount);
    }

    // Minimum amount validation (1000 satoshis = 0.00001 BTC)
    if (request.amount < 1000) {
      throw new SBTCValidationError(
        'Amount must be at least 1000 satoshis',
        'amount',
        request.amount
      );
    }
  }

  private validatePaymentConfirmation(confirmation: PaymentConfirmation): void {
    if (!confirmation.customerAddress) {
      throw new SBTCValidationError(
        'Customer address is required',
        'customerAddress',
        confirmation.customerAddress
      );
    }

    if (!confirmation.transactionId) {
      throw new SBTCValidationError(
        'Transaction ID is required',
        'transactionId',
        confirmation.transactionId
      );
    }

    // Basic Stacks address validation
    if (!confirmation.customerAddress.startsWith('SP') && !confirmation.customerAddress.startsWith('ST')) {
      throw new SBTCValidationError(
        'Invalid customer address format',
        'customerAddress',
        confirmation.customerAddress
      );
    }

    // Basic transaction ID validation (should be a hex string)
    const txIdRegex = /^[0-9a-fA-F]{64}$/;
    if (!txIdRegex.test(confirmation.transactionId)) {
      throw new SBTCValidationError(
        'Invalid transaction ID format',
        'transactionId',
        confirmation.transactionId
      );
    }
  }

  private validateContractPaymentRequest(request: ContractPaymentRequest): void {
    if (!request.paymentId) {
      throw new SBTCValidationError('Payment ID is required', 'paymentId', request.paymentId);
    }

    if (!request.amount || request.amount <= 0) {
      throw new SBTCValidationError('Amount must be a positive number', 'amount', request.amount);
    }

    if (!request.merchantPrivateKey) {
      throw new SBTCValidationError(
        'Merchant private key is required',
        'merchantPrivateKey',
        request.merchantPrivateKey
      );
    }
  }

  private validateContractProcessRequest(request: ContractProcessRequest): void {
    if (!request.paymentId) {
      throw new SBTCValidationError('Payment ID is required', 'paymentId', request.paymentId);
    }

    if (!request.customerAddress) {
      throw new SBTCValidationError(
        'Customer address is required',
        'customerAddress',
        request.customerAddress
      );
    }

    if (!request.merchantPrivateKey) {
      throw new SBTCValidationError(
        'Merchant private key is required',
        'merchantPrivateKey',
        request.merchantPrivateKey
      );
    }
  }

  private validateContractMerchantRequest(request: ContractMerchantRequest): void {
    if (!request.businessName) {
      throw new SBTCValidationError('Business name is required', 'businessName', request.businessName);
    }

    if (!request.email) {
      throw new SBTCValidationError('Email is required', 'email', request.email);
    }

    if (!request.merchantPrivateKey) {
      throw new SBTCValidationError(
        'Merchant private key is required',
        'merchantPrivateKey',
        request.merchantPrivateKey
      );
    }
  }
}