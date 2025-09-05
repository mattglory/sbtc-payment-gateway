# sBTC Payment Gateway - Complete Documentation

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Technical Architecture](#technical-architecture)
3. [Market Opportunity](#market-opportunity)
4. [Business Model](#business-model)
5. [Getting Started](#getting-started)
6. [API Documentation](#api-documentation)
7. [Security & Compliance](#security--compliance)
8. [Development](#development)
9. [Deployment](#deployment)
10. [Roadmap](#roadmap)

## Executive Summary

**sBTC Payment Gateway** is the first Stripe-like payment infrastructure for Bitcoin on the Stacks blockchain. We're building the critical infrastructure that makes Bitcoin payments as simple as traditional online payments.

### Key Value Propositions

- **Developer-First**: 3-line integration like Stripe
- **Real Bitcoin**: Actual BTC transactions via sBTC
- **Production-Ready**: Enterprise-grade security and monitoring
- **Complete Ecosystem**: APIs, SDKs, widgets, and merchant tools

### Market Position

- **Target Market**: $87B+ payment processing industry
- **Competitive Advantage**: First-mover in Bitcoin payment infrastructure
- **Revenue Model**: Transaction fees (2.9% + $0.30 per transaction)
- **Scalability**: Built for millions of transactions

## Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        sBTC Payment Gateway                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Merchant  │  │  Developer  │  │  End User   │             │
│  │  Dashboard  │  │     SDK     │  │   Widget    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│         │                 │                 │                   │
│         └─────────────────┼─────────────────┘                   │
│                           │                                     │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                  REST API Layer                             ││
│  │  • Authentication & Authorization                           ││
│  │  • Rate Limiting & Security                                 ││
│  │  • Request Validation & Logging                             ││
│  └─────────────────────────────────────────────────────────────┘│
│                           │                                     │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                 Business Logic Layer                        ││
│  │  • Payment Processing   • Merchant Management               ││
│  │  • Webhook System      • Analytics & Reporting             ││
│  │  • Fee Calculation     • Fraud Detection                   ││
│  └─────────────────────────────────────────────────────────────┘│
│                           │                                     │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                 Blockchain Layer                            ││
│  │  • Stacks Smart Contract                                   ││
│  │  • sBTC Token Management                                   ││
│  │  • Transaction Monitoring                                  ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Core Components

#### 1. Smart Contract (Clarity)
- **Payment Intent Management**: Create, update, and track payment states
- **Merchant Registry**: On-chain merchant verification and management
- **Fee Distribution**: Automated fee collection and distribution
- **Event System**: Real-time payment event emission

#### 2. API Gateway (Node.js/Express)
- **RESTful Endpoints**: Stripe-compatible API design
- **Authentication**: API key-based merchant authentication
- **Rate Limiting**: Configurable request throttling
- **Webhook System**: Real-time payment notifications

#### 3. Frontend Applications
- **Payment Widget**: Embeddable payment interface
- **Merchant Dashboard**: Business management and analytics
- **Developer Portal**: API documentation and testing tools

#### 4. SDK & Libraries
- **JavaScript SDK**: Browser and Node.js support
- **React Components**: Pre-built payment components
- **Mobile SDKs**: iOS and Android libraries (roadmap)

## Market Opportunity

### Market Size
- **Global Payment Processing**: $87.4B (2025)
- **Bitcoin Market Cap**: $1.2T+ 
- **E-commerce Growth**: 15% YoY
- **Developer Tools Market**: $26.9B

### Target Segments

1. **E-commerce Platforms** (Primary)
   - Online retailers accepting Bitcoin
   - Digital marketplaces and platforms
   - Subscription-based services

2. **Developer Ecosystem** (Secondary)
   - Fintech applications
   - Web3 platforms and dApps
   - API-first businesses

3. **Traditional Businesses** (Future)
   - Physical retail locations
   - Professional services
   - Enterprise software

## Business Model

### Revenue Streams

1. **Transaction Fees**
   - Standard: 2.9% + $0.30 per transaction
   - Enterprise: Custom pricing for high volume
   - International: Additional 1.5% for cross-border

2. **Premium Features**
   - Advanced analytics dashboard: $29/month
   - Priority support: $99/month
   - Custom integrations: Quote-based

3. **Developer Tools**
   - API calls beyond free tier: $0.001 per call
   - Premium SDKs and libraries: $199/year
   - White-label solutions: Custom pricing

### Cost Structure

- **Infrastructure**: Cloud hosting and scaling
- **Development**: Engineering and product development
- **Security**: Compliance and security auditing
- **Support**: Customer success and technical support

## Getting Started

### For Merchants

1. **Sign Up**
   ```bash
   curl -X POST https://api.sbtcpay.com/merchants/register \
     -d '{"businessName": "My Store", "email": "me@store.com"}'
   ```

2. **Get API Keys**
   ```javascript
   // Test environment
   const apiKey = "pk_test_abc123...";
   
   // Production environment
   const apiKey = "pk_live_xyz789...";
   ```

3. **Accept Payments**
   ```javascript
   const payment = await sbtcpay.paymentIntents.create({
     amount: 5000, // $50.00 in satoshis
     description: "Premium Plan Subscription"
   });
   ```

### For Developers

1. **Install SDK**
   ```bash
   npm install @sbtcpay/sdk
   ```

2. **Initialize Client**
   ```javascript
   import SBTCPay from '@sbtcpay/sdk';
   
   const sbtcpay = new SBTCPay('pk_test_your_key');
   ```

3. **Create Payment**
   ```javascript
   const payment = await sbtcpay.paymentIntents.create({
     amount: 10000,
     description: 'Product Purchase',
     metadata: { userId: '12345' }
   });
   ```

## API Documentation

### Authentication

All API requests must include an API key in the Authorization header:

```bash
Authorization: Bearer pk_test_your_api_key_here
```

### Core Endpoints

#### Payment Intents

##### Create Payment Intent
```http
POST /api/payment-intents
Content-Type: application/json

{
  "amount": 50000,
  "description": "Product purchase",
  "metadata": {
    "orderId": "order_123",
    "userId": "user_456"
  }
}
```

**Response:**
```json
{
  "id": "pi_1234567890",
  "amount": 50000,
  "description": "Product purchase",
  "status": "requires_payment_method",
  "clientSecret": "pi_1234567890_secret_abc",
  "created": "2025-09-15T10:30:00Z",
  "metadata": {
    "orderId": "order_123",
    "userId": "user_456"
  }
}
```

##### Confirm Payment Intent
```http
POST /api/payment-intents/{id}/confirm
Content-Type: application/json

{
  "customerAddress": "ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE",
  "transactionId": "0x1234..."
}
```

#### Merchants

##### Register Merchant
```http
POST /api/merchants/register
Content-Type: application/json

{
  "businessName": "My Store",
  "email": "owner@mystore.com",
  "stacksAddress": "ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE"
}
```

##### Get Dashboard Data
```http
GET /api/merchants/dashboard
Authorization: Bearer pk_test_your_api_key
```

**Response:**
```json
{
  "totalProcessed": 1500000,
  "feeCollected": 15000,
  "paymentsCount": 25,
  "successfulPayments": 23,
  "recentPayments": [
    {
      "id": "pi_recent_001",
      "amount": 75000,
      "status": "succeeded",
      "created": "2025-09-15T09:45:00Z"
    }
  ]
}
```

### Error Handling

All errors follow a consistent format:

```json
{
  "error": {
    "type": "invalid_request_error",
    "code": "parameter_missing",
    "message": "Amount is required",
    "param": "amount"
  }
}
```

### Rate Limits

- **Standard**: 100 requests per 15 minutes
- **Premium**: 1000 requests per 15 minutes
- **Enterprise**: Custom limits

## Security & Compliance

### Security Measures

1. **API Security**
   - API key authentication
   - Request signing for sensitive operations
   - Rate limiting and DDoS protection
   - Input validation and sanitization

2. **Data Protection**
   - Encryption at rest and in transit
   - PCI DSS Level 1 compliance (roadmap)
   - GDPR compliance
   - SOC 2 Type II certification (roadmap)

3. **Blockchain Security**
   - Smart contract auditing
   - Multi-signature wallets for treasury
   - Real-time transaction monitoring
   - Automated fraud detection

### Compliance Framework

- **Financial Regulations**: Compliance with applicable financial regulations
- **Data Privacy**: GDPR, CCPA, and international data protection laws
- **Security Standards**: ISO 27001, SOC 2, PCI DSS
- **AML/KYC**: Anti-money laundering and know-your-customer procedures

## Development

### Local Development Setup

1. **Prerequisites**
   ```bash
   node --version  # v18.0.0+
   npm --version   # v8.0.0+
   clarinet --version  # Latest
   ```

2. **Clone Repository**
   ```bash
   git clone https://github.com/sbtcpay/sbtc-payment-gateway.git
   cd sbtc-payment-gateway
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Smart Contract Development**
   ```bash
   cd contracts
   clarinet integrate
   clarinet test
   ```

5. **Backend Development**
   ```bash
   cd backend
   npm run dev
   ```

6. **Frontend Development**
   ```bash
   cd frontend
   npm start
   ```

### Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:contracts

# Run with coverage
npm run test:coverage
```

### Code Quality

```bash
# Linting
npm run lint

# Type checking
npm run typecheck

# Security audit
npm audit

# Dependency check
npm run check-deps
```

## Deployment

### Environment Setup

#### Staging
- **API**: https://api-staging.sbtcpay.com
- **Dashboard**: https://dashboard-staging.sbtcpay.com
- **Network**: Stacks Testnet
- **Purpose**: Integration testing and QA

#### Production
- **API**: https://api.sbtcpay.com
- **Dashboard**: https://dashboard.sbtcpay.com
- **Network**: Stacks Mainnet
- **Purpose**: Live merchant transactions

### Infrastructure

#### Backend (Railway/AWS)
```yaml
resources:
  cpu: 2 cores
  memory: 4GB
  storage: 100GB SSD
  
scaling:
  min_instances: 2
  max_instances: 10
  auto_scaling: enabled
  
monitoring:
  health_checks: enabled
  error_tracking: enabled
  performance_monitoring: enabled
```

#### Frontend (Vercel)
```yaml
framework: React
build_command: npm run build
output_directory: build

environments:
  - name: production
    url: dashboard.sbtcpay.com
  - name: staging
    url: dashboard-staging.sbtcpay.com
```

#### Database (PostgreSQL)
```yaml
version: 14
storage: 500GB
backup: daily
encryption: enabled
monitoring: enabled
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm test
      - run: npm run lint
      
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - run: npm run build
      - run: npm run deploy
```

## Roadmap

### Q1 2025 - Foundation
- [x] Core API development
- [x] Smart contract deployment
- [x] Basic payment widget
- [x] Merchant dashboard MVP
- [ ] Security audit #1

### Q2 2025 - Enhancement
- [ ] Advanced analytics dashboard
- [ ] Webhook system v2
- [ ] Mobile-responsive widgets
- [ ] API rate limiting improvements
- [ ] PCI DSS Level 1 compliance

### Q3 2025 - Scale
- [ ] Multi-currency support
- [ ] Subscription payments
- [ ] Advanced fraud detection
- [ ] Enterprise features
- [ ] Mobile SDKs (iOS/Android)

### Q4 2025 - Enterprise
- [ ] White-label solutions
- [ ] Advanced reporting
- [ ] Global expansion
- [ ] Partner integrations
- [ ] Institutional features

### 2026 - Innovation
- [ ] Lightning Network integration
- [ ] DeFi protocol integrations
- [ ] AI-powered analytics
- [ ] Global compliance expansion
- [ ] IPO preparation

## Support & Contact

### Developer Support
- **Documentation**: https://docs.sbtcpay.com
- **API Reference**: https://api.sbtcpay.com/docs
- **GitHub**: https://github.com/sbtcpay/sbtc-payment-gateway
- **Discord**: https://discord.gg/sbtcpay

### Business Inquiries
- **Email**: business@sbtcpay.com
- **Phone**: +1 (555) 123-4567
- **Address**: 123 Blockchain Ave, San Francisco, CA 94105

### Security
- **Bug Bounty**: security@sbtcpay.com
- **PGP Key**: Available at keybase.io/sbtcpay
- **Security Policy**: https://sbtcpay.com/security

---

**Built for the future of Bitcoin payments**

*Making Bitcoin as easy to accept as traditional payments*