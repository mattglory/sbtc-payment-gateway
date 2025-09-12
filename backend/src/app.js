/**
 * Main Application File
 * Production-ready Express app with comprehensive middleware, security, and monitoring
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import professional middleware and utilities
const logger = require('./utils/logger');
const { 
  errorHandler, 
  notFoundHandler, 
  asyncHandler,
  validationErrorHandler,
  securityErrorHandler,
  rateLimitErrorHandler,
  developmentErrorHandler
} = require('./middleware/errorHandler');

const {
  requestId,
  securityHeaders,
  createRateLimit,
  sanitizeInput,
  corsOptions,
  requestLogger,
  preventSqlInjection,
  performanceMonitor
} = require('./middleware/security');

const { 
  metricsCollector, 
  healthCheckManager
} = require('./utils/monitoring');

// Legacy auth middleware (for backward compatibility)
const { apiKeyService } = require('./middleware/auth');

// Import routes
const merchantRoutes = require('./routes/merchantRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const contractRoutes = require('./routes/contractRoutes');
const bitcoinRoutes = require('./routes/bitcoinRoutes');

const app = express();

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Request tracking and monitoring
app.use(requestId);
app.use(requestLogger);
app.use(performanceMonitor);

// Security headers
app.use(securityHeaders);

// CORS configuration
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Body parsing with security limits
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Store raw body for webhook signature verification
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization and security
app.use(sanitizeInput);
app.use(preventSqlInjection);

// Rate limiting (different limits for different endpoints)
app.use('/api/payments', createRateLimit(15 * 60 * 1000, 200)); // 200 requests per 15 min for payments
app.use('/api/merchants', createRateLimit(15 * 60 * 1000, 100)); // 100 requests per 15 min for merchants
app.use('/api/contracts', createRateLimit(15 * 60 * 1000, 50)); // 50 requests per 15 min for contract calls
app.use('/api/bitcoin', createRateLimit(15 * 60 * 1000, 150)); // 150 requests per 15 min for Bitcoin operations
app.use('/', createRateLimit(15 * 60 * 1000, 1000)); // General rate limit

// Middleware to record API metrics
app.use('/api/*', (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    metricsCollector.recordRequest(
      req.method,
      req.route?.path || req.originalUrl,
      res.statusCode,
      responseTime
    );
  });
  
  next();
});

// Health check endpoint with comprehensive system status
app.get('/health', asyncHandler(async (req, res) => {
  try {
    // Get system health
    await healthCheckManager.runAll();
    const overallHealth = healthCheckManager.getOverallHealth();
    
    // Get system metrics
    const systemMetrics = metricsCollector.getSystemMetrics();
    const apiMetrics = metricsCollector.getApiMetrics();
    
    // Get API key system status
    const apiKeySystemStatus = apiKeyService.getSystemStatus();
    
    const healthData = {
      status: overallHealth.status === 'healthy' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      
      // Basic system info
      system: {
        uptime: process.uptime(),
        memory: {
          used: systemMetrics.memory.heapUsed,
          total: systemMetrics.memory.heapTotal,
          usage: `${((systemMetrics.memory.heapUsed / systemMetrics.memory.heapTotal) * 100).toFixed(1)}%`
        },
        platform: systemMetrics.platform.os,
        nodeVersion: systemMetrics.platform.node
      },
      
      // API performance
      api: {
        totalRequests: apiMetrics.requests.total,
        averageResponseTime: `${apiMetrics.responses.averageTime.toFixed(0)}ms`,
        errorRate: `${((apiMetrics.errors.total / (apiMetrics.requests.total || 1)) * 100).toFixed(2)}%`
      },
      
      // Health checks summary
      health: {
        overall: overallHealth.status,
        checks: overallHealth.checks,
        healthy: overallHealth.healthy,
        unhealthy: overallHealth.unhealthy
      },
      
      // Application-specific status
      application: {
        demoMode: process.env.DEMO_MODE === 'true',
        apiKeysConfigured: process.env.API_KEYS ? process.env.API_KEYS.split(',').length : 0,
        network: process.env.NODE_ENV === 'production' ? 'mainnet' : 'testnet',
        contract: `${process.env.CONTRACT_ADDRESS || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'}.sbtc-payment-gateway`,
        apiKeySystem: apiKeySystemStatus
      }
    };
    
    // Return appropriate status code based on health
    const statusCode = overallHealth.status === 'critical' ? 503 : 
      overallHealth.status === 'degraded' ? 200 : 200;
    
    res.status(statusCode).json(healthData);
    
  } catch (error) {
    logger.error('Health check endpoint error', error);
    
    res.status(503).json({
      status: 'error',
      message: 'Health check failed',
      timestamp: new Date().toISOString(),
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal error'
    });
  }
}));

// Detailed health endpoint for monitoring systems
app.get('/health/detailed', asyncHandler(async (req, res) => {
  try {
    const healthResults = await healthCheckManager.runAll();
    const overallHealth = healthCheckManager.getOverallHealth();
    const systemMetrics = metricsCollector.getSystemMetrics();
    const apiMetrics = metricsCollector.getApiMetrics();
    
    res.json({
      overall: overallHealth,
      checks: healthResults,
      systemMetrics,
      apiMetrics,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Detailed health check error', error);
    res.status(500).json({
      error: 'Failed to get detailed health status',
      timestamp: new Date().toISOString()
    });
  }
}));

// Metrics endpoint for monitoring
app.get('/metrics', (req, res) => {
  try {
    const metrics = {
      system: metricsCollector.getSystemMetrics(),
      api: metricsCollector.getApiMetrics(),
      timestamp: new Date().toISOString()
    };
    
    res.json(metrics);
  } catch (error) {
    logger.error('Metrics endpoint error', error);
    res.status(500).json({
      error: 'Failed to get metrics',
      timestamp: new Date().toISOString()
    });
  }
});

// API Routes with proper error handling
app.use('/api/merchants', merchantRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/bitcoin', bitcoinRoutes);

// Error handling middleware (order matters!)
app.use(developmentErrorHandler);
app.use(validationErrorHandler);
app.use(securityErrorHandler);
app.use(rateLimitErrorHandler);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;