const mongoose = require('mongoose');

const harvestSchema = new mongoose.Schema({
  sampleId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  species: {
    type: String,
    required: [true, 'Species name is required'],
    trim: true
  },
  commonName: {
    type: String,
    trim: true
  },
  scientificName: {
    type: String,
    trim: true
  },
  quantityKg: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0.01, 'Quantity must be greater than 0']
  },
  harvestDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      validate: {
        validator: function(coords) {
          return coords.length === 2 && 
                 coords[0] >= -180 && coords[0] <= 180 && // longitude
                 coords[1] >= -90 && coords[1] <= 90;     // latitude
        },
        message: 'Invalid coordinates'
      }
    }
  },
  address: {
    village: String,
    district: String,
    state: String,
    country: { type: String, default: 'India' }
  },
  harvestMethod: {
    type: String,
    enum: ['wild_collection', 'cultivated', 'semi_wild'],
    required: true
  },
  harvestConditions: {
    weather: String,
    soilType: String,
    altitude: Number,
    notes: String
  },
  photos: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  harvester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  harvesterDetails: {
    name: String,
    phone: String,
    organization: String
  },
  compliance: {
    geofenceStatus: {
      type: String,
      enum: ['PASS', 'FAIL', 'PENDING'],
      default: 'PENDING'
    },
    seasonalStatus: {
      type: String,
      enum: ['PASS', 'FAIL', 'WARNING', 'PENDING'],
      default: 'PENDING'
    },
    sustainabilityScore: {
      type: Number,
      min: 0,
      max: 100
    },
    certifications: [String]
  },
  qualityMetrics: {
    moistureContent: Number,
    visualGrade: {
      type: String,
      enum: ['A', 'B', 'C', 'D']
    },
    contamination: {
      type: String,
      enum: ['NONE', 'LOW', 'MEDIUM', 'HIGH']
    }
  },
  blockchainTxId: String,
  blockchainHash: String,
  qrCode: String,
  status: {
    type: String,
    enum: ['COLLECTED', 'IN_TRANSIT', 'RECEIVED', 'PROCESSED', 'REJECTED'],
    default: 'COLLECTED'
  },
  batchIds: [{
    type: String,
    ref: 'Batch'
  }],
  metadata: {
    deviceInfo: {
      type: String,
      userAgent: String,
      gpsAccuracy: Number
    },
    syncStatus: {
      type: String,
      enum: ['SYNCED', 'PENDING', 'FAILED'],
      default: 'PENDING'
    },
    version: { type: String, default: '1.0' }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
harvestSchema.index({ location: '2dsphere' });
harvestSchema.index({ species: 1, harvestDate: -1 });
harvestSchema.index({ harvester: 1, createdAt: -1 });
harvestSchema.index({ sampleId: 1 });
harvestSchema.index({ 'compliance.geofenceStatus': 1 });
harvestSchema.index({ 'compliance.seasonalStatus': 1 });

// Update the updatedAt field before saving
harvestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for getting latitude and longitude separately
harvestSchema.virtual('latitude').get(function() {
  return this.location.coordinates[1];
});

harvestSchema.virtual('longitude').get(function() {
  return this.location.coordinates[0];
});

// Method to check geofence compliance
harvestSchema.methods.checkGeofenceCompliance = function() {
  const [lng, lat] = this.location.coordinates;
  const minLat = parseFloat(process.env.GEOFENCE_MIN_LAT) || 20.0;
  const maxLat = parseFloat(process.env.GEOFENCE_MAX_LAT) || 35.5;
  const minLng = parseFloat(process.env.GEOFENCE_MIN_LNG) || 70.0;
  const maxLng = parseFloat(process.env.GEOFENCE_MAX_LNG) || 90.0;
  
  const isWithinBounds = lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
  this.compliance.geofenceStatus = isWithinBounds ? 'PASS' : 'FAIL';
  return isWithinBounds;
};

// Method to check seasonal compliance
harvestSchema.methods.checkSeasonalCompliance = function() {
  const seasonalRules = {
    'Ashwagandha': [4, 5, 6, 10, 11],
    'Tulsi': [3, 4, 5, 6, 7, 8, 9],
    'Amla': [11, 12, 1, 2],
    'Brahmi': [3, 4, 5, 9, 10, 11],
    'Neem': [1, 2, 3, 4, 11, 12]
  };
  
  const harvestMonth = this.harvestDate.getMonth() + 1;
  const allowedMonths = seasonalRules[this.species];
  
  if (!allowedMonths) {
    this.compliance.seasonalStatus = 'WARNING'; // Unknown species
    return 'WARNING';
  }
  
  const isInSeason = allowedMonths.includes(harvestMonth);
  this.compliance.seasonalStatus = isInSeason ? 'PASS' : 'FAIL';
  return this.compliance.seasonalStatus;
};

// Method to calculate sustainability score
harvestSchema.methods.calculateSustainabilityScore = function() {
  let score = 50; // Base score
  
  // Geofence compliance
  if (this.compliance.geofenceStatus === 'PASS') score += 20;
  else if (this.compliance.geofenceStatus === 'FAIL') score -= 20;
  
  // Seasonal compliance
  if (this.compliance.seasonalStatus === 'PASS') score += 20;
  else if (this.compliance.seasonalStatus === 'FAIL') score -= 15;
  else if (this.compliance.seasonalStatus === 'WARNING') score -= 5;
  
  // Harvest method
  if (this.harvestMethod === 'cultivated') score += 10;
  else if (this.harvestMethod === 'semi_wild') score += 5;
  // wild_collection gets no bonus/penalty
  
  // Quality metrics
  if (this.qualityMetrics.contamination === 'NONE') score += 10;
  else if (this.qualityMetrics.contamination === 'LOW') score += 5;
  else if (this.qualityMetrics.contamination === 'MEDIUM') score -= 5;
  else if (this.qualityMetrics.contamination === 'HIGH') score -= 15;
  
  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score));
  this.compliance.sustainabilityScore = score;
  return score;
};

module.exports = mongoose.model('Harvest', harvestSchema);