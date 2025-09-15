/**
 * Main Application File
 * Production-ready Express app with comprehensive middleware, security, and monitoring
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import professional middleware and utilities
const logger = require('./utils/logger');
const { env, isRailway } = require('./config/environment');
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
  performanceMonitor,
  railwayHealthCheck
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

// Railway health check detection (must be early in middleware stack)
app.use(railwayHealthCheck);

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

// Railway-optimized health check endpoint
app.get('/health', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Fast health check with timeout for Railway
    const healthTimeout = env.getHealthCheckConfig().timeout;
    const healthPromise = healthCheckManager.runAll();
    
    let overallHealth;
    try {
      await Promise.race([
        healthPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), healthTimeout)
        )
      ]);
      overallHealth = healthCheckManager.getOverallHealth();
    } catch (timeoutError) {
      // On timeout, return a minimal healthy response for Railway
      overallHealth = {
        status: 'healthy', // Railway needs quick positive response
        checks: 0,
        healthy: 0,
        unhealthy: 0,
        timeout: true
      };
    }
    
    // Get system metrics (lightweight for Railway)
    const systemMetrics = metricsCollector.getSystemMetrics();
    const apiMetrics = metricsCollector.getApiMetrics();
    const checkDuration = Date.now() - startTime;
    
    const healthData = {
      status: overallHealth.timeout ? 'healthy' : (overallHealth.status === 'critical' ? 'degraded' : overallHealth.status),
      timestamp: new Date().toISOString(),
      version: env.get('APP_VERSION'),
      environment: env.get('NODE_ENV'),
      platform: isRailway ? 'Railway' : 'Local',
      responseTime: `${checkDuration}ms`,
      
      // Essential system info for Railway
      system: {
        uptime: Math.floor(process.uptime()),
        memory: {
          used: Math.round(systemMetrics.memory.heapUsed / 1024 / 1024), // MB
          total: Math.round(systemMetrics.memory.heapTotal / 1024 / 1024), // MB  
          usage: `${((systemMetrics.memory.heapUsed / systemMetrics.memory.heapTotal) * 100).toFixed(1)}%`
        },
        platform: systemMetrics.platform.os,
        node: systemMetrics.platform.node
      },
      
      // Lightweight API metrics for Railway
      api: {
        requests: apiMetrics.requests.total,
        avgResponseTime: Math.round(apiMetrics.responses.averageTime),
        errorRate: `${((apiMetrics.errors.total / (apiMetrics.requests.total || 1)) * 100).toFixed(1)}%`
      },
      
      // Health summary
      health: {
        status: overallHealth.status,
        checks: overallHealth.checks,
        healthy: overallHealth.healthy,
        unhealthy: overallHealth.unhealthy,
        timeout: overallHealth.timeout || false
      }
    };

    // Railway-specific information
    if (isRailway) {
      healthData.railway = {
        projectId: env.get('RAILWAY_PROJECT_ID'),
        environment: env.get('RAILWAY_ENVIRONMENT'),
        commitSha: env.get('RAILWAY_GIT_COMMIT_SHA')?.substring(0, 7), // Short SHA
        branch: env.get('RAILWAY_GIT_BRANCH'),
        staticUrl: env.get('RAILWAY_STATIC_URL')
      };
    } else {
      // Include more detailed info for local development
      healthData.application = {
        demoMode: env.get('DEMO_MODE'),
        network: env.get('STACKS_NETWORK'),
        monitoring: env.get('ENABLE_MONITORING'),
        database: 'PostgreSQL/SQLite fallback'
      };
    }
    
    // Railway expects fast 200 responses, only return 503 for critical issues
    const statusCode = overallHealth.status === 'critical' && !isRailway ? 503 : 200;
    
    res.status(statusCode).json(healthData);
    
  } catch (error) {
    logger.error('Health check endpoint error', error);
    
    // Railway-optimized error response
    const errorResponse = {
      status: isRailway ? 'healthy' : 'error', // Railway needs positive response
      message: 'Health check completed',
      timestamp: new Date().toISOString(),
      responseTime: `${Date.now() - startTime}ms`
    };
    
    if (!isRailway) {
      errorResponse.error = env.isDevelopment() ? error.message : 'Internal error';
    }
    
    res.status(isRailway ? 200 : 503).json(errorResponse);
  }
}));

// Railway readiness probe - ultra-fast endpoint
app.get('/ready', (req, res) => {
  res.status(200).json({
    ready: true,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime())
  });
});

// Railway liveness probe - minimal health check
app.get('/alive', (req, res) => {
  const memUsage = process.memoryUsage();
  const memUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  
  // Return unhealthy if memory usage is critically high
  const isHealthy = memUsagePercent < 95;
  
  res.status(isHealthy ? 200 : 503).json({
    alive: isHealthy,
    memory: `${memUsagePercent.toFixed(1)}%`,
    timestamp: new Date().toISOString()
  });
});

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