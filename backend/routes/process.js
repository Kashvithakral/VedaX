const express = require('express');
const router = express.Router();

// This file is a placeholder - processing functionality is handled in batch.js
// All processing steps are managed through the batch routes

// Redirect to batch processing endpoints
router.use('*', (req, res) => {
  res.status(301).json({
    success: false,
    message: 'Processing endpoints have been moved to /api/batch/:batchId/process',
    redirect: '/api/batch'
  });
});

module.exports = router;