# TestForge AI — Data Models & Schemas Specification

**Status:** Approved baseline for implementation  
**Version:** 1.0  
**Companion Documents:** `docs/architecture.md`, `docs/api-contracts.md`, `Spec.md`

---

## 1. Data Modeling Architecture

TestForge AI uses **MongoDB** as its primary system of record, managed via **Mongoose** in the Node.js backend. In parallel, the Python AI service uses **Pydantic v2** models to validate inter-service payloads and enforce structured output guarantees.

### Core Data Integrity Principles
1. **Multi-Tenancy & Project Scoping:** Every business entity (Requirement, TestCase, TargetEnvironment, ExecutionRun) is strictly scoped to a `project_id`. All database queries must enforce `project_id` matching.
2. **Immutable Traceability:** A `TestCase` is permanently tied to a specific `requirement_id` and `requirement_version`.
3. **Optimistic Concurrency & Versioning:** Modifications to approved test cases generate a new version increment (e.g., version 1 -> version 2), preserving historical revisions so past execution runs remain verifiable.
4. **Secret Isolation:** Real credentials (passwords, tokens) are never persisted in plain text within requirements, test cases, or execution logs.

---

## 2. MongoDB Collections & Mongoose Schemas

### 2.1 Collection: `users`
Represents platform operators and team members.
```typescript
interface IUser {
  _id: mongoose.Types.ObjectId;
  email: string;                      // Unique index, lowercase, trimmed
  password_hash: string;              // Argon2id or bcrypt hash
  role: 'admin' | 'qa_engineer' | 'viewer';
  status: 'active' | 'suspended';
  created_at: Date;
  updated_at: Date;
}
```
**Indexes:**
- `{ email: 1 }` (Unique)

---

### 2.2 Collection: `projects`
Organizational boundary for test assets and execution environments.
```typescript
interface IProject {
  _id: mongoose.Types.ObjectId;
  name: string;                       // Required, trimmed
  description: string;
  owner_id: mongoose.Types.ObjectId;  // Reference to users._id
  members: Array<{
    user_id: mongoose.Types.ObjectId;
    role: 'admin' | 'qa_engineer' | 'viewer';
  }>;
  settings: {
    default_priority: 'low' | 'medium' | 'high' | 'critical';
    require_approval_for_execution: boolean;
  };
  created_at: Date;
  updated_at: Date;
}
```
**Indexes:**
- `{ owner_id: 1 }`
- `{ 'members.user_id': 1 }`

---

### 2.3 Collection: `target_environments`
User-configured, authorized target web applications and locator registries.
```typescript
interface ILocatorEntry {
  key: string;                        // Unique locator identifier within environment (e.g. "login_submit_btn")
  page: string;                       // Component/Page grouping (e.g. "login", "checkout")
  strategy: 'id' | 'css' | 'xpath' | 'name' | 'test_id';
  value: string;                      // The actual DOM selector
  description?: string;
}

interface ITargetEnvironment {
  _id: mongoose.Types.ObjectId;
  project_id: mongoose.Types.ObjectId;
  name: string;                       // e.g. "Staging Environment"
  base_url: string;                   // Validated HTTPS/HTTP URL
  allowed_hosts: string[];            // Allowlist of allowed hostnames (e.g. ["staging.myapp.com"])
  environment_type: 'local' | 'dev' | 'staging' | 'production_authorized';
  is_active: boolean;
  timeouts: {
    page_load_seconds: number;        // Default 30
    implicit_wait_seconds: number;    // Default 5
  };
  locators: ILocatorEntry[];
  auth_config?: {
    login_url_ref?: string;
    username_locator_ref?: string;
    password_locator_ref?: string;
    secret_key_ref?: string;          // Name of the secret in environment/secret-store
  };
  created_at: Date;
  updated_at: Date;
}
```
**Indexes:**
- `{ project_id: 1, name: 1 }` (Unique compound index)
- `{ project_id: 1, 'locators.key': 1 }`

---

