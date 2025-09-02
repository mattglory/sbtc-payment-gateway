/**
 * sBTC Payment Gateway API
 * Backend service for processing sBTC payments
 * Built for Stacks Builders Competition with full Stacks integration
 */

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

// Stacks integration imports
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

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'https://sbtcpaymentgateway-matt-glorys-projects.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());

// Stacks network configuration
const network = process.env.NODE_ENV === 'production' 
  ? new StacksMainnet() 
  : new StacksTestnet();

const contractAddress = process.env.CONTRACT_ADDRESS || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const contractName = 'sbtc-payment-gateway';

// In-memory storage (use database in production)
const merchants = new Map();
const apiKeys = new Map();
const payments = new Map();

/**
 * Utility Functions
 */

/**
 * Generate a test API key for merchants
 */
function generateApiKey() {
  return 'pk_test_' + crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a secret key for merchants
 */
function generateSecretKey() {
  return 'sk_test_' + crypto.randomBytes(32).toString('hex');
}

/**
 * Validate if an API key exists and is valid
 */
function validateApiKey(apiKey) {
  return apiKeys.has(apiKey);
}

/**
 * Get merchant ID from API key
 */
function getMerchantFromApiKey(apiKey) {
  return apiKeys.get(apiKey);
}

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
 * API Routes
 */

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    network: process.env.NODE_ENV === 'production' ? 'mainnet' : 'testnet',
    contract: `${contractAddress}.${contractName}`
  });
});

/**
 * Register a new merchant (now with Stacks integration)
 */
app.post('/api/merchants/register', async (req, res) => {
  try {
    const { businessName, email, stacksAddress } = req.body;

    // Validation
    if (!businessName || !email || !stacksAddress) {
      return res.status(400).json({
        error: 'Missing required fields: businessName, email, stacksAddress'
      });
    }

    // Check if merchant already exists
    if (merchants.has(stacksAddress)) {
      return res.status(409).json({
        error: 'Merchant already registered with this Stacks address'
      });
    }

    // Generate API credentials
    const apiKey = generateApiKey();
    const secretKey = generateSecretKey();
    const merchantId = uuidv4();

    // Store merchant data
    const merchantData = {
      id: merchantId,
      businessName,
      email,
      stacksAddress,
      apiKey,
      secretKey,
      isActive: true,
      totalProcessed: 0,
      feeCollected: 0,
      paymentsCount: 0,
      registeredAt: new Date().toISOString()
    };

    merchants.set(stacksAddress, merchantData);
    apiKeys.set(apiKey, merchantId);

    console.log('Merchant registered:', {
      merchantId,
      businessName,
      stacksAddress
    });

    // Note: In production, you might want to automatically call the smart contract
    // register-merchant function here, but for demo purposes we'll let the frontend handle it

    res.status(201).json({
      merchantId,
      apiKey,
      secretKey,
      message: 'Merchant registered successfully. Please call register-merchant on the smart contract to complete setup.'
    });

  } catch (error) {
    console.error('Merchant registration error:', error);
    res.status(500).json({
      error: 'Internal server error during merchant registration'
    });
  }
});

/**
 * Create payment intent with Stacks integration
 */
app.post('/api/payment-intents', async (req, res) => {
  try {
    const apiKey = req.headers.authorization?.replace('Bearer ', '');
    
    if (!apiKey || !validateApiKey(apiKey)) {
      return res.status(401).json({
        error: 'Invalid or missing API key'
      });
    }

    const merchantId = getMerchantFromApiKey(apiKey);
    const merchant = [...merchants.values()].find(m => m.id === merchantId);
    
    if (!merchant) {
      return res.status(404).json({
        error: 'Merchant not found'
      });
    }

    const { amount, description, currency = 'BTC' } = req.body;

    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: 'Invalid amount. Must be greater than 0 satoshis.'
      });
    }

    // Generate payment intent
    const paymentId = `pi_${uuidv4()}`;
    const intentId = uuidv4();
    const amountInSats = Math.floor(amount);
    const FEE_PERCENTAGE = 0.025; // 2.5% processing fee
    const fee = Math.floor(amountInSats * FEE_PERCENTAGE);

    const paymentIntent = {
      id: intentId,
      paymentId,
      merchantId,
      amount: amountInSats,
      fee,
      currency,
      description: description || 'Payment',
      status: 'requires_payment_method',
      clientSecret: `${paymentId}_secret_${crypto.randomBytes(16).toString('hex')}`,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      metadata: {
        merchantAddress: merchant.stacksAddress,
        contractFunction: 'create-payment-intent'
      }
    };

    payments.set(intentId, paymentIntent);

    console.log('Payment intent created:', {
      intentId,
      paymentId,
      amount: amountInSats,
      merchant: merchant.businessName
    });

    res.status(201).json({
      id: paymentIntent.id,
      paymentId: paymentIntent.paymentId,
      amount: paymentIntent.amount,
      fee: paymentIntent.fee,
      currency: paymentIntent.currency,
      description: paymentIntent.description,
      status: paymentIntent.status,
      clientSecret: paymentIntent.clientSecret,
      createdAt: paymentIntent.createdAt,
      expiresAt: paymentIntent.expiresAt
    });

  } catch (error) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({
      error: 'Failed to create payment intent'
    });
  }
});

/**
 * Confirm payment with Stacks blockchain integration
 */
