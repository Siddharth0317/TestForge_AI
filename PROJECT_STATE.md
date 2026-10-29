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

- **Current phase:** Phase 2 — Core Backend, Database, and Application Shell
- **Phase status:** `AT GATE (Awaiting Owner Review)`
- **Last verified commit:** `a44e5fd`
- **Last verified checkpoint date:** `2026-10-29`
- **Last completed task:** Complete Phase 2: Implemented Mongoose models (`User`, `Project`, `Requirement`, `TargetEnvironment`), database connection & seed script, JWT authentication and RBAC authorization middleware, REST routes for auth, projects, requirements, environments. Built and wired frontend application shell (`LoginForm`, `ProjectsView`, `RequirementsView`, `AuthContext`, `apiService`) with real endpoints. All 18 backend integration tests and 9 frontend component tests pass with 0 TypeScript errors.
- **Current task:** Present Phase 2 Gate Report to project owner for approval.
- **Next task:** Phase 3 — NLP Requirement Analysis (spaCy linguistic tokenization, entity/action/condition/outcome extraction, evidence spans, and ambiguity detection).
- **Owner approval required for:** Phase 2 Gate sign-off to proceed to Phase 3.

## Verification Record

| Date | Phase | Command / Check | Result | Evidence | Notes |
|---|---|---|---|---|---|
| 2026-10-29 | Phase 0 | `Get-ChildItem -Path ..` & read `AutoHealQA/` | **PASS** | Read-only inspection of legacy repo | `AutoHealQA` verified untouched; lessons documented. |
| 2026-10-29 | Phase 0 | Document creation in `docs/` | **PASS** | `docs/*.md` created | Architecture, contracts, models, security, evaluation plan ready. |
| 2026-10-29 | Phase 1 | `npm run typecheck` & test suites | **PASS** | `cb753ac` commit | Clean monorepo scaffold verified. |
| 2026-10-29 | Phase 2 | `npm run typecheck` | **PASS** | 0 errors in backend & frontend | Full TypeScript compile verification. |
| 2026-10-29 | Phase 2 | `npm run test:backend` | **PASS** | 18 passed across 4 test suites | In-memory MongoDB integration tests for auth, projects, reqs. |
| 2026-10-29 | Phase 2 | `npm run test:frontend` | **PASS** | 9 passed across 3 test suites | App, ProjectsView, RequirementsView states tested. |
| 2026-10-29 | Phase 2 | `pytest` in `ai-service/` | **PASS** | 4 passed | FastAPI `/health`, `/ready`, internal ping auth verified. |
| 2026-10-29 | Phase 2 | `pytest` in `automation/` | **PASS** | 4 passed | Host allowlist & metadata blocking verified. |

## Active Blockers and Risks

*None currently blocking. All Phase 2 criteria are satisfied.*

## Known Failing or Unrun Checks

- **Failing:** None
- **Blocked:** None
- **Not run:** None for Phase 2.
- **Flaky:** None

## Handoff Instructions

1. Review Phase 2 deliverables and verification evidence.
2. Once the project owner signs off on Phase 2, proceed to Phase 3 following the Phase 3 prompt in `Antigravity_Prompting_Plan.md`.
3. Proceed one phase at a time and stop at each phase gate.
