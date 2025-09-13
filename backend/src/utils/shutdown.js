/**
 * Railway-Optimized Graceful Shutdown Manager
 * Handles clean shutdown with Railway's deployment constraints
 */

const logger = require('./logger');
const { env, isRailway } = require('../config/environment');

/**
 * Graceful Shutdown Manager for Railway
 */
class ShutdownManager {
  constructor() {
    this.isShuttingDown = false;
    this.cleanupTasks = new Map();
    this.forceExitTimer = null;
  }

  /**
   * Register a cleanup task
   */
  registerCleanupTask(name, task, timeout = 5000) {
    this.cleanupTasks.set(name, {
      task,
      timeout,
      completed: false
    });
    
    logger.debug('Registered cleanup task', { name, timeout });
  }

  /**
   * Start graceful shutdown process
   */
  async startShutdown(signal = 'SHUTDOWN') {
    if (this.isShuttingDown) {
      logger.warn('Shutdown already in progress, ignoring signal', { signal });
      return;
    }

    this.isShuttingDown = true;
    const shutdownStart = Date.now();
    
    logger.info('🛑 Starting graceful shutdown', {
      signal,
      platform: isRailway ? 'Railway' : 'Local',
      registeredTasks: this.cleanupTasks.size
    });

    // Railway has stricter shutdown timeouts
    const totalTimeout = env.get('SHUTDOWN_TIMEOUT');
    
    // Set force exit timer
    this.forceExitTimer = setTimeout(() => {
      logger.error('⚠️ Forced shutdown after timeout', { 
        timeout: totalTimeout,
        duration: Date.now() - shutdownStart
      });
      
      if (isRailway) {
        console.log('❌ Railway forced shutdown');
      }
      
      process.exit(1);
    }, totalTimeout);

    try {
      // Execute cleanup tasks in parallel with individual timeouts
      const cleanupPromises = Array.from(this.cleanupTasks.entries()).map(([name, config]) => 
        this.executeCleanupTask(name, config)
      );

      // Wait for all cleanup tasks with a shorter timeout for Railway
      const cleanupTimeout = Math.min(totalTimeout - 1000, 8000); // Leave 1s buffer
      
      await Promise.race([
        Promise.allSettled(cleanupPromises),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Cleanup timeout')), cleanupTimeout)
        )
      ]);

      const shutdownDuration = Date.now() - shutdownStart;
      
      logger.info('✅ Graceful shutdown completed', {
        duration: `${shutdownDuration}ms`,
        completedTasks: Array.from(this.cleanupTasks.values()).filter(t => t.completed).length,
        totalTasks: this.cleanupTasks.size
      });

      if (isRailway) {
        console.log(`✅ Railway graceful shutdown (${shutdownDuration}ms)`);
      }

      // Clear force exit timer
      if (this.forceExitTimer) {
        clearTimeout(this.forceExitTimer);
        this.forceExitTimer = null;
      }

      process.exit(0);

    } catch (error) {
      const shutdownDuration = Date.now() - shutdownStart;
      
      logger.error('❌ Shutdown error occurred', error, {
        duration: `${shutdownDuration}ms`,
        completedTasks: Array.from(this.cleanupTasks.values()).filter(t => t.completed).length
      });

      if (isRailway) {
        console.log(`❌ Railway shutdown error (${shutdownDuration}ms)`);
      }

      process.exit(1);
    }
  }

  /**
   * Execute a single cleanup task with timeout
   */
  async executeCleanupTask(name, config) {
    const taskStart = Date.now();
    
    try {
      logger.debug('Executing cleanup task', { name });
      
      await Promise.race([
        config.task(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Task timeout: ${name}`)), config.timeout)
        )
      ]);

      config.completed = true;
      const taskDuration = Date.now() - taskStart;
      
      logger.debug('Cleanup task completed', { 
        name, 
        duration: `${taskDuration}ms` 
      });

    } catch (error) {
      const taskDuration = Date.now() - taskStart;
      
      logger.warn('Cleanup task failed', error, {
        name,
        duration: `${taskDuration}ms`,
        timeout: config.timeout
      });

      // Mark as completed even if failed to prevent hanging
      config.completed = true;
    }
  }

  /**
   * Setup Railway-optimized shutdown handlers
   */
  setupShutdownHandlers() {
    // Railway primarily uses SIGTERM
    process.on('SIGTERM', () => {
      this.startShutdown('SIGTERM');
    });

    // Handle SIGINT for local development
    process.on('SIGINT', () => {
      this.startShutdown('SIGINT');
    });

    // Handle uncaught exceptions gracefully
    process.on('uncaughtException', (error) => {
      logger.fatal('Uncaught exception, initiating emergency shutdown', error);
      
      if (isRailway) {
        console.log('❌ Railway uncaught exception shutdown');
      }
      
      // Quick exit on uncaught exception
      setTimeout(() => process.exit(1), 1000);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled promise rejection', new Error(reason), {
        promise: promise.toString()
      });
      
      // Don't exit on unhandled rejection in production, just log it
      if (!env.isProduction()) {
        setTimeout(() => process.exit(1), 1000);
      }
    });

    // Railway-specific: Handle memory pressure
    if (isRailway) {
      const memoryThreshold = env.get('MAX_MEMORY_USAGE') * 1024 * 1024; // Convert MB to bytes
      
      setInterval(() => {
        const memUsage = process.memoryUsage();
        if (memUsage.heapUsed > memoryThreshold * 0.9) { // 90% of limit
          logger.warn('High memory usage detected', {
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
            threshold: Math.round(memoryThreshold / 1024 / 1024) + 'MB',
            percentage: ((memUsage.heapUsed / memoryThreshold) * 100).toFixed(1) + '%'
          });
          
          // Force garbage collection if available
          if (global.gc) {
            global.gc();
            logger.info('Forced garbage collection due to memory pressure');
          }
        }
      }, env.get('GC_INTERVAL'));
    }

    logger.info('Shutdown handlers configured', {
      platform: isRailway ? 'Railway' : 'Local',
      timeout: env.get('SHUTDOWN_TIMEOUT'),
      memoryLimit: isRailway ? env.get('MAX_MEMORY_USAGE') + 'MB' : 'No limit'
    });
  }

  /**
   * Check if shutdown is in progress
   */
  isShutdownInProgress() {
    return this.isShuttingDown;
  }

  /**
   * Get shutdown status
   */
  getStatus() {
    return {
      isShuttingDown: this.isShuttingDown,
      registeredTasks: this.cleanupTasks.size,
      completedTasks: Array.from(this.cleanupTasks.values()).filter(t => t.completed).length,
      platform: isRailway ? 'Railway' : 'Local'
    };
  }
}

// Create singleton instance
const shutdownManager = new ShutdownManager();

module.exports = {
  shutdownManager,
  ShutdownManager
};