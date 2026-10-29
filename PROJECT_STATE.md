# TestForge AI — Project State

> **Purpose:** Compact handoff note for Antigravity and the project owner. Update this file after each approved phase, meaningful checkpoint, or context reset.
> **Rule:** Record only verified facts. Do not mark work complete based on code appearance alone.

## Project Identity

- **Project:** TestForge AI
- **Full title:** TestForge AI: An Intelligent NLP- and LLM-Powered Automated Test Case Generation and Execution Platform
- **Tagline:** From Requirements to Verified Tests.
- **Authoritative specification:** `Spec.md` (v1.1 Greenfield baseline)
- **Prompting workflow:** `Antigravity_Prompting_Plan.md`
- **Current branch:** `main`
- **New repository location:** `C:\Projects\TestForge_AI`
- **Legacy repository location:** `C:\Projects\AutoHealQA` (Verified read-only; inspected; reuse none)

## Approved Architecture

- **Frontend:** React + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Core API:** Node.js + Express + TypeScript
- **Persistence:** MongoDB + Mongoose (Versioned models, indexes, optimistic concurrency)
- **AI Service:** Python + FastAPI + spaCy + scikit-learn
- **LLM Integration:** Provider-agnostic adapter interface (Google Gemini default / OpenAI / Mock), credentials server-side only
- **Browser Automation:** Isolated Python Selenium worker using validated structured execution plans
- **Local Orchestration:** Docker Compose
- **Important Constraint:** Support authorized, user-configured target applications. A local fixture app is CI/testing infrastructure only.

## Current Checkpoint

- **Current phase:** Phase 5 — LLM Provider Integration and Structured Generation
- **Phase status:** `AT GATE (Awaiting Owner Review)`
- **Last verified checkpoint date:** `2026-10-29`
- **Last completed task:** Complete Phase 5: Implemented provider-agnostic LLM interface (`LLMProvider`) with normalized exception hierarchy and standard token accounting. Implemented Google Gemini provider (`GeminiLLMProvider`) utilizing the official `google-genai` SDK and deterministic offline test provider (`MockLLMProvider`). Defined strict Pydantic schemas for candidate test cases conforming to Spec Section 7.1 across 6 scenario archetypes (`positive`, `negative`, `boundary`, `authorization`, `error_handling`, `state_transition`). Authored versioned prompt templates (`PROMPT_TEMPLATE_V1`) incorporating requirement context and deterministic NLP extractions. Built generation orchestrator (`TestCaseGenerator`) enforcing timeouts, bounded retries (exponential backoff for 429/timeout), and JSON sanitization. Exposed internal endpoint `POST /internal/v1/test-cases/generate` with internal key auth. Created Mongoose `GenerationJob` model with compound indexes. Implemented backend REST endpoints in `generation.router.ts` (`POST /generate`, `GET /generation-jobs`). Enhanced frontend `RequirementsView` with interactive "Generate Cases" action and structured Candidate Test Case display showing scenario badges, step sequences, expected results, and unsupported assumption alerts. All 100 tests passing across the monorepo (100% pass rate).
- **Current task:** Present Phase 5 Gate Report and Walkthrough to project owner for approval.
- **Next task:** Phase 6 — Validation, Traceability, Review, and Versioning (deterministic schema checks, test case reviews, approve/reject workflow, revision history).
- **Owner approval required for:** Phase 5 Gate sign-off to proceed to Phase 6.

## Verification Record

| Date | Phase | Command / Check | Result | Evidence | Notes |
|---|---|---|---|---|---|
| 2026-10-29 | Phase 0 | `Get-ChildItem -Path ..` & read `AutoHealQA/` | **PASS** | Read-only inspection of legacy repo | `AutoHealQA` verified untouched; lessons documented. |
| 2026-10-29 | Phase 0 | Document creation in `docs/` | **PASS** | `docs/*.md` created | Architecture, contracts, models, security, evaluation plan ready. |
| 2026-10-29 | Phase 1 | `npm run typecheck` & test suites | **PASS** | `cb753ac` commit | Clean monorepo scaffold verified. |
| 2026-10-29 | Phase 2 | Full verification suite | **PASS** | 35 tests passing | Core backend, Mongoose persistence, application shell. |
| 2026-10-29 | Phase 3 | Full verification suite | **PASS** | 64 tests passing | spaCy NLP extraction, ambiguity detection, backend & UI. |
| 2026-10-29 | Phase 4 | Full verification suite | **PASS** | 78 tests passing | ML dataset, TF-IDF + Logistic Regression, confidence scoring. |
| 2026-10-29 | Phase 5 | `pytest` in `ai-service/` | **PASS** | 60 passed | LLM providers, mock simulation, generator retries, internal API. |
| 2026-10-29 | Phase 5 | `npm test --prefix backend` | **PASS** | 25 passed | GenerationJob persistence, auth, role enforcement, error handling. |
| 2026-10-29 | Phase 5 | `npm test --prefix frontend` | **PASS** | 11 passed | RequirementsView with candidate test case cards & assumptions. |
| 2026-10-29 | Phase 5 | `pytest` in `automation/` | **PASS** | 4 passed | Host allowlist & SSRF firewall tests. |
| 2026-10-29 | Phase 5 | TypeScript compile checks | **PASS** | 0 errors across backend & frontend | Type checks clean (`tsc --noEmit`, `vite build`). |
| 2026-10-29 | Phase 5 | Live REST API invocation | **PASS** | PowerShell `Invoke-RestMethod` | Successfully generated 3 candidate cases via `POST /internal/v1/test-cases/generate`. |

## Active Blockers and Risks

*None currently blocking. All Phase 5 criteria are satisfied.*

## Known Failing or Unrun Checks

- **Failing:** None
- **Blocked:** None
- **Not run:** None for Phase 4.
- **Flaky:** None

## Handoff Instructions

1. Review Phase 4 deliverables, evaluation report, and walkthrough artifact.
2. Once the project owner signs off on Phase 4, proceed to Phase 5 following the Phase 5 prompt in `Antigravity_Prompting_Plan.md`.
3. Proceed one phase at a time and stop at each phase gate.
