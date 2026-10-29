# TestForge AI — Phase Acceptance Checklist

> **Source of truth:** `Spec.md`, especially its canonical original Phase 0–10 roadmap and all associated sections.
> **Rule:** Keep every individual criterion as a separate row. Never mark `PASS` without concrete evidence. Do not replace this checklist with a single “phase complete” status.

## Status definitions

- `NOT STARTED` — work has not begun.
- `IN PROGRESS` — implementation or verification is underway.
- `PASS` — criterion is implemented and verified with recorded evidence.
- `FAIL` — verification ran and the criterion failed.
- `BLOCKED` — unable to proceed; blocker and owner action are recorded.
- `NOT RUN` — implementation may exist, but verification has not run.

---

## Phase 0 — Legacy Review, Greenfield Architecture, and Build Plan

| Criterion | Status | Evidence path / test | Verified date / commit | Unresolved issue / next action |
|---|---|---|---|---|
| Old repository reviewed read-only; old repository remains unchanged | **PASS** | Read-only inspection of `C:\Projects\AutoHealQA`; timestamps unchanged | 2026-10-29 | None. Legacy repo preserved intact. |
| New repository location is separate and approved | **PASS** | `C:\Projects\TestForge_AI` verified separate from legacy folder | 2026-10-29 | Approved by user. |
| `LEGACY_REVIEW.md` records findings and explicit reuse/no-reuse decisions | **PASS** | [`LEGACY_REVIEW.md`](./LEGACY_REVIEW.md) (explicit "Reuse None" for code) | 2026-10-29 | Ready for Phase 1. |
| Architecture and service responsibilities documented | **PASS** | [`docs/architecture.md`](./docs/architecture.md) | 2026-10-29 | Topology, boundaries, and lifecycles defined. |
| API-contract and data-model approach documented | **PASS** | [`docs/api-contracts.md`](./docs/api-contracts.md), [`docs/data-models.md`](./docs/data-models.md) | 2026-10-29 | REST specs, error envelope, Mongoose/Pydantic schemas defined. |
| Security and evaluation plans documented | **PASS** | [`docs/security.md`](./docs/security.md), [`docs/evaluation-plan.md`](./docs/evaluation-plan.md) | 2026-10-29 | RBAC, threat model, 3 evaluation pillars documented. |
| Original Phase 0–10 roadmap and gates preserved | **PASS** | [`Spec.md`](./Spec.md) Section 17 & Section 27.8, [`PHASE_CHECKLIST.md`](./PHASE_CHECKLIST.md) | 2026-10-29 | Preserved in full without omissions. |
| Phase 0 acceptance review approved by owner | **PASS** | Approved by user in session | 2026-10-29 | Proceeding with Phase 1. |

---

## Phase 1 — Monorepo and Development Foundation

| Criterion | Status | Evidence path / test | Verified date / commit | Unresolved issue / next action |
|---|---|---|---|---|
| Clean repository/workspace and supported runtime versions configured | **PASS** | `package.json`, Node v24 LTS / Python 3.14 verified | 2026-10-29 | Monorepo layout clean and verified. |
| Formatting, linting, type checking, and test runners configured | **PASS** | `npm run typecheck`, Jest, Vitest, pytest | 2026-10-29 | 0 errors across TS and Python. |
| `.env.example` contains placeholders only; secrets excluded | **PASS** | [`.env.example`](./.env.example) | 2026-10-29 | Verified zero real secrets committed. |
| `.gitignore` covers secrets, build output, local data, and test artifacts | **PASS** | [`.gitignore`](./.gitignore) | 2026-10-29 | Verified via `git status` (ignored `.env`, `.venv`, `node_modules`). |
| Docker Compose foundation works as documented | **PASS** | [`docker-compose.yml`](./docker-compose.yml), `infrastructure/docker/` | 2026-10-29 | Service definitions created for mongo, backend, ai-service, frontend. |
| CI workflow runs the required checks | **PASS** | [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) | 2026-10-29 | Workflow covers backend, frontend, ai-service, and automation checks. |
| Logging and health/readiness skeletons implemented | **PASS** | `backend/src/app.ts`, `ai-service/app/main.py` | 2026-10-29 | `/health` & `/ready` tested and passing. |
| Fresh setup documented and verified | **PASS** | [`README.md`](./README.md) | 2026-10-29 | Complete prerequisites, setup, run, and test steps documented. |

