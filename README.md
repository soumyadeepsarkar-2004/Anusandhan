<p align="center">
  <a href="https://harbor-municipal-major-page.trycloudflare.com">
    <img src="public/brand-emblem-dark.svg" alt="Anusandhan Official Logo Emblem" width="108" height="108" />
  </a>
</p>

<h1 align="center">Anusandhan (अनुसंधान)</h1>
<p align="center">
  <em>Autonomous Research Internship Intelligence &amp; Literature-Grounded Outreach Platform</em>
</p>

<p align="center">
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-amber.svg" alt="License: MIT" /></a>
  <a href="https://github.com"><img src="https://img.shields.io/badge/Build-Passing-emerald.svg" alt="Build Status" /></a>
  <a href="https://vitejs.dev"><img src="https://img.shields.io/badge/Frontend-Vite%205%20%7C%20React%2018%20%7C%20TypeScript-646CFF.svg" alt="Vite" /></a>
  <a href="https://fastapi.tiangolo.com"><img src="https://img.shields.io/badge/AI%20Microservice-FastAPI%20%7C%20Python%203.12-009688.svg" alt="FastAPI" /></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Gateway-Express%20%7C%20Node.js%2022-339933.svg" alt="Express Gateway" /></a>
  <a href="https://meity.gov.in"><img src="https://img.shields.io/badge/Privacy-DPDP%20Act%202023%20Compliant-blue.svg" alt="DPDP Act 2023" /></a>
  <a href="https://www.w3.org/WAI/standards-guidelines/wcag/"><img src="https://img.shields.io/badge/Accessibility-WCAG%20AAA%20Calibrated-purple.svg" alt="WCAG AAA" /></a>
</p>

> **Anusandhan** (Sanskrit: *अनुसंधान* — *systematic research, investigation, discovery*) is an enterprise-grade autonomous intelligence platform that levels the global playing field for ambitious undergraduate and graduate scholars across **Science, Technology, Humanities, Commerce, and Law**.

---

<p align="center">
  <img src="public/anusandhan-live-preview.png" alt="Anusandhan Live Platform Interface & Discovery Studio" width="100%" style="border-radius: 14px; box-shadow: 0 24px 50px rgba(0,0,0,0.45); border: 1px solid rgba(255,255,255,0.12);" />
</p>

