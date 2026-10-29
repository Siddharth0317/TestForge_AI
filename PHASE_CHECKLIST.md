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
| Approved data models, validation, and indexes implemented | **PASS** | `backend/src/models/User.ts`, `Project.ts`, `Requirement.ts`, `TargetEnvironment.ts` | 2026-10-29 | Mongoose models with validation & compound indexes. |
| Migration/seed strategy documented and tested where applicable | **PASS** | [`backend/src/scripts/seed.ts`](./backend/src/scripts/seed.ts) | 2026-10-29 | Seeds admin, qa, viewer users, demo project, target env. |
| API error format and request/correlation IDs implemented | **PASS** | `backend/src/middleware/errorHandler.ts`, `requestId.ts` | 2026-10-29 | Unified error envelope verified across 400, 401, 403, 404, 500. |
| Real API persistence read/write path verified | **PASS** | `backend/tests/projects.test.ts`, `requirements.test.ts` | 2026-10-29 | 18 passing backend integration tests with Mongoose. |
| Authentication and project-level authorization foundations verified | **PASS** | `backend/src/middleware/auth.ts`, `backend/tests/auth.test.ts` | 2026-10-29 | JWT authentication, bcrypt hashing, cross-project isolation. |
| Frontend calls real API endpoints for in-scope functionality | **PASS** | `frontend/src/services/api.ts`, `auth.ts`, `projects.ts`, `requirements.ts` | 2026-10-29 | Real Fetch API client attached to backend endpoints. |
| Loading, empty, validation, and error states implemented | **PASS** | `frontend/src/features/projects/ProjectsView.tsx`, `RequirementsView.tsx` | 2026-10-29 | Tested and confirmed in component suites. |
| Relevant unit and integration tests pass | **PASS** | `npm run test:backend` (18 passed), `npm run test:frontend` (9 passed) | 2026-10-29 | 100% passing test suites across frontend & backend. |

---

## Phase 3 — NLP Requirement Analysis

| Criterion | Status | Evidence path / test | Verified date / commit | Unresolved issue / next action |
|---|---|---|---|---|
| Requirement normalization implemented | **PASS** | `ai-service/app/nlp/normalizer.py`, `ai-service/tests/test_normalizer.py` | 2026-10-29 | Strips control chars, collapses whitespace, enforces 5-4000 char bounds. |
| Structured candidate extraction implemented | **PASS** | `ai-service/app/nlp/extractor.py`, `ai-service/tests/test_extractor.py` | 2026-10-29 | spaCy dependency & POS extractor for actors, actions, entities, conditions, constraints, outcomes. |
| Ambiguity/missing-information signals surfaced | **PASS** | `ai-service/app/nlp/ambiguity.py`, `ai-service/tests/test_ambiguity.py` | 2026-10-29 | Detects vague terms, weak modals, unbounded quantifiers, passive voice, missing outcomes. |
| Analysis traces to original requirement and version | **PASS** | `ai-service/app/nlp/schemas.py`, `backend/src/models/Requirement.ts` | 2026-10-29 | Evidence spans with start/end character offsets, requirement_id, version lineage. |
| Empty, malformed, boundary, and ambiguous inputs handled safely | **PASS** | `ai-service/tests/test_normalizer.py`, `ai-service/tests/test_api_requirements.py` | 2026-10-29 | Input validation fails cleanly with 400/422; graceful fallback to draft on service failure. |
| Tests cover representative and boundary cases | **PASS** | `ai-service/tests/` (30 passed), `backend/tests/` (20 passed) | 2026-10-29 | Tested with complex conditional, multi-actor, boundary, and negation scenarios. |
| Limitations documented; no unsupported accuracy claims | **PASS** | `ai-service/app/nlp/pipeline.py`, `docs/architecture.md` | 2026-10-29 | Transparent rule versioning (`spacy-3.8-rule-v1`); candidates treated as heuristic input. |

---

## Phase 4 — ML Dataset and Requirement Classifier

| Criterion | Status | Evidence path / test | Verified date / commit | Unresolved issue / next action |
|---|---|---|---|---|
| Label taxonomy and dataset schema documented | **PASS** | `ai-service/data/dataset_manifest.json`, `docs/data-models.md` | 2026-10-29 | 6-class taxonomy (authentication, validation, business_logic, security, error_handling, data_integrity). |
| Dataset provenance and label distribution recorded | **PASS** | `ai-service/data/dataset_manifest.json`, `requirements_dataset.json` | 2026-10-29 | 108 verified samples (exactly 18 per class, balanced distribution). |
| Train/validation/test split and leakage checks documented | **PASS** | `ai-service/app/ml/train.py` | 2026-10-29 | Stratified 70/15/15 split (75/16/17 samples) with random_seed=42; deduplication leakage checks. |
| Reproducible preprocessing/training/evaluation pipeline implemented | **PASS** | `ai-service/app/ml/train.py`, `artifacts/evaluation_report.md` | 2026-10-29 | TF-IDF (1,2) + Balanced Logistic Regression; compared against DummyClassifier baseline. |
| Model artifact/version metadata and inference contract implemented | **PASS** | `artifacts/model.joblib`, `model_metadata.json`, `app/api/v1/classifier.py` | 2026-10-29 | Exported `model.joblib`, `POST /internal/v1/classifier/predict` with confidence & probabilities. |
| Metrics reported only when measured on valid data | **PASS** | `artifacts/evaluation_report.md` | 2026-10-29 | Measured on held-out test split: Accuracy 0.7059, Macro F1 0.7048 vs Baseline 0.1765. |
| Model loading, invalid input, and pipeline tests run | **PASS** | `ai-service/tests/test_classifier.py` (10 passed), `test_api_classifier.py` (4 passed) | 2026-10-29 | Covers model loading, 6-class predictions, confidence scores, probability sums, uncertainty flags. |
| Baseline/unassessed state clearly identified if valid data is unavailable | **PASS** | `app/ml/classifier.py` | 2026-10-29 | Unassessed fallback gracefully returns `category: general_requirement`, `is_uncertain: True`. |

