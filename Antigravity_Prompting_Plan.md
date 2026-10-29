# TestForge AI — Antigravity Prompting Plan

**Companion to:** `Spec.md` v1.1 — Greenfield implementation baseline  
**Purpose:** Implement the full specification in controlled, quota-conscious steps without dropping features or weakening acceptance criteria.

> **Source of truth:** `Spec.md` is authoritative for product requirements, architecture, contracts, security, testing, phase deliverables, and acceptance criteria. This file controls how Antigravity should be prompted. It does not replace or shorten `Spec.md`.

---

# 1. How to use this plan

1. Keep `Spec.md` and this file in the root of the new project workspace, or provide both to Antigravity when starting the workspace.
2. Keep the old repository separate and read-only. Create the new project in a new directory.
3. Send the **Bootstrap Prompt** once.
4. Review the plan Antigravity returns. Do not let it implement all phases in one run.
5. Send only the prompt for the current phase. Require it to stop at the phase gate and report evidence.
6. Approve the next phase only after reviewing the deliverables and test results.
7. If you change a requirement, use the Change Request Prompt and update `Spec.md` or a tracked decision log before implementation.
8. If a context window or session resets, use the Resume Prompt. Do not ask the agent to rediscover the whole project if the state files already record it.

## Important rule

**Reduce repeated context and unnecessary tool calls—not features, quality gates, or testing.** Never ask Antigravity to “build the whole project” or “finish all remaining phases” in one prompt.

---

# 2. Project identity and objective

**Project name:** TestForge AI  
**Full title:** TestForge AI: An Intelligent NLP- and LLM-Powered Automated Test Case Generation and Execution Platform  
**Tagline:** From Requirements to Verified Tests.

Build a complete platform that:
- manages projects and natural-language software requirements;
- analyzes requirement clarity and extracts actions, entities, conditions, and expected outcomes;
- uses a measurable ML classifier where a documented, reproducible dataset and evaluation pipeline exist;
- uses an LLM provider adapter to produce structured candidate test cases;
- applies deterministic validation, traceability, quality checks, duplicate detection, and transparent prioritization;
- supports human review, editing, approval, rejection, and versioning;
- executes only approved, supported test plans through a controlled Selenium worker against explicitly authorized, user-configured target applications;
- persists execution outcomes and evidence references and produces useful reports;
- evaluates ML, LLM-generated test-case quality, and browser execution reliability separately.

Do not present mock results as real generation or execution. Do not claim the product is production-ready merely because it builds or displays a dashboard.

---

# 3. Bootstrap Prompt — send first

Copy the prompt below into Antigravity after providing `Spec.md` and this plan.

```text
We are building TestForge AI from scratch. Treat Spec.md v1.1 as the authoritative product and engineering specification, and Antigravity_Prompting_Plan.md as the execution protocol.

This is a GREENFIELD rebuild. The old repository is reference material only. Do not modify it, extend it, or copy its structure wholesale. Propose a separate new project directory. Reuse only individual assets or logic that are reviewed, justified, and documented; “reuse none” is acceptable.

Your first task is planning only. Do not create the application implementation yet and do not generate the entire project in one pass.

Read the specification and identify:
1. The full original Phase 0–10 roadmap and the deliverables/acceptance gates for every phase.
2. The architectural boundaries, shared contracts, data models, security controls, AI/NLP/ML/LLM responsibilities, browser execution safety requirements, and evaluation requirements.
3. Any conflicts, ambiguous decisions, missing inputs, or implementation risks. Do not silently rewrite the requirements.
4. A proposed top-level repository tree and the initial scaffold files for Phase 0/Phase 1.
5. A dependency-aware plan that preserves every original phase and every acceptance criterion. The seven workstreams in Section 27.8 are only groupings; they do not replace the 11 original phases.
6. The exact commands and checks you will use to verify the scaffold.

Return a concise plan with:
- architecture summary and service responsibilities;
- separate proposed project location;
- legacy review approach and reuse decisions;
- repository tree;
- phase-by-phase plan and gates;
- assumptions and decisions requiring my approval;
- Phase 0 deliverables;
- risks and validation commands.

Do not start implementation until I approve the plan. Do not claim tests or commands were run if they were not. Avoid unnecessary boilerplate and keep the response focused on decisions that affect implementation.
```

## What you should review before approving

