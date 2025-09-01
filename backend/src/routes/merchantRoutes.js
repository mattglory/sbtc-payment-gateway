/**
 * Merchant Routes
 * API routes for merchant operations
 */

const express = require('express');
const router = express.Router();

const MerchantController = require('../controllers/merchantController');
const MerchantService = require('../services/merchantService');
const ApiKeyService = require('../services/apiKeyService');

// Initialize services and controller
const merchantService = new MerchantService();
const apiKeyService = new ApiKeyService();
const merchantController = new MerchantController(merchantService, apiKeyService);

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
router.get('/dashboard', (req, res) => merchantController.getDashboard(req, res));

module.exports = router;