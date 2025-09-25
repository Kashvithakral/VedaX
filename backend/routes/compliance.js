const express = require('express');
const Harvest = require('../models/Harvest');
const Batch = require('../models/Batch');
const { protect, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// @desc    Check harvest compliance
// @route   POST /api/compliance/check-harvest
// @access  Private
const checkHarvestCompliance = async (req, res, next) => {
  try {
    const { sampleId, species, location, harvestDate } = req.body;

    if (!species || !location || !harvestDate) {
      return res.status(400).json({
        success: false,
        message: 'Species, location, and harvest date are required'
      });
    }

    const compliance = {
      sampleId,
      species,
      location,
      harvestDate: new Date(harvestDate),
      checks: {}
    };

    // Geofence compliance check
    const [lng, lat] = location.coordinates;
    const minLat = parseFloat(process.env.GEOFENCE_MIN_LAT) || 20.0;
    const maxLat = parseFloat(process.env.GEOFENCE_MAX_LAT) || 35.5;
    const minLng = parseFloat(process.env.GEOFENCE_MIN_LNG) || 70.0;
    const maxLng = parseFloat(process.env.GEOFENCE_MAX_LNG) || 90.0;
    
    const isWithinGeofence = lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
    compliance.checks.geofence = {
      status: isWithinGeofence ? 'PASS' : 'FAIL',
      message: isWithinGeofence ? 'Location within permitted area' : 'Location outside permitted area',
      coordinates: { lat, lng },
      boundaries: { minLat, maxLat, minLng, maxLng }
    };

    // Seasonal compliance check
    const seasonalRules = {
      'Ashwagandha': [4, 5, 6, 10, 11],
      'Tulsi': [3, 4, 5, 6, 7, 8, 9],
      'Amla': [11, 12, 1, 2],
      'Brahmi': [3, 4, 5, 9, 10, 11],
      'Neem': [1, 2, 3, 4, 11, 12]
    };

    const harvestMonth = new Date(harvestDate).getMonth() + 1;
    const allowedMonths = seasonalRules[species];
    
    let seasonalStatus = 'WARNING';
    let seasonalMessage = 'Unknown species - seasonal rules not defined';
    
    if (allowedMonths) {
      const isInSeason = allowedMonths.includes(harvestMonth);
      seasonalStatus = isInSeason ? 'PASS' : 'FAIL';
      seasonalMessage = isInSeason 
        ? 'Harvest within permitted season' 
        : `Harvest outside permitted season. Allowed months: ${allowedMonths.join(', ')}`;
    }

    compliance.checks.seasonal = {
      status: seasonalStatus,
      message: seasonalMessage,
      harvestMonth,
      allowedMonths: allowedMonths || []
    };

    // Calculate overall compliance score
    let score = 50; // Base score
    if (compliance.checks.geofence.status === 'PASS') score += 25;
    else if (compliance.checks.geofence.status === 'FAIL') score -= 25;
    
    if (compliance.checks.seasonal.status === 'PASS') score += 25;
    else if (compliance.checks.seasonal.status === 'FAIL') score -= 20;
    else if (compliance.checks.seasonal.status === 'WARNING') score -= 5;

    compliance.overallScore = Math.max(0, Math.min(100, score));
    compliance.overallStatus = score >= 75 ? 'COMPLIANT' : score >= 50 ? 'PARTIAL' : 'NON_COMPLIANT';

    res.json({
      success: true,
      data: compliance
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get compliance report
// @route   GET /api/compliance/report
// @access  Private
const getComplianceReport = async (req, res, next) => {
  try {
    const { startDate, endDate, species, region } = req.query;
    
    const filter = {};
    
    // If not admin/regulator, only show own data
    if (!req.user.permissions.canViewAllData) {
      if (req.user.role === 'farmer' || req.user.role === 'collector') {
        filter.harvester = req.user._id;
      }
    }

    // Date range filter
    if (startDate || endDate) {
      filter.harvestDate = {};
      if (startDate) filter.harvestDate.$gte = new Date(startDate);
      if (endDate) filter.harvestDate.$lte = new Date(endDate);
    }

    if (species) filter.species = new RegExp(species, 'i');
    if (region) filter['address.state'] = new RegExp(region, 'i');

    // Get compliance statistics
    const complianceStats = await Harvest.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          geofencePass: {
            $sum: { $cond: [{ $eq: ['$compliance.geofenceStatus', 'PASS'] }, 1, 0] }
          },
          geofenceFail: {
            $sum: { $cond: [{ $eq: ['$compliance.geofenceStatus', 'FAIL'] }, 1, 0] }
          },
          seasonalPass: {
            $sum: { $cond: [{ $eq: ['$compliance.seasonalStatus', 'PASS'] }, 1, 0] }
          },
          seasonalFail: {
            $sum: { $cond: [{ $eq: ['$compliance.seasonalStatus', 'FAIL'] }, 1, 0] }
          },
          seasonalWarning: {
            $sum: { $cond: [{ $eq: ['$compliance.seasonalStatus', 'WARNING'] }, 1, 0] }
          },
          avgSustainabilityScore: { $avg: '$compliance.sustainabilityScore' },
          totalQuantity: { $sum: '$quantityKg' }
        }
      }
    ]);

    // Get compliance by species
    const speciesCompliance = await Harvest.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$species',
          totalRecords: { $sum: 1 },
          geofencePassRate: {
            $avg: { $cond: [{ $eq: ['$compliance.geofenceStatus', 'PASS'] }, 1, 0] }
          },
          seasonalPassRate: {
            $avg: { $cond: [{ $eq: ['$compliance.seasonalStatus', 'PASS'] }, 1, 0] }
          },
          avgSustainabilityScore: { $avg: '$compliance.sustainabilityScore' },
          totalQuantity: { $sum: '$quantityKg' }
        }
      },
      { $sort: { totalRecords: -1 } }
    ]);

    // Get compliance by region
    const regionCompliance = await Harvest.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$address.state',
          totalRecords: { $sum: 1 },
          geofencePassRate: {
            $avg: { $cond: [{ $eq: ['$compliance.geofenceStatus', 'PASS'] }, 1, 0] }
          },
          seasonalPassRate: {
            $avg: { $cond: [{ $eq: ['$compliance.seasonalStatus', 'PASS'] }, 1, 0] }
          },
          avgSustainabilityScore: { $avg: '$compliance.sustainabilityScore' }
        }
      },
      { $sort: { totalRecords: -1 } }
    ]);

    // Get compliance trends
    const complianceTrends = await Harvest.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: '$harvestDate' },
            month: { $month: '$harvestDate' }
          },
          totalRecords: { $sum: 1 },
          geofencePassRate: {
            $avg: { $cond: [{ $eq: ['$compliance.geofenceStatus', 'PASS'] }, 1, 0] }
          },
          seasonalPassRate: {
            $avg: { $cond: [{ $eq: ['$compliance.seasonalStatus', 'PASS'] }, 1, 0] }
          },
          avgSustainabilityScore: { $avg: '$compliance.sustainabilityScore' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get non-compliant records
    const nonCompliantRecords = await Harvest.find({
      ...filter,
      $or: [
        { 'compliance.geofenceStatus': 'FAIL' },
        { 'compliance.seasonalStatus': 'FAIL' },
        { 'compliance.sustainabilityScore': { $lt: 50 } }
      ]
    })
    .populate('harvester', 'name email')
    .sort({ harvestDate: -1 })
    .limit(20)
    .select('sampleId species harvestDate location compliance harvester');

    const report = {
      summary: complianceStats[0] || {
        totalRecords: 0,
        geofencePass: 0,
        geofenceFail: 0,
        seasonalPass: 0,
        seasonalFail: 0,
        seasonalWarning: 0,
        avgSustainabilityScore: 0,
        totalQuantity: 0
      },
      speciesBreakdown: speciesCompliance,
      regionBreakdown: regionCompliance,
      trends: complianceTrends,
      nonCompliantRecords,
      filters: {
        startDate,
        endDate,
        species,
        region
      },
      generatedAt: new Date().toISOString(),
      generatedBy: req.user.name
    };

    // Calculate compliance rates
    if (report.summary.totalRecords > 0) {
      report.summary.geofencePassRate = ((report.summary.geofencePass / report.summary.totalRecords) * 100).toFixed(2);
      report.summary.seasonalPassRate = ((report.summary.seasonalPass / report.summary.totalRecords) * 100).toFixed(2);
      report.summary.overallComplianceRate = (
        ((report.summary.geofencePass + report.summary.seasonalPass) / (report.summary.totalRecords * 2)) * 100
      ).toFixed(2);
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get compliance violations
// @route   GET /api/compliance/violations
// @access  Private (Regulators/Admin)
const getComplianceViolations = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const { severity = 'all', type = 'all' } = req.query;

    // Build violation filter
    const violationFilter = {
      $or: []
    };

    if (type === 'all' || type === 'geofence') {
      violationFilter.$or.push({ 'compliance.geofenceStatus': 'FAIL' });
    }

    if (type === 'all' || type === 'seasonal') {
      violationFilter.$or.push({ 'compliance.seasonalStatus': 'FAIL' });
    }

    if (type === 'all' || type === 'sustainability') {
      violationFilter.$or.push({ 'compliance.sustainabilityScore': { $lt: 50 } });
    }

    // Severity filter
    if (severity === 'high') {
      violationFilter.$and = [
        { $or: violationFilter.$or },
        {
          $or: [
            { 'compliance.geofenceStatus': 'FAIL' },
            { 'compliance.sustainabilityScore': { $lt: 25 } }
          ]
        }
      ];
    } else if (severity === 'medium') {
      violationFilter.$and = [
        { $or: violationFilter.$or },
        { 'compliance.sustainabilityScore': { $gte: 25, $lt: 50 } }
      ];
    }

    const violations = await Harvest.find(violationFilter)
      .populate('harvester', 'name email profile.organization')
      .sort({ harvestDate: -1 })
      .skip(skip)
      .limit(limit)
      .select('sampleId species quantityKg harvestDate location address compliance harvester');

    const total = await Harvest.countDocuments(violationFilter);

    // Categorize violations
    const categorizedViolations = violations.map(violation => {
      const issues = [];
      let severityLevel = 'low';

      if (violation.compliance.geofenceStatus === 'FAIL') {
        issues.push({
          type: 'geofence',
          message: 'Harvest location outside permitted area',
          severity: 'high'
        });
        severityLevel = 'high';
      }

      if (violation.compliance.seasonalStatus === 'FAIL') {
        issues.push({
          type: 'seasonal',
          message: 'Harvest outside permitted season',
          severity: 'medium'
        });
        if (severityLevel !== 'high') severityLevel = 'medium';
      }

      if (violation.compliance.sustainabilityScore < 25) {
        issues.push({
          type: 'sustainability',
          message: 'Very low sustainability score',
          severity: 'high'
        });
        severityLevel = 'high';
      } else if (violation.compliance.sustainabilityScore < 50) {
        issues.push({
          type: 'sustainability',
          message: 'Low sustainability score',
          severity: 'medium'
        });
        if (severityLevel !== 'high') severityLevel = 'medium';
      }

      return {
        ...violation.toObject(),
        issues,
        severityLevel,
        riskScore: 100 - (violation.compliance.sustainabilityScore || 0)
      };
    });

    res.json({
      success: true,
      data: {
        violations: categorizedViolations,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        summary: {
          totalViolations: total,
          highSeverity: categorizedViolations.filter(v => v.severityLevel === 'high').length,
          mediumSeverity: categorizedViolations.filter(v => v.severityLevel === 'medium').length,
          lowSeverity: categorizedViolations.filter(v => v.severityLevel === 'low').length
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update compliance rules
// @route   PUT /api/compliance/rules
// @access  Private (Admin only)
const updateComplianceRules = async (req, res, next) => {
  try {
    const { geofence, seasonal, sustainability } = req.body;

    // This would typically update a compliance rules configuration
    // For now, we'll return the current rules and log the update request
    
    const currentRules = {
      geofence: {
        minLat: parseFloat(process.env.GEOFENCE_MIN_LAT) || 20.0,
        maxLat: parseFloat(process.env.GEOFENCE_MAX_LAT) || 35.5,
        minLng: parseFloat(process.env.GEOFENCE_MIN_LNG) || 70.0,
        maxLng: parseFloat(process.env.GEOFENCE_MAX_LNG) || 90.0
      },
      seasonal: {
        'Ashwagandha': [4, 5, 6, 10, 11],
        'Tulsi': [3, 4, 5, 6, 7, 8, 9],
        'Amla': [11, 12, 1, 2],
        'Brahmi': [3, 4, 5, 9, 10, 11],
        'Neem': [1, 2, 3, 4, 11, 12]
      },
      sustainability: {
        minScore: 50,
        weights: {
          geofence: 25,
          seasonal: 25,
          harvestMethod: 15,
          quality: 15,
          certification: 20
        }
      }
    };

    logger.info(`Compliance rules update requested by ${req.user.email}:`, {
      geofence,
      seasonal,
      sustainability
    });

    res.json({
      success: true,
      message: 'Compliance rules update logged. Implementation requires system restart.',
      data: {
        currentRules,
        requestedUpdates: { geofence, seasonal, sustainability },
        updatedBy: req.user.name,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk compliance check
// @route   POST /api/compliance/bulk-check
// @access  Private
const bulkComplianceCheck = async (req, res, next) => {
  try {
    const { sampleIds } = req.body;

    if (!sampleIds || !Array.isArray(sampleIds)) {
      return res.status(400).json({
        success: false,
        message: 'Array of sample IDs is required'
      });
    }

    if (sampleIds.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 100 samples can be checked at once'
      });
    }

    const harvests = await Harvest.find({ sampleId: { $in: sampleIds } })
      .select('sampleId species harvestDate location compliance');

    const results = harvests.map(harvest => {
      // Recalculate compliance
      const tempHarvest = new Harvest(harvest.toObject());
      tempHarvest.checkGeofenceCompliance();
      tempHarvest.checkSeasonalCompliance();
      tempHarvest.calculateSustainabilityScore();

      return {
        sampleId: harvest.sampleId,
        species: harvest.species,
        harvestDate: harvest.harvestDate,
        compliance: {
          geofence: tempHarvest.compliance.geofenceStatus,
          seasonal: tempHarvest.compliance.seasonalStatus,
          sustainabilityScore: tempHarvest.compliance.sustainabilityScore,
          overallStatus: tempHarvest.compliance.sustainabilityScore >= 75 ? 'COMPLIANT' : 
                        tempHarvest.compliance.sustainabilityScore >= 50 ? 'PARTIAL' : 'NON_COMPLIANT'
        }
      };
    });

    const summary = {
      total: results.length,
      compliant: results.filter(r => r.compliance.overallStatus === 'COMPLIANT').length,
      partial: results.filter(r => r.compliance.overallStatus === 'PARTIAL').length,
      nonCompliant: results.filter(r => r.compliance.overallStatus === 'NON_COMPLIANT').length,
      notFound: sampleIds.length - results.length
    };

    res.json({
      success: true,
      data: {
        results,
        summary,
        checkedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

// Routes
router.post('/check-harvest', protect, checkHarvestCompliance);
router.get('/report', protect, getComplianceReport);
router.get('/violations', protect, authorize('regulator', 'admin'), getComplianceViolations);
router.put('/rules', protect, authorize('admin'), updateComplianceRules);
router.post('/bulk-check', protect, bulkComplianceCheck);

module.exports = router;