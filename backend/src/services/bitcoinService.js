/**
 * Bitcoin Service
 * Handles Bitcoin address generation, monitoring, and deposit confirmation
 * Integrates with Blockstream API for real Bitcoin network interaction
 * Powers the Bitcoin → sBTC payment flow for BFF application
 */

const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const database = require('../config/database');
const logger = require('../utils/logger');
const { ErrorFactory } = require('../utils/errors');

class BitcoinService {
  constructor() {
    this.network = process.env.BITCOIN_NETWORK || 'testnet'; // mainnet or testnet
    this.blockstreamApi = this.network === 'mainnet' 
      ? 'https://blockstream.info/api' 
      : 'https://blockstream.info/testnet/api';
    
    this.confirmationsRequired = parseInt(process.env.BITCOIN_CONFIRMATIONS || '6');
    this.monitoringInterval = parseInt(process.env.BITCOIN_MONITORING_INTERVAL || '60000'); // 1 minute
    this.addressPollLimit = parseInt(process.env.BITCOIN_POLL_LIMIT || '100'); // Max addresses to poll per cycle
    
    // Start monitoring service
    this.startMonitoring();
    
    logger.info('BitcoinService initialized', {
      network: this.network,
      api: this.blockstreamApi,
      confirmationsRequired: this.confirmationsRequired,
      monitoringInterval: this.monitoringInterval
    });
  }

  /**
   * Generate a Bitcoin deposit address for a payment intent
   * For production, this would use HD wallet derivation
   * For demo/testnet, generates deterministic addresses
   */
  async generateDepositAddress(paymentId, merchantId) {
    try {
      logger.info('Generating Bitcoin deposit address', { paymentId, merchantId });

      // Create deterministic address based on payment ID
      // In production, use proper HD wallet derivation
      const addressSeed = crypto.createHash('sha256')
        .update(`${paymentId}-${merchantId}-${process.env.BITCOIN_ADDRESS_SEED || 'demo-seed'}`)
        .digest('hex');

      let depositAddress;
      let addressType = 'p2wpkh'; // Native SegWit (bech32)

      if (this.network === 'testnet') {
        // Generate testnet address (simplified for demo)
        depositAddress = this.generateTestnetAddress(addressSeed);
      } else {
        // Generate mainnet address (simplified for demo)
        depositAddress = this.generateMainnetAddress(addressSeed);
      }

      // Store address mapping in database
      await this.storeAddressMapping(paymentId, depositAddress, addressType, addressSeed);

      logger.info('Bitcoin deposit address generated', {
        paymentId,
        depositAddress,
        addressType,
        network: this.network
      });

      return {
        address: depositAddress,
        network: this.network,
        addressType,
        qrCode: this.generateQRCodeUrl(depositAddress),
        explorerUrl: this.getExplorerUrl(depositAddress)
      };

    } catch (error) {
      logger.error('Failed to generate Bitcoin deposit address', error, { paymentId, merchantId });
      throw ErrorFactory.blockchain(`Failed to generate Bitcoin address: ${error.message}`);
    }
  }

  /**
   * Generate testnet Bitcoin address (simplified)
   * In production, use proper cryptographic libraries
   */
  generateTestnetAddress(seed) {
    // Simplified testnet address generation for demo
    const hash = crypto.createHash('sha256').update(seed).digest();
    const addressBytes = hash.slice(0, 20);
    
    // Create testnet bech32-style address (simplified)
    return `tb1q${addressBytes.toString('hex').substring(0, 32)}`;
  }

  /**
   * Generate mainnet Bitcoin address (simplified)
   * In production, use proper cryptographic libraries
   */
  generateMainnetAddress(seed) {
    // Simplified mainnet address generation for demo
    const hash = crypto.createHash('sha256').update(seed).digest();
    const addressBytes = hash.slice(0, 20);
    
    // Create mainnet bech32-style address (simplified)
    return `bc1q${addressBytes.toString('hex').substring(0, 32)}`;
  }

