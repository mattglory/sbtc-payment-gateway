/**
 * Contract Routes
 * API routes for Stacks smart contract interactions
 */

const express = require('express');
const router = express.Router();

const ContractController = require('../controllers/contractController');

// Initialize controller
const contractController = new ContractController();

/**
 * @route GET /api/contract/info
 * @desc Get contract information
 * @access Public
 */
router.get('/info', (req, res) => contractController.getInfo(req, res));

/**
 * @route POST /api/contract/create-payment
 * @desc Create smart contract payment intent
 * @access Private
 */
router.post('/create-payment', (req, res) => contractController.createPayment(req, res));

/**
 * @route POST /api/contract/process-payment
 * @desc Process smart contract payment
 * @access Private
 */
router.post('/process-payment', (req, res) => contractController.processPayment(req, res));

/**
 * @route POST /api/contract/register-merchant
 * @desc Register merchant on smart contract
 * @access Private
 */
router.post('/register-merchant', (req, res) => contractController.registerMerchant(req, res));

module.exports = router;