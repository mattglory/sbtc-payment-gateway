/**
 * Bitcoin Routes
 * API endpoints for Bitcoin address monitoring and Bitcoin → sBTC flow
 */

const express = require('express');
const { body, param, validationResult } = require('express-validator');
const BitcoinService = require('../services/bitcoinService');
const PaymentService = require('../services/paymentService');
const { ErrorFactory } = require('../utils/errors');
const logger = require('../utils/logger');

const router = express.Router();
const bitcoinService = new BitcoinService();

/**
 * Get Bitcoin network status
 */
router.get('/status', async (req, res, next) => {
  try {
    logger.debug('Getting Bitcoin network status');
    
    const status = await bitcoinService.getNetworkStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Failed to get Bitcoin network status', error);
    next(error);
  }
});

/**
 * Get Bitcoin service statistics
 */
router.get('/stats', async (req, res, next) => {
  try {
    logger.debug('Getting Bitcoin service statistics');
    
    const stats = await bitcoinService.getServiceStatus();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Failed to get Bitcoin service stats', error);
    next(error);
  }
});

/**
 * Get Bitcoin address for a payment
 */
router.get('/address/:paymentId', [
  param('paymentId').isString().notEmpty()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(ErrorFactory.validation('Invalid payment ID', null, errors.array()));
    }

    const { paymentId } = req.params;
    
    logger.debug('Getting Bitcoin address for payment', { paymentId });
    
    const addressInfo = await bitcoinService.getPaymentBitcoinAddress(paymentId);
    
    if (!addressInfo) {
      return next(ErrorFactory.notFound('Bitcoin address for payment', paymentId));
    }

    res.json({
      success: true,
      data: addressInfo
    });
  } catch (error) {
    logger.error('Failed to get Bitcoin address for payment', error, { 
      paymentId: req.params.paymentId 
    });
    next(error);
  }
});

/**
 * Monitor Bitcoin address manually (for testing/debugging)
 */
router.post('/monitor/:paymentId', [
  param('paymentId').isString().notEmpty()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(ErrorFactory.validation('Invalid payment ID', null, errors.array()));
    }

    const { paymentId } = req.params;
    
    logger.info('Manual Bitcoin address monitoring requested', { paymentId });
    
    // Get Bitcoin address for this payment
    const addressInfo = await bitcoinService.getPaymentBitcoinAddress(paymentId);
    
    if (!addressInfo) {
      return next(ErrorFactory.notFound('Bitcoin address for payment', paymentId));
    }

    // Monitor the address
    const monitoringResult = await bitcoinService.monitorAddress(paymentId, addressInfo.address);
    
    res.json({
      success: true,
      data: {
        paymentId,
        address: addressInfo.address,
        network: addressInfo.network,
        monitoring: monitoringResult,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Failed to monitor Bitcoin address', error, { 
      paymentId: req.params.paymentId 
    });
    next(error);
  }
});

/**
 * Generate new Bitcoin address for payment (admin function)
 */
router.post('/generate-address', [
  body('paymentId').isString().notEmpty(),
  body('merchantId').isString().notEmpty()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(ErrorFactory.validation('Invalid request parameters', null, errors.array()));
    }

    const { paymentId, merchantId } = req.body;
    
    logger.info('Generating Bitcoin address', { paymentId, merchantId });
    
    const addressInfo = await bitcoinService.generateDepositAddress(paymentId, merchantId);
    
    res.json({
      success: true,
      data: addressInfo
    });
  } catch (error) {
    logger.error('Failed to generate Bitcoin address', error, { 
      paymentId: req.body.paymentId,
      merchantId: req.body.merchantId
    });
    next(error);
  }
});

/**
 * Get Bitcoin transaction details
 */
router.get('/transaction/:txid', [
  param('txid').isString().notEmpty().isLength({ min: 64, max: 64 })
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(ErrorFactory.validation('Invalid transaction ID', null, errors.array()));
    }

    const { txid } = req.params;
    
    logger.debug('Getting Bitcoin transaction details', { txid });
    
    const confirmations = await bitcoinService.getConfirmations(txid);
    const explorerUrl = bitcoinService.getTransactionExplorerUrl(txid);
    
    res.json({
      success: true,
      data: {
        txid,
        confirmations,
        explorerUrl,
        network: bitcoinService.network,
        isConfirmed: confirmations >= bitcoinService.confirmationsRequired,
        requiredConfirmations: bitcoinService.confirmationsRequired
      }
    });
  } catch (error) {
    logger.error('Failed to get Bitcoin transaction details', error, { 
      txid: req.params.txid 
    });
    next(error);
  }
});

/**
 * Validate Bitcoin address
 */
router.post('/validate-address', [
  body('address').isString().notEmpty()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(ErrorFactory.validation('Invalid address parameter', null, errors.array()));
    }

    const { address } = req.body;
    
    logger.debug('Validating Bitcoin address', { address });
    
    const isValid = bitcoinService.isValidBitcoinAddress(address);
    const expectedNetwork = bitcoinService.network;
    
    res.json({
      success: true,
      data: {
        address,
        isValid,
        network: expectedNetwork,
        addressTypes: {
          testnet: ['tb1', '2', 'm', 'n'],
          mainnet: ['bc1', '3', '1']
        }
      }
    });
  } catch (error) {
    logger.error('Failed to validate Bitcoin address', error, { 
      address: req.body.address 
    });
    next(error);
  }
});

/**
 * Get payment with full Bitcoin status (enhanced endpoint)
 */
router.get('/payment/:paymentId/full-status', [
  param('paymentId').isString().notEmpty()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(ErrorFactory.validation('Invalid payment ID', null, errors.array()));
    }

    const { paymentId } = req.params;
    
    logger.debug('Getting full payment status with Bitcoin info', { paymentId });
    
    // This uses the enhanced PaymentService.getPaymentIntent that includes Bitcoin status
    const paymentService = new PaymentService();
    const paymentWithBitcoin = await paymentService.getPaymentIntent(paymentId);
    
    res.json({
      success: true,
      data: paymentWithBitcoin
    });
  } catch (error) {
    logger.error('Failed to get full payment status', error, { 
      paymentId: req.params.paymentId 
    });
    next(error);
  }
});

/**
 * Health check endpoint
 */
router.get('/health', async (req, res, next) => {
  try {
    const status = await bitcoinService.getServiceStatus();
    const networkStatus = await bitcoinService.getNetworkStatus();
    
    res.json({
      success: true,
      data: {
        service: 'BitcoinService',
        status: status.status === 'active' ? 'healthy' : 'unhealthy',
        network: networkStatus.network,
        blockHeight: networkStatus.blockHeight,
        monitoringActive: status.monitoring?.active || false,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Bitcoin health check failed', error);
    res.status(503).json({
      success: false,
      error: {
        type: 'service_unavailable',
        message: 'Bitcoin service health check failed',
        timestamp: new Date().toISOString()
      }
    });
  }
});

module.exports = router;