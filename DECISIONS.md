# TestForge AI — Decision Log

> Record decisions that materially affect architecture, contracts, security, data, evaluation, dependencies, or product scope.
> Do not use this file to silently override `Spec.md`. If a decision changes a requirement, update the specification after owner approval.

## Decision status

- `PROPOSED` — awaiting owner decision.
- `APPROVED` — owner approved; implementation may proceed when dependencies are satisfied.
- `REJECTED` — not selected; retain rationale.
- `SUPERSEDED` — replaced by a later decision; link the replacement.

---

## Approved Project Decisions

### DEC-001 — Greenfield Repository & Legacy Code Reuse Decision

- **Date proposed:** 2026-10-29
- **Status:** `APPROVED`
- **Decision owner/approval:** Approved in Phase 0 Planning Review
- **Context/problem:** The legacy project (`C:\Projects\AutoHealQA`) was inspected read-only. It had architectural defects, dynamic self-healing risks, hardcoded public endpoints, and lacked deterministic NLP/ML components.
- **Options considered:**
  1. Refactor/repair legacy repository.
  2. Selective reuse of frontend or backend modules.
  3. Rebuild 100% clean greenfield in `C:\Projects\TestForge_AI` and reuse zero code.
- **Decision:** Build in `C:\Projects\TestForge_AI` as a clean greenfield monorepo. Keep `AutoHealQA` completely untouched. **Reuse none of the legacy code.** Only high-level QA requirement scenarios are adapted for testing fixtures.
- **Rationale:** Prevents carrying over untested dependencies, security vulnerabilities, or brittle Playwright heuristics.
- **Impacted Spec.md sections:** Section 17 (Phase 0), Section 27 (Greenfield Rebuild Directive).
- **Impacted phase(s):** 0–10.

---

### DEC-002 — Core Architecture & Service Boundaries

- **Date proposed:** 2026-10-29
- **Status:** `APPROVED`
- **Decision owner/approval:** Approved in Phase 0 Architecture Review
- **Context/problem:** Define clean service and trust boundaries for the multi-service platform.
- **Decision:**
  - **Frontend:** React + Vite + TypeScript + Tailwind CSS + shadcn/ui.
  - **Core Application Backend:** Node.js + Express + TypeScript + Mongoose.
  - **Persistence:** MongoDB + Mongoose schemas with versioning and optimistic concurrency.
  - **AI Service:** Python + FastAPI + spaCy + scikit-learn.
  - **Browser Worker:** Python + Selenium + pytest with a strict allowlist of actions and host validation.
  - **Local Orchestration:** Docker Compose.
- **Rationale:** Strict separation of application business logic (Node.js) from ML/NLP processing (Python) and browser automation runtime risks.
- **Impacted Spec.md sections:** Sections 5, 6, 17, 27.2.
- **Impacted phase(s):** 0–10.

---

### DEC-003 — LLM Provider Integration Strategy

- **Date proposed:** 2026-10-29
- **Status:** `APPROVED`
- **Decision owner/approval:** Approved in Phase 0 Architecture Review
- **Context/problem:** Abstract LLM calls to avoid vendor lock-in, protect credentials, and enable offline CI testing.
- **Decision:**
  - Create a provider-agnostic adapter interface (`LLMProvider`) in `ai-service/app/generation/`.
  - Default real provider: Google Gemini (`gemini-1.5-pro` / `gemini-2.5-flash`), with optional OpenAI adapter.
  - Mandatory Mock Provider (`mock`) for deterministic unit and integration tests without network access or API quota consumption.
  - Credentials remain strictly server-side; API keys are never exposed to clients or logged.
- **Rationale:** Ensures deterministic testability and prevents leaking privileged API keys.
- **Impacted Spec.md sections:** Sections 6.3, 9.5, 17 (Phase 5).
- **Impacted phase(s):** 0, 1, 5, 9, 10.

---

### DEC-004 — Requirement Classifier Dataset & Taxonomy

- **Date proposed:** 2026-10-29
- **Status:** `APPROVED`
- **Decision owner/approval:** Approved in Phase 0 Architecture Review
- **Context/problem:** Requirement classifier must have a clear taxonomy and reproducible evaluation pipeline.
- **Decision:**
  - 5-category taxonomy: `authentication_security`, `data_validation_crud`, `workflow_navigation`, `error_handling_resilience`, `non_functional_performance`.
  - Pipeline: TF-IDF vectorization + Multinomial Logistic Regression (`joblib` serialized artifact).
  - Train/Val/Test split: Stratified 80/10/10 with fixed `random_state=42` and deduplication checks.
  - Baseline: Compared directly against Majority Class classifier.
- **Rationale:** Delivers an honest, reproducible, and verifiable ML component.
- **Impacted Spec.md sections:** Sections 9.4, 16.1, 17 (Phase 4).
- **Impacted phase(s):** 0, 4, 10.

---

### DEC-005 — Target Application & Browser Execution Policy

- **Date proposed:** 2026-10-29
- **Status:** `APPROVED`
- **Decision owner/approval:** Approved in Phase 0 Architecture Review
- **Context/problem:** Browser execution must be safe, authorized, and distinguishable from product testing fixtures.
- **Decision:**
  - Support user-configured authorized target applications with explicit `allowed_hosts` allowlists.
  - A local fixture web app (`automation/fixture_app/`) will be included strictly as CI test infrastructure.
  - The worker only interprets pre-compiled execution plans with allowed actions (`navigate`, `click`, `enter_text`, `select_option`, `wait_for_visible`, `assert_*`).
  - Zero arbitrary code execution.
- **Rationale:** Ensures safe, predictable execution and prevents SSRF or uncontrolled web requests.
- **Impacted Spec.md sections:** Sections 11, 25.2, 27.5.
- **Impacted phase(s):** 0, 7, 9, 10.
