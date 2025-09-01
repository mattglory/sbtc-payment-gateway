/**
 * Payment Controller
 * Handles payment intent operations
 */

const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

class PaymentController {
  constructor(paymentService, merchantService, apiKeyService) {
    this.paymentService = paymentService;
    this.merchantService = merchantService;
    this.apiKeyService = apiKeyService;
  }

  /**
   * Create payment intent with Stacks integration
   */
  async createIntent(req, res) {
    try {
      const apiKey = req.headers.authorization?.replace('Bearer ', '');
      
      if (!apiKey || !this.apiKeyService.validate(apiKey)) {
        return res.status(401).json({
          error: 'Invalid or missing API key'
        });
      }

      const merchantId = this.apiKeyService.getMerchantId(apiKey);
      const merchant = await this.merchantService.findById(merchantId);
      
      if (!merchant) {
        return res.status(404).json({
          error: 'Merchant not found'
        });
      }

      const { amount, description, currency = 'BTC' } = req.body;

      // Validation
      if (!amount || amount <= 0) {
        return res.status(400).json({
          error: 'Invalid amount. Must be greater than 0 satoshis.'
        });
      }

      // Generate payment intent
      const paymentId = `pi_${uuidv4()}`;
      const intentId = uuidv4();
      const amountInSats = Math.floor(amount);
      const FEE_PERCENTAGE = 0.025; // 2.5% processing fee
      const fee = Math.floor(amountInSats * FEE_PERCENTAGE);

      const paymentIntent = {
        id: intentId,
        paymentId,
        merchantId,
        amount: amountInSats,
        fee,
        currency,
        description: description || 'Payment',
        status: 'requires_payment_method',
        clientSecret: `${paymentId}_secret_${crypto.randomBytes(16).toString('hex')}`,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        metadata: {
          merchantAddress: merchant.stacksAddress,
          contractFunction: 'create-payment-intent'
        }
      };

      await this.paymentService.create(paymentIntent);

      console.log('Payment intent created:', {
        intentId,
        paymentId,
        amount: amountInSats,
        merchant: merchant.businessName
      });

      res.status(201).json({
        id: paymentIntent.id,
        paymentId: paymentIntent.paymentId,
        amount: paymentIntent.amount,
        fee: paymentIntent.fee,
        currency: paymentIntent.currency,
        description: paymentIntent.description,
        status: paymentIntent.status,
        clientSecret: paymentIntent.clientSecret,
        createdAt: paymentIntent.createdAt,
        expiresAt: paymentIntent.expiresAt
      });

    } catch (error) {
      console.error('Payment intent creation error:', error);
      res.status(500).json({
        error: 'Failed to create payment intent'
      });
    }
  }

  /**
   * Confirm payment with Stacks blockchain integration
   */
  async confirmPayment(req, res) {
    try {
      const { id } = req.params;
      const { customerAddress, transactionId } = req.body;

      const paymentIntent = await this.paymentService.findById(id);
      if (!paymentIntent) {
        return res.status(404).json({
          error: 'Payment intent not found'
        });
      }

      // Check if payment has expired
      if (new Date() > new Date(paymentIntent.expiresAt)) {
        return res.status(400).json({
          error: 'Payment intent has expired'
        });
      }

      // Update payment status
      const updatedPayment = {
        ...paymentIntent,
        status: 'processing',
        customerAddress,
        transactionId,
        processingStartedAt: new Date().toISOString()
      };

      await this.paymentService.update(id, updatedPayment);

      // Find merchant
      const merchant = await this.merchantService.findById(paymentIntent.merchantId);
      
      console.log('Payment confirmation started:', {
        paymentId: paymentIntent.paymentId,
        customer: customerAddress,
        merchant: merchant?.businessName,
        txId: transactionId
      });

      // Simulate blockchain processing (in production, monitor the actual transaction)
      this.processPaymentAsync(id, paymentIntent);

      res.json({
        id: paymentIntent.id,
        status: 'processing',
        amount: paymentIntent.amount,
        customer: customerAddress,
        transactionId,
        message: 'Payment is being processed on the Stacks blockchain'
      });

    } catch (error) {
      console.error('Payment confirmation error:', error);
      res.status(500).json({
        error: 'Failed to confirm payment'
      });
    }
  }

  /**
   * Get payment intent details
   */
  async getPaymentIntent(req, res) {
    try {
      const { id } = req.params;
      const paymentIntent = await this.paymentService.findById(id);
      
      if (!paymentIntent) {
        return res.status(404).json({
          error: 'Payment intent not found'
        });
      }

      res.json({
        id: paymentIntent.id,
        paymentId: paymentIntent.paymentId,
        amount: paymentIntent.amount,
        fee: paymentIntent.fee,
        currency: paymentIntent.currency,
        description: paymentIntent.description,
        status: paymentIntent.status,
        createdAt: paymentIntent.createdAt,
        expiresAt: paymentIntent.expiresAt,
        customerAddress: paymentIntent.customerAddress,
        transactionId: paymentIntent.transactionId,
        processingStartedAt: paymentIntent.processingStartedAt,
        succeededAt: paymentIntent.succeededAt,
        failedAt: paymentIntent.failedAt
      });

    } catch (error) {
      console.error('Error retrieving payment intent:', error);
      res.status(500).json({
        error: 'Failed to retrieve payment intent'
      });
    }
  }

  /**
   * Process payment asynchronously
   */
  async processPaymentAsync(paymentId, originalPayment) {
    setTimeout(async () => {
      try {
        const payment = await this.paymentService.findById(paymentId);
        if (payment && payment.status === 'processing') {
          const succeededPayment = {
            ...payment,
            status: 'succeeded',
            succeededAt: new Date().toISOString()
          };
          
          await this.paymentService.update(paymentId, succeededPayment);
          
          // Update merchant stats
          await this.merchantService.updateStats(payment.merchantId, {
            totalProcessed: payment.amount,
            feeCollected: payment.fee,
            paymentsCount: 1
          });

          console.log('Payment succeeded:', {
            paymentId: payment.paymentId,
            amount: payment.amount,
            customer: payment.customerAddress
          });
        }
      } catch (error) {
        console.error('Payment processing error:', error);
        const failedPayment = {
          ...originalPayment,
          status: 'payment_failed',
          failedAt: new Date().toISOString(),
          failureReason: error.message
        };
        await this.paymentService.update(paymentId, failedPayment);
      }
    }, 3000); // 3 second delay to simulate blockchain confirmation
  }
}

module.exports = PaymentController;