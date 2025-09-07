/**
 * Stacks Blockchain Service
 * Real blockchain integration using Stacks APIs and transactions
 */

const { 
  StacksTestnet, 
  StacksMainnet 
} = require('@stacks/network');
const {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  makeStandardSTXPostCondition,
  FungibleConditionCode,
  uintCV,
  stringAsciiCV,
  someCV,
  noneCV,
  standardPrincipalCV
} = require('@stacks/transactions');
const { StacksBlockchainApi } = require('@stacks/blockchain-api-client');
const logger = require('../utils/logger');
const { ErrorFactory } = require('../utils/errors');

class StacksService {
  constructor() {
    this.network = this.initializeNetwork();
    this.api = new StacksBlockchainApi({ 
      basePath: this.network.bnsLookupUrl.replace('/v1', ''),
      fetchApi: fetch 
    });
    this.contractAddress = process.env.CONTRACT_ADDRESS || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    this.contractName = 'sbtc-payment-gateway';
    this.deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY;
    
    if (!this.deployerPrivateKey) {
      logger.warn('No deployer private key configured - read-only mode only');
    }
  }

  /**
   * Initialize Stacks network based on environment
   */
  initializeNetwork() {
    const environment = process.env.NODE_ENV || 'development';
    const isMainnet = environment === 'production' && process.env.STACKS_NETWORK === 'mainnet';
    
    if (isMainnet) {
      logger.info('Initializing Stacks Mainnet connection');
      return new StacksMainnet();
    } else {
      logger.info('Initializing Stacks Testnet connection');
      return new StacksTestnet();
    }
  }

  /**
   * Create payment intent on blockchain
   */
  async createPaymentIntent(paymentId, amount, merchantId, description) {
    try {
      logger.info('Creating payment intent on Stacks blockchain', {
        paymentId,
        amount,
        merchantId,
        contract: `${this.contractAddress}.${this.contractName}`
      });

      if (!this.deployerPrivateKey) {
        throw ErrorFactory.configuration('Deployer private key required for blockchain operations');
      }

      const functionArgs = [
        stringAsciiCV(paymentId),
        uintCV(amount),
        stringAsciiCV(merchantId),
        description ? someCV(stringAsciiCV(description)) : noneCV()
      ];

      const txOptions = {
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'create-payment-intent',
        functionArgs,
        senderKey: this.deployerPrivateKey,
        network: this.network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
        fee: 10000 // 0.01 STX fee
      };

      const transaction = await makeContractCall(txOptions);
      const result = await broadcastTransaction(transaction, this.network);

      logger.info('Payment intent created on blockchain', {
        paymentId,
        txId: result.txid,
        expected: result.error ? 'error' : 'success'
      });

      if (result.error) {
        throw ErrorFactory.blockchain(`Failed to create payment intent: ${result.reason}`);
      }

      return {
        txId: result.txid,
        paymentId,
        status: 'pending',
        blockchainStatus: 'broadcast'
      };

    } catch (error) {
      logger.error('Failed to create payment intent on blockchain', error, {
        paymentId,
        merchantId
      });
      
      if (error.name === 'ConfigurationError' || error.name === 'BlockchainError') {
        throw error;
      }
      
      throw ErrorFactory.blockchain(`Blockchain operation failed: ${error.message}`);
    }
  }

