/**
 * HTTP client for sBTC Payment Gateway SDK
 * Handles all API communication with proper error handling and retries
 */

import { 
  SBTCApiError, 
  SBTCNetworkError, 
  SBTCConfigurationError 
} from './errors';
import type { 
  SBTCClientConfig, 
  ApiResponse, 
  ApiError 
} from './types';

interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  body?: any;
  headers?: Record<string, string>;
  requiresAuth?: boolean;
  retries?: number;
}

export class HttpClient {
  private readonly config: Required<SBTCClientConfig>;

  constructor(config: SBTCClientConfig) {
    if (!config.apiKey) {
      throw new SBTCConfigurationError('API key is required');
    }

    this.config = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || 'https://sbtc-payment-api-production.up.railway.app',
      timeout: config.timeout || 30000,
      retries: config.retries || 3,
    };

    // Remove trailing slash from baseUrl
    this.config.baseUrl = this.config.baseUrl.replace(/\/$/, '');
  }

  async get<T = any>(path: string, options?: Partial<RequestOptions>): Promise<T> {
    return this.request<T>({ method: 'GET', path, ...options });
  }

  async post<T = any>(path: string, body?: any, options?: Partial<RequestOptions>): Promise<T> {
    return this.request<T>({ method: 'POST', path, body, ...options });
  }

  async put<T = any>(path: string, body?: any, options?: Partial<RequestOptions>): Promise<T> {
    return this.request<T>({ method: 'PUT', path, body, ...options });
  }

  async delete<T = any>(path: string, options?: Partial<RequestOptions>): Promise<T> {
    return this.request<T>({ method: 'DELETE', path, ...options });
  }

  private async request<T = any>(options: RequestOptions): Promise<T> {
    const { method, path, body, headers = {}, requiresAuth = true, retries = this.config.retries } = options;
    
    const url = `${this.config.baseUrl}${path}`;
    
    // Build headers
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': `sbtc-payment-gateway-sdk/1.0.0`,
      ...headers,
    };

    // Add authentication header if required
    if (requiresAuth) {
      requestHeaders.Authorization = `Bearer ${this.config.apiKey}`;
    }

    const requestConfig: RequestInit = {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    };

    // Add timeout using AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
    requestConfig.signal = controller.signal;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        clearTimeout(timeoutId);
        
        const response = await fetch(url, requestConfig);
        const responseText = await response.text();
        
        let responseData: any;
        try {
          responseData = responseText ? JSON.parse(responseText) : {};
        } catch (parseError) {
          responseData = { error: 'Invalid JSON response', rawResponse: responseText };
        }

        if (!response.ok) {
          throw SBTCApiError.fromResponse(responseData, response.status);
        }

        return responseData as T;

      } catch (error) {
        lastError = error as Error;

        // Don't retry on certain errors
        if (error instanceof SBTCApiError) {
          // Don't retry 4xx errors (client errors)
          if (error.status >= 400 && error.status < 500) {
            throw error;
          }
        }

        // If this was the last attempt, throw the error
        if (attempt === retries) {
          break;
        }

        // Wait before retrying (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // If we get here, all attempts failed
    if (lastError instanceof SBTCApiError) {
      throw lastError;
    } else {
      throw SBTCNetworkError.fromError(lastError || new Error('Unknown network error'));
    }
  }

  // Health check method that doesn't require authentication
  async healthCheck() {
    return this.get('/health', { requiresAuth: false });
  }

  // Method to validate the current API key
  async validateApiKey() {
    try {
      const response = await this.post('/api/merchants/validate-key', 
        { apiKey: this.config.apiKey }, 
        { requiresAuth: false }
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Update API key
  updateApiKey(newApiKey: string) {
    if (!newApiKey) {
      throw new SBTCConfigurationError('API key cannot be empty');
    }
    (this.config as any).apiKey = newApiKey;
  }

  // Get current configuration (without sensitive data)
  getConfig() {
    return {
      baseUrl: this.config.baseUrl,
      timeout: this.config.timeout,
      retries: this.config.retries,
      apiKeyType: this.config.apiKey.startsWith('pk_test_') ? 'test' : 'live',
    };
  }
}