### 2.4 Collection: `requirements`
Stores software specifications, NLP analysis, and ML classification.
```typescript
interface INLPAnalysis {
  actors: string[];
  actions: string[];
  entities: string[];
  conditions: string[];
  constraints: string[];
  outcomes: string[];
  ambiguity_findings: Array<{
    phrase: string;
    reason: string;
    severity: 'warning' | 'info';
  }>;
}

interface IMLClassification {
  category: string;
  confidence: number;                 // Float 0.0 - 1.0
  model_version: string;
  is_uncertain: boolean;
}

interface IRequirement {
  _id: mongoose.Types.ObjectId;
  project_id: mongoose.Types.ObjectId;
  version: number;                    // Starts at 1, increments on edit
  original_text: string;              // Preserved original user input
  normalized_text: string;            // Safely trimmed/normalized text
  source_metadata?: {
    jira_key?: string;
    author?: string;
    document_ref?: string;
  };
  nlp_analysis?: INLPAnalysis;
  ml_classification?: IMLClassification;
  status: 'draft' | 'analyzed' | 'archived';
  created_by: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}
```
**Indexes:**
- `{ project_id: 1, created_at: -1 }`
- `{ project_id: 1, status: 1 }`

---

### 2.5 Collection: `generation_jobs`
Asynchronous generation tracking and LLM quota observability.
```typescript
interface IGenerationJob {
  _id: mongoose.Types.ObjectId;
  project_id: mongoose.Types.ObjectId;
  requirement_id: mongoose.Types.ObjectId;
  requirement_version: number;
  requested_by: mongoose.Types.ObjectId;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'needs_review' | 'cancelled';
  provider: string;                   // e.g. "gemini", "openai", "mock"
  model: string;                      // e.g. "gemini-1.5-pro"
  prompt_template_version: string;
  schema_version: string;
  candidate_test_case_ids: mongoose.Types.ObjectId[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  error?: {
    code: string;
    message: string;
  };
  started_at: Date;
  completed_at?: Date;
}
```
**Indexes:**
- `{ requirement_id: 1, status: 1 }`
- `{ project_id: 1, created_at: -1 }`

---

### 2.6 Collection: `test_cases`
The central test artifact conforming to Section 7.1 of `Spec.md`.
```typescript
interface ITestStep {
  step_number: number;
  action: 'navigate' | 'click' | 'enter_text' | 'select_option' | 'wait_for_visible';
  target_ref: string;                 // Symbolic key matching target_environments.locators.key
  value_ref?: string | null;          // Symbolic data ref or synthetic input string
}

interface IAssertion {
  type: 'assert_visible' | 'assert_not_visible' | 'assert_text' | 'assert_url';
  target_ref: string;
  expected_value?: string | null;
  timeout_ms: number;
}

interface ISourceEvidence {
  requirement_span: string;           // Exact substring quoted from requirement
}

interface ITestCase {
  _id: mongoose.Types.ObjectId;
  project_id: mongoose.Types.ObjectId;
  requirement_id: mongoose.Types.ObjectId;
  requirement_version: number;
  version: number;                    // Revisions increment version
  is_current: boolean;                // Flag for latest version
  title: string;
  category: string;
  scenario_type: 'positive' | 'negative' | 'boundary' | 'authorization' | 'error_handling' | 'state_transition';
  preconditions: string[];
  test_data: Record<string, string>;  // Symbolic test data fixtures
  steps: ITestStep[];
  expected_result: string;
  assertions: IAssertion[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  priority_rationale?: string;
  automation_status: 'manual_only' | 'requires_configuration' | 'ready' | 'not_executable';
  assumptions: string[];              // Explicit model assumptions surfaced for human review
  source_evidence: ISourceEvidence[];
  review_status: 'pending' | 'approved' | 'rejected' | 'needs_changes';
  review_notes?: string;
  reviewed_by?: mongoose.Types.ObjectId;
  reviewed_at?: Date;
  created_at: Date;
  updated_at: Date;
}
```
**Indexes:**
- `{ project_id: 1, requirement_id: 1, is_current: 1 }`
- `{ project_id: 1, review_status: 1 }`
- `{ project_id: 1, automation_status: 1 }`

