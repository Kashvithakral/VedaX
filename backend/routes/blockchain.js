const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { blockchainService, submitToBlockchain, queryBlockchain } = require('../services/blockchain');
const Harvest = require('../models/Harvest');
const Batch = require('../models/Batch');
const logger = require('../utils/logger');

const router = express.Router();

// @desc    Get blockchain network status
// @route   GET /api/blockchain/status
// @access  Private
const getBlockchainStatus = async (req, res, next) => {
  try {
    const status = {
      connected: blockchainService.isConnected,
      network: process.env.BLOCKCHAIN_NETWORK || 'vedax-network',
      channel: process.env.BLOCKCHAIN_CHANNEL || 'vedax-channel',
      chaincode: process.env.BLOCKCHAIN_CHAINCODE || 'vedax-chaincode',
      timestamp: new Date().toISOString()
    };

    if (blockchainService.isConnected) {
      // Try to query blockchain for additional status
      try {
        const networkInfo = await blockchainService.queryTransaction('getNetworkInfo');
        status.networkInfo = networkInfo.result;
      } catch (error) {
        logger.warn('Failed to get network info:', error.message);
        status.networkInfo = { error: 'Unable to fetch network info' };
      }
    } else {
      status.mode = 'simulation';
      status.message = 'Running in simulation mode - blockchain network not available';
    }

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit record to blockchain
// @route   POST /api/blockchain/submit
// @access  Private
const submitRecord = async (req, res, next) => {
  try {
    const { type, recordId, data } = req.body;

    if (!type || !recordId) {
      return res.status(400).json({
        success: false,
        message: 'Type and record ID are required'
      });
    }

    let record = null;
    let blockchainData = null;

    // Fetch the record from database
    switch (type) {
      case 'harvest':
        record = await Harvest.findOne({ sampleId: recordId });
        if (record) {
          blockchainData = {
            sampleId: record.sampleId,
            species: record.species,
            quantityKg: record.quantityKg,
            harvestDate: record.harvestDate,
            location: record.location,
            harvester: record.harvester,
            compliance: record.compliance,
            timestamp: new Date().toISOString()
          };
        }
        break;

      case 'batch':
        record = await Batch.findOne({ batchId: recordId });
        if (record) {
          blockchainData = {
            batchId: record.batchId,
            species: record.species,
            totalQuantityKg: record.totalQuantityKg,
            harvestSamples: record.harvestSamples,
            processor: record.processor,
            status: record.status,
            timestamp: new Date().toISOString()
          };
        }
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid record type'
        });
    }

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Record not found'
      });
    }

    // Submit to blockchain
    const result = await submitToBlockchain(type, blockchainData || data);

    // Update record with blockchain info
    if (result.txId) {
      if (type === 'harvest') {
        record.blockchainTxId = result.txId;
        record.blockchainHash = result.hash;
        record.metadata.syncStatus = 'SYNCED';
      } else if (type === 'batch') {
        record.traceability.blockchainHash = result.hash;
        record.metadata.syncStatus = 'SYNCED';
      }
      await record.save();
    }

    logger.info(`Record submitted to blockchain: ${type} ${recordId} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Record submitted to blockchain successfully',
      data: {
        type,
        recordId,
        blockchainResult: result,
        submittedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Query blockchain record
// @route   GET /api/blockchain/query/:type/:id
// @access  Private
const queryRecord = async (req, res, next) => {
  try {
    const { type, id } = req.params;

    if (!['harvest', 'batch'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid record type'
      });
    }

    const result = await queryBlockchain(type, id);

    res.json({
      success: true,
      data: {
        type,
        id,
        blockchainData: result.result,
        queriedAt: new Date().toISOString(),
        simulated: result.simulated || false
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get provenance trail from blockchain
// @route   GET /api/blockchain/provenance/:id
// @access  Public
const getProvenanceTrail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type = 'batch' } = req.query;

    const result = await queryBlockchain('provenance', id);

    // Also get database records for comparison
    let dbRecord = null;
    if (type === 'harvest') {
      dbRecord = await Harvest.findOne({ sampleId: id })
        .populate('harvester', 'name profile.organization')
        .select('-photos -metadata');
    } else if (type === 'batch') {
      dbRecord = await Batch.findOne({ batchId: id })
        .populate('processor', 'name profile.organization')
        .select('-metadata');
    }

    const provenanceData = {
      id,
      type,
      blockchainTrail: result.result,
      databaseRecord: dbRecord,
      verified: !!result.result && !!dbRecord,
      queriedAt: new Date().toISOString(),
      simulated: result.simulated || false
    };

    res.json({
      success: true,
      data: provenanceData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Sync pending records to blockchain
// @route   POST /api/blockchain/sync
// @access  Private (Admin)
const syncPendingRecords = async (req, res, next) => {
  try {
    const { type = 'all', limit = 50 } = req.body;

    const results = {
      harvests: { processed: 0, successful: 0, failed: 0, errors: [] },
      batches: { processed: 0, successful: 0, failed: 0, errors: [] }
    };

    // Sync pending harvests
    if (type === 'all' || type === 'harvest') {
      const pendingHarvests = await Harvest.find({
        'metadata.syncStatus': { $in: ['PENDING', 'FAILED'] }
      }).limit(limit);

      results.harvests.processed = pendingHarvests.length;

      for (const harvest of pendingHarvests) {
        try {
          const result = await submitToBlockchain('harvest', harvest.toObject());
          
          harvest.blockchainTxId = result.txId;
          harvest.blockchainHash = result.hash;
          harvest.metadata.syncStatus = 'SYNCED';
          await harvest.save();
          
          results.harvests.successful++;
        } catch (error) {
          results.harvests.failed++;
          results.harvests.errors.push({
            sampleId: harvest.sampleId,
            error: error.message
          });
          
          harvest.metadata.syncStatus = 'FAILED';
          await harvest.save();
        }
      }
    }

    // Sync pending batches
    if (type === 'all' || type === 'batch') {
      const pendingBatches = await Batch.find({
        'metadata.syncStatus': { $in: ['PENDING', 'FAILED'] }
      }).limit(limit);

      results.batches.processed = pendingBatches.length;

      for (const batch of pendingBatches) {
        try {
          const result = await submitToBlockchain('batch_created', batch.toObject());
          
          batch.traceability.blockchainHash = result.hash;
          batch.metadata.syncStatus = 'SYNCED';
          await batch.save();
          
          results.batches.successful++;
        } catch (error) {
          results.batches.failed++;
          results.batches.errors.push({
            batchId: batch.batchId,
            error: error.message
          });
          
          batch.metadata.syncStatus = 'FAILED';
          await batch.save();
        }
      }
    }

    logger.info(`Blockchain sync completed by ${req.user.email}:`, results);

    res.json({
      success: true,
      message: 'Blockchain sync completed',
      data: {
        results,
        syncedAt: new Date().toISOString(),
        syncedBy: req.user.name
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get blockchain statistics
// @route   GET /api/blockchain/stats
// @access  Private
const getBlockchainStats = async (req, res, next) => {
  try {
    // Get sync statistics from database
    const harvestSyncStats = await Harvest.aggregate([
      {
        $group: {
          _id: '$metadata.syncStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const batchSyncStats = await Batch.aggregate([
      {
        $group: {
          _id: '$metadata.syncStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    // Calculate totals
    const totalHarvests = await Harvest.countDocuments();
    const totalBatches = await Batch.countDocuments();
    const syncedHarvests = await Harvest.countDocuments({ 'metadata.syncStatus': 'SYNCED' });
    const syncedBatches = await Batch.countDocuments({ 'metadata.syncStatus': 'SYNCED' });

    const stats = {
      network: {
        connected: blockchainService.isConnected,
        mode: blockchainService.isConnected ? 'blockchain' : 'simulation'
      },
      records: {
        harvests: {
          total: totalHarvests,
          synced: syncedHarvests,
          syncRate: totalHarvests > 0 ? ((syncedHarvests / totalHarvests) * 100).toFixed(2) : 0,
          breakdown: harvestSyncStats
        },
        batches: {
          total: totalBatches,
          synced: syncedBatches,
          syncRate: totalBatches > 0 ? ((syncedBatches / totalBatches) * 100).toFixed(2) : 0,
          breakdown: batchSyncStats
        }
      },
      overall: {
        totalRecords: totalHarvests + totalBatches,
        totalSynced: syncedHarvests + syncedBatches,
        overallSyncRate: (totalHarvests + totalBatches) > 0 ? 
          (((syncedHarvests + syncedBatches) / (totalHarvests + totalBatches)) * 100).toFixed(2) : 0
      },
      generatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify record integrity
// @route   POST /api/blockchain/verify
// @access  Private
const verifyRecordIntegrity = async (req, res, next) => {
  try {
    const { type, id } = req.body;

    if (!type || !id) {
      return res.status(400).json({
        success: false,
        message: 'Type and ID are required'
      });
    }

    let dbRecord = null;
    let blockchainRecord = null;

    // Get record from database
    if (type === 'harvest') {
      dbRecord = await Harvest.findOne({ sampleId: id });
    } else if (type === 'batch') {
      dbRecord = await Batch.findOne({ batchId: id });
    }

    if (!dbRecord) {
      return res.status(404).json({
        success: false,
        message: 'Record not found in database'
      });
    }

    // Get record from blockchain
    try {
      const blockchainResult = await queryBlockchain(type, id);
      blockchainRecord = blockchainResult.result;
    } catch (error) {
      logger.warn(`Failed to query blockchain for ${type} ${id}:`, error.message);
    }

    // Compare records
    const verification = {
      id,
      type,
      databaseExists: !!dbRecord,
      blockchainExists: !!blockchainRecord,
      syncStatus: dbRecord.metadata?.syncStatus || 'UNKNOWN',
      verified: false,
      discrepancies: [],
      verifiedAt: new Date().toISOString()
    };

    if (blockchainRecord && !blockchainRecord.simulated) {
      // Compare key fields
      const compareFields = type === 'harvest' 
        ? ['sampleId', 'species', 'quantityKg', 'harvestDate']
        : ['batchId', 'species', 'totalQuantityKg'];

      compareFields.forEach(field => {
        const dbValue = dbRecord[field];
        const bcValue = blockchainRecord[field];
        
        if (JSON.stringify(dbValue) !== JSON.stringify(bcValue)) {
          verification.discrepancies.push({
            field,
            databaseValue: dbValue,
            blockchainValue: bcValue
          });
        }
      });

      verification.verified = verification.discrepancies.length === 0;
    } else {
      verification.message = 'Blockchain record not available or simulated';
    }

    res.json({
      success: true,
      data: verification
    });
  } catch (error) {
    next(error);
  }
};

// Routes
router.get('/status', protect, getBlockchainStatus);
router.post('/submit', protect, submitRecord);
router.get('/query/:type/:id', protect, queryRecord);
router.get('/provenance/:id', getProvenanceTrail); // Public endpoint
router.post('/sync', protect, authorize('admin'), syncPendingRecords);
router.get('/stats', protect, getBlockchainStats);
router.post('/verify', protect, verifyRecordIntegrity);

module.exports = router;