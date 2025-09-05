# sBTC Payment Gateway SDK Examples

This directory contains example code demonstrating how to use the sBTC Payment Gateway SDK.

## Examples

### 1. Basic Usage (`basic-usage.js`)

Demonstrates the core SDK functionality:
- ✅ System health checks
- ✅ API key validation  
- ✅ Creating payment intents
- ✅ Retrieving payment details
- ✅ Payment confirmation (simulated)

**Run it:**
```bash
node examples/basic-usage.js
```

### 2. Merchant Management (`merchant-example.js`)

Shows merchant-specific features:
- ✅ Merchant registration (simulated)
- ✅ Dashboard statistics
- ✅ API key management
- ✅ Error handling demonstration

**Run it:**
```bash
node examples/merchant-example.js
```

### 3. React Integration (`react-example.tsx`)

React/TypeScript example showing:
- ✅ `usePaymentIntent` hook
- ✅ `usePaymentStatus` hook with auto-refresh
- ✅ `useMerchantDashboard` hook
- ✅ `usePaymentTimer` hook
- ✅ Complete payment flow UI

**Usage:**
```bash
# This is a TypeScript React component
# Copy into your React project and import:
import { App } from './react-example';
```

## Getting Started

1. **Install the SDK:**
   ```bash
   npm install @sbtc/payment-gateway-sdk
   ```

2. **Get your API key:**
   - Register as a merchant using the SDK
   - Or use demo keys for testing

3. **Initialize the client:**
   ```javascript
   import { SBTCPaymentGateway } from '@sbtc/payment-gateway-sdk';
   
   const sbtc = new SBTCPaymentGateway({
     apiKey: 'your-api-key-here'
   });
   ```

## Demo API Keys

The examples use demo API keys that work with the test environment:
- `pk_demo_123456789`
- `pk_demo_merchant_example`
- `pk_demo_react_example`

## Expected Behavior

**✅ Working features:**
- System health checks
- API key validation
- Payment intent creation
- Payment retrieval
- Dashboard statistics (with proper API keys)

**⚠️ Demo limitations:**
- Payment confirmation requires real transaction data
- Merchant registration needs real details
- Some endpoints require production API keys

## Error Handling

All examples include comprehensive error handling:

```javascript
try {
  const payment = await sbtc.createPaymentIntent({
    amount: 100000,
    description: 'Test payment'
  });
  console.log('Success:', payment);
} catch (error) {
  if (error instanceof SBTCValidationError) {
    console.log('Validation error:', error.field, error.value);
  } else if (error instanceof SBTCApiError) {
    console.log('API error:', error.status, error.message);
  }
}
```

## Next Steps

1. **Get production API keys** by registering as a merchant
2. **Set up webhooks** for payment status updates  
3. **Implement proper logging** for production use
4. **Test with small amounts** before going live
5. **Review security best practices** in the main README

## Support

- 📖 [Full Documentation](../README.md)
- 🐛 [Report Issues](https://github.com/your-username/sbtc-payment-gateway/issues)
- 💬 [Join Discord](https://discord.gg/your-invite)

---

**Ready to accept Bitcoin payments? Let's go! 🚀**