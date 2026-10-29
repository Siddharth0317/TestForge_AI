# TestForge AI ⚡

**An Intelligent NLP- and LLM-Powered Automated Test Case Generation and Execution Platform**

> *From Requirements to Verified Tests.*

TestForge AI bridges the gap between natural language software specifications and verifiable browser automation. It combines deterministic NLP normalization (spaCy), supervised requirement classification (scikit-learn), structured LLM candidate generation, strict multi-layered quality gates, human review workflows, and controlled browser automation (Selenium).

---

## 🏗️ Architecture & Technology Stack

The platform is structured as a clean monorepo with strict service and trust boundaries:

- **Frontend (`/frontend`):** React 18, Vite, TypeScript, Tailwind CSS, Lucide React, TanStack Query.
- **Core Backend API (`/backend`):** Node.js 20+, Express, TypeScript, Mongoose, Zod, Pino structured logging.
- **AI Microservice (`/ai-service`):** Python 3.11+, FastAPI, Pydantic v2, spaCy, scikit-learn.
- **Automation Worker (`/automation`):** Python 3.11+, Selenium, pytest (interprets pre-compiled execution plans with action allowlists).
- **Persistence (`/infrastructure`):** MongoDB 7.0.

For detailed architecture, contracts, and threat models, see:
- [`docs/architecture.md`](docs/architecture.md)
- [`docs/api-contracts.md`](docs/api-contracts.md)
- [`docs/data-models.md`](docs/data-models.md)
- [`docs/security.md`](docs/security.md)
- [`docs/evaluation-plan.md`](docs/evaluation-plan.md)

---

## 📋 Prerequisites

- **Node.js:** v20.x or v22.x LTS (npm v10+)
- **Python:** v3.11+
- **Docker & Docker Compose:** Optional for local multi-container development

---

## 🚀 Quickstart & Setup Guide

### 1. Clone & Environment Configuration

```bash
# Clone the repository
git clone <repo-url>
cd TestForge_AI

# Create your local environment configuration from template
cp .env.example .env
```

*(Edit `.env` if you need custom ports or live LLM credentials. By default, `LLM_PROVIDER=mock` is enabled for instant local testing without paid API keys).*

---

### 2. Install Dependencies

#### Node.js Services (Backend & Frontend)
```bash
# From repository root
npm install
```

#### Python AI Service
```bash
cd ai-service
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
cd ..
```

---

### 3. Running Services for Development

#### Option A: Docker Compose (All-in-One)
```bash
docker compose up -d
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:4000/api/v1`
- AI Service: `http://localhost:8000/health`
- MongoDB: `localhost:27017`

#### Option B: Standalone Processes

**Terminal 1 — Core Backend:**
```bash
npm run dev:backend
```
*Health check:* `http://localhost:4000/health`

**Terminal 2 — AI Service:**
```bash
cd ai-service
# Activate virtual environment
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*Health check:* `http://localhost:8000/health`

**Terminal 3 — Frontend:**
```bash
npm run dev:frontend
```
*Application Shell:* `http://localhost:5173`

---

## 🧪 Testing & Verification

Run the automated test suites across all layers:

```bash
# Backend unit & integration smoke tests
npm run test:backend

# Frontend React component & interaction tests
npm run test:frontend

# TypeScript typechecking across all JS/TS workspaces
npm run typecheck

# AI Service pytest suite
cd ai-service
pytest
cd ..

# Automation safety & allowlist tests
cd automation
pytest tests/test_safety.py
cd ..
```

---

## 🔒 Security Principles

1. **No Arbitrary Code Execution:** The platform never executes model-generated Python, JavaScript, or shell commands.
2. **Strict Host Allowlist:** Browser automation executes only against explicitly configured project target hosts. Local/cloud metadata endpoints (e.g. `169.254.169.254`) are blocked.
3. **Secret Isolation:** API keys and credentials are stored strictly in server-side environment variables and never logged or exposed in test case payloads.
4. **Deterministic Validation:** All candidate test cases must pass Pydantic schema validation, requirement traceability checks, and human review before becoming eligible for automation.

---

## 📄 License & Status

Authoritative specification: [`Spec.md`](Spec.md)  
Project roadmap: [`PHASE_CHECKLIST.md`](PHASE_CHECKLIST.md)

