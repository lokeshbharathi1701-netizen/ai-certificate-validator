"""
predict.py — YOLOv8 Inference Module
======================================
Loads the trained best.pt model and performs inference on certificate images.
Returns prediction (Fake/Genuine), confidence score, and bounding box data.

If best.pt is not yet trained, falls back to a deterministic simulation
so the frontend/API can still be tested end-to-end.
"""

import os
import hashlib
import random

# ── Path to trained weights ───────────────────────────────────
MODEL_PATH = os.path.join("runs", "detect", "train", "weights", "best.pt")
USE_SIMULATION = not os.path.exists(MODEL_PATH)

# Lazy-loaded model reference
_model = None

if USE_SIMULATION:
    print("⚠️  best.pt not found — using SIMULATION mode.")
    print(f"   Train first: python train.py")
    print(f"   Expected: {MODEL_PATH}")
else:
    print(f"✅  YOLO model found: {MODEL_PATH}")


# ── Model Loader ──────────────────────────────────────────────

def load_model():
    """Load and cache the YOLOv8 model (lazy loading for performance)."""
    global _model
    if _model is None:
        from ultralytics import YOLO
        print(f"🔄  Loading YOLO model from {MODEL_PATH} ...")
        _model = YOLO(MODEL_PATH)
        print("✅  YOLO model loaded")
    return _model


# ── Main Prediction Function ──────────────────────────────────

def predict(image_path: str) -> dict:
    """
    Run YOLOv8 inference on a certificate image.

    Args:
        image_path (str): Absolute or relative path to the certificate image.

    Returns:
        dict: {
            "prediction"  : "Fake" | "Genuine",
            "confidence"  : float (0–100),
            "boxes"       : list of { x, y, width, height, confidence, class },
            "model_used"  : str
        }
    """
    if USE_SIMULATION:
        return _simulate_prediction(image_path)

    model = load_model()

    # Run inference (conf threshold = 0.25)
    results = model(image_path, conf=0.25, verbose=False)

    boxes = []
    max_confidence = 0.0
    final_prediction = "Genuine"

    for result in results:
        img_h, img_w = result.orig_shape  # Original image dimensions

        for box in result.boxes:
            conf = float(box.conf[0])
            cls_id = int(box.cls[0])
            xyxy = box.xyxy[0].tolist()

            # Normalize coordinates to [0,1] range (for frontend canvas overlay)
            box_data = {
                "x":          round(xyxy[0] / img_w, 4),
                "y":          round(xyxy[1] / img_h, 4),
                "width":      round((xyxy[2] - xyxy[0]) / img_w, 4),
                "height":     round((xyxy[3] - xyxy[1]) / img_h, 4),
                "confidence": round(conf * 100, 1),
                "class":      result.names.get(cls_id, "suspicious_region")
            }
            boxes.append(box_data)

            # Track highest-confidence detection
            if conf > max_confidence:
                max_confidence = conf
                # Class IDs depend on your dataset labels in data.yaml
                # Typical: 0 = fake/forgery, 1 = genuine (adjust if needed)
                final_prediction = "Fake" if cls_id == 0 else "Genuine"

    # No detections → certificate is likely genuine
    if not boxes:
        final_prediction = "Genuine"
        max_confidence = 0.92  # High confidence = no forgery found

    return {
        "prediction":  final_prediction,
        "confidence":  round(max_confidence * 100, 1),
        "boxes":       boxes,
        "model_used":  "YOLOv8n (trained)"
    }


# ── Simulation Fallback ───────────────────────────────────────

def _simulate_prediction(image_path: str) -> dict:
    """
    Deterministic simulated prediction for development/demo.
    Produces consistent results for the same image file.

    TODO: Remove this when real model is trained and best.pt is available.
    """
    # Hash the file bytes for deterministic seeding
    try:
        with open(image_path, "rb") as f:
            file_hash = int(hashlib.md5(f.read()).hexdigest(), 16)
    except Exception:
        file_hash = 42

    rng = random.Random(file_hash)
    is_fake = rng.random() > 0.45  # ~55% chance of flagging as fake in simulation
    confidence = round(rng.uniform(72.0, 96.5), 1)

    boxes = []
    if is_fake:
        # Simulate 1–3 suspicious regions
        for i in range(rng.randint(1, 3)):
            boxes.append({
                "x":          round(rng.uniform(0.05, 0.65), 4),
                "y":          round(rng.uniform(0.05, 0.65), 4),
                "width":      round(rng.uniform(0.08, 0.28), 4),
                "height":     round(rng.uniform(0.04, 0.18), 4),
                "confidence": round(rng.uniform(68.0, 94.0), 1),
                "class":      "suspicious_region"
            })

    return {
        "prediction":  "Fake" if is_fake else "Genuine",
        "confidence":  confidence,
        "boxes":       boxes,
        "model_used":  "Simulation (train model for real results)"
    }