app.post('/api/payment-intents/:id/confirm', async (req, res) => {
  try {
    const { id } = req.params;
    const { customerAddress, transactionId } = req.body;

    const paymentIntent = payments.get(id);
    if (!paymentIntent) {
      return res.status(404).json({
        error: 'Payment intent not found'
      });
    }

    // Check if payment has expired
    if (new Date() > new Date(paymentIntent.expiresAt)) {
      return res.status(400).json({
        error: 'Payment intent has expired'
      });
    }

    // Update payment status
    paymentIntent.status = 'processing';
    paymentIntent.customerAddress = customerAddress;
    paymentIntent.transactionId = transactionId;
    paymentIntent.processingStartedAt = new Date().toISOString();

    // Find merchant
    const merchant = [...merchants.values()].find(m => m.id === paymentIntent.merchantId);
    
    console.log('Payment confirmation started:', {
      paymentId: paymentIntent.paymentId,
      customer: customerAddress,
      merchant: merchant?.businessName,
      txId: transactionId
    });

    // Simulate blockchain processing (in production, monitor the actual transaction)
    setTimeout(() => {
      try {
        const updatedPayment = payments.get(id);
        if (updatedPayment) {
          updatedPayment.status = 'succeeded';
          updatedPayment.succeededAt = new Date().toISOString();
          
          // Update merchant stats
          if (merchant) {
            merchant.totalProcessed += paymentIntent.amount;
            merchant.feeCollected += paymentIntent.fee;
            merchant.paymentsCount += 1;
          }

          console.log('Payment succeeded:', {
            paymentId: paymentIntent.paymentId,
            amount: paymentIntent.amount,
            customer: customerAddress
          });
        }
      } catch (error) {
        console.error('Payment processing error:', error);
        const failedPayment = payments.get(id);
        if (failedPayment) {
          failedPayment.status = 'payment_failed';
          failedPayment.failedAt = new Date().toISOString();
          failedPayment.failureReason = error.message;
        }
      }
    }, 3000); // 3 second delay to simulate blockchain confirmation

    res.json({
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      customer: customerAddress,
      transactionId,
      message: 'Payment is being processed on the Stacks blockchain'
    });

  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({
      error: 'Failed to confirm payment'
    });
  }
});

/**
 * Get payment intent details
 */
app.get('/api/payment-intents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const paymentIntent = payments.get(id);
    
    if (!paymentIntent) {
      return res.status(404).json({
        error: 'Payment intent not found'
      });
    }

    res.json({
      id: paymentIntent.id,
      paymentId: paymentIntent.paymentId,
      amount: paymentIntent.amount,
      fee: paymentIntent.fee,
      currency: paymentIntent.currency,
      description: paymentIntent.description,
      status: paymentIntent.status,
      createdAt: paymentIntent.createdAt,
      expiresAt: paymentIntent.expiresAt,
      customerAddress: paymentIntent.customerAddress,
      transactionId: paymentIntent.transactionId,
      processingStartedAt: paymentIntent.processingStartedAt,
      succeededAt: paymentIntent.succeededAt,
      failedAt: paymentIntent.failedAt
    });

  } catch (error) {
    console.error('Error retrieving payment intent:', error);
    res.status(500).json({
      error: 'Failed to retrieve payment intent'
    });
  }
});

/**
 * Get merchant dashboard statistics
 */
app.get('/api/merchants/dashboard', async (req, res) => {
  try {
    const apiKey = req.headers.authorization?.replace('Bearer ', '');
    
    if (!apiKey || !validateApiKey(apiKey)) {
      return res.status(401).json({
        error: 'Invalid or missing API key'
      });
    }

    const merchantId = getMerchantFromApiKey(apiKey);
    const merchant = [...merchants.values()].find(m => m.id === merchantId);
    
    if (!merchant) {
      return res.status(404).json({
        error: 'Merchant not found'
      });
    }

    // Get merchant's payments
    const merchantPayments = [...payments.values()]
      .filter(p => p.merchantId === merchantId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const stats = {
      totalProcessed: merchant.totalProcessed,
      feeCollected: merchant.feeCollected,
      paymentsCount: merchant.paymentsCount,
      activePayments: merchantPayments.filter(p => p.status === 'processing').length,
      successfulPayments: merchantPayments.filter(p => p.status === 'succeeded').length,
      recentPayments: merchantPayments.slice(0, 10).map(p => ({
        id: p.paymentId,
        amount: p.amount,
        status: p.status,
        createdAt: p.createdAt,
        customerAddress: p.customerAddress,
        description: p.description
      }))
    };

    res.json(stats);

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      error: 'Failed to retrieve dashboard statistics'
    });
  }
});

/**
 * Stacks blockchain integration endpoints
 */

/**
 * Get contract information
 */
app.get('/api/contract/info', (req, res) => {
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
 * Create smart contract payment intent
 */
app.post('/api/contract/create-payment', async (req, res) => {
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
 * Process smart contract payment
 */
app.post('/api/contract/process-payment', async (req, res) => {
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
 * Register merchant on smart contract
 */
app.post('/api/contract/register-merchant', async (req, res) => {
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

/**
 * Error handling middleware
 */
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    method: req.method
  });
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log(`🚀 sBTC Payment Gateway API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🏗️  Network: ${process.env.NODE_ENV === 'production' ? 'Mainnet' : 'Testnet'}`);
  console.log(`📝 Contract: ${contractAddress}.${contractName}`);
  console.log('🏆 Built for Stacks Builders Competition');
});

module.exports = app;// Force redeploy