- The new project is clearly separate from the old repository.
- The architecture matches Sections 5–6 and 27.2 of `Spec.md`.
- The plan includes **all original phases 0–10**.
- The agent does not propose to train an LLM from scratch or invent a dataset.
- The target application is configurable; the CI fixture is testing infrastructure only.
- The LLM does not generate executable code that is run directly.
- The plan has acceptance gates and real tests, not just UI milestones.

---

# 4. Phase prompts

Send each prompt only after approving the preceding phase. For every phase, Antigravity must stop when its acceptance gate is reached, report actual evidence, and wait for approval.

## Phase 0 — Legacy Review, Greenfield Architecture, and Build Plan

```text
Implement ONLY Phase 0 from Section 17 of Spec.md, following Section 27 and the approved plan.

Review the old repository read-only. Create/prepare the new project in the approved separate location. Do not modify the old repository. Document useful requirements, assets, known bugs, lessons, and reuse decisions in LEGACY_REVIEW.md. If no existing code or asset is worth reusing, say so explicitly.

Create the Phase 0 architecture and planning deliverables required by Spec.md, including architecture, API contracts, data models, security, evaluation plan, and phase checklist as applicable. Resolve only decisions already approved; list unresolved decisions rather than guessing.

Do not implement later-phase product features. Verify that the documents agree with each other and preserve the original Phase 0–10 roadmap.

At the gate, report: files created/changed, key decisions, assumptions, unresolved questions, checks actually performed, and whether every Phase 0 acceptance criterion is satisfied. Stop and wait for approval.
```

**Gate:** Separate repository/location agreed; legacy review complete; architecture, boundaries, contracts strategy, evaluation plan, risks, and phase gates documented; no unsupported claims.

## Phase 1 — Monorepo and Development Foundation

```text
Implement ONLY Phase 1 from Section 17 of Spec.md, using the approved Phase 0 deliverables.

Set up the clean repository, workspace layout, pinned/supported runtime and dependency versions, formatting, linting, type checking, test runners, environment validation, .gitignore, safe .env.example, README setup instructions, Docker Compose foundation, CI workflow, structured logging conventions, and health/readiness skeletons required by the spec. Use the approved architecture; do not add unnecessary infrastructure.

Do not build all business features now. Do not commit secrets. Keep the old repository untouched. Ensure a fresh setup can follow documented commands. Add a small, meaningful smoke test for each service skeleton.

Run the checks that are available and record exact commands and results. Fix failures caused by this phase before stopping. At the gate, list files changed, setup commands, test/lint/type-check results, known issues, and each Phase 1 criterion. Wait for approval.
```

**Gate:** Clean scaffold; services start as intended; configuration is validated; CI checks run; setup is documented and verified; no real secrets committed.

## Phase 2 — Core Backend, Database, and Application Shell

```text
Implement ONLY Phase 2 from Section 17 of Spec.md.

Implement the approved API foundation and persistence integration, including the specified data models, validation, indexes, data integrity rules, migrations/seed strategy where applicable, stable error response format, request/correlation IDs, and frontend application shell. Follow the API contracts and schemas approved in earlier phases. Implement authentication and authorization foundations at the level required by this phase; never leave protected data routes open for convenience.

Wire the frontend to real API endpoints for the functionality in scope. Do not fake persistence with frontend-only state or hard-coded success responses. Add backend unit/integration tests and frontend tests for the implemented shell and API states. Include loading, empty, validation, and error states.

Run database/API/frontend checks that are actually available. Report real persistence evidence and exact commands/results. Do not implement NLP/ML/LLM or Selenium features early unless a contract stub is explicitly needed. Stop at the Phase 2 gate and wait for approval.
```

**Gate:** Approved models/contracts are implemented; API reads/writes real persistence; validation and error responses work; authorization is tested for scoped routes; frontend communicates with backend; tests pass or failures are explicitly documented.

## Phase 3 — NLP Requirement Analysis

```text
Implement ONLY Phase 3 from Section 17 of Spec.md.

Implement the deterministic NLP requirement-analysis pipeline as specified: normalization, candidate extraction of actions/entities/conditions/constraints/expected outcomes, ambiguity or missing-information signals, and structured analysis output. Use the chosen NLP library and keep extraction distinct from model classification and LLM generation.

Preserve the original requirement text and trace analysis output to the correct requirement/version. Treat extraction as candidate evidence, not proof that a requirement is complete. Define behavior for empty, malformed, very long, ambiguous, and unsupported inputs. Keep processing deterministic where practical and document language limitations.

Add unit tests for representative normal, boundary, ambiguous, and malformed inputs, plus API/service integration tests. Do not fabricate NLP accuracy. Do not implement later phases beyond what is needed for integration.

At the gate, report the pipeline, schemas, supported behavior, limitations, actual tests/results, and any gaps against Phase 3 acceptance criteria. Stop and wait for approval.
```

