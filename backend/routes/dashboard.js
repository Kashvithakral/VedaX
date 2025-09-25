const express = require('express');
const Harvest = require('../models/Harvest');
const Batch = require('../models/Batch');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// @desc    Get dashboard overview
// @route   GET /api/dashboard/overview
// @access  Private
const getDashboardOverview = async (req, res, next) => {
  try {
    const filter = {};
    
    // If not admin/regulator, only show own data
    if (!req.user.permissions.canViewAllData) {
      if (req.user.role === 'farmer' || req.user.role === 'collector') {
        filter.harvester = req.user._id;
      } else if (req.user.role === 'processor') {
        // For processors, we'll get batch data separately
      }
    }

    // Get harvest statistics
    const harvestStats = await Harvest.aggregate([
      ...(Object.keys(filter).length > 0 ? [{ $match: filter }] : []),
      {
        $group: {
          _id: null,
          totalHarvests: { $sum: 1 },
          totalQuantity: { $sum: '$quantityKg' },
          avgSustainabilityScore: { $avg: '$compliance.sustainabilityScore' },
          passedGeofence: {
            $sum: { $cond: [{ $eq: ['$compliance.geofenceStatus', 'PASS'] }, 1, 0] }
          },
          passedSeasonal: {
            $sum: { $cond: [{ $eq: ['$compliance.seasonalStatus', 'PASS'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get batch statistics (for processors or admin)
    let batchStats = [{ totalBatches: 0, totalProcessed: 0, avgQualityGrade: 0 }];
    if (req.user.role === 'processor' || req.user.permissions.canViewAllData) {
      const batchFilter = req.user.permissions.canViewAllData ? {} : { processor: req.user._id };
      
      batchStats = await Batch.aggregate([
        { $match: batchFilter },
        {
          $group: {
            _id: null,
            totalBatches: { $sum: 1 },
            totalProcessed: { $sum: '$totalQuantityKg' },
            premiumGrade: {
              $sum: { $cond: [{ $eq: ['$qualityGrade', 'PREMIUM'] }, 1, 0] }
            },
            standardGrade: {
              $sum: { $cond: [{ $eq: ['$qualityGrade', 'STANDARD'] }, 1, 0] }
            },
            basicGrade: {
              $sum: { $cond: [{ $eq: ['$qualityGrade', 'BASIC'] }, 1, 0] }
            }
          }
        }
      ]);
    }

    // Get recent activity
    const recentHarvests = await Harvest.find(filter)
      .populate('harvester', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('sampleId species quantityKg harvestDate harvester createdAt');

    let recentBatches = [];
    if (req.user.role === 'processor' || req.user.permissions.canViewAllData) {
      const batchFilter = req.user.permissions.canViewAllData ? {} : { processor: req.user._id };
      recentBatches = await Batch.find(batchFilter)
        .populate('processor', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
        .select('batchId species totalQuantityKg status processor createdAt');
    }

    // Get compliance summary
    const complianceStats = await Harvest.aggregate([
      ...(Object.keys(filter).length > 0 ? [{ $match: filter }] : []),
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

    // Get species breakdown
    const speciesBreakdown = await Harvest.aggregate([
      ...(Object.keys(filter).length > 0 ? [{ $match: filter }] : []),
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

    const overview = {
      harvests: harvestStats[0] || {
        totalHarvests: 0,
        totalQuantity: 0,
        avgSustainabilityScore: 0,
        passedGeofence: 0,
        passedSeasonal: 0
      },
      batches: batchStats[0] || {
        totalBatches: 0,
        totalProcessed: 0,
        premiumGrade: 0,
        standardGrade: 0,
        basicGrade: 0
      },
      recentActivity: {
        harvests: recentHarvests,
        batches: recentBatches
      },
      compliance: {
        breakdown: complianceStats,
        summary: {
          totalRecords: harvestStats[0]?.totalHarvests || 0,
          geofenceCompliance: harvestStats[0]?.totalHarvests > 0 ? 
            ((harvestStats[0].passedGeofence / harvestStats[0].totalHarvests) * 100).toFixed(1) : 0,
          seasonalCompliance: harvestStats[0]?.totalHarvests > 0 ? 
            ((harvestStats[0].passedSeasonal / harvestStats[0].totalHarvests) * 100).toFixed(1) : 0
        }
      },
      speciesBreakdown,
      generatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: overview
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get monthly trends
// @route   GET /api/dashboard/trends
// @access  Private
const getMonthlyTrends = async (req, res, next) => {
  try {
    const months = parseInt(req.query.months) || 12;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const filter = { createdAt: { $gte: startDate } };
    
    // If not admin/regulator, only show own data
    if (!req.user.permissions.canViewAllData) {
      if (req.user.role === 'farmer' || req.user.role === 'collector') {
        filter.harvester = req.user._id;
      }
    }

    // Get harvest trends
    const harvestTrends = await Harvest.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          quantity: { $sum: '$quantityKg' },
          avgSustainability: { $avg: '$compliance.sustainabilityScore' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get batch trends (for processors or admin)
    let batchTrends = [];
    if (req.user.role === 'processor' || req.user.permissions.canViewAllData) {
      const batchFilter = { createdAt: { $gte: startDate } };
      if (!req.user.permissions.canViewAllData) {
        batchFilter.processor = req.user._id;
      }

      batchTrends = await Batch.aggregate([
        { $match: batchFilter },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 },
            quantity: { $sum: '$totalQuantityKg' },
            premiumCount: {
              $sum: { $cond: [{ $eq: ['$qualityGrade', 'PREMIUM'] }, 1, 0] }
            }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]);
    }

    res.json({
      success: true,
      data: {
        harvests: harvestTrends,
        batches: batchTrends,
        period: {
          months,
          startDate,
          endDate: new Date()
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get compliance dashboard
// @route   GET /api/dashboard/compliance
// @access  Private
const getComplianceDashboard = async (req, res, next) => {
  try {
    const filter = {};
    
    // If not admin/regulator, only show own data
    if (!req.user.permissions.canViewAllData) {
      if (req.user.role === 'farmer' || req.user.role === 'collector') {
        filter.harvester = req.user._id;
      }
    }

    // Get geofence compliance by region
    const geofenceCompliance = await Harvest.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            state: '$address.state',
            status: '$compliance.geofenceStatus'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.state',
          total: { $sum: '$count' },
          passed: {
            $sum: { $cond: [{ $eq: ['$_id.status', 'PASS'] }, '$count', 0] }
          },
          failed: {
            $sum: { $cond: [{ $eq: ['$_id.status', 'FAIL'] }, '$count', 0] }
          }
        }
      },
      {
        $project: {
          state: '$_id',
          total: 1,
          passed: 1,
          failed: 1,
          passRate: {
            $cond: [
              { $gt: ['$total', 0] },
              { $multiply: [{ $divide: ['$passed', '$total'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { passRate: -1 } }
    ]);

    // Get seasonal compliance by species
    const seasonalCompliance = await Harvest.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            species: '$species',
            status: '$compliance.seasonalStatus'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.species',
          total: { $sum: '$count' },
          passed: {
            $sum: { $cond: [{ $eq: ['$_id.status', 'PASS'] }, '$count', 0] }
          },
          failed: {
            $sum: { $cond: [{ $eq: ['$_id.status', 'FAIL'] }, '$count', 0] }
          },
          warning: {
            $sum: { $cond: [{ $eq: ['$_id.status', 'WARNING'] }, '$count', 0] }
          }
        }
      },
      {
        $project: {
          species: '$_id',
          total: 1,
          passed: 1,
          failed: 1,
          warning: 1,
          passRate: {
            $cond: [
              { $gt: ['$total', 0] },
              { $multiply: [{ $divide: ['$passed', '$total'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { passRate: -1 } }
    ]);

    // Get sustainability score distribution
    const sustainabilityDistribution = await Harvest.aggregate([
      { $match: filter },
      {
        $bucket: {
          groupBy: '$compliance.sustainabilityScore',
          boundaries: [0, 25, 50, 75, 90, 100],
          default: 'unknown',
          output: {
            count: { $sum: 1 },
            avgScore: { $avg: '$compliance.sustainabilityScore' }
          }
        }
      }
    ]);

    // Get compliance trends over time
    const complianceTrends = await Harvest.aggregate([
      { $match: { ...filter, createdAt: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          total: { $sum: 1 },
          geofencePassed: {
            $sum: { $cond: [{ $eq: ['$compliance.geofenceStatus', 'PASS'] }, 1, 0] }
          },
          seasonalPassed: {
            $sum: { $cond: [{ $eq: ['$compliance.seasonalStatus', 'PASS'] }, 1, 0] }
          },
          avgSustainability: { $avg: '$compliance.sustainabilityScore' }
        }
      },
      {
        $project: {
          period: '$_id',
          total: 1,
          geofenceRate: {
            $cond: [
              { $gt: ['$total', 0] },
              { $multiply: [{ $divide: ['$geofencePassed', '$total'] }, 100] },
              0
            ]
          },
          seasonalRate: {
            $cond: [
              { $gt: ['$total', 0] },
              { $multiply: [{ $divide: ['$seasonalPassed', '$total'] }, 100] },
              0
            ]
          },
          avgSustainability: 1
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        geofenceCompliance,
        seasonalCompliance,
        sustainabilityDistribution,
        complianceTrends,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user activity dashboard (admin only)
// @route   GET /api/dashboard/users
// @access  Private/Admin
const getUserDashboard = async (req, res, next) => {
  try {
    // Get user statistics
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } },
          verified: { $sum: { $cond: ['$isVerified', 1, 0] } }
        }
      }
    ]);

    // Get recent registrations
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name email role isActive isVerified createdAt');

    // Get user activity by month
    const userGrowth = await User.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          newUsers: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    // Get harvest activity by user role
    const harvestByRole = await Harvest.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'harvester',
          foreignField: '_id',
          as: 'harvesterInfo'
        }
      },
      { $unwind: '$harvesterInfo' },
      {
        $group: {
          _id: '$harvesterInfo.role',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantityKg' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        userStats,
        recentUsers,
        userGrowth,
        harvestByRole,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get system health dashboard (admin only)
// @route   GET /api/dashboard/system
// @access  Private/Admin
const getSystemDashboard = async (req, res, next) => {
  try {
    // Get database statistics
    const dbStats = {
      users: await User.countDocuments(),
      harvests: await Harvest.countDocuments(),
      batches: await Batch.countDocuments(),
      activeUsers: await User.countDocuments({ isActive: true }),
      recentHarvests: await Harvest.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }),
      recentBatches: await Batch.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      })
    };

    // Get sync status
    const syncStats = await Harvest.aggregate([
      {
        $group: {
          _id: '$metadata.syncStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get quality metrics
    const qualityStats = await Batch.aggregate([
      {
        $group: {
          _id: '$qualityGrade',
          count: { $sum: 1 }
        }
      }
    ]);

    // System uptime and performance metrics
    const systemMetrics = {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: {
        database: dbStats,
        sync: syncStats,
        quality: qualityStats,
        system: systemMetrics,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

// Routes
router.get('/overview', protect, getDashboardOverview);
router.get('/trends', protect, getMonthlyTrends);
router.get('/compliance', protect, getComplianceDashboard);
router.get('/users', protect, authorize('admin'), getUserDashboard);
router.get('/system', protect, authorize('admin'), getSystemDashboard);

module.exports = router;