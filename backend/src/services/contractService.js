/**
 * Contract Service
 * Smart contract interaction service for sBTC Payment Gateway
 */

const StacksService = require('./stacksService');
const logger = require('../utils/logger');
const { ErrorFactory } = require('../utils/errors');

class ContractService {
  constructor() {
    this.stacksService = new StacksService();
    this.contractAddress = process.env.CONTRACT_ADDRESS || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    this.contractName = 'sbtc-payment-gateway';
  }

  /**
   * Get contract information
   */
  async getContractInfo() {
    try {
      // Input validation
      if (!this.contractAddress || !this.contractName) {
        throw ErrorFactory.configuration('Contract address and name must be configured');
      }

      const contractInfo = await this.stacksService.api.smartContractsApi.getContractById({
        contractAddress: this.contractAddress,
        contractName: this.contractName
      });

      if (!contractInfo) {
        throw ErrorFactory.notFound('Smart contract', `${this.contractAddress}.${this.contractName}`);
      }

      return {
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        source: contractInfo.source_code,
        abi: contractInfo.abi || null,
        network: this.stacksService.getNetworkInfo()
      };
    } catch (error) {
      logger.error('Failed to get contract info', error, {
        contractAddress: this.contractAddress,
        contractName: this.contractName
      });
      
      if (error.name === 'ConfigurationError' || error.name === 'NotFoundError') {
        throw error;
      }
      
      throw ErrorFactory.blockchain(`Failed to get contract info: ${error.message}`);
    }
  }

  /**
   * Get payment intent from smart contract
   */
  async getPaymentIntent(paymentId) {
    try {
      return await this.stacksService.getPaymentIntent(paymentId);
    } catch (error) {
      logger.error('Failed to get payment intent from contract', error, { paymentId });
      throw error;
    }
  }

  /**
   * Get merchant information from smart contract
   */
  async getMerchantInfo(merchantAddress) {
    try {
      // Input validation
      if (!merchantAddress || typeof merchantAddress !== 'string') {
        throw ErrorFactory.validation('Valid merchant address is required');
      }

      // Validate Stacks address format
      if (!this.stacksService.isValidStacksAddress(merchantAddress)) {
        throw ErrorFactory.validation('Invalid Stacks address format');
      }

      logger.debug('Getting merchant info from contract', { merchantAddress });

      const result = await this.stacksService.api.smartContractsApi.callReadOnlyFunction({
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'get-merchant',
        readOnlyFunctionArgs: {
          sender: this.contractAddress,
          arguments: [`'${merchantAddress}`]
        }
      });

      if (result.okay && result.result) {
        const merchantData = this.stacksService.parseClarityValue(result.result);
        
        logger.debug('Merchant info retrieved from contract', {
          merchantAddress,
          data: merchantData
        });

        return merchantData;
      } else {
        logger.debug('Merchant not found in contract', { merchantAddress });
        return null;
      }

    } catch (error) {
      logger.error('Failed to get merchant info from contract', error, { merchantAddress });
      
      if (error.name === 'ValidationError') {
        throw error;
      }
      
      if (error.message?.includes('404')) {
        return null;
      }

      throw ErrorFactory.blockchain(`Failed to get merchant info: ${error.message}`);
    }
  }

  /**
   * Get contract statistics
   */
  async getContractStats() {
    try {
      logger.debug('Getting contract statistics');

      // Get total merchants
      const totalMerchantsResult = await this.stacksService.api.smartContractsApi.callReadOnlyFunction({
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'get-total-merchants',
        readOnlyFunctionArgs: {
          sender: this.contractAddress,
          arguments: []
        }
      });

      // Get total payments
      const totalPaymentsResult = await this.stacksService.api.smartContractsApi.callReadOnlyFunction({
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'get-total-payments',
        readOnlyFunctionArgs: {
          sender: this.contractAddress,
          arguments: []
        }
      });

      // Get total volume
      const totalVolumeResult = await this.stacksService.api.smartContractsApi.callReadOnlyFunction({
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'get-total-volume',
        readOnlyFunctionArgs: {
          sender: this.contractAddress,
          arguments: []
        }
      });

      const stats = {
        totalMerchants: this.parseContractResult(totalMerchantsResult),
        totalPayments: this.parseContractResult(totalPaymentsResult),
        totalVolume: this.parseContractResult(totalVolumeResult),
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        network: this.stacksService.getNetworkInfo().network
      };

      logger.debug('Contract statistics retrieved', stats);
      return stats;

    } catch (error) {
      logger.error('Failed to get contract statistics', error);
      
      // Return default stats if contract calls fail
      return {
        totalMerchants: 0,
        totalPayments: 0,
        totalVolume: 0,
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        network: this.stacksService.getNetworkInfo().network,
        error: error.message
      };
    }
  }

