/**
 * Database Utilities for Railway Deployment
 * Safe initialization and health monitoring for database connections
 */

const database = require('../config/database');
const logger = require('./logger');

/**
 * Database Health Check
 */
async function databaseHealthCheck() {
  try {
    if (!database.isConnected) {
      throw new Error('Database not initialized');
    }
    
    const health = await database.healthCheck();
    
    if (health.status !== 'healthy') {
      throw new Error(`Database unhealthy: ${health.message}`);
    }
    
    return {
      database: health.database,
      responseTime: health.responseTime,
      status: 'healthy'
    };
  } catch (error) {
    throw new Error(`Database health check failed: ${error.message}`);
  }
}

/**
 * Safe Database Initialization
 * Handles both PostgreSQL and SQLite with proper error handling
 */
async function initializeDatabase() {
  const maxRetries = 3;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      logger.info(`Database initialization attempt ${retryCount + 1}/${maxRetries}`);
      
      // Initialize database connection
      await database.initialize();
      
      // Verify connection health
      const health = await database.healthCheck();
      if (health.status !== 'healthy') {
        throw new Error(`Database health check failed: ${health.message}`);
      }
      
      logger.info('Database initialized successfully', {
        database: health.database,
        responseTime: health.responseTime,
        attempt: retryCount + 1
      });
      
      return {
        success: true,
        database: health.database,
        responseTime: health.responseTime
      };
      
    } catch (error) {
      retryCount++;
      
      if (retryCount >= maxRetries) {
        logger.error('Database initialization failed after all retries', error, {
          attempts: retryCount,
          maxRetries
        });
        throw new Error(`Database initialization failed: ${error.message}`);
      }
      
      logger.warn(`Database initialization attempt ${retryCount} failed, retrying...`, {
        error: error.message,
        nextAttempt: retryCount + 1,
        maxRetries
      });
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
    }
  }
}

/**
 * Database Connection Manager
 * Provides safe database operations with connection pooling
 */
class DatabaseManager {
  constructor() {
    this.isInitialized = false;
    this.database = database;
  }

  /**
   * Initialize database safely
   */
  async initialize() {
    if (this.isInitialized) {
      logger.debug('Database already initialized');
      return;
    }

    try {
      await initializeDatabase();
      this.isInitialized = true;
    } catch (error) {
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * Check if database is initialized
   */
  checkInitialized() {
    return this.isInitialized;
  }

  /**
   * Execute query with error handling
   */
  async query(text, params = []) {
    if (!this.isInitialized) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    try {
      return await this.database.query(text, params);
    } catch (error) {
      logger.error('Database query failed', error, {
        query: text.substring(0, 100),
        paramsCount: params.length
      });
      throw error;
    }
  }

  /**
   * Execute transaction with error handling
   */
  async transaction(callback) {
    if (!this.isInitialized) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    try {
      return await this.database.transaction(callback);
    } catch (error) {
      logger.error('Database transaction failed', error);
      throw error;
    }
  }

  /**
   * Get connection status
   */
  async getStatus() {
    try {
      if (!this.isInitialized) {
        return {
          status: 'not_initialized',
          message: 'Database not initialized'
        };
      }

      const health = await this.database.healthCheck();
      return health;
    } catch (error) {
      return {
        status: 'error',
        message: error.message
      };
    }
  }

  /**
   * Close database connections safely
   */
  async close() {
    if (this.isInitialized) {
      try {
        await this.database.close();
        this.isInitialized = false;
        logger.info('Database connections closed');
      } catch (error) {
        logger.error('Error closing database connections', error);
        throw error;
      }
    }
  }
}

// Create singleton instance
const databaseManager = new DatabaseManager();

module.exports = {
  databaseManager,
  initializeDatabase,
  databaseHealthCheck,
  DatabaseManager
};