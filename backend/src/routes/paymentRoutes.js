/**
 * Payment Routes
 * API routes for payment operations
 */

const express = require('express');
const router = express.Router();

const PaymentController = require('../controllers/paymentController');
const PaymentService = require('../services/paymentService');
const MerchantService = require('../services/merchantService');
const ApiKeyService = require('../services/apiKeyService');

// Initialize services and controller
const paymentService = new PaymentService();
const merchantService = new MerchantService();
const apiKeyService = new ApiKeyService();
const paymentController = new PaymentController(paymentService, merchantService, apiKeyService);

/**
 * @route POST /api/payment-intents
 * @desc Create a new payment intent
 * @access Private (requires API key)
 */
router.post('/', (req, res) => paymentController.createIntent(req, res));

/**
 * @route GET /api/payment-intents/:id
 * @desc Get payment intent details
 * @access Public
 */
router.get('/:id', (req, res) => paymentController.getPaymentIntent(req, res));

/**
 * @route POST /api/payment-intents/:id/confirm
 * @desc Confirm and process a payment
 * @access Public
 */
router.post('/:id/confirm', (req, res) => paymentController.confirmPayment(req, res));

module.exports = router;