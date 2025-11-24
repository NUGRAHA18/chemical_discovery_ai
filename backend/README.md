# Chemical Discovery AI - Backend API

Express.js API Gateway untuk platform Chemical Discovery AI. Backend ini menghubungkan React frontend dengan Flask ML service, mengelola authentication, data storage, dan file processing.

---

## 📊 Project Progress

### ✅ Phase 1: Backend Development (COMPLETE)

- [x] Project structure setup
- [x] MongoDB models (User, Discovery, Favorite)
- [x] JWT authentication system
- [x] Request validation middleware
- [x] ML service integration
- [x] Image processing (base64 → file)
- [x] CRUD controllers (Auth, Discovery, History, Favorites)
- [x] Export functionality (JSON, CSV)
- [x] Error handling & security
- [x] API documentation

### 🟡 Phase 2: Testing & Integration (IN PROGRESS)

- [ ] Install dependencies
- [ ] MongoDB setup & connection test
- [ ] API endpoint testing
- [ ] ML service integration test
- [ ] Image upload/download test

### ⚪ Phase 3: Frontend Development (PENDING)

- [ ] React app setup
- [ ] Component development
- [ ] API integration
- [ ] State management

### ⚪ Phase 4: Deployment (PENDING)

- [ ] Docker containerization
- [ ] Environment configuration
- [ ] Production deployment
- [ ] Monitoring setup

---

## 🏗️ Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   React     │─────→│  Express.js  │─────→│   Flask ML  │
│  Frontend   │←─────│   (Port 3000)│←─────│ (Port 5000) │
└─────────────┘      └──────────────┘      └─────────────┘
                            │
                            ↓
                      ┌──────────┐
                      │ MongoDB  │
                      └──────────┘
```

**Data Flow (Discovery):**

1. User input criteria → React
2. React POST `/api/discover` → Express (with JWT)
3. Express validate & forward → Flask ML
4. Flask process (5-30s) → Return compounds (base64 images)
5. Express convert images → Save to disk
6. Express save discovery → MongoDB
7. Express return result → React

---

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- MongoDB >= 5.0 (running on port 27017)
- Flask ML Service (running on port 5000)

### 1. Installation

```bash
npm install
```

### 2. Configuration

Copy `.env.example` to `.env`:

```bash
copy .env.example .env
```

Edit `.env` file:

```env
NODE_ENV=development
PORT=3000

# MongoDB connection
MONGODB_URI=mongodb://localhost:27017/chemical-discovery

# JWT configuration
JWT_SECRET=your-super-secret-key-generate-random-string-here
JWT_EXPIRE=24h

# Flask ML Service
FLASK_ML_URL=http://localhost:5000

# CORS (development: allow all)
CORS_ORIGIN=*

# Image upload path
UPLOAD_PATH=./public/images/structures
```

**⚠️ IMPORTANT:** Generate secure JWT_SECRET:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Start Server

**Development mode (with auto-reload):**

```bash
npm run dev
```

**Production mode:**

```bash
npm start
```

Server akan berjalan di `http://localhost:3000`