---

### 2.7 Collection: `execution_runs`
Records browser test execution triggers and high-level summaries.
```typescript
interface IExecutionRun {
  _id: mongoose.Types.ObjectId;
  project_id: mongoose.Types.ObjectId;
  environment_id: mongoose.Types.ObjectId;
  environment_version: Date;         // Timestamp snapshot of environment configuration
  requested_by: mongoose.Types.ObjectId;
  test_case_versions: Array<{
    test_case_id: mongoose.Types.ObjectId;
    version: number;
  }>;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  summary: {
    total: number;
    passed: number;
    failed: number;
    error: number;
    blocked: number;
    not_executable: number;
    cancelled: number;
  };
  duration_ms?: number;
  started_at: Date;
  completed_at?: Date;
}
```
**Indexes:**
- `{ project_id: 1, created_at: -1 }`
- `{ environment_id: 1 }`

---

### 2.8 Collection: `execution_results`
Detailed, individual case assertion results, duration, and evidence.
```typescript
interface IStepResult {
  step_number: number;
  action: string;
  status: 'passed' | 'failed' | 'error';
  duration_ms: number;
  error?: string;
}

interface IAssertionResult {
  assertion_index: number;
  type: string;
  status: 'passed' | 'failed';
  expected: string | null;
  actual: string | null;
  message?: string;
}

interface IExecutionResult {
  _id: mongoose.Types.ObjectId;
  execution_run_id: mongoose.Types.ObjectId;
  test_case_id: mongoose.Types.ObjectId;
  test_case_version: number;
  environment_id: mongoose.Types.ObjectId;
  outcome: 'passed' | 'failed' | 'error' | 'blocked' | 'not_executable' | 'cancelled';
  duration_ms: number;
  step_results: IStepResult[];
  assertion_results: IAssertionResult[];
  sanitized_logs: string[];
  failure_category?: 'assertion_failure' | 'locator_not_found' | 'target_timeout' | 'driver_error' | 'unauthorized_target';
  evidence_refs?: Array<{
    type: 'screenshot' | 'dom_snapshot';
    storage_path: string;
  }>;
  created_at: Date;
}
```
**Indexes:**
- `{ execution_run_id: 1 }`
- `{ test_case_id: 1, created_at: -1 }`

---

## 3. Python AI Service Pydantic Models

In `ai-service/app/schemas/`:

```python
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Literal

class NLPAnalysisResult(BaseModel):
    normalized_text: str
    actors: List[str] = Field(default_factory=list)
    actions: List[str] = Field(default_factory=list)
    entities: List[str] = Field(default_factory=list)
    conditions: List[str] = Field(default_factory=list)
    constraints: List[str] = Field(default_factory=list)
    outcomes: List[str] = Field(default_factory=list)
    ambiguity_findings: List[Dict[str, str]] = Field(default_factory=list)

class StepSchema(BaseModel):
    step_number: int
    action: Literal["navigate", "click", "enter_text", "select_option", "wait_for_visible"]
    target_ref: str
    value_ref: Optional[str] = None

class AssertionSchema(BaseModel):
    type: Literal["assert_visible", "assert_not_visible", "assert_text", "assert_url"]
    target_ref: str
    expected_value: Optional[str] = None
    timeout_ms: int = 5000

class CandidateTestCase(BaseModel):
    title: str
    scenario_type: Literal["positive", "negative", "boundary", "authorization", "error_handling", "state_transition"]
    preconditions: List[str] = Field(default_factory=list)
    test_data: Dict[str, str] = Field(default_factory=dict)
    steps: List[StepSchema]
    expected_result: str
    assertions: List[AssertionSchema]
    priority: Literal["low", "medium", "high", "critical"]
    assumptions: List[str] = Field(default_factory=list)
    source_evidence: List[Dict[str, str]] = Field(default_factory=list)

class GenerationResponse(BaseModel):
    candidate_test_cases: List[CandidateTestCase]
    model_provider: str
    model_name: str
    prompt_version: str
```

