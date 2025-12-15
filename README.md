# Chemical Discovery AI

AI-powered platform for discovering novel chemical compounds using multi-agent system and computational chemistry.

## 🎯 Project Overview

**Chemical Discovery** adalah platform web-based yang membantu peneliti di industri petrokimia menemukan senyawa kimia baru dengan lebih cepat dan efisien menggunakan Agentic AI.

**Capstone Project - ASAH led by Dicoding 2025**  
**Team:** Cleo (ML), Afif (ML), Eska (Backend), Agung (Full Stack), Faris (Frontend)

**Machine Learning Code** : https://drive.google.com/file/d/1W3rMWuEWgQOt-QiuTUvyWkuKO6k9B0vT/view?usp=sharing

---

## 📑 Table of Contents

1.  [Installation Guide](#installation)
2.  [Key Features](#keyfeatures)
3.  [Tech Stack](#tech)
4.  [Usage](#usage)
5.  [Requirements Compliance](#compliace)
6.  [Documentation](#doc)
7.  [System Limitations](#limitations)
8.  [Testing](#testing)
9.  [License](#license)
10. [Team](#team)
11. [Contact](#contact)

## <a id="installation"></a>🛠️ Installation Guide

Pastikan kamu menjalankan **3 Terminal terpisah** untuk Backend, ML Service, dan Frontend agar semuanya berjalan bersamaan.

### Prerequisites

- Node.js 18+
- Python 3.10+
- MongoDB 7.0+
- Git

### 1. Clone Repository

```bash
git clone https://github.com/NUGRAHA18/chemical_discovery_ai
```

### Port Allocation

| Service    | Technology        | Port  | URL                   |
| ---------- | ----------------- | ----- | --------------------- |
| Frontend   | `React (CRA)`     | 3001  | http://localhost:3001 |
| Backend    | `Node.js/Express` | 3010  | http://localhost:3010 |
| ML Service | `Python/Flask`    | 5000  | http://localhost:5000 |
| Database   | `MongoDB`         | 27017 |                       |
| Cache      | `Redisd`          | 6379  |                       |

### 2. Backend Setup (Terminal 1)

**⚠️ Catatan:** Pastikan service MongoDB dan Redis sudah berjalan sebelum langkah ini.

```bash
cd backend
npm install

# Setup Environment Variables
cp .env.example .env
# Edit .env: Pastikan MONGODB_URI, REDIS_PASSWORD, dan JWT_SECRET sudah diisi

# Jalankan dalam Mode Development (Auto-Reload saat ngoding)
npm run dev
# Output sukses: "Server running on port 3010"
```

### 3. ML Service Setup (Terminal 2)

```bash
cd ml-service

# Buat dan aktifkan Virtual Environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Setup Environment
cp .env.example .env
# Edit .env: Masukkan GEMINI_API_KEY kamu

# Jalankan Service
python app.py
# Output sukses: "Running on http://127.0.0.1:5000"
```

### 4. Frontend Setup (Terminal 3)

```bash
cd frontend
npm install

# Setup Environment
cp .env.example .env

# Edit .env: Pastikan REACT_APP_API_URL mengarah ke http://localhost:3010

npm start
# Browser akan otomatis terbuka di http://localhost:3001
```

**⚠️ IMPORTANT:** Generate secure JWT_SECRET:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Complete guide**: See Link youtube :

---

## <a id="keyfeatures"></a>✨ Key Features

### 🧪 AI-Powered Discovery

- Multi-agent system dengan 6 specialized agents
- Google Gemini 2.5 Flash untuk intelligent compound generation
- Generate 3 novel compounds dalam 5–15 detik
- Parallel processing untuk mempercepat proses (ThreadPoolExecutor)

### 📋 Hybrid Input System (Dicoding Requirement)

- Structured Form: dropdown kategori + numeric inputs untuk target
- AI Prompt: natural language input dengan examples
- Toggle mode input untuk fleksibilitas workflow

### 🔬 Computational Chemistry

- RDKit integration untuk molecular calculations
- PubChem database search (100M+ compounds)
- Automatic SMILES validation
- Molecular property calculations (MW, LogP, H-bonds, TPSA)

### 📊 Complete Discovery Management

- Discovery history dengan search & pagination
- Favorites management dengan tags
- Export results ke JSON & CSV
- Validation scores dengan color-coding

### 🔐 Security & Data Integrity

- JWT Authentication untuk session/security
- Password hashing (bcrypt) + request validation
- Image processing & optimization untuk structure images (Sharp)

### 🧩 Modular Architecture (Multi-service)

- Frontend React (CRA) di port 3001
- Backend Node.js/Express di port 3010
- ML Service Python/Flask di port 5000
- MongoDB sebagai database utama + Redis untuk caching

### 🎨 Modern Web UI

- React 18 + React Router v6
- Tailwind CSS 3 untuk styling cepat & konsisten
- Context API untuk state management di level aplikasi

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

## <a id="tech"></a>🏗️ Tech Stack

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

## <a id="usage"></a>📖 Usage

### 0) Start the app (required)

Make sure all services are running (usually in separate terminals):

- **Backend** (Node/Express)
- **ML Service** (Python/Flask)
- **Frontend** (React)
- Also ensure **MongoDB** and **Redis** are up.

> Tip: If API calls or images fail to load, double-check which service is down and confirm the ports match your `.env` files.

### 1) Register / Login

1. Open the app in your browser.
2. **Register** to create a new account, or **Login** if you already have one.

### 2) Discovery (Generate compounds)

1. Go to the **Discover/Discovery** page.
2. Choose an input mode:
   - **Structured Form**
     - Select a category.
     - Fill in target properties (e.g., boiling point, viscosity, thermal stability, biodegradable, etc.).
   - **AI Prompt**
     - Describe your requirements in natural language (you can follow the examples shown in the UI).
3. Click **Submit/Generate**.
4. The system will generate **3 compounds** (typically within a few seconds).

### 3) View Results

On the results page you can:

- Browse the generated compounds.
- Open each compound to view details such as structure/visualization (2D/3D if available), SMILES, properties, and validation score.

### 4) Save to Favorites

1. From the results/detail view, click **Add to Favorites** for promising compounds.
2. The compound will appear in the **Favorites** page.

### 5) History

1. Open **History** to review previous discovery runs.
2. Use available features such as:
   - Search / filter
   - Pagination
   - Export (JSON/CSV) if available in the UI

### 6) Manage Favorites

In the **Favorites** page, you can:

- View all saved compounds.
- **Edit tags and notes**.
- **Remove** compounds from favorites.
- Click a card to open the detail modal (including 3D viewer / property calculator if available).

---

## <a id="compliace"></a>🎯 Dicoding Requirements Compliance

✅ **Portal web-based** - React frontend dengan Express backend  
✅ **Input kriteria spesifik** - Structured form dengan dropdown & number inputs  
✅ **Agentic AI implementation** - Multi-agent system (6 agents)  
✅ **Rekomendasi senyawa** - 3 novel compounds per request  
✅ **Formula + struktur + properties** - Complete molecular data dengan images  
✅ **Justifikasi** - Professional justification dari AI  
✅ **Dokumentasi limitasi** - System limitations documented  
✅ **Dataset documentation** - PubChem, Gemini, RDKit explained

---

## <a id="doc"></a>📄 Documentation

- [📘 Complete Documentation](DOCUMENTATION.md) - System overview, limitations, dataset
- [🏗️ Architecture Diagrams](ARCHITECTURE.md) - Visual architecture
- [🔧 Backend API Docs](backend/README.md) - API reference
- [🤖 ML Service Docs](ml-service/README.md) - ML service guide

---

## <a id="limitations"></a>⚠️ System Limitations

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

## <a id="testing"></a>🧪 Testing

### Test User

- Email: jarannnn@gmail.com
- Password: KURAKURA123
- (or you can register first)

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

## <a id="license"></a>📝 License

MIT License - See LICENSE file for details

---

## <a id="team"></a>👥 Team

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

## <a id="contact"></a>📬 Contact

If you have questions, feedback, or want to collaborate, feel free to reach out:

- **GitHub:** https://github.com/NUGRAHA18
- **Project Repository:** https://github.com/NUGRAHA18/chemical_discovery_ai
- **email:** agungnugraha180405@gmail.com
  > For bugs/issues, please open an Issue in this repository with steps to reproduce and screenshots/logs if possible.

**Project Status:** ✅ Complete & Ready

**Last Updated:** 15 December 2025
