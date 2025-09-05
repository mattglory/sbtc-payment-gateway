# sBTC Payment Gateway SDK

**"Stripe for Bitcoin"** - JavaScript/TypeScript SDK for the sBTC Payment Gateway

The sBTC Payment Gateway SDK provides a simple, powerful way to integrate Bitcoin payments using Stacks' sBTC into your applications. Just like Stripe made traditional payments simple, we make Bitcoin payments effortless.

## 🚀 Quick Start

### Installation

```bash
npm install @sbtc/payment-gateway-sdk
```

### Basic Usage

```typescript
import { SBTCPaymentGateway } from '@sbtc/payment-gateway-sdk';

// Initialize the client
const sbtc = new SBTCPaymentGateway({
  apiKey: 'your-api-key-here',
  // baseUrl: 'https://your-custom-endpoint.com', // Optional
});

// Create a payment intent
const paymentIntent = await sbtc.createPaymentIntent({
  amount: 100000, // 100,000 satoshis = 0.001 BTC
  description: 'Coffee purchase',
});

console.log('Payment ID:', paymentIntent.id);
console.log('Client Secret:', paymentIntent.clientSecret);
```

## 📖 Documentation

### Client Configuration

```typescript
const sbtc = new SBTCPaymentGateway({
  apiKey: 'pk_test_...',           // Your API key
  baseUrl?: 'https://...',         // Custom API endpoint (optional)
  timeout?: 30000,                 // Request timeout in ms (default: 30000)
  retries?: 3,                     // Number of retries (default: 3)
});
```

### Payment Operations

#### Create Payment Intent

```typescript
const payment = await sbtc.createPaymentIntent({
  amount: 50000,                   // Amount in satoshis
  description: 'Product purchase', // Optional description
  currency: 'BTC',                 // Optional (default: BTC)
});
```

#### Get Payment Details

```typescript
const payment = await sbtc.getPaymentIntent('pi_1234567890');
```

#### Confirm Payment

```typescript
const result = await sbtc.confirmPayment('pi_1234567890', {
  customerAddress: 'SP2H8PY27SEZ03MWRKS5XABZYQN17ETGQS3527SA5',
  transactionId: 'a1b2c3d4e5f6789...',
});
```

### Merchant Operations

#### Register New Merchant

```typescript
const registration = await sbtc.registerMerchant({
  businessName: 'My Coffee Shop',
  email: 'owner@mycoffeeshop.com',
  stacksAddress: 'SP2H8PY27SEZ03MWRKS5XABZYQN17ETGQS3527SA5',
});

console.log('API Key:', registration.apiKey);
console.log('Secret Key:', registration.secretKey);
```

#### Get Dashboard Stats

```typescript
const stats = await sbtc.getDashboard();

console.log('Total processed:', stats.totalProcessed);
console.log('Successful payments:', stats.successfulPayments);
console.log('Recent payments:', stats.recentPayments);
```

### Utilities

The SDK includes helpful utility functions:

```typescript
import { 
  formatSatoshiAmount, 
  isValidStacksAddress, 
  calculateFee,
  formatPaymentStatus 
} from '@sbtc/payment-gateway-sdk';

// Format amounts
const formatted = formatSatoshiAmount(100000);
console.log(formatted.formatted); // "100,000 sats (0.00100000 BTC)"

// Validate addresses
const isValid = isValidStacksAddress('SP2H8PY27SEZ03MWRKS5XABZYQN17ETGQS3527SA5');

// Calculate fees
const feeInfo = calculateFee(100000, 1.0); // 1% fee
console.log(`Fee: ${feeInfo.fee} sats`);

// Format status
const status = formatPaymentStatus('requires_payment_method');
console.log(status); // "Awaiting Payment"
```

## ⚛️ React Integration

The SDK includes optional React hooks for easier frontend integration:

### usePaymentIntent Hook

```typescript
import { usePaymentIntent } from '@sbtc/payment-gateway-sdk';

function PaymentComponent() {
  const { paymentIntent, loading, error, createPaymentIntent, confirmPayment } = 
    usePaymentIntent(sbtc);

  const handleCreatePayment = async () => {
    await createPaymentIntent(50000, 'Coffee purchase');
  };

  const handleConfirmPayment = async () => {
    await confirmPayment(
      'SP2H8PY27SEZ03MWRKS5XABZYQN17ETGQS3527SA5',
      'transaction-id-here'
    );
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {!paymentIntent && (
        <button onClick={handleCreatePayment}>
          Create Payment
        </button>
      )}
      
      {paymentIntent && paymentIntent.status === 'requires_payment_method' && (
        <div>
          <p>Payment Amount: {paymentIntent.amount} sats</p>
          <p>Payment ID: {paymentIntent.id}</p>
          <button onClick={handleConfirmPayment}>
            Confirm Payment
          </button>
        </div>
      )}
    </div>
  );
}
```

### usePaymentStatus Hook