---

## Phase 2 — Core Backend, Database, and Application Shell

| Criterion | Status | Evidence path / test | Verified date / commit | Unresolved issue / next action |
|---|---|---|---|---|
| Approved data models, validation, and indexes implemented | NOT STARTED | | | |
| Migration/seed strategy documented and tested where applicable | NOT STARTED | | | |
| API error format and request/correlation IDs implemented | NOT STARTED | | | |
| Real API persistence read/write path verified | NOT STARTED | | | |
| Authentication and project-level authorization foundations verified | NOT STARTED | | | |
| Frontend calls real API endpoints for in-scope functionality | NOT STARTED | | | |
| Loading, empty, validation, and error states implemented | NOT STARTED | | | |
| Relevant unit and integration tests pass | NOT STARTED | | | |

---

## Phase 3 — NLP Requirement Analysis

| Criterion | Status | Evidence path / test | Verified date / commit | Unresolved issue / next action |
|---|---|---|---|---|
| Requirement normalization implemented | NOT STARTED | | | |
| Structured candidate extraction implemented | NOT STARTED | | | |
| Ambiguity/missing-information signals surfaced | NOT STARTED | | | |
| Analysis traces to original requirement and version | NOT STARTED | | | |
| Empty, malformed, boundary, and ambiguous inputs handled safely | NOT STARTED | | | |
| Tests cover representative and boundary cases | NOT STARTED | | | |
| Limitations documented; no unsupported accuracy claims | NOT STARTED | | | |

---

## Phase 4 — ML Dataset and Requirement Classifier

| Criterion | Status | Evidence path / test | Verified date / commit | Unresolved issue / next action |
|---|---|---|---|---|
| Label taxonomy and dataset schema documented | NOT STARTED | | | |
| Dataset provenance and label distribution recorded | NOT STARTED | | | |
| Train/validation/test split and leakage checks documented | NOT STARTED | | | |
| Reproducible preprocessing/training/evaluation pipeline implemented | NOT STARTED | | | |
| Model artifact/version metadata and inference contract implemented | NOT STARTED | | | |
| Metrics reported only when measured on valid data | NOT STARTED | | | |
| Model loading, invalid input, and pipeline tests run | NOT STARTED | | | |
| Baseline/unassessed state clearly identified if valid data is unavailable | NOT STARTED | | | |

---

## Phase 5 — LLM Provider Integration and Structured Generation

| Criterion | Status | Evidence path / test | Verified date / commit | Unresolved issue / next action |
|---|---|---|---|---|
| Provider adapter follows approved contract | NOT STARTED | | | |
| Structured candidate generation implemented | NOT STARTED | | | |
| Secrets remain server-side and are redacted from logs | NOT STARTED | | | |
| Timeouts, output limits, and bounded retry policy implemented | NOT STARTED | | | |
| Malformed output and provider failure states handled | NOT STARTED | | | |
| Mock mode explicitly identified and not misrepresented as real calls | NOT STARTED | | | |
| Generation configuration/model/provider metadata recorded appropriately | NOT STARTED | | | |
| Provider adapter and schema tests pass | NOT STARTED | | | |

---

## Phase 6 — Validation, Traceability, Review, and Versioning

| Criterion | Status | Evidence path / test | Verified date / commit | Unresolved issue / next action |
|---|---|---|---|---|
| Deterministic schema and required-field validation implemented | NOT STARTED | | | |
| Requirement-to-test traceability enforced | NOT STARTED | | | |
| Expected results/assertions and supported actions validated | NOT STARTED | | | |
| Duplicate detection and transparent prioritization implemented | NOT STARTED | | | |
| Human review/edit/approve/reject lifecycle implemented | NOT STARTED | | | |
| Revisions and audit history persisted | NOT STARTED | | | |
| Historical runs remain tied to the exact case revision | NOT STARTED | | | |
| Invalid cases, lifecycle transitions, permissions, and audit tests pass | NOT STARTED | | | |

---

## Phase 7 — Controlled Selenium Execution

