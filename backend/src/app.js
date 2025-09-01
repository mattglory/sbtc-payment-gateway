/**
 * Main Application File
 * Express app configuration and middleware setup
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import middleware
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { rateLimit } = require('./middleware/auth');

// Import routes
const merchantRoutes = require('./routes/merchantRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const contractRoutes = require('./routes/contractRoutes');

const app = express();

// Basic middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security middleware
app.use(rateLimit(15 * 60 * 1000, 100)); // 100 requests per 15 minutes

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    network: process.env.NODE_ENV === 'production' ? 'mainnet' : 'testnet',
    contract: `${process.env.CONTRACT_ADDRESS || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'}.sbtc-payment-gateway`,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API Routes
app.use('/api/merchants', merchantRoutes);
app.use('/api/payment-intents', paymentRoutes);
app.use('/api/contract', contractRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;