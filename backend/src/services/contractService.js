/**
 * Contract Service
 * Business logic for Stacks blockchain contract interactions
 */

const { 
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  stringAsciiCV,
  uintCV,
  principalCV,
  someCV,
  noneCV
} = require('@stacks/transactions');
const { StacksTestnet, StacksMainnet } = require('@stacks/network');

class ContractService {
  constructor() {
    // Stacks network configuration
    this.network = process.env.NODE_ENV === 'production' 
      ? new StacksMainnet() 
      : new StacksTestnet();
    
    this.contractAddress = process.env.CONTRACT_ADDRESS || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    this.contractName = 'sbtc-payment-gateway';
  }

  /**
   * Get contract information
   */
  getContractInfo() {
    return {
      contractAddress: this.contractAddress,
      contractName: this.contractName,
      network: process.env.NODE_ENV === 'production' ? 'mainnet' : 'testnet',
      explorerUrl: process.env.NODE_ENV === 'production' 
        ? 'https://explorer.stacks.co/txid/' 
        : 'https://explorer.stacks.co/txid/?chain=testnet'
    };
  }

  /**
   * Create smart contract transaction
   */
  async createContractTransaction(functionName, functionArgs, senderKey) {
    try {
      const txOptions = {
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName,
        functionArgs,
        senderKey,
        validateWithAbi: true,
        network: this.network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
      };

      const transaction = await makeContractCall(txOptions);
      const broadcastResponse = await broadcastTransaction(transaction, this.network);
      
      return {
        success: true,
        txId: broadcastResponse.txid,
        transaction
      };
    } catch (error) {
      console.error('Contract transaction failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create smart contract payment intent
   */
  async createPayment(paymentData) {
    const { paymentId, amount, description, expiresInBlocks, merchantPrivateKey } = paymentData;

    if (!paymentId || !amount || !merchantPrivateKey) {
      throw new Error('Missing required fields: paymentId, amount, merchantPrivateKey');
    }

    const functionArgs = [
      stringAsciiCV(paymentId),
      uintCV(amount),
      description ? someCV(stringAsciiCV(description)) : noneCV(),
      uintCV(expiresInBlocks || 144) // Default 144 blocks (~24 hours)
    ];

    const result = await this.createContractTransaction(
      'create-payment-intent',
      functionArgs,
      merchantPrivateKey
    );

    if (result.success) {
      return {
        success: true,
        transactionId: result.txId,
        paymentId,
        amount,
        expiresInBlocks: expiresInBlocks || 144
      };
    } else {
      throw new Error(`Failed to create payment on blockchain: ${result.error}`);
    }
  }

  /**
   * Process smart contract payment
   */
  async processPayment(paymentData) {
    const { paymentId, customerAddress, merchantPrivateKey } = paymentData;

    if (!paymentId || !customerAddress || !merchantPrivateKey) {
      throw new Error('Missing required fields: paymentId, customerAddress, merchantPrivateKey');
    }

    const functionArgs = [
      stringAsciiCV(paymentId),
      principalCV(customerAddress)
    ];

    const result = await this.createContractTransaction(
      'process-payment',
      functionArgs,
      merchantPrivateKey
    );

    if (result.success) {
      return {
        success: true,
        transactionId: result.txId,
        paymentId,
        customerAddress,
        status: 'processing'
      };
    } else {
      throw new Error(`Failed to process payment on blockchain: ${result.error}`);
    }
  }

  /**
   * Register merchant on smart contract
   */
  async registerMerchant(merchantData) {
    const { businessName, email, merchantPrivateKey } = merchantData;

    if (!businessName || !email || !merchantPrivateKey) {
      throw new Error('Missing required fields: businessName, email, merchantPrivateKey');
    }

    const functionArgs = [
      stringAsciiCV(businessName),
      stringAsciiCV(email)
    ];

    const result = await this.createContractTransaction(
      'register-merchant',
      functionArgs,
      merchantPrivateKey
    );

    if (result.success) {
      return {
        success: true,
        transactionId: result.txId,
        businessName,
        email
      };
    } else {
      throw new Error(`Failed to register merchant on blockchain: ${result.error}`);
    }
  }
}

module.exports = ContractService;