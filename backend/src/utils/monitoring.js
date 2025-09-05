/**
 * Monitoring and Health Check Utilities
 * Comprehensive system monitoring for production deployment
 */

const os = require('os');
const fs = require('fs').promises;
const path = require('path');
const { performance } = require('perf_hooks');
const logger = require('./logger');

/**
 * System Metrics Collector
 */
class MetricsCollector {
  constructor() {
    this.metrics = new Map();
    this.startTime = Date.now();
    this.requestCounts = new Map();
    this.responseTimes = [];
    this.errorCounts = new Map();
  }

  /**
   * Record API request
   */
  recordRequest(method, endpoint, statusCode, responseTime) {
    const key = `${method}:${endpoint}`;
    
    // Update request counts
    this.requestCounts.set(key, (this.requestCounts.get(key) || 0) + 1);
    
    // Update response times (keep last 1000 entries)
    this.responseTimes.push({ endpoint: key, time: responseTime, timestamp: Date.now() });
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000);
    }
    
    // Update error counts
    if (statusCode >= 400) {
      const errorKey = `${key}:${statusCode}`;
      this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);
    }
  }

  /**
   * Get system metrics
   */
  getSystemMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      uptime: {
        process: process.uptime(),
        system: os.uptime()
      },
      memory: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
        systemTotal: os.totalmem(),
        systemFree: os.freemem(),
        systemUsed: os.totalmem() - os.freemem(),
        usagePercent: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100
      },
      cpu: {
        user: cpuUsage.user / 1000000, // Convert to seconds
        system: cpuUsage.system / 1000000,
        cores: os.cpus().length,
        loadAverage: os.loadavg(),
        model: os.cpus()[0]?.model || 'Unknown'
      },
      platform: {
        os: os.platform(),
        arch: os.arch(),
        version: os.release(),
        hostname: os.hostname(),
        node: process.version
      }
    };
  }

  /**
   * Get API metrics
   */
  getApiMetrics() {
    const now = Date.now();
    const last5Min = now - (5 * 60 * 1000);
    const recentResponses = this.responseTimes.filter(r => r.timestamp > last5Min);
    
    return {
      requests: {
        total: Array.from(this.requestCounts.values()).reduce((sum, count) => sum + count, 0),
        byEndpoint: Object.fromEntries(this.requestCounts),
        recentCount: recentResponses.length
      },
      responses: {
        averageTime: recentResponses.length > 0 
          ? recentResponses.reduce((sum, r) => sum + r.time, 0) / recentResponses.length 
          : 0,
        p95: this.calculatePercentile(recentResponses.map(r => r.time), 95),
        p99: this.calculatePercentile(recentResponses.map(r => r.time), 99),
        fastest: recentResponses.length > 0 ? Math.min(...recentResponses.map(r => r.time)) : 0,
        slowest: recentResponses.length > 0 ? Math.max(...recentResponses.map(r => r.time)) : 0
      },
      errors: {
        total: Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0),
        byType: Object.fromEntries(this.errorCounts)
      }
    };
  }

  /**
   * Calculate percentile
   */
  calculatePercentile(values, percentile) {
    if (values.length === 0) return 0;
    
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Reset metrics
   */
  reset() {
    this.requestCounts.clear();
    this.responseTimes = [];
    this.errorCounts.clear();
  }
}

/**
 * Health Check Manager
 */
class HealthCheckManager {
  constructor() {
    this.checks = new Map();
    this.results = new Map();
  }

  /**
   * Register a health check
   */
  register(name, checkFn, options = {}) {
    this.checks.set(name, {
      check: checkFn,
      timeout: options.timeout || 5000,
      critical: options.critical || false,
      interval: options.interval || 30000
    });
  }

  /**
   * Run all health checks
   */
  async runAll() {
    const results = {};
    
    for (const [name, config] of this.checks) {
      try {
        const startTime = performance.now();
        const result = await Promise.race([
          config.check(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Health check timeout')), config.timeout)
          )
        ]);
        
        const duration = performance.now() - startTime;
        
        results[name] = {
          status: 'healthy',
          result,
          duration: Math.round(duration),
          critical: config.critical,
          timestamp: new Date().toISOString()
        };
        
      } catch (error) {
        results[name] = {
          status: 'unhealthy',
          error: error.message,
          critical: config.critical,
          timestamp: new Date().toISOString()
        };
      }
    }
    
    this.results = new Map(Object.entries(results));
    return results;
  }

