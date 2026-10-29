# TestForge AI — Security, Privacy & Reliability Specification

**Status:** Approved baseline for implementation  
**Version:** 1.0  
**Companion Documents:** `docs/architecture.md`, `docs/api-contracts.md`, `Spec.md`

---

## 1. Threat Model & Risk Analysis

The platform operates at the intersection of natural language processing, external LLM APIs, and active browser automation. This architecture introduces specific security risks that require strict defensive controls:

```
[ Untrusted Input ]
(Requirements, User Prompts, Target Web Pages)
        |
        v
+-----------------------------------------------------------------------------------------+
| Threat: Indirect Prompt Injection                                                       |
| Attack: Malicious user inputs instructions into requirements to hijack LLM behavior.    |
| Defense: Strict prompt template boundaries, system instruction isolation, JSON Schema    |
|          enforcement, zero executive authority granted to model output.                 |
+-----------------------------------------------------------------------------------------+
        |
        v
+-----------------------------------------------------------------------------------------+
| Threat: Arbitrary Code / Script Execution                                               |
| Attack: Attempting to run arbitrary JavaScript, Python, or shell code in the browser.   |
| Defense: Zero eval/exec. Selenium worker only accepts finite allowlist of actions       |
|          ('navigate', 'click', 'enter_text', 'select_option', 'assert_*').              |
+-----------------------------------------------------------------------------------------+
        |
        v
+-----------------------------------------------------------------------------------------+
| Threat: Server-Side Request Forgery (SSRF) / Cloud Metadata Exfiltration                |
| Attack: Directing browser automation to internal networks or cloud metadata APIs.       |
| Defense: Target Environment Allowlisting: Preflight check verifies target URL against   |
|          configured allowed hosts. Network-level blocks against 169.254.169.254.        |
+-----------------------------------------------------------------------------------------+
        |
        v
+-----------------------------------------------------------------------------------------+
| Threat: Credential & Secret Leakage                                                     |
| Attack: Real passwords or API keys stored in plain text or logged to disk.              |
| Defense: Secrets stored only in server-side environment variables; symbolic test-data   |
|          references used in test cases; automated log sanitization middleware.          |
+-----------------------------------------------------------------------------------------+
```

---

## 2. Authentication & Authorization (RBAC)

### 2.1 Role-Based Access Control (RBAC)

Authorization is strictly enforced on the server for every resource. Frontend UI state changes or disabled buttons are treated as user affordances only, never as security controls.

| Role | Project Permissions | Requirement Permissions | Test Case Permissions | Execution Permissions | Environment Config |
|---|---|---|---|---|---|
| **Project Owner / Admin** | Create, Edit, Delete, Manage Members | Create, Edit, Delete | Create, Edit, Approve, Reject | Trigger Runs, Cancel Runs | Full (Create, Edit, Delete) |
| **QA Engineer / Contributor** | Read | Create, Edit | Create, Edit, Request Review | Trigger Runs on Approved Cases | Read, Add Locators |
| **Viewer** | Read | Read | Read | Read Results & Logs | Read |

### 2.2 Server-Side Authorization Middleware
Every route under `/api/v1/projects/:projectId/*` executes project-level ownership and role verification:
```typescript
// Conceptual authorization guard
export function requireProjectRole(allowedRoles: Role[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { projectId } = req.params;
    const userId = req.user.id;
    const membership = await ProjectMember.findOne({ projectId, userId });
    
    if (!membership || !allowedRoles.includes(membership.role)) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient project permissions to perform this action.',
          request_id: req.id
        }
      });
    }
    next();
  };
}
```

---

## 3. Browser Automation Safety & Host Protection

The Selenium Automation Worker interacts with real web browsers. To prevent abusive or hazardous automation:

### 3.1 Strict Host Allowlisting
Before any browser instance is spawned or directed to a URL:
1. The requested URL is parsed and normalized.
2. The hostname is checked against the target environment's `allowed_hosts` list.
3. If the host is not explicitly allowlisted, the run is immediately aborted with status `unauthorized_target`.

### 3.2 Prohibited Destination Filters
The following destinations are permanently blocked by the worker regardless of user configuration:
- `169.254.169.254` (AWS, GCP, Azure metadata services)
- `127.0.0.1`, `localhost` (unless specifically flagged as `environment_type: "local"` for the CI fixture)
- `0.0.0.0`, `::1`
- Cloud internal DNS suffixes (`*.internal`, `*.metadata.google.internal`)

### 3.3 Worker Isolation & Resource Bounds
- Dedicated process/container isolation.
- Maximum execution timeout per test step: **15 seconds**.
- Maximum execution timeout per test case: **60 seconds** (configurable up to 120s by Admin).
- Memory limit: 2 GB per worker container.
- Clean shutdown guarantee: Browser driver instances are wrapped in `try...finally` blocks to ensure Chrome processes terminate even on assertion or script failure.

---

## 4. Secret & Privacy Management

### 4.1 Server-Side Secret Handling
- LLM API keys (`GEMINI_API_KEY`, `OPENAI_API_KEY`) and database credentials are kept exclusively on the backend and AI service.
- Secrets are passed via validated environment variables and never exposed to the frontend bundle or client APIs.

### 4.2 Symbolic References in Test Cases
- Real test account passwords must never appear in `TestCase.test_data` or prompt payloads.
- Test cases declare symbolic references, for example:
  ```json
  "test_data": {
    "username": "staging_test_user_01",
    "password_ref": "SECRET_STAGING_PASSWORD"
  }
  ```
- The executor resolves `password_ref` securely inside the execution environment at runtime without writing the value to test case records.

### 4.3 Sanitized Logging & Error Masking
- The Pino logging middleware and Selenium execution logger inspect all strings and redact common sensitive patterns:
  - Passwords: `(?i)(password|secret|token|api[_-]?key)=[^& ]+`
  - Authorization headers: `Bearer [A-Za-z0-9\-._~+/]+=*`
  - Credit card numbers / SSNs via regex masks.
- Stack traces and internal server IPs are stripped from all public API error envelopes.

---

## 5. Input Validation & Bounded Limits

To guard against Denial-of-Service (DoS) and Regular Expression Denial-of-Service (ReDoS):
- **Requirement Length Limits:** Maximum 4,000 characters per requirement.
- **Payload Size Limits:** Express JSON body parser limited to 1 MB.
- **Step Bounding:** Generated test cases are constrained to a maximum of 25 steps.
- **Rate Limiting:** Public endpoints are protected by `express-rate-limit` (default: 100 requests per 15 minutes per IP; 10 generation jobs per hour per user).

