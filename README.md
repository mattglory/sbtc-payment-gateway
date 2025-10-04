# sBTC Payment Gateway

**Stripe for Bitcoin - Accept sBTC payments with ease**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Try%20Now-brightgreen?style=for-the-badge)](https://sbtcpaymentgateway-matt-glorys-projects.vercel.app)
[![API Status](https://img.shields.io/badge/API-Production%20Ready-blue?style=for-the-badge)](https://sbtc-payment-api-production.up.railway.app/health)

## Overview

A professional payment gateway built on the Stacks blockchain that enables merchants to accept sBTC payments with a familiar Stripe-like developer experience. The platform provides a complete payment infrastructure including merchant onboarding, transaction processing, and real-time analytics.

## Features (October 2025 Update)

### Latest Enhancements
- **Complete Transaction History** - Advanced filtering by status, date range, and amount
- **Analytics Dashboard** - Real-time revenue tracking with visual insights
- **Payment Monitoring** - Live status updates and webhook notifications
- **Enhanced Reporting** - Comprehensive transaction data and export capabilities

### Core Features
- **Developer-Friendly API** - RESTful endpoints following industry standards
- **Smart Contract Integration** - Clarity-based payment processing on Stacks
- **Mobile-Responsive Design** - Seamless experience across all devices
- **Merchant Dashboard** - Business management and analytics interface
- **Real-Time Updates** - WebSocket-based payment status notifications
- **Security First** - API key authentication and comprehensive error handling

## Tech Stack

### Frontend
- **Framework**: Next.js 14
- **Language**: TypeScript
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express
- **Database**: PostgreSQL (Production) / SQLite (Development)
- **Blockchain**: Stacks Network, @stacks/transactions
- **Security**: Helmet, Express Rate Limit

### Blockchain
- **Platform**: Stacks
- **Smart Contract**: Clarity
- **Network**: Testnet/Devnet
- **Development**: Clarinet

### Infrastructure
- **API Deployment**: Railway
- **Frontend Deployment**: Vercel
- **Logging**: Winston
- **Monitoring**: Health check endpoints

## Quick Start

### Prerequisites
```bash
node >= 20.18.1
npm >= 9.0.0
clarinet >= 2.0.0
```

### Installation

1. **Clone repository**
```bash
git clone https://github.com/mattglory/sbtc-payment-gateway.git
cd sbtc-payment-gateway
```

2. **Deploy smart contract**
```bash
clarinet integrate
```

3. **Start backend API**
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

4. **Start frontend**
```bash
cd frontend
npm install
npm run dev
```

5. **Access application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/health

## API Documentation

### Authentication
All API requests require authentication using an API key:
```bash
Authorization: Bearer pk_test_your_api_key
```

### Key Endpoints

**Create Payment Intent**
```bash
POST /api/payment-intents
Content-Type: application/json

{
  "amount": 50000,
  "description": "Product purchase"
}
```

**Get Transaction History**
```bash
GET /api/transactions?status=completed&from=2025-01-01&to=2025-12-31
```

**Register Merchant**
```bash
POST /api/merchants/register
Content-Type: application/json

{
  "businessName": "My Store",
  "email": "merchant@store.com",
  "stacksAddress": "ST1ABC123..."
}
```

**Retrieve Payment Intent**
```bash
GET /api/payment-intents/:id
```

**Get Analytics**
```bash
GET /api/analytics/dashboard
```

### Live API Testing
```bash
curl -X POST https://sbtc-payment-api-production.up.railway.app/api/payment-intents \
  -H "Authorization: Bearer pk_test_demo" \
  -H "Content-Type: application/json" \
  -d '{"amount": 50000, "description": "Test payment"}'
```

## Code4STX Submission

### Development Timeline

**September 2025** - Core Infrastructure
- Smart contract development in Clarity
- RESTful API implementation
- Payment widget interface
- Merchant registration system
- Basic payment processing flow

**October 2025** - Dashboard & Analytics
- Complete transaction history with advanced filtering
- Real-time analytics dashboard with revenue insights
- Enhanced payment monitoring and status tracking
- Performance optimizations and bug fixes
- Production deployment on Railway and Vercel

### Project Metrics
- **Development Time**: 2 months
- **Lines of Code**: 3,500+
- **API Endpoints**: 12 RESTful routes
- **Components**: 15+ React components
- **Test Coverage**: Integration and E2E tests

## Demo

**Live Application**: https://sbtcpaymentgateway-matt-glorys-projects.vercel.app

**Backend API**: https://sbtc-payment-api-production.up.railway.app

### Test Credentials
- API Key: `pk_test_demo`
- Testnet enabled for safe testing

## Project Structure

```
sbtc-payment-gateway/
├── contracts/
│   └── sbtc-payment-gateway.clar    # Clarity smart contract
├── backend/
│   ├── server.js                    # Express API server
│   ├── database/                    # Database schemas
│   └── routes/                      # API route handlers
├── frontend/
│   ├── src/
│   │   ├── components/              # React components
│   │   ├── pages/                   # Next.js pages
│   │   └── services/                # API integration
│   └── public/                      # Static assets
└── settings/                        # Clarinet configuration
```

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Built for Code4STX** | [GitHub](https://github.com/mattglory/sbtc-payment-gateway) | [Live Demo](https://sbtcpaymentgateway-matt-glorys-projects.vercel.app)
