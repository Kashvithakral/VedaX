const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: {
      values: ['farmer', 'collector', 'processor', 'lab', 'manufacturer', 'consumer', 'regulator', 'admin'],
      message: 'Invalid role specified'
    }
  },
  profile: {
    phone: {
      type: String,
      trim: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      pincode: String
    },
    organization: {
      name: String,
      type: String, // cooperative, company, individual
      registrationNumber: String,
      certifications: [String]
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: '2dsphere'
      }
    }
  },
  permissions: {
    canCreateHarvest: { type: Boolean, default: false },
    canProcessBatch: { type: Boolean, default: false },
    canRunLabTests: { type: Boolean, default: false },
    canViewAllData: { type: Boolean, default: false },
    canManageUsers: { type: Boolean, default: false }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Set permissions based on role
userSchema.pre('save', function(next) {
  if (!this.isModified('role')) return next();
  
  // Reset permissions
  this.permissions = {
    canCreateHarvest: false,
    canProcessBatch: false,
    canRunLabTests: false,
    canViewAllData: false,
    canManageUsers: false
  };
  
  // Set permissions based on role
  switch (this.role) {
    case 'farmer':
    case 'collector':
      this.permissions.canCreateHarvest = true;
      break;
    case 'processor':
    case 'manufacturer':
      this.permissions.canProcessBatch = true;
      break;
    case 'lab':
      this.permissions.canRunLabTests = true;
      break;
    case 'regulator':
      this.permissions.canViewAllData = true;
      break;
    case 'admin':
      this.permissions = {
        canCreateHarvest: true,
        canProcessBatch: true,
        canRunLabTests: true,
        canViewAllData: true,
        canManageUsers: true
      };
      break;
  }
  
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get public profile
userSchema.methods.getPublicProfile = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);