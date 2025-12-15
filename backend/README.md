# Chemical Discovery AI - Backend API

Express.js API Gateway untuk platform Chemical Discovery AI. Backend ini menghubungkan React frontend dengan Flask ML service, mengelola authentication, data storage, dan file processing.

---

## 📊 Project Progress

### ✅ Phase 1: Backend Development (COMPLETE)

- [✅] Project structure setup
- [✅] MongoDB models (User, Discovery, Favorite)
- [✅] JWT authentication system
- [✅] Request validation middleware
- [✅] ML service integration
- [✅] Image processing (base64 → file)
- [✅] CRUD controllers (Auth, Discovery, History, Favorites)
- [✅] Export functionality (JSON, CSV)
- [✅] Error handling & security
- [✅] API documentation

### Phase 2: Testing & Integration (COMPLETE)

- [✅] Install dependencies
- [✅] MongoDB setup & connection test
- [✅] API endpoint testing
- [✅] ML service integration test
- [✅] Image upload/download test

### Phase 3: Frontend Development (COMPLETE)

- [✅] React app setup
- [✅] Component development
- [✅] API integration
- [✅] State management

## 🏗️ Architecture

### The architecture uses a simple microservices pattern with Redis as a caching layer and Socket.IO for real-time updates to the frontend.

```ascii
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│   React     │◄─────▶│  Express.js  │◄─────▶│  Flask ML   │
│  Frontend   │       │ (Port 3010)  │       │ (Port 5000) │
└─────────────┘       └──────────────┘       └─────────────┘
       ▲                      │
       │ (Socket Events)      │
       │                      ▼
       │              ┌──────────────┐
       └──────────────┤   Redis      │ (Cache & Queue)
                      └──────────────┘
                              │
                              ▼
                      ┌──────────────┐
                      │   MongoDB    │ (Main DB)
                      └──────────────┘
```

**Data Flow (Discovery):**

1. User input criteria → React
2. React POST `/api/discover` → Express (with JWT)
3. Express check Redis Cache (return instantly if exists)
4. If not in cache → Forward to Flask ML
5. Flask process (40-90s) → Return compounds (base64 images)
6. Express convert images → Save to disk
7. Express save discovery → MongoDB
8. Express return result → React

---

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- MongoDB >= 5.0 (running on port 27017)
- Redis Server (running on port 6379)
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
PORT=3010

# Database Connections
MONGODB_URI=mongodb://localhost:27017/chemical-discovery
REDIS_URL=redis://localhost:6379

# JWT configuration
JWT_SECRET=your-super-secret-key-generate-random-string-here
JWT_EXPIRE=24h

# External Services
FLASK_ML_URL=http://localhost:5000

# CORS (Development: allow all)
CORS_ORIGIN=*

# File Storage
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

Server akan berjalan di `http://localhost:3010`

### 4. Verify Health

