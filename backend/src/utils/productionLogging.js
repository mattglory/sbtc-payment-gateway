/**
 * Production Logging and Monitoring Utilities
 * Enhanced logging, metrics, and monitoring for Railway production deployment
 */

const logger = require('./logger');

class ProductionLogger {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      bitcoinRequests: 0,
      bitcoinErrors: 0,
      paymentIntents: 0,
      deploymentStart: new Date()
    };
    
    this.errorFrequency = new Map(); // Track error frequency for alerting
    this.performanceMetrics = new Map(); // Track operation performance
    
    // Start periodic metrics logging in production
    if (process.env.NODE_ENV === 'production') {
      this.startMetricsReporting();
    }
  }

  /**
   * Log production metrics periodically
   */
  startMetricsReporting() {
    setInterval(() => {
      this.logProductionMetrics();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Log comprehensive production metrics
   */
  logProductionMetrics() {
    const uptime = Math.floor((new Date() - this.metrics.deploymentStart) / 1000);
    const memoryUsage = process.memoryUsage();
    
    logger.info('Production Metrics Report', {
      deployment: {
        uptime: `${uptime}s`,
        environment: process.env.NODE_ENV,
        service: 'sBTC-Payment-Gateway',
        version: process.env.APP_VERSION || '1.0.0'
      },
      requests: {
        total: this.metrics.requests,
        errors: this.metrics.errors,
        errorRate: this.getErrorRate(),
        bitcoin: {
          requests: this.metrics.bitcoinRequests,
          errors: this.metrics.bitcoinErrors,
          errorRate: this.getBitcoinErrorRate()
        }
      },
      payments: {
        intentsCreated: this.metrics.paymentIntents
      },
      system: {
        memoryUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
        memoryTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
        memoryUsage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100) + '%'
      },
      topErrors: this.getTopErrors()
    });
  }

  /**
   * Record API request
   */
  recordRequest() {
    this.metrics.requests++;
  }

  /**
   * Record API error with alerting
   */
  recordError(error, context = {}) {
    this.metrics.errors++;
    
    const errorKey = error.name || 'UnknownError';
    const count = this.errorFrequency.get(errorKey) || 0;
    this.errorFrequency.set(errorKey, count + 1);
    
    // Log structured error for production monitoring
    logger.error('Production Error', {
      error: {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
      },
      context,
      frequency: count + 1,
      errorRate: this.getErrorRate(),
      timestamp: new Date().toISOString()
    });
    
    // Alert on high error frequency
    if (count > 10 && count % 10 === 0) {
      this.alertHighErrorFrequency(errorKey, count);
    }
  }

  /**
   * Record Bitcoin operation
   */
  recordBitcoinRequest() {
    this.metrics.bitcoinRequests++;
  }

  /**
   * Record Bitcoin error
   */
  recordBitcoinError(error, context = {}) {
    this.metrics.bitcoinErrors++;
    this.recordError(error, { ...context, service: 'Bitcoin' });
  }

  /**
   * Record payment intent creation
   */
  recordPaymentIntent() {
    this.metrics.paymentIntents++;
  }

  /**
   * Record performance metric
   */
  recordPerformance(operation, duration, success = true) {
    const key = `${operation}_${success ? 'success' : 'failure'}`;
    const existing = this.performanceMetrics.get(key) || { count: 0, totalTime: 0 };
    
    this.performanceMetrics.set(key, {
      count: existing.count + 1,
      totalTime: existing.totalTime + duration,
      avgTime: (existing.totalTime + duration) / (existing.count + 1),
      lastRecorded: new Date()
    });
    
    // Log slow operations
    if (duration > 10000) { // 10 seconds
      logger.warn('Slow Operation Detected', {
        operation,
        duration: `${duration}ms`,
        success,
        context: 'Performance monitoring'
      });
    }
  }

  /**
   * Get overall error rate
   */
  getErrorRate() {
    if (this.metrics.requests === 0) return 0;
    return ((this.metrics.errors / this.metrics.requests) * 100).toFixed(2) + '%';
  }

  /**
   * Get Bitcoin error rate
   */
  getBitcoinErrorRate() {
    if (this.metrics.bitcoinRequests === 0) return 0;
    return ((this.metrics.bitcoinErrors / this.metrics.bitcoinRequests) * 100).toFixed(2) + '%';
  }

  /**
   * Get top error types
   */
  getTopErrors() {
    const sorted = Array.from(this.errorFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    return sorted.map(([error, count]) => ({ error, count }));
  }

  /**
   * Alert on high error frequency
   */
  alertHighErrorFrequency(errorType, count) {
    logger.error('High Error Frequency Alert', {
      errorType,
      count,
      threshold: 10,
      action: 'Investigation Required',
      timestamp: new Date().toISOString(),
      alert: true
    });
  }

  /**
   * Log deployment event
   */
  logDeployment() {
    logger.info('Production Deployment Started', {
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || '1.0.0',
      railway: {
        serviceName: process.env.RAILWAY_SERVICE_NAME,
        projectName: process.env.RAILWAY_PROJECT_NAME,
        environment: process.env.RAILWAY_ENVIRONMENT
      },
      configuration: {
        bitcoinNetwork: process.env.BITCOIN_NETWORK,
        stacksNetwork: process.env.STACKS_NETWORK,
        demoMode: process.env.DEMO_MODE === 'true',
        port: process.env.PORT
      }
    });
  }

  /**
   * Log critical system events
   */
  logCriticalEvent(event, data = {}) {
    logger.error('Critical System Event', {
      event,
      data,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((new Date() - this.metrics.deploymentStart) / 1000),
      critical: true
    });
  }

  /**
   * Create performance timing wrapper
   */
  timeOperation(operation) {
    const startTime = Date.now();
    
    return {
      end: (success = true) => {
        const duration = Date.now() - startTime;
        this.recordPerformance(operation, duration, success);
        return duration;
      }
    };
  }

  /**
   * Log database connection events
   */
  logDatabaseEvent(event, details = {}) {
    logger.info('Database Event', {
      event,
      details,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });
  }

  /**
   * Log Bitcoin monitoring events
   */
  logBitcoinEvent(event, paymentId, details = {}) {
    logger.info('Bitcoin Monitoring Event', {
      event,
      paymentId: paymentId ? paymentId.substring(0, 12) + '...' : null,
      details,
      network: process.env.BITCOIN_NETWORK,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get current metrics summary
   */
  getMetricsSummary() {
    return {
      ...this.metrics,
      errorRate: this.getErrorRate(),
      bitcoinErrorRate: this.getBitcoinErrorRate(),
      uptime: Math.floor((new Date() - this.metrics.deploymentStart) / 1000),
      topErrors: this.getTopErrors(),
      performance: Object.fromEntries(this.performanceMetrics)
    };
  }
}

// Export singleton instance
const productionLogger = new ProductionLogger();

// Log deployment start
if (process.env.NODE_ENV === 'production') {
  productionLogger.logDeployment();
}

module.exports = productionLogger;