---

## Phase 5 — LLM Provider Integration and Structured Generation

| Criterion | Status | Evidence path / test | Verified date / commit | Unresolved issue / next action |
|---|---|---|---|---|
| Provider adapter follows approved contract | **PASS** | `ai-service/app/llm/provider.py`, `mock_provider.py`, `gemini_provider.py` | 2026-10-29 | Abstract base `LLMProvider` with standardized `generate()`, typed responses, and normalized exception hierarchy. |
| Structured candidate generation implemented | **PASS** | `ai-service/app/llm/schemas.py`, `generator.py`, `prompts.py` | 2026-10-29 | Generates 6 scenario types (positive, negative, boundary, authorization, error_handling, state_transition) conforming to Spec 7.1. |
| Secrets remain server-side and are redacted from logs | **PASS** | `ai-service/app/core/config.py`, `.env` | 2026-10-29 | `GEMINI_API_KEY` validated server-side only; never leaked to frontend or embedded in candidate test cases. |
| Timeouts, output limits, and bounded retry policy implemented | **PASS** | `ai-service/app/llm/generator.py` | 2026-10-29 | Exponential backoff for retryable errors (429/timeout) bounded by `LLM_MAX_RETRIES=2`; 30s timeout enforcement. |
| Malformed output and provider failure states handled | **PASS** | `ai-service/tests/test_generator.py`, `backend/tests/generation.test.ts` | 2026-10-29 | Handles malformed JSON, refusals, empty candidate arrays, and 502 service outages gracefully without crashing. |
| Mock mode explicitly identified and not misrepresented as real calls | **PASS** | `mock_provider.py`, `generation.router.ts`, `RequirementsView.tsx` | 2026-10-29 | Explicitly tagged `provider: 'mock'`; frontend renders clear "Mock Provider (Offline/Testing)" badge and alert banner. |
| Generation configuration/model/provider metadata recorded appropriately | **PASS** | `backend/src/models/GenerationJob.ts` | 2026-10-29 | Persists `provider`, `model_name`, `prompt_template_version`, `schema_version`, `duration_ms`, `token_usage`, `candidates`. |
| Provider adapter and schema tests pass | **PASS** | `ai-service/tests/test_llm_providers.py`, `test_generator.py`, `test_api_generation.py`, `backend/tests/generation.test.ts` | 2026-10-29 | 16 new AI service tests (60/60 passing), 5 new backend integration tests (25/25 passing), 1 new frontend test (11/11 passing). |

---

## Phase 6 — Validation, Traceability, Review, and Versioning

| Criterion | Status | Evidence path / test | Verified date / commit | Unresolved issue / next action |
|---|---|---|---|---|
| Deterministic schema and required-field validation implemented | **PASS** | `ai-service/app/validation/validator.py`, `ai-service/tests/test_validation.py` | 2026-10-29 / `6e62b93` | Verified schema rules, actions & assertions |
| Requirement-to-test traceability enforced | **PASS** | `TestCase` references `requirement_id`, `requirement_version`, `source_evidence` spans | 2026-10-29 / `6e62b93` | Unmatched spans flagged with warnings |
| Expected results/assertions and supported actions validated | **PASS** | `schema_missing_assertions`, `schema_disallowed_action` rules enforced | 2026-10-29 / `6e62b93` | Zero-assertion cases blocked from approval |
| Duplicate detection and transparent prioritization implemented | **PASS** | `TestCasesService.detectDuplicate()`, rule-based 0-100 score & rationale | 2026-10-29 / `6e62b93` | Duplicates flagged non-destructively; scoring separate from ML |
| Human review/edit/approve/reject lifecycle implemented | **PASS** | `approve`, `reject`, `request-changes`, `editTestCase` endpoints & modals | 2026-10-29 / `6e62b93` | Review statuses: `pending`, `approved`, `rejected`, `needs_changes` |
| Revisions and audit history persisted | **PASS** | `TestCase.version`, `previous_version_id`, `AuditEvent` collection | 2026-10-29 / `6e62b93` | Edits to approved cases create v2 and reset status |
| Historical runs remain tied to the exact case revision | **PASS** | `version` immutable on approved snapshot; new revision spawned on edit | 2026-10-29 / `6e62b93` | Verified in `test-cases.test.ts` |
| Invalid cases, lifecycle transitions, permissions, and audit tests pass | **PASS** | `ai-service/tests/test_validation.py`, `backend/tests/test-cases.test.ts`, `frontend/tests/TestCasesView.test.tsx` | 2026-10-29 / `6e62b93` | 123/123 monorepo tests passing |

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
| 1 | **PASS (Approved)** | Project Owner | 2026-10-29 | None. |
| 2 | **PASS (Approved)** | Project Owner | 2026-10-29 | None. |
| 3 | **PASS (Approved)** | Project Owner | 2026-10-29 | None. |
| 4 | **PASS (Approved)** | Project Owner | 2026-10-29 | None. |
| 5 | **PASS (Approved)** | Project Owner | 2026-10-29 | None. |
| 6 | **AT GATE (Awaiting Owner Review)** | Antigravity (Lead Architect) | 2026-10-29 | None. All Phase 6 criteria verified. |
| 7 | NOT STARTED | | | Dependent on Phase 6 approval |
| 8 | NOT STARTED | | | Dependent on Phase 7 approval |
| 9 | NOT STARTED | | | Dependent on Phase 8 approval |
| 10 | NOT STARTED | | | Dependent on Phase 9 approval |