  /**
   * Store Bitcoin address mapping in database
   */
  async storeAddressMapping(paymentId, address, addressType, seed) {
    try {
      await database.query(`
        INSERT INTO bitcoin_addresses (
          payment_id, address, address_type, seed, network, 
          created_at, is_monitored
        ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, true)
        ON CONFLICT (payment_id) DO UPDATE SET
          address = EXCLUDED.address,
          address_type = EXCLUDED.address_type,
          updated_at = CURRENT_TIMESTAMP
      `, [paymentId, address, addressType, seed, this.network]);

    } catch (error) {
      logger.error('Failed to store address mapping', error, { paymentId, address });
      throw error;
    }
  }

  /**
   * Monitor Bitcoin address for incoming transactions
   */
  async monitorAddress(paymentId, address) {
    try {
      logger.debug('Monitoring Bitcoin address', { paymentId, address });

      // Fetch address information from Blockstream API
      const addressInfo = await this.fetchAddressInfo(address);
      const utxos = await this.fetchAddressUtxos(address);

      if (!addressInfo || !utxos) {
        return { hasDeposit: false, confirmations: 0, amount: 0 };
      }

      // Check for confirmed transactions
      let totalReceived = 0;
      let maxConfirmations = 0;
      let confirmedTxs = [];

      for (const utxo of utxos) {
        if (utxo.status && utxo.status.confirmed) {
          totalReceived += utxo.value;
          const confirmations = await this.getConfirmations(utxo.txid);
          maxConfirmations = Math.max(maxConfirmations, confirmations);
          
          if (confirmations >= this.confirmationsRequired) {
            confirmedTxs.push({
              txid: utxo.txid,
              value: utxo.value,
              confirmations
            });
          }
        }
      }

      const hasDeposit = totalReceived > 0;
      const isFullyConfirmed = maxConfirmations >= this.confirmationsRequired;

      logger.debug('Address monitoring result', {
        paymentId,
        address,
        hasDeposit,
        totalReceived,
        maxConfirmations,
        isFullyConfirmed,
        confirmedTxsCount: confirmedTxs.length
      });

      return {
        hasDeposit,
        totalReceived,
        confirmations: maxConfirmations,
        isFullyConfirmed,
        confirmedTransactions: confirmedTxs,
        explorerUrl: this.getTransactionExplorerUrl(confirmedTxs[0]?.txid)
      };

    } catch (error) {
      logger.error('Failed to monitor Bitcoin address', error, { paymentId, address });
      return { hasDeposit: false, confirmations: 0, amount: 0, error: error.message };
    }
  }

