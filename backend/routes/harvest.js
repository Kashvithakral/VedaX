const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const Joi = require('joi');
const Harvest = require('../models/Harvest');
const { protect, checkPermission, checkOwnership } = require('../middleware/auth');
const { generateQRCode } = require('../utils/qrcode');
const { submitToBlockchain } = require('../services/blockchain');
const logger = require('../utils/logger');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 10 * 1024 * 1024, // 10MB
    files: 5
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.UPLOAD_ALLOWED_TYPES || 'image/jpeg,image/png,image/webp').split(',');
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
    }
  }
});

// Validation schemas
const harvestSchema = Joi.object({
  species: Joi.string().min(2).max(100).required(),
  commonName: Joi.string().max(100).optional(),
  scientificName: Joi.string().max(200).optional(),
  quantityKg: Joi.number().min(0.01).max(10000).required(),
  harvestDate: Joi.date().max('now').optional(),
  location: Joi.object({
    coordinates: Joi.array().items(Joi.number()).length(2).required()
  }).required(),
  address: Joi.object({
    village: Joi.string().optional(),
    district: Joi.string().optional(),
    state: Joi.string().optional(),
    country: Joi.string().default('India')
  }).optional(),
  harvestMethod: Joi.string().valid('wild_collection', 'cultivated', 'semi_wild').required(),
  harvestConditions: Joi.object({
    weather: Joi.string().optional(),
    soilType: Joi.string().optional(),
    altitude: Joi.number().optional(),
    notes: Joi.string().max(500).optional()
  }).optional(),
  harvesterDetails: Joi.object({
    name: Joi.string().optional(),
    phone: Joi.string().optional(),
    organization: Joi.string().optional()
  }).optional(),
  qualityMetrics: Joi.object({
    moistureContent: Joi.number().min(0).max(100).optional(),
    visualGrade: Joi.string().valid('A', 'B', 'C', 'D').optional(),
    contamination: Joi.string().valid('NONE', 'LOW', 'MEDIUM', 'HIGH').optional()
  }).optional()
});

// Generate unique sample ID
const generateSampleId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `SAMPLE-${timestamp}-${random}`;
};

