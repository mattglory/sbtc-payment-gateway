/**
 * Database Configuration
 * Production-ready PostgreSQL connection with SQLite fallback
 */

const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class DatabaseConfig {
  constructor() {
    this.pool = null;
    this.sqliteDb = null;
    this.isConnected = false;
    this.usingPostgres = false;
    this.usingSqlite = false;
  }

  /**
   * Initialize database connection with PostgreSQL/SQLite fallback
   */
  async initialize() {
    // First try PostgreSQL
    try {
      await this.initializePostgres();
      this.usingPostgres = true;
      this.isConnected = true;
      logger.info('Successfully connected to PostgreSQL database');
      return;
    } catch (pgError) {
      logger.warn('PostgreSQL connection failed, attempting SQLite fallback', pgError.message);
      
      // Fall back to SQLite
      try {
        await this.initializeSqlite();
        this.usingSqlite = true;
        this.isConnected = true;
        logger.info('Successfully fell back to SQLite database');
      } catch (sqliteError) {
        logger.error('Both PostgreSQL and SQLite initialization failed', {
          postgresError: pgError.message,
          sqliteError: sqliteError.message
        });
        throw new Error('Unable to connect to any database');
      }
    }
  }

  /**
   * Initialize PostgreSQL connection
   */
  async initializePostgres() {
    const config = {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'sbtc_gateway',
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT || '5432'),
      
      // Connection pool settings
      max: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
      min: parseInt(process.env.DB_MIN_CONNECTIONS || '5'),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000'), // Reduced for faster fallback
      
      // SSL configuration for production
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
      } : false,
      
      // Query timeout
      query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000'),
      
      // Connection retry
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    };

    this.pool = new Pool(config);
    
    // Test connection with timeout
    await Promise.race([
      this.testPostgresConnection(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 5000))
    ]);
    
    // Set up connection event handlers
    this.setupPostgresEventHandlers();
    
    logger.info('PostgreSQL connection pool initialized successfully', {
      host: config.host,
      port: config.port,
      database: config.database,
      maxConnections: config.max,
      minConnections: config.min
    });
  }

  /**
   * Load SQLite schema
   */
  async loadSqliteSchema() {
    return new Promise((resolve, reject) => {
      const schemaPath = path.join(process.cwd(), 'database', 'schema.sqlite.minimal.sql');
      
      if (!fs.existsSync(schemaPath)) {
        logger.warn('SQLite schema file not found, skipping schema initialization', { schemaPath });
        resolve();
        return;
      }

      fs.readFile(schemaPath, 'utf8', (err, schema) => {
        if (err) {
          logger.error('Failed to read SQLite schema file', err);
          reject(err);
          return;
        }

        // Split schema into individual statements and execute them
        // Handle multi-line statements properly
        const statements = schema
          .replace(/--[^\n\r]*/g, '') // Remove single-line comments
          .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
          .split(';')
          .map(stmt => stmt.trim().replace(/\s+/g, ' '))
          .filter(stmt => stmt.length > 3); // Filter out empty statements

        let executed = 0;
        const total = statements.length;

        if (total === 0) {
          resolve();
          return;
        }

        const executeNext = () => {
          if (executed >= total) {
            logger.info('SQLite schema loaded successfully', { statements: executed });
            resolve();
            return;
          }

          const statement = statements[executed];
          this.sqliteDb.run(statement, (err) => {
            if (err) {
              logger.error('Failed to execute schema statement', err, { statement: statement.substring(0, 100) });
              reject(err);
            } else {
              executed++;
              executeNext();
            }
          });
        };

        executeNext();
      });
    });
  }

  /**
   * Initialize SQLite connection
   */
  async initializeSqlite() {
    return new Promise((resolve, reject) => {
      const dbDir = path.join(process.cwd(), 'data');
      const dbPath = path.join(dbDir, 'sbtc_gateway.sqlite');
      
      // Ensure data directory exists
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      this.sqliteDb = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          logger.error('Failed to connect to SQLite database', err);
          reject(err);
        } else {
          logger.info('SQLite database connected successfully', { dbPath });
          
          // Enable foreign keys
          this.sqliteDb.run('PRAGMA foreign_keys = ON;', (err) => {
            if (err) {
              logger.error('Failed to enable foreign keys', err);
              reject(err);
            } else {
              // Load the SQLite schema
              this.loadSqliteSchema()
                .then(() => resolve())
                .catch(reject);
            }
          });
        }
      });
    });
  }

  /**
   * Test PostgreSQL connection
   */
  async testPostgresConnection() {
    try {
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
      client.release();
      
      logger.info('PostgreSQL connection test successful', {
        currentTime: result.rows[0].current_time,
        postgresVersion: result.rows[0].pg_version.split(' ')[0]
      });
      
      return true;
    } catch (error) {
      logger.error('PostgreSQL connection test failed', error);
      throw error;
    }
  }

  /**
   * Test database connection (works with both PostgreSQL and SQLite)
   */
  async testConnection() {
    if (this.usingPostgres) {
      return this.testPostgresConnection();
    } else if (this.usingSqlite) {
      return this.testSqliteConnection();
    } else {
      throw new Error('No database connection available');
    }
  }

  /**
   * Test SQLite connection
   */
  async testSqliteConnection() {
    return new Promise((resolve, reject) => {
      this.sqliteDb.get('SELECT datetime("now") as current_time, sqlite_version() as sqlite_version', (err, row) => {
        if (err) {
          logger.error('SQLite connection test failed', err);
          reject(err);
        } else {
          logger.info('SQLite connection test successful', {
            currentTime: row.current_time,
            sqliteVersion: row.sqlite_version
          });
          resolve(true);
        }
      });
    });
  }

  /**
   * Set up PostgreSQL connection pool event handlers
   */
  setupPostgresEventHandlers() {
    this.pool.on('connect', (client) => {
      logger.debug('Database client connected', {
        processID: client.processID,
        secretKey: client.secretKey ? '[REDACTED]' : 'none'
      });
    });

    this.pool.on('acquire', (client) => {
      logger.debug('Database client acquired from pool', {
        processID: client.processID
      });
    });

    this.pool.on('release', (client) => {
      logger.debug('Database client released back to pool', {
        processID: client.processID
      });
    });

    this.pool.on('remove', (client) => {
      logger.debug('Database client removed from pool', {
        processID: client.processID
      });
    });

    this.pool.on('error', (err, client) => {
      logger.error('Database pool error', err, {
        processID: client?.processID
      });
    });
  }

  /**
   * Get database connection from pool (PostgreSQL only)
   */
  async getConnection() {
    if (!this.usingPostgres || !this.pool) {
      throw new Error('PostgreSQL not available. Use query() method for database-agnostic operations.');
    }

    try {
      return await this.pool.connect();
    } catch (error) {
      logger.error('Failed to get database connection from pool', error);
      throw error;
    }
  }

  /**
   * Get the raw database instance (for direct access)
   */
  getRawConnection() {
    if (this.usingPostgres) {
      return this.pool;
    } else if (this.usingSqlite) {
      return this.sqliteDb;
    } else {
      throw new Error('No database connection available');
    }
  }

  /**
   * Execute query with automatic connection management (works with both PostgreSQL and SQLite)
   */
  async query(text, params = []) {
    if (!this.isConnected) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    // Adapt queries for database-specific syntax
    const adaptedQuery = this.adaptQueryForDatabase(text);

    if (this.usingPostgres) {
      return this.executePostgresQuery(adaptedQuery, params);
    } else if (this.usingSqlite) {
      return this.executeSqliteQuery(adaptedQuery, params);
    } else {
      throw new Error('No database connection available');
    }
  }

  /**
   * Adapt SQL queries for database-specific syntax
   */
  adaptQueryForDatabase(query) {
    if (this.usingSqlite) {
      // Remove FOR UPDATE clauses as SQLite doesn't support them
      // SQLite has different isolation levels that provide similar guarantees
      return query.replace(/\s+FOR\s+UPDATE\s*/gi, '');
    } else if (this.usingPostgres) {
      // PostgreSQL supports FOR UPDATE, keep as is
      return query;
    }
    
    return query;
  }

  /**
   * Execute PostgreSQL query
   */
  async executePostgresQuery(text, params = []) {
    const start = Date.now();
    let client;
    
    try {
      client = await this.pool.connect();
      const result = await client.query(text, params);
      const duration = Date.now() - start;
      
      logger.debug('PostgreSQL query executed', {
        query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        duration: `${duration}ms`,
        rowCount: result.rowCount
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error('PostgreSQL query failed', error, {
        query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        duration: `${duration}ms`,
        params: params?.length > 0 ? '[PARAMS_PROVIDED]' : 'none'
      });
      throw error;
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  /**
   * Extract table name from query string for SQLite RETURNING support
   */
  getTableNameFromQuery(query) {
    const insertMatch = query.match(/insert\s+into\s+(\w+)/i);
    const updateMatch = query.match(/update\s+(\w+)/i);
    const deleteMatch = query.match(/delete\s+from\s+(\w+)/i);
    
    if (insertMatch) return insertMatch[1];
    if (updateMatch) return updateMatch[1];
    if (deleteMatch) return deleteMatch[1];
    
    return 'unknown_table';
  }

  /**
   * Execute SQLite query
   */
  async executeSqliteQuery(text, params = []) {
    const start = Date.now();
    
    return new Promise((resolve, reject) => {
      // Convert PostgreSQL-style parameters ($1, $2) to SQLite-style (?, ?)
      const sqliteQuery = text.replace(/\$(\d+)/g, '?');
      
      const callback = (err, rows) => {
        const duration = Date.now() - start;
        
        if (err) {
          logger.error('SQLite query failed', err, {
            query: sqliteQuery.substring(0, 100) + (sqliteQuery.length > 100 ? '...' : ''),
            duration: `${duration}ms`,
            params: params?.length > 0 ? '[PARAMS_PROVIDED]' : 'none'
          });
          reject(err);
        } else {
          logger.debug('SQLite query executed', {
            query: sqliteQuery.substring(0, 100) + (sqliteQuery.length > 100 ? '...' : ''),
            duration: `${duration}ms`,
            rowCount: Array.isArray(rows) ? rows.length : (rows ? 1 : 0)
          });
          
          // Format result to match PostgreSQL's result structure
          const result = {
            rows: Array.isArray(rows) ? rows : (rows ? [rows] : []),
            rowCount: Array.isArray(rows) ? rows.length : (rows ? 1 : 0)
          };
          
          resolve(result);
        }
      };

      // Determine query type and execute appropriately
      const queryType = text.trim().toLowerCase().split(' ')[0];
      
      if (queryType === 'select') {
        this.sqliteDb.all(sqliteQuery, params, callback);
      } else if (queryType === 'insert' || queryType === 'update' || queryType === 'delete') {
        // Check if query contains RETURNING clause
        if (sqliteQuery.toLowerCase().includes('returning')) {
          // For SQLite, we need to handle RETURNING differently
          // First, remove the RETURNING clause and execute the INSERT/UPDATE/DELETE
          const returningMatch = sqliteQuery.match(/returning\s+(.+)$/i);
          const returningColumns = returningMatch ? returningMatch[1].trim() : '*';
          const baseQuery = sqliteQuery.replace(/\s+returning\s+.+$/i, '');
          
          this.sqliteDb.run(baseQuery, params, function(err) {
            if (err) {
              callback(err);
            } else {
              // Now fetch the affected row(s)
              let selectQuery;
              if (queryType === 'insert' && this.lastID) {
                // For INSERT, use the lastID to fetch the inserted row
                const tableName = database.getTableNameFromQuery(baseQuery);
                selectQuery = `SELECT ${returningColumns} FROM ${tableName} WHERE rowid = ?`;
                const selectParams = [this.lastID];
                
                database.sqliteDb.get(selectQuery, selectParams, (selectErr, row) => {
                  if (selectErr) {
                    callback(selectErr);
                  } else {
                    callback(null, [row]);
                  }
                });
              } else {
                // For UPDATE/DELETE, this is more complex - just return metadata for now
                callback(null, { 
                  insertId: this.lastID, 
                  changes: this.changes 
                });
              }
            }
          });
        } else {
          this.sqliteDb.run(sqliteQuery, params, function(err) {
            if (err) {
              callback(err);
            } else {
              callback(null, { 
                insertId: this.lastID, 
                changes: this.changes 
              });
            }
          });
        }
      } else {
        // For other queries (CREATE, DROP, etc.)
        this.sqliteDb.run(sqliteQuery, params, callback);
      }
    });
  }

  /**
   * Execute query within a transaction (works with both PostgreSQL and SQLite)
   */
  async transaction(callback) {
    if (!this.isConnected) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    if (this.usingPostgres) {
      return this.executePostgresTransaction(callback);
    } else if (this.usingSqlite) {
      return this.executeSqliteTransaction(callback);
    } else {
      throw new Error('No database connection available');
    }
  }

  /**
   * Execute PostgreSQL transaction
   */
  async executePostgresTransaction(callback) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const result = await callback(client);
      
      await client.query('COMMIT');
      
      logger.debug('PostgreSQL transaction committed successfully');
      
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      
      logger.error('PostgreSQL transaction rolled back due to error', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Execute SQLite transaction
   */
  async executeSqliteTransaction(callback) {
    return new Promise(async (resolve, reject) => {
      this.sqliteDb.serialize(async () => {
        this.sqliteDb.run('BEGIN TRANSACTION');
        
        try {
          // Create a wrapper that mimics PostgreSQL client interface
          const sqliteClient = {
            query: (text, params) => this.executeSqliteQuery(text, params)
          };
          
          const result = await callback(sqliteClient);
          
          this.sqliteDb.run('COMMIT', (err) => {
            if (err) {
              logger.error('SQLite transaction commit failed', err);
              reject(err);
            } else {
              logger.debug('SQLite transaction committed successfully');
              resolve(result);
            }
          });
        } catch (error) {
          this.sqliteDb.run('ROLLBACK', (rollbackErr) => {
            if (rollbackErr) {
              logger.error('SQLite transaction rollback failed', rollbackErr);
            }
            logger.error('SQLite transaction rolled back due to error', error);
            reject(error);
          });
        }
      });
    });
  }

  /**
   * Get database status information
   */
  getPoolStatus() {
    if (this.usingPostgres && this.pool) {
      return {
        initialized: true,
        database: 'PostgreSQL',
        totalCount: this.pool.totalCount,
        idleCount: this.pool.idleCount,
        waitingCount: this.pool.waitingCount,
        maxConnections: this.pool.options.max,
        minConnections: this.pool.options.min
      };
    } else if (this.usingSqlite && this.sqliteDb) {
      return {
        initialized: true,
        database: 'SQLite',
        connectionType: 'file-based'
      };
    } else {
      return { 
        initialized: false,
        database: 'none'
      };
    }
  }

  /**
   * Health check for the database (works with both PostgreSQL and SQLite)
   */
  async healthCheck() {
    try {
      if (!this.isConnected) {
        return {
          status: 'unhealthy',
          message: 'Database not initialized'
        };
      }

      const start = Date.now();
      await this.query('SELECT 1 as health_check');
      const responseTime = Date.now() - start;

      const poolStatus = this.getPoolStatus();

      const healthStatus = {
        status: 'healthy',
        database: poolStatus.database,
        responseTime: `${responseTime}ms`
      };

      if (this.usingPostgres) {
        healthStatus.connections = {
          total: poolStatus.totalCount,
          idle: poolStatus.idleCount,
          waiting: poolStatus.waitingCount,
          max: poolStatus.maxConnections
        };
      }

      return healthStatus;
    } catch (error) {
      logger.error('Database health check failed', error);
      return {
        status: 'unhealthy',
        message: error.message,
        error: error.name,
        database: this.usingPostgres ? 'PostgreSQL' : (this.usingSqlite ? 'SQLite' : 'unknown')
      };
    }
  }

  /**
   * Gracefully close database connections (works with both PostgreSQL and SQLite)
   */
  async close() {
    try {
      if (this.usingPostgres && this.pool) {
        await this.pool.end();
        this.pool = null;
        this.usingPostgres = false;
        logger.info('PostgreSQL connection pool closed successfully');
      }
      
      if (this.usingSqlite && this.sqliteDb) {
        await new Promise((resolve, reject) => {
          this.sqliteDb.close((err) => {
            if (err) {
              logger.error('Error closing SQLite database', err);
              reject(err);
            } else {
              logger.info('SQLite database closed successfully');
              resolve();
            }
          });
        });
        this.sqliteDb = null;
        this.usingSqlite = false;
      }
      
      this.isConnected = false;
    } catch (error) {
      logger.error('Error closing database connections', error);
      throw error;
    }
  }
}

// Create singleton instance
const database = new DatabaseConfig();

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing database connections...');
  await database.close();
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing database connections...');
  await database.close();
});

module.exports = database;