  /**
   * Fetch address information from Blockstream API with production error handling
   */
  async fetchAddressInfo(address, retries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        const response = await fetch(`${this.blockstreamApi}/address/${address}`, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'sBTC-Payment-Gateway/1.0'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          if (response.status === 404) {
            // Address not found (no transactions yet) - this is normal
            return null;
          }
          
          if (response.status === 429) {
            // Rate limited - wait longer before retry
            logger.warn('Blockstream API rate limited', { 
              address: address.substring(0, 10) + '...', 
              attempt,
              retryAfter: response.headers.get('Retry-After') 
            });
            
            const retryAfter = parseInt(response.headers.get('Retry-After') || '60') * 1000;
            await this.delay(retryAfter);
            continue;
          }
          
          throw new Error(`Blockstream API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data;
        
      } catch (error) {
        if (error.name === 'AbortError') {
          logger.warn('Blockstream API request timeout', { 
            address: address.substring(0, 10) + '...', 
            attempt 
          });
        } else {
          logger.warn('Failed to fetch address info from Blockstream', { 
            error: error.message,
            address: address.substring(0, 10) + '...',
            attempt 
          });
        }
        
        if (attempt === retries) {
          // Final attempt failed
          logger.error('All retry attempts failed for address info', {
            address: address.substring(0, 10) + '...',
            totalAttempts: retries,
            finalError: error.message
          });
          return null;
        }
        
        // Wait before retry with exponential backoff
        await this.delay(delay * Math.pow(2, attempt - 1));
      }
    }
    
    return null;
  }

  /**
   * Fetch address UTXOs from Blockstream API
   */
  async fetchAddressUtxos(address) {
    try {
      const response = await fetch(`${this.blockstreamApi}/address/${address}/utxo`);
      
      if (!response.ok) {
        if (response.status === 404) {
          // Address not found (no UTXOs)
          return [];
        }
        throw new Error(`Blockstream API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.warn('Failed to fetch address UTXOs from Blockstream', error, { address });
      return [];
    }
  }

  /**
   * Get transaction confirmations
   */
  async getConfirmations(txid) {
    try {
      const response = await fetch(`${this.blockstreamApi}/tx/${txid}`);
      
      if (!response.ok) {
        return 0;
      }

      const tx = await response.json();
      
      if (!tx.status || !tx.status.confirmed) {
        return 0;
      }

      // Get current block height
      const tipResponse = await fetch(`${this.blockstreamApi}/blocks/tip/height`);
      if (!tipResponse.ok) {
        return 0;
      }

      const currentHeight = await tipResponse.text();
      const confirmations = parseInt(currentHeight) - tx.status.block_height + 1;

      return Math.max(0, confirmations);
    } catch (error) {
      logger.warn('Failed to get transaction confirmations', error, { txid });
      return 0;
    }
  }

  /**
   * Start background monitoring service with production-ready error handling
   */
  startMonitoring() {
    // Add startup delay to prevent immediate failures on service restart
    const startupDelay = process.env.NODE_ENV === 'production' ? 30000 : 5000;
    
    setTimeout(() => {
      this.monitoringInterval = setInterval(async () => {
        try {
          await this.monitorAllActiveAddresses();
        } catch (error) {
          logger.error('Error in Bitcoin monitoring loop', error);
          
          // In production, implement exponential backoff for critical errors
          if (process.env.NODE_ENV === 'production') {
            await this.handleMonitoringError(error);
          }
        }
      }, this.monitoringInterval);

      logger.info('Bitcoin address monitoring started', {
        interval: this.monitoringInterval,
        confirmationsRequired: this.confirmationsRequired,
        startupDelay: startupDelay
      });
    }, startupDelay);
  }

  /**
   * Handle monitoring errors with production-ready resilience
   */
  async handleMonitoringError(error) {
    try {
      // Categorize error severity
      const isNetworkError = error.message?.includes('fetch') || 
                           error.message?.includes('ECONNREFUSED') ||
                           error.message?.includes('timeout');
      
      const isDatabaseError = error.message?.includes('Database') ||
                             error.message?.includes('connection');

      if (isNetworkError) {
        logger.warn('Network error in Bitcoin monitoring, will retry next cycle', {
          error: error.message
        });
        // Network errors are temporary, just log and continue
        return;
      }

      if (isDatabaseError) {
        logger.error('Database error in Bitcoin monitoring, attempting recovery', {
          error: error.message
        });
        
        // Try to reconnect database
        try {
          const database = require('../config/database');
          const healthCheck = await database.healthCheck();
          
          if (healthCheck.status === 'unhealthy') {
            logger.error('Database health check failed, will retry next cycle');
          }
        } catch (dbError) {
          logger.error('Database recovery attempt failed', dbError);
        }
        return;
      }

      // Unknown error - log with full details
      logger.error('Unknown error in Bitcoin monitoring', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });

    } catch (errorHandlingError) {
      // Prevent error handling from crashing the service
      logger.error('Error in monitoring error handler', errorHandlingError);
    }
  }

  /**
   * Monitor all active Bitcoin addresses
   */
  async monitorAllActiveAddresses() {
    try {
      // Get addresses that need monitoring
      const result = await database.query(`
        SELECT ba.payment_id, ba.address, p.amount_in_sats, p.status, p.merchant_id
        FROM bitcoin_addresses ba
        JOIN payments p ON ba.payment_id = p.payment_id
        WHERE ba.is_monitored = true 
        AND p.status IN ('pending', 'awaiting_deposit', 'deposit_detected')
        AND p.expires_at > CURRENT_TIMESTAMP
        ORDER BY ba.created_at ASC
        LIMIT $1
      `, [this.addressPollLimit]);

      const addressesToMonitor = result.rows;

      if (addressesToMonitor.length === 0) {
        logger.debug('No Bitcoin addresses to monitor');
        return;
      }

      logger.debug('Monitoring Bitcoin addresses', { 
        count: addressesToMonitor.length,
        confirmationsRequired: this.confirmationsRequired
      });

      for (const addressData of addressesToMonitor) {
        try {
          await this.processAddressMonitoring(addressData);
          
          // Small delay between API calls to be respectful
          await this.delay(100);
        } catch (error) {
          logger.error('Error processing address monitoring', error, {
            paymentId: addressData.payment_id,
            address: addressData.address
          });
        }
      }

    } catch (error) {
      logger.error('Failed to monitor active addresses', error);
    }
  }

