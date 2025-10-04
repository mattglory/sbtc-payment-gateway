/**
 * Environment Configuration for Railway Deployment
 * Centralizes and validates all environment variables with Railway-specific optimizations
 */

const logger = require('../utils/logger');

/**
 * Railway Environment Detection
 */
const isRailway = !!(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID);
const isDevelopment = process.env.NODE_ENV !== 'production';
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Environment Configuration with Railway Defaults
 */
class EnvironmentConfig {
  constructor() {
    this.config = this.loadConfiguration();
    this.validateConfiguration();
  }

  loadConfiguration() {
    return {
      // Application
      NODE_ENV: process.env.NODE_ENV || 'development',
      PORT: parseInt(process.env.PORT || (isRailway ? '3000' : '3001')),
      HOST: process.env.HOST || '0.0.0.0',
      APP_VERSION: process.env.APP_VERSION || '1.0.0',
      
      // Railway-specific
      RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT || null,
      RAILWAY_PROJECT_ID: process.env.RAILWAY_PROJECT_ID || null,
      RAILWAY_STATIC_URL: process.env.RAILWAY_STATIC_URL || null,
      RAILWAY_GIT_COMMIT_SHA: process.env.RAILWAY_GIT_COMMIT_SHA || null,
      RAILWAY_GIT_BRANCH: process.env.RAILWAY_GIT_BRANCH || null,
      
      // Logging (Railway-optimized)
      LOG_LEVEL: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
      ENABLE_FILE_LOGGING: process.env.ENABLE_FILE_LOGGING === 'true' && !isRailway, // Disable on Railway
      
      // Database (Railway PostgreSQL support)
      DATABASE_URL: process.env.DATABASE_URL || null, // Railway provides this
      DB_HOST: process.env.DB_HOST || 'localhost',
      DB_PORT: parseInt(process.env.DB_PORT || '5432'),
      DB_NAME: process.env.DB_NAME || 'sbtc_gateway',
      DB_USER: process.env.DB_USER || 'postgres',
      DB_PASSWORD: process.env.DB_PASSWORD || null,
      DB_MAX_CONNECTIONS: parseInt(process.env.DB_MAX_CONNECTIONS || (isRailway ? '10' : '20')), // Lower on Railway
      DB_MIN_CONNECTIONS: parseInt(process.env.DB_MIN_CONNECTIONS || (isRailway ? '2' : '5')),
      DB_IDLE_TIMEOUT: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
      DB_CONNECTION_TIMEOUT: parseInt(process.env.DB_CONNECTION_TIMEOUT || (isRailway ? '5000' : '10000')), // Faster timeout
      
      // Stacks Blockchain
      STACKS_NETWORK: process.env.STACKS_NETWORK || (isProduction ? 'mainnet' : 'testnet'),
      CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      DEPLOYER_PRIVATE_KEY: process.env.DEPLOYER_PRIVATE_KEY || null,
      STACKS_API_URL: process.env.STACKS_API_URL || null,
      
      // API Configuration
      DEMO_MODE: process.env.DEMO_MODE === 'true' || isDevelopment || isRailway,
      API_KEYS: process.env.API_KEYS || 'pk_test_demo,pk_test_railway,pk_test_default',
      JWT_SECRET: process.env.JWT_SECRET || 'railway-default-jwt-secret-change-in-production',
      
      // Security & CORS
      CORS_ORIGINS: process.env.CORS_ORIGINS ? 
        process.env.CORS_ORIGINS.split(',').map(url => url.trim()) :
        this.getDefaultCorsOrigins(),
        
      // Rate Limiting (Railway-optimized)
      RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
      RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || (isRailway ? '1000' : '100')), // Higher on Railway
      
      // Bitcoin
      BITCOIN_NETWORK: process.env.BITCOIN_NETWORK || (isProduction ? 'mainnet' : 'testnet'),
      BITCOIN_CONFIRMATIONS: parseInt(process.env.BITCOIN_CONFIRMATIONS || '6'),
      BITCOIN_MONITORING_INTERVAL: parseInt(process.env.BITCOIN_MONITORING_INTERVAL || (isRailway ? '90000' : '60000')), // Slower on Railway
      
      // Monitoring (Railway-optimized)
      ENABLE_MONITORING: process.env.ENABLE_MONITORING !== 'false',
      HEALTH_CHECK_INTERVAL: parseInt(process.env.HEALTH_CHECK_INTERVAL || (isRailway ? '120000' : '60000')), // Slower on Railway
      METRICS_INTERVAL: parseInt(process.env.METRICS_INTERVAL || (isRailway ? '60000' : '30000')),
      
      // Memory Management (Railway-specific)
      MAX_MEMORY_USAGE: parseInt(process.env.MAX_MEMORY_USAGE || (isRailway ? '450' : '1024')), // MB, Railway has limits
      GC_INTERVAL: parseInt(process.env.GC_INTERVAL || (isRailway ? '300000' : '600000')), // More frequent GC on Railway
      
      // Performance (Railway-optimized)
      CLUSTER_WORKERS: parseInt(process.env.CLUSTER_WORKERS || (isRailway ? '1' : '0')), // Single worker on Railway
      KEEP_ALIVE_TIMEOUT: parseInt(process.env.KEEP_ALIVE_TIMEOUT || (isRailway ? '60000' : '5000')),
      HEADERS_TIMEOUT: parseInt(process.env.HEADERS_TIMEOUT || (isRailway ? '65000' : '10000')),
      
      // Graceful Shutdown (Railway-optimized)
      SHUTDOWN_TIMEOUT: parseInt(process.env.SHUTDOWN_TIMEOUT || (isRailway ? '10000' : '30000')), // Railway has shorter timeouts
      
      // Development
      DEBUG: process.env.DEBUG === 'true' && isDevelopment,
      ENABLE_API_DOCS: process.env.ENABLE_API_DOCS !== 'false' && isDevelopment,
      ENABLE_TEST_ENDPOINTS: process.env.ENABLE_TEST_ENDPOINTS === 'true' && isDevelopment,
    };
  }

  getDefaultCorsOrigins() {
    const origins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://sbtcpaymentgateway.vercel.app'
    ];
    
    // Add Railway URL if available
    if (this.config?.RAILWAY_STATIC_URL) {
      origins.push(`https://${this.config.RAILWAY_STATIC_URL}`);
    }
    
    return origins;
  }

  validateConfiguration() {
    const errors = [];
    
    // Critical validations
    if (isProduction) {
      if (!this.config.JWT_SECRET || (this.config.JWT_SECRET.includes('default') && !isRailway)) {
        errors.push('JWT_SECRET must be set in production (Railway demo mode exempt)');
      }
      
      if (this.config.DEMO_MODE && !isRailway) {
        errors.push('DEMO_MODE must be false in production (except on Railway)');
      }
      
      if (!this.config.DATABASE_URL && !this.config.DB_PASSWORD && !isRailway) {
        errors.push('Database password or DATABASE_URL must be set in production (Railway auto-provides DATABASE_URL)');
      }
    }
    
    // Port validation
    if (this.config.PORT < 1024 || this.config.PORT > 65535) {
      errors.push('PORT must be between 1024 and 65535');
    }
    
    // Railway-specific validations
    if (isRailway) {
      if (this.config.MAX_MEMORY_USAGE > 512) {
        logger.warn('Memory usage set higher than Railway limits, adjusting to 450MB', {
          requested: this.config.MAX_MEMORY_USAGE,
          adjusted: 450
        });
        this.config.MAX_MEMORY_USAGE = 450;
      }
      
      if (this.config.CLUSTER_WORKERS > 1) {
        logger.warn('Multiple cluster workers not recommended on Railway, using single worker', {
          requested: this.config.CLUSTER_WORKERS,
          adjusted: 1
        });
        this.config.CLUSTER_WORKERS = 1;
      }
    }
    
    if (errors.length > 0) {
      logger.error('Environment configuration validation failed', { errors });
      throw new Error(`Configuration errors: ${errors.join(', ')}`);
    }
    
    logger.info('Environment configuration validated successfully', {
      environment: this.config.NODE_ENV,
      platform: isRailway ? 'Railway' : 'Local',
      port: this.config.PORT,
      database: this.config.DATABASE_URL ? 'Railway PostgreSQL' : 'Local/SQLite fallback',
      monitoring: this.config.ENABLE_MONITORING,
      demoMode: this.config.DEMO_MODE
    });
  }

  get(key, defaultValue = null) {
    return this.config[key] !== undefined ? this.config[key] : defaultValue;
  }

  getAll() {
    // Return a sanitized copy (no secrets)
    const sanitized = { ...this.config };
    
    // Remove sensitive information
    const sensitiveKeys = [
      'JWT_SECRET', 'DB_PASSWORD', 'DEPLOYER_PRIVATE_KEY', 
      'DATABASE_URL', 'API_KEYS'
    ];
    
    sensitiveKeys.forEach(key => {
      if (sanitized[key]) {
        sanitized[key] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  isDevelopment() {
    return isDevelopment;
  }

  isProduction() {
    return isProduction;
  }

  isRailway() {
    return isRailway;
  }

  getHealthCheckConfig() {
    return {
      interval: this.config.HEALTH_CHECK_INTERVAL,
      timeout: Math.min(this.config.HEALTH_CHECK_INTERVAL / 2, 15000), // Max 15s timeout
      enabled: this.config.ENABLE_MONITORING
    };
  }

  getDatabaseConfig() {
    // Railway PostgreSQL URL takes precedence
    if (this.config.DATABASE_URL) {
      return { connectionString: this.config.DATABASE_URL };
    }
    
    return {
      host: this.config.DB_HOST,
      port: this.config.DB_PORT,
      database: this.config.DB_NAME,
      user: this.config.DB_USER,
      password: this.config.DB_PASSWORD,
      max: this.config.DB_MAX_CONNECTIONS,
      min: this.config.DB_MIN_CONNECTIONS,
      idleTimeoutMillis: this.config.DB_IDLE_TIMEOUT,
      connectionTimeoutMillis: this.config.DB_CONNECTION_TIMEOUT,
      ssl: isProduction ? { rejectUnauthorized: false } : false
    };
  }

  getRateLimitConfig() {
    return {
      windowMs: this.config.RATE_LIMIT_WINDOW_MS,
      max: this.config.RATE_LIMIT_MAX_REQUESTS,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        error: 'Too many requests',
        retryAfter: Math.ceil(this.config.RATE_LIMIT_WINDOW_MS / 1000)
      }
    };
  }
}

// Create singleton instance
const env = new EnvironmentConfig();

module.exports = {
  env,
  EnvironmentConfig,
  isRailway,
  isDevelopment,
  isProduction
};