# Model Evaluation Report: Requirement Category Classifier

- **Model:** `requirement-classifier-tfidf-logreg` (`v1.0.0-baseline`)
- **Trained Date:** 2026-10-29T08:42:39.964768+00:00
- **Total Dataset Size:** 108 samples across 6 classes
- **Train / Val / Test Splits:** 75 / 16 / 17

## 1. Overall Performance vs. Baseline

| Metric | Dummy Baseline | Trained TF-IDF + LogReg |
| :--- | :---: | :---: |
| **Accuracy** | 0.1765 | **0.7059** |
| **Macro F1** | 0.0500 | **0.7048** |
| **Weighted F1** | N/A | **0.7070** |

## 2. Per-Class Test Set Performance

| Category | Precision | Recall | F1-Score | Support |
| :--- | :---: | :---: | :---: | :---: |
| `authentication` | 0.500 | 0.667 | 0.571 | 3 |
| `business_logic` | 1.000 | 0.500 | 0.667 | 2 |
| `data_integrity` | 0.667 | 0.667 | 0.667 | 3 |
| `error_handling` | 1.000 | 0.667 | 0.800 | 3 |
| `security` | 0.667 | 0.667 | 0.667 | 3 |
| `validation` | 0.750 | 1.000 | 0.857 | 3 |

## 3. Confusion Matrix

Classes: `authentication, business_logic, data_integrity, error_handling, security, validation`

```json
[
  [
    2,
    0,
    1,
    0,
    0,
    0
  ],
  [
    0,
    1,
    0,
    0,
    0,
    1
  ],
  [
    0,
    0,
    2,
    0,
    1,
    0
  ],
  [
    1,
    0,
    0,
    2,
    0,
    0
  ],
  [
    1,
    0,
    0,
    0,
    2,
    0
  ],
  [
    0,
    0,
    0,
    0,
    0,
    3
  ]
]
```