### 4. Verify Health

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{
  "status": "healthy",
  "timestamp": "2024-11-25T10:00:00.000Z",
  "uptime": 123.456
}
```

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js    # Register, login, logout
│   │   ├── discoveryController.js  # Create, get, delete discovery
│   │   ├── historyController.js    # Get history, stats
│   │   ├── favoritesController.js  # CRUD favorites
│   │   └── exportController.js     # Export JSON, CSV, PDF
│   ├── middleware/
│   │   ├── auth.js              # JWT protection
│   │   └── validators.js        # Input validation
│   ├── models/
│   │   ├── User.js              # User schema
│   │   ├── Discovery.js         # Discovery schema
│   │   └── Favorite.js          # Favorite schema
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── discovery.routes.js
│   │   ├── history.routes.js
│   │   ├── favorites.routes.js
│   │   └── export.routes.js
│   ├── services/
│   │   └── mlService.js         # Flask ML integration
│   ├── utils/
│   │   ├── jwtUtils.js          # JWT helper
│   │   └── imageUtils.js        # Image processing
│   └── server.js                # Main app entry
├── public/
│   └── images/
│       └── structures/          # Saved structure images
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

---

## 🔐 Authentication Flow

1. **Register:**

   - POST `/api/auth/register`
   - Validate input (email, password min 8 chars)
   - Hash password with bcrypt
   - Generate JWT token (24h expiry)
   - Return token + user data

2. **Login:**

   - POST `/api/auth/login`
   - Verify email & password
   - Update lastLogin timestamp
   - Generate new token
   - Return token + user data

3. **Protected Routes:**
   - Client send token in header: `Authorization: Bearer <token>`
   - Middleware verify token
   - Attach user to `req.user`
   - Controller can access user data

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint             | Auth | Description          |
| ------ | -------------------- | ---- | -------------------- |
| POST   | `/api/auth/register` | ❌   | Register new user    |
| POST   | `/api/auth/login`    | ❌   | Login user           |
| POST   | `/api/auth/logout`   | ✅   | Logout (client-side) |
| GET    | `/api/auth/me`       | ✅   | Get current user     |

### Discovery

| Method | Endpoint            | Auth | Description          |
| ------ | ------------------- | ---- | -------------------- |
| POST   | `/api/discover`     | ✅   | Create new discovery |
| GET    | `/api/discover/:id` | ✅   | Get discovery by ID  |
| DELETE | `/api/discover/:id` | ✅   | Delete discovery     |

### History

| Method | Endpoint             | Auth | Description                             |
| ------ | -------------------- | ---- | --------------------------------------- |
| GET    | `/api/history`       | ✅   | Get discovery history (with pagination) |
| GET    | `/api/history/stats` | ✅   | Get user statistics                     |

### Favorites

| Method | Endpoint             | Auth | Description       |
| ------ | -------------------- | ---- | ----------------- |
| POST   | `/api/favorites`     | ✅   | Add to favorites  |
| GET    | `/api/favorites`     | ✅   | Get all favorites |
| PUT    | `/api/favorites/:id` | ✅   | Update favorite   |
| DELETE | `/api/favorites/:id` | ✅   | Remove favorite   |

### Export

| Method | Endpoint           | Auth | Description    |
| ------ | ------------------ | ---- | -------------- |
| POST   | `/api/export/json` | ✅   | Export as JSON |
| POST   | `/api/export/csv`  | ✅   | Export as CSV  |
| POST   | `/api/export/pdf`  | ✅   | Export as PDF  |

---

## 📝 API Examples

### 1. Register User

**Request:**

```bash
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "email": "researcher@example.com",
  "password": "SecurePass123",
  "name": "Dr. John Doe"
}
```

**Response:**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "researcher@example.com",
    "name": "Dr. John Doe"
  }
}
```

### 2. Login

**Request:**

```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "researcher@example.com",
  "password": "SecurePass123"
}
```

### 3. Create Discovery (Main Feature!)

**Request:**

```bash
POST http://localhost:3000/api/discover
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "criteria": "surfactant for oil recovery with HLB 8-12, thermal stability 80°C, biodegradable"
}
```

**Response:** (After 5-30 seconds)

```json
{
  "success": true,
  "discovery": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439012",
    "criteria": "surfactant for oil recovery...",
    "compounds": [
      {
        "name": "Novel Alkyl Sulfonate Surfactant",
        "formula": "C12H24O2",
        "smiles": "CCCCCCCCCCCOS(=O)(=O)[O-].[Na+]",
        "properties": {
          "HLB": "10.5",
          "thermal_stability": "85°C",
          "biodegradability": "High"
        },
        "base_compound": "Sodium Dodecyl Sulfate",
        "modifications": "Extended alkyl chain...",
        "molecular_weight": 200.32,
        "logp": 3.45,
        "structure_image": "/images/structures/abc123.png",
        "validation_score": 0.85
      }
    ],
    "analysis": "...",
    "validation": {...},
    "justification": "...",
    "createdAt": "2024-11-25T10:00:00.000Z"
  }
}
```

### 4. Get History with Pagination

**Request:**

```bash
GET http://localhost:3000/api/history?page=1&limit=10&search=surfactant
Authorization: Bearer <your_token>
```

**Response:**

```json
{
  "success": true,
  "discoveries": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 47,
    "pages": 5
  }
}
```

### 5. Export Discovery as CSV

**Request:**

```bash
POST http://localhost:3000/api/export/csv
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "discoveryId": "507f1f77bcf86cd799439011"
}
```

**Response:** CSV file download

---

## 🔧 Database Models

### User Model

```javascript
{
  _id: ObjectId,
  email: String (unique, required),
  password: String (hashed, required),
  name: String,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Discovery Model

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, indexed),
  criteria: String (required),
  preprocessingAnalysis: {
    normalizedInput: String,
    concepts: Object,
    searchTermsUsed: [String],
    confidenceScore: Number
  },
  analysis: String,
  research: String,
  compounds: [{
    name: String,
    formula: String,
    smiles: String,
    properties: Object,
    base_compound: String,
    modifications: String,
    molecular_weight: Number,
    logp: Number,
    structure_image: String,
    validation_score: Number,
    feasibility_notes: String
  }],
  validation: Object,
  justification: String,
  metadata: Object,
  createdAt: Date,
  updatedAt: Date
}
```