  /**
   * Process payment on blockchain
   */
  async processPayment(paymentId, customerAddress, amount) {
    try {
      logger.info('Processing payment on blockchain', {
        paymentId,
        customerAddress,
        amount
      });

      if (!this.deployerPrivateKey) {
        throw ErrorFactory.configuration('Deployer private key required for blockchain operations');
      }

      const functionArgs = [
        stringAsciiCV(paymentId),
        standardPrincipalCV(customerAddress),
        uintCV(amount)
      ];

      // Add post-condition to ensure payment amount is transferred
      const postConditions = [
        makeStandardSTXPostCondition(
          customerAddress,
          FungibleConditionCode.GreaterEqual,
          amount
        )
      ];

      const txOptions = {
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'process-payment',
        functionArgs,
        senderKey: this.deployerPrivateKey,
        network: this.network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Deny,
        postConditions,
        fee: 15000 // Higher fee for payment processing
      };

      const transaction = await makeContractCall(txOptions);
      const result = await broadcastTransaction(transaction, this.network);

      logger.info('Payment processed on blockchain', {
        paymentId,
        txId: result.txid,
        status: result.error ? 'failed' : 'processing'
      });

      if (result.error) {
        throw ErrorFactory.blockchain(`Payment processing failed: ${result.reason}`);
      }

      return {
        txId: result.txid,
        paymentId,
        status: 'processing',
        blockchainStatus: 'broadcast'
      };

    } catch (error) {
      logger.error('Failed to process payment on blockchain', error, {
        paymentId,
        customerAddress
      });

      if (error.name === 'ConfigurationError' || error.name === 'BlockchainError') {
        throw error;
      }

      throw ErrorFactory.blockchain(`Payment processing failed: ${error.message}`);
    }
  }

  /**
   * Get transaction status from blockchain
   */
  async getTransactionStatus(txId) {
    try {
      logger.debug('Fetching transaction status from blockchain', { txId });

      const transaction = await this.api.transactionsApi.getTransactionById({
        txId
      });

      const status = transaction.tx_status;
      const blockHeight = transaction.block_height;
      
      logger.debug('Transaction status retrieved', {
        txId,
        status,
        blockHeight
      });

      return {
        txId,
        status,
        blockHeight,
        isConfirmed: status === 'success',
        isFailed: status === 'abort_by_response' || status === 'abort_by_post_condition',
        isPending: status === 'pending'
      };

    } catch (error) {
      logger.error('Failed to get transaction status', error, { txId });
      
      // If transaction not found, it might still be in mempool
      if (error.message?.includes('404')) {
        return {
          txId,
          status: 'pending',
          blockHeight: null,
          isConfirmed: false,
          isFailed: false,
          isPending: true
        };
      }

      throw ErrorFactory.blockchain(`Failed to get transaction status: ${error.message}`);
    }
  }

  /**
   * Get payment intent from blockchain
   */
  async getPaymentIntent(paymentId) {
    try {
      logger.debug('Fetching payment intent from blockchain', { paymentId });

      const result = await this.api.smartContractsApi.callReadOnlyFunction({
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'get-payment-intent',
        readOnlyFunctionArgs: {
          sender: this.contractAddress,
          arguments: [`"${paymentId}"`]
        }
      });

      if (result.okay && result.result) {
        // Parse Clarity value result
        const paymentData = this.parseClarityValue(result.result);
        
        logger.debug('Payment intent retrieved from blockchain', {
          paymentId,
          data: paymentData
        });

        return paymentData;
      } else {
        logger.debug('Payment intent not found on blockchain', { paymentId });
        return null;
      }

    } catch (error) {
      logger.error('Failed to get payment intent from blockchain', error, { paymentId });
      
      if (error.message?.includes('404')) {
        return null;
      }

      throw ErrorFactory.blockchain(`Failed to get payment intent: ${error.message}`);
    }
  }

