/**
 * Stacks Wallet Integration Service
 * Handles Stacks Connect wallet interactions for payment processing
 */

import { AppConfig, UserSession, showConnect, openSignatureRequestPopup } from '@stacks/connect';
import { 
  StacksNetwork, 
  StacksTestnet, 
  StacksMainnet 
} from '@stacks/network';
import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  createAssetInfo,
  makeStandardSTXPostCondition,
  FungibleConditionCode,
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
  description?: string;
}

interface TransactionResult {
  success: boolean;
  txId?: string;
  error?: string;
}

class WalletService {
  private appConfig: AppConfig;
  private userSession: UserSession;
  private network: StacksNetwork;
  private contractAddress: string;
  private contractName: string;

  constructor() {
    this.appConfig = new AppConfig(['store_write', 'publish_data']);
    this.userSession = new UserSession({ appConfig: this.appConfig });
    
    // Initialize network based on environment
    const isMainnet = process.env.REACT_APP_STACKS_NETWORK === 'mainnet';
    this.network = isMainnet ? new StacksMainnet() : new StacksTestnet();
    
    this.contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    this.contractName = 'sbtc-payment-gateway';

    // Check if user is already connected
    if (this.userSession.isSignInPending()) {
      this.userSession.handlePendingSignIn().catch((error) => {
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
            network: this.network.isMainnet() ? 'mainnet' : 'testnet',
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
   * Get wallet balance from blockchain
   */
  async getWalletBalance(): Promise<number> {
    const address = this.getWalletAddress();
    if (!address) {
      throw new Error('Wallet not connected');
    }

    try {
      const response = await fetch(`${this.network.coreApiUrl}/v2/accounts/${address}?proof=0`);
      const accountData = await response.json();
      return parseInt(accountData.balance);
    } catch (error) {
      throw new Error('Failed to get wallet balance');
    }
  }

  /**
   * Process payment through smart contract
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

      // Create post-condition to ensure payment amount is transferred
      const postConditions = [
        makeStandardSTXPostCondition(
          senderAddress,
          FungibleConditionCode.Equal,
          payment.amount
        )
      ];

      const txOptions = {
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'process-payment',
        functionArgs,
        senderKey: '', // Will be handled by Connect
        network: this.network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Deny,
        postConditions,
        fee: 15000, // 0.015 STX fee
        onFinish: (data: any) => {
          // Transaction broadcast successfully
        },
        onCancel: () => {
          // Transaction cancelled by user
        }
      };

      // Use Stacks Connect to sign and broadcast transaction
      const transaction = await makeContractCall(txOptions);
      
      // Open signature request popup
      return new Promise((resolve, reject) => {
        openSignatureRequestPopup({
          transaction,
          network: this.network,
          onFinish: (data) => {
            resolve({
              success: true,
              txId: data.txId
            });
          },
          onCancel: () => {
            reject(new Error('Transaction cancelled by user'));
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
      const response = await fetch(`${this.network.coreApiUrl}/extended/v1/tx/${txId}`);
      const txData = await response.json();
      
      return {
        txId,
        status: txData.tx_status,
        blockHeight: txData.block_height,
        isConfirmed: txData.tx_status === 'success',
        isFailed: txData.tx_status === 'abort_by_response' || txData.tx_status === 'abort_by_post_condition',
        isPending: txData.tx_status === 'pending'
      };
    } catch (error) {
      throw new Error(`Failed to get transaction status: ${error}`);
    }
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForConfirmation(txId: string, maxAttempts: number = 30): Promise<boolean> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const status = await this.getTransactionStatus(txId);
        
        if (status.isConfirmed) {
          return true;
        }
        
        if (status.isFailed) {
          return false;
        }
        
        // Wait 10 seconds before next attempt
        await new Promise(resolve => setTimeout(resolve, 10000));
      } catch (error) {
        // Continue with next attempt
      }
    }
    
    return false;
  }

  /**
   * Call read-only contract function
   */
  async callReadOnlyFunction(functionName: string, functionArgs: any[] = []): Promise<any> {
    try {
      const response = await fetch(`${this.network.coreApiUrl}/v2/contracts/call-read/${this.contractAddress}/${this.contractName}/${functionName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender: this.getWalletAddress() || this.contractAddress,
          arguments: functionArgs.map(arg => `0x${arg.toString('hex')}`)
        })
      });

      const result = await response.json();
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get payment intent from contract
   */
  async getPaymentIntent(paymentId: string): Promise<any> {
    try {
      return await this.callReadOnlyFunction('get-payment-intent', [
        stringAsciiCV(paymentId)
      ]);
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if merchant is registered
   */
  async isMerchantRegistered(merchantAddress: string): Promise<boolean> {
    try {
      const result = await this.callReadOnlyFunction('is-merchant-registered', [
        standardPrincipalCV(merchantAddress)
      ]);
      return result.okay && result.result === 'true';
    } catch (error) {
      return false;
    }
  }

  /**
   * Get network information
   */
  getNetworkInfo() {
    return {
      network: this.network.isMainnet() ? 'mainnet' : 'testnet',
      coreApiUrl: this.network.coreApiUrl,
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
}

// Create singleton instance
export const walletService = new WalletService();

// Export types
export type { WalletConnection, PaymentTransaction, TransactionResult };

export default walletService;