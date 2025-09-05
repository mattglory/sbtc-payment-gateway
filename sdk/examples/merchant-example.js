/**
 * Merchant Management Example for sBTC Payment Gateway SDK
 * 
 * This example demonstrates merchant-specific functionality:
 * - Merchant registration
 * - Dashboard statistics
 * - API key management
 */

import { SBTCPaymentGateway, formatSatoshiAmount, formatDate } from '../dist/index.esm.js';

async function merchantExample() {
  try {
    console.log('🏪 sBTC Payment Gateway SDK - Merchant Example\n');

    // For demo purposes, we'll use a demo API key first
    let sbtc = new SBTCPaymentGateway({
      apiKey: 'pk_demo_merchant_example',
      baseUrl: 'https://sbtc-payment-api-production.up.railway.app',
    });

    // 1. System health check
    console.log('1. Checking system health...');
    const health = await sbtc.getHealth();
    console.log(`✅ System: ${health.status}`);
    console.log(`🔑 Demo keys available: ${health.apiKeySystem.demoKeysAvailable ? 'Yes' : 'No'}`);
    
    if (health.apiKeySystem.demoKeys && health.apiKeySystem.demoKeys.length > 0) {
      console.log(`🎯 Available demo keys: ${health.apiKeySystem.demoKeys.join(', ')}`);
    }
    console.log();

    // 2. Merchant registration (simulation)
    console.log('2. Merchant registration example...');
    console.log('⚠️  In production, this would create a real merchant account\n');
    
    const mockRegistration = {
      businessName: 'Coffee & Code Café',
      email: 'owner@coffeeandcode.cafe',
      stacksAddress: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
    };
    
    console.log('🏢 Business details:');
    console.log(`   Name: ${mockRegistration.businessName}`);
    console.log(`   Email: ${mockRegistration.email}`);
    console.log(`   Stacks Address: ${mockRegistration.stacksAddress}`);
    
    try {
      const registration = await sbtc.registerMerchant(mockRegistration);
      
      console.log('\n✅ Merchant registration successful!');
      console.log(`🆔 Merchant ID: ${registration.merchantId}`);
      console.log(`🔑 API Key: ${registration.apiKey.substring(0, 20)}...`);
      console.log(`🔐 Secret Key: ${registration.secretKey.substring(0, 20)}...`);
      
      // Update client with new API key
      sbtc.updateApiKey(registration.apiKey);
      
    } catch (regError) {
      console.log(`⚠️  Registration failed (expected in demo): ${regError.message}`);
      console.log('📝 Continuing with demo API key...\n');
    }

    // 3. Validate current API key
    console.log('3. Validating API key...');
    const validation = await sbtc.validateApiKey();
    console.log(`✅ Valid: ${validation.valid}`);
    console.log(`🏷️  Type: ${validation.type}`);
    
    if (validation.hint) {
      console.log(`💡 Hint: ${validation.hint}`);
    }
    console.log();

    // 4. Create some test payments to populate dashboard
    console.log('4. Creating test payments for dashboard demo...');
    const testPayments = [];
    
    for (let i = 1; i <= 3; i++) {
      try {
        const payment = await sbtc.createPaymentIntent({
          amount: 50000 + (i * 25000), // Varying amounts
          description: `Test payment ${i} for dashboard demo`,
        });
        testPayments.push(payment);
        console.log(`   ✅ Created payment ${i}: ${payment.id}`);
      } catch (paymentError) {
        console.log(`   ⚠️  Payment ${i} failed: ${paymentError.message}`);
      }
    }
    console.log();

    // 5. Get merchant dashboard
    console.log('5. Retrieving merchant dashboard...');
    try {
      const dashboard = await sbtc.getDashboard();
      
      console.log('📊 Dashboard Statistics:');
      console.log(`   💰 Total Processed: ${formatSatoshiAmount(dashboard.totalProcessed).formatted}`);
      console.log(`   💸 Fees Collected: ${formatSatoshiAmount(dashboard.feeCollected).formatted}`);
      console.log(`   📈 Total Payments: ${dashboard.paymentsCount}`);
      console.log(`   ✅ Successful Payments: ${dashboard.successfulPayments}`);
      console.log(`   🔄 Active Payments: ${dashboard.activePayments}`);
      
      if (dashboard.recentPayments && dashboard.recentPayments.length > 0) {
        console.log('\n🕒 Recent Payments:');
        dashboard.recentPayments.slice(0, 5).forEach((payment, index) => {
          console.log(`   ${index + 1}. ${formatSatoshiAmount(payment.amount).formatted}`);
          console.log(`      📅 ${formatDate(payment.createdAt)}`);
          console.log(`      🎯 ${payment.status}`);
          console.log(`      📝 ${payment.description || 'No description'}`);
          console.log();
        });
      }
      
    } catch (dashboardError) {
      console.log(`⚠️  Dashboard retrieval failed: ${dashboardError.message}`);
      
      if (dashboardError.status === 403) {
        console.log('💡 This might be because the API key is not properly configured');
      }
    }

    // 6. API key management
    console.log('6. API key management...');
    
    // Test validating a specific API key
    try {
      const specificValidation = await sbtc.validateSpecificApiKey('pk_demo_123');
      console.log(`✅ Demo key validation: ${specificValidation.valid}`);
    } catch (validationError) {
      console.log(`⚠️  Key validation failed: ${validationError.message}`);
    }
    
    // Get current configuration
    const config = sbtc.getConfig();
    console.log('\n⚙️  Current Configuration:');
    console.log(`   🌐 Base URL: ${config.baseUrl}`);
    console.log(`   ⏱️  Timeout: ${config.timeout}ms`);
    console.log(`   🔄 Retries: ${config.retries}`);
    console.log(`   🔑 API Key Type: ${config.apiKeyType}`);

    console.log('\n🎉 Merchant example completed successfully!');
    console.log('\n💡 Next steps for real implementation:');
    console.log('   1. Register your merchant account with real details');
    console.log('   2. Secure your API keys in environment variables');
    console.log('   3. Implement webhook handlers for payment status updates');
    console.log('   4. Set up proper error handling and logging');
    console.log('   5. Test with small amounts before going live');

  } catch (error) {
    console.error('❌ Error in merchant example:', error.message);
    
    if (error.status) {
      console.error(`🔧 HTTP Status: ${error.status}`);
    }
    
    if (error.code) {
      console.error(`🔧 Error Code: ${error.code}`);
    }
    
    if (error.requestId) {
      console.error(`🔧 Request ID: ${error.requestId}`);
    }
  }
}

// Utility function to demonstrate error handling
async function demonstrateErrorHandling() {
  console.log('\n🚨 Error Handling Demonstration\n');
  
  const sbtc = new SBTCPaymentGateway({
    apiKey: 'pk_demo_error_test',
  });
  
  // Test validation errors
  try {
    await sbtc.createPaymentIntent({ amount: -100 }); // Invalid amount
  } catch (error) {
    console.log(`✅ Caught validation error: ${error.message}`);
    if (error.field) {
      console.log(`   Field: ${error.field}`);
      console.log(`   Value: ${error.value}`);
    }
  }
  
  // Test invalid payment ID
  try {
    await sbtc.getPaymentIntent('invalid-id');
  } catch (error) {
    console.log(`✅ Caught API error: ${error.message}`);
    if (error.status) {
      console.log(`   Status: ${error.status}`);
    }
  }
}

// Run the examples
merchantExample()
  .then(() => demonstrateErrorHandling())
  .catch(console.error);

export { merchantExample, demonstrateErrorHandling };