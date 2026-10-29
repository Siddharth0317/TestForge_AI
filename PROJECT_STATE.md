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

- **Current phase:** Phase 4 — ML Dataset and Requirement Classifier
- **Phase status:** `AT GATE (Awaiting Owner Review)`
- **Last verified checkpoint date:** `2026-10-29`
- **Last completed task:** Complete Phase 4: Established 6-class requirement label taxonomy (`authentication`, `validation`, `business_logic`, `security`, `error_handling`, `data_integrity`) with curated, balanced dataset of 108 verified samples (`requirements_dataset.json` & `dataset_manifest.json`). Implemented reproducible ML training workflow (`train.py`) with stratified 70/15/15 split, deduplication leakage checks, TF-IDF + balanced Logistic Regression pipeline, and compared against DummyClassifier baseline. Measured test accuracy of 0.7059 and macro F1 of 0.7048 on held-out test split (vs. baseline 0.1765). Saved model artifacts (`model.joblib`, `model_metadata.json`, `evaluation_report.md`). Implemented inference engine (`classifier.py`) with uncertainty detection and exposed authenticated endpoint `POST /internal/v1/classifier/predict`. Wired backend orchestrator to classify requirements and updated frontend `RequirementsView` with ML category and confidence badges. All 78 tests passing monorepo-wide.
- **Current task:** Present Phase 4 Gate Report and Walkthrough to project owner for approval.
- **Next task:** Phase 5 — LLM Provider Integration and Structured Generation (provider adapter interface, Google Gemini / Mock provider, Pydantic test-case contracts, prompt templates, bounded retries).
- **Owner approval required for:** Phase 4 Gate sign-off to proceed to Phase 5.

## Verification Record

| Date | Phase | Command / Check | Result | Evidence | Notes |
|---|---|---|---|---|---|
| 2026-10-29 | Phase 0 | `Get-ChildItem -Path ..` & read `AutoHealQA/` | **PASS** | Read-only inspection of legacy repo | `AutoHealQA` verified untouched; lessons documented. |
| 2026-10-29 | Phase 0 | Document creation in `docs/` | **PASS** | `docs/*.md` created | Architecture, contracts, models, security, evaluation plan ready. |
| 2026-10-29 | Phase 1 | `npm run typecheck` & test suites | **PASS** | `cb753ac` commit | Clean monorepo scaffold verified. |
| 2026-10-29 | Phase 2 | Full verification suite | **PASS** | 35 tests passing | Core backend, Mongoose persistence, application shell. |
| 2026-10-29 | Phase 3 | Full verification suite | **PASS** | 64 tests passing | spaCy NLP extraction, ambiguity detection, backend & UI. |
| 2026-10-29 | Phase 4 | `pytest` in `ai-service/` | **PASS** | 44 passed | Classifier, ML inference, API endpoints, normalizer, spaCy. |
| 2026-10-29 | Phase 4 | `npm test --prefix backend` | **PASS** | 20 passed | Mongoose models, auth, requirements & classifier integration. |
| 2026-10-29 | Phase 4 | `npm test --prefix frontend` | **PASS** | 10 passed | RequirementsView with ML badges, ambiguity alerts, Projects. |
| 2026-10-29 | Phase 4 | `pytest` in `automation/` | **PASS** | 4 passed | Host allowlist & SSRF firewall tests. |
| 2026-10-29 | Phase 4 | TypeScript compile checks | **PASS** | 0 errors across backend & frontend | Type checks clean (`tsc --noEmit`, `vite build`). |
| 2026-10-29 | Phase 4 | ML Model Evaluation | **PASS** | `evaluation_report.md` | Test Acc: 0.7059, Macro F1: 0.7048 vs Baseline: 0.1765. |

## Active Blockers and Risks

*None currently blocking. All Phase 4 criteria are satisfied.*

## Known Failing or Unrun Checks

- **Failing:** None
- **Blocked:** None
- **Not run:** None for Phase 4.
- **Flaky:** None

## Handoff Instructions

1. Review Phase 4 deliverables, evaluation report, and walkthrough artifact.
2. Once the project owner signs off on Phase 4, proceed to Phase 5 following the Phase 5 prompt in `Antigravity_Prompting_Plan.md`.
3. Proceed one phase at a time and stop at each phase gate.
