/**
 * Stacks Wallet Integration Service
 * Handles Stacks Connect wallet interactions for payment processing
 */

import { AppConfig, UserSession, showConnect, openContractCall } from '@stacks/connect';
import {
  STACKS_TESTNET,
  STACKS_MAINNET
} from '@stacks/network';
import {
  AnchorMode,
  PostConditionMode,
  stringAsciiCV,
  uintCV,
  standardPrincipalCV,
  someCV,
  noneCV
} from '@stacks/transactions';

interface WalletConnection {
  isConnected: boolean;
  address: string | null;
  network: 'testnet' | 'mainnet';
  balance: number;
}

interface PaymentTransaction {
  paymentId: string;
  amount: number;
  merchantAddress: string;
  description?: string | undefined;
}

interface TransactionResult {
  success: boolean;
  txId?: string;
  error?: string;
}

class WalletService {
  private appConfig: AppConfig;
  private userSession: UserSession;
  private network: any;
  private contractAddress: string;
  private contractName: string;
  private isMainnet: boolean;

  constructor() {
    this.appConfig = new AppConfig(['store_write', 'publish_data']);
    this.userSession = new UserSession({ appConfig: this.appConfig });
    
    // Initialize network based on environment
    this.isMainnet = process.env.REACT_APP_STACKS_NETWORK === 'mainnet';
    this.network = this.isMainnet ? STACKS_MAINNET : STACKS_TESTNET;
    
    this.contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    this.contractName = 'sbtc-payment-gateway';

    // Check if user is already connected
    if (this.userSession.isSignInPending()) {
      this.userSession.handlePendingSignIn().catch(() => {
        // Silent fail for connection restoration
      });
    }
  }

  /**
   * Connect to Stacks wallet
   */
  async connectWallet(): Promise<WalletConnection> {
    return new Promise((resolve, reject) => {
      showConnect({
        appDetails: {
          name: 'sBTC Payment Gateway',
          icon: '/favicon.ico'
        },
        redirectTo: '/',
        onFinish: () => {
          const userData = this.userSession.loadUserData();
          const connection: WalletConnection = {
            isConnected: true,
            address: userData.profile.stxAddress.testnet || userData.profile.stxAddress.mainnet,
            network: this.isMainnet ? 'mainnet' : 'testnet',
            balance: 0 // Will be fetched separately
          };
          
          resolve(connection);
        },
        onCancel: () => {
          reject(new Error('Wallet connection cancelled'));
        }
      });
    });
  }

  /**
   * Disconnect wallet
   */
  disconnectWallet(): void {
    this.userSession.signUserOut('/');
  }

  /**
   * Check if wallet is connected
   */
  isWalletConnected(): boolean {
    return this.userSession.isUserSignedIn();
  }

  /**
   * Get current wallet address
   */
  getWalletAddress(): string | null {
    if (!this.isWalletConnected()) {
      return null;
    }
    
    const userData = this.userSession.loadUserData();
    return userData.profile.stxAddress.testnet || userData.profile.stxAddress.mainnet;
  }

  /**
   * Get network core API URL
   */
  private getCoreApiUrl(): string {
    return this.isMainnet ? 'https://api.hiro.so' : 'https://api.testnet.hiro.so';
  }

  /**
   * Get wallet balance from blockchain
   */
  async getWalletBalance(): Promise<number> {
    const address = this.getWalletAddress();
    if (!address) {
      throw new Error('Wallet not connected');
    }

    try {
      const response = await fetch(`${this.getCoreApiUrl()}/v2/accounts/${address}?proof=0`);
      const accountData = await response.json();
      return parseInt(accountData.balance);
    } catch {
      throw new Error('Failed to get wallet balance');
    }
  }

  /**
   * Process payment through smart contract - Simplified version
   */
  async processPayment(payment: PaymentTransaction): Promise<TransactionResult> {
    const senderAddress = this.getWalletAddress();
    if (!senderAddress) {
      throw new Error('Wallet not connected');
    }

    try {
      const functionArgs = [
        stringAsciiCV(payment.paymentId),
        uintCV(payment.amount),
        standardPrincipalCV(payment.merchantAddress),
        payment.description ? someCV(stringAsciiCV(payment.description)) : noneCV()
      ];

      const txOptions = {
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'process-payment',
        functionArgs,
        network: this.network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
        fee: 15000, // 0.015 STX fee
      };

      // Use Stacks Connect to prompt user for contract call signing
      return new Promise((resolve) => {
        openContractCall({
          ...txOptions,
          appDetails: {
            name: 'sBTC Payment Gateway',
            icon: '/favicon.ico'
          },
          onFinish: (data) => {
            resolve({
              success: true,
              txId: data.txId
            });
          },
          onCancel: () => {
            resolve({
              success: false,
              error: 'Transaction cancelled by user'
            });
          }
        });
      });

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get transaction status from blockchain
   */
  async getTransactionStatus(txId: string): Promise<any> {
    try {
      const response = await fetch(`${this.getCoreApiUrl()}/extended/v1/tx/${txId}`);
      const txData = await response.json();
      
      return {
        txId,
        status: txData.tx_status,
        blockHeight: txData.block_height,
        isConfirmed: txData.tx_status === 'success',
        isFailed: txData.tx_status === 'abort_by_response' || txData.tx_status === 'abort_by_post_condition',
        isPending: txData.tx_status === 'pending'
      };
    } catch {
      throw new Error('Failed to get transaction status');
    }
  }

  /**
   * Get network information
   */
  getNetworkInfo() {
    return {
      network: this.isMainnet ? 'mainnet' : 'testnet',
      coreApiUrl: this.getCoreApiUrl(),
      contractAddress: this.contractAddress,
      contractName: this.contractName
    };
  }

  /**
   * Validate Stacks address format
   */
  isValidStacksAddress(address: string): boolean {
    // Testnet addresses start with ST, mainnet with SP
    const testnetPattern = /^ST[0-9A-Z]+$/;
    const mainnetPattern = /^SP[0-9A-Z]+$/;
    
    return testnetPattern.test(address) || mainnetPattern.test(address);
  }

  /**
   * Format STX amount from microSTX
   */
  formatSTXAmount(microSTX: number): string {
    const stx = microSTX / 1000000;
    return `${stx.toFixed(6)} STX`;
  }

  /**
   * Convert STX to microSTX
   */
  stxToMicroSTX(stx: number): number {
    return Math.floor(stx * 1000000);
  }

  /**
   * Wait for transaction confirmation (simplified implementation)
   */
  async waitForConfirmation(txId: string): Promise<boolean> {
    try {
      const status = await this.getTransactionStatus(txId);
      return status.isConfirmed;
    } catch {
      return false;
    }
  }

  /**
   * Get payment intent from contract (placeholder implementation)
   */
  async getPaymentIntent(paymentId: string): Promise<any> {
    // This would typically query the smart contract for payment details
    return {
      paymentId,
      status: 'pending',
      amount: 0,
      merchant: '',
      timestamp: Date.now()
    };
  }

  /**
   * Check if merchant is registered (placeholder implementation)
   */
  async isMerchantRegistered(merchantAddress: string): Promise<boolean> {
    // This would typically query the smart contract for merchant registration
    return this.isValidStacksAddress(merchantAddress);
  }
}

// Create singleton instance
export const walletService = new WalletService();

// Export types
export type { WalletConnection, PaymentTransaction, TransactionResult };

export default walletService;