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

// Configuration
const DEMO_MODE = process.env.DEMO_MODE === 'true';
const CONFIGURED_API_KEYS = process.env.API_KEYS ? process.env.API_KEYS.split(',').map(key => key.trim()) : [];
const DEMO_KEYS = ['pk_test_demo', 'pk_test_your_key', 'pk_test_123'];

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

// Create demo merchant for testing
const demoMerchant = {
  id: 'demo-merchant-id',
  businessName: 'Demo Store',
  email: 'demo@example.com',
  stacksAddress: 'ST1DEMO123ABC',
  apiKey: 'pk_test_demo_key',
  secretKey: 'sk_test_demo_secret',
  isActive: true,
  totalProcessed: 0,
  feeCollected: 0,
  paymentsCount: 0,
  registeredAt: new Date().toISOString()
};
merchants.set('demo-merchant-id', demoMerchant);
if (DEMO_MODE) {
  console.log(`[DEMO] Demo merchant created with keys: ${DEMO_KEYS.join(', ')}`);
}

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
 * Professional API key validation with comprehensive error handling
 */
function validateApiKey(apiKey) {
  if (!apiKey) {
    return { valid: false, error: 'API key is required', code: 'MISSING_API_KEY' };
  }

  // Demo mode check
  if (DEMO_MODE && DEMO_KEYS.includes(apiKey)) {
    console.log(`[API_KEY] Demo key accepted in demo mode: ${apiKey}`);
    return { valid: true, type: 'demo', key: apiKey };
  }

  // Check configured API keys from environment
  if (CONFIGURED_API_KEYS.length > 0 && CONFIGURED_API_KEYS.includes(apiKey)) {
    console.log(`[API_KEY] Configured key accepted: ${apiKey.substring(0, 12)}...`);
    return { valid: true, type: 'configured', key: apiKey };
  }

  // Check dynamically registered API keys
  if (apiKeys.has(apiKey)) {
    console.log(`[API_KEY] Registered key accepted: ${apiKey.substring(0, 12)}...`);
    return { valid: true, type: 'registered', key: apiKey };
  }

  // Fallback to demo keys if no configuration is set and not in strict mode
  if (CONFIGURED_API_KEYS.length === 0 && !process.env.STRICT_API_MODE && DEMO_KEYS.includes(apiKey)) {
    console.log(`[API_KEY] Demo key accepted as fallback: ${apiKey}`);
    return { valid: true, type: 'demo_fallback', key: apiKey };
  }

  console.log(`[API_KEY] Invalid key rejected: ${apiKey ? apiKey.substring(0, 12) + '...' : 'undefined'}`);
  return { valid: false, error: 'Invalid API key', code: 'INVALID_API_KEY' };
}

/**
 * Get merchant ID from API key with validation
 */
function getMerchantFromApiKey(apiKey) {
  const validation = validateApiKey(apiKey);
  
  if (!validation.valid) {
    return null;
  }

  // Return demo merchant ID for demo API keys
  if (validation.type === 'demo' || validation.type === 'demo_fallback') {
    return 'demo-merchant-id';
  }

  // For configured keys, also return demo merchant (in production you'd map these properly)
  if (validation.type === 'configured') {
    return 'demo-merchant-id'; // TODO: Implement proper merchant mapping for configured keys
  }

  // For registered keys, use the mapping
  return apiKeys.get(apiKey);
}

/**
 * API Key validation middleware
 */
