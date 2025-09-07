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

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

/**
 * Server initialization with proper error handling
 */
async function startServer() {
  try {
    // Setup global error handlers
    setupGlobalErrorHandlers();

    // Initialize monitoring
    logger.info('Initializing monitoring systems...');
    startPeriodicMonitoring();

    // Run initial health checks
    logger.info('Running initial health checks...');
    const healthResults = await healthCheckManager.runAll();
    const overallHealth = healthCheckManager.getOverallHealth();
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (!isDevelopment && overallHealth.status === 'critical') {
      logger.error('Critical health check failures detected in production', { healthResults });
      process.exit(1);
    }

    if (isDevelopment) {
      const developmentHealthy = healthCheckManager.isDevelopmentHealthy();
      if (!developmentHealthy) {
        logger.error('Genuine system failures detected in development', { healthResults });
        logger.info('💡 Development tip: Check for connection issues, missing files, or system problems');
        process.exit(1);
      }
      
      if (overallHealth.status !== 'healthy') {
        logger.warn('Some health checks failed but continuing in development mode', { 
          healthResults,
          tip: 'Health checks are more lenient in development. Use NODE_ENV=production for strict checks.'
        });
      }
    } else if (overallHealth.status === 'degraded') {
      logger.warn('Some health checks failed but continuing startup', { healthResults });
    }

    // Start HTTP server
    const server = app.listen(PORT, HOST, () => {
      const serverInfo = {
        port: PORT,
        host: HOST,
        environment: process.env.NODE_ENV || 'development',
        network: process.env.NODE_ENV === 'production' ? 'mainnet' : 'testnet',
        contract: `${process.env.CONTRACT_ADDRESS || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'}.sbtc-payment-gateway`,
        demoMode: process.env.DEMO_MODE === 'true',
        configuredApiKeys: process.env.API_KEYS ? process.env.API_KEYS.split(',').length : 0,
        healthEndpoint: `http://localhost:${PORT}/health`,
        timestamp: new Date().toISOString()
      };

      logger.info('🚀 sBTC Payment Gateway API Server Started', serverInfo);
      
      console.log('\n🎉 sBTC Payment Gateway - Ready for Business!');
      console.log('===============================================');
      console.log(`🚀 Server: http://${HOST}:${PORT}`);
      console.log(`📊 Health: http://localhost:${PORT}/health`);
      console.log(`🏗️  Network: ${serverInfo.network}`);
      console.log(`📝 Contract: ${serverInfo.contract}`);
      console.log(`🔑 Demo Mode: ${serverInfo.demoMode ? 'ENABLED' : 'DISABLED'}`);
      console.log(`🔐 API Keys: ${serverInfo.configuredApiKeys > 0 ? serverInfo.configuredApiKeys : 'Demo mode'}`);
      
      if (process.env.DEMO_MODE === 'true') {
        const demoKeys = ['pk_test_demo', 'pk_test_your_key', 'pk_test_123'];
        console.log(`🧪 Demo Keys: ${demoKeys.join(', ')}`);
      }
      
      console.log('===============================================');
      console.log('🏆 Built for Stacks Builders Competition');
      console.log('💰 Making Bitcoin payments as simple as Stripe');
      console.log('===============================================\n');

      logger.info('Server startup completed successfully');
    });

    // Graceful shutdown handling
    const shutdown = (signal) => {
      logger.info(`${signal} received, shutting down gracefully...`);
      
      server.close(async (err) => {
        if (err) {
          logger.error('Error during server shutdown', err);
          process.exit(1);
        }

        logger.info('HTTP server closed');
        
        try {
          // Perform cleanup operations
          logger.info('Performing cleanup operations...');
          
          // Add any cleanup logic here (close database connections, etc.)
          
          logger.info('Cleanup completed successfully');
          process.exit(0);
        } catch (cleanupError) {
          logger.error('Error during cleanup', cleanupError);
          process.exit(1);
        }
      });

      // Force exit after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

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