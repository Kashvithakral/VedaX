# VedaX Backend API

## 🌿 From Soil to Soul - Blockchain-based Traceability for Ayurvedic Herbal Supply Chain

This is the backend API server for the VedaX platform, providing comprehensive REST APIs for managing the entire Ayurvedic herbal supply chain from harvest to consumer.

## 🚀 Features

### Core Functionality
- **User Management**: Multi-role authentication (farmers, collectors, processors, labs, consumers, regulators)
- **Harvest Tracking**: GPS-enabled harvest recording with compliance checking
- **Batch Processing**: Complete processing workflow management
- **Lab Testing**: Quality testing and certification management
- **Blockchain Integration**: Immutable record keeping with Hyperledger Fabric
- **QR Code Generation**: Provenance QR codes for consumer transparency
- **Compliance Monitoring**: Geofencing and seasonal compliance checks
- **Dashboard Analytics**: Comprehensive reporting and analytics

### Technical Features
- **RESTful API**: Clean, documented REST endpoints
- **Authentication**: JWT-based authentication with role-based access control
- **File Upload**: Image and document upload with processing
- **Real-time Sync**: Blockchain synchronization with offline support
- **Data Validation**: Comprehensive input validation with Joi
- **Error Handling**: Centralized error handling and logging
- **Rate Limiting**: API rate limiting for security
- **CORS Support**: Cross-origin resource sharing configuration

## 🛠️ Tech Stack

- **Runtime**: Node.js 16+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Blockchain**: Hyperledger Fabric (with simulation fallback)
- **Authentication**: JWT with bcryptjs
- **File Processing**: Multer + Sharp for image processing
- **QR Codes**: qrcode library
- **Validation**: Joi schema validation
- **Logging**: Winston logger
- **Testing**: Jest + Supertest

## 📋 Prerequisites

- Node.js 16.0 or higher
- MongoDB 4.4 or higher
- (Optional) Hyperledger Fabric network

## 🔧 Installation

1. **Clone and navigate to backend directory**:
   ```bash
   cd VedaX/backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment setup**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/vedax
   JWT_SECRET=your-super-secret-jwt-key
   ```

4. **Create required directories**:
   ```bash
   mkdir -p uploads/harvest uploads/certificates logs wallet
   ```

5. **Start the server**:
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/password` - Change password

### Harvest Management
- `POST /api/harvest` - Create harvest record
- `GET /api/harvest` - Get all harvests (filtered by user role)
- `GET /api/harvest/:sampleId` - Get specific harvest
- `PUT /api/harvest/:sampleId` - Update harvest record
- `GET /api/harvest/:sampleId/provenance` - Get harvest provenance (public)
- `GET /api/harvest/stats` - Get harvest statistics

### Batch Processing
- `POST /api/batch` - Create new batch
- `GET /api/batch` - Get all batches
- `GET /api/batch/:batchId` - Get specific batch
- `POST /api/batch/:batchId/process` - Add processing step
- `PUT /api/batch/:batchId/process/:stepId/complete` - Complete processing step
- `GET /api/batch/:batchId/provenance` - Get batch provenance (public)
- `GET /api/batch/stats` - Get batch statistics

### Lab Testing
- `POST /api/lab/test` - Add lab test result
- `GET /api/lab/tests` - Get all lab tests
- `GET /api/lab/test/:testId` - Get specific lab test
- `PUT /api/lab/test/:testId` - Update lab test result
- `GET /api/lab/pending` - Get pending tests
- `GET /api/lab/stats` - Get lab statistics

### QR Code Management
- `POST /api/qr/generate` - Generate QR code
- `GET /api/qr/harvest/:sampleId` - Generate harvest QR code
- `GET /api/qr/batch/:batchId` - Generate batch QR code
- `POST /api/qr/scan` - Scan and validate QR code
- `POST /api/qr/bulk-generate` - Bulk generate QR codes

### Compliance
- `POST /api/compliance/check-harvest` - Check harvest compliance
- `GET /api/compliance/report` - Get compliance report
- `GET /api/compliance/violations` - Get compliance violations
- `POST /api/compliance/bulk-check` - Bulk compliance check

### Blockchain
- `GET /api/blockchain/status` - Get blockchain network status
- `POST /api/blockchain/submit` - Submit record to blockchain
- `GET /api/blockchain/query/:type/:id` - Query blockchain record
- `GET /api/blockchain/provenance/:id` - Get provenance trail
- `POST /api/blockchain/sync` - Sync pending records
- `GET /api/blockchain/stats` - Get blockchain statistics

### Dashboard
- `GET /api/dashboard/overview` - Get dashboard overview
- `GET /api/dashboard/trends` - Get monthly trends
- `GET /api/dashboard/compliance` - Get compliance dashboard
- `GET /api/dashboard/users` - Get user dashboard (admin)
- `GET /api/dashboard/system` - Get system dashboard (admin)

## 🔐 Authentication & Authorization

The API uses JWT-based authentication with role-based access control:

### Roles
- **farmer**: Can create harvest records
- **collector**: Can create harvest records (wild collection)
- **processor**: Can create batches and processing steps
- **lab**: Can add lab test results
- **manufacturer**: Can process batches
- **consumer**: Can view provenance information
- **regulator**: Can view all data and compliance reports
- **admin**: Full system access

### Usage
1. Register or login to get JWT token
2. Include token in Authorization header: `Bearer <token>`
3. Access endpoints based on your role permissions

## 📊 Data Models

### User
- Personal information and organization details
- Role-based permissions
- Location data for geo-compliance

### Harvest
- Sample ID, species, quantity, harvest date
- GPS coordinates and address
- Harvester information
- Compliance status (geofence, seasonal)
- Quality metrics and photos

### Batch
- Batch ID, species, total quantity
- Harvest samples composition
- Processing steps timeline
- Lab test results
- Quality grade and compliance
- Traceability information

## 🔄 Blockchain Integration

The system integrates with Hyperledger Fabric for immutable record keeping:

- **Automatic Sync**: Records are automatically submitted to blockchain
- **Simulation Mode**: Falls back to simulation if blockchain unavailable
- **Provenance Trail**: Complete audit trail from harvest to consumer
- **Data Integrity**: Verification between database and blockchain records

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --testPathPattern=auth
```

