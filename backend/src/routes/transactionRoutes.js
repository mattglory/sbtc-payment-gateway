/**
 * Transaction Routes
 * API routes for transaction history and management
 */

const express = require('express');
const router = express.Router();

const TransactionController = require('../controllers/transactionController');
const { requireApiKey } = require('../middleware/auth');

// Initialize controller
const transactionController = new TransactionController();

/**
 * @route GET /api/transactions
 * @desc Get all transactions with optional filtering
 * @access Private (requires API key)
 */
router.get('/', requireApiKey, (req, res) => transactionController.getTransactions(req, res));

/**
 * @route GET /api/transactions/stats
 * @desc Get transaction statistics
 * @access Private (requires API key)
 */
router.get('/stats', requireApiKey, (req, res) => transactionController.getTransactionStats(req, res));

/**
 * @route GET /api/transactions/:id
 * @desc Get specific transaction by ID
 * @access Private (requires API key)
 */
router.get('/:id', requireApiKey, (req, res) => transactionController.getTransactionById(req, res));

module.exports = router;