  /**
   * Register merchant on blockchain
   */
  async registerMerchant(merchantId, stacksAddress, businessName) {
    try {
      logger.info('Registering merchant on blockchain', {
        merchantId,
        stacksAddress,
        businessName
      });

      if (!this.deployerPrivateKey) {
        throw ErrorFactory.configuration('Deployer private key required for blockchain operations');
      }

      const functionArgs = [
        stringAsciiCV(merchantId),
        standardPrincipalCV(stacksAddress),
        stringAsciiCV(businessName)
      ];

      const txOptions = {
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'register-merchant',
        functionArgs,
        senderKey: this.deployerPrivateKey,
        network: this.network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
        fee: 10000
      };

      const transaction = await makeContractCall(txOptions);
      const result = await broadcastTransaction(transaction, this.network);

      logger.info('Merchant registered on blockchain', {
        merchantId,
        txId: result.txid,
        status: result.error ? 'failed' : 'processing'
      });

      if (result.error) {
        throw ErrorFactory.blockchain(`Merchant registration failed: ${result.reason}`);
      }

      return {
        txId: result.txid,
        merchantId,
        status: 'processing',
        blockchainStatus: 'broadcast'
      };

    } catch (error) {
      logger.error('Failed to register merchant on blockchain', error, {
        merchantId,
        stacksAddress
      });

      if (error.name === 'ConfigurationError' || error.name === 'BlockchainError') {
        throw error;
      }

      throw ErrorFactory.blockchain(`Merchant registration failed: ${error.message}`);
    }
  }

  /**
   * Get current Stacks block height
   */
  async getCurrentBlockHeight() {
    try {
      const info = await this.api.infoApi.getCoreApiInfo();
      return info.stacks_tip_height;
    } catch (error) {
      logger.error('Failed to get current block height', error);
      throw ErrorFactory.blockchain(`Failed to get block height: ${error.message}`);
    }
  }

  /**
   * Get account balance
   */
  async getAccountBalance(address) {
    try {
      const balance = await this.api.accountsApi.getAccountBalance({
        principal: address
      });
      
      return {
        stx: {
          balance: balance.stx.balance,
          locked: balance.stx.locked,
          unlock_height: balance.stx.unlock_height
        },
        fungible_tokens: balance.fungible_tokens,
        non_fungible_tokens: balance.non_fungible_tokens
      };
    } catch (error) {
      logger.error('Failed to get account balance', error, { address });
      throw ErrorFactory.blockchain(`Failed to get account balance: ${error.message}`);
    }
  }

  /**
   * Monitor transaction until confirmation or failure
   */
  async waitForTransactionConfirmation(txId, maxAttempts = 30, intervalMs = 10000) {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const status = await this.getTransactionStatus(txId);
        
        if (status.isConfirmed) {
          logger.info('Transaction confirmed', { txId, attempts });
          return { ...status, confirmed: true };
        }
        
        if (status.isFailed) {
          logger.error('Transaction failed', { txId, attempts });
          return { ...status, failed: true };
        }
        
        logger.debug('Transaction still pending, waiting...', { txId, attempts });
        await this.delay(intervalMs);
        attempts++;
        
      } catch (error) {
        logger.error('Error monitoring transaction', error, { txId, attempts });
        attempts++;
        await this.delay(intervalMs);
      }
    }
    
    logger.warn('Transaction monitoring timeout', { txId, maxAttempts });
    return { txId, timeout: true, attempts };
  }

  /**
   * Parse Clarity value from blockchain response
   */
  parseClarityValue(clarityValue) {
    // This is a simplified parser - in production, use proper Clarity parsing
    try {
      if (typeof clarityValue === 'string') {
        return JSON.parse(clarityValue);
      }
      return clarityValue;
    } catch (error) {
      logger.warn('Failed to parse Clarity value', error, { clarityValue });
      return clarityValue;
    }
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate Stacks address format
   */
  isValidStacksAddress(address) {
    // Testnet addresses start with ST, mainnet with SP
    const testnetPattern = /^ST[0-9A-Z]+$/;
    const mainnetPattern = /^SP[0-9A-Z]+$/;
    
    return testnetPattern.test(address) || mainnetPattern.test(address);
  }

  /**
   * Get network info
   */
  getNetworkInfo() {
    return {
      network: this.network.isMainnet() ? 'mainnet' : 'testnet',
      apiUrl: this.network.bnsLookupUrl,
      contractAddress: this.contractAddress,
      contractName: this.contractName
    };
  }
}

module.exports = StacksService;