# TestForge AI — System Architecture Specification

**Status:** Approved baseline for implementation  
**Version:** 1.0 (Greenfield Architecture)  
**Companion Documents:** `Spec.md`, `docs/api-contracts.md`, `docs/data-models.md`, `docs/security.md`, `docs/evaluation-plan.md`

---

## 1. System Purpose & Operational Principles

TestForge AI is a specialized platform that converts natural-language software requirements into structured, verifiable test cases; evaluates their quality and ambiguity; prioritizes them; and executes an approved subset through controlled browser automation.

### Architectural Core Principles

1. **Deterministic Quality Gates Over Model Trust:** LLM generation is treated as untrusted input. Every candidate test case must pass rigorous schema validation, evidence span verification, and human review before becoming eligible for execution.
2. **Strict Separation of Concerns:**
   - **Frontend:** User workspace, interaction, state presentation, and visualization.
   - **Core Backend API:** Business logic, authentication, RBAC authorization, project/requirement lifecycles, and persistence.
   - **AI Service:** Dedicated Python microservice for deterministic NLP, ML classification, and LLM provider adaptation.
   - **Automation Worker:** Isolated, sandboxed Selenium execution engine restricted to a finite action vocabulary and authorized target environments.
3. **No Arbitrary Code Execution:** The system never executes arbitrary Python, JavaScript, bash commands, or code synthesized by an LLM. Browser execution is performed exclusively by interpreting a pre-validated, structured JSON execution plan.
4. **Environment Configuration Decoupled from Prompting:** Target URLs, DOM locator strategies, credentials, and test data are stored in project-level configuration. Prompts only reference symbolic locator keys (`target_ref`) and data keys (`value_ref`).
5. **Observability and Reproducibility:** Every generated test case is immutably linked to the exact requirement version and prompt template that produced it. Every execution run records exact timestamps, case revisions, environment revisions, assertion breakdowns, and sanitized logs.

---

## 2. Logical Architecture & Service Topology

```
+-----------------------------------------------------------------------------------------+
|                                    Client Layer                                         |
|                                                                                         |
|       React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui + TanStack Query          |
+--------------------------------------------+--------------------------------------------+
                                             |
                                             | HTTPS / REST (JSON)
                                             | Standard Authorization: Bearer JWT
                                             v
+-----------------------------------------------------------------------------------------+
|                                 Core Application Backend                                |
|                                                                                         |
|                           Node.js + Express + TypeScript                                |
|  - Router & Request Validation (Zod)                                                    |
|  - Auth & RBAC Middleware (Project Owner, QA Engineer, Viewer)                          |
|  - Domain Modules (Projects, Requirements, TestCases, Environments, Execution, Reports) |
|  - Orchestrator (Generation Jobs, Execution Runs)                                       |
|  - Audit Logging & Structured Logger (Pino)                                             |
+---------------------+---------------------------------------------+---------------------+
                      |                                             |
      Mongoose / BSON |                                             | Internal REST
      (Read / Write)  |                                             | Header: X-Internal-Key
                      v                                             v
+-----------------------------+             +---------------------------------------------+
|      Persistence Layer      |             |                  AI Service                 |
|                             |             |                                             |
|           MongoDB           |             |               Python + FastAPI              |
| - Users & Projects          |             |  - NLP Pipeline (spaCy en_core_web_sm)      |
| - Requirements & Versions   |             |  - Requirement Classifier (scikit-learn)    |
| - Generation Jobs           |             |  - LLM Provider Adapter (Gemini/OpenAI)     |
| - Test Cases & Revisions    |             |  - Deterministic Quality & Schema Gate      |
| - Environments & Locators   |             +---------------------------------------------+
| - Execution Runs & Results  |
| - Reports & Audit Events    |
+-----------------------------+
                      ^
                      | Read Target Config & Compiled Plan / Write Execution Result
                      |
+---------------------+-------------------------------------------------------------------+
|                                Browser Automation Worker                                |
|                                                                                         |
|                                 Python + Selenium + pytest                              |
|  - Preflight Security & Host Allowlist Validation                                       |
|  - Plan Interpreter (Finite Action Vocabulary: navigate, click, enter_text, assert_*)   |
|  - Explicit Wait Conditions & Timeouts                                                  |
|  - Evidence Capture (Sanitized Logs & Failure Diagnostics)                              |
+--------------------------------------------+--------------------------------------------+
                                             |
                                             | Controlled Web Driver
                                             v
+-----------------------------------------------------------------------------------------+
|                               Authorized Target Applications                            |
|                                                                                         |
|  - User-Configured Target Web Applications (e.g., Staging, UAT)                         |
|  - Local Test Fixture Application (Development / CI Testing Infrastructure Only)        |
+-----------------------------------------------------------------------------------------+
```

