\# Chemical Discovery AI

AI-powered chemical discovery platform using multi-agent system. Generate novel compounds with validated properties in seconds.

\## 🚀 Tech Stack

\- \*\*Frontend:\*\* React 18 + Tailwind CSS

\- \*\*Backend:\*\* Express.js + MongoDB

\- \*\*ML Service:\*\* Flask + Gemini AI + RDKit

\- \*\*Database:\*\* MongoDB

\## 📦 Project Structure

```

chemical-discovery-ai/

├── backend/          # Express.js API (Port 3000)

├── ml-service/       # Flask ML Service (Port 5000)

├── frontend/         # React App (Coming soon)

└── README.md

```

\## 🏗️ Architecture

```

React → Express.js → Flask ML → Gemini AI

&nbsp;          ↓

&nbsp;      MongoDB

```

### Visual Architecture

For detailed architecture diagrams, see [ARCHITECTURE.md](ARCHITECTURE.md).

**Quick Overview:**

```
React Frontend (Port 80)
    ↓ HTTP/JSON + JWT
Express.js API (Port 3000)
    ↓ REST API          ↓ MongoDB
Flask ML Service (Port 5000)
    ↓ Gemini AI + PubChem + RDKit
```

### Processing Time

- **Average**: 8-12 seconds per discovery
- **Breakdown**:
  - Preprocessing: 1s
  - Gemini AI: 2-5s
  - PubChem Search: 1-3s
  - Image Generation: 2-3s
  - Database Save: <1s

\## ✨ Features

\- 🔐 JWT Authentication

\- 🧪 AI-powered compound generation

\- 🔍 PubChem database integration

\- 📊 Molecular property calculation (RDKit)

\- 💾 Discovery history \& favorites

\- 📥 Export (JSON, CSV, PDF)

\- 🖼️ Automatic structure image generation

\## 🚦 Status

\- ✅ Backend API - Complete

\- ✅ ML Service - Complete

\- 🟡 Testing - In Progress

\- ⚪ Frontend - Pending

\- ⚪ Deployment - Pending

## 📝 Documentation

- [📘 Complete Documentation](DOCUMENTATION.md) - System overview, limitations, dataset details
- [🏗️ Architecture Diagrams](ARCHITECTURE.md) - Visual system architecture
- [🔧 Backend API Documentation](backend/README.md) - API endpoints & examples
- [🤖 ML Service Documentation](ml-service/README.md) - ML service setup & usage
- [📋 Development Checklist](CHECKLIST.md) - Progress tracker

### Key Documentation Sections

- **System Limitations**: AI model, dataset, technical constraints
- **Dataset Sources**: PubChem (100M+ compounds), Gemini AI, RDKit
- **API Reference**: 18 endpoints with examples
- **Installation Guide**: Step-by-step setup
- **Known Issues**: Common problems & solutions

\## 🔧 Setup

See individual README files in each directory for setup instructions.

\## 📄 License

MIT License

\## 👥 Team

\- Machine Learning: Cleo, Afif

\- Full Stack: Eska, Agung, Faris

---

\*\*Note:\*\* This project is part of university coursework.
