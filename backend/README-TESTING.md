# sBTC Payment Gateway - Integration Testing Guide

## 🧪 Complete End-to-End Testing Suite

This testing suite validates the complete payment flow from API → PostgreSQL → Stacks Smart Contract integration.

## 🚀 Quick Start

### Prerequisites
1. **PostgreSQL** running locally or accessible remotely
2. **Node.js** 18+ installed
3. **Environment configured** (copy `.env.example` to `.env`)

### Run Tests

```bash
# Quick integration test (recommended first run)
npm run test:quick

# Full end-to-end test suite with Jest
npm run test:e2e

# Initialize database if needed
npm run db:init
```

## 📋 Test Coverage

### 1. Payment Intent Creation & Database Storage ✅
- Creates payment intent via API
- Verifies PostgreSQL storage
- Checks fee calculation (2.5%)
- Validates audit trail logging

### 2. Smart Contract Integration ✅
- Initiates Stacks blockchain transactions
- Validates customer address format
- Tests contract function calls
- Handles testnet connectivity issues gracefully

### 3. Database Status Updates ✅
- Tracks payment status transitions
- Updates blockchain transaction IDs
- Monitors confirmation status
- Logs completion timestamps

### 4. Error Scenarios & Edge Cases ✅
- Inactive merchant rejection
- Invalid payment amounts
- Expired payment handling
- Non-existent payment confirmation
- Duplicate payment ID prevention

### 5. Payment Statistics & Analytics ✅
- Generates merchant statistics
- Calculates success rates
- Tracks total volume and fees
- Provides payment history with pagination

### 6. Database Connection & Health ✅
- Connection pool management
- Transaction rollback testing
- Health check validation
- Graceful shutdown handling

## 🔧 Test Scripts

### `npm run test:quick`
**Fast standalone integration test (~30 seconds)**
- No Jest dependency
- Direct service testing
- Real database operations
- Immediate feedback
- Perfect for development

```bash
🚀 sBTC Payment Gateway - Quick Integration Test
====================================================
1️⃣ Initializing Database Connection...
✅ Database connected (15ms)
2️⃣ Initializing Services...
✅ Stacks Service initialized (testnet)
3️⃣ Creating Test Merchant...
✅ Test merchant created: test-merchant-1702845678901
4️⃣ Testing Payment Intent Creation...
✅ Payment intent created: pi_abc123...
...
🎉 Integration Test Results
============================
✅ Database Connection: Working
✅ Payment Creation: Working
✅ Database Storage: Working
🚀 System Ready for Production!
```

### `npm run test:e2e`
**Comprehensive Jest test suite (~2-3 minutes)**
- Full test coverage
- Detailed error reporting
- Professional test structure
- CI/CD ready
- Parallel test execution

```bash
🔍 Checking Prerequisites...
✅ Environment configuration found
✅ PostgreSQL connection successful
✅ Database schema exists

🧪 Running Integration Tests...
 PASS  tests/e2e-integration.test.js
  sBTC Payment Gateway - Complete Integration Tests
    ✓ Should create payment intent via API and store in database
    ✓ Should verify payment is stored correctly in PostgreSQL
    ✓ Should have created payment event in audit trail
    ✓ Should confirm payment and initiate blockchain transaction
    ✓ Should update database with blockchain transaction ID
    ...

📋 Test Report
══════════════════════════════════════════════════
⏱️  Duration: 45.32s
✅ Passed: 23
❌ Failed: 0
📊 Total: 23
🎯 Success Rate: 100%
```

## 🧪 Test Scenarios Covered

### Happy Path
1. **Create Payment Intent**
   ```
   POST /api/payment-intents
   {
     "merchantId": "test-merchant",
     "amount": 100000,
     "description": "Test Payment"
   }
   ```

2. **Confirm Payment**
   ```
   POST /api/payment-intents/{id}/confirm
   {
     "customerAddress": "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5",
     "transactionId": "customer-tx-123"
   }
   ```

3. **Track Status**
   ```
   GET /api/payment-intents/{id}
   ```

### Error Cases
- ❌ Invalid merchant ID
- ❌ Negative payment amounts
- ❌ Expired payment confirmation
- ❌ Invalid Stacks addresses
- ❌ Duplicate payment IDs
- ❌ Inactive merchant accounts

### Database Operations
- ✅ ACID transaction compliance
- ✅ Connection pool management
- ✅ Audit trail completeness
- ✅ Index performance
- ✅ Constraint validation

### Blockchain Integration
- ✅ Contract function calls
- ✅ Transaction broadcasting
- ✅ Status monitoring
- ✅ Error handling for network issues
- ✅ Testnet/mainnet configuration

## 📊 Expected Results

### Development Environment
```
✅ Database Connection: Working (< 50ms response time)
✅ Payment Creation: Working (includes blockchain TX)
✅ Database Storage: Working (ACID compliance)
✅ Payment Retrieval: Working (with real-time status)
✅ Error Handling: Working (graceful degradation)
✅ Statistics: Working (accurate calculations)
✅ Merchant Operations: Working (with pagination)
```

### Production Readiness Indicators
- 🟢 **100% test pass rate**
- 🟢 **< 100ms database response times**
- 🟢 **Successful blockchain integration**
- 🟢 **Proper error handling**
- 🟢 **Complete audit trail**

## 🚨 Troubleshooting

### Database Connection Issues
```bash
❌ PostgreSQL connection failed: connection refused
```
**Solution:** Ensure PostgreSQL is running and database exists
```bash
# Create database
createdb sbtc_gateway

# Initialize schema
npm run db:init
```

### Environment Configuration
```bash
❌ Missing environment variables: DB_PASSWORD, CONTRACT_ADDRESS
```
**Solution:** Copy and configure environment file
```bash
cp .env.example .env
# Edit .env with your values
```

### Stacks Network Issues
```bash
⚠️ No blockchain transaction (testnet may be down)
```
**Solution:** This is expected when Stacks testnet is unavailable. Tests will continue with database-only operations.

### Test Data Conflicts
```bash
❌ Payment ID already exists
```
**Solution:** Tests automatically clean up, but you can manually reset:
```bash
npm run db:reset
```

## 🔧 Customizing Tests

### Add Custom Test Scenarios
Edit `tests/e2e-integration.test.js`:

```javascript
test('Should handle my custom scenario', async () => {
  // Your test logic here
  const result = await paymentService.customOperation();
  expect(result).toBeDefined();
});
```

### Environment-Specific Testing
```bash
# Test against staging database
NODE_ENV=staging npm run test:e2e

# Test with mainnet configuration
STACKS_NETWORK=mainnet npm run test:quick
```

## 🎯 Integration with BFF Application

Once all tests pass, your system is ready for Bitcoin integration:

1. **✅ PostgreSQL persistence** - No data loss on restarts
2. **✅ Stacks smart contracts** - Blockchain integration working
3. **✅ Error handling** - Robust production behavior
4. **✅ Performance** - Optimized database queries
5. **✅ Audit trail** - Complete compliance logging

Your sBTC Payment Gateway is **startup funding application ready**! 🚀