---

## 3. Monorepo Directory Topology

```text
TestForge_AI/
├── frontend/                     # React + Vite + TypeScript application
│   ├── src/
│   │   ├── app/                  # Router, layout shells, context providers
│   │   ├── components/ui/        # Reusable shadcn/ui components
│   │   ├── features/             # Domain features: dashboard, projects, requirements,
│   │   │                         # test-cases, execution, insights, reports, settings
│   │   ├── services/             # Axios/Fetch API client bindings
│   │   ├── schemas/              # Zod validation schemas matching shared contracts
│   │   └── types/                # TypeScript interface declarations
│   ├── tests/                    # Vitest component & interaction tests
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── backend/                      # Node.js + Express + TypeScript Core API
│   ├── src/
│   │   ├── config/               # Environment variables, constants
│   │   ├── middleware/           # Auth, RBAC, error handler, correlation ID, rate limiter
│   │   ├── models/               # Mongoose data schemas & models
│   │   ├── modules/              # Express controllers & services per domain
│   │   │   ├── auth/
│   │   │   ├── projects/
│   │   │   ├── requirements/
│   │   │   ├── generation/
│   │   │   ├── testcases/
│   │   │   ├── environments/
│   │   │   ├── execution/
│   │   │   └── reports/
│   │   ├── utils/                # Logging (Pino), crypto, HTTP clients
│   │   ├── validators/           # Zod request validators
│   │   └── app.ts                # Application entrypoint
│   ├── tests/                    # Jest/Supertest unit & integration tests
│   ├── package.json
│   └── tsconfig.json
├── ai-service/                   # Python + FastAPI AI/ML microservice
│   ├── app/
│   │   ├── api/                  # FastAPI routers (/internal/v1/*)
│   │   ├── core/                 # Config, security middleware (internal token), logging
│   │   ├── nlp/                  # spaCy requirement normalization & entity extraction
│   │   ├── classification/       # scikit-learn model loading, inference, pipeline
│   │   ├── generation/           # LLM provider adapter (Gemini/OpenAI abstraction)
│   │   ├── validation/           # Deterministic Pydantic schema validation & quality gates
│   │   ├── schemas/              # Pydantic request & response contracts
│   │   └── main.py               # FastAPI entrypoint
│   ├── datasets/                 # Curated classification datasets & manifests
│   ├── models/                   # Serialized model artifacts (.joblib)
│   ├── scripts/                  # Reproducible training & offline evaluation scripts
│   ├── tests/                    # pytest unit, NLP fixture, & mock generation tests
│   ├── requirements.txt
│   └── pyproject.toml
├── automation/                   # Python Selenium Automation Worker
│   ├── src/
│   │   ├── executor/             # Plan runner, lifecycle management, failure categorization
│   │   ├── actions/              # Finite action handlers (navigate, click, enter_text, etc.)
│   │   ├── assertions/           # Assertion handlers (assert_text, assert_visible, etc.)
│   │   ├── locators/             # Locator registry resolver
│   │   └── safety/               # Host allowlist enforcement, URL sanitizer
│   ├── tests/                    # pytest test suites
│   ├── fixture_app/              # Isolated local HTML/JS app for CI testing ONLY
│   └── requirements.txt
├── shared/                       # Cross-service schemas and testing fixtures
│   ├── schemas/                  # Shared JSON schemas (TestCase, ExecutionPlan, etc.)
│   └── fixtures/                 # Canonical requirement samples & test data
├── infrastructure/               # Container and deployment configurations
│   ├── docker/
│   │   ├── frontend.Dockerfile
│   │   ├── backend.Dockerfile
│   │   ├── ai-service.Dockerfile
│   │   └── automation.Dockerfile
│   └── docker-compose.yml
├── docs/                         # Authoritative architecture and technical specifications
│   ├── architecture.md
│   ├── api-contracts.md
│   ├── data-models.md
│   ├── security.md
│   └── evaluation-plan.md
├── scripts/                      # Setup, linting, seed, and maintenance scripts
├── .env.example                  # Validated environment configuration template
├── .gitignore
├── README.md
└── Spec.md
```

