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

- **Current phase:** Phase 1 — Monorepo and Development Foundation
- **Phase status:** `AT GATE (Awaiting Owner Review)`
- **Last verified checkpoint date:** `2026-10-29`
- **Last completed task:** Complete Phase 1 scaffold: initialized monorepo layout (`frontend/`, `backend/`, `ai-service/`, `automation/`), pinned runtimes, configured Jest/Vitest/pytest test runners, implemented health/readiness endpoints, validated environment schemas, created `.env.example`, `.gitignore`, `docker-compose.yml`, GitHub Actions CI workflow, and `README.md`. All test suites and typechecks pass.
- **Current task:** Present Phase 1 Gate Report to project owner for approval.
- **Next task:** Phase 2 — Core Backend, Database, and Application Shell (Data models, Mongoose schemas/indexes, project & requirement CRUD, auth foundation, and frontend dashboard shell).
- **Owner approval required for:** Phase 1 Gate sign-off to proceed to Phase 2.

## Verification Record

| Date | Phase | Command / Check | Result | Evidence | Notes |
|---|---|---|---|---|---|
| 2026-10-29 | Phase 0 | `Get-ChildItem -Path ..` & read `AutoHealQA/` | **PASS** | Read-only inspection of legacy repo | `AutoHealQA` verified untouched; lessons documented. |
| 2026-10-29 | Phase 0 | Document creation in `docs/` | **PASS** | `docs/*.md` created | Architecture, contracts, models, security, evaluation plan ready. |
| 2026-10-29 | Phase 1 | `npm run typecheck` | **PASS** | 0 errors in backend & frontend | Strict TypeScript checks passing. |
| 2026-10-29 | Phase 1 | `npm run test:backend` | **PASS** | 4 passed in `backend/tests/health.test.ts` | `/health`, `/ready`, `/api/v1`, 404 envelope tested. |
| 2026-10-29 | Phase 1 | `npm run test:frontend` | **PASS** | 2 passed in `frontend/tests/App.test.tsx` | Vitest testing library smoke test passing. |
| 2026-10-29 | Phase 1 | `pytest` in `ai-service/` | **PASS** | 4 passed in `ai-service/tests/test_health.py` | FastAPI `/health`, `/ready`, internal ping auth tested. |
| 2026-10-29 | Phase 1 | `pytest` in `automation/` | **PASS** | 4 passed in `automation/tests/test_safety.py` | Host allowlist, SSRF, and metadata blocking tested. |

## Active Blockers and Risks

*None currently blocking. All Phase 1 criteria are satisfied.*

## Known Failing or Unrun Checks

- **Failing:** None
- **Blocked:** None
- **Not run:** None for Phase 1.
- **Flaky:** None

## Handoff Instructions

1. Review Phase 1 verification results and files.
2. Once the project owner signs off on Phase 1, begin Phase 2 following the Phase 2 prompt in `Antigravity_Prompting_Plan.md`.
3. Proceed one phase at a time and stop at each phase gate.
