const express = require('express');
const Joi = require('joi');
const Batch = require('../models/Batch');
const Harvest = require('../models/Harvest');
const { protect, checkPermission, authorize } = require('../middleware/auth');
const { generateQRCode } = require('../utils/qrcode');
const { submitToBlockchain } = require('../services/blockchain');
const logger = require('../utils/logger');

const router = express.Router();

// Validation schemas
const batchSchema = Joi.object({
  species: Joi.string().min(2).max(100).required(),
  harvestSamples: Joi.array().items(
    Joi.object({
      sampleId: Joi.string().required(),
      quantityKg: Joi.number().min(0.01).required()
    })
  ).min(1).required(),
  destination: Joi.string().valid('MANUFACTURER', 'DISTRIBUTOR', 'RETAILER', 'EXPORT').required(),
  destinationDetails: Joi.object({
    name: Joi.string().required(),
    address: Joi.string().optional(),
    licenseNumber: Joi.string().optional(),
    contactInfo: Joi.string().optional()
  }).required()
});

const processStepSchema = Joi.object({
  step: Joi.string().valid('receiving', 'cleaning', 'drying', 'grinding', 'sieving', 'mixing', 'packaging', 'storage', 'quality_check').required(),
  description: Joi.string().max(500).optional(),
  conditions: Joi.object({
    temperature: Joi.number().optional(),
    humidity: Joi.number().optional(),
    duration: Joi.number().optional(),
    equipment: Joi.string().optional(),
    notes: Joi.string().max(500).optional()
  }).optional(),
  qualityMetrics: Joi.object({
    moistureContent: Joi.number().min(0).max(100).optional(),
    particleSize: Joi.string().optional(),
    color: Joi.string().optional(),
    aroma: Joi.string().optional(),
    yield: Joi.number().min(0).optional()
  }).optional()
});

// Generate unique batch ID
const generateBatchId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `BATCH-${timestamp}-${random}`;
};