  /**
   * Process monitoring for a single address
   */
  async processAddressMonitoring(addressData) {
    const { payment_id, address, amount_in_sats, status } = addressData;

    const monitorResult = await this.monitorAddress(payment_id, address);

    if (monitorResult.error) {
      return; // Skip this address for now
    }

    // Update database based on monitoring results
    if (monitorResult.hasDeposit && status === 'pending') {
      // First deposit detected
      await this.updatePaymentStatus(payment_id, 'deposit_detected', {
        bitcoinAddress: address,
        totalReceived: monitorResult.totalReceived,
        confirmations: monitorResult.confirmations,
        detectedAt: new Date()
      });

      logger.info('Bitcoin deposit detected', {
        paymentId: payment_id,
        address,
        totalReceived: monitorResult.totalReceived,
        confirmations: monitorResult.confirmations
      });

    } else if (monitorResult.isFullyConfirmed && status === 'deposit_detected') {
      // Deposit fully confirmed (6+ confirmations)
      await this.updatePaymentStatus(payment_id, 'deposit_confirmed', {
        bitcoinAddress: address,
        totalReceived: monitorResult.totalReceived,
        confirmations: monitorResult.confirmations,
        confirmedTransactions: monitorResult.confirmedTransactions,
        confirmedAt: new Date()
      });

      // Stop monitoring this address
      await this.stopMonitoring(payment_id);

      logger.info('Bitcoin deposit fully confirmed', {
        paymentId: payment_id,
        address,
        totalReceived: monitorResult.totalReceived,
        confirmations: monitorResult.confirmations,
        transactions: monitorResult.confirmedTransactions.length
      });

      // Trigger sBTC minting process (integrate with existing PaymentService)
      await this.triggerSbtcMinting(payment_id, monitorResult);
    }
  }

  /**
   * Update payment status in database
   */
  async updatePaymentStatus(paymentId, newStatus, metadata = {}) {
    try {
      await database.query(`
        UPDATE payments 
        SET status = $1, updated_at = CURRENT_TIMESTAMP, metadata = $2
        WHERE payment_id = $3
      `, [newStatus, JSON.stringify(metadata), paymentId]);

      // Log event
      await database.query(`
        INSERT INTO payment_events (payment_id, event_type, event_data)
        VALUES ($1, $2, $3)
      `, [paymentId, `payment_${newStatus}`, JSON.stringify(metadata)]);

    } catch (error) {
      logger.error('Failed to update payment status', error, { paymentId, newStatus });
      throw error;
    }
  }

  /**
   * Stop monitoring an address
   */
  async stopMonitoring(paymentId) {
    try {
      await database.query(`
        UPDATE bitcoin_addresses 
        SET is_monitored = false, updated_at = CURRENT_TIMESTAMP
        WHERE payment_id = $1
      `, [paymentId]);
    } catch (error) {
      logger.error('Failed to stop monitoring address', error, { paymentId });
    }
  }

  /**
   * Trigger sBTC minting process after Bitcoin confirmation
   */
  async triggerSbtcMinting(paymentId, depositInfo) {
    try {
      logger.info('Triggering sBTC minting process', { paymentId, depositInfo });

      // This integrates with the existing PaymentService
      // The actual sBTC minting would happen through Stacks blockchain
      // Note: Using direct database update to avoid circular dependency

      // Update the payment to processing status for sBTC minting
      await database.query(`
        UPDATE payments 
        SET status = 'processing', blockchain_status = 'minting_sbtc', updated_at = CURRENT_TIMESTAMP
        WHERE payment_id = $1
      `, [paymentId]);

      // In a real implementation, this would:
      // 1. Call sBTC bridge contract on Stacks
      // 2. Initiate the peg-in process
      // 3. Wait for sBTC tokens to be minted
      // 4. Update payment to 'completed' when sBTC is received

      logger.info('sBTC minting process initiated', { paymentId });

      return {
        paymentId,
        status: 'processing',
        action: 'sbtc_minting_initiated',
        bitcoinDeposit: depositInfo
      };

    } catch (error) {
      logger.error('Failed to trigger sBTC minting', error, { paymentId });
      throw error;
    }
  }