  /**
   * Get overall system health
   */
  getOverallHealth() {
    const checks = Array.from(this.results.values());
    const unhealthyChecks = checks.filter(check => check.status === 'unhealthy');
    const criticalFailures = unhealthyChecks.filter(check => check.critical);
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    let status = 'healthy';
    if (criticalFailures.length > 0) {
      // In development, treat critical failures as degraded instead of critical
      status = isDevelopment ? 'degraded' : 'critical';
    } else if (unhealthyChecks.length > 0) {
      status = 'degraded';
    }
    
    return {
      status,
      checks: checks.length,
      healthy: checks.filter(c => c.status === 'healthy').length,
      unhealthy: unhealthyChecks.length,
      critical: criticalFailures.length,
      developmentMode: isDevelopment,
      lastCheck: new Date().toISOString()
    };
  }

  /**
   * Get development-friendly health status
   * Returns true if system is healthy enough to continue in development
   */
  isDevelopmentHealthy() {
    if (process.env.NODE_ENV !== 'development') {
      return this.getOverallHealth().status !== 'critical';
    }
    
    // In development, we're more lenient - only fail if we have genuine system issues
    const checks = Array.from(this.results.values());
    const systemFailures = checks.filter(check => 
      check.status === 'unhealthy' && 
      check.error && 
      (check.error.includes('ECONNREFUSED') || 
       check.error.includes('ENOENT') || 
       check.error.includes('timeout'))
    );
    
    return systemFailures.length === 0;
  }
}

/**
 * Default Health Checks
 */