```bash
curl http://localhost:3010/health
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

## 🔌 Real-Time Events (Socket.IO)

Backend memancarkan event berikut ke client yang terhubung:

| Event Name           | Direction       | Description                                        |
| :------------------- | :-------------- | :------------------------------------------------- |
| `connection`         | Client → Server | Client connects (auth token required in handshake) |
| `discovery_started`  | Server → Client | Notification that ML processing has started        |
| `discovery_complete` | Server → Client | Returns final result when ML finishes              |
| `discovery_error`    | Server → Client | Notification if ML process fails                   |

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js
|   |   ├── redis.js
|   |   ├── socket.js
│   ├── controllers/
│   │   ├── authController.js
|   |   ├── chatController.js
│   │   ├── discoveryController.js
│   │   ├── historyController.js
│   │   ├── favoritesController.js
|   |   ├── ProfileController.js
│   │   └── exportController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── validators.js
│   ├── models/
│   │   ├── User.js
│   │   ├── ChatMessage.js
│   │   ├── Discovery.js
|   |   └── Favorite.js
│   ├── routes/
│   │   ├── auth.routes.js
|   |   ├── chat.routes.js
│   │   ├── discovery.routes.js
│   │   ├── history.routes.js
│   │   ├── favorites.routes.js
|   |   ├── internal.routes.js
|   |   ├── profile.routes.js
|   |   ├── propertyCalculator.js
│   │   └── export.routes.js
│   ├── services/
│   │   └── mlService.js
│   ├── utils/
│   │   ├── jwtUtils.js
|   |   ├── criteriaBuilder.js
│   │   └── imageUtils.js
│   └── server.js
├── public/
│   └── images/
│       └── structures/
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
| :----- | :------------------- | :--- | :------------------- |
| POST   | `/api/auth/register` | ❌   | Register new user    |
| POST   | `/api/auth/login`    | ❌   | Login user           |
| POST   | `/api/auth/logout`   | ✅   | Logout (client-side) |
| GET    | `/api/auth/me`       | ✅   | Get current user     |

### User Profile

| Method | Endpoint                | Auth | Description                      |
| :----- | :---------------------- | :--- | :------------------------------- |
| GET    | `/api/profile`          | ✅   | Get current user profile         |
| PUT    | `/api/profile`          | ✅   | Update basic profile info        |
| POST   | `/api/profile/photo`    | ✅   | Upload profile photo (Multipart) |
| DELETE | `/api/profile/photo`    | ✅   | Remove profile photo             |
| PUT    | `/api/profile/password` | ✅   | Change password                  |

### AI Chat Assistance

| Method | Endpoint                       | Auth | Description                  |
| :----- | :----------------------------- | :--- | :--------------------------- |
| POST   | `/api/chat/send`               | ✅   | Send message                 |
| GET    | `/api/chat/stream/:sessionId`  | ✅   | Stream AI response (SSE)     |
| GET    | `/api/chat/history`            | ✅   | Get chat history list        |
| DELETE | `/api/chat/history`            | ✅   | Clear all chat history       |
| DELETE | `/api/chat/session/:sessionId` | ✅   | Delete specific chat session |

### Discovery

| Method | Endpoint            | Auth | Description          |
| :----- | :------------------ | :--- | :------------------- |
| POST   | `/api/discover`     | ✅   | Create new discovery |
| GET    | `/api/discover/:id` | ✅   | Get discovery by ID  |
| DELETE | `/api/discover/:id` | ✅   | Delete discovery     |

### History

| Method | Endpoint             | Auth | Description                             |
| :----- | :------------------- | :--- | :-------------------------------------- |
| GET    | `/api/history`       | ✅   | Get discovery history (with pagination) |
| GET    | `/api/history/stats` | ✅   | Get user statistics                     |
| GET    | `/api/history/:id`   | ✅   | Get specific discovery details          |

### Favorites

| Method | Endpoint             | Auth | Description       |
| :----- | :------------------- | :--- | :---------------- |
| POST   | `/api/favorites`     | ✅   | Add to favorites  |
| GET    | `/api/favorites`     | ✅   | Get all favorites |
| PUT    | `/api/favorites/:id` | ✅   | Update favorite   |
| DELETE | `/api/favorites/:id` | ✅   | Remove favorite   |

### Export

| Method | Endpoint           | Auth | Description    |
| :----- | :----------------- | :--- | :------------- |
| POST   | `/api/export/json` | ✅   | Export as JSON |
| POST   | `/api/export/csv`  | ✅   | Export as CSV  |
| POST   | `/api/export/pdf`  | ✅   | Export as PDF  |

### Chemical Calculator

| Method | Endpoint                               | Auth | Description          |
| :----- | :------------------------------------- | :--- | :------------------- |
| POST   | `/api/calculator/calculate-properties` | ❌   | Calculate properties |

### Authentication

| Method | Endpoint             | Auth | Description          |
| ------ | -------------------- | ---- | -------------------- |
| POST   | `/api/auth/register` | ❌   | Register new user    |
| POST   | `/api/auth/login`    | ❌   | Login user           |
| POST   | `/api/auth/logout`   | ✅   | Logout (client-side) |
| GET    | `/api/auth/me`       | ✅   | Get current user     |
| PUT    | `/api/auth/profile`  | ✅   | Update profile       |

### AI Chat Assistance

| Method | Endpoint                    | Auth | Description                  |
| ------ | --------------------------- | ---- | ---------------------------- |
| Post   | /api/chat/send              | ✅   | Send message                 |
| GET    | /api/chat/stream/:sessionId | ✅   | Stream AI response           |
| GET    | /api/chat/history           | ✅   | Get chat history list        |
| DELETE | /api/chat/history           | ✅   | Clear all chat history       |
| DELETE | /api/chat/session/          | ✅   | Delete specific chat session |

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
| GET    | `/api/history/:id`   | ✅   | Get specific discovery details          |

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

### Profile

| Method | Endpoint                | Auth | Description                    |
| ------ | ----------------------- | ---- | ------------------------------ |
| GET    | `/api/profile`          | ✅   | Get current user profile       |
| PUT    | `/api/profile`          | ✅   | Update basic profile info      |
| POST   | `/api/profile/photo`    | ✅   | Upload profile photo Multipart |
| DELETE | `/api/profile/photo`    | ✅   | Remove profile photo           |
| PUT    | `/api/profile/password` | ✅   | Change password                |

### Chemical Calculator

| Method | Endpoint                               | Auth | Description          |
| ------ | -------------------------------------- | ---- | -------------------- |
| POST   | `/api/calculator/calculate-properties` | ❌   | Calculate properties |

---

## 📝 API Examples

### 1. Register User

**Request:**

```bash
POST http://localhost:3010/api/auth/register
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
POST http://localhost:3010/api/auth/login
Content-Type: application/json

