const express = require('express');
const multer = require('multer');
const path = require('path');
const Joi = require('joi');
const Batch = require('../models/Batch');
const { protect, checkPermission, authorize } = require('../middleware/auth');
const { submitToBlockchain } = require('../services/blockchain');
const logger = require('../utils/logger');

const router = express.Router();

// Configure multer for certificate uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/certificates'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `cert-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files are allowed for certificates'), false);
    }
  }
});

// Validation schemas
const labTestSchema = Joi.object({
  batchId: Joi.string().required(),
  testType: Joi.string().valid('microbial', 'heavy_metals', 'pesticides', 'aflatoxins', 'identity', 'potency', 'purity').required(),
  testDate: Joi.date().max('now').required(),
  results: Joi.object({
    status: Joi.string().valid('PASS', 'FAIL', 'PENDING', 'RETEST').required(),
    parameters: Joi.array().items(
      Joi.object({
        parameter: Joi.string().required(),
        value: Joi.string().required(),
        unit: Joi.string().optional(),
        limit: Joi.string().optional(),
        status: Joi.string().valid('PASS', 'FAIL', 'WARNING').required()
      })
    ).optional(),
    overallScore: Joi.number().min(0).max(100).optional(),
    notes: Joi.string().max(1000).optional()
  }).required()
});