**Gate:** NLP output is structured and traceable; ambiguity is surfaced honestly; invalid inputs fail safely; tests cover representative cases; no unsupported accuracy claim.

## Phase 4 — ML Dataset and Requirement Classifier

```text
Implement ONLY Phase 4 from Section 17 of Spec.md.

Create a reproducible ML data and training/evaluation workflow for the specified requirement classifier. First establish the label taxonomy, dataset schema, data provenance, train/validation/test strategy, preprocessing, class-balance checks, baseline, saved model/version metadata, inference interface, and evaluation report.

Do not fabricate labelled data, training history, accuracy, or model files. If a suitable real labelled dataset is unavailable, provide the documented dataset format and a clearly labelled baseline/demo fixture for pipeline testing; explicitly mark the classifier as not meaningfully evaluated until valid labelled data is supplied. Do not leak test data into training. Use appropriate metrics for the observed class distribution and document limitations.

Integrate inference through the approved AI-service contract. Add tests for preprocessing, training reproducibility where feasible, model loading, invalid inputs, and prediction schema. Keep classifier output separate from LLM generation quality and rule-based prioritization.

At the gate, report dataset provenance and size, label distribution, split strategy, commands run, metrics only if actually measured, model artifact/version, tests/results, and unresolved data limitations. Stop and wait for approval.
```

**Gate:** Reproducible pipeline and inference contract; leakage checks; valid metrics only when supported by data; clear distinction between baseline and evaluated model.

## Phase 5 — LLM Provider Integration and Structured Generation

```text
Implement ONLY Phase 5 from Section 17 of Spec.md.

Implement the LLM provider adapter and structured candidate test-case generation using the approved contracts and generation policy. Keep provider credentials server-side, use validated environment configuration, enforce timeouts and output/token limits, apply bounded retries only for transient failures, and log provider/model/configuration metadata without logging secrets or unnecessary sensitive content.

Normalize provider responses into the required schema. Handle malformed output, refusal, timeout, rate limit, unavailable credentials, provider errors, and partial/empty responses with stable error states. Never pretend a mocked response is a real provider call. Make mock mode explicit and restricted to development/tests.

The model output is untrusted candidate data: it must not directly execute code, choose its own safety policy, approve itself, or bypass deterministic validators. Preserve requirement traceability and generation configuration/version metadata. Add provider-adapter tests using mocks and optional integration tests only when valid credentials are configured.

At the gate, show sample structured output and validation behavior, list exact tests and results, describe provider configuration without revealing secrets, and identify any real-provider test that could not be run. Stop and wait for approval.
```

**Gate:** Provider abstraction works; output is structured and handled safely; errors are clear; mock mode is labelled; credentials remain server-side; no arbitrary generated code is executed.

## Phase 6 — Validation, Traceability, Review, and Versioning

```text
Implement ONLY Phase 6 from Section 17 of Spec.md.

Implement deterministic validation and the full test-case lifecycle described in Spec.md: schema checks, requirement-to-test traceability, supported scenario types, expected-result/assertion requirements, duplicate detection, transparent prioritization, quality indicators, human review/edit/approve/reject, revisions/versioning, and audit history as specified.

Do not equate a generated case with a correct case. Distinguish validation findings, ambiguity, unsupported assumptions, review state, priority score, classifier prediction, and execution status. Never describe a rule-based score as ML confidence. Ensure edits create the correct revision/history and that old execution results remain associated with the exact case revision used.

Add tests for invalid schemas, missing assertions, broken traceability, duplicates, revisions, authorization, approval transitions, and audit events. At the gate, demonstrate the real persisted lifecycle and report test evidence, remaining quality limitations, and Phase 6 acceptance criteria. Stop and wait for approval.
```

**Gate:** Test cases can be reviewed and versioned; validation is deterministic; traceability and audit history are preserved; status and score fields are not conflated.

## Phase 7 — Controlled Selenium Execution