{
  "email": "researcher@example.com",
  "password": "SecurePass123"
}
```

### 3. Create Discovery (Main Feature!)

**Request:**

```bash
POST http://localhost:3010/api/discover
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

#### Hybrid Input - Structured Form Mode

**Request:**

```bash
POST http://localhost:3010/api/discover
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "inputMode": "structured",
  "structuredData": {
    "category": "surfactant",
    "boilingPoint": {
      "min": 80,
      "max": 120
    },
    "viscosity": {
      "min": 10,
      "max": 50
    },
    "solubility": "water-soluble",
    "thermalStability": {
      "min": 70
    },
    "additionalProperties": [
      "biodegradable",
      "non-toxic"
    ],
    "notes": "For industrial cleaning applications"
  }
}
```

**Backend Processing:**

1. Validate structured data (at least 1 field required)
2. Convert to natural language criteria string
3. Send to ML service
4. Store both `structuredData` (original) and `criteria` (converted)

**Converted Criteria:**

```
"Surfactant compound with boiling point between 80°C and 120°C,
viscosity between 10 and 50 cP, water-soluble,
thermal stability above 70°C, biodegradable, non-toxic,
For industrial cleaning applications"
```

**Response:** Same as AI prompt mode (compounds, analysis, validation, etc.)

#### Hybrid Input - AI Prompt Mode (Original)

**Request:**

```bash
POST http://localhost:3010/api/discover
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "inputMode": "ai-prompt",
  "criteria": "biodegradable polymer for food packaging with barrier properties"
}
```

**Note:** `inputMode` is optional, defaults to `"ai-prompt"` if not specified.

### 4. Get History with Pagination

**Request:**

```bash
GET http://localhost:3010/api/history?page=1&limit=10&search=surfactant
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
POST http://localhost:3010/api/export/csv
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "discoveryId": "507f1f77bcf86cd799439011"
}
```

**Response:** CSV file download

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

## 📦 Dependencies

### Production Dependencies

```json
{
  "axios": "^1.6.0",
  "bcryptjs": "^2.4.3",
  "compression": "^1.7.4",
  "cors": "^2.8.5",
  "csv-parser": "^3.2.0",
  "dotenv": "^16.3.1",
  "express": "^4.18.2",
  "express-validator": "^7.0.1",
  "helmet": "^7.1.0",
  "ioredis": "^5.8.2",
  "jsonwebtoken": "^9.0.2",
  "mongoose": "^7.6.3",
  "morgan": "^1.10.0",
  "multer": "^1.4.5-lts.1",
  "redis": "^5.10.0",
  "sharp": "^0.32.6",
  "socket.io": "^4.8.1",
  "uuid": "^9.0.1",
  "xlsx": "^0.18.5"
}
```

### Dev Dependencies

```json
{
  "nodemon": "Auto-reload on file change"
}
```

### Pre-Deployment

- Change `JWT_SECRET` to secure random string
- Set `NODE_ENV=production`
- Update `MONGODB_URI` to production database
- Set `CORS_ORIGIN` to production frontend URL
- Enable rate limiting
- Setup proper logging (Winston/Pino)
- Add health monitoring

---

## 📞 Support & Contact

**Issues:** Create issue di GitHub repository  
**Questions:** agungnugraha180405@gmail.com

---

## 📄 License

MIT License - See LICENSE file

---

---

**Backend Version:** 1.0.0  
**Last Updated:** 15 December, 2025
**Status:** Ready for Deploy ✅