// @desc    Create new batch
// @route   POST /api/batch
// @access  Private (Processors)
const createBatch = async (req, res, next) => {
  try {
    // Validate input
    const { error, value } = batchSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { species, harvestSamples, destination, destinationDetails } = value;

    // Verify all harvest samples exist and are available
    const sampleIds = harvestSamples.map(s => s.sampleId);
    const harvests = await Harvest.find({ sampleId: { $in: sampleIds } });

    if (harvests.length !== sampleIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more harvest samples not found'
      });
    }

    // Check if samples are already used in other batches
    const existingBatches = await Batch.find({
      'harvestSamples.sampleId': { $in: sampleIds },
      status: { $nin: ['REJECTED'] }
    });

    if (existingBatches.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'One or more harvest samples are already used in other batches'
      });
    }

    // Verify species consistency
    const uniqueSpecies = [...new Set(harvests.map(h => h.species))];
    if (uniqueSpecies.length > 1 || uniqueSpecies[0] !== species) {
      return res.status(400).json({
        success: false,
        message: 'All harvest samples must be of the same species'
      });
    }

    // Calculate total quantity
    const totalQuantityKg = harvestSamples.reduce((sum, sample) => sum + sample.quantityKg, 0);

    // Generate batch ID
    const batchId = generateBatchId();

    // Create batch
    const batch = new Batch({
      batchId,
      species,
      totalQuantityKg,
      harvestSamples,
      processor: req.user._id,
      processorDetails: {
        name: req.user.name,
        organization: req.user.profile?.organization?.name,
        licenseNumber: req.user.profile?.organization?.registrationNumber
      },
      destination,
      destinationDetails
    });

    // Generate QR code
    const qrCodeData = {
      type: 'batch',
      batchId: batch.batchId,
      species: batch.species,
      totalQuantity: batch.totalQuantityKg,
      processor: req.user.name,
      url: `${req.protocol}://${req.get('host')}/api/batch/${batch.batchId}/provenance`
    };
    
    batch.traceability.qrCode = await generateQRCode(JSON.stringify(qrCodeData));

    await batch.save();

    // Update harvest samples status
    await Harvest.updateMany(
      { sampleId: { $in: sampleIds } },
      { 
        status: 'RECEIVED',
        $push: { batchIds: batchId }
      }
    );

    // Submit to blockchain (async)
    submitToBlockchain('batch_created', batch.toObject())
      .then(result => {
        batch.traceability.blockchainHash = result.hash;
        batch.metadata.syncStatus = 'SYNCED';
        return batch.save();
      })
      .catch(error => {
        logger.error('Blockchain submission failed for batch:', error);
        batch.metadata.syncStatus = 'FAILED';
        batch.save();
      });

    logger.info(`New batch created: ${batchId} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Batch created successfully',
      data: {
        batch
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all batches
// @route   GET /api/batch
// @access  Private
const getBatches = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    
    // If not admin/regulator, only show own batches
    if (!req.user.permissions.canViewAllData) {
      filter.processor = req.user._id;
    }

    if (req.query.species) filter.species = new RegExp(req.query.species, 'i');
    if (req.query.status) filter.status = req.query.status;
    if (req.query.destination) filter.destination = req.query.destination;
    if (req.query.qualityGrade) filter.qualityGrade = req.query.qualityGrade;

    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) filter.createdAt.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.createdAt.$lte = new Date(req.query.endDate);
    }

    const batches = await Batch.find(filter)
      .populate('processor', 'name email profile.organization')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Batch.countDocuments(filter);

    res.json({
      success: true,
      data: {
        batches,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single batch
// @route   GET /api/batch/:batchId
// @access  Private
const getBatch = async (req, res, next) => {
  try {
    const batch = await Batch.findOne({ batchId: req.params.batchId })
      .populate('processor', 'name email profile')
      .populate('processingSteps.operator', 'name');

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    // Check ownership if not admin/regulator
    if (!req.user.permissions.canViewAllData && 
        batch.processor._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get harvest details
    const harvestSamples = await Harvest.find({
      sampleId: { $in: batch.harvestSamples.map(s => s.sampleId) }
    }).populate('harvester', 'name profile.organization');

    res.json({
      success: true,
      data: {
        batch,
        harvestDetails: harvestSamples
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add processing step
// @route   POST /api/batch/:batchId/process
// @access  Private (Processors)
const addProcessingStep = async (req, res, next) => {
  try {
    // Validate input
    const { error, value } = processStepSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const batch = await Batch.findOne({ batchId: req.params.batchId });

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    // Check ownership
    if (batch.processor.toString() !== req.user._id.toString() && 
        !req.user.permissions.canViewAllData) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if batch is in correct status
    if (!['CREATED', 'PROCESSING'].includes(batch.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot add processing steps to batch in current status'
      });
    }

    // Add processing step
    const stepData = {
      ...value,
      operator: req.user._id,
      operatorName: req.user.name,
      startTime: new Date(),
      status: 'IN_PROGRESS'
    };

    const stepId = batch.addProcessingStep(stepData);

    // Update batch status
    if (batch.status === 'CREATED') {
      batch.status = 'PROCESSING';
    }

    await batch.save();

    // Submit to blockchain (async)
    submitToBlockchain('processing_step', {
      batchId: batch.batchId,
      stepId,
      step: value.step,
      operator: req.user.name,
      timestamp: new Date()
    }).catch(error => {
      logger.error('Blockchain submission failed for processing step:', error);
    });

    logger.info(`Processing step added to batch ${batch.batchId}: ${value.step} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Processing step added successfully',
      data: {
        stepId,
        batch
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete processing step
// @route   PUT /api/batch/:batchId/process/:stepId/complete
// @access  Private (Processors)
const completeProcessingStep = async (req, res, next) => {
  try {
    const { batchId, stepId } = req.params;
    const { status, qualityMetrics, notes } = req.body;

    const batch = await Batch.findOne({ batchId });

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    // Check ownership
    if (batch.processor.toString() !== req.user._id.toString() && 
        !req.user.permissions.canViewAllData) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update processing step
    const updated = batch.updateProcessingStep(stepId, {
      status: status || 'COMPLETED',
      endTime: new Date(),
      qualityMetrics,
      'conditions.notes': notes
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Processing step not found'
      });
    }

    await batch.save();

    logger.info(`Processing step completed: ${stepId} in batch ${batchId} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Processing step completed successfully',
      data: {
        batch
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get batch provenance (public)
// @route   GET /api/batch/:batchId/provenance
// @access  Public
const getBatchProvenance = async (req, res, next) => {
  try {
    const batch = await Batch.findOne({ batchId: req.params.batchId })
      .populate('processor', 'name profile.organization')
      .select('-metadata -traceability.blockchainHash');

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    // Get harvest details
    const harvestSamples = await Harvest.find({
      sampleId: { $in: batch.harvestSamples.map(s => s.sampleId) }
    })
    .populate('harvester', 'name profile.organization')
    .select('sampleId species quantityKg harvestDate location address harvester compliance qualityMetrics');

    const provenanceData = {
      batch: {
        batchId: batch.batchId,
        species: batch.species,
        totalQuantityKg: batch.totalQuantityKg,
        status: batch.status,
        qualityGrade: batch.qualityGrade,
        processor: {
          name: batch.processor.name,
          organization: batch.processor.profile?.organization?.name
        },
        destination: batch.destination,
        destinationDetails: batch.destinationDetails,
        compliance: batch.compliance,
        createdAt: batch.createdAt
      },
      harvestSamples: harvestSamples.map(harvest => ({
        sampleId: harvest.sampleId,
        species: harvest.species,
        quantityKg: harvest.quantityKg,
        harvestDate: harvest.harvestDate,
        location: harvest.location,
        address: harvest.address,
        harvester: {
          name: harvest.harvester.name,
          organization: harvest.harvester.profile?.organization?.name
        },
        compliance: harvest.compliance,
        qualityMetrics: harvest.qualityMetrics
      })),
      processingTimeline: batch.getProcessingTimeline(),
      labTests: batch.labTests.map(test => ({
        testType: test.testType,
        testDate: test.testDate,
        status: test.results.status,
        labName: test.labName,
        overallScore: test.results.overallScore
      })),
      timeline: [
        ...harvestSamples.map(harvest => ({
          event: 'Harvested',
          date: harvest.harvestDate,
          location: harvest.address,
          actor: harvest.harvester.name,
          details: `${harvest.quantityKg}kg of ${harvest.species} harvested`
        })),
        {
          event: 'Batch Created',
          date: batch.createdAt,
          actor: batch.processor.name,
          details: `Batch created with ${batch.totalQuantityKg}kg total quantity`
        },
        ...batch.processingSteps.map(step => ({
          event: `Processing: ${step.step}`,
          date: step.startTime,
          actor: step.operatorName,
          details: step.description || `${step.step} processing step`
        })),
        ...batch.labTests.map(test => ({
          event: `Lab Test: ${test.testType}`,
          date: test.testDate,
          actor: test.labName,
          details: `Test result: ${test.results.status}`
        }))
      ].sort((a, b) => new Date(a.date) - new Date(b.date))
    };

    res.json({
      success: true,
      data: provenanceData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get batch statistics
// @route   GET /api/batch/stats
// @access  Private
const getBatchStats = async (req, res, next) => {
  try {
    const filter = {};
    
    // If not admin/regulator, only show own batches
    if (!req.user.permissions.canViewAllData) {
      filter.processor = req.user._id;
    }

    const stats = await Batch.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalBatches: { $sum: 1 },
          totalQuantity: { $sum: '$totalQuantityKg' },
          avgQuantity: { $avg: '$totalQuantityKg' },
          avgSustainabilityScore: { $avg: '$compliance.sustainabilityScore' }
        }
      }
    ]);

    const statusStats = await Batch.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const qualityStats = await Batch.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$qualityGrade',
          count: { $sum: 1 }
        }
      }
    ]);

    const speciesStats = await Batch.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$species',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$totalQuantityKg' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalBatches: 0,
          totalQuantity: 0,
          avgQuantity: 0,
          avgSustainabilityScore: 0
        },
        statusBreakdown: statusStats,
        qualityBreakdown: qualityStats,
        speciesBreakdown: speciesStats
      }
    });
  } catch (error) {
    next(error);
  }
};

// Routes
router.post('/', protect, checkPermission('canProcessBatch'), createBatch);
router.get('/', protect, getBatches);
router.get('/stats', protect, getBatchStats);
router.get('/:batchId', protect, getBatch);
router.post('/:batchId/process', protect, checkPermission('canProcessBatch'), addProcessingStep);
router.put('/:batchId/process/:stepId/complete', protect, checkPermission('canProcessBatch'), completeProcessingStep);
router.get('/:batchId/provenance', getBatchProvenance); // Public endpoint

module.exports = router;