---

## 4. Inter-Service Communication & Protocols

| Interaction Path | Protocol | Authentication / Security | Payload Format | Idempotency / Resilience |
|---|---|---|---|---|
| **Frontend -> Backend** | HTTPS / REST | Bearer JWT in Authorization header | JSON conforming to Zod / TypeScript contracts | Request ID tracking (`X-Request-ID`); standard error envelope |
| **Backend -> AI Service** | HTTP / REST (Internal network) | Shared secret header `X-Internal-Service-Key` | JSON conforming to Pydantic schemas | Bounded retries (max 2 for transient 503s); configurable timeout (30s) |
| **Backend -> Automation Worker** | Direct Process / Queued Job | File/Memory IPC or REST Trigger with internal auth | Compiled Execution Plan JSON | Single-execution lease per run; fail-closed on worker crash |
| **Backend -> MongoDB** | TCP / Mongoose | SCRAM-SHA-256 database credentials | BSON / Mongoose schema validation | Connection pooling, retryable writes |

---

## 5. State Machine Lifecycles

### 5.1 GenerationJob State Machine

```
[ POST /generation-jobs ] 
         |
         v
     [ queued ] ------(Worker acquires job)------> [ processing ]
                                                         |
         +-----------------------------------------------+-----------------------------------+
         | (Validation pass)                             | (Validation fail / schema error)   | (Network / timeout)
         v                                               v                                   v
   [ completed ]                                  [ needs_review ]                        [ failed ]
   (Persists candidate test cases)                (Flags unsupported assumptions)          (Records safe error code)
```

### 5.2 TestCase Review & Versioning State Machine

```
[ Candidate Created ] 
         |
         v
     [ pending ] <-----------------------------+
         |                                     | (User edits approved case -> bumps version)
         +-----------------+-------------------+
         |                 |                   |
         v                 v                   v
   [ approved ]      [ rejected ]      [ needs_changes ]
         |
         v
(Eligible for Execution if Automation Status == 'ready')
```

### 5.3 ExecutionRun & ExecutionResult Lifecycle

```
[ POST /execution-runs ] (Verifies case is approved & environment is authorized)
         |
         v
     [ queued ] ------(Preflight check pass)------> [ running ]
                                                        |
         +---------------------+------------------------+---------------------+
         |                     |                        |                     |
         v                     v                        v                     v
   [ completed ]          [ failed ]               [ error ]             [ blocked ]
  (All assertions pass)  (Assertion fail)    (Browser / driver crash) (Target unavailable)
```

---

## 6. Local Multi-Container Deployment

Local development will be orchestrated via `docker-compose.yml`:
- `testforge-mongodb`: Official `mongo:7.0` container on port `27017` with volume persistence.
- `testforge-backend`: Node.js container exposing port `4000`.
- `testforge-ai-service`: Python FastAPI container exposing port `8000`.
- `testforge-automation`: Python Selenium worker with headless Chrome driver.
- `testforge-frontend`: Vite development server on port `5173`.
- `testforge-fixture`: Lightweight local HTTP server serving the CI test fixture app on port `8080`.

