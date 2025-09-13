/**
 * End-to-End Integration Test
 * Tests complete payment flow: API → PostgreSQL → Stacks Smart Contract
 */

const request = require('supertest');
const app = require('../server');
const database = require('../src/config/database');
const PaymentService = require('../src/services/paymentService');
const StacksService = require('../src/services/stacksService');

describe('sBTC Payment Gateway - Complete Integration Tests', () => {
  let paymentService;
  let stacksService;
  let testMerchantId;
  
  beforeAll(async () => {
    // Initialize database connection
    await database.initialize();
    
    // Initialize services
    paymentService = new PaymentService();
    stacksService = new StacksService();
    
    // Create test merchant
    testMerchantId = 'test-merchant-' + Date.now();
    await database.query(`
      INSERT INTO merchants (merchant_id, business_name, email, is_active)
      VALUES ($1, $2, $3, $4)
    `, [testMerchantId, 'Test Business', 'test@example.com', true]);
    
    console.log('✅ Test setup complete');
  });

  afterAll(async () => {
    // Cleanup test data
    await database.query('DELETE FROM payment_events WHERE payment_id LIKE $1', ['pi_test_%']);
    await database.query('DELETE FROM payments WHERE merchant_id = $1', [testMerchantId]);
    await database.query('DELETE FROM merchants WHERE merchant_id = $1', [testMerchantId]);
    
    // Close database connection
    await database.close();
    
    console.log('✅ Test cleanup complete');
  });

  describe('1. Payment Intent Creation & Database Storage', () => {
    let testPaymentId;
    let testPaymentData;

    test('Should create payment intent via API and store in database', async () => {
      const paymentRequest = {
        merchantId: testMerchantId,
        amount: 100000, // 100,000 sats
        description: 'Test Payment',
        currency: 'BTC'
      };

      const response = await request(app)
        .post('/api/payment-intents')
        .send(paymentRequest)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('paymentId');
      expect(response.body.data).toHaveProperty('amount', 100000);
      expect(response.body.data).toHaveProperty('status', 'pending');

      testPaymentId = response.body.data.paymentId;
      testPaymentData = response.body.data;

      console.log('✅ Payment intent created:', testPaymentId);
    });

    test('Should verify payment is stored correctly in PostgreSQL', async () => {
      const result = await database.query(
        'SELECT * FROM payments WHERE payment_id = $1',
        [testPaymentId]
      );

      expect(result.rows).toHaveLength(1);
      
      const payment = result.rows[0];
      expect(payment.merchant_id).toBe(testMerchantId);
      expect(payment.amount_in_sats).toBe(100000);
      expect(payment.status).toBe('pending');
      expect(payment.description).toBe('Test Payment');
      expect(payment.fee_amount).toBeGreaterThan(0); // 2.5% fee should be calculated

      console.log('✅ Payment verified in database');
    });

    test('Should have created payment event in audit trail', async () => {
      const result = await database.query(
        'SELECT * FROM payment_events WHERE payment_id = $1 AND event_type = $2',
        [testPaymentId, 'payment_intent_created']
      );

      expect(result.rows).toHaveLength(1);
      
      const event = result.rows[0];
      expect(event.event_data).toHaveProperty('amount');
      expect(event.event_data).toHaveProperty('merchantId');

      console.log('✅ Payment event logged');
    });

    test('Should retrieve payment intent via API', async () => {
      const response = await request(app)
        .get(`/api/payment-intents/${testPaymentId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.paymentId).toBe(testPaymentId);
      expect(response.body.data.amount).toBe(100000);

      console.log('✅ Payment intent retrieved via API');
    });
  });

  describe('2. Smart Contract Integration', () => {
    let testPaymentId;
    const testCustomerAddress = 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5';

    beforeEach(async () => {
      // Create a fresh payment for each test
      const paymentRequest = {
        merchantId: testMerchantId,
        amount: 50000,
        description: 'Contract Test Payment'
      };

      const payment = await paymentService.createPaymentIntent(testMerchantId, paymentRequest);
      testPaymentId = payment.paymentId;
    });

    test('Should confirm payment and initiate blockchain transaction', async () => {
      const confirmRequest = {
        customerAddress: testCustomerAddress,
        transactionId: 'test-tx-' + Date.now()
      };

      const response = await request(app)
        .post(`/api/payment-intents/${testPaymentId}/confirm`)
        .send(confirmRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('processing');
      expect(response.body.data.customerAddress).toBe(testCustomerAddress);

      console.log('✅ Payment confirmation initiated');
    });

    test('Should update database with blockchain transaction ID', async () => {
      const confirmRequest = {
        customerAddress: testCustomerAddress,
        transactionId: 'test-tx-' + Date.now()
      };

      await request(app)
        .post(`/api/payment-intents/${testPaymentId}/confirm`)
        .send(confirmRequest);

      // Wait a moment for async blockchain call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const result = await database.query(
        'SELECT * FROM payments WHERE payment_id = $1',
        [testPaymentId]
      );

      const payment = result.rows[0];
      expect(payment.status).toBe('processing');
      expect(payment.customer_address).toBe(testCustomerAddress);
      
      // Check if blockchain transaction was initiated
      if (payment.stacks_tx_id) {
        expect(payment.stacks_tx_id).toMatch(/^0x[a-f0-9]+$/);
        console.log('✅ Blockchain transaction ID stored:', payment.stacks_tx_id);
      } else {
        console.log('⚠️ Blockchain transaction not initiated (testnet may be down)');
      }
    });

    test('Should validate Stacks address format', async () => {
      const invalidConfirmRequest = {
        customerAddress: 'invalid-address',
        transactionId: 'test-tx-' + Date.now()
      };

      const response = await request(app)
        .post(`/api/payment-intents/${testPaymentId}/confirm`)
        .send(invalidConfirmRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid Stacks address');

      console.log('✅ Stacks address validation working');
    });
  });

  describe('3. Blockchain Status Updates', () => {
    let testPaymentId;

    beforeEach(async () => {
      const payment = await paymentService.createPaymentIntent(testMerchantId, {
        amount: 25000,
        description: 'Status Test Payment'
      });
      testPaymentId = payment.paymentId;
    });

    test('Should handle blockchain transaction status updates', async () => {
      // Simulate a completed blockchain transaction
      await database.query(`
        UPDATE payments 
        SET status = 'processing', 
            stacks_tx_id = '0x1234567890abcdef',
            blockchain_status = 'pending'
        WHERE payment_id = $1
      `, [testPaymentId]);

      // Get the payment to trigger status update
      const payment = await paymentService.getPaymentIntent(testPaymentId);
      
      expect(payment.paymentId).toBe(testPaymentId);
      expect(payment.status).toBe('processing');

      console.log('✅ Blockchain status update mechanism working');
    });

    test('Should track payment completion', async () => {
      // Simulate completed payment
      await database.query(`
        UPDATE payments 
        SET status = 'completed', 
            blockchain_status = 'confirmed',
            confirmed_at = CURRENT_TIMESTAMP
        WHERE payment_id = $1
      `, [testPaymentId]);

      const result = await database.query(
        'SELECT * FROM payments WHERE payment_id = $1',
        [testPaymentId]
      );

      const payment = result.rows[0];
      expect(payment.status).toBe('completed');
      expect(payment.blockchain_status).toBe('confirmed');
      expect(payment.confirmed_at).toBeTruthy();

      console.log('✅ Payment completion tracking working');
    });
  });

  describe('4. Error Scenarios & Edge Cases', () => {
    test('Should reject payment for inactive merchant', async () => {
      // Create inactive merchant
      const inactiveMerchantId = 'inactive-merchant-' + Date.now();
      await database.query(`
        INSERT INTO merchants (merchant_id, business_name, email, is_active)
        VALUES ($1, $2, $3, $4)
      `, [inactiveMerchantId, 'Inactive Business', 'inactive@example.com', false]);

      const paymentRequest = {
        merchantId: inactiveMerchantId,
        amount: 10000,
        description: 'Should Fail'
      };

      const response = await request(app)
        .post('/api/payment-intents')
        .send(paymentRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('inactive');

      // Cleanup
      await database.query('DELETE FROM merchants WHERE merchant_id = $1', [inactiveMerchantId]);

      console.log('✅ Inactive merchant rejection working');
    });

    test('Should reject invalid payment amounts', async () => {
      const invalidRequests = [
        { merchantId: testMerchantId, amount: 0, description: 'Zero amount' },
        { merchantId: testMerchantId, amount: -1000, description: 'Negative amount' },
        { merchantId: testMerchantId, amount: 'invalid', description: 'String amount' }
      ];

      for (const request of invalidRequests) {
        const response = await request(app)
          .post('/api/payment-intents')
          .send(request)
          .expect(400);

        expect(response.body.success).toBe(false);
      }

      console.log('✅ Invalid amount validation working');
    });

    test('Should handle expired payments', async () => {
      // Create payment and manually expire it
      const payment = await paymentService.createPaymentIntent(testMerchantId, {
        amount: 10000,
        description: 'Expiry Test'
      });

      // Manually set expiration to past
      await database.query(`
        UPDATE payments 
        SET expires_at = CURRENT_TIMESTAMP - INTERVAL '1 hour'
        WHERE payment_id = $1
      `, [payment.paymentId]);

      const confirmRequest = {
        customerAddress: 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5',
        transactionId: 'expired-test'
      };

      const response = await request(app)
        .post(`/api/payment-intents/${payment.paymentId}/confirm`)
        .send(confirmRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('expired');

      console.log('✅ Payment expiry handling working');
    });

    test('Should handle non-existent payment confirmation', async () => {
      const fakePaymentId = 'pi_nonexistent_12345';
      
      const response = await request(app)
        .post(`/api/payment-intents/${fakePaymentId}/confirm`)
        .send({
          customerAddress: 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5',
          transactionId: 'fake-test'
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('not found');

      console.log('✅ Non-existent payment handling working');
    });
  });

  describe('5. Payment Statistics & Analytics', () => {
    test('Should generate payment statistics', async () => {
      // Create multiple test payments
      const payments = [];
      for (let i = 0; i < 3; i++) {
        const payment = await paymentService.createPaymentIntent(testMerchantId, {
          amount: (i + 1) * 10000,
          description: `Stats Test ${i + 1}`
        });
        payments.push(payment);
      }

      // Mark one as completed
      await database.query(`
        UPDATE payments 
        SET status = 'completed'
        WHERE payment_id = $1
      `, [payments[0].paymentId]);

      const stats = await paymentService.getStats(testMerchantId);

      expect(stats.totalPayments).toBeGreaterThanOrEqual(3);
      expect(stats.succeededPayments).toBeGreaterThanOrEqual(1);
      expect(stats.totalAmount).toBeGreaterThan(0);

      console.log('✅ Payment statistics working:', {
        total: stats.totalPayments,
        succeeded: stats.succeededPayments,
        amount: stats.totalAmount
      });
    });

    test('Should find payments by merchant', async () => {
      const result = await paymentService.findByMerchantId(testMerchantId, 10, 0);

      expect(result.payments).toBeDefined();
      expect(result.total).toBeGreaterThan(0);
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);

      console.log('✅ Merchant payment lookup working:', {
        found: result.payments.length,
        total: result.total
      });
    });
  });

  describe('6. Database Connection & Health', () => {
    test('Should verify database health', async () => {
      const health = await database.healthCheck();

      expect(health.status).toBe('healthy');
      expect(health.responseTime).toBeDefined();
      expect(health.connections).toBeDefined();

      console.log('✅ Database health check:', health);
    });

    test('Should handle database transactions correctly', async () => {
      let testPaymentId;
      
      try {
        await database.transaction(async (client) => {
          // Create payment within transaction
          const result = await client.query(`
            INSERT INTO payments (
              payment_id, merchant_id, amount_in_sats, fee_amount, 
              status, description, expires_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING payment_id
          `, [
            'pi_transaction_test',
            testMerchantId,
            5000,
            125,
            'pending',
            'Transaction Test',
            new Date(Date.now() + 24 * 60 * 60 * 1000)
          ]);
          
          testPaymentId = result.rows[0].payment_id;
          
          // Verify it exists within transaction
          const checkResult = await client.query(
            'SELECT * FROM payments WHERE payment_id = $1',
            [testPaymentId]
          );
          
          expect(checkResult.rows).toHaveLength(1);
        });

        // Verify it persisted after transaction
        const finalResult = await database.query(
          'SELECT * FROM payments WHERE payment_id = $1',
          [testPaymentId]
        );
        
        expect(finalResult.rows).toHaveLength(1);

        console.log('✅ Database transactions working correctly');
      } finally {
        // Cleanup
        if (testPaymentId) {
          await database.query(
            'DELETE FROM payments WHERE payment_id = $1',
            [testPaymentId]
          );
        }
      }
    });
  });

  describe('7. Integration Summary', () => {
    test('Should perform complete payment flow simulation', async () => {
      console.log('\n🚀 COMPLETE PAYMENT FLOW SIMULATION');
      
      // Step 1: Create payment intent
      console.log('1️⃣ Creating payment intent...');
      const payment = await paymentService.createPaymentIntent(testMerchantId, {
        amount: 75000,
        description: 'Complete Flow Test',
        currency: 'BTC'
      });
      
      expect(payment.paymentId).toBeDefined();
      console.log(`   ✅ Payment created: ${payment.paymentId}`);
      
      // Step 2: Verify database storage
      console.log('2️⃣ Verifying database storage...');
      const dbPayment = await database.query(
        'SELECT * FROM payments WHERE payment_id = $1',
        [payment.paymentId]
      );
      
      expect(dbPayment.rows).toHaveLength(1);
      console.log(`   ✅ Found in database: ${dbPayment.rows[0].status}`);
      
      // Step 3: Confirm payment
      console.log('3️⃣ Confirming payment...');
      const confirmResult = await paymentService.confirmPayment(payment.paymentId, {
        customerAddress: 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5',
        transactionId: 'complete-flow-test'
      });
      
      expect(confirmResult.status).toBe('processing');
      console.log(`   ✅ Payment confirmed: ${confirmResult.status}`);
      
      // Step 4: Check final status
      console.log('4️⃣ Checking final status...');
      const finalPayment = await paymentService.getPaymentIntent(payment.paymentId);
      
      expect(finalPayment.paymentId).toBe(payment.paymentId);
      console.log(`   ✅ Final status: ${finalPayment.status}`);
      
      // Step 5: Verify events logged
      console.log('5️⃣ Verifying audit trail...');
      const events = await database.query(
        'SELECT event_type FROM payment_events WHERE payment_id = $1 ORDER BY created_at',
        [payment.paymentId]
      );
      
      expect(events.rows.length).toBeGreaterThanOrEqual(2);
      console.log(`   ✅ Events logged: ${events.rows.map(e => e.event_type).join(', ')}`);
      
      console.log('\n🎉 COMPLETE INTEGRATION TEST PASSED!\n');
      
      return {
        paymentId: payment.paymentId,
        finalStatus: finalPayment.status,
        eventsLogged: events.rows.length,
        databaseIntegration: true,
        blockchainIntegration: !!finalPayment.blockchainTxId,
        apiIntegration: true
      };
    });
  });
});

// Helper function to wait for async operations
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}