// Process uploaded images
const processImages = async (files) => {
  const processedImages = [];
  
  if (!files || files.length === 0) return processedImages;

  // Ensure upload directory exists
  const uploadDir = path.join(__dirname, '../uploads/harvest');
  try {
    await fs.mkdir(uploadDir, { recursive: true });
  } catch (error) {
    logger.error('Failed to create upload directory:', error);
  }

  for (const file of files) {
    try {
      const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.webp`;
      const filepath = path.join(uploadDir, filename);

      // Process image with sharp
      await sharp(file.buffer)
        .resize(1200, 1200, { 
          fit: 'inside', 
          withoutEnlargement: true 
        })
        .webp({ quality: 85 })
        .toFile(filepath);

      processedImages.push({
        filename,
        originalName: file.originalname,
        mimetype: 'image/webp',
        size: (await fs.stat(filepath)).size,
        url: `/uploads/harvest/${filename}`,
        uploadedAt: new Date()
      });
    } catch (error) {
      logger.error('Failed to process image:', error);
    }
  }

  return processedImages;
};

// @desc    Create new harvest record
// @route   POST /api/harvest
// @access  Private (Farmers/Collectors)
const createHarvest = async (req, res, next) => {
  try {
    // Validate input
    const { error, value } = harvestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // Process uploaded images
    const photos = await processImages(req.files);

    // Generate sample ID
    const sampleId = generateSampleId();

    // Create harvest record
    const harvestData = {
      ...value,
      sampleId,
      harvester: req.user._id,
      harvesterDetails: {
        name: req.user.name,
        phone: req.user.profile?.phone,
        organization: req.user.profile?.organization?.name,
        ...value.harvesterDetails
      },
      photos,
      harvestDate: value.harvestDate || new Date()
    };

    const harvest = new Harvest(harvestData);

    // Check compliance
    harvest.checkGeofenceCompliance();
    harvest.checkSeasonalCompliance();
    harvest.calculateSustainabilityScore();

    // Generate QR code
    const qrCodeData = {
      type: 'harvest',
      sampleId: harvest.sampleId,
      species: harvest.species,
      harvestDate: harvest.harvestDate,
      location: harvest.location.coordinates,
      url: `${req.protocol}://${req.get('host')}/api/harvest/${harvest.sampleId}/provenance`
    };
    
    harvest.qrCode = await generateQRCode(JSON.stringify(qrCodeData));

    await harvest.save();

    // Submit to blockchain (async)
    submitToBlockchain('harvest', harvest.toObject())
      .then(result => {
        harvest.blockchainTxId = result.txId;
        harvest.blockchainHash = result.hash;
        harvest.metadata.syncStatus = 'SYNCED';
        return harvest.save();
      })
      .catch(error => {
        logger.error('Blockchain submission failed for harvest:', error);
        harvest.metadata.syncStatus = 'FAILED';
        harvest.save();
      });

    logger.info(`New harvest created: ${sampleId} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Harvest record created successfully',
      data: {
        harvest
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all harvests
// @route   GET /api/harvest
// @access  Private
const getHarvests = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    
    // If not admin/regulator, only show own harvests
    if (!req.user.permissions.canViewAllData) {
      filter.harvester = req.user._id;
    }

    if (req.query.species) filter.species = new RegExp(req.query.species, 'i');
    if (req.query.harvestMethod) filter.harvestMethod = req.query.harvestMethod;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.geofenceStatus) filter['compliance.geofenceStatus'] = req.query.geofenceStatus;
    if (req.query.seasonalStatus) filter['compliance.seasonalStatus'] = req.query.seasonalStatus;

    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      filter.harvestDate = {};
      if (req.query.startDate) filter.harvestDate.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.harvestDate.$lte = new Date(req.query.endDate);
    }

    // Location-based filter (within radius)
    if (req.query.lat && req.query.lng && req.query.radius) {
      const lat = parseFloat(req.query.lat);
      const lng = parseFloat(req.query.lng);
      const radius = parseFloat(req.query.radius) * 1000; // Convert km to meters

      filter.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: radius
        }
      };
    }

    const harvests = await Harvest.find(filter)
      .populate('harvester', 'name email profile.organization')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Harvest.countDocuments(filter);

    res.json({
      success: true,
      data: {
        harvests,
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

// @desc    Get single harvest by sample ID
// @route   GET /api/harvest/:sampleId
// @access  Private
const getHarvest = async (req, res, next) => {
  try {
    const harvest = await Harvest.findOne({ sampleId: req.params.sampleId })
      .populate('harvester', 'name email profile');

    if (!harvest) {
      return res.status(404).json({
        success: false,
        message: 'Harvest record not found'
      });
    }

    // Check ownership if not admin/regulator
    if (!req.user.permissions.canViewAllData && 
        harvest.harvester._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: {
        harvest
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update harvest record
// @route   PUT /api/harvest/:sampleId
// @access  Private (Owner only)
const updateHarvest = async (req, res, next) => {
  try {
    const harvest = await Harvest.findOne({ sampleId: req.params.sampleId });

    if (!harvest) {
      return res.status(404).json({
        success: false,
        message: 'Harvest record not found'
      });
    }

    // Check ownership
    if (harvest.harvester.toString() !== req.user._id.toString() && 
        !req.user.permissions.canViewAllData) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Don't allow updates if already processed
    if (harvest.status !== 'COLLECTED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update harvest that has been processed'
      });
    }

    // Validate updates
    const allowedFields = ['qualityMetrics', 'harvestConditions', 'address'];
    const updates = {};
    
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    Object.assign(harvest, updates);

    // Recalculate compliance if location changed
    if (updates.location) {
      harvest.checkGeofenceCompliance();
      harvest.calculateSustainabilityScore();
    }

    await harvest.save();

    logger.info(`Harvest updated: ${harvest.sampleId} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Harvest record updated successfully',
      data: {
        harvest
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get harvest provenance (public)
// @route   GET /api/harvest/:sampleId/provenance
// @access  Public
const getHarvestProvenance = async (req, res, next) => {
  try {
    const harvest = await Harvest.findOne({ sampleId: req.params.sampleId })
      .populate('harvester', 'name profile.organization')
      .select('-photos -metadata -blockchainTxId -blockchainHash');

    if (!harvest) {
      return res.status(404).json({
        success: false,
        message: 'Harvest record not found'
      });
    }

    // Get related batch information
    const Batch = require('../models/Batch');
    const batches = await Batch.find({ 'harvestSamples.sampleId': harvest.sampleId })
      .select('batchId species status qualityGrade labTests processingSteps')
      .populate('processor', 'name profile.organization');

    const provenanceData = {
      harvest: {
        sampleId: harvest.sampleId,
        species: harvest.species,
        commonName: harvest.commonName,
        scientificName: harvest.scientificName,
        quantityKg: harvest.quantityKg,
        harvestDate: harvest.harvestDate,
        harvestMethod: harvest.harvestMethod,
        location: {
          coordinates: harvest.location.coordinates,
          address: harvest.address
        },
        harvester: {
          name: harvest.harvester.name,
          organization: harvest.harvester.profile?.organization?.name
        },
        compliance: harvest.compliance,
        qualityMetrics: harvest.qualityMetrics,
        status: harvest.status
      },
      batches: batches.map(batch => ({
        batchId: batch.batchId,
        species: batch.species,
        status: batch.status,
        qualityGrade: batch.qualityGrade,
        processor: {
          name: batch.processor.name,
          organization: batch.processor.profile?.organization?.name
        },
        processingSteps: batch.processingSteps.length,
        labTests: batch.labTests.map(test => ({
          testType: test.testType,
          status: test.results.status,
          testDate: test.testDate
        }))
      })),
      timeline: [
        {
          event: 'Harvested',
          date: harvest.harvestDate,
          location: harvest.address,
          actor: harvest.harvester.name,
          details: `${harvest.quantityKg}kg of ${harvest.species} harvested using ${harvest.harvestMethod} method`
        },
        ...batches.flatMap(batch => 
          batch.processingSteps.map(step => ({
            event: `Processing: ${step.step}`,
            date: step.startTime,
            actor: step.operatorName || batch.processor.name,
            details: step.description
          }))
        )
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

// @desc    Get harvest statistics
// @route   GET /api/harvest/stats
// @access  Private
const getHarvestStats = async (req, res, next) => {
  try {
    const filter = {};
    
    // If not admin/regulator, only show own harvests
    if (!req.user.permissions.canViewAllData) {
      filter.harvester = req.user._id;
    }

    const stats = await Harvest.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalHarvests: { $sum: 1 },
          totalQuantity: { $sum: '$quantityKg' },
          avgQuantity: { $avg: '$quantityKg' },
          avgSustainabilityScore: { $avg: '$compliance.sustainabilityScore' }
        }
      }
    ]);

    const speciesStats = await Harvest.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$species',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantityKg' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const complianceStats = await Harvest.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            geofence: '$compliance.geofenceStatus',
            seasonal: '$compliance.seasonalStatus'
          },
          count: { $sum: 1 }
        }
      }
    ]);

    const monthlyStats = await Harvest.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: '$harvestDate' },
            month: { $month: '$harvestDate' }
          },
          count: { $sum: 1 },
          quantity: { $sum: '$quantityKg' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalHarvests: 0,
          totalQuantity: 0,
          avgQuantity: 0,
          avgSustainabilityScore: 0
        },
        speciesBreakdown: speciesStats,
        complianceBreakdown: complianceStats,
        monthlyTrends: monthlyStats
      }
    });
  } catch (error) {
    next(error);
  }
};

// Routes
router.post('/', protect, checkPermission('canCreateHarvest'), upload.array('photos', 5), createHarvest);
router.get('/', protect, getHarvests);
router.get('/stats', protect, getHarvestStats);
router.get('/:sampleId', protect, getHarvest);
router.put('/:sampleId', protect, checkOwnership('harvester'), updateHarvest);
router.get('/:sampleId/provenance', getHarvestProvenance); // Public endpoint

module.exports = router;