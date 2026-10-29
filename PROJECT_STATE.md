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

- **Current phase:** Phase 6 — Validation, Traceability, Review, and Versioning
- **Phase status:** `AT GATE (Awaiting Owner Review)`
- **Last verified checkpoint date:** `2026-10-29`
- **Last completed task:** Complete Phase 6: Built deterministic validation engine (`ai-service/app/validation/validator.py`) enforcing schema validity, step action allowlist, assertion completeness, boundary constraints, and unstated assumption flags. Built explainable rule-based prioritization (0-100 score + detailed breakdown). Exposed authenticated internal validation endpoint `POST /internal/v1/test-cases/validate`. Created Mongoose persistence models `TestCase` and `AuditEvent` with tenant isolation and compound indexes. Implemented duplicate detection flagging identical titles or action sequences without destructive removal. Built review workflow endpoints (`approve`, `reject`, `request-changes`, `editTestCase`) with concurrency locks and version bumping (v1 -> v2) on approved case edits. Created dedicated Test Case Explorer & Review Studio UI (`TestCasesView.tsx`) with status filters, duplicate callouts, edit modals, and audit event history. All 123 tests passing across the monorepo (100% pass rate).
- **Current task:** Present Phase 6 Gate Report and Walkthrough to project owner for approval.
- **Next task:** Phase 7 — Controlled Selenium Execution (environment configuration, allowed-host enforcement, locator registry, isolated worker, safe browser cleanup).
- **Owner approval required for:** Phase 6 Gate sign-off to proceed to Phase 7.

## Verification Record

| Date | Phase | Command / Check | Result | Evidence | Notes |
|---|---|---|---|---|---|
| 2026-10-29 | Phase 0 | `Get-ChildItem -Path ..` & read `AutoHealQA/` | **PASS** | Read-only inspection of legacy repo | `AutoHealQA` verified untouched; lessons documented. |
| 2026-10-29 | Phase 0 | Document creation in `docs/` | **PASS** | `docs/*.md` created | Architecture, contracts, models, security, evaluation plan ready. |
| 2026-10-29 | Phase 1 | `npm run typecheck` & test suites | **PASS** | `cb753ac` commit | Clean monorepo scaffold verified. |
| 2026-10-29 | Phase 2 | Full verification suite | **PASS** | 35 tests passing | Core backend, Mongoose persistence, application shell. |
| 2026-10-29 | Phase 3 | Full verification suite | **PASS** | 64 tests passing | spaCy NLP extraction, ambiguity detection, backend & UI. |
| 2026-10-29 | Phase 4 | Full verification suite | **PASS** | 78 tests passing | ML dataset, TF-IDF + Logistic Regression, confidence scoring. |
| 2026-10-29 | Phase 5 | Full verification suite | **PASS** | 100 tests passing | LLM providers, candidate generation, backend jobs, and candidate cards. |
| 2026-10-29 | Phase 6 | `pytest` in `ai-service/` | **PASS** | 70 passed | Validation engine, boundary limits, schema checks, explainable priority. |
| 2026-10-29 | Phase 6 | `npm test --prefix backend` | **PASS** | 32 passed | TestCase persistence, duplicate detection, review lifecycle, version bump, audit trail. |
| 2026-10-29 | Phase 6 | `npm test --prefix frontend` | **PASS** | 17 passed | TestCasesView, approval flow, rejection modal, duplicate badges, error gating. |
| 2026-10-29 | Phase 6 | `pytest` in `automation/` | **PASS** | 4 passed | Host allowlist & SSRF firewall tests. |
| 2026-10-29 | Phase 6 | TypeScript compile checks | **PASS** | 0 errors across backend & frontend | Type checks clean (`tsc --noEmit`, `vite build`). |

## Active Blockers and Risks

*None currently blocking. All Phase 6 criteria are satisfied.*

## Known Failing or Unrun Checks

- **Failing:** None
- **Blocked:** None
- **Not run:** None for Phase 6.
- **Flaky:** None

## Handoff Instructions

1. Review Phase 6 deliverables, validation engine, review workflows, versioning, and walkthrough artifact.
2. Once the project owner signs off on Phase 6, proceed to Phase 7 following the Phase 7 prompt in `Antigravity_Prompting_Plan.md`.
3. Proceed one phase at a time and stop at each phase gate.
