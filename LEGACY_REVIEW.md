# TestForge AI — Legacy Repository Review

> **Purpose:** Capture useful requirements, assets, known issues, and lessons from the legacy repository while keeping it completely unchanged.
> **Status:** COMPLETED — Review concluded with explicit "Reuse None" for implementation code.

---

## 1. Review Metadata

- **Review status:** `COMPLETED`
- **Review date:** `2026-10-29`
- **Reviewer:** Antigravity (Lead Software Architect)
- **Legacy repository path:** `C:\Projects\AutoHealQA`
- **New repository path:** `C:\Projects\TestForge_AI`
- **Legacy Git branch/commit inspected:** Initial repository tree / v1.0 tag
- **Working tree status observed:** Intact reference repository; verified read-only

---

## 2. Review Boundaries

- Inspected `C:\Projects\AutoHealQA` read-only.
- Zero edits, deletions, renames, or commits were made to the legacy repository.
- No legacy code or folder structure was copied wholesale.
- Zero credentials, tokens, or environment files from the legacy repository were copied into `TestForge_AI`.
- Evaluated architecture and code for safety, maintainability, and alignment with `Spec.md`.

---

## 3. Existing Implementation Inventory (AutoHealQA)

| Area | What existed in AutoHealQA | Evidence path | Observed status | Known problems / Architectural gaps | Recommendation |
|---|---|---|---|---|---|
| **Frontend** | Next.js 14.2 App Router with Tailwind CSS | `AutoHealQA/frontend` | `PARTIAL` | Relied on Next.js server components coupled with direct API routes; frontend lacked formal state machine and test-case versioning. | **DO NOT REUSE** (Build clean React + Vite + TypeScript as specified). |
| **Core API** | FastAPI monolith handling web requests & DB | `AutoHealQA/backend` | `PARTIAL` | Combined core application workflows, database persistence, and AI orchestration into one process without clear service boundaries. | **DO NOT REUSE** (Build Node.js + Express + TypeScript core API). |
| **Database** | Supabase (PostgreSQL client) | `AutoHealQA/backend` | `PARTIAL` | Hard dependency on remote Supabase service; lacked project-level multi-tenancy and versioned test-case revisions. | **DO NOT REUSE** (Implement MongoDB + Mongoose with versioning & audit logs). |
| **NLP / ML** | None (used direct Groq LLM calls) | `AutoHealQA/agents` | `BROKEN / ABSENT` | Zero deterministic NLP extraction; zero trained ML requirement classifier; no baseline evaluation or offline metrics. | **DO NOT REUSE** (Build dedicated spaCy + scikit-learn pipeline in `ai-service`). |
| **Execution** | Playwright with dynamic LLM self-healing | `AutoHealQA/executor` | `BROKEN / UNSAFE` | Allowed LLMs to inspect DOM and synthesize new selectors/code on the fly during execution; high risk of non-deterministic behavior and arbitrary execution; targeted public sites directly (`saucedemo.com`, `herokuapp.com`). | **DO NOT REUSE** (Build isolated Selenium worker accepting only validated structured plans and allowed action vocabulary). |
| **Testing / CI** | Minimal pytest setup | `AutoHealQA/tests` | `PARTIAL` | Lacked contract tests, schema validators, or mock provider integration tests. | **DO NOT REUSE** (Build comprehensive Vitest, Supertest, pytest suites). |
| **User Stories** | Taxonomy of sample user stories | `AutoHealQA/USER_STORIES.md` | `VERIFIED` | Good conceptual coverage of standard QA requirements (Auth, E-Commerce, Form validation, Dynamic UI). | **REWORK IDEA** (Adapt requirement scenarios for evaluation datasets and CI fixtures). |

---

## 4. Known Bugs, Architectural Defects, and Lessons Learned