```text
Implement ONLY Phase 7 from Section 17 of Spec.md, including Sections 11 and 25.2–25.9.

Build controlled browser execution for approved, supported test plans against explicitly authorized, user-configured target applications. A local fixture application is CI test infrastructure only, not the product's intended target. Implement environment configuration, allowed-host enforcement, authentication via secret references, locator registry/mapping, supported action/assertion vocabulary, preflight checks, setup/cleanup, execution-plan compilation, isolated Selenium worker, timeout/cancellation behavior, safe browser cleanup, evidence references, and truthful result classification.

Execute only cases that have been reviewed/approved and whose automation metadata passes validation. Never execute arbitrary LLM-generated code or arbitrary shell commands. Fail closed if target authorization, environment configuration, locator mapping, or required secrets are missing. Prevent access to disallowed hosts and local/cloud metadata endpoints as applicable to the deployment. Do not log passwords, cookies, tokens, or sensitive form data.

Persist execution run IDs, timestamps, case revision, environment configuration version, status, step results, logs/evidence references, and errors according to the spec. Distinguish assertion failure from browser/infrastructure error, timeout, cancellation, skipped, and not-runnable. Do not label an unexecuted case as passed.

Add executor unit/integration tests against the CI fixture, plus tests for disallowed hosts, missing locators, invalid plans, timeout, cleanup, cancellation, and result persistence. Where possible, demonstrate a real run against an authorized configured target; do not claim it happened if it did not.

At the gate, report the safety controls, target configuration used for testing (without secrets), exact run/test evidence, outcomes, limitations, and Phase 7 acceptance criteria. Stop and wait for approval.
```

**Gate:** Only approved plans execute; target restrictions fail closed; actual browser outcomes are persisted accurately; CI fixture tests pass; user-configured target integration is supported.

## Phase 8 — Reports, Analytics, and Export

```text
Implement ONLY Phase 8 from Section 17 of Spec.md.

Implement reports, run history, analytics, and exports required by the specification. Reports must use persisted data and identify the scope, filters, timestamps, and relevant versions. Show execution outcomes and failure categories truthfully. Keep ML classification metrics, LLM generation-quality evaluation, product usage metrics, and browser execution reliability separate.

Ensure reports respect project-level authorization and do not leak secrets or sensitive test data. Add pagination/filtering where specified, empty/error states, and tests for aggregation correctness, export contents, access control, and missing data. Do not populate production views with fabricated sample metrics.

At the gate, demonstrate reports based on real persisted test/run records, show exact test results, and list any export or analytics limitations. Stop and wait for approval.
```

**Gate:** Reports reflect stored records, enforce permissions, distinguish metric types, and are tested for correctness.

## Phase 9 — Integration, Security, and Reliability Hardening

```text
Implement ONLY Phase 9 from Section 17 of Spec.md.

Perform an integration and hardening pass across frontend, core API, database, AI service, provider adapter, and browser worker. Do not use this as permission for an unreviewed rewrite. Identify and fix defects supported by reproducible evidence.

Verify authentication/authorization, input validation, secret redaction, target-host restrictions, rate/size/time limits, retry/idempotency behavior, duplicate jobs, concurrency/state transitions, cancellation, service unavailability, graceful shutdown, database failure handling, logging/correlation IDs, and data retention assumptions. Check dependency pinning and documented configuration. Add or strengthen tests for security and failure paths. Do not claim a security audit or production readiness without the corresponding work and evidence.

Run all available unit, contract, integration, frontend, AI, and executor suites. Report failures and flaky tests honestly. At the gate, provide a severity-ranked defect list, fixes made, tests and exact results, residual risks, and criteria still unmet. Stop and wait for approval.
```

**Gate:** Cross-service workflows are tested; important failure/security paths are covered; no unresolved critical issue is silently ignored; residual risks are documented.

## Phase 10 — Evaluation, Documentation, and Final Release

```text
Implement ONLY Phase 10 from Section 17 of Spec.md.

Complete the reproducible evaluation and release documentation. Evaluate the ML classifier only with a valid documented dataset and held-out evaluation. Evaluate generated test cases using the defined review rubric and dataset, reporting sample size, method, limitations, and results. Evaluate browser execution using repeatable cases and truthful outcome categories. Do not combine these into a single misleading “AI accuracy” number.

Complete README setup/run/test/troubleshooting instructions, architecture and API documentation, model/data provenance notes, environment variable documentation, threat model/security notes, known limitations, release notes, and phase checklist. Verify clean setup using the documented commands where the environment allows it. Perform the end-to-end acceptance workflow against an authorized target application. CI fixture results may support executor tests but do not substitute for target-application configuration support.

Create a release-readiness matrix mapping every original Phase 0–10 acceptance criterion to evidence and status: PASS, FAIL, BLOCKED, or NOT RUN. Attach the actual test/command evidence and explicitly list all limitations. Do not mark the project production-ready if deployment-specific security, operations, backup/restore, or other required checks remain unverified.

Stop after the release report. Do not silently waive failed gates.
```