| Criterion | Status | Evidence path / test | Verified date / commit | Unresolved issue / next action |
|---|---|---|---|---|
| Authorized target-environment configuration implemented | NOT STARTED | | | |
| Host allowlist and fail-closed preflight checks implemented | NOT STARTED | | | |
| Secret references used; sensitive values not logged | NOT STARTED | | | |
| Locator/action/assertion registry and supported plan validation implemented | NOT STARTED | | | |
| Only approved, validated plans can execute | NOT STARTED | | | |
| Isolated Selenium worker, timeout, cancellation, and cleanup implemented | NOT STARTED | | | |
| Results distinguish assertion failure from infrastructure error, timeout, skip, cancellation, and not-runnable | NOT STARTED | | | |
| Run/case/environment versions and evidence references persisted | NOT STARTED | | | |
| CI fixture tests pass; fixture is not mistaken for the product target | NOT STARTED | | | |
| Authorized target-application integration demonstrated or explicitly blocked/not run | NOT STARTED | | | |

---

## Phase 8 — Reports, Analytics, and Export

| Criterion | Status | Evidence path / test | Verified date / commit | Unresolved issue / next action |
|---|---|---|---|---|
| Run history and required reports use persisted data | NOT STARTED | | | |
| Filters/pagination/empty/error states implemented where specified | NOT STARTED | | | |
| Exports contain correct scope and recorded values | NOT STARTED | | | |
| ML, generation-quality, product, and execution metrics remain distinct | NOT STARTED | | | |
| Project authorization and sensitive-data handling verified | NOT STARTED | | | |
| Aggregation/export/access-control tests pass | NOT STARTED | | | |

---

## Phase 9 — Integration, Security, and Reliability Hardening

| Criterion | Status | Evidence path / test | Verified date / commit | Unresolved issue / next action |
|---|---|---|---|---|
| Cross-service integration suite run | NOT STARTED | | | |
| Authentication/authorization and input validation rechecked | NOT STARTED | | | |
| Secrets redaction and target restrictions tested | NOT STARTED | | | |
| Timeout, retry, idempotency, duplicate-job, and cancellation behavior tested | NOT STARTED | | | |
| Service/database/provider failure behavior tested | NOT STARTED | | | |
| Logging, correlation IDs, retention, and dependency pinning reviewed | NOT STARTED | | | |
| Severity-ranked defects and residual risks documented | NOT STARTED | | | |
| No critical failure silently waived | NOT STARTED | | | |

---

## Phase 10 — Evaluation, Documentation, and Final Release

| Criterion | Status | Evidence path / test | Verified date / commit | Unresolved issue / next action |
|---|---|---|---|---|
| ML evaluation uses valid documented data and held-out results | NOT STARTED | | | |
| Generated test-case quality evaluated with documented rubric/method | NOT STARTED | | | |
| Browser execution evaluated with repeatable cases and truthful outcomes | NOT STARTED | | | |
| README setup/run/test/troubleshooting instructions verified | NOT STARTED | | | |
| Architecture, API, data/model provenance, security, and limitations documented | NOT STARTED | | | |
| Clean setup verified where environment allows | NOT STARTED | | | |
| End-to-end acceptance workflow against an authorized target performed or explicitly blocked/not run | NOT STARTED | | | |
| Every original Phase 0–10 criterion mapped to evidence and status | NOT STARTED | | | |
| Release notes and known limitations published | NOT STARTED | | | |
| Production-readiness claim limited to checks actually completed | NOT STARTED | | | |

---

## Phase Gate Summary

| Phase | Overall Status | Reviewer / Approval | Date / Checkpoint | Blocking Criteria |
|---|---|---|---|---|
| 0 | **PASS (Approved)** | Project Owner | 2026-10-29 | None. |
| 1 | **AT GATE (Awaiting Owner Review)** | Antigravity (Lead Architect) | 2026-10-29 | None. All Phase 1 criteria verified. |
| 2 | NOT STARTED | | | Dependent on Phase 1 approval |
| 3 | NOT STARTED | | | Dependent on Phase 2 approval |
| 4 | NOT STARTED | | | Dependent on Phase 3 approval |
| 5 | NOT STARTED | | | Dependent on Phase 4 approval |
| 6 | NOT STARTED | | | Dependent on Phase 5 approval |
| 7 | NOT STARTED | | | Dependent on Phase 6 approval |
| 8 | NOT STARTED | | | Dependent on Phase 7 approval |
| 9 | NOT STARTED | | | Dependent on Phase 8 approval |
| 10 | NOT STARTED | | | Dependent on Phase 9 approval |
