/**
 * Railway Performance Optimization Utilities
 * Memory and CPU optimization for Railway deployment constraints
 */

const logger = require('./logger');
const { env, isRailway } = require('../config/environment');

/**
 * Railway Performance Manager
 */
class PerformanceManager {
  constructor() {
    this.memoryStats = {
      peak: 0,
      warnings: 0,
      lastGC: Date.now()
    };
    
    this.cpuStats = {
      highUsagePeriods: 0,
      lastCheck: Date.now()
    };
    
    this.intervals = new Set();
  }

  /**
   * Initialize Railway-specific optimizations
   */
  initialize() {
    if (!isRailway) {
      logger.debug('Skipping Railway optimizations - not running on Railway');
      return;
    }

    logger.info('Initializing Railway performance optimizations', {
      memoryLimit: env.get('MAX_MEMORY_USAGE') + 'MB',
      gcInterval: env.get('GC_INTERVAL') + 'ms'
    });

    this.setupMemoryOptimizations();
    this.setupCPUOptimizations();
    this.setupNodeJSOptimizations();
    this.startMonitoring();

    logger.info('Railway performance optimizations active');
  }

  /**
   * Setup memory optimizations
   */
  setupMemoryOptimizations() {
    // Enable garbage collection exposure if available
    if (global.gc) {
      logger.info('Garbage collection available, enabling automatic GC');
    } else {
      logger.warn('Garbage collection not exposed, run with --expose-gc for better memory management');
    }

    // Set up memory pressure handling
    const memoryLimitMB = env.get('MAX_MEMORY_USAGE');
    const memoryLimitBytes = memoryLimitMB * 1024 * 1024;
    
    // Force GC at 80% memory usage
    const gcThreshold = memoryLimitBytes * 0.8;
    
    const memoryCheckInterval = setInterval(() => {
      const memUsage = process.memoryUsage();
      
      // Track peak memory usage
      if (memUsage.heapUsed > this.memoryStats.peak) {
        this.memoryStats.peak = memUsage.heapUsed;
      }
      
      const usagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      const limitPercent = (memUsage.heapUsed / memoryLimitBytes) * 100;
      
      // Force GC if approaching limits
      if (memUsage.heapUsed > gcThreshold && global.gc) {
        const timeSinceLastGC = Date.now() - this.memoryStats.lastGC;
        
        // Don't GC too frequently (minimum 30s interval)
        if (timeSinceLastGC > 30000) {
          logger.info('Forcing garbage collection due to memory pressure', {
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
            limitPercent: limitPercent.toFixed(1) + '%',
            timeSinceLastGC: timeSinceLastGC + 'ms'
          });
          
          global.gc();
          this.memoryStats.lastGC = Date.now();
        }
      }
      
      // Log warnings at 85% of Railway limit
      if (limitPercent > 85) {
        this.memoryStats.warnings++;
        
        if (this.memoryStats.warnings % 10 === 1) { // Log every 10th warning to avoid spam
          logger.warn('High memory usage on Railway', {
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
            limit: memoryLimitMB + 'MB',
            limitPercent: limitPercent.toFixed(1) + '%',
            warningCount: this.memoryStats.warnings
          });
        }
      }
      
    }, 15000); // Check every 15 seconds
    
    this.intervals.add(memoryCheckInterval);
  }

  /**
   * Setup CPU optimizations
   */
  setupCPUOptimizations() {
    // Monitor CPU usage and adjust timeouts dynamically
    const cpuCheckInterval = setInterval(() => {
      const cpuUsage = process.cpuUsage();
      const totalUsage = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds
      
      // Simple CPU load estimation (not perfect, but useful)
      const timeDiff = Date.now() - this.cpuStats.lastCheck;
      const cpuPercent = (totalUsage / (timeDiff / 1000)) * 100;
      
      if (cpuPercent > 80) {
        this.cpuStats.highUsagePeriods++;
        
        if (this.cpuStats.highUsagePeriods % 5 === 1) { // Log every 5th occurrence
          logger.warn('High CPU usage detected', {
            cpuPercent: cpuPercent.toFixed(1) + '%',
            highUsagePeriods: this.cpuStats.highUsagePeriods
          });
        }
      }
      
      this.cpuStats.lastCheck = Date.now();
    }, 30000); // Check every 30 seconds
    
    this.intervals.add(cpuCheckInterval);
  }