### 🌐 Live Production Deployments & Access
- 🚀 **Live Production Platform**: [https://harbor-municipal-major-page.trycloudflare.com](https://harbor-municipal-major-page.trycloudflare.com)
- 📚 **VitePress Documentation (GitHub Pages)**: [https://soumyadeepsarkar-2004.github.io/Anusandhan/](https://soumyadeepsarkar-2004.github.io/Anusandhan/)
- 📦 **GitHub Repository**: [https://github.com/soumyadeepsarkar-2004/Anusandhan](https://github.com/soumyadeepsarkar-2004/Anusandhan)

---

## 🏛 Multi-Disciplinary Scope

Anusandhan goes beyond standard computer science scrapers by actively indexing and matching opportunities across **5 academic faculties**:

| Faculty | Sample Research Disciplines | Example Institutions / Portals |
| :--- | :--- | :--- |
| **Arts & Humanities** | Archaeology, Digital Humanities, South Asian Epigraphy, Comparative Literature | ASI, Oxford, Harvard Harvard Art Museums, SOAS |
| **Commerce & Economics** | Behavioral Finance, Macro Policy, Econometrics, Fintech | RBI, LSE, Chicago Booth, NBER, DSE |
| **Natural & Applied Sciences** | Quantum Photonics, Molecular Biology, Astrophysics, Materials | CERN, IISc, Max Planck, Weizmann, Caltech |
| **Social Sciences & Law** | Constitutional Jurisprudence, Cyber Law, Public Policy, Human Rights | NLSUI, Sciences Po, Columbia Law, Max Planck ILP |
| **AI, Systems & Engineering** | Agentic AI, Autonomous Robotics, Distributed Systems, Compilers | MIT CSAIL, Stanford, ETH Zürich, IIT Bombay |

---

## ✨ Core Innovations & Features

### 1. 24/7 Autonomous Scraper & Knowledge Crawler
- Continuously polls **arXiv**, **OpenAlex**, **Semantic Scholar**, and university vacancy portals every 30 minutes.
- Real-time deduplication and categorization into **Live Scraped Postings**, synchronized directly with the **Global Command Palette (`⌘K` / `Ctrl+K`)**.

### 2. Authentic Frosted Pearl Glassmorphism (Dual Celestial & Light Modes)
- **Celestial Dark Mode**: Deep space zinc gradients (`#070A12`) with refractive specular top sheens (`1px solid rgba(255, 255, 255, 0.22)`), 21st.dev cursor-tracking spotlights, and interactive constellation backdrops.
- **Frosted Pearl Light Mode**: High-contrast liquid pearl glass with ambient amber, indigo, and emerald refractions. Subdued custom scrollbars (no dark scrollbar tracks), WCAG AAA typography, and tactile press micro-interactions.
- **Vintage Brass Pull-Chain Toggle**: Pure minimalist beaded brass physics chain switch with spring recoil mechanics.

### 3. 146-Word Cold Email & Research Pitch Composer
- Adheres to empirical academic outreach studies: maximum 146 words, 3 distinct proof-of-work citations, no generic spam templates.
- Integrates personal GitHub repositories, preprints, and coursework directly into professor-specific problem statements.

### 4. Interactive RRS (Research Readiness Score) Diagnostic Studio
- Evaluates candidate strength across 5 key dimensions: Paper Familiarity, Proof-of-Work Artifacts, Technical Depth, Domain Alignment, and Email Etiquette.
- Real-time radar visualization and actionable intervention roadmap.

### 5. Multilingual Academic Voice Mentor (AnusandhanAI)
- Real-time voice guidance powered by Web Audio API and Gemini Live streaming.
- Supports English, Hindi, and regional dialects for mock viva, interview preparation, and query assistance.

### 6. 7-Day Polite Follow-Up Engine
- Automated tracking preventing double-emailing while pacing academic follow-ups ethically at 7 to 10 days.

---

## 🛠 System Architecture

```mermaid
graph TD
    A[Client: React 18 + Vite SPA] -->|Port 5000 /api| B[Express Production Gateway]
    A -->|Global Command Palette ⌘K| B
    B -->|FastAPI Microservice: Port 8000| C[Python AI Engine: LangChain + Gemini]
    B -->|SQLite / In-Memory DB| D[(Database & Session Store)]
    E[24/7 Background Crawler] -->|Scheduled Sweep: 30m| B
    E -->|Harvest| F[arXiv API]
    E -->|Harvest| G[OpenAlex Scholarly Graph]
    E -->|Harvest| H[Global University Lab Portals]
    C -->|RRS Scorer & Pitch Generator| B
```

---

## 🚀 Quickstart & Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: v3.10 or higher (`uv` recommended)
- **npm** or **pnpm**

### 1. Clone the Repository
```bash
git clone https://github.com/soumyadeepsarkar-2004/Anusandhan.git
cd Anusandhan
```

### 2. Install Dependencies
```bash
# Frontend and Express Gateway dependencies
npm install
cd server && npm install && cd ..

# Python AI Backend dependencies
cd backend
uv sync # or pip install -r requirements.txt
cd ..
```

### 3. Environment Configuration
Create a `.env` file in the root and in `backend/`:
```env
# Root / Server .env
PORT=5000
NODE_ENV=production
FASTAPI_BACKEND_URL=http://localhost:8000
DATABASE_URL=sqlite:///./data/anusandhan.db

# Backend .env (backend/.env)
GEMINI_API_KEY=your_gemini_api_key_here
PORT=8000
```

### 4. Build & Run Single-Command Production Server
```bash
# Build React Frontend
npm run build

# Start Unified Production Gateway (Serves SPA + API on Port 5000)
cd server
node server.js
```
The application will be live at: **`http://localhost:5000`**

---

## 🐳 Production Deployment Options

### Option A: 1-Click Unified Container (Render, Railway, Fly.io, AWS ECS)
A single self-contained multi-stage Docker container that builds the Vite SPA and serves both frontend and API on port 5000:

```bash
# Build & run unified image locally
docker build -t anusandhan-pro -f Dockerfile.unified .
docker run -p 5000:5000 -e JWT_SECRET="your_secure_secret" anusandhan-pro
```

- **Render.com**: Connect repo and select **Blueprint** using [render.yaml](file:///c:/PROJECTS/ResearchIntern_Pro/render.yaml).
- **Railway.app**: Deploy with 1-click using [railway.json](file:///c:/PROJECTS/ResearchIntern_Pro/railway.json).
- **Fly.io**: Deploy using `fly deploy` using [fly.toml](file:///c:/PROJECTS/ResearchIntern_Pro/fly.toml).

### Option B: Multi-Tier Docker Compose (Full Stack + Microservices)
Run the isolated multi-tier cluster (Nginx + Express Gateway + FastAPI + Redis + PostgreSQL + MongoDB + SQLite):

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### Option C: Automated Production Verification
Run the autonomous deployment health verification suite to validate all 11 production contracts:

```bash
node scripts/verify_production_deployment.mjs
```

---

## 📋 Production API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Gateway, DB connection, and background telemetry status |
| `GET` | `/api/faculty` | Indexed global professors across 5 disciplines |
| `GET` | `/api/opportunities/fellowships` | Tier-1 summer programs (DAAD, Mitacs, CERN, Bose) |
| `GET` | `/api/opportunities/scraped` | Live 24/7 harvested lab openings & research calls |
| `POST` | `/api/crawler/trigger` | Manually triggers an autonomous web scrape sweep |
| `POST` | `/api/generate/pitch` | Generates 146-word calibrated academic pitch |
| `POST` | `/api/diagnostics/rrs` | Evaluates Research Readiness Score & radar vectors |

---

## 🔒 Ethics & DPDP Act 2023 Compliance
Anusandhan follows strict academic cold-emailing ethical guidelines:
1. **Mandatory Human-in-the-Loop Confirmation**: No automated blast emails. Every draft must be reviewed by the student.
2. **7-Day Pacing**: Strict rate limits to avoid inbox spamming.
3. **Data Minimization**: Complete adherence to India's **Digital Personal Data Protection Act (DPDP Act 2023)** and GDPR. Zero sale of student academic metrics.

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.

Developed with precision for scholars worldwide.
