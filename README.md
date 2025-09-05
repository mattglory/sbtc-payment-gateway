# sBTC Payment Gateway

**Stripe for Bitcoin** - A complete payment gateway that makes accepting Bitcoin via sBTC as simple as traditional payments.

🏆 **Stacks Builders Competition Entry**

## Live Demo

🌐 **[Try the Live Demo](https://sbtcpaymentgateway-matt-glorys-projects.vercel.app)**

- **Frontend**: https://sbtcpaymentgateway-matt-glorys-projects.vercel.app
- **Backend API**: https://sbtc-payment-api-production.up.railway.app
- **Health Check**: https://sbtc-payment-api-production.up.railway.app/health

## What Is This?

This project demonstrates how Bitcoin payments can be as simple as using Stripe. Built specifically for the Stacks Builders Competition, it showcases a complete payment gateway ecosystem using sBTC on the Stacks blockchain.

## Key Features

- **3-Line Integration** - As simple as Stripe for developers
- **Real sBTC Processing** - Handles actual Bitcoin transactions via Stacks
- **Complete Payment Flow** - From intent creation to confirmation
- **Merchant Dashboard** - Business management interface
- **Developer-First API** - RESTful endpoints with comprehensive documentation
- **Production Ready** - Error handling, security, and monitoring built-in

## Quick Start

```javascript
// Accept sBTC payments in just 3 lines
const widget = new SBTCPaymentWidget("pk_test_your_key");
await widget.create({ amount: 50000, description: "Purchase" });
// That's it! 🚀
```

## Architecture

This is a complete payment ecosystem with four main components:

### 1. Smart Contract (Clarity)

- Payment intent creation and processing
- Merchant registration system
- Fee calculation (2.5% processing fee)
- Event emission for real-time tracking

### 2. Backend API (Node.js/Express)

- RESTful endpoints matching Stripe's design patterns
- Payment intent management
- Merchant authentication and API keys
- Real-time webhook system

### 3. Frontend Application (React/TypeScript)

- Professional payment widget interface
- Merchant registration and dashboard
- Mobile-responsive design
- Real-time payment status updates

### 4. Developer SDK

- JavaScript library for easy integration
- React components and hooks
- Comprehensive error handling
- Utility functions for Bitcoin/satoshi conversions

## Technical Implementation

### Payment Flow

1. Merchant creates payment intent via API
2. Customer sees professional payment interface
3. Payment processed through Stacks smart contract
4. Real-time status updates via webhooks
5. Funds transferred minus processing fee

### Security Features

- API key authentication
- Environment-based configuration
- Input validation and sanitization
- Error handling and logging
- Rate limiting protection

## Development Setup

```bash
# Clone repository
git clone https://github.com/mattglory/sbtc-payment-gateway.git
cd sbtc-payment-gateway

# Deploy smart contract
clarinet integrate

# Start backend API
cd backend
npm install
npm run dev

# Start frontend application
cd ../frontend
npm install
npm start
```

## File Structure

```
sbtc-payment-gateway/
├── contracts/
│   └── sbtc-payment-gateway.clar    # Smart contract
├── backend/
│   ├── server.js                    # Express API server
│   └── package.json                 # Backend dependencies
├── frontend/
│   ├── src/
│   │   ├── components/              # React components
│   │   └── services/                # API integration
│   └── package.json                 # Frontend dependencies
└── settings/                        # Clarinet configuration
```

## Competition Highlights

**Built in 25 days for the Stacks Builders Competition**

This project demonstrates:

- **Complete MVP** - Not just a proof of concept, but a fully functional payment gateway
- **Stripe-like Experience** - Familiar developer patterns that reduce adoption friction
- **Real Bitcoin Integration** - Actual sBTC functionality on Stacks testnet
- **Production Quality** - Comprehensive error handling, security, and documentation
- **Developer-First Design** - Clean APIs, SDKs, and integration examples

## API Documentation

### Create Payment Intent

```bash
curl -X POST https://sbtc-payment-api-production.up.railway.app/api/payment-intents \
  -H "Authorization: Bearer pk_test_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50000,
    "description": "Digital product purchase"
  }'
```

### Register Merchant

```bash
curl -X POST https://sbtc-payment-api-production.up.railway.app/api/merchants/register \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "My Store",
    "email": "merchant@store.com",
    "stacksAddress": "ST1ABC123..."
  }'
```

## Smart Contract Functions

```clarity
;; Register as merchant
(contract-call? .sbtc-payment-gateway register-merchant)

;; Create payment intent
(contract-call? .sbtc-payment-gateway create-payment-intent
  "payment-123"
  u50000
  (some u"Product purchase"))

;; Process payment
(contract-call? .sbtc-payment-gateway process-payment "payment-123")
```

## Technology Stack

- **Blockchain**: Stacks (Testnet)
- **Smart Contracts**: Clarity
- **Backend**: Node.js, Express
- **Frontend**: React, TypeScript, Tailwind CSS
- **Deployment**: Railway (API), Vercel (Frontend)
- **Development**: Clarinet, VS Code

## Competition Metrics

- **Development Time**: 25 days
- **Lines of Code**: 2,000+
- **Components Built**: 5 major systems
- **API Endpoints**: 8 RESTful routes
- **Test Coverage**: End-to-end functionality verified

## Why This Matters

Bitcoin adoption requires developer-friendly tools. This project bridges the gap between Bitcoin's potential and practical implementation by providing:

1. **Familiar Patterns** - Developers already know how to use Stripe-like APIs
2. **Reduced Complexity** - Abstract away blockchain intricacies
3. **Complete Solution** - Not just payments, but merchant management and analytics
4. **Production Ready** - Built with real-world deployment in mind

## Future Roadmap

- Mainnet deployment with real sBTC integration
- Advanced merchant dashboard with analytics
- Subscription and recurring payment support
- Multi-currency support beyond sBTC
- Mobile SDKs for iOS and Android
- Advanced fraud detection and prevention

## Contributing

This project is open source and welcomes contributions. Areas where help is needed:

- Additional payment methods
- Enhanced security features
- Mobile app development
- Documentation improvements
- Testing and bug fixes

## Contact

For questions, support, or collaboration:

- **Developer**: Matt Glory
- **Email**: mattglory14@gmail.com
- **GitHub**: https://github.com/mattglory/sbtc-payment-gateway  
- **Live Demo**: https://sbtcpaymentgateway-matt-glorys-projects.vercel.app
- **Location**: Birmingham, UK

Feel free to open an issue on GitHub or reach out via email for technical support or partnership inquiries.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Stacks Foundation** for the excellent competition and ecosystem
- **Hiro** for comprehensive developer tools
- **Bitcoin Community** for inspiring decentralized innovation

---

**Built with ❤️ for the Stacks ecosystem**

_Making Bitcoin payments as simple as traditional payments_
