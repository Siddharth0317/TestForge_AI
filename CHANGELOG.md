# TestForge AI — Changelog

All notable, owner-approved product requirement and implementation changes are recorded here. Keep entries concise and link to decision IDs, affected specification sections, phases, and commits where possible.

---

## Change History

### 2026-10-29 — Phase 1 Monorepo & Development Foundation Complete

- **Change ID:** `CHG-002`
- **Type:** `Development Foundation Scaffolding & CI`
- **Requested by:** Project Owner
- **Approval:** `APPROVED`
- **Reason:** Implement Phase 1 deliverables per `Spec.md` Section 17 and `Antigravity_Prompting_Plan.md`.
- **Previous behavior/requirement:** Architecture and planning documents only (Phase 0).
- **New behavior/requirement:**
  - Initialized clean Git repository and monorepo structure with npm workspaces (`frontend`, `backend`).
  - Created `.gitignore` and `.env.example` templates with zero real secrets.
  - Implemented Core Backend API skeleton with Zod configuration validation, Pino structured logging, request ID propagation, helmet/CORS, and `/health` & `/ready` probes.
  - Implemented React 18 + Vite + TypeScript frontend shell with Tailwind CSS and Vitest test setup.
  - Implemented Python FastAPI AI Service skeleton with pydantic-settings, internal API key security header, and `/health` & `/ready` probes.
  - Implemented Python Automation Worker safety module with target host allowlist filtering and SSRF / cloud metadata blocking.
  - Created local CI test fixture application (`automation/fixture_app/index.html`).
  - Created `docker-compose.yml` and Dockerfiles in `infrastructure/docker/`.
  - Created GitHub Actions CI pipeline (`.github/workflows/ci.yml`).
  - Created comprehensive `README.md` setup and test guide.
- **Spec.md sections updated:** Section 17 (Phase 1), Section 27.
- **Decision IDs:** `DEC-001`, `DEC-002`, `DEC-003`, `DEC-005`
- **Affected phase(s):** Phase 1 (completed at gate), ready for Phase 2.
- **Affected APIs/schemas/data:** Health and readiness probe contracts, environment schemas.
- **Verification:**
  - `npm run typecheck`: 0 errors.
  - `npm run test:backend`: 4/4 passing (Jest / Supertest).
  - `npm run test:frontend`: 2/2 passing (Vitest / React Testing Library).
  - `ai-service pytest`: 4/4 passing (FastAPI AsyncClient).
  - `automation pytest`: 4/4 passing (Allowlist & security tests).

---

### 2026-10-29 — Phase 0 Architecture Baseline & Legacy Review Complete

- **Change ID:** `CHG-001`
- **Type:** `Architecture Baseline & Planning Complete`
- **Requested by:** Project Owner
- **Approval:** `APPROVED`
- **Reason:** Completed Phase 0 requirements per `Spec.md` Section 17 and `Antigravity_Prompting_Plan.md`.
- **Previous behavior/requirement:** Uninitialized project state with proposal baselines.
- **New behavior/requirement:**
  - Completed read-only review of legacy project `C:\Projects\AutoHealQA` in `LEGACY_REVIEW.md`. Formalized "Reuse None" decision.
  - Authored authoritative technical specifications: `docs/architecture.md`, `docs/api-contracts.md`, `docs/data-models.md`, `docs/security.md`, and `docs/evaluation-plan.md`.
  - Approved initial architecture decisions DEC-001 through DEC-005 in `DECISIONS.md`.
  - Updated `PHASE_CHECKLIST.md` and `PROJECT_STATE.md`.
- **Spec.md sections updated:** Preserved all original Sections 0–27.
- **Decision IDs:** `DEC-001`, `DEC-002`, `DEC-003`, `DEC-004`, `DEC-005`
- **Affected phase(s):** Phase 0.
- **Affected APIs/schemas/data:** Established standard `/api/v1` and `/internal/v1` API contracts, Mongoose schemas, and Pydantic validation contracts.
- **Security/privacy/reliability impact:** Established RBAC authorization model, strict host allowlists, secret isolation, and threat mitigation models.
- **Verification:** Read-only inspection of `AutoHealQA` verified; documentation files generated and validated for mutual consistency.
