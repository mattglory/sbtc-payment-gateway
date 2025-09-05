#!/usr/bin/env node

/**
 * Docker Health Check Script
 * Performs basic health checks for container orchestration
 */

const http = require('http');

const healthCheck = () => {
  const port = process.env.PORT || 3001;
  const timeout = 5000; // 5 second timeout
  
  const options = {
    hostname: 'localhost',
    port: port,
    path: '/health',
    method: 'GET',
    timeout: timeout
  };

  const req = http.request(options, (res) => {
    if (res.statusCode === 200) {
      console.log('Health check passed');
      process.exit(0);
    } else {
      console.error(`Health check failed with status ${res.statusCode}`);
      process.exit(1);
    }
  });

  req.on('error', (error) => {
    console.error(`Health check failed: ${error.message}`);
    process.exit(1);
  });

  req.on('timeout', () => {
    console.error('Health check timed out');
    req.destroy();
    process.exit(1);
  });

  req.end();
};

healthCheck();