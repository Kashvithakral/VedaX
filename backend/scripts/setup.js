#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Setup script for VedaX Backend
 * Creates necessary directories and initial data
 */

async function createDirectories() {
  const directories = [
    'uploads/harvest',
    'uploads/certificates',
    'logs',
    'wallet'
  ];

  console.log('Creating directories...');
  
  for (const dir of directories) {
    const fullPath = path.join(__dirname, '..', dir);
    try {
      await fs.promises.mkdir(fullPath, { recursive: true });
      console.log(`✓ Created directory: ${dir}`);
    } catch (error) {
      console.log(`✗ Failed to create directory ${dir}:`, error.message);
    }
  }
}

async function createAdminUser() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vedax');
    
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('✓ Admin user already exists');
      return;
    }

    // Create admin user
    const adminUser = new User({
      name: 'VedaX Administrator',
      email: 'admin@vedax.example',
      password: 'admin123', // This will be hashed automatically
      role: 'admin',
      isActive: true,
      isVerified: true,
      profile: {
        organization: {
          name: 'VedaX Platform',
          type: 'platform'
        }
      }
    });

    await adminUser.save();
    console.log('✓ Created admin user (admin@vedax.example / admin123)');
    
  } catch (error) {
    console.log('✗ Failed to create admin user:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

async function createSampleData() {
  try {
    console.log('Creating sample data...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vedax');
    
    // Create sample users for different roles
    const sampleUsers = [
      {
        name: 'Rajesh Kumar',
        email: 'farmer@vedax.example',
        password: 'farmer123',
        role: 'farmer',
        profile: {
          phone: '+91-9876543210',
          address: {
            village: 'Rampur',
            district: 'Almora',
            state: 'Uttarakhand',
            country: 'India'
          },
          organization: {
            name: 'Himalayan Herbs Cooperative',
            type: 'cooperative'
          },
          location: {
            coordinates: [79.6593, 29.5971] // Almora coordinates
          }
        }
      },
      {
        name: 'Priya Sharma',
        email: 'processor@vedax.example',
        password: 'processor123',
        role: 'processor',
        profile: {
          phone: '+91-9876543211',
          organization: {
            name: 'VedaX Processing Unit',
            type: 'company',
            registrationNumber: 'REG123456'
          }
        }
      },
      {
        name: 'Dr. Amit Patel',
        email: 'lab@vedax.example',
        password: 'lab123',
        role: 'lab',
        profile: {
          phone: '+91-9876543212',
          organization: {
            name: 'Ayurveda Quality Labs',
            type: 'company',
            registrationNumber: 'LAB789012',
            certifications: ['ISO 17025', 'NABL']
          }
        }
      }
    ];

    for (const userData of sampleUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        const user = new User(userData);
        await user.save();
        console.log(`✓ Created sample user: ${userData.email}`);
      } else {
        console.log(`✓ Sample user already exists: ${userData.email}`);
      }
    }
    
  } catch (error) {
    console.log('✗ Failed to create sample data:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

async function checkEnvironment() {
  console.log('Checking environment configuration...');
  
  const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.log('✗ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.log(`  - ${varName}`);
    });
    console.log('Please check your .env file');
    return false;
  }

  console.log('✓ Environment configuration looks good');
  return true;
}

async function main() {
  console.log('🌿 VedaX Backend Setup');
  console.log('====================\n');

  try {
    // Check environment
    const envOk = await checkEnvironment();
    if (!envOk) {
      process.exit(1);
    }

    // Create directories
    await createDirectories();
    
    // Create admin user
    await createAdminUser();
    
    // Create sample data
    if (process.argv.includes('--sample-data')) {
      await createSampleData();
    }

    console.log('\n✅ Setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Start the server: npm start');
    console.log('2. Visit: http://localhost:3000/health');
    console.log('3. Login with admin@vedax.example / admin123');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  main();
}

module.exports = {
  createDirectories,
  createAdminUser,
  createSampleData,
  checkEnvironment
};