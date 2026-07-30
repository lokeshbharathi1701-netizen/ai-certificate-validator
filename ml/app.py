"""
app.py — Flask REST API Server
================================
Provides the ML inference endpoints for the AI Certificate Detection system.
Accepts uploaded certificate images, runs YOLO detection + EasyOCR, and
returns a structured JSON analysis result.

Endpoints:
    GET  /health   — Server health check
    POST /predict  — Analyze a certificate image

Usage:
    python app.py

Default port: 5000
"""

import os
import uuid
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS

from predict import predict
from ocr import extract_text

# ── Flask App Setup ───────────────────────────────────────────
app = Flask(__name__)

# Allow CORS from React (5173) and Node.js (3001)
CORS(app, origins=[
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3001",
])

# Temp folder for uploaded images
UPLOAD_FOLDER = "temp_uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tiff", ".tif"}


def _allowed_file(filename: str) -> bool:
    """Check if the uploaded file has an allowed extension."""
    return os.path.splitext(filename.lower())[1] in ALLOWED_EXTENSIONS


# ── Routes ────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    """Health check — confirms the Flask API is running."""
    return jsonify({
        "status":  "ok",
        "message": "Flask ML API is running",
        "port":    5000,
        "endpoints": {
            "health":  "GET  /health",
            "predict": "POST /predict"
        }
    })


@app.route("/predict", methods=["POST"])
def predict_certificate():
    """
    Analyze a certificate image for forgery detection.

    Request:
        Content-Type: multipart/form-data
        Field: 'image' (certificate image file)

    Response 200:
        {
            "prediction":  "Fake" | "Genuine",
            "confidence":  94.5,
            "boxes":       [{ x, y, width, height, confidence, class }, ...],
            "model_used":  "YOLOv8n (trained)" | "Simulation",
            "ocr": {
                "student":            "John Doe",
                "certificate_number": "CERT2024001",
                "institute":          "ABC University",
                "date":               "01-05-2024",
                "course":             "BSc Computer Science"
            },
            "summary": "... human-readable verdict ..."
        }

    Response 400:
        { "error": "message" }
    """
    # ── Validate request ──────────────────────────────────────
    if "image" not in request.files:
        return jsonify({"error": "No 'image' file field found in request."}), 400

    file = request.files["image"]

    if not file or file.filename == "":
        return jsonify({"error": "No file selected."}), 400

    if not _allowed_file(file.filename):
        return jsonify({
            "error": (
                f"Unsupported file type. "
                f"Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        }), 400

    # ── Save to temp folder ───────────────────────────────────
    ext = os.path.splitext(file.filename.lower())[1]
    temp_name = f"{uuid.uuid4().hex}{ext}"
    temp_path = os.path.join(UPLOAD_FOLDER, temp_name)

    try:
        file.save(temp_path)
        print(f"\n📥  Received: {file.filename!r}  →  {temp_name}")

        # ── Step 1: YOLO Detection ────────────────────────────
        print("🔍  Running YOLO inference...")
        yolo_result = predict(temp_path)
        print(f"   Prediction : {yolo_result['prediction']}")
        print(f"   Confidence : {yolo_result['confidence']}%")
        print(f"   Boxes      : {len(yolo_result.get('boxes', []))} region(s)")

        # ── Step 2: EasyOCR Extraction ────────────────────────
        print("📝  Running EasyOCR extraction...")
        ocr_result = extract_text(temp_path)
        print(f"   Student    : {ocr_result['student']}")
        print(f"   Cert No.   : {ocr_result['certificate_number']}")
        print(f"   Institute  : {ocr_result['institute']}")
        print(f"   Course     : {ocr_result['course']}")

        # ── Step 3: Build response ────────────────────────────
        response = {
            "prediction":  yolo_result["prediction"],
            "confidence":  yolo_result["confidence"],
            "boxes":       yolo_result.get("boxes", []),
            "model_used":  yolo_result.get("model_used", "YOLOv8"),
            "ocr": {
                "student":            ocr_result["student"],
                "certificate_number": ocr_result["certificate_number"],
                "institute":          ocr_result["institute"],
                "date":               ocr_result["date"],
                "course":             ocr_result["course"],
            },
            "summary": _generate_summary(yolo_result, ocr_result),
        }

        print(f"✅  Analysis complete: {response['prediction']}")
        return jsonify(response)

    except Exception as e:
        print(f"❌  Error during analysis: {e}")
        traceback.print_exc()
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 500

    finally:
        # Always clean up the temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)


# ── Helper ────────────────────────────────────────────────────

def _generate_summary(yolo_result: dict, ocr_result: dict) -> str:
    """Generate a human-readable one-paragraph analysis summary."""
    boxes = yolo_result.get("boxes", [])
    count = len(boxes)
    conf = yolo_result["confidence"]
    pred = yolo_result["prediction"]

    if pred == "Fake":
        region_text = (
            f"{count} suspicious region{'s' if count != 1 else ''}"
            if count else "suspicious visual patterns"
        )
        return (
            f"⚠️  This certificate has been classified as FAKE with {conf}% confidence. "
            f"The AI model detected {region_text} that are consistent with document forgery. "
            f"This certificate should NOT be accepted without further manual verification."
        )
    else:
        return (
            f"✅  This certificate appears to be GENUINE with {conf}% confidence. "
            f"No significant suspicious regions were detected during visual analysis. "
            f"The document passed the AI verification checks, but manual verification "
            f"is always recommended for critical decisions."
        )


# ── Entry Point ───────────────────────────────────────────────

if __name__ == "__main__":
    print("\n🚀  Starting Flask ML API")
    print("=" * 50)
    print("   URL  :  http://localhost:5000")
    print("   GET  :  /health")
    print("   POST :  /predict")
    print("=" * 50 + "\n")
    app.run(host="0.0.0.0", port=5000, debug=True)
