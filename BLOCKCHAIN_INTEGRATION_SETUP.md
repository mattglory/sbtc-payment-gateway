# sBTC Payment Gateway - Blockchain Integration

Production-ready sBTC Payment Gateway with full Stacks blockchain integration.

## 🚀 Quick Setup

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend  
cd ../frontend
npm install

# SDK
cd ../sdk
npm install
```

### 2. Environment Configuration

Copy and configure environment files:

```bash
# Backend configuration
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your settings:

```env
# Essential settings for blockchain integration
NODE_ENV=development
STACKS_NETWORK=testnet
CONTRACT_ADDRESS=your_deployed_contract_address
DEPLOYER_PRIVATE_KEY=your_private_key
DEMO_MODE=false
```

### 3. Smart Contract Deployment

Deploy your smart contract to Stacks testnet:

```bash
cd contracts
clarinet integrate
```

Update `CONTRACT_ADDRESS` in your `.env` file with the deployed address.

### 4. Generate Stacks Keychain

If you don't have a private key:

```bash
npx @stacks/cli make_keychain
```

Use the generated private key in your `.env` file.

### 5. Start Services

```bash
# Terminal 1: Backend API
cd backend
npm run dev

# Terminal 2: Frontend Application  
cd frontend
npm start
```

## 🔧 Configuration Details

### Backend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `STACKS_NETWORK` | Blockchain network | `testnet` or `mainnet` |
| `CONTRACT_ADDRESS` | Your smart contract address | `ST1ABC...` |
| `DEPLOYER_PRIVATE_KEY` | Private key for transactions | `64-char hex string` |
| `DEMO_MODE` | Enable/disable demo mode | `false` for production |
| `API_KEYS` | Comma-separated API keys | `pk_live_key1,pk_test_key2` |

### Frontend Environment Variables

Create `frontend/.env`:

```env
# Frontend configuration
REACT_APP_STACKS_NETWORK=testnet
REACT_APP_CONTRACT_ADDRESS=your_contract_address
REACT_APP_API_URL=http://localhost:3001
```

## 🏗️ Architecture Changes

### New Service Architecture

```
├── StacksService (Core blockchain operations)
│   ├── Network initialization
│   ├── Transaction broadcasting
│   ├── Contract interactions
│   └── Status monitoring
├── PaymentService (Business logic with blockchain)
│   ├── Real payment processing
│   ├── Transaction monitoring
│   └── Status updates
├── MerchantService (Blockchain merchant management)
│   ├── On-chain registration
│   ├── Balance checking
│   └── Verification
└── ContractService (Smart contract interface)
    ├── Read-only function calls
    ├── Event monitoring
    └── Contract validation
```

### Frontend Wallet Integration

```
├── WalletService (Stacks Connect integration)
│   ├── Wallet connection
│   ├── Transaction signing
│   └── Balance management
├── useWallet (React hook)
│   ├── Connection state
│   ├── Payment processing
│   └── Error handling
└── PaymentWidget (UI component)
    ├── Wallet connection UI
    ├── Payment processing
    └── Transaction monitoring
```

## 🔍 Testing the Integration

### 1. Backend API Testing

Test real blockchain operations:

```bash
# Create payment intent (now creates on blockchain)
curl -X POST http://localhost:3001/api/payment-intents \
  -H "Authorization: Bearer pk_test_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50000,
    "description": "Test blockchain payment"
  }'

# Check blockchain status
curl -X GET http://localhost:3001/api/payment-intents/{payment_id}
```

### 2. Frontend Wallet Testing

1. Open the frontend application
2. Connect your Stacks wallet
3. Create a payment intent via API
4. Process payment through the PaymentWidget
5. Monitor transaction on Stacks Explorer

### 3. Contract Interaction Testing

```bash
# Test contract functions
curl -X GET http://localhost:3001/api/contracts/stats
curl -X GET http://localhost:3001/api/contracts/info
```

## 🔐 Security Considerations

### Private Key Management
- **Never** commit private keys to version control
- Use environment variables for all secrets
- Consider using hardware wallets for mainnet
- Rotate keys regularly

### Network Configuration
- Test thoroughly on testnet before mainnet
- Use different contracts for test/production
- Validate all transaction parameters
- Implement proper error handling

### API Security
- Generate secure API keys
- Implement rate limiting
- Validate all inputs
- Log security events

## 🐛 Troubleshooting

### Common Issues

1. **Transaction Failures**
   - Check account balance
   - Verify contract address
   - Validate function parameters
   - Monitor gas fees

2. **Wallet Connection Issues**
   - Clear browser cache
   - Check network settings
   - Verify wallet extension
   - Test with different browsers

3. **Contract Interaction Errors**
   - Verify contract deployment
   - Check function signatures
   - Validate parameter types
   - Test read-only functions first

### Debug Mode

Enable debug logging:

```env
LOG_LEVEL=debug
DEBUG=true
```

### Health Checks

Monitor system health:

```bash
curl http://localhost:3001/health
curl http://localhost:3001/health/detailed
```

## 📊 Monitoring and Logging

### Transaction Monitoring
- All transactions are monitored in real-time
- Status updates are logged with structured data
- Failed transactions trigger alerts
- Performance metrics are tracked

### Error Handling
- Blockchain-specific error types
- Retry logic for network issues
- Graceful degradation for service outages
- Comprehensive error logging

### Performance Tracking
- Transaction processing times
- API response times
- Blockchain confirmation times
- System resource usage

## 🚀 Production Deployment

### Pre-deployment Checklist

- [ ] Smart contract deployed and verified
- [ ] All environment variables configured
- [ ] Private keys securely managed
- [ ] Rate limiting configured
- [ ] CORS settings updated
- [ ] Monitoring systems enabled
- [ ] Backup procedures in place

### Mainnet Configuration

Update for production:

```env
NODE_ENV=production
STACKS_NETWORK=mainnet
CONTRACT_ADDRESS=SP_your_mainnet_contract
DEMO_MODE=false
```

### Scaling Considerations

- Implement database persistence
- Add Redis for caching
- Use load balancers for high availability
- Monitor blockchain network status
- Implement circuit breakers

## 📚 Additional Resources

- [Stacks Documentation](https://docs.stacks.co)
- [Clarity Smart Contract Guide](https://clarity-lang.org)
- [Stacks Connect Documentation](https://github.com/blockstack/connect)
- [Hiro Platform API](https://docs.hiro.so/api)

## 🔗 API Endpoints

### New Blockchain Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/blockchain/info` | Network and contract info |
| `POST` | `/api/blockchain/validate/{txId}` | Validate transaction |
| `GET` | `/api/contracts/stats` | Contract statistics |
| `GET` | `/api/contracts/events/{txId}` | Transaction events |

### Updated Endpoints

All payment endpoints now include blockchain integration:
- Real transaction IDs
- Blockchain status tracking
- Network-specific responses
- Enhanced error handling

---

**Your sBTC Payment Gateway is now fully integrated with the Stacks blockchain!**

All mock data and simulations have been replaced with real blockchain operations. Your system now processes actual Bitcoin transactions through the Stacks network.