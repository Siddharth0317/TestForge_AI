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

- **Current phase:** Phase 3 — NLP Requirement Analysis
- **Phase status:** `AT GATE (Awaiting Owner Review)`
- **Last verified checkpoint date:** `2026-10-29`
- **Last completed task:** Complete Phase 3: Implemented deterministic requirement analysis pipeline in `ai-service` using spaCy (`en_core_web_sm`), normalizer, candidate linguistic extractor (actors, actions, entities, conditions, constraints, outcomes, explicit negations, evidence spans), ambiguity detector (vague terms, weak modals, unbounded quantifiers, passive voice, missing outcomes), authenticated internal endpoint `POST /internal/v1/requirements/analyze`. Wired backend to AI service with graceful fallback, updated Mongoose `Requirement` schema with `nlp_analysis`, added `POST /api/v1/requirements/:id/analyze`, and updated frontend `RequirementsView` to render extracted linguistic elements and ambiguity alerts. All 64 tests passing repository-wide.
- **Current task:** Present Phase 3 Gate Report and Walkthrough to project owner for approval.
- **Next task:** Phase 4 — ML Dataset and Requirement Classifier (scikit-learn requirement category classifier, dataset schema, reproducible training script, metrics).
- **Owner approval required for:** Phase 3 Gate sign-off to proceed to Phase 4.

## Verification Record

| Date | Phase | Command / Check | Result | Evidence | Notes |
|---|---|---|---|---|---|
| 2026-10-29 | Phase 0 | `Get-ChildItem -Path ..` & read `AutoHealQA/` | **PASS** | Read-only inspection of legacy repo | `AutoHealQA` verified untouched; lessons documented. |
| 2026-10-29 | Phase 0 | Document creation in `docs/` | **PASS** | `docs/*.md` created | Architecture, contracts, models, security, evaluation plan ready. |
| 2026-10-29 | Phase 1 | `npm run typecheck` & test suites | **PASS** | `cb753ac` commit | Clean monorepo scaffold verified. |
| 2026-10-29 | Phase 2 | Full verification suite | **PASS** | 35 tests passing | Core backend, Mongoose persistence, application shell. |
| 2026-10-29 | Phase 3 | `pytest` in `ai-service/` | **PASS** | 30 passed | spaCy extraction, ambiguity detection, API endpoints. |
| 2026-10-29 | Phase 3 | `npm test --prefix backend` | **PASS** | 20 passed | Mongoose models & requirement analyze integration. |
| 2026-10-29 | Phase 3 | `npm test --prefix frontend` | **PASS** | 10 passed | RequirementsView with NLP extraction & ambiguity states. |
| 2026-10-29 | Phase 3 | `pytest` in `automation/` | **PASS** | 4 passed | Host allowlist & SSRF firewall tests. |
| 2026-10-29 | Phase 3 | TypeScript compile checks | **PASS** | 0 errors across backend & frontend | Type checks clean. |

## Active Blockers and Risks

*None currently blocking. All Phase 3 criteria are satisfied.*

## Known Failing or Unrun Checks

- **Failing:** None
- **Blocked:** None
- **Not run:** None for Phase 3.
- **Flaky:** None

## Handoff Instructions

1. Review Phase 3 deliverables, verification evidence, and walkthrough artifact.
2. Once the project owner signs off on Phase 3, proceed to Phase 4 following the Phase 4 prompt in `Antigravity_Prompting_Plan.md`.
3. Proceed one phase at a time and stop at each phase gate.
