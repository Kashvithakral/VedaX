const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

class BlockchainService {
  constructor() {
    this.gateway = null;
    this.network = null;
    this.contract = null;
    this.isConnected = false;
  }

  /**
   * Initialize blockchain connection
   */
  async initialize() {
    try {
      // Create a new gateway instance
      this.gateway = new Gateway();

      // Load connection profile
      const connectionProfilePath = path.resolve(__dirname, '../config/connection-profile.json');
      
      // Check if connection profile exists (for development)
      if (!fs.existsSync(connectionProfilePath)) {
        logger.warn('Blockchain connection profile not found. Running in simulation mode.');
        return;
      }

      const connectionProfile = JSON.parse(fs.readFileSync(connectionProfilePath, 'utf8'));

      // Create wallet
      const walletPath = path.resolve(__dirname, '../wallet');
      const wallet = await Wallets.newFileSystemWallet(walletPath);

      // Check if user identity exists
      const identity = await wallet.get('appUser');
      if (!identity) {
        logger.warn('Blockchain user identity not found. Running in simulation mode.');
        return;
      }

      // Connect to gateway
      await this.gateway.connect(connectionProfile, {
        wallet,
        identity: 'appUser',
        discovery: { enabled: true, asLocalhost: true }
      });

      // Get network and contract
      this.network = await this.gateway.getNetwork(process.env.BLOCKCHAIN_CHANNEL || 'vedax-channel');
      this.contract = this.network.getContract(process.env.BLOCKCHAIN_CHAINCODE || 'vedax-chaincode');

      this.isConnected = true;
      logger.info('Successfully connected to blockchain network');
    } catch (error) {
      logger.error('Failed to initialize blockchain connection:', error);
      this.isConnected = false;
    }
  }

  /**
   * Submit transaction to blockchain
   * @param {string} functionName - Smart contract function name
   * @param {object} data - Transaction data
   * @returns {Promise<object>} - Transaction result
   */
  async submitTransaction(functionName, data) {
    try {
      if (!this.isConnected) {
        // Simulate blockchain transaction for development
        return this.simulateTransaction(functionName, data);
      }

      const dataString = JSON.stringify(data);
      const result = await this.contract.submitTransaction(functionName, dataString);
      
      const txId = this.contract.getTransactionId();
      const hash = this.generateHash(dataString);

      logger.info(`Blockchain transaction submitted: ${functionName} - ${txId}`);

      return {
        success: true,
        txId: txId,
        hash: hash,
        result: result.toString()
      };
    } catch (error) {
      logger.error('Blockchain transaction failed:', error);
      throw error;
    }
  }

  /**
   * Query blockchain
   * @param {string} functionName - Smart contract function name
   * @param {Array} args - Query arguments
   * @returns {Promise<object>} - Query result
   */
  async queryTransaction(functionName, ...args) {
    try {
      if (!this.isConnected) {
        // Simulate blockchain query for development
        return this.simulateQuery(functionName, ...args);
      }

      const result = await this.contract.evaluateTransaction(functionName, ...args);
      
      logger.info(`Blockchain query executed: ${functionName}`);

      return {
        success: true,
        result: JSON.parse(result.toString())
      };
    } catch (error) {
      logger.error('Blockchain query failed:', error);
      throw error;
    }
  }