## 📝 Logging

The application uses Winston for structured logging:

- **Development**: Console output with colors
- **Production**: File-based logging with rotation
- **Log Levels**: error, warn, info, debug
- **Log Files**: `logs/error.log`, `logs/combined.log`

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment | development |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/vedax |
| `JWT_SECRET` | JWT signing secret | (required) |
| `JWT_EXPIRES_IN` | JWT expiration time | 7d |
| `UPLOAD_MAX_SIZE` | Max file upload size | 10485760 (10MB) |
| `GEOFENCE_MIN_LAT` | Minimum latitude for geofence | 20.0 |
| `GEOFENCE_MAX_LAT` | Maximum latitude for geofence | 35.5 |
| `GEOFENCE_MIN_LNG` | Minimum longitude for geofence | 70.0 |
| `GEOFENCE_MAX_LNG` | Maximum longitude for geofence | 90.0 |

### Compliance Rules

The system includes configurable compliance rules:

- **Geofencing**: GPS boundaries for permitted harvest areas
- **Seasonal Rules**: Allowed harvest months per species
- **Sustainability Scoring**: Multi-factor sustainability assessment

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Docker (Optional)
```bash
# Build image
docker build -t vedax-backend .

# Run container
docker run -p 3000:3000 --env-file .env vedax-backend
```

## 📈 Monitoring

### Health Check
- `GET /health` - Returns server status and uptime

### Metrics
- Request logging with Morgan
- Error tracking with Winston
- Performance monitoring available

## 🤝 API Integration

### Frontend Integration
The backend is designed to work seamlessly with the VedaX frontend:

```javascript
// Example API call
const response = await fetch('/api/harvest', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(harvestData)
});
```

### Mobile App Integration
RESTful APIs support mobile applications with:
- Offline sync capabilities
- Image upload support
- GPS data handling
- QR code generation

## 🔒 Security

- **Input Validation**: Joi schema validation
- **Rate Limiting**: Configurable request limits
- **CORS**: Cross-origin resource sharing
- **Helmet**: Security headers
- **JWT**: Secure authentication
- **File Upload**: Type and size restrictions

## 📚 Documentation

- **API Documentation**: Available at `/api/docs` (when implemented)
- **Code Documentation**: JSDoc comments throughout
- **Postman Collection**: Available in `/docs` folder

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check MongoDB is running
   - Verify connection string in `.env`

2. **Blockchain Connection Failed**
   - System falls back to simulation mode
   - Check Hyperledger Fabric network status

3. **File Upload Issues**
   - Ensure upload directories exist
   - Check file size and type restrictions

4. **JWT Token Issues**
   - Verify JWT_SECRET is set
   - Check token expiration

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit pull request

## 📄 License

This project is licensed under the Apache 2.0 License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Email: support@vedax.example
- Documentation: [VedaX Docs](https://docs.vedax.example)
- Issues: [GitHub Issues](https://github.com/vedax/backend/issues)

---

**VedaX Backend** - Empowering transparency in the Ayurvedic herbal supply chain through blockchain technology. 🌿