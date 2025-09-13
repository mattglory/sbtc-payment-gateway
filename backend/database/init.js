/**
 * Database Initialization Script
 * Sets up the database connection and runs initial schema setup
 */

const database = require('../src/config/database');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../src/utils/logger');

async function initializeDatabase() {
  try {
    logger.info('Initializing database connection...');
    
    // Initialize database connection
    await database.initialize();
    
    // Check if database is properly connected
    const healthCheck = await database.healthCheck();
    
    if (healthCheck.status !== 'healthy') {
      throw new Error(`Database health check failed: ${healthCheck.message}`);
    }
    
    logger.info('Database connection successful', {
      responseTime: healthCheck.responseTime,
      connections: healthCheck.connections
    });
    
    // Check if tables exist
    const tablesExist = await checkTablesExist();
    
    if (!tablesExist) {
      logger.info('Tables do not exist, creating schema...');
      await createSchema();
      logger.info('Database schema created successfully');
    } else {
      logger.info('Database tables already exist, skipping schema creation');
    }
    
    logger.info('Database initialization completed successfully');
    return true;
    
  } catch (error) {
    logger.error('Database initialization failed', error);
    throw error;
  }
}

async function checkTablesExist() {
  try {
    // Check which database we're using and use appropriate query
    const poolStatus = database.getPoolStatus();
    
    if (poolStatus.database === 'PostgreSQL') {
      const result = await database.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('merchants', 'payments', 'payment_events')
      `);
      return result.rows.length === 3;
    } else if (poolStatus.database === 'SQLite') {
      const result = await database.query(`
        SELECT name 
        FROM sqlite_master 
        WHERE type = 'table' 
        AND name IN ('merchants', 'payments', 'payment_events')
      `);
      return result.rows.length === 3;
    } else {
      logger.warn('Unknown database type, assuming tables do not exist');
      return false;
    }
  } catch (error) {
    logger.error('Failed to check if tables exist', error);
    return false;
  }
}

async function createSchema() {
  try {
    // Determine which schema file to use based on database type
    const poolStatus = database.getPoolStatus();
    let schemaPath;
    
    if (poolStatus.database === 'PostgreSQL') {
      schemaPath = path.join(__dirname, 'schema.sql');
    } else if (poolStatus.database === 'SQLite') {
      schemaPath = path.join(__dirname, 'schema.sqlite.sql');
    } else {
      throw new Error('Unknown database type, cannot determine schema file');
    }
    
    const schemaSql = await fs.readFile(schemaPath, 'utf8');
    
    // For SQLite, use exec to run the entire schema at once
    if (poolStatus.database === 'SQLite') {
      logger.info('Executing SQLite schema using exec method');
      
      await new Promise((resolve, reject) => {
        // Get the SQLite database instance directly
        const sqliteDb = database.sqliteDb;
        
        sqliteDb.exec(schemaSql, (err) => {
          if (err) {
            logger.error('Failed to execute SQLite schema', err);
            reject(err);
          } else {
            logger.info('SQLite schema executed successfully');
            resolve();
          }
        });
      });
    } else {
      // Execute the schema SQL all at once for PostgreSQL
      await database.query(schemaSql);
    }
    
    logger.info(`${poolStatus.database} schema executed successfully`);
  } catch (error) {
    logger.error('Failed to create database schema', error);
    throw error;
  }
}

// If this script is run directly (not imported)
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      logger.info('Database initialization script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Database initialization script failed', error);
      process.exit(1);
    });
}

module.exports = {
  initializeDatabase,
  checkTablesExist,
  createSchema
};