### Favorite Model

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, indexed),
  compoundData: {
    name: String,
    formula: String,
    smiles: String,
    properties: Object,
    molecular_weight: Number,
    logp: Number,
    structure_image: String
  },
  tags: [String],
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🛡️ Security Features

- ✅ **JWT Authentication** - Token-based auth dengan 24h expiry
- ✅ **Password Hashing** - Bcrypt dengan salt rounds 12
- ✅ **Input Validation** - Express-validator untuk semua input
- ✅ **User Isolation** - Setiap query include userId check
- ✅ **Helmet** - Security headers
- ✅ **CORS** - Configurable origin
- ✅ **Rate Limiting** - Ready to implement (see TODO)
- ✅ **Error Handling** - No sensitive data leakage

---

## 🧪 Testing

### Manual Testing with cURL

**1. Health Check:**

```bash
curl http://localhost:3000/health
```

**2. Register:**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"Test1234\",\"name\":\"Test User\"}"
```

**3. Login:**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"Test1234\"}"
```

**4. Create Discovery:**

```bash
curl -X POST http://localhost:3000/api/discover \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"criteria\":\"surfactant with high thermal stability\"}"
```

### Automated Testing (TODO)

```bash
# Install Jest & Supertest
npm install --save-dev jest supertest

# Run tests
npm test
```

---

## 📊 Performance Considerations

### Image Processing

- Base64 images from Flask converted to PNG files
- Optimized with Sharp (resize 300x300, quality 90%)
- Stored in disk, not database (better performance)
- Unique filename with UUID (no collision)

### Database Queries

- Indexed fields: `userId`, `createdAt`, `tags`
- Pagination to prevent memory overload
- Select only needed fields (exclude images in list view)

### ML Service

- Timeout 60s (ML processing takes time)
- Error handling for connection issues
- Health check endpoint for monitoring

---

## 🐛 Common Issues & Solutions

### Issue 1: MongoDB Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution:** Pastikan MongoDB running

```bash
# Windows (if installed as service)
net start MongoDB

# Or run manually
mongod
```

### Issue 2: JWT Token Expired

```
{ "error": "Token expired" }
```

**Solution:** Login lagi untuk dapat token baru (expire 24h)

### Issue 3: ML Service Unavailable

```
{ "error": "ML service unavailable" }
```

**Solution:** Pastikan Flask ML running di port 5000

```bash
cd ml-service
python app.py
```

### Issue 4: Image Upload Failed

```
Error: Invalid base64 image format
```

**Solution:** Cek format base64 dari Flask harus: `data:image/png;base64,<data>`

---

## 📦 Dependencies

### Production Dependencies

```json
{
  "express": "Web framework",
  "mongoose": "MongoDB ODM",
  "bcryptjs": "Password hashing",
  "jsonwebtoken": "JWT auth",
  "axios": "HTTP client (Flask communication)",
  "sharp": "Image processing",
  "uuid": "Unique filename generation",
  "express-validator": "Input validation",
  "helmet": "Security headers",
  "cors": "CORS handling",
  "compression": "Response compression",
  "morgan": "HTTP logging",
  "dotenv": "Environment variables"
}
```

### Dev Dependencies

```json
{
  "nodemon": "Auto-reload on file change"
}
```

---

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] Change `JWT_SECRET` to secure random string
- [ ] Set `NODE_ENV=production`
- [ ] Update `MONGODB_URI` to production database
- [ ] Set `CORS_ORIGIN` to production frontend URL
- [ ] Enable rate limiting
- [ ] Setup proper logging (Winston/Pino)
- [ ] Add health monitoring

### Deployment Options

1. **VPS/Cloud VM** (AWS EC2, DigitalOcean, etc)
2. **Container** (Docker + Docker Compose)
3. **PaaS** (Heroku, Railway, Render)
4. **Serverless** (AWS Lambda - requires adjustment)

---

## 📞 Support & Contact

**Issues:** Create issue di GitHub repository  
**Questions:** Contact team via email

---

## 📄 License

MIT License - See LICENSE file

---

## 🎯 Next Steps

1. ✅ Backend API - **COMPLETE**
2. 🟡 MongoDB Setup & Testing - **NEXT**
3. ⚪ Frontend Development - **PENDING**
4. ⚪ Full Integration Testing - **PENDING**
5. ⚪ Deployment - **PENDING**

---

**Backend Version:** 1.0.0  
**Last Updated:** November 25, 2024  
**Status:** Ready for Testing ✅