function requireApiKey(req, res, next) {
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  const validation = validateApiKey(apiKey);
  
  if (!validation.valid) {
    const errorResponse = {
      error: validation.error,
      code: validation.code,
      hint: validation.code === 'MISSING_API_KEY' 
        ? 'Include your API key in the Authorization header as "Bearer your_api_key"'
        : DEMO_MODE 
          ? `Try one of the demo keys: ${DEMO_KEYS.join(', ')}` 
          : 'Contact support for a valid API key'
    };
    
    console.log(`[API_KEY] Request rejected from ${req.ip}: ${validation.error}`);
    return res.status(401).json(errorResponse);
  }

  // Add validation info to request for debugging
  req.apiKeyInfo = validation;
  console.log(`[API_KEY] Request authorized with ${validation.type} key from ${req.ip}`);
  next();
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
 * Health check endpoint with comprehensive deployment configuration
 */
app.get('/health', (req, res) => {
  const corsOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'https://sbtcpaymentgateway-matt-glorys-projects.vercel.app'
  ];

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    
    // Environment Configuration
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development',
      demoMode: DEMO_MODE,
      strictApiMode: process.env.STRICT_API_MODE === 'true',
      port: PORT
    },

    // Network Configuration
    network: {
      type: process.env.NODE_ENV === 'production' ? 'mainnet' : 'testnet',
      contract: `${contractAddress}.${contractName}`,
      contractAddress,
      contractName
    },

    // API Key System Status
    apiKeySystem: {
      demoMode: DEMO_MODE,
      demoKeysEnabled: DEMO_MODE || (!CONFIGURED_API_KEYS.length && !process.env.STRICT_API_MODE),
      demoKeysAvailable: DEMO_KEYS,
      configuredKeysCount: CONFIGURED_API_KEYS.length,
      registeredKeysCount: apiKeys.size,
      strictModeEnabled: process.env.STRICT_API_MODE === 'true',
      totalValidKeys: CONFIGURED_API_KEYS.length + apiKeys.size + (DEMO_MODE || (!CONFIGURED_API_KEYS.length && !process.env.STRICT_API_MODE) ? DEMO_KEYS.length : 0)
    },

    // CORS Configuration
    cors: {
      allowedOrigins: corsOrigins,
      credentialsEnabled: true,
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000 (default)'
    },

    // System Status
    system: {
      merchants: {
        registered: merchants.size,
        demo: merchants.has('demo-merchant-id') ? 1 : 0
      },
      payments: {
        total: payments.size,
        processing: [...payments.values()].filter(p => p.status === 'processing').length,
        succeeded: [...payments.values()].filter(p => p.status === 'succeeded').length,
        failed: [...payments.values()].filter(p => p.status === 'payment_failed').length
      }
    },

    // Health Indicators
    health: {
      status: 'healthy',
      checks: {
        environmentVariables: process.env.NODE_ENV ? 'pass' : 'warn',
        apiKeySystem: (CONFIGURED_API_KEYS.length > 0 || DEMO_MODE) ? 'pass' : 'warn',
        contractConfig: contractAddress && contractName ? 'pass' : 'fail',
        corsConfig: corsOrigins.length > 0 ? 'pass' : 'fail'
      }
    }
  });
});

/**
 * API key validation endpoint for debugging
 */