  /**
   * Get Bitcoin address for a payment
   */
  async getPaymentBitcoinAddress(paymentId) {
    try {
      const result = await database.query(`
        SELECT * FROM bitcoin_addresses WHERE payment_id = $1
      `, [paymentId]);

      if (result.rows.length === 0) {
        return null;
      }

      const addressData = result.rows[0];
      return {
        address: addressData.address,
        network: addressData.network,
        addressType: addressData.address_type,
        qrCode: this.generateQRCodeUrl(addressData.address),
        explorerUrl: this.getExplorerUrl(addressData.address),
        isMonitored: addressData.is_monitored,
        createdAt: addressData.created_at
      };

    } catch (error) {
      logger.error('Failed to get payment Bitcoin address', error, { paymentId });
      throw error;
    }
  }

  /**
   * Generate QR code URL for Bitcoin address
   */
  generateQRCodeUrl(address, amount = null) {
    const uri = amount 
      ? `bitcoin:${address}?amount=${amount / 100000000}` // Convert satoshis to BTC
      : `bitcoin:${address}`;
    
    return `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(uri)}`;
  }

  /**
   * Get explorer URL for address
   */
  getExplorerUrl(address) {
    const baseUrl = this.network === 'mainnet' 
      ? 'https://blockstream.info' 
      : 'https://blockstream.info/testnet';
    
    return `${baseUrl}/address/${address}`;
  }

  /**
   * Get explorer URL for transaction
   */
  getTransactionExplorerUrl(txid) {
    if (!txid) return null;
    
    const baseUrl = this.network === 'mainnet' 
      ? 'https://blockstream.info' 
      : 'https://blockstream.info/testnet';
    
    return `${baseUrl}/tx/${txid}`;
  }

  /**
   * Get Bitcoin network status
   */
  async getNetworkStatus() {
    try {
      const response = await fetch(`${this.blockstreamApi}/blocks/tip/height`);
      const blockHeight = await response.text();

      return {
        network: this.network,
        blockHeight: parseInt(blockHeight),
        confirmationsRequired: this.confirmationsRequired,
        monitoringActive: true,
        apiEndpoint: this.blockstreamApi
      };
    } catch (error) {
      logger.error('Failed to get Bitcoin network status', error);
      return {
        network: this.network,
        error: error.message,
        monitoringActive: false
      };
    }
  }

  /**
   * Validate Bitcoin address format
   */
  isValidBitcoinAddress(address) {
    // Basic Bitcoin address validation
    if (!address || typeof address !== 'string') {
      return false;
    }

    // Testnet addresses
    if (this.network === 'testnet') {
      return address.startsWith('tb1') || address.startsWith('2') || address.startsWith('m') || address.startsWith('n');
    }

    // Mainnet addresses
    return address.startsWith('bc1') || address.startsWith('3') || address.startsWith('1');
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get service status and statistics
   */
  async getServiceStatus() {
    try {
      const result = await database.query(`
        SELECT 
          COUNT(*) as total_addresses,
          COUNT(CASE WHEN is_monitored = true THEN 1 END) as monitored_addresses,
          COUNT(CASE WHEN network = 'testnet' THEN 1 END) as testnet_addresses,
          COUNT(CASE WHEN network = 'mainnet' THEN 1 END) as mainnet_addresses
        FROM bitcoin_addresses
      `);

      const stats = result.rows[0];
      const networkStatus = await this.getNetworkStatus();

      return {
        service: 'BitcoinService',
        status: 'active',
        network: this.network,
        blockHeight: networkStatus.blockHeight,
        confirmationsRequired: this.confirmationsRequired,
        statistics: {
          totalAddresses: parseInt(stats.total_addresses),
          monitoredAddresses: parseInt(stats.monitored_addresses),
          testnetAddresses: parseInt(stats.testnet_addresses),
          mainnetAddresses: parseInt(stats.mainnet_addresses)
        },
        monitoring: {
          interval: this.monitoringInterval,
          pollLimit: this.addressPollLimit,
          active: true
        }
      };
    } catch (error) {
      logger.error('Failed to get BitcoinService status', error);
      return {
        service: 'BitcoinService',
        status: 'error',
        error: error.message
      };
    }
  }
}

module.exports = BitcoinService;