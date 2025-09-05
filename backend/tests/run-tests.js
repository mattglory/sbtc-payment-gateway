#!/usr/bin/env node

/**
 * Test Runner Script
 * Comprehensive test execution with reporting and analysis
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class TestRunner {
  constructor() {
    this.startTime = Date.now();
    this.results = {
      unit: null,
      integration: null,
      coverage: null
    };
  }

  async run() {
    console.log('🧪 sBTC Payment Gateway - Test Suite Runner\n');
    console.log('================================================\n');

    try {
      // Check test environment
      await this.checkEnvironment();

      // Run test suites
      await this.runUnitTests();
      await this.runIntegrationTests();
      await this.generateFinalReport();

    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      process.exit(1);
    }
  }

  async checkEnvironment() {
    console.log('🔍 Checking test environment...');
    
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.SUPPRESS_LOGS = 'true';
    
    // Verify Jest is available
    try {
      execSync('npx jest --version', { stdio: 'pipe' });
      console.log('✅ Jest is available');
    } catch (error) {
      throw new Error('Jest is not available. Please run: npm install');
    }

    // Check test files exist
    const testDirectories = ['tests/unit', 'tests/integration', 'tests/setup'];
    
    for (const dir of testDirectories) {
      const fullPath = path.join(process.cwd(), dir);
      try {
        await fs.access(fullPath);
        console.log(`✅ Found ${dir}`);
      } catch (error) {
        throw new Error(`Test directory ${dir} not found`);
      }
    }

    console.log('✅ Environment check passed\n');
  }

  async runUnitTests() {
    console.log('🎯 Running Unit Tests...');
    console.log('------------------------');

    const startTime = Date.now();

    try {
      const result = await this.executeJest('tests/unit', {
        coverage: true,
        verbose: true,
        collectCoverageFrom: [
          'src/**/*.js',
          '!src/**/*.test.js',
          '!src/server.js'
        ]
      });

      const duration = Date.now() - startTime;
      this.results.unit = {
        success: result.success,
        duration,
        tests: result.numTotalTests,
        passed: result.numPassedTests,
        failed: result.numFailedTests
      };

      console.log(`✅ Unit tests completed in ${duration}ms`);
      console.log(`   Tests: ${result.numPassedTests}/${result.numTotalTests} passed`);

    } catch (error) {
      this.results.unit = { success: false, error: error.message };
      console.log(`❌ Unit tests failed: ${error.message}`);
      throw error;
    }

    console.log();
  }

  async runIntegrationTests() {
    console.log('🔗 Running Integration Tests...');
    console.log('-------------------------------');

    const startTime = Date.now();

    try {
      const result = await this.executeJest('tests/integration', {
        coverage: false,
        verbose: true,
        testTimeout: 30000
      });

      const duration = Date.now() - startTime;
      this.results.integration = {
        success: result.success,
        duration,
        tests: result.numTotalTests,
        passed: result.numPassedTests,
        failed: result.numFailedTests
      };

      console.log(`✅ Integration tests completed in ${duration}ms`);
      console.log(`   Tests: ${result.numPassedTests}/${result.numTotalTests} passed`);

    } catch (error) {
      this.results.integration = { success: false, error: error.message };
      console.log(`❌ Integration tests failed: ${error.message}`);
      throw error;
    }

    console.log();
  }

  async executeJest(testPath, options = {}) {
    return new Promise((resolve, reject) => {
      const args = [
        'jest',
        testPath,
        '--json'
      ];

      if (options.coverage) {
        args.push('--coverage');
        if (options.collectCoverageFrom) {
          options.collectCoverageFrom.forEach(pattern => {
            args.push('--collectCoverageFrom', pattern);
          });
        }
      }

      if (options.verbose) {
        args.push('--verbose');
      }

      if (options.testTimeout) {
        args.push('--testTimeout', options.testTimeout.toString());
      }

      const jest = spawn('npx', args, {
        stdio: ['inherit', 'pipe', 'pipe'],
        env: { ...process.env, CI: 'true' }
      });

      let stdout = '';
      let stderr = '';

      jest.stdout.on('data', (data) => {
        stdout += data;
        if (!options.silent) {
          process.stdout.write(data);
        }
      });

      jest.stderr.on('data', (data) => {
        stderr += data;
        if (!options.silent) {
          process.stderr.write(data);
        }
      });

      jest.on('close', (code) => {
        try {
          // Parse Jest JSON output
          const lines = stdout.split('\n');
          const jsonLine = lines.find(line => line.startsWith('{') && line.includes('numTotalTests'));
          
          if (jsonLine) {
            const result = JSON.parse(jsonLine);
            result.success = code === 0;
            resolve(result);
          } else {
            // Fallback parsing
            resolve({
              success: code === 0,
              numTotalTests: 0,
              numPassedTests: 0,
              numFailedTests: 0
            });
          }
        } catch (error) {
          reject(new Error(`Failed to parse Jest output: ${error.message}`));
        }
      });

      jest.on('error', (error) => {
        reject(error);
      });
    });
  }

  async generateFinalReport() {
    const totalDuration = Date.now() - this.startTime;
    
    console.log('📊 Final Test Report');
    console.log('===================\n');

    // Summary statistics
    const totalTests = (this.results.unit?.tests || 0) + (this.results.integration?.tests || 0);
    const totalPassed = (this.results.unit?.passed || 0) + (this.results.integration?.passed || 0);
    const totalFailed = (this.results.unit?.failed || 0) + (this.results.integration?.failed || 0);

    console.log(`⏱️  Total Execution Time: ${totalDuration}ms`);
    console.log(`🧪 Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${totalPassed}`);
    console.log(`❌ Failed: ${totalFailed}`);
    console.log(`📈 Success Rate: ${totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0}%\n`);

    // Detailed breakdown
    console.log('📋 Test Suite Breakdown:');
    
    if (this.results.unit) {
      const status = this.results.unit.success ? '✅' : '❌';
      console.log(`   ${status} Unit Tests: ${this.results.unit.passed || 0}/${this.results.unit.tests || 0} (${this.results.unit.duration || 0}ms)`);
    }
    
    if (this.results.integration) {
      const status = this.results.integration.success ? '✅' : '❌';
      console.log(`   ${status} Integration Tests: ${this.results.integration.passed || 0}/${this.results.integration.tests || 0} (${this.results.integration.duration || 0}ms)`);
    }

    console.log();

    // Performance analysis
    await this.analyzePerformance();

    // Coverage analysis
    await this.analyzeCoverage();

    // Recommendations
    this.generateRecommendations();

    // Save detailed report
    await this.saveReportToFile();

    const overallSuccess = this.results.unit?.success && this.results.integration?.success;
    
    if (overallSuccess) {
      console.log('🎉 All tests passed! Ready for deployment.\n');
    } else {
      console.log('⚠️  Some tests failed. Please review and fix before deployment.\n');
      process.exit(1);
    }
  }

  async analyzePerformance() {
    console.log('⚡ Performance Analysis:');
    
    const unitTime = this.results.unit?.duration || 0;
    const integrationTime = this.results.integration?.duration || 0;
    const totalTime = unitTime + integrationTime;
    
    if (totalTime < 10000) {
      console.log('   🚀 Excellent: Test suite runs in under 10 seconds');
    } else if (totalTime < 30000) {
      console.log('   👍 Good: Test suite runs in under 30 seconds');
    } else if (totalTime < 60000) {
      console.log('   ⚠️  Fair: Test suite takes over 30 seconds');
    } else {
      console.log('   🐌 Slow: Test suite takes over 1 minute - consider optimization');
    }
    
    console.log(`   Unit tests: ${unitTime}ms`);
    console.log(`   Integration tests: ${integrationTime}ms`);
    console.log();
  }

  async analyzeCoverage() {
    console.log('📊 Coverage Analysis:');
    
    try {
      const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
      const coverageData = JSON.parse(await fs.readFile(coveragePath, 'utf8'));
      const total = coverageData.total;
      
      console.log(`   Lines: ${total.lines.pct}% (${total.lines.covered}/${total.lines.total})`);
      console.log(`   Functions: ${total.functions.pct}% (${total.functions.covered}/${total.functions.total})`);
      console.log(`   Branches: ${total.branches.pct}% (${total.branches.covered}/${total.branches.total})`);
      console.log(`   Statements: ${total.statements.pct}% (${total.statements.covered}/${total.statements.total})`);
      
      const avgCoverage = (total.lines.pct + total.functions.pct + total.branches.pct + total.statements.pct) / 4;
      
      if (avgCoverage >= 80) {
        console.log('   🎯 Excellent coverage!');
      } else if (avgCoverage >= 70) {
        console.log('   👍 Good coverage');
      } else if (avgCoverage >= 60) {
        console.log('   ⚠️  Fair coverage - room for improvement');
      } else {
        console.log('   📈 Low coverage - add more tests');
      }

    } catch (error) {
      console.log('   ⚠️  Coverage data not available');
    }
    
    console.log();
  }

  generateRecommendations() {
    console.log('💡 Recommendations:');
    
    const recommendations = [];
    
    if (!this.results.unit?.success) {
      recommendations.push('Fix failing unit tests before proceeding');
    }
    
    if (!this.results.integration?.success) {
      recommendations.push('Fix failing integration tests before proceeding');
    }
    
    if ((this.results.unit?.duration || 0) > 15000) {
      recommendations.push('Consider optimizing slow unit tests');
    }
    
    if ((this.results.integration?.duration || 0) > 30000) {
      recommendations.push('Consider optimizing slow integration tests');
    }
    
    recommendations.push('Review coverage report for missed edge cases');
    recommendations.push('Add performance tests for critical paths');
    recommendations.push('Consider adding end-to-end tests for complete user flows');
    
    if (recommendations.length === 0) {
      console.log('   🎉 Great job! No immediate recommendations.');
    } else {
      recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }
    
    console.log();
  }

  async saveReportToFile() {
    const reportPath = path.join(process.cwd(), 'test-results.json');
    const report = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      results: this.results,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        cwd: process.cwd()
      }
    };
    
    try {
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      console.log(`💾 Detailed report saved to: ${reportPath}`);
    } catch (error) {
      console.log('⚠️  Could not save detailed report');
    }
  }
}

// CLI execution
if (require.main === module) {
  const runner = new TestRunner();
  runner.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = TestRunner;