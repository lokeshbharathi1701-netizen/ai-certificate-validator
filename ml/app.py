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
import sys
import uuid
import time
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS

from predict import predict
from ocr import extract_text
from cert_verifier import verify_certificate, CERT_TYPES

# ── Flask App Setup ───────────────────────────────────────────
app = Flask(__name__)

# Allow CORS from any localhost port (dev flexibility)
CORS(app, origins=[
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:4173",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:4173",
])

# Temp folder for uploaded images
UPLOAD_FOLDER = "temp_uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tiff", ".tif", ".pdf"}


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
    Analyze a certificate image for tampering detection.

    Request:
        Content-Type: multipart/form-data
        Field: 'image' (certificate image file)

    Response 200:
        {
            "prediction":        "Fake" | "Genuine",
            "confidence":        94.5,
            "boxes":             [{ x, y, width, height, confidence, class }, ...],
            "model_used":        "YOLOv8n (trained)" | "Simulation",
            "processing_time_ms": 320,
            "ocr": {
                "student":            "John Doe",
                "certificate_number": "CERT2024001",
                "institute":          "ABC University",
                "date":               "01-05-2024",
                "course":             "BSc Computer Science",
                "raw_text":           [...]
            },
            "summary": "... human-readable verdict ..."
        }

    Response 400:
        { "error": "message" }
    """
    total_start = time.time()

    # ── Cert type (OBC / Income / Marksheet / General) ────────────
    cert_type = request.form.get("cert_type", "general").lower().strip()
    if cert_type not in CERT_TYPES:
        cert_type = "general"
    print(f"📋  Certificate type : {CERT_TYPES.get(cert_type, 'General')}")

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

        # If PDF, convert first page to PNG using PyMuPDF
        image_path = temp_path
        if ext == '.pdf':
            try:
                import pymupdf
                print("📄  PDF detected — converting first page to image...")
                doc = pymupdf.open(temp_path)
                page = doc.load_page(0)
                mat = pymupdf.Matrix(2.0, 2.0)  # upscale for better OCR
                pix = page.get_pixmap(matrix=mat, alpha=False)
                image_path = temp_path + '.png'
                pix.save(image_path)
                doc.close()
                print(f"   PDF → image saved: {image_path}")
            except Exception as e:
                print('❌  PDF conversion failed:', e)
                try:
                    traceback.print_exc()
                except OSError:
                    traceback.print_exc(file=sys.stderr)
                return jsonify({"error": f"PDF conversion failed: {str(e)}"}), 500

        # ── Step 1: Deep CNN Tamper Detection ─────────────────
        print("🔍  Running Deep CNN inference...")
        cnn_result = predict(image_path)
        print(f"   Prediction    : {cnn_result['prediction']}")
        print(f"   Confidence    : {cnn_result['confidence']}%")
        print(f"   Boxes         : {len(cnn_result.get('boxes', []))} region(s)")
        print(f"   CNN time      : {cnn_result.get('processing_time_ms', '?')}ms")

        # ── Step 2: EasyOCR Extraction ────────────────────────
        print("📝  Running EasyOCR extraction...")
        ocr_start = time.time()
        ocr_result = extract_text(image_path)
        ocr_ms = int((time.time() - ocr_start) * 1000)
        print(f"   Student       : {ocr_result['student']}")
        print(f"   Cert No.      : {ocr_result['certificate_number']}")
        print(f"   Institute     : {ocr_result['institute']}")
        print(f"   Course        : {ocr_result['course']}")
        print(f"   OCR time      : {ocr_ms}ms")

        # ── Step 3: Type-specific verification ───────────────────
        print(f"🔎  Running type-specific verification ({cert_type})...")
        verify_result = verify_certificate(cert_type, ocr_result, cnn_result)
        print(f"   Auth. score   : {verify_result['authenticity_score']}%")
        print(f"   Is verified   : {verify_result['is_verified']}")

        # ── Step 4: Generate certificate image preview (Base64) ─────
        preview_image = None
        try:
            import base64
            import io
            from PIL import Image

            if os.path.exists(image_path):
                with Image.open(image_path) as pil_img:
                    if pil_img.mode in ("RGBA", "P"):
                        pil_img = pil_img.convert("RGB")
                    # Scale down slightly to ~1100px width max for snappy network & storage
                    max_w = 1100
                    if pil_img.width > max_w:
                        ratio = max_w / float(pil_img.width)
                        new_h = int(float(pil_img.height) * ratio)
                        pil_img = pil_img.resize((max_w, new_h), Image.Resampling.LANCZOS)
                    
                    buf = io.BytesIO()
                    pil_img.save(buf, format="JPEG", quality=80, optimize=True)
                    b64_str = base64.b64encode(buf.getvalue()).decode("utf-8")
                    preview_image = f"data:image/jpeg;base64,{b64_str}"
                    print(f"🖼️   Generated preview image ({len(preview_image)} chars)")
        except Exception as img_err:
            print(f"⚠️  Could not generate preview image: {img_err}")

        # ── Step 5: Build response ────────────────────────────
        total_ms = int((time.time() - total_start) * 1000)
        response = {
            "prediction":          cnn_result["prediction"],
            "confidence":          cnn_result["confidence"],
            "boxes":               cnn_result.get("boxes", []),
            "model_used":          cnn_result.get("model_used", "Custom Deep CNN (TamperNet)"),
            "processing_time_ms":  total_ms,
            "ocr": {
                "student":            ocr_result["student"],
                "certificate_number": ocr_result["certificate_number"],
                "institute":          ocr_result["institute"],
                "date":               ocr_result["date"],
                "course":             ocr_result["course"],
                "raw_text":           ocr_result.get("raw_text", []),
            },
            "verification": verify_result,
            "summary": _generate_summary(cnn_result, ocr_result, verify_result),
            "preview_image": preview_image,
        }

        print(f"✅  Analysis complete: {response['prediction']} in {total_ms}ms")
        return jsonify(response)

    except Exception as e:
        print(f"❌  Error during analysis: {e}")
        try:
            traceback.print_exc()
        except OSError:
            traceback.print_exc(file=sys.stderr)
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 500

    finally:
        # Always clean up the temp file
        # Clean up temp files (original upload and any converted image)
        try:
            if os.path.exists(temp_path):
                os.remove(temp_path)
            if image_path != temp_path and os.path.exists(image_path):
                os.remove(image_path)
        except Exception:
            pass


# ── Helper ────────────────────────────────────────────────────

def _generate_summary(visual_result: dict, ocr_result: dict, verify_result: dict = None) -> str:
    """Generate a human-readable one-paragraph analysis summary."""
    boxes   = visual_result.get("boxes", [])
    count   = len(boxes)
    conf    = visual_result["confidence"]
    pred    = visual_result["prediction"]
    student = ocr_result.get("student", "N/A")
    inst    = ocr_result.get("institute", "N/A")

    name_part = f" for {student}" if student not in ("N/A", "", None) else ""
    inst_part = f" from {inst}" if inst not in ("N/A", "", None) else ""

    verify_part = ""
    if verify_result:
        score   = verify_result.get("authenticity_score", 0)
        checks  = verify_result.get("checks", [])
        passed  = sum(1 for c in checks if c.get("status") == "pass")
        total   = len(checks)
        is_ver  = verify_result.get("is_verified", False)
        result_kw = "AUTHENTIC" if is_ver else "SUSPICIOUS"
        verify_part = (
            f" Document structure checks: {passed}/{total} passed "
            f"({score}% authenticity score — {result_kw})."
        )

    if pred == "Fake":
        region_text = (
            f"{count} suspicious region{'s' if count != 1 else ''}"
            if count else "suspicious visual patterns"
        )
        return (
            f"⚠️  The certificate{name_part}{inst_part} has been classified as FAKE "
            f"with {conf}% confidence. "
            f"The AI model detected {region_text} that are consistent with document tampering."
            f"{verify_part} "
            f"This certificate should NOT be accepted without further manual verification."
        )
    else:
        return (
            f"✅  The certificate{name_part}{inst_part} appears to be GENUINE "
            f"with {conf}% confidence. "
            f"No significant suspicious regions were detected during visual analysis."
            f"{verify_part} "
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
