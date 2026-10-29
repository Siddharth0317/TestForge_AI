# TestForge AI — Changelog

All notable, owner-approved product requirement and implementation changes are recorded here. Keep entries concise and link to decision IDs, affected specification sections, phases, and commits where possible.

---

## Change History

### 2026-10-29 — Phase 3 NLP Requirement Analysis Pipeline Complete

- **Change ID:** `CHG-004`
- **Type:** `AI Service & Deterministic NLP Extraction`
- **Requested by:** Project Owner
- **Approval:** `APPROVED`
- **Reason:** Implement Phase 3 deliverables per `Spec.md` Section 9, Section 17, and `Antigravity_Prompting_Plan.md`.
- **Previous behavior/requirement:** Requirements stored without linguistic extraction or ambiguity analysis (Phase 2).
- **New behavior/requirement:**
  - Implemented `RequirementNormalizer` for safe unicode normalization, whitespace collapsing, control-character stripping, and 5-4000 character validation.
  - Integrated spaCy (`en_core_web_sm`) in `ai-service/app/nlp/` with `LinguisticCandidateExtractor` extracting actors, actions, entities, conditions, constraints, explicit negations, expected outcomes, and traceable character-level evidence spans.
  - Implemented `AmbiguityDetector` surfacing vague subjective terms, non-normative weak modals (`should`, `might`), unbounded quantifiers (`some`, `many`, `etc.`), passive voice without agent, and conditional triggers lacking expected outcomes.
  - Exposed authenticated internal endpoint `POST /internal/v1/requirements/analyze` requiring `X-Internal-Service-Key`.
  - Wired Node backend (`AIServiceClient`) to invoke AI service on requirement creation/updates with graceful fallback to `draft` on service error.
  - Added backend endpoint `POST /api/v1/requirements/:id/analyze` and updated Mongoose `Requirement` schema with `nlp_analysis` and `status: 'analyzed'`.
  - Updated frontend `RequirementsView` to render extracted linguistic badges (actors, actions, entities, conditions, constraints, outcomes), ambiguity warning alerts, and an interactive "Run NLP Analysis" button.
- **Spec.md sections updated:** Section 5.1, Section 9.2, Section 9.3, Section 12, Section 17 (Phase 3).
- **Decision IDs:** `DEC-002`, `DEC-003`
- **Affected phase(s):** Phase 3 (completed at gate), ready for Phase 4.
- **Verification:**
  - `ai-service` tests: 30/30 passing with pytest.
  - `backend` integration tests: 20/20 passing with Vitest.
  - `frontend` component tests: 10/10 passing with Vitest.
  - `automation` safety tests: 4/4 passing.
  - TypeScript compilation: 0 errors across monorepo.
  - Total test suite: 64/64 passing (100%).

---

### 2026-10-29 — Phase 2 Core Backend, Database, and Application Shell Complete

- **Change ID:** `CHG-003`
- **Type:** `Core Backend API & Database Persistence`
- **Requested by:** Project Owner
- **Approval:** `APPROVED`
- **Reason:** Implement Phase 2 deliverables per `Spec.md` Section 17 and `Antigravity_Prompting_Plan.md`.
- **Previous behavior/requirement:** Monorepo development foundation without persistence or business entities (Phase 1).
- **New behavior/requirement:**
  - Implemented Mongoose data models with validation and compound indexes: `User`, `Project`, `Requirement`, and `TargetEnvironment`.
  - Implemented secure password hashing via bcrypt and JWT authentication utilities.
  - Implemented server-side RBAC and project authorization middleware (`requireProjectRole`) enforcing cross-project isolation.
  - Created REST routers for `/api/v1/auth`, `/api/v1/projects`, `/api/v1/projects/:projectId/requirements`, `/api/v1/requirements/:requirementId`, and `/api/v1/projects/:projectId/environments`.
  - Implemented requirement versioning: editing a requirement increments its `version` counter and resets status to `draft`.
  - Implemented automated database seed script in `backend/src/scripts/seed.ts`.
  - Implemented frontend real API client (`services/api.ts`, `services/auth.ts`, `services/projects.ts`, `services/requirements.ts`), authentication context (`AuthContext.tsx`), and views (`LoginForm`, `ProjectsView`, `RequirementsView`).
  - Added test suites: 18 backend tests passing with in-memory MongoDB, 9 frontend tests passing with Vitest.
- **Spec.md sections updated:** Section 7, Section 8, Section 12, Section 17 (Phase 2), Section 27.
- **Decision IDs:** `DEC-002`, `DEC-005`
- **Affected phase(s):** Phase 2 (completed at gate), ready for Phase 3.
- **Verification:**
  - `npm run typecheck`: 0 errors.
  - `npm run test:backend`: 18/18 passing (Vitest / Supertest / Mongoose).
  - `npm run test:frontend`: 9/9 passing (Vitest / Testing Library).
  - `pytest ai-service`: 4/4 passing.
  - `pytest automation`: 4/4 passing.

---

### 2026-10-29 — Phase 1 Monorepo & Development Foundation Complete

- **Change ID:** `CHG-002`
- **Type:** `Development Foundation Scaffolding & CI`
- **Requested by:** Project Owner
- **Approval:** `APPROVED`
- **Reason:** Implement Phase 1 deliverables per `Spec.md` Section 17 and `Antigravity_Prompting_Plan.md`.
- **Previous behavior/requirement:** Architecture and planning documents only (Phase 0).
- **New behavior/requirement:** Clean monorepo scaffold, pinned dependencies, health probes, Docker Compose, CI pipeline.
- **Decision IDs:** `DEC-001`, `DEC-002`, `DEC-003`, `DEC-005`
- **Affected phase(s):** Phase 1.

---

### 2026-10-29 — Phase 0 Architecture Baseline & Legacy Review Complete

- **Change ID:** `CHG-001`
- **Type:** `Architecture Baseline & Planning Complete`
- **Requested by:** Project Owner
- **Approval:** `APPROVED`
- **Reason:** Completed Phase 0 requirements per `Spec.md` Section 17 and `Antigravity_Prompting_Plan.md`.
- **Decision IDs:** `DEC-001`, `DEC-002`, `DEC-003`, `DEC-004`, `DEC-005`
- **Affected phase(s):** Phase 0.
