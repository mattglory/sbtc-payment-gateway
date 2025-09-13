#!/usr/bin/env node

/**
 * sBTC Payment Gateway API Server
 * Production-ready server with proper error handling, logging, and monitoring
 * Built for Stacks Builders Competition with enterprise architecture
 */

const app = require('./src/app');
const logger = require('./src/utils/logger');
const { setupGlobalErrorHandlers } = require('./src/middleware/errorHandler');
const { startPeriodicMonitoring, healthCheckManager } = require('./src/utils/monitoring');
const { databaseManager } = require('./src/utils/database');
const { env, isRailway } = require('./src/config/environment');
const { shutdownManager } = require('./src/utils/shutdown');
const { performanceManager } = require('./src/utils/performance');

const PORT = env.get('PORT');
const HOST = env.get('HOST');

/**
 * Server initialization optimized for Railway deployment
 */
async function startServer() {
  const startupStart = Date.now();
  const isDevelopment = env.isDevelopment();
  const railwayEnv = env.isRailway();
  
  try {
    logger.info('🚀 Starting sBTC Payment Gateway', {
      environment: env.get('NODE_ENV'),
      platform: railwayEnv ? 'Railway' : 'Local',
      nodeVersion: process.version,
      port: PORT,
      host: HOST,
      railwayProject: env.get('RAILWAY_PROJECT_ID'),
      commitSha: env.get('RAILWAY_GIT_COMMIT_SHA'),
      branch: env.get('RAILWAY_GIT_BRANCH')
    });

    // Setup global error handlers first
    logger.info('Setting up global error handlers...');
    setupGlobalErrorHandlers();

    // Initialize Railway performance optimizations
    logger.info('Initializing performance optimizations...');
    performanceManager.initialize();

    // Initialize database with proper error handling
    logger.info('Initializing database connection...');
    try {
      await databaseManager.initialize();
      const dbStatus = await databaseManager.getStatus();
      logger.info('Database initialized successfully', {
        database: dbStatus.database || 'unknown',
        responseTime: dbStatus.responseTime || 'N/A'
      });
    } catch (dbError) {
      if (isDevelopment) {
        logger.warn('Database initialization failed in development', dbError.message);
        logger.info('Continuing startup - SQLite fallback should work');
      } else {
        logger.error('Database initialization failed in production', dbError);
        // In production, we want to fail fast if database is not available
        throw dbError;
      }
    }

    // Initialize monitoring after database
    logger.info('Starting monitoring systems...');
    startPeriodicMonitoring();

    // Run health checks with Railway-optimized timeout
    logger.info('Running initial health checks...');
    const healthConfig = env.getHealthCheckConfig();
    const healthTimeout = healthConfig.timeout;
    
    let healthResults;
    let overallHealth;
    
    try {
      const healthCheckPromise = healthCheckManager.runAll();
      healthResults = await Promise.race([
        healthCheckPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), healthTimeout)
        )
      ]);
      overallHealth = healthCheckManager.getOverallHealth();
    } catch (healthError) {
      logger.warn('Health checks timed out or failed during startup', healthError.message);
      
      // Create a minimal health status for startup
      overallHealth = {
        status: isDevelopment ? 'degraded' : 'unknown',
        checks: 0,
        healthy: 0,
        unhealthy: 1,
        critical: 0
      };
      healthResults = { startup_health_check: { error: healthError.message } };
    }
    
    // Evaluate health status for startup decision
    if (!isDevelopment && overallHealth.status === 'critical') {
      logger.error('Critical health check failures - cannot start in production', { healthResults });
      process.exit(1);
    }

    if (isDevelopment) {
      if (overallHealth.status !== 'healthy') {
        logger.warn('Some health checks failed but continuing in development mode', { 
          status: overallHealth.status,
          tip: 'Health checks are more lenient in development mode'
        });
      }
    } else if (overallHealth.status === 'degraded') {
      logger.warn('Degraded health status but continuing startup', {
        healthy: overallHealth.healthy,
        unhealthy: overallHealth.unhealthy
      });
    }

    // Start HTTP server with Railway-optimized settings
    const server = app.listen(PORT, HOST, () => {
      const startupTime = Date.now() - startupStart;
      const serverInfo = {
        port: PORT,
        host: HOST,
        environment: process.env.NODE_ENV || 'development',
        platform: isRailway ? 'Railway' : 'Local',
        network: process.env.NODE_ENV === 'production' ? 'mainnet' : 'testnet',
        contract: `${process.env.CONTRACT_ADDRESS || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'}.sbtc-payment-gateway`,
        demoMode: process.env.DEMO_MODE === 'true',
        configuredApiKeys: process.env.API_KEYS ? process.env.API_KEYS.split(',').length : 0,
        healthEndpoint: isRailway 
          ? `https://${process.env.RAILWAY_STATIC_URL}/health`
          : `http://localhost:${PORT}/health`,
        startupTime: `${startupTime}ms`,
        timestamp: new Date().toISOString()
      };

      logger.info('🚀 sBTC Payment Gateway API Server Started', serverInfo);
      
      if (!isRailway) {
        // Only show detailed console output in local development
        console.log('\n🎉 sBTC Payment Gateway - Ready for Business!');
        console.log('===============================================');
        console.log(`🚀 Server: http://${HOST}:${PORT}`);
        console.log(`📊 Health: ${serverInfo.healthEndpoint}`);
        console.log(`🏗️  Network: ${serverInfo.network}`);
        console.log(`📝 Contract: ${serverInfo.contract}`);
        console.log(`🔑 Demo Mode: ${serverInfo.demoMode ? 'ENABLED' : 'DISABLED'}`);
        console.log(`🔐 API Keys: ${serverInfo.configuredApiKeys > 0 ? serverInfo.configuredApiKeys : 'Demo mode'}`);
        console.log(`⚡ Startup: ${startupTime}ms`);
        
        if (process.env.DEMO_MODE === 'true') {
          const demoKeys = ['pk_test_demo', 'pk_test_your_key', 'pk_test_123'];
          console.log(`🧪 Demo Keys: ${demoKeys.join(', ')}`);
        }
        
        console.log('===============================================');
        console.log('🏆 Built for Stacks Builders Competition');
        console.log('💰 Making Bitcoin payments as simple as Stripe');
        console.log('===============================================\n');
      } else {
        // Minimal output for Railway
        console.log(`✅ sBTC Payment Gateway started on ${HOST}:${PORT} (${startupTime}ms)`);
      }

      logger.info('Server startup completed successfully', {
        startupTime: `${startupTime}ms`,
        ready: true
      });
    });

    // Apply Railway-specific server optimizations
    if (railwayEnv) {
      server.keepAliveTimeout = env.get('KEEP_ALIVE_TIMEOUT');
      server.headersTimeout = env.get('HEADERS_TIMEOUT');
      server.timeout = env.get('KEEP_ALIVE_TIMEOUT') + 1000; // Slightly higher than keepAlive
      
      logger.info('Applied Railway server optimizations', {
        keepAliveTimeout: server.keepAliveTimeout,
        headersTimeout: server.headersTimeout,
        timeout: server.timeout
      });
    }

    // Setup Railway-optimized graceful shutdown
    shutdownManager.setupShutdownHandlers();
    
    // Register cleanup tasks
    shutdownManager.registerCleanupTask('server', () => {
      return new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) {
            reject(err);
          } else {
            logger.info('HTTP server closed');
            resolve();
          }
        });
      });
    }, 5000);

    shutdownManager.registerCleanupTask('monitoring', () => {
      return new Promise((resolve) => {
        try {
          const { clearAllIntervals } = require('./src/utils/monitoring');
          clearAllIntervals();
          logger.info('Monitoring intervals cleared');
          resolve();
        } catch (error) {
          logger.warn('Error clearing monitoring intervals', error.message);
          resolve(); // Don't fail shutdown for this
        }
      });
    }, 2000);

    shutdownManager.registerCleanupTask('database', async () => {
      try {
        await databaseManager.close();
        logger.info('Database connections closed');
      } catch (error) {
        logger.warn('Error closing database connections', error.message);
        // Don't throw - allow shutdown to continue
      }
    }, 3000);

    shutdownManager.registerCleanupTask('performance', () => {
      return new Promise((resolve) => {
        try {
          performanceManager.cleanup();
          logger.info('Performance monitoring cleaned up');
          resolve();
        } catch (error) {
          logger.warn('Error cleaning up performance monitoring', error.message);
          resolve(); // Don't fail shutdown for this
        }
      });
    }, 1000);

    // Handle server errors
    server.on('error', (error) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

      switch (error.code) {
      case 'EACCES':
        logger.error(`${bind} requires elevated privileges`);
        process.exit(1);
        break;
      case 'EADDRINUSE':
        logger.error(`${bind} is already in use`);
        process.exit(1);
        break;
      default:
        logger.error('Server error', error);
        throw error;
      }
    });

    return server;

  } catch (error) {
    logger.fatal('Failed to start server', error);
    process.exit(1);
  }
}

// Start the server
if (require.main === module) {
  startServer().catch((error) => {
    console.error('Fatal error during server startup:', error);
    process.exit(1);
  });
}

// Export app for testing
module.exports = app;