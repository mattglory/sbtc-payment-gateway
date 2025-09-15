#!/usr/bin/env node
/**
 * Test Runner for sBTC Payment Gateway Integration Tests
 * Sets up database, runs tests, and provides detailed reporting
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const database = require('../src/config/database');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class TestRunner {
  constructor() {
    this.startTime = Date.now();
    this.testResults = {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0
    };
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  async checkPrerequisites() {
    this.log('\n🔍 Checking Prerequisites...', 'cyan');
    
    // Check if .env file exists
    const envPath = path.join(__dirname, '../.env');
    if (!fs.existsSync(envPath)) {
      this.log('❌ .env file not found. Please copy .env.example to .env and configure.', 'red');
      process.exit(1);
    }
    
    // Load environment variables
    require('dotenv').config({ path: envPath });
    
    // Check required environment variables
    const requiredVars = [
      'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD',
      'CONTRACT_ADDRESS', 'STACKS_NETWORK'
    ];
    
    const missing = requiredVars.filter(v => !process.env[v]);
    if (missing.length > 0) {
      this.log(`❌ Missing environment variables: ${missing.join(', ')}`, 'red');
      process.exit(1);
    }
    
    this.log('✅ Environment configuration found', 'green');
    
    // Check if PostgreSQL is running
    try {
      await database.initialize();
      const health = await database.healthCheck();
      
      if (health.status === 'healthy') {
        this.log('✅ PostgreSQL connection successful', 'green');
        this.log(`   Response time: ${health.responseTime}`, 'reset');
        this.log(`   Active connections: ${health.connections.total}/${health.connections.max}`, 'reset');
      } else {
        throw new Error(health.message);
      }
    } catch (error) {
      this.log(`❌ PostgreSQL connection failed: ${error.message}`, 'red');
      this.log('   Make sure PostgreSQL is running and database exists', 'yellow');
      process.exit(1);
    }
    
    // Check if database schema exists
    try {
      const result = await database.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('merchants', 'payments', 'payment_events')
      `);
      
      if (result.rows.length === 3) {
        this.log('✅ Database schema exists', 'green');
      } else {
        this.log('⚠️  Database schema incomplete, running initialization...', 'yellow');
        const { initializeDatabase } = require('../database/init');
        await initializeDatabase();
        this.log('✅ Database schema created', 'green');
      }
    } catch (error) {
      this.log(`❌ Database schema check failed: ${error.message}`, 'red');
      process.exit(1);
    }
  }

  async setupTestData() {
    this.log('\n📊 Setting up test data...', 'cyan');
    
    try {
      // Clean any existing test data
      await database.query(`DELETE FROM payment_events WHERE payment_id LIKE 'pi_test_%'`);
      await database.query(`DELETE FROM payments WHERE merchant_id LIKE 'test-merchant-%'`);
      await database.query(`DELETE FROM merchants WHERE merchant_id LIKE 'test-merchant-%'`);
      
      this.log('✅ Test data cleanup completed', 'green');
    } catch (error) {
      this.log(`⚠️  Test data cleanup warning: ${error.message}`, 'yellow');
    }
  }

  async runTests() {
    this.log('\n🧪 Running Integration Tests...', 'cyan');
    
    return new Promise((resolve, reject) => {
      const jestProcess = spawn('npx', ['jest', 'tests/e2e-integration.test.js', '--verbose', '--no-cache'], {
        stdio: 'pipe',
        cwd: path.join(__dirname, '..')
      });

      let output = '';
      let errorOutput = '';

      jestProcess.stdout.on('data', (data) => {
        const chunk = data.toString();
        output += chunk;
        process.stdout.write(chunk);
      });

      jestProcess.stderr.on('data', (data) => {
        const chunk = data.toString();
        errorOutput += chunk;
        process.stderr.write(chunk);
      });

      jestProcess.on('close', (code) => {
        // Parse Jest output for results
        this.parseTestResults(output);
        
        if (code === 0) {
          resolve({ success: true, output, errorOutput });
        } else {
          resolve({ success: false, output, errorOutput, exitCode: code });
        }
      });

      jestProcess.on('error', (error) => {
        reject(error);
      });
    });
  }

  parseTestResults(output) {
    // Extract test results from Jest output
    const lines = output.split('\n');
    
    for (const line of lines) {
      if (line.includes('Tests:')) {
        const match = line.match(/Tests:\s*(\d+)\s*failed,?\s*(\d+)\s*passed,?\s*(\d+)\s*total/);
        if (match) {
          this.testResults.failed = parseInt(match[1]) || 0;
          this.testResults.passed = parseInt(match[2]) || 0;
          this.testResults.total = parseInt(match[3]) || 0;
        }
      }
    }
  }

  async generateReport() {
    this.log('\n📋 Test Report', 'magenta');
    this.log('═'.repeat(50), 'magenta');
    
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    
    this.log(`⏱️  Duration: ${duration}s`, 'reset');
    this.log(`✅ Passed: ${this.testResults.passed}`, 'green');
    this.log(`❌ Failed: ${this.testResults.failed}`, this.testResults.failed > 0 ? 'red' : 'reset');
    this.log(`📊 Total: ${this.testResults.total}`, 'reset');
    
    // Success rate
    const successRate = this.testResults.total > 0 
      ? ((this.testResults.passed / this.testResults.total) * 100).toFixed(1)
      : 0;
    
    this.log(`🎯 Success Rate: ${successRate}%`, successRate >= 90 ? 'green' : successRate >= 70 ? 'yellow' : 'red');
    
    // System status
    this.log('\n🔧 System Status:', 'cyan');
    try {
      const health = await database.healthCheck();
      this.log(`   Database: ${health.status}`, health.status === 'healthy' ? 'green' : 'red');
      this.log(`   Response Time: ${health.responseTime}`, 'reset');
      
      // Check Stacks network
      const StacksService = require('../src/services/stacksService');
      const stacksService = new StacksService();
      const networkInfo = stacksService.getNetworkInfo();
      this.log(`   Stacks Network: ${networkInfo.network}`, 'reset');
      this.log(`   Contract: ${networkInfo.contractAddress}.${networkInfo.contractName}`, 'reset');
      
    } catch (error) {
      this.log(`   System check failed: ${error.message}`, 'red');
    }
    
    // Recommendations
    this.log('\n💡 Recommendations:', 'cyan');
    
    if (this.testResults.failed === 0 && this.testResults.passed > 0) {
      this.log('   🎉 All tests passed! System is ready for production.', 'green');
      this.log('   ✅ PostgreSQL integration working correctly', 'green');
      this.log('   ✅ Stacks blockchain integration functional', 'green');
      this.log('   ✅ API endpoints responding properly', 'green');
      this.log('   ✅ Error handling working as expected', 'green');
    } else if (this.testResults.failed > 0) {
      this.log('   ⚠️  Some tests failed. Check the output above for details.', 'yellow');
      
      if (this.testResults.failed > this.testResults.passed) {
        this.log('   🔧 Consider checking database connection and configuration', 'yellow');
        this.log('   🔧 Verify Stacks network connectivity', 'yellow');
        this.log('   🔧 Check environment variables in .env file', 'yellow');
      }
    } else {
      this.log('   ❌ No tests executed. Check Jest configuration.', 'red');
    }
    
    this.log('\n' + '═'.repeat(50), 'magenta');
  }

  async cleanup() {
    this.log('\n🧹 Cleaning up...', 'cyan');
    
    try {
      // Close database connections
      await database.close();
      this.log('✅ Database connections closed', 'green');
    } catch (error) {
      this.log(`⚠️  Cleanup warning: ${error.message}`, 'yellow');
    }
  }

  async run() {
    try {
      this.log('🚀 sBTC Payment Gateway Integration Test Runner', 'bright');
      this.log('=' + '='.repeat(49), 'bright');
      
      await this.checkPrerequisites();
      await this.setupTestData();
      
      const result = await this.runTests();
      
      await this.generateReport();
      
      if (!result.success) {
        this.log(`\n❌ Tests completed with exit code: ${result.exitCode}`, 'red');
        process.exit(result.exitCode || 1);
      } else {
        this.log('\n✅ All tests completed successfully!', 'green');
        process.exit(0);
      }
      
    } catch (error) {
      this.log(`\n💥 Test runner failed: ${error.message}`, 'red');
      console.error(error);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n⏹️  Test runner interrupted');
  try {
    await database.close();
  } catch (error) {
    // Ignore cleanup errors during forced shutdown
  }
  process.exit(130);
});

// Run the test runner if this script is executed directly
if (require.main === module) {
  const runner = new TestRunner();
  runner.run();
}

module.exports = TestRunner;