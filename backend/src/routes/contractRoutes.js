/**
 * Contract Routes
 * API routes for Stacks smart contract interactions
 */

const express = require('express');
const router = express.Router();
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

// Stacks network configuration
const network = process.env.NODE_ENV === 'production' 
  ? new StacksMainnet() 
  : new StacksTestnet();

const contractAddress = process.env.CONTRACT_ADDRESS || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const contractName = 'sbtc-payment-gateway';

/**
 * Create smart contract transaction
 */
async function createContractTransaction(functionName, functionArgs, senderKey) {
  try {
    const txOptions = {
      contractAddress,
      contractName,
      functionName,
      functionArgs,
      senderKey,
      validateWithAbi: true,
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
    };

    const transaction = await makeContractCall(txOptions);
    const broadcastResponse = await broadcastTransaction(transaction, network);
    
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
 * @route GET /api/contract/info
 * @desc Get contract information
 * @access Public
 */
router.get('/info', (req, res) => {
  res.json({
    contractAddress,
    contractName,
    network: process.env.NODE_ENV === 'production' ? 'mainnet' : 'testnet',
    explorerUrl: process.env.NODE_ENV === 'production' 
      ? 'https://explorer.stacks.co/txid/' 
      : 'https://explorer.stacks.co/txid/?chain=testnet'
  });
});

/**
 * @route POST /api/contract/create-payment
 * @desc Create smart contract payment intent
 * @access Private
 */
router.post('/create-payment', async (req, res) => {
  try {
    const { paymentId, amount, description, expiresInBlocks, merchantPrivateKey } = req.body;

    if (!paymentId || !amount || !merchantPrivateKey) {
      return res.status(400).json({
        error: 'Missing required fields: paymentId, amount, merchantPrivateKey'
      });
    }

    const functionArgs = [
      stringAsciiCV(paymentId),
      uintCV(amount),
      description ? someCV(stringAsciiCV(description)) : noneCV(),
      uintCV(expiresInBlocks || 144) // Default 144 blocks (~24 hours)
    ];

    const result = await createContractTransaction(
      'create-payment-intent',
      functionArgs,
      merchantPrivateKey
    );

    if (result.success) {
      res.json({
        success: true,
        transactionId: result.txId,
        paymentId,
        amount,
        expiresInBlocks: expiresInBlocks || 144
      });
    } else {
      res.status(400).json({
        error: 'Failed to create payment on blockchain',
        details: result.error
      });
    }

  } catch (error) {
    console.error('Contract payment creation error:', error);
    res.status(500).json({
      error: 'Internal server error during contract interaction'
    });
  }
});

/**
 * @route POST /api/contract/process-payment
 * @desc Process smart contract payment
 * @access Private
 */
router.post('/process-payment', async (req, res) => {
  try {
    const { paymentId, customerAddress, merchantPrivateKey } = req.body;

    if (!paymentId || !customerAddress || !merchantPrivateKey) {
      return res.status(400).json({
        error: 'Missing required fields: paymentId, customerAddress, merchantPrivateKey'
      });
    }

    const functionArgs = [
      stringAsciiCV(paymentId),
      principalCV(customerAddress)
    ];

    const result = await createContractTransaction(
      'process-payment',
      functionArgs,
      merchantPrivateKey
    );

    if (result.success) {
      res.json({
        success: true,
        transactionId: result.txId,
        paymentId,
        customerAddress,
        status: 'processing'
      });
    } else {
      res.status(400).json({
        error: 'Failed to process payment on blockchain',
        details: result.error
      });
    }

  } catch (error) {
    console.error('Contract payment processing error:', error);
    res.status(500).json({
      error: 'Internal server error during payment processing'
    });
  }
});

/**
 * @route POST /api/contract/register-merchant
 * @desc Register merchant on smart contract
 * @access Private
 */
router.post('/register-merchant', async (req, res) => {
  try {
    const { businessName, email, merchantPrivateKey } = req.body;

    if (!businessName || !email || !merchantPrivateKey) {
      return res.status(400).json({
        error: 'Missing required fields: businessName, email, merchantPrivateKey'
      });
    }

    const functionArgs = [
      stringAsciiCV(businessName),
      stringAsciiCV(email)
    ];

    const result = await createContractTransaction(
      'register-merchant',
      functionArgs,
      merchantPrivateKey
    );

    if (result.success) {
      res.json({
        success: true,
        transactionId: result.txId,
        businessName,
        email
      });
    } else {
      res.status(400).json({
        error: 'Failed to register merchant on blockchain',
        details: result.error
      });
    }

  } catch (error) {
    console.error('Contract merchant registration error:', error);
    res.status(500).json({
      error: 'Internal server error during merchant registration'
    });
  }
});

module.exports = router;