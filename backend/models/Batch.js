const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  batchId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  species: {
    type: String,
    required: true,
    trim: true
  },
  totalQuantityKg: {
    type: Number,
    required: true,
    min: 0
  },
  harvestSamples: [{
    sampleId: {
      type: String,
      ref: 'Harvest',
      required: true
    },
    quantityKg: {
      type: Number,
      required: true,
      min: 0
    },
    contribution: Number // percentage of total batch
  }],
  processor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  processorDetails: {
    name: String,
    organization: String,
    licenseNumber: String
  },
  processingSteps: [{
    stepId: {
      type: String,
      required: true
    },
    step: {
      type: String,
      required: true,
      enum: ['receiving', 'cleaning', 'drying', 'grinding', 'sieving', 'mixing', 'packaging', 'storage', 'quality_check']
    },
    description: String,
    conditions: {
      temperature: Number,
      humidity: Number,
      duration: Number, // in minutes
      equipment: String,
      notes: String
    },
    operator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    operatorName: String,
    startTime: {
      type: Date,
      required: true
    },
    endTime: Date,
    status: {
      type: String,
      enum: ['IN_PROGRESS', 'COMPLETED', 'FAILED', 'SKIPPED'],
      default: 'IN_PROGRESS'
    },
    qualityMetrics: {
      moistureContent: Number,
      particleSize: String,
      color: String,
      aroma: String,
      yield: Number
    },
    photos: [{
      filename: String,
      url: String,
      uploadedAt: { type: Date, default: Date.now }
    }],
    blockchainTxId: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  labTests: [{
    testId: String,
    labId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    labName: String,
    testType: {
      type: String,
      enum: ['microbial', 'heavy_metals', 'pesticides', 'aflatoxins', 'identity', 'potency', 'purity'],
      required: true
    },
    testDate: {
      type: Date,
      required: true
    },
    results: {
      status: {
        type: String,
        enum: ['PASS', 'FAIL', 'PENDING', 'RETEST'],
        required: true
      },
      parameters: [{
        parameter: String,
        value: String,
        unit: String,
        limit: String,
        status: {
          type: String,
          enum: ['PASS', 'FAIL', 'WARNING']
        }
      }],
      overallScore: Number,
      notes: String
    },
    certificate: {
      filename: String,
      url: String,
      uploadedAt: Date
    },
    blockchainTxId: String
  }],
  qualityGrade: {
    type: String,
    enum: ['PREMIUM', 'STANDARD', 'BASIC', 'REJECT'],
    default: 'STANDARD'
  },
  packaging: {
    packageType: String,
    packageSize: Number,
    packagingDate: Date,
    expiryDate: Date,
    storageConditions: String,
    barcodes: [String]
  },
  traceability: {
    qrCode: String,
    blockchainHash: String,
    fhirBundleId: String,
    provenanceUrl: String
  },
  compliance: {
    organicCertified: Boolean,
    fairTradeCertified: Boolean,
    gmpCompliant: Boolean,
    regulatoryApproval: String,
    sustainabilityScore: Number
  },
  status: {
    type: String,
    enum: ['CREATED', 'PROCESSING', 'TESTING', 'APPROVED', 'REJECTED', 'SHIPPED', 'DELIVERED'],
    default: 'CREATED'
  },
  destination: {
    type: String,
    enum: ['MANUFACTURER', 'DISTRIBUTOR', 'RETAILER', 'EXPORT'],
    required: true
  },
  destinationDetails: {
    name: String,
    address: String,
    licenseNumber: String,
    contactInfo: String
  },
  shipment: {
    shippingDate: Date,
    expectedDelivery: Date,
    trackingNumber: String,
    carrier: String,
    temperature: String,
    humidity: String
  },
  metadata: {
    version: { type: String, default: '1.0' },
    syncStatus: {
      type: String,
      enum: ['SYNCED', 'PENDING', 'FAILED'],
      default: 'PENDING'
    },
    tags: [String]
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
batchSchema.index({ batchId: 1 });
batchSchema.index({ species: 1, createdAt: -1 });
batchSchema.index({ processor: 1, createdAt: -1 });
batchSchema.index({ status: 1 });
batchSchema.index({ 'harvestSamples.sampleId': 1 });
batchSchema.index({ 'labTests.testType': 1, 'labTests.results.status': 1 });

// Update the updatedAt field before saving
batchSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate contribution percentages
batchSchema.pre('save', function(next) {
  if (this.harvestSamples && this.harvestSamples.length > 0) {
    this.harvestSamples.forEach(sample => {
      sample.contribution = (sample.quantityKg / this.totalQuantityKg) * 100;
    });
  }
  next();
});

// Method to add processing step
batchSchema.methods.addProcessingStep = function(stepData) {
  const stepId = `STEP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  const step = {
    stepId,
    ...stepData,
    timestamp: new Date()
  };
  this.processingSteps.push(step);
  return stepId;
};

// Method to update processing step
batchSchema.methods.updateProcessingStep = function(stepId, updateData) {
  const step = this.processingSteps.find(s => s.stepId === stepId);
  if (step) {
    Object.assign(step, updateData);
    return true;
  }
  return false;
};

// Method to add lab test
batchSchema.methods.addLabTest = function(testData) {
  const testId = `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  const test = {
    testId,
    ...testData
  };
  this.labTests.push(test);
  return testId;
};

// Method to calculate overall quality grade
batchSchema.methods.calculateQualityGrade = function() {
  let score = 100;
  let testCount = 0;
  
  // Check lab test results
  this.labTests.forEach(test => {
    if (test.results.status === 'PASS') {
      score += (test.results.overallScore || 80);
      testCount++;
    } else if (test.results.status === 'FAIL') {
      score -= 30;
      testCount++;
    }
  });
  
  // Average the scores
  if (testCount > 0) {
    score = score / (testCount + 1); // +1 for base score
  }
  
  // Check processing quality
  const failedSteps = this.processingSteps.filter(step => step.status === 'FAILED').length;
  score -= (failedSteps * 10);
  
  // Determine grade
  if (score >= 90) this.qualityGrade = 'PREMIUM';
  else if (score >= 75) this.qualityGrade = 'STANDARD';
  else if (score >= 60) this.qualityGrade = 'BASIC';
  else this.qualityGrade = 'REJECT';
  
  return this.qualityGrade;
};

// Method to calculate sustainability score
batchSchema.methods.calculateSustainabilityScore = function() {
  // This would be calculated based on harvest sustainability scores
  // and processing practices
  let totalScore = 0;
  let sampleCount = 0;
  
  // This would need to be populated from harvest data
  // For now, return a placeholder
  this.compliance.sustainabilityScore = 75;
  return 75;
};

// Method to get current processing step
batchSchema.methods.getCurrentStep = function() {
  const inProgressSteps = this.processingSteps.filter(step => step.status === 'IN_PROGRESS');
  return inProgressSteps.length > 0 ? inProgressSteps[inProgressSteps.length - 1] : null;
};

// Method to get processing timeline
batchSchema.methods.getProcessingTimeline = function() {
  return this.processingSteps
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
    .map(step => ({
      stepId: step.stepId,
      step: step.step,
      description: step.description,
      startTime: step.startTime,
      endTime: step.endTime,
      status: step.status,
      operator: step.operatorName,
      duration: step.endTime ? 
        Math.round((new Date(step.endTime) - new Date(step.startTime)) / (1000 * 60)) : null
    }));
};

module.exports = mongoose.model('Batch', batchSchema);