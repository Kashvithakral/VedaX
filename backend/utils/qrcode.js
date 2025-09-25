const QRCode = require('qrcode');
const logger = require('./logger');

/**
 * Generate QR code as data URL
 * @param {string} data - Data to encode in QR code
 * @param {object} options - QR code options
 * @returns {Promise<string>} - QR code data URL
 */
const generateQRCode = async (data, options = {}) => {
  try {
    const defaultOptions = {
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256,
      ...options
    };

    const qrCodeDataURL = await QRCode.toDataURL(data, defaultOptions);
    return qrCodeDataURL;
  } catch (error) {
    logger.error('Failed to generate QR code:', error);
    throw new Error('QR code generation failed');
  }
};

/**
 * Generate QR code as buffer
 * @param {string} data - Data to encode in QR code
 * @param {object} options - QR code options
 * @returns {Promise<Buffer>} - QR code buffer
 */
const generateQRCodeBuffer = async (data, options = {}) => {
  try {
    const defaultOptions = {
      type: 'png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256,
      ...options
    };

    const qrCodeBuffer = await QRCode.toBuffer(data, defaultOptions);
    return qrCodeBuffer;
  } catch (error) {
    logger.error('Failed to generate QR code buffer:', error);
    throw new Error('QR code generation failed');
  }
};

/**
 * Generate QR code as SVG string
 * @param {string} data - Data to encode in QR code
 * @param {object} options - QR code options
 * @returns {Promise<string>} - QR code SVG string
 */
const generateQRCodeSVG = async (data, options = {}) => {
  try {
    const defaultOptions = {
      type: 'svg',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256,
      ...options
    };

    const qrCodeSVG = await QRCode.toString(data, defaultOptions);
    return qrCodeSVG;
  } catch (error) {
    logger.error('Failed to generate QR code SVG:', error);
    throw new Error('QR code generation failed');
  }
};

/**
 * Create provenance QR code data
 * @param {string} type - Type of record (harvest, batch, etc.)
 * @param {string} id - Record ID
 * @param {object} metadata - Additional metadata
 * @param {string} baseUrl - Base URL for provenance endpoint
 * @returns {object} - QR code data object
 */
const createProvenanceQRData = (type, id, metadata = {}, baseUrl = '') => {
  const qrData = {
    type,
    id,
    timestamp: new Date().toISOString(),
    version: '1.0',
    url: `${baseUrl}/api/${type}/${id}/provenance`,
    ...metadata
  };

  return qrData;
};

/**
 * Validate QR code data
 * @param {string} qrData - QR code data string
 * @returns {object|null} - Parsed QR data or null if invalid
 */
const validateQRData = (qrData) => {
  try {
    const parsed = JSON.parse(qrData);
    
    // Basic validation
    if (!parsed.type || !parsed.id || !parsed.url) {
      return null;
    }

    // Check if it's a VedaX QR code
    if (!parsed.url.includes('/api/')) {
      return null;
    }

    return parsed;
  } catch (error) {
    logger.warn('Invalid QR code data:', error.message);
    return null;
  }
};

module.exports = {
  generateQRCode,
  generateQRCodeBuffer,
  generateQRCodeSVG,
  createProvenanceQRData,
  validateQRData
};