  /**
   * Get payment status from smart contract
   */
  async getPaymentStatus(paymentId) {
    try {
      // Input validation
      if (!paymentId || typeof paymentId !== 'string') {
        throw ErrorFactory.validation('Valid payment ID is required');
      }

      logger.debug('Getting payment status from contract', { paymentId });

      const result = await this.stacksService.api.smartContractsApi.callReadOnlyFunction({
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'get-payment-status',
        readOnlyFunctionArgs: {
          sender: this.contractAddress,
          arguments: [`"${paymentId}"`]
        }
      });

      if (result.okay && result.result) {
        const status = this.stacksService.parseClarityValue(result.result);
        
        logger.debug('Payment status retrieved from contract', {
          paymentId,
          status
        });

        return {
          paymentId,
          status,
          isValid: status !== null
        };
      } else {
        return {
          paymentId,
          status: null,
          isValid: false
        };
      }

    } catch (error) {
      logger.error('Failed to get payment status from contract', error, { paymentId });
      
      if (error.name === 'ValidationError') {
        throw error;
      }
      
      return {
        paymentId,
        status: null,
        isValid: false,
        error: error.message
      };
    }
  }

  /**
   * Check if merchant is registered on contract
   */
  async isMerchantRegistered(merchantAddress) {
    try {
      const merchantInfo = await this.getMerchantInfo(merchantAddress);
      return merchantInfo !== null;
    } catch (error) {
      logger.error('Failed to check merchant registration', error, { merchantAddress });
      return false;
    }
  }

  /**
   * Get contract events for a specific transaction
   */
  async getTransactionEvents(txId) {
    try {
      logger.debug('Getting transaction events', { txId });

      const transaction = await this.stacksService.api.transactionsApi.getTransactionById({
        txId
      });

      const events = transaction.events || [];
      const contractEvents = events.filter(event => 
        event.event_type === 'smart_contract_log' &&
        event.contract_log?.contract_id === `${this.contractAddress}.${this.contractName}`
      );

      logger.debug('Transaction events retrieved', {
        txId,
        totalEvents: events.length,
        contractEvents: contractEvents.length
      });

      return contractEvents.map(event => ({
        eventType: event.event_type,
        contractId: event.contract_log.contract_id,
        topic: event.contract_log.topic,
        value: this.stacksService.parseClarityValue(event.contract_log.value),
        txId: event.tx_id
      }));

    } catch (error) {
      logger.error('Failed to get transaction events', error, { txId });
      return [];
    }
  }

  /**
   * Validate contract deployment
   */
  async validateContractDeployment() {
    try {
      logger.info('Validating contract deployment');

      const contractInfo = await this.getContractInfo();
      
      // Try to call a read-only function to verify contract is deployed
      await this.getContractStats();

      logger.info('Contract deployment validation successful', {
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        network: contractInfo.network.network
      });

      return {
        isDeployed: true,
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        network: contractInfo.network
      };

    } catch (error) {
      logger.error('Contract deployment validation failed', error);
      
      return {
        isDeployed: false,
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        error: error.message
      };
    }
  }

  /**
   * Parse contract result helper
   */
  parseContractResult(result) {
    try {
      if (result.okay && result.result) {
        const parsed = this.stacksService.parseClarityValue(result.result);
        // If it's a uint, convert to number
        if (typeof parsed === 'string' && parsed.startsWith('u')) {
          return parseInt(parsed.substring(1));
        }
        return parsed;
      }
      return 0;
    } catch (error) {
      logger.warn('Failed to parse contract result', error, { result });
      return 0;
    }
  }

  /**
   * Get network information
   */
  getNetworkInfo() {
    return this.stacksService.getNetworkInfo();
  }

  /**
   * Monitor contract events
   */
  async monitorContractEvents(callback) {
    try {
      // This would implement WebSocket connection to monitor events
      // For now, we'll use polling
      const monitorInterval = setInterval(async () => {
        try {
          const stats = await this.getContractStats();
          if (callback) {
            callback('stats_updated', stats);
          }
        } catch (error) {
          logger.error('Error monitoring contract events', error);
        }
      }, 30000); // Check every 30 seconds

      logger.info('Started contract event monitoring');
      
      return {
        stop: () => {
          clearInterval(monitorInterval);
          logger.info('Stopped contract event monitoring');
        }
      };

    } catch (error) {
      logger.error('Failed to start contract event monitoring', error);
      throw ErrorFactory.blockchain(`Failed to start event monitoring: ${error.message}`);
    }
  }
}

module.exports = ContractService;