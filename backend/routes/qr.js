const express = require('express');
const { generateQRCode, generateQRCodeBuffer, createProvenanceQRData, validateQRData } = require('../utils/qrcode');
const { optionalAuth } = require('../middleware/auth');
const Harvest = require('../models/Harvest');
const Batch = require('../models/Batch');
const logger = require('../utils/logger');

const router = express.Router();

// @desc    Generate QR code for any data
// @route   POST /api/qr/generate
// @access  Public
const generateQR = async (req, res, next) => {
  try {
    const { data, format = 'dataurl', options = {} } = req.body;

    if (!data) {
      return res.status(400).json({
        success: false,
        message: 'Data is required to generate QR code'
      });
    }

    let qrCode;
    let contentType = 'application/json';

    switch (format.toLowerCase()) {
      case 'buffer':
      case 'png':
        qrCode = await generateQRCodeBuffer(data, options);
        contentType = 'image/png';
        break;
      case 'dataurl':
      default:
        qrCode = await generateQRCode(data, options);
        break;
    }

    if (format.toLowerCase() === 'buffer' || format.toLowerCase() === 'png') {
      res.set('Content-Type', contentType);
      res.send(qrCode);
    } else {
      res.json({
        success: true,
        data: {
          qrCode,
          format,
          generatedAt: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Generate provenance QR code for harvest
// @route   GET /api/qr/harvest/:sampleId
// @access  Public
const generateHarvestQR = async (req, res, next) => {
  try {
    const { sampleId } = req.params;
    const { format = 'dataurl' } = req.query;

    const harvest = await Harvest.findOne({ sampleId })
      .select('sampleId species harvestDate location harvester')
      .populate('harvester', 'name profile.organization');

    if (!harvest) {
      return res.status(404).json({
        success: false,
        message: 'Harvest record not found'
      });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const qrData = createProvenanceQRData('harvest', sampleId, {
      species: harvest.species,
      harvestDate: harvest.harvestDate,
      harvester: harvest.harvester.name,
      organization: harvest.harvester.profile?.organization?.name
    }, baseUrl);

    let qrCode;
    let contentType = 'application/json';

    switch (format.toLowerCase()) {
      case 'buffer':
      case 'png':
        qrCode = await generateQRCodeBuffer(JSON.stringify(qrData));
        contentType = 'image/png';
        break;
      case 'dataurl':
      default:
        qrCode = await generateQRCode(JSON.stringify(qrData));
        break;
    }

    if (format.toLowerCase() === 'buffer' || format.toLowerCase() === 'png') {
      res.set('Content-Type', contentType);
      res.set('Content-Disposition', `inline; filename="harvest-${sampleId}.png"`);
      res.send(qrCode);
    } else {
      res.json({
        success: true,
        data: {
          qrCode,
          qrData,
          sampleId,
          format,
          generatedAt: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Generate provenance QR code for batch
// @route   GET /api/qr/batch/:batchId
// @access  Public
const generateBatchQR = async (req, res, next) => {
  try {
    const { batchId } = req.params;
    const { format = 'dataurl' } = req.query;

    const batch = await Batch.findOne({ batchId })
      .select('batchId species totalQuantityKg processor status qualityGrade')
      .populate('processor', 'name profile.organization');

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const qrData = createProvenanceQRData('batch', batchId, {
      species: batch.species,
      totalQuantityKg: batch.totalQuantityKg,
      processor: batch.processor.name,
      organization: batch.processor.profile?.organization?.name,
      status: batch.status,
      qualityGrade: batch.qualityGrade
    }, baseUrl);

    let qrCode;
    let contentType = 'application/json';

    switch (format.toLowerCase()) {
      case 'buffer':
      case 'png':
        qrCode = await generateQRCodeBuffer(JSON.stringify(qrData));
        contentType = 'image/png';
        break;
      case 'dataurl':
      default:
        qrCode = await generateQRCode(JSON.stringify(qrData));
        break;
    }

    if (format.toLowerCase() === 'buffer' || format.toLowerCase() === 'png') {
      res.set('Content-Type', contentType);
      res.set('Content-Disposition', `inline; filename="batch-${batchId}.png"`);
      res.send(qrCode);
    } else {
      res.json({
        success: true,
        data: {
          qrCode,
          qrData,
          batchId,
          format,
          generatedAt: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Scan and validate QR code
// @route   POST /api/qr/scan
// @access  Public
const scanQR = async (req, res, next) => {
  try {
    const { qrData } = req.body;

    if (!qrData) {
      return res.status(400).json({
        success: false,
        message: 'QR code data is required'
      });
    }

    const parsedData = validateQRData(qrData);

    if (!parsedData) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR code data'
      });
    }

    // Check if it's a VedaX provenance QR code
    if (parsedData.type && parsedData.id && parsedData.url) {
      let record = null;
      let recordType = parsedData.type;

      // Fetch the actual record
      if (parsedData.type === 'harvest') {
        record = await Harvest.findOne({ sampleId: parsedData.id })
          .populate('harvester', 'name profile.organization')
          .select('-photos -metadata');
      } else if (parsedData.type === 'batch') {
        record = await Batch.findOne({ batchId: parsedData.id })
          .populate('processor', 'name profile.organization')
          .select('-metadata');
      }

      if (!record) {
        return res.status(404).json({
          success: false,
          message: `${recordType} record not found`,
          qrData: parsedData
        });
      }

      res.json({
        success: true,
        data: {
          qrData: parsedData,
          record,
          recordType,
          provenanceUrl: parsedData.url,
          scannedAt: new Date().toISOString()
        }
      });
    } else {
      // Generic QR code
      res.json({
        success: true,
        data: {
          qrData: parsedData,
          type: 'generic',
          scannedAt: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get QR code analytics
// @route   GET /api/qr/analytics
// @access  Private (Admin)
const getQRAnalytics = async (req, res, next) => {
  try {
    // This would typically track QR code scans in a separate collection
    // For now, return basic statistics
    
    const harvestCount = await Harvest.countDocuments({});
    const batchCount = await Batch.countDocuments({});

    const harvestsWithQR = await Harvest.countDocuments({ qrCode: { $exists: true, $ne: null } });
    const batchesWithQR = await Batch.countDocuments({ 'traceability.qrCode': { $exists: true, $ne: null } });

    res.json({
      success: true,
      data: {
        totalRecords: harvestCount + batchCount,
        recordsWithQR: harvestsWithQR + batchesWithQR,
        qrCoverage: {
          harvests: {
            total: harvestCount,
            withQR: harvestsWithQR,
            percentage: harvestCount > 0 ? ((harvestsWithQR / harvestCount) * 100).toFixed(2) : 0
          },
          batches: {
            total: batchCount,
            withQR: batchesWithQR,
            percentage: batchCount > 0 ? ((batchesWithQR / batchCount) * 100).toFixed(2) : 0
          }
        },
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk generate QR codes
// @route   POST /api/qr/bulk-generate
// @access  Private
const bulkGenerateQR = async (req, res, next) => {
  try {
    const { type, ids, format = 'dataurl' } = req.body;

    if (!type || !ids || !Array.isArray(ids)) {
      return res.status(400).json({
        success: false,
        message: 'Type and array of IDs are required'
      });
    }

    if (ids.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 100 QR codes can be generated at once'
      });
    }

    const results = [];
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    for (const id of ids) {
      try {
        let record = null;
        let qrData = null;

        if (type === 'harvest') {
          record = await Harvest.findOne({ sampleId: id })
            .select('sampleId species harvestDate harvester')
            .populate('harvester', 'name profile.organization');
          
          if (record) {
            qrData = createProvenanceQRData('harvest', id, {
              species: record.species,
              harvestDate: record.harvestDate,
              harvester: record.harvester.name
            }, baseUrl);
          }
        } else if (type === 'batch') {
          record = await Batch.findOne({ batchId: id })
            .select('batchId species processor status')
            .populate('processor', 'name profile.organization');
          
          if (record) {
            qrData = createProvenanceQRData('batch', id, {
              species: record.species,
              processor: record.processor.name,
              status: record.status
            }, baseUrl);
          }
        }

        if (record && qrData) {
          const qrCode = await generateQRCode(JSON.stringify(qrData));
          results.push({
            id,
            success: true,
            qrCode,
            qrData
          });
        } else {
          results.push({
            id,
            success: false,
            error: 'Record not found'
          });
        }
      } catch (error) {
        results.push({
          id,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    res.json({
      success: true,
      data: {
        results,
        summary: {
          total: results.length,
          successful: successCount,
          failed: failureCount
        },
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

// Routes
router.post('/generate', generateQR);
router.get('/harvest/:sampleId', generateHarvestQR);
router.get('/batch/:batchId', generateBatchQR);
router.post('/scan', scanQR);
router.get('/analytics', optionalAuth, getQRAnalytics);
router.post('/bulk-generate', optionalAuth, bulkGenerateQR);

module.exports = router;