| ID | Issue / Defect in Legacy Project | Evidence / Reproduction | Impact | Prevention in TestForge AI |
|---|---|---|---|---|
| **LEG-001** | **Unsafe Dynamic Self-Healing** | `AutoHealQA/executor` LLM locator synthesis | LLM dynamically generated locator strings during live runs, leading to non-reproducible test results and potential injection risks. | **Strict Locator Registry:** All target locators must be predefined in the project environment configuration. The generator only references symbolic keys (`target_ref`). |
| **LEG-002** | **Target Hardcoding on Public Websites** | `AutoHealQA/USER_STORIES.md` (`saucedemo.com`, `herokuapp.com`) | Test suite broke if public third-party websites changed or experienced downtime; testing unauthorized public sites violated security policies. | **User-Configured Target Applications & Local CI Fixtures:** Automated tests in CI use an isolated local fixture application; production execution requires explicit project environment authorization. |
| **LEG-003** | **No Deterministic NLP or ML Classifier** | Absence of NLP/ML libraries in `AutoHealQA/requirements.txt` | Requirements were passed directly to an LLM without normalization, ambiguity detection, or measurable ML classification. | **Dedicated AI Service:** spaCy pipeline for linguistic entity/condition extraction and scikit-learn TF-IDF + Logistic Regression model with held-out evaluation. |
| **LEG-004** | **Unvalidated LLM Output** | Direct execution of Gherkin steps generated by LLM | If the LLM hallucinated unexecutable steps or invalid parameters, runtime crashes occurred without clear error attribution. | **Dual Schema Quality Gate:** Server-side Pydantic and Zod schema validation must verify all candidate test cases before they can be stored or reviewed. |
| **LEG-005** | **Conflation of Assertion and Infrastructure Errors** | Raw Playwright test failures | Network timeouts, browser crashes, and missing locators were reported as test assertion failures. | **Categorized Outcome Taxonomy:** Strict separation of `passed`, `failed`, `error`, `blocked`, and `not_executable`. |

---

## 5. Candidate Reuse Register

| ID | Asset or Logic Component | Origin / Path | License / Provenance | Verification Status | Security / Safety Review | Decision | Rationale |
|---|---|---|---|---|---|---|---|
| **REUSE-001** | All Python & JavaScript code | `AutoHealQA/*` | Proprietary / Internal | N/A | Fails security requirements (dynamic LLM execution, lack of authorization) | **REJECTED** | Legacy code violates `Spec.md` architectural, security, and technology requirements. |
| **REUSE-002** | Requirement Scenarios (User Stories) | `AutoHealQA/USER_STORIES.md` | Internal documentation | Verified text | Safe (plain-text scenarios) | **REWORK IDEA ONLY** | Natural language requirements will be adapted into seed fixtures and evaluation datasets in `shared/fixtures/`. |

> **Conclusion on Code Reuse:**
> **Reuse none.** The legacy repository informed requirements, domain lessons, and failure modes only. TestForge AI is built 100% clean greenfield.

---

## 6. Requirements and Lessons to Carry Forward

1. **Deterministic Quality Gates:** Never trust raw LLM output. Enforce strict JSON Schema / Pydantic validation.
2. **Pre-execution Human Review:** Every candidate test case must pass through human review (`pending` -> `approved` / `rejected`) before being eligible for automation.
3. **Controlled Action Allowlist:** Selenium executor must only execute a finite, safe set of actions (`navigate`, `click`, `enter_text`, `select_option`, `wait_for_visible`, `assert_*`).
4. **Target Environment Isolation:** Execution must strictly enforce allowed hostname lists and fail closed if unconfigured targets are specified.
5. **Separation of Metrics:** Never mix offline ML classification metrics with live execution pass rates.

---

## 7. Review Integrity Sign-off

- [x] Legacy repository was inspected read-only.
- [x] Legacy repository was not modified in any way.
- [x] New repository (`C:\Projects\TestForge_AI`) is completely separate.
- [x] Reuse decisions are itemized, justified, and documented.
- [x] Zero secrets or private configurations were copied.
- [x] Lessons are reflected in architectural plans and phase gates.