app.post('/api/validate-key', (req, res) => {
  const { apiKey } = req.body;
  const validation = validateApiKey(apiKey);
  
  const response = {
    valid: validation.valid,
    type: validation.type,
    timestamp: new Date().toISOString()
  };
  
  if (!validation.valid) {
    response.error = validation.error;
    response.code = validation.code;
    response.hint = validation.code === 'MISSING_API_KEY' 
      ? 'Provide an API key to validate'
      : DEMO_MODE 
        ? `Try one of the demo keys: ${DEMO_KEYS.join(', ')}` 
        : 'Contact support for a valid API key';
  }
  
  res.json(response);
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

    console.log(`[MERCHANT] Registered: ${businessName} (${merchantId})`);
    console.log(`[API_KEY] Generated key for merchant: ${apiKey.substring(0, 12)}...`);

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
app.post('/api/payment-intents', requireApiKey, async (req, res) => {
  const requestId = uuidv4().substring(0, 8);
  const timestamp = new Date().toISOString();
  
  try {
    // Log incoming request details (excluding sensitive data)
    console.log(`[PAYMENT_INTENT:${requestId}] === REQUEST START === ${timestamp}`);
    console.log(`[PAYMENT_INTENT:${requestId}] Client IP: ${req.ip}`);
    console.log(`[PAYMENT_INTENT:${requestId}] User-Agent: ${req.get('user-agent') || 'Not provided'}`);
    console.log(`[PAYMENT_INTENT:${requestId}] Content-Type: ${req.get('content-type') || 'Not provided'}`);
    console.log(`[PAYMENT_INTENT:${requestId}] Origin: ${req.get('origin') || 'Not provided'}`);
    console.log(`[PAYMENT_INTENT:${requestId}] Referer: ${req.get('referer') || 'Not provided'}`);
    
    // Log API key validation results
    console.log(`[PAYMENT_INTENT:${requestId}] API Key Type: ${req.apiKeyInfo.type}`);
    console.log(`[PAYMENT_INTENT:${requestId}] API Key Valid: ${req.apiKeyInfo.valid}`);
    console.log(`[PAYMENT_INTENT:${requestId}] API Key (masked): ${req.apiKeyInfo.key?.substring(0, 12)}...`);
    
    // Log demo mode status
    console.log(`[PAYMENT_INTENT:${requestId}] Demo Mode: ${DEMO_MODE ? 'ENABLED' : 'DISABLED'}`);
    console.log(`[PAYMENT_INTENT:${requestId}] Configured Keys Available: ${CONFIGURED_API_KEYS.length > 0 ? 'YES' : 'NO'}`);
    console.log(`[PAYMENT_INTENT:${requestId}] Using Demo Fallback: ${req.apiKeyInfo.type === 'demo_fallback' ? 'YES' : 'NO'}`);

    const apiKey = req.apiKeyInfo.key;
    let merchantId;
    let merchant;
    
    try {
      merchantId = getMerchantFromApiKey(apiKey);
      console.log(`[PAYMENT_INTENT:${requestId}] Merchant ID Retrieved: ${merchantId || 'NULL'}`);
      
      merchant = [...merchants.values()].find(m => m.id === merchantId);
      console.log(`[PAYMENT_INTENT:${requestId}] Merchant Found: ${merchant ? 'YES' : 'NO'}`);
      
      if (merchant) {
        console.log(`[PAYMENT_INTENT:${requestId}] Merchant Details: ${merchant.businessName} (${merchant.stacksAddress})`);
      }
    } catch (merchantError) {
      console.error(`[PAYMENT_INTENT:${requestId}] Merchant lookup error:`, merchantError);
      throw new Error(`Merchant lookup failed: ${merchantError.message}`);
    }
    
    if (!merchant) {
      console.error(`[PAYMENT_INTENT:${requestId}] ERROR: Merchant not found for ID: ${merchantId}`);
      return res.status(404).json({
        error: 'Merchant not found',
        requestId,
        timestamp
      });
    }

    const { amount, description, currency = 'BTC' } = req.body;
    
    // Log request body details (excluding sensitive data)
    console.log(`[PAYMENT_INTENT:${requestId}] Request Body - Amount: ${amount}`);
    console.log(`[PAYMENT_INTENT:${requestId}] Request Body - Description: ${description || 'Not provided'}`);
    console.log(`[PAYMENT_INTENT:${requestId}] Request Body - Currency: ${currency}`);

    // Enhanced validation with detailed logging
    try {
      if (!amount) {
        console.error(`[PAYMENT_INTENT:${requestId}] VALIDATION ERROR: Amount is missing`);
        return res.status(400).json({
          error: 'Amount is required',
          requestId,
          timestamp
        });
      }

      if (typeof amount !== 'number') {
        console.error(`[PAYMENT_INTENT:${requestId}] VALIDATION ERROR: Amount is not a number: ${typeof amount}`);
        return res.status(400).json({
          error: 'Amount must be a number',
          requestId,
          timestamp
        });
      }

      if (amount <= 0) {
        console.error(`[PAYMENT_INTENT:${requestId}] VALIDATION ERROR: Amount is not positive: ${amount}`);
        return res.status(400).json({
          error: 'Invalid amount. Must be greater than 0 satoshis.',
          requestId,
          timestamp
        });
      }

      console.log(`[PAYMENT_INTENT:${requestId}] Validation passed`);
    } catch (validationError) {
      console.error(`[PAYMENT_INTENT:${requestId}] Validation error:`, validationError);
      throw new Error(`Validation failed: ${validationError.message}`);
    }

    // Generate payment intent with detailed logging
    let paymentId, intentId, amountInSats, fee;
    
    try {
      paymentId = `pi_${uuidv4()}`;
      intentId = uuidv4();
      amountInSats = Math.floor(amount);
      const FEE_PERCENTAGE = 0.025; // 2.5% processing fee
      fee = Math.floor(amountInSats * FEE_PERCENTAGE);
      
      console.log(`[PAYMENT_INTENT:${requestId}] Generated Payment ID: ${paymentId}`);
      console.log(`[PAYMENT_INTENT:${requestId}] Generated Intent ID: ${intentId}`);
      console.log(`[PAYMENT_INTENT:${requestId}] Amount in Satoshis: ${amountInSats}`);
      console.log(`[PAYMENT_INTENT:${requestId}] Calculated Fee: ${fee} (${FEE_PERCENTAGE * 100}%)`);
    } catch (generationError) {
      console.error(`[PAYMENT_INTENT:${requestId}] ID generation error:`, generationError);
      throw new Error(`Payment ID generation failed: ${generationError.message}`);
    }

    try {
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
        createdAt: timestamp,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        metadata: {
          merchantAddress: merchant.stacksAddress,
          contractFunction: 'create-payment-intent',
          requestId
        }
      };

      payments.set(intentId, paymentIntent);
      console.log(`[PAYMENT_INTENT:${requestId}] Payment intent stored in memory`);

      console.log(`[PAYMENT_INTENT:${requestId}] SUCCESS: Payment intent created successfully`);
      console.log(`[PAYMENT_INTENT:${requestId}] Merchant: ${merchant.businessName}`);
      console.log(`[PAYMENT_INTENT:${requestId}] Amount: ${amountInSats} sats`);
      console.log(`[PAYMENT_INTENT:${requestId}] Expires: ${paymentIntent.expiresAt}`);

      const responsePayload = {
        id: paymentIntent.id,
        paymentId: paymentIntent.paymentId,
        amount: paymentIntent.amount,
        fee: paymentIntent.fee,
        currency: paymentIntent.currency,
        description: paymentIntent.description,
        status: paymentIntent.status,
        clientSecret: paymentIntent.clientSecret,
        createdAt: paymentIntent.createdAt,
        expiresAt: paymentIntent.expiresAt,
        requestId
      };

      console.log(`[PAYMENT_INTENT:${requestId}] === REQUEST END === Response: 201 Created`);
      res.status(201).json(responsePayload);

    } catch (storageError) {
      console.error(`[PAYMENT_INTENT:${requestId}] Storage error:`, storageError);
      throw new Error(`Payment intent storage failed: ${storageError.message}`);
    }

  } catch (error) {
    console.error(`[PAYMENT_INTENT:${requestId}] === CRITICAL ERROR ===`);
    console.error(`[PAYMENT_INTENT:${requestId}] Error Type: ${error.constructor.name}`);
    console.error(`[PAYMENT_INTENT:${requestId}] Error Message: ${error.message}`);
    console.error(`[PAYMENT_INTENT:${requestId}] Error Stack:`, error.stack);
    console.error(`[PAYMENT_INTENT:${requestId}] Request Body:`, JSON.stringify(req.body, null, 2));
    console.error(`[PAYMENT_INTENT:${requestId}] API Key Info:`, JSON.stringify(req.apiKeyInfo, null, 2));
    console.error(`[PAYMENT_INTENT:${requestId}] Demo Mode: ${DEMO_MODE}`);
    console.error(`[PAYMENT_INTENT:${requestId}] Configured Keys Count: ${CONFIGURED_API_KEYS.length}`);
    console.error(`[PAYMENT_INTENT:${requestId}] === ERROR END ===`);
    
    res.status(500).json({
      error: 'Failed to create payment intent',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      requestId,
      timestamp
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
app.get('/api/merchants/dashboard', requireApiKey, async (req, res) => {
  try {
    const apiKey = req.apiKeyInfo.key;
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
  console.log(`🔑 Demo Mode: ${DEMO_MODE ? 'ENABLED' : 'DISABLED'}`);
  console.log(`🔐 Configured API Keys: ${CONFIGURED_API_KEYS.length > 0 ? CONFIGURED_API_KEYS.length : 'None (using fallback)'}`);
  console.log(`🧪 Demo Keys Available: ${DEMO_KEYS.join(', ')}`);
  console.log('🏆 Built for Stacks Builders Competition');
});

module.exports = app;// Force redeploy