  /**
   * Setup Node.js specific optimizations
   */
  setupNodeJSOptimizations() {
    // Optimize libuv thread pool for Railway's single-core environment
    process.env.UV_THREADPOOL_SIZE = process.env.UV_THREADPOOL_SIZE || '4';
    
    // Optimize V8 heap settings for Railway
    if (isRailway && !process.execArgv.some(arg => arg.includes('--max-old-space-size'))) {
      logger.warn('Consider setting --max-old-space-size to match Railway memory limits', {
        recommendedValue: env.get('MAX_MEMORY_USAGE') - 50, // Leave 50MB buffer
        currentLimit: 'default'
      });
    }

    // Set process priority for Railway (if supported)
    try {
      if (process.platform !== 'win32') {
        const os = require('os');
        // Slightly lower priority to be Railway-friendly
        process.setpriority?.(process.pid, 5);
      }
    } catch (error) {
      logger.debug('Could not adjust process priority', error.message);
    }
  }

  /**
   * Start performance monitoring
   */
  startMonitoring() {
    const monitoringInterval = setInterval(() => {
      this.logPerformanceMetrics();
    }, 300000); // Every 5 minutes
    
    this.intervals.add(monitoringInterval);
  }

  /**
   * Log performance metrics
   */
  logPerformanceMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const uptime = process.uptime();
    
    const memLimitMB = env.get('MAX_MEMORY_USAGE');
    const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const memUsagePercent = (memUsage.heapUsed / (memLimitMB * 1024 * 1024)) * 100;
    
    logger.info('Railway performance metrics', {
      memory: {
        used: memUsageMB + 'MB',
        limit: memLimitMB + 'MB',
        percentage: memUsagePercent.toFixed(1) + '%',
        peak: Math.round(this.memoryStats.peak / 1024 / 1024) + 'MB'
      },
      cpu: {
        user: Math.round(cpuUsage.user / 1000000) + 's',
        system: Math.round(cpuUsage.system / 1000000) + 's'
      },
      system: {
        uptime: Math.round(uptime) + 's',
        warnings: this.memoryStats.warnings,
        highCpuPeriods: this.cpuStats.highUsagePeriods
      }
    });
  }

  /**
   * Force garbage collection if available
   */
  forceGC(reason = 'manual') {
    if (global.gc) {
      const beforeMem = process.memoryUsage().heapUsed;
      global.gc();
      const afterMem = process.memoryUsage().heapUsed;
      const freed = beforeMem - afterMem;
      
      this.memoryStats.lastGC = Date.now();
      
      logger.info('Forced garbage collection', {
        reason,
        beforeMB: Math.round(beforeMem / 1024 / 1024),
        afterMB: Math.round(afterMem / 1024 / 1024),
        freedMB: Math.round(freed / 1024 / 1024)
      });
      
      return freed;
    } else {
      logger.warn('Garbage collection not available');
      return 0;
    }
  }

  /**
   * Get performance status
   */
  getStatus() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        limit: env.get('MAX_MEMORY_USAGE'),
        peak: Math.round(this.memoryStats.peak / 1024 / 1024),
        warnings: this.memoryStats.warnings,
        gcAvailable: !!global.gc
      },
      cpu: {
        user: Math.round(cpuUsage.user / 1000000),
        system: Math.round(cpuUsage.system / 1000000),
        highUsagePeriods: this.cpuStats.highUsagePeriods
      },
      uptime: Math.round(process.uptime()),
      platform: {
        railway: isRailway,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };
  }

  /**
   * Cleanup performance monitoring
   */
  cleanup() {
    for (const interval of this.intervals) {
      clearInterval(interval);
    }
    this.intervals.clear();
    
    logger.info('Performance monitoring cleaned up');
  }

  /**
   * Get Railway-specific recommendations
   */
  getOptimizationRecommendations() {
    const recommendations = [];
    
    if (!global.gc) {
      recommendations.push({
        type: 'memory',
        priority: 'high',
        message: 'Run with --expose-gc flag for better memory management on Railway',
        command: 'node --expose-gc server.js'
      });
    }
    
    const memUsage = process.memoryUsage();
    const memLimitBytes = env.get('MAX_MEMORY_USAGE') * 1024 * 1024;
    const memUsagePercent = (memUsage.heapUsed / memLimitBytes) * 100;
    
    if (memUsagePercent > 70) {
      recommendations.push({
        type: 'memory',
        priority: 'medium',
        message: `Memory usage is ${memUsagePercent.toFixed(1)}%, consider optimizing memory usage`,
        suggestions: [
          'Review object caching strategies',
          'Implement connection pooling limits',
          'Use streaming for large responses'
        ]
      });
    }
    
    if (!process.execArgv.some(arg => arg.includes('--max-old-space-size'))) {
      recommendations.push({
        type: 'memory',
        priority: 'medium',
        message: 'Set explicit V8 heap limit for Railway',
        command: `node --max-old-space-size=${env.get('MAX_MEMORY_USAGE') - 50} server.js`
      });
    }
    
    return recommendations;
  }
}

// Create singleton instance
const performanceManager = new PerformanceManager();

module.exports = {
  performanceManager,
  PerformanceManager
};