```typescript
import { usePaymentStatus } from '@sbtc/payment-gateway-sdk';

function PaymentStatus({ paymentId }: { paymentId: string }) {
  const { 
    status, 
    isComplete, 
    isFailed, 
    isExpired, 
    paymentIntent 
  } = usePaymentStatus(sbtc, paymentId, 5000); // Poll every 5 seconds

  return (
    <div>
      <p>Status: {status}</p>
      {isComplete && <p>✅ Payment successful!</p>}
      {isFailed && <p>❌ Payment failed</p>}
      {isExpired && <p>⏰ Payment expired</p>}
    </div>
  );
}
```

### useMerchantDashboard Hook

```typescript
import { useMerchantDashboard } from '@sbtc/payment-gateway-sdk';

function Dashboard() {
  const { dashboard, loading, error, refetch } = 
    useMerchantDashboard(sbtc, 30000); // Refresh every 30 seconds

  if (loading) return <div>Loading dashboard...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Merchant Dashboard</h2>
      <p>Total Processed: {dashboard?.totalProcessed} sats</p>
      <p>Total Payments: {dashboard?.paymentsCount}</p>
      <p>Successful Payments: {dashboard?.successfulPayments}</p>
      
      <h3>Recent Payments</h3>
      {dashboard?.recentPayments.map(payment => (
        <div key={payment.id}>
          {payment.amount} sats - {payment.status}
        </div>
      ))}
    </div>
  );
}
```

### usePaymentTimer Hook

```typescript
import { usePaymentTimer } from '@sbtc/payment-gateway-sdk';

function PaymentTimer({ paymentIntent }: { paymentIntent: PaymentIntent }) {
  const { minutes, seconds, isExpired } = usePaymentTimer(
    paymentIntent.expiresAt,
    () => console.log('Payment expired!')
  );

  if (isExpired) {
    return <div>⏰ Payment expired</div>;
  }

  return (
    <div>
      Time remaining: {minutes}:{seconds.toString().padStart(2, '0')}
    </div>
  );
}
```

## 🔧 Error Handling

The SDK provides comprehensive error handling:

```typescript
import { 
  SBTCError, 
  SBTCApiError, 
  SBTCNetworkError, 
  SBTCValidationError 
} from '@sbtc/payment-gateway-sdk';

try {
  const payment = await sbtc.createPaymentIntent({ amount: -100 });
} catch (error) {
  if (error instanceof SBTCValidationError) {
    console.log('Validation error:', error.message);
    console.log('Field:', error.field);
    console.log('Value:', error.value);
  } else if (error instanceof SBTCApiError) {
    console.log('API error:', error.message);
    console.log('Status:', error.status);
    console.log('Request ID:', error.requestId);
  } else if (error instanceof SBTCNetworkError) {
    console.log('Network error:', error.message);
  }
}
```

## 🛠️ Development

### Environment Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Build the SDK: `npm run build`
4. Run tests: `npm test`
5. Lint code: `npm run lint`

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

### Building

```bash
# Build for production
npm run build

# Build and watch for changes
npm run build:watch
```

## 🔑 API Key Management

### Getting API Keys

1. Register as a merchant using the SDK:
   ```typescript
   const registration = await sbtc.registerMerchant({
     businessName: 'Your Business',
     email: 'your@email.com',
     stacksAddress: 'your-stacks-address',
   });
   ```

2. Use the returned API key in your applications

### Validating API Keys

```typescript
// Validate current API key
const validation = await sbtc.validateApiKey();

// Validate specific API key
const validation = await sbtc.validateSpecificApiKey('pk_test_...');

console.log('Valid:', validation.valid);
console.log('Type:', validation.type); // 'demo', 'test', 'live'
```

## 🌍 Network Support

The SDK supports both Stacks mainnet and testnet:

- **Mainnet**: Production environment with real Bitcoin
- **Testnet**: Development environment with test Bitcoin

The network is automatically detected based on your API key and configuration.

## 📊 Payment Status Flow

```
requires_payment_method → processing → succeeded
                                   → payment_failed
                                   → expired
```

- `requires_payment_method`: Payment created, waiting for customer
- `processing`: Customer submitted transaction, being processed
- `succeeded`: Payment completed successfully
- `payment_failed`: Payment failed (insufficient funds, invalid transaction, etc.)
- `expired`: Payment expired before completion

## 🚨 Security Best Practices

1. **Never expose API keys in client-side code**
2. **Use environment variables for API keys**
3. **Validate all inputs before sending to the API**
4. **Implement proper error handling**
5. **Use HTTPS for all API communications**

## 🔗 Resources

- [sBTC Documentation](https://docs.stacks.co/stacks-101/sbtc)
- [Stacks Explorer](https://explorer.stacks.co)
- [GitHub Repository](https://github.com/mattglory/sbtc-payment-gateway)

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Support

- **Developer**: Matt Glory
- **📧 Email**: mattglory14@gmail.com
- **🌍 Location**: Birmingham, UK
- **🐛 Issues**: [GitHub Issues](https://github.com/mattglory/sbtc-payment-gateway/issues)
- **💻 Live Demo**: [Try it now](https://sbtcpaymentgateway-matt-glorys-projects.vercel.app)

---

**Built with ❤️ for the Bitcoin and Stacks ecosystem**