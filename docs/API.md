# sBTC Payment Gateway API Documentation

**Version**: 1.0.0  
**Base URL**: `https://sbtc-payment-api-production.up.railway.app`  
**Local Development**: `http://localhost:3001`

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [OpenAPI/Swagger Specification](#openapi-swagger-specification)
4. [API Endpoints](#api-endpoints)
   - [Health & System](#health--system)
   - [Merchant Management](#merchant-management)
   - [Payment Processing](#payment-processing)
   - [Smart Contract Integration](#smart-contract-integration)
5. [Error Handling](#error-handling)
6. [Integration Examples](#integration-examples)
7. [SDK Usage](#sdk-usage)

## Overview

The sBTC Payment Gateway API provides a Stripe-like interface for processing Bitcoin payments via sBTC on the Stacks blockchain. This RESTful API enables developers to integrate Bitcoin payments into their applications with familiar patterns and comprehensive error handling.

### Key Features
- **Stripe-Compatible Design**: Familiar API patterns for easy adoption
- **Real sBTC Processing**: Handles actual Bitcoin transactions via Stacks
- **Professional Authentication**: API key management with demo mode
- **Comprehensive Logging**: Detailed request tracking and error reporting
- **Production Ready**: Rate limiting, CORS, and security built-in

## Authentication

The API uses Bearer token authentication with API keys. All private endpoints require an `Authorization` header:

```
Authorization: Bearer YOUR_API_KEY
```

### API Key Types

1. **Demo Keys** (for testing):
   - `pk_test_demo`
   - `pk_test_your_key`
   - `pk_test_123`

2. **Production Keys**: Generated during merchant registration
   - Format: `pk_test_[64-char-hex]` (test mode)
   - Format: `pk_live_[64-char-hex]` (live mode)

### Demo Mode

When no API keys are configured, the system falls back to demo mode, accepting the demo keys above.

---

## OpenAPI/Swagger Specification

```yaml
openapi: 3.0.0
info:
  title: sBTC Payment Gateway API
  description: Stripe for Bitcoin - Complete payment gateway using sBTC on Stacks blockchain
  version: 1.0.0
  contact:
    name: Matt Glory
    url: https://github.com/mattglory/sbtc-payment-gateway
    email: mattglory14@gmail.com
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
  - url: https://sbtc-payment-api-production.up.railway.app
    description: Production server
  - url: http://localhost:3001
    description: Local development

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: API_KEY
      description: API key authentication using Bearer token

  schemas:
    Error:
      type: object
      required:
        - error
      properties:
        error:
          type: string
          description: Error message
        code:
          type: string
          description: Error code for programmatic handling
        hint:
          type: string
          description: Helpful hint for resolving the error
        requestId:
          type: string
          description: Unique request ID for tracking

    HealthCheck:
      type: object
      properties:
        status:
          type: string
          example: "healthy"
        demoMode:
          type: string
          example: "true"
        apiKeysConfigured:
          type: integer
          example: 3
        timestamp:
          type: string
          format: date-time
        network:
          type: string
          enum: [mainnet, testnet]
        contract:
          type: string
          example: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.sbtc-payment-gateway"
        apiKeySystem:
          type: object
          properties:
            demoMode:
              type: boolean
            configuredKeysCount:
              type: integer
            registeredKeysCount:
              type: integer
            demoKeysAvailable:
              type: boolean
            demoKeys:
              type: array
              items:
                type: string

    MerchantRegistration:
      type: object
      required:
        - businessName
        - email
        - stacksAddress
      properties:
        businessName:
          type: string
          example: "My Bitcoin Store"
        email:
          type: string
          format: email
          example: "merchant@store.com"
        stacksAddress:
          type: string
          example: "ST1ABC123DEF456..."

    MerchantRegistrationResponse:
      type: object
      properties:
        merchantId:
          type: string
          format: uuid
        apiKey:
          type: string
          example: "pk_test_1234567890abcdef..."
        secretKey:
          type: string
          example: "sk_test_abcdef1234567890..."
        message:
          type: string

    ApiKeyValidation:
      type: object
      required:
        - apiKey
      properties:
        apiKey:
          type: string
          example: "pk_test_demo"

    ApiKeyValidationResponse:
      type: object
      properties:
        valid:
          type: boolean
        type:
          type: string
          enum: [demo, configured, registered, demo_fallback]
        timestamp:
          type: string
          format: date-time
        error:
          type: string
        code:
          type: string
        hint:
          type: string

    PaymentIntent:
      type: object
      required:
        - amount
      properties:
        amount:
          type: integer
          minimum: 1
          description: Payment amount in satoshis
          example: 50000
        description:
          type: string
          example: "Digital product purchase"
        currency:
          type: string
          default: "BTC"
          example: "BTC"

    PaymentIntentResponse:
      type: object
      properties:
        id:
          type: string
          format: uuid
        paymentId:
          type: string
          example: "pi_1234567890abcdef..."
        amount:
          type: integer
        fee:
          type: integer
          description: Processing fee (2.5% of amount)
        currency:
          type: string
        description:
          type: string
        status:
          type: string
          enum: [requires_payment_method, processing, succeeded, payment_failed, expired]
        clientSecret:
          type: string
        createdAt:
          type: string
          format: date-time
        expiresAt:
          type: string
          format: date-time
        requestId:
          type: string

    PaymentConfirmation:
      type: object
      required:
        - customerAddress
        - transactionId
      properties:
        customerAddress:
          type: string
          example: "ST1CUSTOMER123..."
        transactionId:
          type: string
          example: "0x1234567890abcdef..."

    PaymentConfirmationResponse:
      type: object
      properties:
        id:
          type: string
        status:
          type: string
        amount:
          type: integer
        customer:
          type: string
        transactionId:
          type: string
        message:
          type: string

    PaymentIntentDetails:
      type: object
      properties:
        id:
          type: string
        paymentId:
          type: string
        amount:
          type: integer
        fee:
          type: integer
        currency:
          type: string
        description:
          type: string
        status:
          type: string
        createdAt:
          type: string
          format: date-time
        expiresAt:
          type: string
          format: date-time
        customerAddress:
          type: string
        transactionId:
          type: string
        processingStartedAt:
          type: string
          format: date-time
        succeededAt:
          type: string
          format: date-time
        failedAt:
          type: string
          format: date-time

    DashboardStats:
      type: object
      properties:
        totalProcessed:
          type: integer
          description: Total amount processed in satoshis
        feeCollected:
          type: integer
          description: Total fees collected in satoshis
        paymentsCount:
          type: integer
        activePayments:
          type: integer
        successfulPayments:
          type: integer
        recentPayments:
          type: array
          items:
            type: object
            properties:
              id:
                type: string
              amount:
                type: integer
              status:
                type: string
              createdAt:
                type: string
                format: date-time
              customerAddress:
                type: string
              description:
                type: string

    ContractInfo:
      type: object
      properties:
        contractAddress:
          type: string
        contractName:
          type: string
        network:
          type: string
        explorerUrl:
          type: string

    ContractPayment:
      type: object
      required:
        - paymentId
        - amount
        - merchantPrivateKey
      properties:
        paymentId:
          type: string
        amount:
          type: integer
        description:
          type: string
        expiresInBlocks:
          type: integer
          default: 144
        merchantPrivateKey:
          type: string

    ContractPaymentResponse:
      type: object
      properties:
        success:
          type: boolean
        transactionId:
          type: string
        paymentId:
          type: string
        amount:
          type: integer
        expiresInBlocks:
          type: integer

paths:
  /health:
    get:
      summary: System Health Check
      description: Returns the health status and configuration of the API
      tags:
        - System
      responses:
        '200':
          description: System is healthy
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HealthCheck'
        '500':
          description: System error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /api/merchants/register:
    post:
      summary: Register New Merchant
      description: Register a new merchant and receive API credentials
      tags:
        - Merchants
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/MerchantRegistration'
      responses:
        '201':
          description: Merchant registered successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/MerchantRegistrationResponse'
        '400':
          description: Missing required fields
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '409':
          description: Merchant already exists
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /api/merchants/validate-key:
    post:
      summary: Validate API Key
      description: Validate an API key for debugging purposes
      tags:
        - Merchants
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ApiKeyValidation'
      responses:
        '200':
          description: API key validation result
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ApiKeyValidationResponse'

  /api/merchants/dashboard:
    get:
      summary: Get Merchant Dashboard
      description: Get dashboard statistics for authenticated merchant
      tags:
        - Merchants
      security:
        - BearerAuth: []
      responses:
        '200':
          description: Dashboard statistics
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DashboardStats'
        '401':
          description: Invalid API key
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '404':
          description: Merchant not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /api/payment-intents:
    post:
      summary: Create Payment Intent
      description: Create a new payment intent for processing
      tags:
        - Payments
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PaymentIntent'
      responses:
        '201':
          description: Payment intent created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PaymentIntentResponse'
        '400':
          description: Invalid request parameters
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '401':
          description: Invalid API key
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /api/payment-intents/{id}:
    get:
      summary: Get Payment Intent
      description: Retrieve details of a specific payment intent
      tags:
        - Payments
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Payment intent details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PaymentIntentDetails'
        '404':
          description: Payment intent not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /api/payment-intents/{id}/confirm:
    post:
      summary: Confirm Payment
      description: Confirm and process a payment intent
      tags:
        - Payments
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PaymentConfirmation'
      responses:
        '200':
          description: Payment confirmation started
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PaymentConfirmationResponse'
        '400':
          description: Payment expired or invalid
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '404':
          description: Payment intent not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /api/contract/info:
    get:
      summary: Get Contract Information
      description: Get Stacks smart contract information
      tags:
        - Smart Contract
      responses:
        '200':
          description: Contract information
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ContractInfo'

  /api/contract/create-payment:
    post:
      summary: Create Contract Payment
      description: Create payment directly on the smart contract
      tags:
        - Smart Contract
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ContractPayment'
      responses:
        '200':
          description: Contract payment created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ContractPaymentResponse'
        '400':
          description: Invalid request or blockchain error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /api/contract/process-payment:
    post:
      summary: Process Contract Payment
      description: Process payment on the smart contract
      tags:
        - Smart Contract
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - paymentId
                - customerAddress
                - merchantPrivateKey
              properties:
                paymentId:
                  type: string
                customerAddress:
                  type: string
                merchantPrivateKey:
                  type: string
      responses:
        '200':
          description: Payment processing started
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  transactionId:
                    type: string
                  paymentId:
                    type: string
                  customerAddress:
                    type: string
                  status:
                    type: string

  /api/contract/register-merchant:
    post:
      summary: Register Merchant on Contract
      description: Register merchant directly on the smart contract
      tags:
        - Smart Contract
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - businessName
                - email
                - merchantPrivateKey
              properties:
                businessName:
                  type: string
                email:
                  type: string
                merchantPrivateKey:
                  type: string
      responses:
        '200':
          description: Merchant registered on contract
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  transactionId:
                    type: string
                  businessName:
                    type: string
                  email:
                    type: string

tags:
  - name: System
    description: System health and status endpoints
  - name: Merchants
    description: Merchant registration and management
  - name: Payments
    description: Payment processing and intent management
  - name: Smart Contract
    description: Direct Stacks blockchain contract interactions
```

---

## API Endpoints

### Health & System

#### `GET /health`
**Description**: Check system health and configuration  
**Authentication**: None required  
**Rate Limiting**: Yes (100 requests per 15 minutes)

**Response Example**:
```json
{
  "status": "healthy",
  "demoMode": "true",
  "apiKeysConfigured": 3,
  "timestamp": "2025-01-20T10:30:00.000Z",
  "network": "testnet",
  "contract": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.sbtc-payment-gateway",
  "apiKeySystem": {
    "demoMode": true,
    "configuredKeysCount": 3,
    "registeredKeysCount": 0,
    "demoKeysAvailable": true,
    "demoKeys": ["pk_test_demo", "pk_test_your_key", "pk_test_123"]
  }
}
```

### Merchant Management

#### `POST /api/merchants/register`
**Description**: Register a new merchant and receive API credentials  
**Authentication**: None required  

**Request Body**:
```json
{
  "businessName": "My Bitcoin Store",
  "email": "merchant@store.com",
  "stacksAddress": "ST1ABC123DEF456GHI789JKL"
}
```

**Response Example**:
```json
{
  "merchantId": "550e8400-e29b-41d4-a716-446655440000",
  "apiKey": "pk_test_1234567890abcdef1234567890abcdef12345678",
  "secretKey": "sk_test_abcdef1234567890abcdef1234567890abcdef12",
  "message": "Merchant registered successfully. Please call register-merchant on the smart contract to complete setup."
}
```

#### `POST /api/merchants/validate-key`
**Description**: Validate an API key (useful for debugging)  
**Authentication**: None required  

**Request Body**:
```json
{
  "apiKey": "pk_test_demo"
}
```

**Response Example**:
```json
{
  "valid": true,
  "type": "demo_fallback",
  "timestamp": "2025-01-20T10:30:00.000Z"
}
```

#### `GET /api/merchants/dashboard`
**Description**: Get merchant dashboard statistics  
**Authentication**: Required (Bearer token)  

**Response Example**:
```json
{
  "totalProcessed": 1500000,
  "feeCollected": 37500,
  "paymentsCount": 25,
  "activePayments": 2,
  "successfulPayments": 23,
  "recentPayments": [
    {
      "id": "pi_1234567890abcdef",
      "amount": 50000,
      "status": "succeeded",
      "createdAt": "2025-01-20T09:30:00.000Z",
      "customerAddress": "ST1CUSTOMER123",
      "description": "Digital product purchase"
    }
  ]
}
```

### Payment Processing

#### `POST /api/payment-intents`
**Description**: Create a new payment intent  
**Authentication**: Required (Bearer token)  

**Request Body**:
```json
{
  "amount": 50000,
  "description": "Digital product purchase",
  "currency": "BTC"
}
```

**Response Example**:
```json
{
  "id": "aa394d71-15a5-4db1-8742-7af0d0a21e98",
  "paymentId": "pi_31130707-3d13-43e6-93ab-ec363b57315e",
  "amount": 50000,
  "fee": 1250,
  "currency": "BTC",
  "description": "Digital product purchase",
  "status": "requires_payment_method",
  "clientSecret": "pi_31130707-3d13-43e6-93ab-ec363b57315e_secret_724bc8c86617d496",
  "createdAt": "2025-01-20T10:30:00.000Z",
  "expiresAt": "2025-01-21T10:30:00.000Z",
  "requestId": "06cb6510"
}
```

#### `GET /api/payment-intents/{id}`
**Description**: Retrieve payment intent details  
**Authentication**: None required  

**Response Example**:
```json
{
  "id": "aa394d71-15a5-4db1-8742-7af0d0a21e98",
  "paymentId": "pi_31130707-3d13-43e6-93ab-ec363b57315e",
  "amount": 50000,
  "fee": 1250,
  "currency": "BTC",
  "description": "Digital product purchase",
  "status": "succeeded",
  "createdAt": "2025-01-20T10:30:00.000Z",
  "expiresAt": "2025-01-21T10:30:00.000Z",
  "customerAddress": "ST1CUSTOMER123ABC",
  "transactionId": "0x1234567890abcdef",
  "processingStartedAt": "2025-01-20T10:32:00.000Z",
  "succeededAt": "2025-01-20T10:32:03.000Z"
}
```

#### `POST /api/payment-intents/{id}/confirm`
**Description**: Confirm and process a payment  
**Authentication**: None required  

**Request Body**:
```json
{
  "customerAddress": "ST1CUSTOMER123ABC456DEF789GHI",
  "transactionId": "0x1234567890abcdef1234567890abcdef12345678"
}
```

**Response Example**:
```json
{
  "id": "aa394d71-15a5-4db1-8742-7af0d0a21e98",
  "status": "processing",
  "amount": 50000,
  "customer": "ST1CUSTOMER123ABC456DEF789GHI",
  "transactionId": "0x1234567890abcdef1234567890abcdef12345678",
  "message": "Payment is being processed on the Stacks blockchain"
}
```

### Smart Contract Integration

#### `GET /api/contract/info`
**Description**: Get smart contract information  
**Authentication**: None required  

**Response Example**:
```json
{
  "contractAddress": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  "contractName": "sbtc-payment-gateway",
  "network": "testnet",
  "explorerUrl": "https://explorer.stacks.co/txid/?chain=testnet"
}
```

#### `POST /api/contract/create-payment`
**Description**: Create payment directly on smart contract  
**Authentication**: None required (uses private key)  

**Request Body**:
```json
{
  "paymentId": "payment_123456",
  "amount": 50000,
  "description": "Contract payment",
  "expiresInBlocks": 144,
  "merchantPrivateKey": "your_private_key_here"
}
```

#### `POST /api/contract/process-payment`
**Description**: Process payment on smart contract  
**Authentication**: None required (uses private key)  

**Request Body**:
```json
{
  "paymentId": "payment_123456",
  "customerAddress": "ST1CUSTOMER123ABC",
  "merchantPrivateKey": "your_private_key_here"
}
```

#### `POST /api/contract/register-merchant`
**Description**: Register merchant on smart contract  
**Authentication**: None required (uses private key)  

**Request Body**:
```json
{
  "businessName": "My Store",
  "email": "merchant@store.com",
  "merchantPrivateKey": "your_private_key_here"
}
```

---

## Error Handling

### Error Response Format

All errors follow a consistent format:

```json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE",
  "hint": "Helpful suggestion to resolve the error",
  "requestId": "unique-request-id"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `MISSING_API_KEY` | 401 | No API key provided |
| `INVALID_API_KEY` | 401 | API key is invalid |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `MERCHANT_NOT_FOUND` | 404 | Merchant doesn't exist |
| `PAYMENT_NOT_FOUND` | 404 | Payment intent doesn't exist |
| `PAYMENT_EXPIRED` | 400 | Payment intent has expired |
| `MERCHANT_EXISTS` | 409 | Merchant already registered |

### Rate Limiting

- **Limit**: 100 requests per 15 minutes per IP address
- **Headers**: Rate limit info included in response headers
- **Response**: 429 status with retry information

---

## Integration Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

const client = axios.create({
  baseURL: 'https://sbtc-payment-api-production.up.railway.app',
  headers: {
    'Authorization': 'Bearer pk_test_demo',
    'Content-Type': 'application/json'
  }
});

// Create payment intent
async function createPayment() {
  try {
    const response = await client.post('/api/payment-intents', {
      amount: 50000,
      description: 'Digital product purchase'
    });
    
    console.log('Payment created:', response.data);
    return response.data;
  } catch (error) {
    console.error('Payment creation failed:', error.response.data);
    throw error;
  }
}

// Check payment status
async function checkPayment(paymentId) {
  try {
    const response = await client.get(`/api/payment-intents/${paymentId}`);
    console.log('Payment status:', response.data.status);
    return response.data;
  } catch (error) {
    console.error('Payment check failed:', error.response.data);
    throw error;
  }
}
```

### cURL Examples

```bash
# Create payment intent
curl -X POST https://sbtc-payment-api-production.up.railway.app/api/payment-intents \
  -H "Authorization: Bearer pk_test_demo" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50000,
    "description": "Digital product purchase"
  }'

# Check payment status
curl -X GET https://sbtc-payment-api-production.up.railway.app/api/payment-intents/PAYMENT_ID

# Confirm payment
curl -X POST https://sbtc-payment-api-production.up.railway.app/api/payment-intents/PAYMENT_ID/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "customerAddress": "ST1CUSTOMER123ABC",
    "transactionId": "0x1234567890abcdef"
  }'

# Register merchant
curl -X POST https://sbtc-payment-api-production.up.railway.app/api/merchants/register \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "My Bitcoin Store",
    "email": "merchant@store.com",
    "stacksAddress": "ST1ABC123DEF456"
  }'
```

### React Integration

```jsx
import { useState, useEffect } from 'react';

const PaymentWidget = ({ amount, description }) => {
  const [paymentIntent, setPaymentIntent] = useState(null);
  const [status, setStatus] = useState('idle');

  const createPayment = async () => {
    setStatus('creating');
    
    try {
      const response = await fetch('/api/payment-intents', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer pk_test_demo',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount, description })
      });

      if (!response.ok) {
        throw new Error('Payment creation failed');
      }

      const data = await response.json();
      setPaymentIntent(data);
      setStatus('ready');
    } catch (error) {
      console.error('Payment error:', error);
      setStatus('error');
    }
  };

  const confirmPayment = async (customerAddress, txId) => {
    setStatus('processing');

    try {
      const response = await fetch(`/api/payment-intents/${paymentIntent.id}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerAddress,
          transactionId: txId
        })
      });

      const result = await response.json();
      setStatus(result.status);
    } catch (error) {
      setStatus('error');
    }
  };

  return (
    <div className="payment-widget">
      {status === 'idle' && (
        <button onClick={createPayment}>
          Pay {amount} sats
        </button>
      )}
      {status === 'ready' && (
        <div>
          <p>Payment ready: {paymentIntent.paymentId}</p>
          <p>Amount: {paymentIntent.amount} sats</p>
          <p>Fee: {paymentIntent.fee} sats</p>
          {/* Add your payment UI here */}
        </div>
      )}
      {status === 'processing' && <p>Processing payment...</p>}
      {status === 'succeeded' && <p>✅ Payment successful!</p>}
      {status === 'error' && <p>❌ Payment failed</p>}
    </div>
  );
};
```

---

## SDK Usage

### JavaScript SDK (Coming Soon)

```javascript
import { SBTCPaymentGateway } from '@sbtc/payment-gateway-sdk';

const gateway = new SBTCPaymentGateway('pk_test_demo');

// Simple payment
const payment = await gateway.createPayment({
  amount: 50000,
  description: 'Digital purchase'
});

// Monitor payment status
gateway.on('payment.succeeded', (payment) => {
  console.log('Payment succeeded:', payment.id);
});

// Process payment
await payment.confirm({
  customerAddress: 'ST1CUSTOMER123',
  transactionId: '0x123...'
});
```

### React Hooks (Coming Soon)

```jsx
import { usePaymentGateway } from '@sbtc/react-payment-gateway';

const CheckoutForm = () => {
  const { createPayment, confirmPayment, loading } = usePaymentGateway('pk_test_demo');
  
  const handlePayment = async () => {
    const payment = await createPayment({
      amount: 50000,
      description: 'Product purchase'
    });
    
    // Handle payment confirmation...
  };

  return (
    <button onClick={handlePayment} disabled={loading}>
      {loading ? 'Processing...' : 'Pay with sBTC'}
    </button>
  );
};
```

---

## Webhooks (Future Enhancement)

*Coming in v2.0: Real-time webhook notifications for payment events*

```javascript
// Future webhook payload structure
{
  "event": "payment.succeeded",
  "data": {
    "paymentId": "pi_1234567890",
    "amount": 50000,
    "merchantId": "merchant_123",
    "timestamp": "2025-01-20T10:30:00.000Z"
  }
}
```

---

## Testing & Development

### Demo Environment
- **Base URL**: https://sbtc-payment-api-production.up.railway.app
- **Network**: Stacks Testnet
- **Demo Keys**: `pk_test_demo`, `pk_test_your_key`, `pk_test_123`

### Local Development
```bash
# Clone and setup
git clone https://github.com/mattglory/sbtc-payment-gateway.git
cd sbtc-payment-gateway/backend
npm install

# Start development server
npm run dev

# API available at http://localhost:3001
```

### Testing Checklist
- [ ] Health check responds correctly
- [ ] API key validation works
- [ ] Payment intent creation succeeds
- [ ] Payment confirmation processes
- [ ] Error handling returns proper codes
- [ ] Rate limiting enforced
- [ ] CORS headers allow frontend access

---

## Support & Resources

- **GitHub Repository**: https://github.com/mattglory/sbtc-payment-gateway
- **Live Demo**: https://sbtcpaymentgateway-matt-glorys-projects.vercel.app
- **API Health Check**: https://sbtc-payment-api-production.up.railway.app/health
- **Stacks Documentation**: https://docs.stacks.co
- **sBTC Resources**: https://sbtc.tech

## Contact & Support

For technical support or integration assistance:

- **Developer**: Matt Glory
- **Email**: mattglory14@gmail.com
- **GitHub Issues**: https://github.com/mattglory/sbtc-payment-gateway/issues
- **Location**: Birmingham, UK

Please open an issue on GitHub for bugs and feature requests, or reach out via email for integration assistance.

---

*Built with ❤️ for the Stacks ecosystem - Making Bitcoin payments as simple as traditional payments*