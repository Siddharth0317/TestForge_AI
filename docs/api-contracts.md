# TestForge AI — API Contracts & Interface Specification

**Status:** Approved baseline for implementation  
**Version:** 1.0  
**Companion Documents:** `docs/architecture.md`, `docs/data-models.md`, `Spec.md`

---

## 1. Unified Conventions

### 1.1 Base Paths & Versioning
- **Core Public API:** `/api/v1` (managed by Node.js Core Backend)
- **AI Internal API:** `/internal/v1` (managed by Python FastAPI AI service; private network only)

### 1.2 Authentication Headers
- **Public API:** `Authorization: Bearer <jwt_token>`
- **Internal API:** `X-Internal-Service-Key: <configured_shared_token>`
- **Tracing Header:** `X-Request-ID: <uuid_v4>` (propagated across all frontend, backend, and AI service calls)

### 1.3 Standard Success Envelope
All JSON responses return structured payloads directly or within standard container objects:
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### 1.4 Standard Error Response Envelope
All error responses adhere to the unified format specified in `Spec.md` Section 12.1:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request payload failed schema validation.",
    "request_id": "c1f7a28e-8794-4d1a-96e0-b99b664d4312",
    "details": [
      {
        "field": "title",
        "message": "Title is required and must not be empty"
      }
    ],
    "timestamp": "2026-10-29T11:45:00.000Z"
  }
}
```

**Standard Error Codes:**
- `VALIDATION_ERROR` (400) — Malformed JSON or invalid schema.
- `UNAUTHORIZED` (401) — Missing or invalid authentication token.
- `FORBIDDEN` (403) — User lacks role/project permission.
- `NOT_FOUND` (404) — Requested resource does not exist.
- `CONFLICT` (409) — Resource version conflict or duplicate submission.
- `UNPROCESSABLE_ENTITY` (422) — Business rule validation failed (e.g. executing an unapproved test case).
- `AI_PROVIDER_ERROR` (502) — LLM provider outage, timeout, or rate-limit.
- `INTERNAL_SERVER_ERROR` (500) — Unhandled server failure (stack traces suppressed).

---

## 2. Core Backend API Specification (`/api/v1`)

### 2.1 Authentication (`/auth`)

#### `POST /api/v1/auth/login`
- **Request:**
  ```json
  {
    "email": "qa.engineer@testforge.local",
    "password": "SecurePassword123!"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIs...",
      "user": {
        "id": "usr_67123a",
        "email": "qa.engineer@testforge.local",
        "role": "qa_engineer"
      }
    }
  }
  ```

#### `GET /api/v1/auth/me`
- **Response (200 OK):** User profile and assigned project memberships.

---

### 2.2 Projects (`/projects`)

#### `POST /api/v1/projects`
- **Request:**
  ```json
  {
    "name": "E-Commerce Checkout",
    "description": "Checkout flow and payment integration test suite",
    "settings": {
      "default_priority": "medium"
    }
  }
  ```
- **Response (201 Created):** Created project record.

#### `GET /api/v1/projects`
- **Response (200 OK):** Array of projects accessible to the authenticated user.

#### `GET /api/v1/projects/{projectId}`
- **Response (200 OK):** Project details including summary counts of requirements, test cases, and environments.

---

### 2.3 Target Environments (`/projects/{projectId}/environments`)

#### `POST /api/v1/projects/{projectId}/environments`
- **Request:**
  ```json
  {
    "name": "Staging UAT",
    "base_url": "https://staging.app.local",
    "allowed_hosts": ["staging.app.local", "auth.staging.app.local"],
    "environment_type": "staging",
    "is_active": true,
    "timeouts": {
      "page_load_seconds": 30,
      "implicit_wait_seconds": 5
    },
    "locators": [
      {
        "key": "login_email_input",
        "page": "login",
        "strategy": "id",
        "value": "user_email",
        "description": "Login email input field"
      },
      {
        "key": "login_submit_btn",
        "page": "login",
        "strategy": "css",
        "value": "button[type='submit']",
        "description": "Primary login action button"
      }
    ]
  }
  ```
- **Response (201 Created):** Created TargetEnvironment object.

---

### 2.4 Requirements (`/projects/{projectId}/requirements`)

#### `POST /api/v1/projects/{projectId}/requirements`
- **Request:**
  ```json
  {
    "original_text": "When a customer enters an incorrect password three consecutive times, the login form must be locked for 15 minutes and display an informative lockout message.",
    "source_metadata": {
      "jira_key": "SEC-104",
      "author": "Alice Product"
    }
  }
  ```
- **Processing:** Invokes AI Service `/internal/v1/requirements/analyze` to normalize text and extract NLP linguistic entities, then persists requirement.
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "id": "req_881920",
      "project_id": "prj_001",
      "version": 1,
      "original_text": "When a customer enters an incorrect password three consecutive times, the login form must be locked for 15 minutes and display an informative lockout message.",
      "normalized_text": "When a customer enters an incorrect password three consecutive times, the login form must be locked for 15 minutes and display an informative lockout message.",
      "nlp_analysis": {
        "actors": ["customer"],
        "actions": ["enters", "locked", "display"],
        "entities": ["login form", "password", "lockout message"],
        "conditions": ["incorrect password three consecutive times"],
        "constraints": ["15 minutes"],
        "outcomes": ["login form locked", "informative lockout message displayed"],
        "ambiguity_findings": []
      },
      "ml_classification": {
        "category": "security_authentication",
        "confidence": 0.89,
        "model_version": "v1.0.0-baseline"
      },
      "status": "analyzed",
      "created_at": "2026-10-29T11:45:00.000Z"
    }
  }
  ```

