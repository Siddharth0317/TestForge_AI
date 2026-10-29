# TestForge AI — Evaluation & Verification Plan

**Status:** Approved baseline for implementation  
**Version:** 1.0  
**Companion Documents:** `Spec.md`, `docs/architecture.md`, `PHASE_CHECKLIST.md`

---

## 1. Evaluation Architecture: The Three Independent Pillars

A central architectural mandate of `Spec.md` is that different categories of system performance must never be conflated into a single misleading "AI accuracy" metric. TestForge AI enforces three separate evaluation pillars:

```
+-----------------------------------------------------------------------------------------+
|                               Three Independent Pillars                                 |
+-----------------------------+-----------------------------+-----------------------------+
|          Pillar 1           |          Pillar 2           |          Pillar 3           |
|  ML Requirement Classifier  |   LLM Test Generation       |   Browser Execution         |
|  Evaluation                 |   Quality Evaluation        |   Reliability Evaluation    |
+-----------------------------+-----------------------------+-----------------------------+
| - Supervised classification | - Semantic quality rubric   | - Real browser run outcomes |
| - Offline, reproducible     | - Curated benchmark dataset | - Deterministic assertions  |
| - Held-out test split       | - 8-dimension scoring       | - Pass / Fail / Error split |
| - Precision, Recall, F1     | - Human QA expert review    | - Flake & timeout rates     |
+-----------------------------+-----------------------------+-----------------------------+
```

---

## 2. Pillar 1: ML Requirement Classifier Evaluation

### 2.1 Label Taxonomy
The requirement classifier categorizes software requirements to assist in test prioritization and template selection.
- `authentication_security` (Login, registration, password policy, session, token)
- `data_validation_crud` (Forms, input limits, database persistence, CRUD operations)
- `workflow_navigation` (Multi-step wizards, page transitions, checkout processes)
- `error_handling_resilience` (Graceful failure, network retry, lockout alerts)
- `non_functional_performance` (Load limits, response times, accessibility, browser compatibility)

### 2.2 Dataset Management & Splitting Strategy
- **Provenance:** Curated corpus of software requirements derived from public software engineering datasets (e.g., PROMISE, PURE) and domain-specific synthetic fixtures in `ai-service/datasets/`.
- **Deduplication Check:** Requirements are sanitized and deduplicated using fuzzy string matching before splitting to prevent train/test data leakage.
- **Stratified Split:** 80% Training, 10% Validation, 10% Held-out Test.
- **Reproducibility:** Splits and model fitting are pinned to `random_state=42`.

### 2.3 Baseline & Model Comparison
1. **Baseline 1:** Dummy Classifier (`strategy="most_frequent"`).
2. **Baseline 2:** Simple Keyword Rule Matcher.
3. **Primary Model:** TF-IDF Vectorizer (`ngram_range=(1,2)`, `max_features=5000`) + Multinomial Logistic Regression (`C=1.0`, `solver="lbfgs"`).

### 2.4 Metrics & Artifact Reporting
Evaluation scripts (`ai-service/scripts/evaluate_classifier.py`) output:
- Per-class Precision, Recall, and F1-Score.
- Macro-averaged and Weighted-averaged F1-Score.
- Full Confusion Matrix saved as JSON and Markdown.
- Model artifact version metadata recorded via `joblib`.

---

## 3. Pillar 2: LLM Test Case Generation Quality Evaluation

The LLM is evaluated on its ability to produce valid, actionable, and faithful candidate test cases without hallucinating undocumented business behavior.

### 3.1 Curated Benchmark Dataset
A held-out evaluation set of 50 diverse software requirements across all categories is maintained in `shared/fixtures/evaluation_requirements.json`. Each entry includes:
- Source requirement text.
- Verified ground-truth category.
- Reference expected outcomes.
- Identified boundary conditions and ambiguities.

### 3.2 Eight-Dimension Evaluation Rubric
Each generated test case is scored across eight deterministic and expert-reviewed dimensions:

| Dimension | Metric / Criteria | Verification Method | Pass Target |
|---|---|---|---|
| **1. Schema Validity** | Adherence to Pydantic/JSON Schema contracts | Automated Schema Validator | **100%** |
| **2. Requirement Fidelity** | All steps and assertions are directly supported by text | Expert QA review / span match | **>= 90%** |
| **3. Traceability** | Source evidence spans accurately cite source requirement | Automated substring search | **100%** |
| **4. Testability** | Expected result maps to an observable assertion | Automated assertion check | **100%** |
| **5. Scenario Diversity** | Produces positive, negative, and boundary scenarios | Category distribution check | Balanced |
| **6. Assumption Clarity** | Undocumented behaviors are explicitly flagged in `assumptions` | Human QA review | **100% flagged** |
| **7. Duplicate Rate** | Redundant or identical candidate cases within a run | Semantic Jaccard / Cosine check | **< 10%** |
| **8. Automation Readiness** | Actions belong exclusively to allowed action vocabulary | Automated action allowlist | **100%** |

---

## 4. Pillar 3: Browser Execution Reliability Evaluation

Browser execution must be evaluated based on execution stability and truthful outcome reporting, distinguishing product defects from infrastructure failures.

### 4.1 Outcome Classification Vocabulary
Every executed test run must be classified into one of six mutually exclusive states:
1. `passed`: All step actions and explicit assertions succeeded.
2. `failed`: Target application responded, but one or more assertions failed (e.g. expected banner missing).
3. `error`: Selenium/browser crash, driver timeout, or internal worker failure prevented assertion evaluation.
4. `blocked`: Prerequisite or target environment was unreachable.
5. `not_executable`: Required locator keys or test data references were missing in environment configuration.
6. `cancelled`: Execution was explicitly cancelled by the user.

### 4.2 Execution Reliability Benchmark (Local CI Fixture)
Automated end-to-end tests run against the local CI fixture (`automation/fixture_app/`) to verify:
- Repeatability: 20 consecutive runs of positive test cases must yield 100% `passed`.
- Negative path correctness: Intentionally invalid credentials must reliably yield `failed` assertion without driver crash.
- Unregistered locator handling: Missing locator keys must trigger `not_executable` before browser launch.
- Host violation handling: Disallowed target hosts must fail preflight check immediately.
- Driver timeout handling: Simulated frozen browser must trigger `error` and clean up the Chrome process within 30 seconds.

