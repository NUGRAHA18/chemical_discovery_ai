# Chemical Discovery AI

AI-powered platform for discovering novel chemical compounds using multi-agent system and computational chemistry.

## 🎯 Project Overview

**Novel Chemicals Discovery Agent** adalah platform web-based yang membantu peneliti di industri petrokimia menemukan senyawa kimia baru dengan lebih cepat dan efisien menggunakan Agentic AI.

**Capstone Project - Dicoding 2025**  
**Team:** Cleo (ML), Afif (ML), Eska (Backend), Agung (Full Stack), Faris (Backend)

---

## ✨ Key Features

### 🧪 AI-Powered Discovery

- Multi-agent system dengan 6 specialized agents
- Gemini 2.5 Flash untuk intelligent compound generation
- Generate 3 novel compounds dalam 5-15 detik

### 📋 Hybrid Input System (Dicoding Requirement)

- **Structured Form**: Dropdown kategori, number inputs untuk properties
- **AI Prompt**: Natural language input dengan examples
- Toggle between modes untuk flexibility

### 🔬 Computational Chemistry

- RDKit integration untuk molecular calculations
- PubChem database search (100M+ compounds)
- Automatic SMILES validation
- Molecular property calculations (MW, LogP, H-bonds, TPSA)

### 📊 Complete Discovery Management

- Discovery history dengan search & pagination
- Favorites management dengan tags
- Export to JSON & CSV
- Validation scores dengan color-coding

---

## 🏗️ Tech Stack

### Frontend

- React 18
- React Router v6
- Axios
- Tailwind CSS 3
- Context API

### Backend

- Node.js 18+
- Express.js 4.18
- MongoDB 7.0 (Mongoose ODM)
- JWT Authentication
- bcrypt, Sharp, express-validator

### ML Service

- Python 3.10+
- Flask 3.0
- Google Gemini 2.5 Flash
- RDKit 2025.9
- PubChemPy 1.0.5
- ThreadPoolExecutor (parallel processing)

---

## 📦 Project Structure

```
chemical-discovery-ai/
├── backend/              # Express.js API (Port 3000)
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   └── utils/
│   └── public/images/structures/
├── ml-service/           # Flask ML Service (Port 5000)
│   ├── app.py
│   └── requirements.txt
├── frontend/             # React App (Port 3001)
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── contexts/
│       └── services/
├── DOCUMENTATION.md      # Full system documentation
└── ARCHITECTURE.md       # Architecture diagrams
```

---

## 🚀 Installation & Setup

### Prerequisites

- Node.js 18+
- Python 3.10+
- MongoDB 7.0+
- Git

### 1. Clone Repository

```bash
git clone https://github.com/username/chemical-discovery-ai.git
cd chemical-discovery-ai
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env: Set JWT_SECRET, MONGODB_URI
npm run dev
```

Backend runs on: http://localhost:3000

### 3. ML Service Setup

```bash
cd ml-service
pip install -r requirements.txt
cp .env.example .env
# Edit .env: Set GEMINI_API_KEY
python app.py
```

ML Service runs on: http://localhost:5000

### 4. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env: Verify REACT_APP_API_URL
npm start
```

Frontend runs on: http://localhost:3001

---

## 🔑 Environment Variables

### Backend (.env)

```env
JWT_SECRET=your_secret_key
MONGODB_URI=mongodb://localhost:27017/chemical-discovery
ML_SERVICE_URL=http://localhost:5000
PORT=3000
```

### ML Service (.env)

```env
GEMINI_API_KEY=your_gemini_api_key
FLASK_PORT=5000
```

### Frontend (.env)

```env
REACT_APP_API_URL=http://localhost:3000/api
```

---

## 📖 Usage

1. **Register/Login**: Create account atau login
2. **Discovery**:
   - Choose input mode (Structured Form atau AI Prompt)
   - Structured: Fill kategori, boiling point, viscosity, dll
   - AI Prompt: Describe requirements in natural language
   - Submit untuk generate 3 novel compounds
3. **View Results**: See compounds dengan molecular structures, properties, validation scores
4. **Save Favorites**: Add promising compounds to favorites
5. **History**: Browse past discoveries, search, export
6. **Favorites**: Manage saved compounds, edit tags & notes

---

## 📊 API Endpoints

### Authentication

- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Discovery

- `POST /api/discover` - Generate compounds (hybrid input)
- `GET /api/history` - Get discovery history
- `GET /api/history/stats` - Get statistics
- `DELETE /api/history/:id` - Delete discovery

### Favorites

- `GET /api/favorites` - Get favorites
- `POST /api/favorites` - Add favorite
- `PUT /api/favorites/:id` - Update favorite
- `DELETE /api/favorites/:id` - Delete favorite

### Export

- `POST /api/export/json` - Export as JSON
- `POST /api/export/csv` - Export as CSV

---

## 🎯 Dicoding Requirements Compliance

✅ **Portal web-based** - React frontend dengan Express backend  
✅ **Input kriteria spesifik** - Structured form dengan dropdown & number inputs  
✅ **Agentic AI implementation** - Multi-agent system (6 agents)  
✅ **Rekomendasi senyawa** - 3 novel compounds per request  
✅ **Formula + struktur + properties** - Complete molecular data dengan images  
✅ **Justifikasi** - Professional justification dari AI  
✅ **Dokumentasi limitasi** - System limitations documented  
✅ **Dataset documentation** - PubChem, Gemini, RDKit explained

---

## 📄 Documentation

- [📘 Complete Documentation](DOCUMENTATION.md) - System overview, limitations, dataset
- [🏗️ Architecture Diagrams](ARCHITECTURE.md) - Visual architecture
- [🔧 Backend API Docs](backend/README.md) - API reference
- [🤖 ML Service Docs](ml-service/README.md) - ML service guide

---

## ⚠️ System Limitations

### AI Model

- Gemini AI dapat hallucinate (generate invalid compounds)
- No lab testing (computational only)
- Training data unknown

### Dataset

- PubChem: ~40-50% of known compounds
- No proprietary/military compounds
- Search may miss relevant compounds

### Technical

- Processing time: 5-15 seconds
- Single-threaded Flask (one request at a time)
- Max 3 compounds per request
- Image resolution: 300x300px

See [DOCUMENTATION.md](DOCUMENTATION.md) for complete limitations.

---

## 🧪 Testing

### Test User

- Email: test@example.com
- Password: Test1234

### Test Flow

1. Login with test user
2. Navigate to Discover
3. Try structured form:
   - Category: Surfactant
   - Boiling Point: 80-120°C
   - Thermal Stability: 70°C
   - Check: Biodegradable
4. Submit & wait 10-15 seconds
5. View results, add to favorites
6. Check history & export

---

## 📝 License

MIT License - See LICENSE file for details

---

## 👥 Team

- **Cleo** - Machine Learning Engineer
- **Afif** - Machine Learning Engineer
- **Eska** - Backend Developer
- **Agung** - Full Stack Developer
- **Faris** - Backend Developer

---

## 🙏 Acknowledgments

- Dicoding Indonesia - Capstone Project Platform
- Google Gemini AI - LLM Provider
- PubChem - Chemical Database
- RDKit - Cheminformatics Toolkit

---

**Project Status:** ✅ Complete & Ready for Submission

**Last Updated:** December 2, 2025