**Gate:** Reproducible evaluation; documented clean setup; end-to-end evidence; full acceptance matrix; truthful limitations and release status.

---

# 5. Reusable prompt after each phase

Use this if Antigravity gives a vague completion summary or moves on too quickly.

```text
Before we proceed, audit the current phase against the exact acceptance criteria in Spec.md. Do not begin the next phase.

Return a checklist with one row per criterion:
- criterion and Spec.md section;
- implementation evidence (file/function/API/test);
- verification command or manual procedure;
- actual result: PASS, FAIL, BLOCKED, or NOT RUN;
- remaining gap and next action.

Run any missing feasible checks now. Fix defects in the current phase only. Never mark a criterion PASS based only on code inspection if runtime testing is required. Do not invent test output. Stop with a phase-gate report and wait for my approval.
```

---

# 6. Resume prompt — for a new session or context reset

Maintain the state files described in Section 8. When opening a new Antigravity session, use:

```text
Resume the TestForge AI greenfield implementation. Treat Spec.md as the authoritative requirements source and Antigravity_Prompting_Plan.md as the workflow instructions.

First read PROJECT_STATE.md, PHASE_CHECKLIST.md, DECISIONS.md, and the current phase's relevant source files/tests. Do not re-plan or re-implement completed phases unless evidence identifies a defect or a requirement change.

Report:
1. current approved phase and exact gate status;
2. last verified commit or repository state;
3. tests/checks last run and their recorded results;
4. known failing tests, blockers, and unresolved decisions;
5. the smallest next action within the approved phase.

Do not change files until you have summarized the current state and I approve the next action. Do not claim old test results are current without rerunning them when needed.
```

---

# 7. Debugging prompt — fix a specific defect without scope drift

```text
Investigate this defect within the current approved phase only.

Observed behavior:
[describe exact error/incorrect result]

Expected behavior:
[describe the requirement and expected result]

Reproduction:
[commands, request payload, steps, logs, screenshots, or test]

Relevant Spec.md sections:
[list sections if known]

First reproduce or isolate the issue. Trace the failure to its cause before changing code. Make the smallest maintainable fix that preserves approved contracts and architecture. Add a regression test that fails before the fix and passes after it. Run the relevant test plus any directly affected checks.

Do not rewrite unrelated modules, change contracts silently, add dependencies without justification, disable tests, hard-code a success result, or weaken a security/acceptance criterion to make the test pass. If the defect reveals a spec conflict, stop and explain the decision needed.

Report root cause, changed files, regression test, exact commands/results, and remaining risks. Do not start another phase.
```

---

# 8. Change-request prompt — when requirements change during development

Use this whenever you decide to add, remove, or change a feature. This ensures the change is intentional and doesn't silently break earlier work.

```text
I want to propose this change to TestForge AI:

[describe the change]

Do not implement it yet.

Compare the proposal with Spec.md and the current implementation. Report:
1. affected sections, phase(s), API/schema contracts, data models, UI, AI pipeline, execution behavior, security controls, tests, and documentation;
2. whether this is clarification, additive scope, breaking change, or removal of scope;
3. dependencies and migration/backward-compatibility implications;
4. security, privacy, reliability, cost, and quota implications;
5. acceptance criteria and regression tests that must change;
6. whether the change should be applied now or deferred to a later phase.

Do not silently remove or weaken existing requirements. If I approve the change, update Spec.md, DECISIONS.md, PHASE_CHECKLIST.md, and affected tests/contracts as appropriate before implementation. Then implement only the approved change and rerun affected checks.
```

## If a requirement is removed

Require an explicit entry in `DECISIONS.md` with:
- old requirement and original section;
- reason for removal;
- approval date/decision owner if you want to record it;
- affected phases/tests/docs;
- replacement behavior, if any.

Do not delete acceptance criteria simply because they are difficult or quota-intensive.