const createDefaultHealthChecks = (healthManager) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Basic system health
  healthManager.register('system', async () => {
    const metrics = metricsCollector.getSystemMetrics();
    
    // More lenient thresholds in development
    const memoryThreshold = isDevelopment ? 95 : 90;
    const cpuThreshold = isDevelopment ? metrics.cpu.cores * 4 : metrics.cpu.cores * 2;
    
    if (metrics.memory.usagePercent > memoryThreshold) {
      throw new Error(`High memory usage: ${metrics.memory.usagePercent.toFixed(1)}%`);
    }
    
    if (metrics.cpu.loadAverage[0] > cpuThreshold) {
      throw new Error(`High CPU load: ${metrics.cpu.loadAverage[0]}`);
    }
    
    return {
      memoryUsage: `${metrics.memory.usagePercent.toFixed(1)}%`,
      cpuLoad: metrics.cpu.loadAverage[0],
      uptime: metrics.uptime.process
    };
  }, { critical: !isDevelopment }); // Non-critical in development

  // Disk space check
  healthManager.register('disk', async () => {
    try {
      const stats = await fs.stat(process.cwd());
      // This is a basic check - in production, use proper disk space monitoring
      return { available: true, path: process.cwd() };
    } catch (error) {
      throw new Error(`Disk access error: ${error.message}`);
    }
  });

  // API responsiveness check
  healthManager.register('api', async () => {
    const metrics = metricsCollector.getApiMetrics();
    
    // More lenient thresholds in development
    const responseTimeThreshold = isDevelopment ? 10000 : 5000;
    const errorRateThreshold = isDevelopment ? 0.25 : 0.1;
    
    if (metrics.responses.averageTime > responseTimeThreshold) {
      throw new Error(`High response time: ${metrics.responses.averageTime.toFixed(0)}ms`);
    }
    
    const errorRate = metrics.errors.total / (metrics.requests.total || 1);
    if (errorRate > errorRateThreshold) {
      throw new Error(`High error rate: ${(errorRate * 100).toFixed(1)}%`);
    }
    
    return {
      averageResponseTime: `${metrics.responses.averageTime.toFixed(0)}ms`,
      errorRate: `${(errorRate * 100).toFixed(2)}%`,
      totalRequests: metrics.requests.total
    };
  }, { critical: !isDevelopment }); // Non-critical in development

  // Environment variables check
  healthManager.register('config', async () => {
    const required = ['NODE_ENV', 'PORT'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing environment variables: ${missing.join(', ')}`);
    }
    
    return {
      environment: process.env.NODE_ENV,
      port: process.env.PORT
    };
  }, { critical: !isDevelopment }); // Non-critical in development
};

/**
 * Performance Monitor
 */
class PerformanceMonitor {
  constructor() {
    this.measurements = new Map();
  }

  /**
   * Start performance measurement
   */
  start(name) {
    this.measurements.set(name, {
      start: performance.now(),
      startMemory: process.memoryUsage().heapUsed
    });
  }

  /**
   * End performance measurement
   */
  end(name) {
    const measurement = this.measurements.get(name);
    if (!measurement) {
      logger.warn('Performance measurement not found', { measurement: name });
      return null;
    }

    const duration = performance.now() - measurement.start;
    const memoryDelta = process.memoryUsage().heapUsed - measurement.startMemory;
    
    this.measurements.delete(name);
    
    const result = {
      name,
      duration: Math.round(duration * 100) / 100,
      memoryDelta: memoryDelta,
      timestamp: new Date().toISOString()
    };

    // Log slow operations
    if (duration > 1000) {
      logger.performance('Slow Operation', duration, {
        operation: name,
        memoryDelta
      });
    }

    return result;
  }

  /**
   * Measure async function
   */
  async measure(name, fn) {
    this.start(name);
    try {
      const result = await fn();
      return result;
    } finally {
      this.end(name);
    }
  }
}

/**
 * Alert Manager
 */
class AlertManager {
  constructor() {
    this.thresholds = new Map();
    this.alerts = new Map();
    this.suppressions = new Map();
  }

  /**
   * Set alert threshold
   */
  setThreshold(metric, threshold, severity = 'warning') {
    this.thresholds.set(metric, { threshold, severity });
  }

  /**
   * Check metric against thresholds
   */
  checkMetric(metric, value, context = {}) {
    const threshold = this.thresholds.get(metric);
    if (!threshold) return;

    const alertKey = `${metric}:${threshold.severity}`;
    const now = Date.now();
    
    // Check if alert is suppressed
    const suppression = this.suppressions.get(alertKey);
    if (suppression && now < suppression.until) {
      return;
    }

    if (value >= threshold.threshold) {
      // Check if we already have an active alert
      const existingAlert = this.alerts.get(alertKey);
      if (!existingAlert || (now - existingAlert.lastSent) > 300000) { // 5 minutes
        this.sendAlert({
          metric,
          value,
          threshold: threshold.threshold,
          severity: threshold.severity,
          context,
          timestamp: new Date().toISOString()
        });
        
        this.alerts.set(alertKey, {
          lastSent: now,
          count: (existingAlert?.count || 0) + 1
        });
      }
    } else {
      // Clear alert if metric is back to normal
      if (this.alerts.has(alertKey)) {
        this.alerts.delete(alertKey);
        logger.info('Alert Cleared', { metric, value, threshold: threshold.threshold });
      }
    }
  }

  /**
   * Send alert (implement your notification system)
   */
  sendAlert(alert) {
    logger.error('System Alert', null, alert);
    
    // Here you would integrate with your notification system
    // Examples: Slack, PagerDuty, email, SMS, etc.
    
    // For now, just log the alert
    console.error('🚨 ALERT:', JSON.stringify(alert, null, 2));
  }

  /**
   * Suppress alerts for a metric
   */
  suppressAlert(metric, severity, durationMs) {
    const alertKey = `${metric}:${severity}`;
    this.suppressions.set(alertKey, {
      until: Date.now() + durationMs
    });
  }
}

// Create singleton instances
const metricsCollector = new MetricsCollector();
const healthCheckManager = new HealthCheckManager();
const performanceMonitor = new PerformanceMonitor();
const alertManager = new AlertManager();

// Initialize default health checks
createDefaultHealthChecks(healthCheckManager);

// Set up default alert thresholds
alertManager.setThreshold('memory_usage', 85, 'warning');
alertManager.setThreshold('memory_usage', 95, 'critical');
alertManager.setThreshold('cpu_load', 80, 'warning');
alertManager.setThreshold('response_time', 2000, 'warning');
alertManager.setThreshold('error_rate', 5, 'warning');

// Periodic monitoring
const startPeriodicMonitoring = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Run health checks every minute (or every 2 minutes in development)
  const healthCheckInterval = isDevelopment ? 120000 : 60000;
  setInterval(async () => {
    try {
      await healthCheckManager.runAll();
      const health = healthCheckManager.getOverallHealth();
      
      if (health.status !== 'healthy') {
        const logLevel = isDevelopment && health.status === 'degraded' ? 'debug' : 'warn';
        logger[logLevel]('System Health Check', { 
          health,
          developmentMode: isDevelopment,
          note: isDevelopment ? 'Health checks are more lenient in development' : undefined
        });
      }
    } catch (error) {
      logger.error('Health check failed', error);
    }
  }, healthCheckInterval);

  // Monitor metrics every 30 seconds
  setInterval(() => {
    try {
      const systemMetrics = metricsCollector.getSystemMetrics();
      const apiMetrics = metricsCollector.getApiMetrics();
      
      // Check alerts
      alertManager.checkMetric('memory_usage', systemMetrics.memory.usagePercent);
      alertManager.checkMetric('cpu_load', systemMetrics.cpu.loadAverage[0]);
      alertManager.checkMetric('response_time', apiMetrics.responses.averageTime);
      
      const errorRate = (apiMetrics.errors.total / (apiMetrics.requests.total || 1)) * 100;
      alertManager.checkMetric('error_rate', errorRate);
      
    } catch (error) {
      logger.error('Metrics monitoring failed', error);
    }
  }, 30000);
};

module.exports = {
  metricsCollector,
  healthCheckManager,
  performanceMonitor,
  alertManager,
  MetricsCollector,
  HealthCheckManager,
  PerformanceMonitor,
  AlertManager,
  startPeriodicMonitoring
};