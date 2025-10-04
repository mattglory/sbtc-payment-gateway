#!/usr/bin/env node

/**
 * Railway Deployment Test Script
 * Tests all critical components required for Railway deployment
 */

const http = require('http');
const { spawn } = require('child_process');

async function testRailwayDeployment() {
  console.log('🔍 Testing sBTC Payment Gateway Railway Deployment...\n');
  
  const tests = [
    {
      name: 'Environment Detection',
      test: () => {
        // Set Railway environment variables for testing
        process.env.RAILWAY_ENVIRONMENT = 'test';
        process.env.RAILWAY_PROJECT_ID = 'test-project';
        process.env.NODE_ENV = 'production';
        
        const { env, isRailway } = require('./backend/src/config/environment');
        
        if (!isRailway) {
          throw new Error('Railway environment not detected');
        }
        
        if (!env.get('DEMO_MODE')) {
          throw new Error('Demo mode not enabled on Railway');
        }
        
        console.log('✅ Railway environment detected correctly');
        console.log(`   - Demo mode: ${env.get('DEMO_MODE')}`);
        console.log(`   - Port: ${env.get('PORT')}`);
        console.log(`   - Host: ${env.get('HOST')}`);
        return true;
      }
    },
    {
      name: 'API Key Service',
      test: () => {
        const ApiKeyService = require('./backend/src/services/apiKeyService');
        const apiKeyService = new ApiKeyService();
        
        if (!apiKeyService.DEMO_MODE) {
          throw new Error('Demo mode not enabled in API key service');
        }
        
        const demoValidation = apiKeyService.validateApiKey('pk_test_demo');
        if (!demoValidation.valid) {
          throw new Error('Demo API key validation failed');
        }
        
        console.log('✅ API key service configured correctly');
        console.log(`   - Demo mode: ${apiKeyService.DEMO_MODE}`);
        console.log(`   - Demo keys available: ${apiKeyService.DEMO_KEYS.length}`);
        return true;
      }
    },
    {
      name: 'Health Check Endpoint',
      test: () => {
        return new Promise((resolve, reject) => {
          // Start the server
          const server = spawn('node', ['server.js'], {
            cwd: './backend',
            env: {
              ...process.env,
              PORT: '3333',
              NODE_ENV: 'production',
              RAILWAY_ENVIRONMENT: 'test',
              DEMO_MODE: 'true'
            }
          });
          
          let serverStarted = false;
          
          server.stdout.on('data', (data) => {
            const output = data.toString();
            console.log(`   Server: ${output.trim()}`);
            
            if ((output.includes('Server running') || output.includes('Server Started') || output.includes('started on')) && !serverStarted) {
              serverStarted = true;
              
              // Test health endpoint
              setTimeout(() => {
                const req = http.get('http://localhost:3333/health', (res) => {
                  let body = '';
                  
                  res.on('data', (chunk) => {
                    body += chunk;
                  });
                  
                  res.on('end', () => {
                    try {
                      const healthData = JSON.parse(body);
                      
                      if (res.statusCode !== 200) {
                        throw new Error(`Health check failed with status ${res.statusCode}`);
                      }
                      
                      if (!healthData.status || !healthData.platform) {
                        throw new Error('Health check response missing required fields');
                      }
                      
                      console.log('✅ Health check endpoint working');
                      console.log(`   - Status: ${healthData.status}`);
                      console.log(`   - Platform: ${healthData.platform}`);
                      console.log(`   - Response time: ${healthData.responseTime}`);
                      
                      server.kill();
                      resolve(true);
                    } catch (error) {
                      server.kill();
                      reject(error);
                    }
                  });
                });
                
                req.on('error', (error) => {
                  server.kill();
                  reject(error);
                });
                
                req.setTimeout(5000, () => {
                  server.kill();
                  reject(new Error('Health check timeout'));
                });
              }, 2000);
            }
          });
          
          server.stderr.on('data', (data) => {
            console.log(`   Server Error: ${data.toString().trim()}`);
          });
          
          server.on('error', (error) => {
            reject(new Error(`Failed to start server: ${error.message}`));
          });
          
          // Timeout after 15 seconds
          setTimeout(() => {
            if (!serverStarted) {
              server.kill();
              reject(new Error('Server failed to start within 15 seconds'));
            }
          }, 15000);
        });
      }
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      console.log(`🧪 Running test: ${test.name}`);
      await test.test();
      passed++;
      console.log('');
    } catch (error) {
      console.log(`❌ Test failed: ${test.name}`);
      console.log(`   Error: ${error.message}`);
      console.log('');
      failed++;
    }
  }
  
  console.log('📊 Test Results:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Your sBTC Payment Gateway is ready for Railway deployment.');
    console.log('\n🚀 Next steps:');
    console.log('   1. Push your changes to GitHub');
    console.log('   2. Connect your repository to Railway');
    console.log('   3. Add a PostgreSQL database service');
    console.log('   4. Deploy and visit your /health endpoint');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed. Please check the errors above before deploying.');
    process.exit(1);
  }
}

// Run tests
testRailwayDeployment().catch(error => {
  console.error('\n💥 Test runner error:', error.message);
  process.exit(1);
});