# Chemical Discovery AI - Project Documentation

**Project:** Novel Chemicals Discovery Agent  
**Version:** 1.0.0  
**Last Updated:** Desember 15, 2025
**Team:** Cleo, Afif, Eska, Agung, Faris

**Machine Learning Code** : https://drive.google.com/file/d/1W3rMWuEWgQOt-QiuTUvyWkuKO6k9B0vT/view?usp=sharing

**nstallation Guide** : [see here](#installation-guide)

## 📑 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [AI Model Implementation](#ai-model-implementation)
5. [Dataset & Data Sources](#dataset--data-sources)
6. [System Limitations](#system-limitations)
7. [API Documentation](#api-documentation)
8. [Installation Guide](#installation-guide)
9. [Known Issues](#known-issues)
10.

---

## <a id="system-overview"></a>🎯 System Overview

Novel Chemicals Discovery Agent adalah platform berbasis AI yang membantu peneliti di industri petrokimia untuk menemukan senyawa kimia baru dengan lebih cepat dan efisien.

### Problem Statement

Proses R&D tradisional untuk menemukan senyawa baru:

- ❌ Sangat lambat (berbulan-bulan hingga bertahun-tahun)
- ❌ Mahal (lab equipment, materials, expert time)
- ❌ Trial & error ekstensif
- ❌ High failure rate

### Solution

Platform ini menggunakan Agentic AI untuk:

- ✅ Generate novel compounds dalam 5-15 detik
- ✅ Validasi struktur molekul otomatis
- ✅ Analisis properties berbasis computational chemistry
- ✅ Rekomendasi berbasis database existing compounds

### Key Features

1. **AI-Powered Compound Generation**: 3 novel compounds per request
2. **Hybrid Input System**: Structured form + AI prompt mode
3. **Molecular Visualization**: Auto-generated 2D structure images
4. **Property Calculations**: Molecular weight, LogP, H-bonds, TPSA
5. **Database Integration**: PubChem search untuk base compounds
6. **Discovery History**: Track semua past discoveries
7. **Favorites Management**: Save & categorize promising compounds
8. **Export Functionality**: JSON, CSV formats

---

## <a id="architecture"></a>🏗️ Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      USER INTERFACE                         │
│              React.js Frontend (Port 80/443)                │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP/JSON + JWT
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY                              │
│              Express.js Backend (Port 3000)                 │
│  ┌──────────────┬──────────────┬──────────────────────┐    │
│  │ Auth         │ Discovery    │ History/Favorites    │    │
│  │ Controllers  │ Controller   │ Controllers          │    │
│  └──────────────┴──────────────┴──────────────────────┘    │
└───────┬──────────────────────────────────┬─────────────────┘
        │                                   │
        │ MongoDB Query                     │ HTTP REST API
        ↓                                   ↓
┌───────────────────┐          ┌─────────────────────────────┐
│   DATABASE        │          │    ML SERVICE               │
│   MongoDB         │          │    Flask API (Port 5000)    │
│   - users         │          │  ┌─────────────────────┐   │
│   - discoveries   │          │  │ Multi-Agent System  │   │
│   - favorites     │          │  │ - Preprocessor      │   │
│                   │          │  │ - Analyzer          │   │
└───────────────────┘          │  │ - Researcher        │   │
                               │  │ - Generator         │   │
                               │  │ - Validator         │   │
                               │  │ - Justifier         │   │
                               │  └─────────────────────┘   │
                               └──────┬──────┬───────┬───────┘
                                      │      │       │
                                      │      │       │
                       ┌──────────────┘      │       └────────────┐
                       ↓                     ↓                    ↓
              ┌────────────────┐   ┌─────────────────┐  ┌──────────────┐
              │  Gemini AI     │   │   PubChem API   │  │   RDKit      │
              │  (Google)      │   │   Database      │  │   Library    │
              │  - Compound    │   │   - 100M+       │  │  - Property  │
              │    Generation  │   │     Compounds   │  │    Calc      │
              │  - Analysis    │   │   - SMILES      │  │  - Image Gen │
              └────────────────┘   └─────────────────┘  └──────────────┘
```

### Data Flow - Discovery Request

```
1. User Input (Frontend)
   ↓
2. JWT Verification (Express Middleware)
   ↓
3. Forward to Flask ML Service
   ↓
4. Multi-Agent Processing:
   a. Preprocessor: Extract chemical concepts
   b. Analyzer: Interpret requirements
   c. Researcher: Search PubChem for base compounds
   d. Generator: Use Gemini AI to create 3 novel compounds
   e. Validator: Check SMILES validity & feasibility
   f. Justifier: Create recommendation explanation
   ↓
5. Image Generation (RDKit)
   ↓
6. Return to Express with base64 images
   ↓
7. Image Processing:
   - Convert base64 → PNG files
   - Save to disk with UUID filenames
   - Replace base64 with file paths
   ↓
8. Save to MongoDB (discoveries collection)
   ↓
9. Return to Frontend
   ↓
10. Display results with molecular structures
```

---

## <a id="technology-stack"></a>💻 Technology Stack

### Frontend

- **Framework**: React.js 18
- **Styling**: Tailwind CSS 3
- **HTTP Client**: Axios
- **Routing**: React Router v6
- **State Management**: Context API
- **Forms**: React Hook Form (optional)

### Backend API

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.18
- **Database ODM**: Mongoose 7
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Validation**: express-validator
- **Image Processing**: Sharp
- **Security**: Helmet, CORS

### ML Service

- **Language**: Python 3.10+
- **Framework**: Flask 3.0
- **AI Model**: Google Gemini 2.5 Flash
- **Chemistry Library**: RDKit 2025.9
- **Database API**: PubChemPy 1.0.5
- **Parallel Processing**: ThreadPoolExecutor

### Database

- **Type**: NoSQL Document Database
- **System**: MongoDB 7.0
- **Driver**: Mongoose ODM
- **Collections**: users, discoveries, favorites

### DevOps

- **Version Control**: Git + GitHub
- **Package Managers**: npm (Node), pip (Python)
- **Environment**: dotenv
- **Deployment**: Docker (optional)

---

## ## <a id="ai-model-implementation"></a>🤖 AI Model Implementation

### Gemini AI Integration

**Model:** `gemini-2.5-flash`

**Why Gemini?**

- Fast response time (1-3 seconds)
- Good at structured JSON output
- Understanding chemical terminology
- Free tier: 60 requests/minute

**Use Cases:**

1. **Compound Generation**: Generate 3 novel compounds based on criteria
2. **Property Prediction**: Estimate physical/chemical properties
3. **Modification Suggestions**: Propose molecular modifications
4. **Justification**: Explain why compounds fit requirements

**Limitations:**

- ⚠️ Can hallucinate (generate chemically impossible structures)
- ⚠️ SMILES validation needed post-generation
- ⚠️ No access to proprietary chemical databases
- ⚠️ Training data not disclosed by Google

### Multi-Agent System

**6 Specialized Agents:**

1. **Preprocessor Agent**

   - Role: Extract chemical concepts from user input
   - Input: Raw criteria text
   - Output: Structured concepts (material types, properties, constraints)

2. **Analyzer Agent**

   - Role: Interpret requirements & identify target properties
   - Input: Preprocessed concepts
   - Output: Technical analysis of criteria

3. **Researcher Agent**

   - Role: Search existing compounds from PubChem
   - Input: Analysis + search terms
   - Output: Base compounds with properties

4. **Generator Agent**

   - Role: Create novel compounds via molecular modifications
   - Input: Research insights + criteria
   - Output: 3 novel compounds (SMILES + properties)

5. **Validator Agent**

   - Role: Validate feasibility & safety
   - Input: Generated compounds
   - Output: Validation scores + concerns

6. **Justifier Agent**
   - Role: Explain recommendations to user
   - Input: Compounds + validation results
   - Output: Professional justification text

---

## <a id="dataset--data-sources"></a>📊 Dataset & Data Sources

### 1. PubChem Database

**What is PubChem?**

- NIH's public chemistry database
- 100+ million chemical compounds
- Free API access
- Open data (CC0 license)

**Data Available:**

- CID (Compound ID)
- IUPAC Name
- Molecular Formula
- SMILES notation
- Molecular Weight
- 3D Structure

**Integration:**

- Library: `PubChemPy 1.0.5`
- Method: REST API calls
- Caching: In-memory cache for repeated searches
- Parallel Search: ThreadPoolExecutor for multiple queries

**Example Search:**

```python
compounds = pcp.get_compounds('surfactant', 'name', listkey_count=5)
for c in compounds:
    print(c.iupac_name, c.molecular_formula, c.canonical_smiles)
```

**Limitations:**

- ⚠️ Not all novel compounds are in PubChem
- ⚠️ API rate limits (5 requests/second)
- ⚠️ No proprietary/commercial compounds
- ⚠️ Some compounds lack complete data

### 2. Gemini AI Training Data

**Source:** Google's proprietary training corpus

**Estimated Coverage:**

- General chemistry knowledge (textbooks, papers)
- Chemical databases (public domain)
- Scientific literature (up to training cutoff)
- Patent databases (partial)

**What It Knows:**

- ✅ Chemical nomenclature (IUPAC, common names)
- ✅ Molecular structure relationships
- ✅ Property trends & patterns
- ✅ Synthesis strategies (general)

**What It Doesn't Know:**

- ❌ Proprietary formulations
- ❌ Cutting-edge research (post-training)
- ❌ Exact synthesis procedures
- ❌ Lab-verified safety data

**Uncertainty:**

- Google doesn't disclose exact training data sources
- Model behavior can be unpredictable
- Requires validation with RDKit

### 3. RDKit Computational Data

**What is RDKit?**

- Open-source cheminformatics toolkit
- Written in C++ (Python bindings)
- Standard in computational chemistry

**Calculations Performed:**

- **Molecular Weight** (sum of atomic masses)
- **LogP** (lipophilicity, octanol-water partition)
- **H-Bond Donors** (NH, OH groups count)
- **H-Bond Acceptors** (N, O atoms count)
- **TPSA** (Topological Polar Surface Area)
- **Rotatable Bonds** (flexibility indicator)
- **Aromatic Rings** (stability indicator)

**Accuracy:**

- ✅ MW: Exact (based on atomic masses)
- ✅ H-bonds: Exact (structural count)
- ⚠️ LogP: Estimated (Crippen method, ±0.5 units)
- ⚠️ TPSA: Estimated (empirical formula)

**Limitations:**

- Computational models only (not lab measurements)
- Some properties require 3D structure (not available here)
- Experimental values may differ

### 4. Fallback Data

**When Used:**

- PubChem search returns no results
- Network error / API timeout
- Rate limit exceeded

**Fallback Compounds:**

- Manually curated list (~20 compounds)
- Common industrial chemicals
- Well-characterized materials
- Categorized by type (surfactant, polymer, solvent)

**Example Fallback:**

```python
fallback_surfactants = [
    {'name': 'Sodium Dodecyl Sulfate', 'formula': 'C12H25NaO4S', ...},
    {'name': 'CTAB', 'formula': 'C19H42BrN', ...}
]
```

---

## <a id="system-limitations"></a>⚠️ System Limitations

### 1. AI Model Limitations

#### Hallucination Risk

- **Problem**: Gemini AI dapat generate compounds yang tidak valid secara kimia
- **Mitigation**: RDKit validation untuk check SMILES syntax
- **Remaining Risk**: SMILES bisa valid tapi compound impossible to synthesize

#### No Lab Testing

- **Problem**: Semua properties adalah theoretical/computational
- **Impact**: Real-world values dapat berbeda signifikan
- **Example**: Predicted LogP = 3.2, Experimental LogP = 2.8 (±0.4 variance common)

#### Training Data Unknown

- **Problem**: Google tidak disclose training data Gemini
- **Impact**: Tidak tahu coverage untuk specific chemical domains
- **Risk**: Model bisa confident tapi salah untuk niche applications

### 2. Dataset Limitations

#### PubChem Coverage

- **Not Included**: Proprietary compounds dari pharma/chemical companies
- **Not Included**: Very new compounds (belum published)
- **Not Included**: Military/defense chemicals (classified)
- **Coverage**: ~40-50% of all known organic compounds

#### Novel Compound Generation

- **Problem**: Generated compounds mungkin belum ada di literature
- **Impact**: Tidak ada existing data untuk validation
- **Approach**: Rely on computational predictions only

#### Search Accuracy

- **Issue**: PubChem search by name bisa ambiguous
- **Example**: "surfactant" returns 10,000+ results, hanya ambil top 5
- **Impact**: Might miss better base compounds

### 3. Technical Limitations

#### Processing Time

- **Current**: 5-15 seconds per discovery request
- **Bottleneck**: Gemini API call (2-5s) + image generation (1-3s)
- **Not Real-Time**: Cannot handle instant responses

#### Concurrent Requests

- **Architecture**: Single-threaded Flask
- **Limitation**: One request at a time
- **Impact**: Multiple users → queue/timeout
- **Solution**: Need worker pool (future work)

#### Compound Output Limit

- **Current**: Fixed 3 compounds per request
- **Reason**: Balance between quality & processing time
- **User Impact**: Cannot get 10+ compounds at once

#### Image Resolution

- **Current**: 300x300 pixels PNG
- **Quality**: Good for web display, not for publication
- **Storage**: ~50-100 KB per image
- **Limitation**: No 3D structure, no interactive viewer

#### Memory Usage

- **RDKit**: ~200 MB RAM when loaded
- **PubChem Cache**: ~50 MB for 1000 compounds
- **Total**: ~500 MB per Flask instance
- **Impact**: Cannot scale to 100+ concurrent users without optimization

### 4. Validation Limitations

#### No Synthesis Verification

- **Problem**: Tidak ada proof bahwa compound bisa di-synthesize
- **Current**: Score based on structural complexity heuristics
- **Example**: Score 0.8 doesn't mean 80% success rate in lab

#### No Safety Testing

- **Problem**: Tidak ada toxicity data dari lab
- **Current**: Basic safety assessment (bioaccumulation risk from LogP)
- **Risk**: Generated compound bisa toxic/hazardous

#### No Cost Analysis

- **Problem**: Tidak ada estimasi cost synthesis
- **Impact**: Compound mungkin feasible tapi terlalu mahal
- **Example**: Rare starting materials, 20-step synthesis

#### No Patent Check

- **Problem**: Generated compound mungkin sudah patented
- **Impact**: Cannot commercialize without license
- **Solution**: Manual patent search required

### 5. Scalability Limitations

#### Database Size

- **Current**: MongoDB dengan single server
- **Limit**: ~10,000 users, ~100,000 discoveries
- **Beyond**: Need sharding / replica sets

#### File Storage

- **Current**: Images saved to local disk
- **Limit**: ~10,000 discoveries = ~1 GB disk
- **Beyond**: Need cloud storage (S3/GCS)

#### API Rate Limits

- **Gemini API**: 60 requests/minute (free tier)
- **PubChem API**: 5 requests/second
- **Impact**: Service degradation during peak usage

### 6. Input/Output Limitations

#### Input Flexibility

- **Current**: Free-text or structured form
- **Challenge**: AI might misinterpret vague criteria
- **Best Practice**: Specific numerical values get better results
- **Example**: "high thermal stability" → ambiguous, "thermal stability > 80°C" → clear

#### Output Format

- **Fixed**: Always 3 compounds in JSON
- **No Customization**: Cannot request specific properties only
- **No Iteration**: Cannot refine compounds based on feedback

---

## <a id="api-documentation"></a>📚 API Documentation

See [Backend README](backend/README.md) for complete API documentation including:

- 18 API endpoints
- Request/response examples
- Authentication flow
- Error codes

**Quick Reference:**

- Auth: `/api/auth/*` (register, login, me)
- Discovery: `/api/discover/*` (create, get, delete)
- History: `/api/history/*` (list, stats, search)
- Favorites: `/api/favorites/*` (CRUD operations)
- Export: `/api/export/*` (JSON, CSV, PDF)

---

## <a id="installation-guide"></a>🛠️ Installation Guide

Pastikan kamu menjalankan **3 Terminal terpisah** untuk Backend, ML Service, dan Frontend agar semuanya berjalan bersamaan.

### Prerequisites

- Node.js 18+
- Python 3.10+
- MongoDB 7.0+
- Git

### Port Allocation

| Service    | Technology        | Port  | URL                   |
| ---------- | ----------------- | ----- | --------------------- |
| Frontend   | `React (CRA)`     | 3001  | http://localhost:3001 |
| Backend    | `Node.js/Express` | 3010  | http://localhost:3010 |
| ML Service | `Python/Flask`    | 5000  | http://localhost:5000 |
| Database   | `MongoDB`         | 27017 |                       |
| Cache      | `Redisd`          | 6379  |                       |

### 1. Backend Setup (Terminal 1)

```bash
cd backend
npm install

# Setup Environment Variables
cp .env.example .env
# Edit .env: Pastikan MONGODB_URI dan JWT_SECRET sudah diisi

npm run dev
```

### 2. ML Service Setup (Terminal 2)

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
python app-optimized.py
```

### 3. Frontend Setup (Terminal 3)

```bash
cd frontend
npm install

# Setup Environment (Penting untuk koneksi ke Backend)

cp .env.example .env

# Edit .env: Pastikan VITE_API_URL atau REACT_APP_API_URL mengarah ke port Backend

npm start
```

**⚠️ IMPORTANT:** Generate secure JWT_SECRET:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Complete guide**: See individual README files in each directory.

---

## <a id="known-issues"></a>🐛 Known Issues

### Issue #1: PubChem Import Sometimes Fails

- **Symptom**: `pubchem_available: false` in health check
- **Cause**: Multiple Python environments
- **Fix**: Install in correct environment: `python -m pip install pubchempy`

### Issue #2: Image Generation Slow on Windows

- **Symptom**: 3-5 seconds per image
- **Cause**: RDKit rendering on Windows slower than Linux
- **Workaround**: Use parallel processing (already implemented)
- **Future**: Consider pre-rendering common structures

### Issue #3: MongoDB Connection Timeout

- **Symptom**: "MongoTimeoutError" after 30 seconds
- **Cause**: MongoDB service not started
- **Fix**: `net start MongoDB` (Windows) or `sudo systemctl start mongod` (Linux)

### Issue #4: JWT Token Expired

- **Symptom**: 401 error after 24 hours
- **Cause**: Token expiry set to 24h
- **Expected Behavior**: User must login again
- **Note**: Not a bug, security feature

### Issue #5: Large Discovery History Slow to Load

- **Symptom**: History page takes 5+ seconds with 1000+ discoveries
- **Cause**: No pagination on frontend (loads all)
- **Fix**: Implement pagination (20 items per page)
- **Status**: Backend supports pagination, frontend needs implementation

---

## 📞 Support & Contact

**Repository**: https://github.com/NUGRAHA18/chemical_discovery_ai
**Issues**: Create issue on GitHub  
**Team**: Cleo (ML), Afif (ML), Eska (Backend), Agung (Full Stack), Faris (Backend)

---

## 📄 License

MIT License - See LICENSE file for details.

---

**Document Version**: 1.0.0  
**Last Updated**: DECEMBER 15, 2025
**Status**: Complete ✅