---

# 9. Small state files to preserve progress

Ask Antigravity to maintain these compact files as work progresses. They reduce the need to reread lengthy conversation history.

## `PROJECT_STATE.md`

Keep it concise:
- project name and current branch;
- approved architecture and repository location;
- current phase and status;
- latest verified commit or state;
- last checks run and results;
- known blockers;
- exact next task;
- approvals needed.

## `PHASE_CHECKLIST.md`

For each original phase 0–10:
- each acceptance criterion;
- status: NOT STARTED / IN PROGRESS / PASS / FAIL / BLOCKED / NOT RUN;
- evidence path or test name;
- date/commit of verification;
- unresolved issues.

Never mark PASS without evidence. Do not collapse multiple criteria into a vague “phase complete” checkbox.

## `DECISIONS.md`

Record meaningful decisions:
- decision ID/date;
- context;
- options considered;
- decision and rationale;
- impacted specification sections/contracts;
- consequences and follow-up tasks.

## `CHANGELOG.md`

Record user-approved requirement and implementation changes, including migration or compatibility effects. Do not use it instead of updating the specification.

## `LEGACY_REVIEW.md`

Record what was learned from the old repository, known issues, and any individually approved reuse. Keep the old repo unchanged.

---

# 10. Quota-conscious workflow

Use these habits to get more work from limited Antigravity quota without reducing the project's scope.

1. **One phase per prompt.** Never request all phases at once.
2. **One task batch per phase.** Ask for a cohesive vertical slice, not dozens of unrelated features in one prompt.
3. **Provide the relevant sections.** If Antigravity already has the full spec in its workspace, refer to exact sections (for example, “Phase 7 and Sections 11, 25.2–25.9”) instead of pasting all of `Spec.md` into every prompt. If it cannot access the files, attach only the necessary sections plus this phase prompt.
4. **Ask it to inspect before editing.** Avoid regenerating files it has not checked.
5. **Require tests with implementation.** Catch errors close to the change instead of debugging a huge batch later.
6. **Use mocks only at boundaries.** Mock LLM providers for deterministic tests, but label mock mode. Do not use mock output to claim real generation/execution.
7. **Avoid repeated full-project summaries.** Maintain `PROJECT_STATE.md` and `PHASE_CHECKLIST.md`.
8. **Batch related fixes.** Group defects with the same root cause; do not combine unrelated rewrites.
9. **Use targeted debugging prompts.** Include exact error, reproduction, expected behavior, and relevant spec section.
10. **Do not skip verification.** A short, verified phase is cheaper than discovering a cross-service defect after several phases.
11. **Avoid unnecessary dependencies and architecture.** Follow the approved stack; add tools only when a clear requirement justifies them.
12. **Separate planning from implementation.** Plan once, approve it, then execute the phase.
13. **Do not ask the model to repeatedly restate `Spec.md`.** Ask for a concise criterion-to-evidence matrix when auditing a phase.
14. **Preserve phase gates.** A phase that fails an acceptance criterion is not complete; report the blocker and resolve it before proceeding unless you explicitly approve a documented deferral.

---

# 11. Recommended working cadence

For every phase:

1. **Plan:** Antigravity identifies files, dependencies, tasks, and acceptance criteria for that phase.
2. **Approve:** You confirm the plan and any tradeoffs.
3. **Implement:** Antigravity implements only the approved scope.
4. **Verify:** It runs the relevant checks and adds regression tests.
5. **Audit:** It maps the phase's criteria to concrete evidence.
6. **Decide:** You approve, request targeted fixes, or explicitly defer a documented non-blocking item.
7. **Checkpoint:** Update `PROJECT_STATE.md`, `PHASE_CHECKLIST.md`, `DECISIONS.md`, and `CHANGELOG.md` as appropriate.
8. **Commit:** Commit a coherent, tested milestone if Git is being used. Never include secrets or local data.

A failed test must be reported, not hidden. A blocked criterion must remain BLOCKED. A test not run must remain NOT RUN.

---

# 12. Final rule

The desired outcome is a complete, working, maintainable TestForge AI platform, not simply a generated codebase or attractive dashboard.

**The specification defines what must be built. This prompting plan defines how to guide Antigravity through building and verifying it.** If the specification changes, update the specification and decision/checklist files first, then update the relevant phase prompt. Never let quota pressure silently reduce product scope or correctness requirements.