// @desc    Add lab test result to batch
// @route   POST /api/lab/test
// @access  Private (Lab users)
const addLabTest = async (req, res, next) => {
  try {
    // Validate input
    const { error, value } = labTestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { batchId, testType, testDate, results } = value;

    // Find the batch
    const batch = await Batch.findOne({ batchId });
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    // Check if test already exists for this type
    const existingTest = batch.labTests.find(test => 
      test.testType === testType && test.results.status !== 'RETEST'
    );

    if (existingTest) {
      return res.status(400).json({
        success: false,
        message: `${testType} test already exists for this batch`
      });
    }

    // Handle certificate upload
    let certificateInfo = null;
    if (req.file) {
      certificateInfo = {
        filename: req.file.filename,
        url: `/uploads/certificates/${req.file.filename}`,
        uploadedAt: new Date()
      };
    }

    // Add lab test
    const testData = {
      labId: req.user._id,
      labName: req.user.name || req.user.profile?.organization?.name,
      testType,
      testDate: new Date(testDate),
      results,
      certificate: certificateInfo
    };

    const testId = batch.addLabTest(testData);

    // Update batch status if needed
    if (batch.status === 'PROCESSING') {
      batch.status = 'TESTING';
    }

    // Recalculate quality grade
    batch.calculateQualityGrade();

    await batch.save();

    // Submit to blockchain (async)
    submitToBlockchain('lab_test', {
      batchId: batch.batchId,
      testId,
      testType,
      results: results.status,
      labId: req.user._id,
      labName: req.user.name,
      timestamp: new Date()
    }).catch(error => {
      logger.error('Blockchain submission failed for lab test:', error);
    });

    logger.info(`Lab test added to batch ${batchId}: ${testType} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Lab test result added successfully',
      data: {
        testId,
        batch: {
          batchId: batch.batchId,
          qualityGrade: batch.qualityGrade,
          status: batch.status
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all lab tests
// @route   GET /api/lab/tests
// @access  Private
const getLabTests = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    
    // If not admin/regulator, only show own tests
    if (!req.user.permissions.canViewAllData) {
      filter['labTests.labId'] = req.user._id;
    }

    if (req.query.testType) filter['labTests.testType'] = req.query.testType;
    if (req.query.status) filter['labTests.results.status'] = req.query.status;
    if (req.query.batchId) filter.batchId = req.query.batchId;

    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      filter['labTests.testDate'] = {};
      if (req.query.startDate) filter['labTests.testDate'].$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter['labTests.testDate'].$lte = new Date(req.query.endDate);
    }

    const batches = await Batch.find(filter)
      .populate('processor', 'name profile.organization')
      .sort({ 'labTests.testDate': -1 })
      .skip(skip)
      .limit(limit)
      .select('batchId species labTests processor');

    // Flatten lab tests from all batches
    const labTests = [];
    batches.forEach(batch => {
      batch.labTests.forEach(test => {
        labTests.push({
          ...test.toObject(),
          batchId: batch.batchId,
          species: batch.species,
          processor: batch.processor
        });
      });
    });

    // Filter lab tests if user-specific
    const filteredTests = req.user.permissions.canViewAllData 
      ? labTests 
      : labTests.filter(test => test.labId?.toString() === req.user._id.toString());

    // Sort and paginate
    const sortedTests = filteredTests.sort((a, b) => new Date(b.testDate) - new Date(a.testDate));
    const paginatedTests = sortedTests.slice(skip, skip + limit);

    const total = filteredTests.length;

    res.json({
      success: true,
      data: {
        tests: paginatedTests,
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

// @desc    Get lab test by ID
// @route   GET /api/lab/test/:testId
// @access  Private
const getLabTest = async (req, res, next) => {
  try {
    const { testId } = req.params;

    const batch = await Batch.findOne({ 'labTests.testId': testId })
      .populate('processor', 'name profile.organization')
      .populate('labTests.labId', 'name profile.organization');

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Lab test not found'
      });
    }

    const labTest = batch.labTests.find(test => test.testId === testId);

    // Check ownership if not admin/regulator
    if (!req.user.permissions.canViewAllData && 
        labTest.labId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: {
        test: {
          ...labTest.toObject(),
          batchId: batch.batchId,
          species: batch.species,
          processor: batch.processor
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update lab test result
// @route   PUT /api/lab/test/:testId
// @access  Private (Lab users - own tests only)
const updateLabTest = async (req, res, next) => {
  try {
    const { testId } = req.params;
    const { results } = req.body;

    if (!results) {
      return res.status(400).json({
        success: false,
        message: 'Test results are required'
      });
    }

    const batch = await Batch.findOne({ 'labTests.testId': testId });

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Lab test not found'
      });
    }

    const labTest = batch.labTests.find(test => test.testId === testId);

    // Check ownership
    if (labTest.labId.toString() !== req.user._id.toString() && 
        !req.user.permissions.canViewAllData) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Don't allow updates if test is already finalized
    if (labTest.results.status === 'PASS' || labTest.results.status === 'FAIL') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update finalized test results'
      });
    }

    // Update results
    labTest.results = { ...labTest.results, ...results };

    // Handle new certificate upload
    if (req.file) {
      labTest.certificate = {
        filename: req.file.filename,
        url: `/uploads/certificates/${req.file.filename}`,
        uploadedAt: new Date()
      };
    }

    // Recalculate quality grade
    batch.calculateQualityGrade();

    await batch.save();

    logger.info(`Lab test updated: ${testId} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Lab test result updated successfully',
      data: {
        test: labTest,
        qualityGrade: batch.qualityGrade
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get lab test statistics
// @route   GET /api/lab/stats
// @access  Private
const getLabStats = async (req, res, next) => {
  try {
    const filter = {};
    
    // If not admin/regulator, only show own tests
    if (!req.user.permissions.canViewAllData) {
      filter['labTests.labId'] = req.user._id;
    }

    const stats = await Batch.aggregate([
      { $match: filter },
      { $unwind: '$labTests' },
      ...(req.user.permissions.canViewAllData ? [] : [
        { $match: { 'labTests.labId': req.user._id } }
      ]),
      {
        $group: {
          _id: null,
          totalTests: { $sum: 1 },
          passedTests: {
            $sum: { $cond: [{ $eq: ['$labTests.results.status', 'PASS'] }, 1, 0] }
          },
          failedTests: {
            $sum: { $cond: [{ $eq: ['$labTests.results.status', 'FAIL'] }, 1, 0] }
          },
          pendingTests: {
            $sum: { $cond: [{ $eq: ['$labTests.results.status', 'PENDING'] }, 1, 0] }
          },
          avgScore: { $avg: '$labTests.results.overallScore' }
        }
      }
    ]);

    const testTypeStats = await Batch.aggregate([
      { $match: filter },
      { $unwind: '$labTests' },
      ...(req.user.permissions.canViewAllData ? [] : [
        { $match: { 'labTests.labId': req.user._id } }
      ]),
      {
        $group: {
          _id: '$labTests.testType',
          count: { $sum: 1 },
          passRate: {
            $avg: { $cond: [{ $eq: ['$labTests.results.status', 'PASS'] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const monthlyStats = await Batch.aggregate([
      { $match: filter },
      { $unwind: '$labTests' },
      ...(req.user.permissions.canViewAllData ? [] : [
        { $match: { 'labTests.labId': req.user._id } }
      ]),
      {
        $group: {
          _id: {
            year: { $year: '$labTests.testDate' },
            month: { $month: '$labTests.testDate' }
          },
          count: { $sum: 1 },
          passRate: {
            $avg: { $cond: [{ $eq: ['$labTests.results.status', 'PASS'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalTests: 0,
          passedTests: 0,
          failedTests: 0,
          pendingTests: 0,
          avgScore: 0
        },
        testTypeBreakdown: testTypeStats,
        monthlyTrends: monthlyStats,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get pending tests for lab
// @route   GET /api/lab/pending
// @access  Private (Lab users)
const getPendingTests = async (req, res, next) => {
  try {
    const batches = await Batch.find({
      status: { $in: ['PROCESSING', 'TESTING'] },
      'labTests.results.status': 'PENDING'
    })
    .populate('processor', 'name profile.organization')
    .sort({ createdAt: -1 })
    .select('batchId species totalQuantityKg processor labTests status');

    // Filter to show only tests assigned to this lab or unassigned tests
    const pendingBatches = batches.filter(batch => {
      return batch.labTests.some(test => 
        test.results.status === 'PENDING' && 
        (!test.labId || test.labId.toString() === req.user._id.toString())
      );
    });

    res.json({
      success: true,
      data: {
        batches: pendingBatches,
        count: pendingBatches.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// Routes
router.post('/test', protect, checkPermission('canRunLabTests'), upload.single('certificate'), addLabTest);
router.get('/tests', protect, getLabTests);
router.get('/stats', protect, getLabStats);
router.get('/pending', protect, checkPermission('canRunLabTests'), getPendingTests);
router.get('/test/:testId', protect, getLabTest);
router.put('/test/:testId', protect, checkPermission('canRunLabTests'), upload.single('certificate'), updateLabTest);

module.exports = router;