  /**
   * Simulate blockchain transaction for development
   * @param {string} functionName - Function name
   * @param {object} data - Transaction data
   * @returns {object} - Simulated result
   */
  simulateTransaction(functionName, data) {
    const txId = `SIM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const hash = this.generateHash(JSON.stringify(data));

    logger.info(`Simulated blockchain transaction: ${functionName} - ${txId}`);

    return {
      success: true,
      txId: txId,
      hash: hash,
      result: 'Transaction simulated successfully',
      simulated: true
    };
  }

  /**
   * Simulate blockchain query for development
   * @param {string} functionName - Function name
   * @param {Array} args - Query arguments
   * @returns {object} - Simulated result
   */
  simulateQuery(functionName, ...args) {
    logger.info(`Simulated blockchain query: ${functionName}`);

    // Return mock data based on function name
    let mockResult = {};
    
    switch (functionName) {
      case 'getHarvest':
        mockResult = {
          sampleId: args[0],
          species: 'Ashwagandha',
          status: 'RECORDED',
          timestamp: new Date().toISOString()
        };
        break;
      case 'getBatch':
        mockResult = {
          batchId: args[0],
          species: 'Ashwagandha',
          status: 'RECORDED',
          timestamp: new Date().toISOString()
        };
        break;
      default:
        mockResult = {
          message: 'Query simulated successfully',
          args: args
        };
    }

    return {
      success: true,
      result: mockResult,
      simulated: true
    };
  }

  /**
   * Generate hash for data
   * @param {string} data - Data to hash
   * @returns {string} - Generated hash
   */
  generateHash(data) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Record harvest on blockchain
   * @param {object} harvestData - Harvest data
   * @returns {Promise<object>} - Transaction result
   */
  async recordHarvest(harvestData) {
    const blockchainData = {
      sampleId: harvestData.sampleId,
      species: harvestData.species,
      quantityKg: harvestData.quantityKg,
      harvestDate: harvestData.harvestDate,
      location: harvestData.location,
      harvester: harvestData.harvester,
      compliance: harvestData.compliance,
      timestamp: new Date().toISOString()
    };

    return await this.submitTransaction('recordHarvest', blockchainData);
  }

  /**
   * Record batch on blockchain
   * @param {object} batchData - Batch data
   * @returns {Promise<object>} - Transaction result
   */
  async recordBatch(batchData) {
    const blockchainData = {
      batchId: batchData.batchId,
      species: batchData.species,
      totalQuantityKg: batchData.totalQuantityKg,
      harvestSamples: batchData.harvestSamples,
      processor: batchData.processor,
      timestamp: new Date().toISOString()
    };

    return await this.submitTransaction('recordBatch', blockchainData);
  }

  /**
   * Record processing step on blockchain
   * @param {object} stepData - Processing step data
   * @returns {Promise<object>} - Transaction result
   */
  async recordProcessingStep(stepData) {
    const blockchainData = {
      batchId: stepData.batchId,
      stepId: stepData.stepId,
      step: stepData.step,
      operator: stepData.operator,
      timestamp: stepData.timestamp || new Date().toISOString()
    };

    return await this.submitTransaction('recordProcessingStep', blockchainData);
  }

  /**
   * Record lab test on blockchain
   * @param {object} testData - Lab test data
   * @returns {Promise<object>} - Transaction result
   */
  async recordLabTest(testData) {
    const blockchainData = {
      batchId: testData.batchId,
      testId: testData.testId,
      testType: testData.testType,
      results: testData.results,
      labId: testData.labId,
      timestamp: new Date().toISOString()
    };

    return await this.submitTransaction('recordLabTest', blockchainData);
  }

  /**
   * Get harvest from blockchain
   * @param {string} sampleId - Sample ID
   * @returns {Promise<object>} - Query result
   */
  async getHarvest(sampleId) {
    return await this.queryTransaction('getHarvest', sampleId);
  }

  /**
   * Get batch from blockchain
   * @param {string} batchId - Batch ID
   * @returns {Promise<object>} - Query result
   */
  async getBatch(batchId) {
    return await this.queryTransaction('getBatch', batchId);
  }

  /**
   * Get provenance trail
   * @param {string} id - Record ID
   * @param {string} type - Record type (harvest, batch)
   * @returns {Promise<object>} - Query result
   */
  async getProvenanceTrail(id, type) {
    return await this.queryTransaction('getProvenanceTrail', id, type);
  }

  /**
   * Disconnect from blockchain
   */
  async disconnect() {
    try {
      if (this.gateway) {
        await this.gateway.disconnect();
        this.isConnected = false;
        logger.info('Disconnected from blockchain network');
      }
    } catch (error) {
      logger.error('Error disconnecting from blockchain:', error);
    }
  }
}

// Create singleton instance
const blockchainService = new BlockchainService();

// Initialize on startup
blockchainService.initialize().catch(error => {
  logger.error('Failed to initialize blockchain service:', error);
});

/**
 * Submit data to blockchain
 * @param {string} type - Data type (harvest, batch, process, lab)
 * @param {object} data - Data to submit
 * @returns {Promise<object>} - Transaction result
 */
const submitToBlockchain = async (type, data) => {
  try {
    switch (type) {
      case 'harvest':
        return await blockchainService.recordHarvest(data);
      case 'batch_created':
        return await blockchainService.recordBatch(data);
      case 'processing_step':
        return await blockchainService.recordProcessingStep(data);
      case 'lab_test':
        return await blockchainService.recordLabTest(data);
      default:
        return await blockchainService.submitTransaction('recordGeneric', { type, data });
    }
  } catch (error) {
    logger.error(`Failed to submit ${type} to blockchain:`, error);
    throw error;
  }
};

/**
 * Query blockchain data
 * @param {string} type - Query type
 * @param {string} id - Record ID
 * @returns {Promise<object>} - Query result
 */
const queryBlockchain = async (type, id) => {
  try {
    switch (type) {
      case 'harvest':
        return await blockchainService.getHarvest(id);
      case 'batch':
        return await blockchainService.getBatch(id);
      case 'provenance':
        return await blockchainService.getProvenanceTrail(id, 'batch');
      default:
        return await blockchainService.queryTransaction('getRecord', id, type);
    }
  } catch (error) {
    logger.error(`Failed to query ${type} from blockchain:`, error);
    throw error;
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await blockchainService.disconnect();
});

process.on('SIGTERM', async () => {
  await blockchainService.disconnect();
});

module.exports = {
  blockchainService,
  submitToBlockchain,
  queryBlockchain
};