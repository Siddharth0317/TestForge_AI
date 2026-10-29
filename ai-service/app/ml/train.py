import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Tuple

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.dummy import DummyClassifier
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    classification_report,
    confusion_matrix,
)
import joblib

# Ensure app package is importable
current_dir = Path(__file__).resolve().parent
ai_service_root = current_dir.parent.parent
if str(ai_service_root) not in sys.path:
    sys.path.insert(0, str(ai_service_root))

from app.nlp.normalizer import RequirementNormalizer


def load_dataset(dataset_path: Path) -> Tuple[list, list]:
    """Loads and validates requirement classification dataset."""
    with open(dataset_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Normalize each text sample using standard normalizer to eliminate preprocessing discrepancy
    texts = []
    labels = []
    seen_texts = set()

    for item in data:
        _, norm = RequirementNormalizer.normalize(item["text"])
        if norm in seen_texts:
            raise ValueError(f"Duplicate requirement text detected in dataset: {norm}")
        seen_texts.add(norm)
        texts.append(norm)
        labels.append(item["category"])

    return texts, labels


def train_and_evaluate(
    data_path: Path = None,
    output_dir: Path = None,
    random_state: int = 42,
) -> Dict[str, Any]:
    """
    Executes reproducible ML training and evaluation workflow conforming to Spec.md Section 9.4.
    """
    if data_path is None:
        data_path = ai_service_root / "data" / "requirements_dataset.json"
    if output_dir is None:
        output_dir = current_dir / "artifacts"

    output_dir.mkdir(parents=True, exist_ok=True)

    # 1. Load data
    texts, labels = load_dataset(data_path)
    classes = sorted(list(set(labels)))

    # 2. Stratified train (70%), validation (15%), test (15%) split
    # Step A: Split 70% train, 30% temp (val+test)
    X_train, X_temp, y_train, y_temp = train_test_split(
        texts,
        labels,
        test_size=0.30,
        random_state=random_state,
        stratify=labels,
    )

    # Step B: Split temp equally into validation (15%) and test (15%)
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp,
        y_temp,
        test_size=0.50,
        random_state=random_state,
        stratify=y_temp,
    )

    # 3. Train Baseline Model (Most Frequent Class)
    baseline = DummyClassifier(strategy="most_frequent")
    baseline.fit(X_train, y_train)
    y_pred_baseline = baseline.predict(X_test)
    baseline_acc = float(accuracy_score(y_test, y_pred_baseline))
    baseline_macro_f1 = float(f1_score(y_test, y_pred_baseline, average="macro", zero_division=0))

    # 4. Train Primary Model: TF-IDF + Balanced Logistic Regression
    pipeline = Pipeline([
        (
            "tfidf",
            TfidfVectorizer(
                ngram_range=(1, 2),
                min_df=1,
                sublinear_tf=True,
                lowercase=True,
            ),
        ),
        (
            "clf",
            LogisticRegression(
                class_weight="balanced",
                random_state=random_state,
                max_iter=1000,
                C=2.0,
            ),
        ),
    ])

    pipeline.fit(X_train, y_train)

    # 5. Evaluate on Held-Out Test Set (Never leaked to training or hyperparameter tuning)
    y_pred = pipeline.predict(X_test)
    test_acc = float(accuracy_score(y_test, y_pred))
    test_macro_f1 = float(f1_score(y_test, y_pred, average="macro", zero_division=0))
    test_weighted_f1 = float(f1_score(y_test, y_pred, average="weighted", zero_division=0))

    report_dict = classification_report(
        y_test,
        y_pred,
        target_names=classes,
        output_dict=True,
        zero_division=0,
    )

    cm = confusion_matrix(y_test, y_pred, labels=classes).tolist()

    # 6. Save Model Artifact
    model_path = output_dir / "model.joblib"
    joblib.dump(pipeline, model_path)

    # 7. Assemble Metadata & Provenance Manifest
    metadata = {
        "model_name": "requirement-classifier-tfidf-logreg",
        "version": "v1.0.0-baseline",
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "random_seed": random_state,
        "dataset_path": str(data_path),
        "total_samples": len(texts),
        "classes": classes,
        "split_distribution": {
            "train_samples": len(X_train),
            "val_samples": len(X_val),
            "test_samples": len(X_test),
        },
        "baseline_comparison": {
            "baseline_type": "DummyClassifier(most_frequent)",
            "baseline_accuracy": baseline_acc,
            "baseline_macro_f1": baseline_macro_f1,
        },
        "test_metrics": {
            "accuracy": test_acc,
            "macro_f1": test_macro_f1,
            "weighted_f1": test_weighted_f1,
            "per_class_report": report_dict,
            "confusion_matrix": cm,
        },
    }

    metadata_path = output_dir / "model_metadata.json"
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    # 8. Generate Human-Readable Markdown Evaluation Report
    report_md_path = output_dir / "evaluation_report.md"
    with open(report_md_path, "w", encoding="utf-8") as f:
        f.write(f"# Model Evaluation Report: Requirement Category Classifier\n\n")
        f.write(f"- **Model:** `requirement-classifier-tfidf-logreg` (`v1.0.0-baseline`)\n")
        f.write(f"- **Trained Date:** {metadata['trained_at']}\n")
        f.write(f"- **Total Dataset Size:** {len(texts)} samples across {len(classes)} classes\n")
        f.write(f"- **Train / Val / Test Splits:** {len(X_train)} / {len(X_val)} / {len(X_test)}\n\n")
        f.write(f"## 1. Overall Performance vs. Baseline\n\n")
        f.write(f"| Metric | Dummy Baseline | Trained TF-IDF + LogReg |\n")
        f.write(f"| :--- | :---: | :---: |\n")
        f.write(f"| **Accuracy** | {baseline_acc:.4f} | **{test_acc:.4f}** |\n")
        f.write(f"| **Macro F1** | {baseline_macro_f1:.4f} | **{test_macro_f1:.4f}** |\n")
        f.write(f"| **Weighted F1** | N/A | **{test_weighted_f1:.4f}** |\n\n")
        f.write(f"## 2. Per-Class Test Set Performance\n\n")
        f.write(f"| Category | Precision | Recall | F1-Score | Support |\n")
        f.write(f"| :--- | :---: | :---: | :---: | :---: |\n")
        for cls_name in classes:
            metrics = report_dict[cls_name]
            f.write(f"| `{cls_name}` | {metrics['precision']:.3f} | {metrics['recall']:.3f} | {metrics['f1-score']:.3f} | {int(metrics['support'])} |\n")
        f.write(f"\n## 3. Confusion Matrix\n\n")
        f.write(f"Classes: `{', '.join(classes)}`\n\n")
        f.write(f"```json\n{json.dumps(cm, indent=2)}\n```\n")

    return metadata


if __name__ == "__main__":
    meta = train_and_evaluate()
    print("Training and evaluation completed successfully.")
    print(f"Test Accuracy: {meta['test_metrics']['accuracy']:.4f}")
    print(f"Test Macro F1: {meta['test_metrics']['macro_f1']:.4f}")

