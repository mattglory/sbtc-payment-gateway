/**
 * Merchant Routes
 * API routes for merchant operations
 */

const express = require('express');
const router = express.Router();

const MerchantController = require('../controllers/merchantController');
const { requireApiKey } = require('../middleware/auth');

// Initialize controller
const merchantController = new MerchantController();

/**
 * @route POST /api/merchants/register
 * @desc Register a new merchant
 * @access Public
 */
router.post('/register', (req, res) => merchantController.register(req, res));

/**
 * @route GET /api/merchants/dashboard
 * @desc Get merchant dashboard statistics
 * @access Private (requires API key)
 */
router.get('/dashboard', requireApiKey, (req, res) => merchantController.getDashboard(req, res));

/**
 * @route POST /api/merchants/validate-key
 * @desc Validate API key for debugging
 * @access Public
 */
router.post('/validate-key', (req, res) => merchantController.validateKey(req, res));

module.exports = router;