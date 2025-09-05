/**
 * Basic Usage Example for sBTC Payment Gateway SDK
 * 
 * This example demonstrates the core functionality of the SDK:
 * - Creating payment intents
 * - Checking payment status
 * - Confirming payments
 */

import { SBTCPaymentGateway } from '../dist/index.esm.js';

// Initialize the client with your API key
const sbtc = new SBTCPaymentGateway({
  apiKey: 'pk_demo_123456789', // Use your actual API key
  baseUrl: 'https://sbtc-payment-api-production.up.railway.app',
});

async function basicUsageExample() {
  try {
    console.log('🚀 sBTC Payment Gateway SDK - Basic Usage Example\n');

    // 1. Check system health
    console.log('1. Checking system health...');
    const health = await sbtc.getHealth();
    console.log(`✅ System status: ${health.status}`);
    console.log(`🌐 Network: ${health.network}`);
    console.log(`🔑 Demo mode: ${health.apiKeySystem.demoMode ? 'Yes' : 'No'}\n`);

    // 2. Validate API key
    console.log('2. Validating API key...');
    const validation = await sbtc.validateApiKey();
    console.log(`✅ API key valid: ${validation.valid}`);
    console.log(`🏷️  API key type: ${validation.type}\n`);

    // 3. Create a payment intent
    console.log('3. Creating payment intent...');
    const paymentIntent = await sbtc.createPaymentIntent({
      amount: 100000, // 100,000 satoshis = 0.001 BTC
      description: 'Coffee purchase - Basic SDK Example',
    });
    
    console.log(`✅ Payment created!`);
    console.log(`💰 Amount: ${paymentIntent.amount} satoshis`);
    console.log(`🆔 Payment ID: ${paymentIntent.id}`);
    console.log(`📄 Description: ${paymentIntent.description}`);
    console.log(`⏰ Expires at: ${paymentIntent.expiresAt}`);
    console.log(`🔐 Client secret: ${paymentIntent.clientSecret}\n`);

    // 4. Get payment intent details
    console.log('4. Retrieving payment details...');
    const retrievedPayment = await sbtc.getPaymentIntent(paymentIntent.id);
    console.log(`✅ Retrieved payment status: ${retrievedPayment.status}`);
    console.log(`💸 Fee: ${retrievedPayment.fee} satoshis\n`);

    // 5. Simulate payment confirmation (in real app, customer would provide these)
    console.log('5. Simulating payment confirmation...');
    console.log('⚠️  In a real application, the customer would provide:');
    console.log('   - Their Stacks address');
    console.log('   - The transaction ID from their Bitcoin transaction\n');
    
    const mockCustomerAddress = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const mockTransactionId = 'a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890ab';
    
    console.log(`🏠 Customer address: ${mockCustomerAddress}`);
    console.log(`🔗 Transaction ID: ${mockTransactionId}`);
    
    try {
      const confirmation = await sbtc.confirmPayment(paymentIntent.id, {
        customerAddress: mockCustomerAddress,
        transactionId: mockTransactionId,
      });
      
      console.log(`✅ Payment confirmation attempted!`);
      console.log(`🎯 Status: ${confirmation.status}`);
      console.log(`💬 Message: ${confirmation.message}\n`);
    } catch (confirmError) {
      console.log(`⚠️  Payment confirmation failed (expected in demo): ${confirmError.message}\n`);
    }

    // 6. Final status check
    console.log('6. Final status check...');
    const finalStatus = await sbtc.getPaymentIntent(paymentIntent.id);
    console.log(`🏁 Final payment status: ${finalStatus.status}`);
    
    if (finalStatus.customerAddress) {
      console.log(`👤 Customer: ${finalStatus.customerAddress}`);
    }
    
    if (finalStatus.transactionId) {
      console.log(`🔗 Transaction: ${finalStatus.transactionId}`);
    }

    console.log('\n🎉 Basic usage example completed successfully!');

  } catch (error) {
    console.error('❌ Error in basic usage example:', error.message);
    
    if (error.code) {
      console.error(`🔧 Error code: ${error.code}`);
    }
    
    if (error.hint) {
      console.error(`💡 Hint: ${error.hint}`);
    }
  }
}

// Run the example
basicUsageExample().catch(console.error);

export { basicUsageExample };