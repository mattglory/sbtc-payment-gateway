#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Environment variable validation schema
const envSchema = {
  // Required variables
  required: {
    development: [
      'NODE_ENV',
      'NEXT_PUBLIC_APP_ENV'
    ],
    production: [
      'NODE_ENV',
      'NEXT_PUBLIC_APP_ENV',
      'OPENAI_API_KEY',
      'VERCEL',
      'VERCEL_URL'
    ]
  },
  // Optional but recommended variables
  recommended: {
    development: [
      'OPENAI_API_KEY',
      'ANTHROPIC_API_KEY',
      'NEXT_PUBLIC_ENABLE_AI_FEATURES',
      'NEXT_PUBLIC_ENABLE_BLOCKCHAIN'
    ],
    production: [
      'ANTHROPIC_API_KEY',
      'EDGE_CONFIG',
      'SENTRY_DSN',
      'GOOGLE_ANALYTICS_ID'
    ]
  },
  // Variables that should be validated for format
  format: {
    'OPENAI_API_KEY': /^sk-[a-zA-Z0-9]{20,}$/,
    'ANTHROPIC_API_KEY': /^sk-ant-[a-zA-Z0-9\-_]{20,}$/,
    'NODE_ENV': /^(development|production|test)$/,
    'NEXT_PUBLIC_APP_ENV': /^(development|staging|production)$/,
    'DATABASE_URL': /^postgresql:\/\/.+/,
    'REDIS_URL': /^redis:\/\/.+/,
    'VERCEL_URL': /^[a-zA-Z0-9\-\.]+\.(vercel\.app|com)$/
  }
};

function validateEnvironment() {
  log('\n🔍 Validating environment variables...', 'cyan');

  const env = process.env.NODE_ENV || 'development';
  const isProduction = env === 'production';
  const isVercel = process.env.VERCEL === '1';

  log(`Environment: ${env}`, 'blue');
  log(`Platform: ${isVercel ? 'Vercel' : 'Local'}`, 'blue');

  let hasErrors = false;
  let hasWarnings = false;

  // Check if .env.local exists in development
  if (!isProduction && !isVercel) {
    const envLocalPath = path.join(process.cwd(), '.env.local');
    const envExamplePath = path.join(process.cwd(), '.env.local.example');

    if (!fs.existsSync(envLocalPath)) {
      log('\n⚠️  .env.local file not found!', 'yellow');
      if (fs.existsSync(envExamplePath)) {
        log('   Copy .env.local.example to .env.local and fill in your values', 'yellow');
      }
      hasWarnings = true;
    }
  }

  // Validate required variables
  const requiredVars = envSchema.required[isProduction ? 'production' : 'development'];
  log(`\n✅ Checking required variables (${requiredVars.length})...`, 'green');

  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
      log(`   ❌ Missing required variable: ${varName}`, 'red');
      hasErrors = true;
    } else {
      log(`   ✓ ${varName}`, 'green');

      // Validate format if specified
      if (envSchema.format[varName]) {
        if (!envSchema.format[varName].test(value)) {
          log(`   ❌ Invalid format for ${varName}`, 'red');
          hasErrors = true;
        }
      }
    }
  });

  // Check recommended variables
  const recommendedVars = envSchema.recommended[isProduction ? 'production' : 'development'];
  log(`\n💡 Checking recommended variables (${recommendedVars.length})...`, 'yellow');

  recommendedVars.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
      log(`   ⚠️  Missing recommended variable: ${varName}`, 'yellow');
      hasWarnings = true;
    } else {
      log(`   ✓ ${varName}`, 'green');

      // Validate format if specified
      if (envSchema.format[varName]) {
        if (!envSchema.format[varName].test(value)) {
          log(`   ⚠️  Invalid format for ${varName}`, 'yellow');
          hasWarnings = true;
        }
      }
    }
  });

  // Check for potential issues
  log('\n🔒 Security checks...', 'magenta');

  // Check for development keys in production
  if (isProduction) {
    const devKeys = ['test', 'dev', 'localhost'];
    Object.keys(process.env).forEach(key => {
      if (key.includes('API_KEY') || key.includes('SECRET')) {
        const value = process.env[key]?.toLowerCase();
        if (value && devKeys.some(devKey => value.includes(devKey))) {
          log(`   ❌ Development key detected in production: ${key}`, 'red');
          hasErrors = true;
        }
      }
    });
  }

  // Check for missing HTTPS in production URLs
  if (isProduction) {
    const urlVars = ['NEXT_PUBLIC_API_BASE_URL', 'NEXT_PUBLIC_APP_BASE_URL'];
    urlVars.forEach(varName => {
      const value = process.env[varName];
      if (value && !value.startsWith('https://')) {
        log(`   ⚠️  Non-HTTPS URL in production: ${varName}`, 'yellow');
        hasWarnings = true;
      }
    });
  }

  // Feature flags validation
  log('\n🚀 Feature flags...', 'blue');
  const featureFlags = [
    'NEXT_PUBLIC_ENABLE_AI_FEATURES',
    'NEXT_PUBLIC_ENABLE_BLOCKCHAIN',
    'NEXT_PUBLIC_ENABLE_ANALYTICS',
    'NEXT_PUBLIC_ENABLE_ESG_NEWS'
  ];

  featureFlags.forEach(flag => {
    const value = process.env[flag];
    if (value === 'true') {
      log(`   ✓ ${flag.replace('NEXT_PUBLIC_ENABLE_', '').toLowerCase()} enabled`, 'green');
    } else {
      log(`   - ${flag.replace('NEXT_PUBLIC_ENABLE_', '').toLowerCase()} disabled`, 'yellow');
    }
  });

  // Summary
  log('\n📊 Validation Summary:', 'bold');

  if (hasErrors) {
    log('   ❌ Validation failed with errors!', 'red');
    if (isProduction) {
      log('   🛑 Deployment should be blocked until errors are fixed.', 'red');
      process.exit(1);
    } else {
      log('   ⚠️  Please fix errors before deploying to production.', 'yellow');
    }
  } else if (hasWarnings) {
    log('   ⚠️  Validation passed with warnings.', 'yellow');
    log('   💡 Consider addressing warnings for optimal performance.', 'yellow');
  } else {
    log('   ✅ All validations passed!', 'green');
  }

  // Additional info
  if (!isProduction) {
    log('\n💻 Development Tips:', 'cyan');
    log('   • Copy .env.local.example to .env.local', 'cyan');
    log('   • Add your API keys for full functionality', 'cyan');
    log('   • Run `npm run env:validate` to check your setup', 'cyan');
  }

  if (isProduction) {
    log('\n🚀 Production Deployment:', 'green');
    log('   • Environment variables validated', 'green');
    log('   • Security checks passed', 'green');
    log('   • Ready for deployment!', 'green');
  }

  log(''); // Empty line at the end
}

// Run validation
try {
  validateEnvironment();
} catch (error) {
  log('\n💥 Environment validation failed:', 'red');
  log(error.message, 'red');
  process.exit(1);
}