---

### 2.5 Generation Jobs (`/requirements/{requirementId}/generation-jobs`)

#### `POST /api/v1/requirements/{requirementId}/generation-jobs`
- **Request:**
  ```json
  {
    "temperature": 0.2,
    "max_scenarios": 5
  }
  ```
- **Response (202 Accepted):**
  ```json
  {
    "success": true,
    "data": {
      "job_id": "job_9921",
      "requirement_id": "req_881920",
      "status": "queued",
      "created_at": "2026-10-29T11:45:01.000Z"
    }
  }
  ```

#### `GET /api/v1/generation-jobs/{jobId}`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "job_id": "job_9921",
      "status": "completed",
      "candidate_count": 3,
      "test_case_ids": ["tc_001", "tc_002", "tc_003"],
      "usage": {
        "prompt_tokens": 420,
        "completion_tokens": 580
      },
      "error": null
    }
  }
  ```

---

### 2.6 Test Cases (`/test-cases`)

#### `GET /api/v1/requirements/{requirementId}/test-cases`
- **Response (200 OK):** List of test cases linked to the requirement.

#### `GET /api/v1/test-cases/{testCaseId}`
- **Response (200 OK):** Full TestCase document conforming to Section 7.1 of `Spec.md`.

#### `PATCH /api/v1/test-cases/{testCaseId}`
- **Request:** Updates steps, assertions, priority, or test data.
- **Rule:** If the test case was previously approved, editing increments the version (e.g. `version: 2`) and resets `review_status` to `pending`.

#### `POST /api/v1/test-cases/{testCaseId}/approve`
- **Request:**
  ```json
  {
    "notes": "Verified locator mappings and steps for Staging environment."
  }
  ```
- **Response (200 OK):** Updates `review_status` to `approved` and records reviewer metadata.

#### `POST /api/v1/test-cases/{testCaseId}/reject`
- **Request:**
  ```json
  {
    "rejection_reason": "Assumption of lockout counter reset after 5 minutes is unsupported by requirement."
  }
  ```
- **Response (200 OK):** Updates `review_status` to `rejected`.

---

### 2.7 Execution Runs (`/execution-runs`)

#### `POST /api/v1/execution-runs`
- **Request:**
  ```json
  {
    "project_id": "prj_001",
    "environment_id": "env_staging_01",
    "test_case_ids": ["tc_001", "tc_002"]
  }
  ```
- **Validation:**
  1. Verifies user has QA Engineer or Admin role.
  2. Verifies all requested test cases have `review_status: "approved"`.
  3. Verifies target environment is enabled and active.
  4. Validates that all `target_ref` keys in test cases exist in the environment locator registry.
- **Response (202 Accepted):** Returns `ExecutionRun` record with status `queued`.

#### `GET /api/v1/execution-runs/{runId}`
- **Response (200 OK):** Run status, summary counts, duration.

#### `GET /api/v1/execution-runs/{runId}/results`
- **Response (200 OK):** Detailed results for each executed test case, including assertion outcomes and sanitized logs.

---

## 3. AI Service Internal API Specification (`/internal/v1`)

### 3.1 `POST /internal/v1/requirements/analyze`
- **Purpose:** Deterministic text normalization, spaCy linguistic entity extraction, and ambiguity analysis.
- **Request:**
  ```json
  {
    "text": "The user must enter a valid email address and click submit."
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "normalized_text": "The user must enter a valid email address and click submit.",
    "actors": ["user"],
    "actions": ["enter", "click"],
    "entities": ["email address", "submit"],
    "conditions": ["valid email address"],
    "constraints": [],
    "outcomes": [],
    "ambiguity_findings": []
  }
  ```

### 3.2 `POST /internal/v1/classifier/predict`
- **Purpose:** scikit-learn requirement category inference with confidence scoring.
- **Request:**
  ```json
  {
    "normalized_text": "User must receive an error banner when login fails."
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "category": "error_handling",
    "confidence": 0.92,
    "model_version": "v1.0.0-baseline",
    "is_uncertain": false
  }
  ```

### 3.3 `POST /internal/v1/test-cases/generate`
- **Purpose:** Calls the configured LLM Provider Adapter to generate structured candidate test cases conforming to schema.
- **Request:**
  ```json
  {
    "requirement_id": "req_881920",
    "requirement_text": "When a customer enters an incorrect password three consecutive times, the login form must be locked for 15 minutes.",
    "category": "security_authentication",
    "nlp_context": {
      "actors": ["customer"],
      "entities": ["login form", "password"],
      "conditions": ["incorrect password three consecutive times"],
      "constraints": ["15 minutes"]
    },
    "max_scenarios": 3
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "candidate_test_cases": [
      {
        "title": "Three failed password attempts locks the login form",
        "scenario_type": "negative",
        "preconditions": ["Customer account exists"],
        "test_data": {
          "email": "test.user@company.local",
          "password": "wrong_password_attempt"
        },
        "steps": [
          { "step_number": 1, "action": "navigate", "target_ref": "login_page", "value_ref": null },
          { "step_number": 2, "action": "enter_text", "target_ref": "login_email_input", "value_ref": "test.user@company.local" },
          { "step_number": 3, "action": "enter_text", "target_ref": "login_password_input", "value_ref": "wrong_password_attempt" },
          { "step_number": 4, "action": "click", "target_ref": "login_submit_btn", "value_ref": null }
        ],
        "expected_result": "Login form displays lockout error message after third consecutive attempt.",
        "assertions": [
          {
            "type": "assert_visible",
            "target_ref": "lockout_error_banner",
            "expected_value": null,
            "timeout_ms": 5000
          }
        ],
        "priority": "high",
        "assumptions": ["Lockout triggers immediately on 3rd attempt"],
        "source_evidence": [
          { "requirement_span": "incorrect password three consecutive times, the login form must be locked" }
        ]
      }
    ],
    "model_metadata": {
      "provider": "gemini",
      "model": "gemini-1.5-pro",
      "prompt_version": "v1.0"
    },
    "usage": {
      "prompt_tokens": 350,
      "completion_tokens": 420
    }
  }
  ```

---

## 4. Automation Worker Plan Compilation Contract

Before browser execution begins, the Core Backend compiles the approved `TestCase` and the `TargetEnvironment` into a compiled **Execution Plan JSON**:

```json
{
  "plan_version": "1.0",
  "run_id": "run_55102",
  "environment": {
    "base_url": "https://staging.app.local",
    "allowed_hosts": ["staging.app.local"],
    "timeouts": {
      "page_load_seconds": 30,
      "implicit_wait_seconds": 5
    },
    "locators": {
      "login_page": { "strategy": "url", "value": "/login" },
      "login_email_input": { "strategy": "id", "value": "user_email" },
      "login_password_input": { "strategy": "id", "value": "user_password" },
      "login_submit_btn": { "strategy": "css", "value": "button[type='submit']" },
      "lockout_error_banner": { "strategy": "css", "value": ".alert-lockout" }
    }
  },
  "test_cases": [
    {
      "test_case_id": "tc_001",
      "version": 1,
      "steps": [
        { "action": "navigate", "target": "login_page", "value": null },
        { "action": "enter_text", "target": "login_email_input", "value": "test.user@company.local" },
        { "action": "enter_text", "target": "login_password_input", "value": "wrong_password_attempt" },
        { "action": "click", "target": "login_submit_btn", "value": null }
      ],
      "assertions": [
        {
          "type": "assert_visible",
          "target": "lockout_error_banner",
          "expected_value": null,
          "timeout_ms": 5000
        }
      ]
    }
  ]
}
```

The worker executes this plan without making external calls, evaluates every assertion, and returns an **Execution Result JSON** containing the explicit outcome (`passed`, `failed`, `error`, `blocked`, `not_executable`).

