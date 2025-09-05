/**
 * Payment Routes
 * API routes for payment operations
 */

const express = require('express');
const router = express.Router();

const PaymentController = require('../controllers/paymentController');
const { requireApiKey } = require('../middleware/auth');

// Initialize controller
const paymentController = new PaymentController();

/**
 * @route POST /api/payment-intents
 * @desc Create a new payment intent
 * @access Private (requires API key)
 */
router.post('/', requireApiKey, (req, res) => paymentController.createIntent(req, res));

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