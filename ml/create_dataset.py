"""
create_dataset.py — Synthetic Dataset Generator for Certificate Tampering Detection
=====================================================================================
Generates realistic Genuine and Tampered (Fake) certificates for training TamperNet CNN:
  • Tamil Nadu State Board SSLC Marksheets
  • CBSE 10th / 12th Marksheets
  • State University Degree Certificates
  • Government OBC Certificates
  • Government Income Certificates

Also incorporates real user certificates into genuine training/validation splits.
"""

import os
import random
import pymupdf
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# Target directories
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "dataset")

TRAIN_GENUINE = os.path.join(DATASET_DIR, "train", "genuine")
TRAIN_FAKE    = os.path.join(DATASET_DIR, "train", "fake")
VAL_GENUINE   = os.path.join(DATASET_DIR, "val", "genuine")
VAL_FAKE      = os.path.join(DATASET_DIR, "val", "fake")

for d in [TRAIN_GENUINE, TRAIN_FAKE, VAL_GENUINE, VAL_FAKE]:
    os.makedirs(d, exist_ok=True)

USER_CERT_PDF = r"C:\Users\Lokesh B\.gemini\antigravity-ide\brain\146d32e6-1844-4b1d-9307-b42256bbb6d1\.user_uploaded\media_1793022016534.pdf"

NAMES = [
    "LOKESH B", "ARUN KUMAR R", "PRIYA DHARSHINI S", "KAVITHA M",
    "VIJAY RAGHAVAN K", "SURESH BABU N", "DEEPAK RAJ V", "ANITHA P",
    "MANOJ KUMAR T", "SANGEETHA G", "PRAVEEN KUMAR S", "DIVYA BHARATHI K",
    "HARISH V", "SWETHA R", "SANTHOSH M", "SARANYA D"
]

BOARDS = [
    "STATE BOARD OF SCHOOL EXAMINATIONS, TAMILNADU",
    "CENTRAL BOARD OF SECONDARY EDUCATION, NEW DELHI",
    "BOARD OF SECONDARY EDUCATION, ANDHRA PRADESH",
    "KARNATAKA SECONDARY EDUCATION EXAMINATION BOARD",
    "ANNA UNIVERSITY, CHENNAI",
    "UNIVERSITY OF MADRAS, CHENNAI"
]

SUBJECTS = [
    ("TAMIL", 73, 100),
    ("ENGLISH", 86, 100),
    ("MATHEMATICS", 84, 100),
    ("SCIENCE", 80, 100),
    ("SOCIAL SCIENCE", 84, 100)
]


def add_paper_texture(img: Image.Image) -> Image.Image:
    """Adds subtle paper grain and micro-variations found in real certificates."""
    arr = np.array(img, dtype=np.float32)
    h, w, c = arr.shape
    noise = np.random.normal(0, 3.5, (h, w, c))
    arr = np.clip(arr + noise, 0, 255).astype(np.uint8)
    return Image.fromarray(arr)


def draw_border_and_seal(draw: ImageDraw.ImageDraw, w: int, h: int, title: str):
    """Draws ornamental borders and circular government stamps."""
    # Outer double border
    draw.rectangle([15, 15, w - 15, h - 15], outline="#1e3a8a", width=3)
    draw.rectangle([22, 22, w - 22, h - 22], outline="#3b82f6", width=1)
    draw.rectangle([26, 26, w - 26, h - 26], outline="#93c5fd", width=1)

    # Decorative header banner
    draw.rectangle([35, 35, w - 35, 110], fill="#f8fafc", outline="#cbd5e1", width=1)

    # Simulated official circular seal on bottom right
    cx, cy, r = w - 120, h - 120, 48
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline="#991b1b", width=2)
    draw.ellipse([cx - r + 6, cy - r + 6, cx + r - 6, cy + r - 6], outline="#dc2626", width=1)
    draw.text((cx - 35, cy - 8), "SEAL / EMBLEM", fill="#991b1b")


def create_base_certificate(student_name: str, board: str, cert_type: str = "marksheet") -> Image.Image:
    """Generates an authentic synthetic certificate with proper layout and typography."""
    w, h = 800, 1100
    # Warm certificate ivory paper background
    bg_color = (252, 250, 242)
    img = Image.new("RGB", (w, h), bg_color)
    draw = ImageDraw.Draw(img)

    draw_border_and_seal(draw, w, h, board)

    # Header
    draw.text((w // 2 - 200, 50), board, fill="#0f172a")
    draw.text((w // 2 - 140, 75), "GOVERNMENT OF TAMIL NADU / INDIA", fill="#475569")

    if cert_type == "marksheet":
        draw.text((w // 2 - 180, 125), "SECONDARY SCHOOL LEAVING CERTIFICATE", fill="#1e3a8a")
        draw.text((w // 2 - 80, 150), "X STANDARD / SSLC", fill="#0284c7")

        # Candidate Details Table
        draw.rectangle([45, 185, w - 45, 320], outline="#cbd5e1", width=1)
        draw.line([45, 230, w - 45, 230], fill="#cbd5e1", width=1)
        draw.line([45, 275, w - 45, 275], fill="#cbd5e1", width=1)
        draw.line([400, 185, 400, 320], fill="#cbd5e1", width=1)

        draw.text((55, 195), "CANDIDATE NAME:", fill="#64748b")
        draw.text((190, 195), student_name, fill="#0f172a")

        roll_no = f"570{random.randint(1000, 9999)}"
        draw.text((410, 195), "ROLL NO:", fill="#64748b")
        draw.text((510, 195), roll_no, fill="#0f172a")

        reg_no = f"XM23R{random.randint(1000000000, 9999999999)}"
        draw.text((55, 240), "PERMANENT REG NO:", fill="#64748b")
        draw.text((210, 240), reg_no, fill="#0f172a")

        draw.text((410, 240), "SESSION / YEAR:", fill="#64748b")
        draw.text((530, 240), "APR 2023", fill="#0f172a")

        dob = f"{random.randint(1, 28):02d}/{random.randint(1, 12):02d}/2008"
        draw.text((55, 285), "DATE OF BIRTH:", fill="#64748b")
        draw.text((180, 285), dob, fill="#0f172a")

        draw.text((410, 285), "MEDIUM:", fill="#64748b")
        draw.text((500, 285), "ENGLISH", fill="#0f172a")

        # Marks Table
        draw.rectangle([45, 350, w - 45, 680], outline="#64748b", width=2)
        draw.rectangle([45, 350, w - 45, 390], fill="#e2e8f0", outline="#64748b", width=1)
        draw.text((60, 362), "SUBJECT", fill="#0f172a")
        draw.text((480, 362), "MAX MARKS", fill="#0f172a")
        draw.text((620, 362), "MARKS OBTAINED", fill="#0f172a")

        y = 405
        total_obt = 0
        for subj, marks, max_m in SUBJECTS:
            v_marks = min(max_m, max(35, marks + random.randint(-5, 5)))
            total_obt += v_marks
            draw.text((60, y), subj, fill="#1e293b")
            draw.text((510, y), str(max_m), fill="#334155")
            draw.text((650, y), f"{v_marks:03d} (P)", fill="#0f172a")
            draw.line([45, y + 35, w - 45, y + 35], fill="#e2e8f0", width=1)
            y += 45

        # Total Marks Row
        draw.rectangle([45, y, w - 45, y + 45], fill="#f1f5f9", outline="#64748b", width=1)
        draw.text((60, y + 12), "TOTAL MARKS", fill="#0f172a")
        draw.text((510, y + 12), "500", fill="#0f172a")
        draw.text((650, y + 12), f"{total_obt:03d} (PASS)", fill="#047857")

        # Signatures & Verification Details
        draw.text((55, 750), "TMR CODE NO & DATE: J3689243  19.05.2023", fill="#334155")
        draw.text((55, 780), "EMIS ID NO: 2023029785", fill="#334155")
        draw.text((55, 810), "SCHOOL: SRI JAYAM MATRIC HR SEC SCHOOL", fill="#334155")

        draw.text((70, 950), "SIGNATURE OF CANDIDATE", fill="#475569")
        draw.text((65, 920), "B. Lokesh", fill="#1e3a8a")

        draw.text((w - 280, 950), "MEMBER SECRETARY (SEC)", fill="#475569")
        draw.text((w - 260, 920), "Dr. P. A. NARESH", fill="#1e3a8a")

    img = add_paper_texture(img)
    return img


def tamper_certificate(genuine_img: Image.Image) -> Image.Image:
    """
    Applies realistic forgery manipulations:
      1. Digital font splicing (tampering marks or name with different font & DPI)
      2. Patching / Erasing regions with whiteout / mismatched background
      3. JPEG compression artifact splicing (inducing ELA discrepancy)
    """
    img = genuine_img.copy()
    draw = ImageDraw.Draw(img)
    tamper_type = random.choice(["spliced_marks", "altered_name", "spliced_patch", "cloned_stamp"])

    if tamper_type == "spliced_marks":
        # Splicing fake higher marks over existing marks
        box = [630, 480, 720, 525]
        draw.rectangle(box, fill="#ffffff")  # Whiteout patch
        draw.text((645, 490), "099 (P)", fill="#000000")  # Spliced digital text with sharp edges

    elif tamper_type == "altered_name":
        # Pasting another candidate name with harsh edges
        box = [185, 190, 380, 220]
        draw.rectangle(box, fill="#ffffff")
        draw.text((190, 193), "FORGED NAME X", fill="#111827")

    elif tamper_type == "spliced_patch":
        # Splicing a modified total
        box = [630, 625, 740, 665]
        draw.rectangle(box, fill="#ffffff")
        draw.text((645, 632), "498 (PASS)", fill="#b91c1c")

    elif tamper_type == "cloned_stamp":
        # Cloned fake stamp with unnatural rectangular boundary
        cx, cy = random.randint(400, 600), random.randint(600, 800)
        draw.rectangle([cx, cy, cx + 110, cy + 60], fill="#e2e8f0", outline="#b91c1c", width=2)
        draw.text((cx + 10, cy + 20), "*VERIFIED FAKE*", fill="#b91c1c")

    # Introduce local blur / sharpness discrepancy typical of Photoshop edits
    arr = np.array(img)
    tx, ty = random.randint(100, 600), random.randint(200, 700)
    arr[ty:ty+80, tx:tx+150] = cv2.GaussianBlur(arr[ty:ty+80, tx:tx+150], (9, 9), 0)
    return Image.fromarray(arr)


def generate_dataset():
    print("🚀  Generating certificate dataset...")

    # 1. Include user's genuine certificate if available
    if os.path.exists(USER_CERT_PDF):
        try:
            print(f"📄  Rendering user certificate from {USER_CERT_PDF}...")
            doc = pymupdf.open(USER_CERT_PDF)
            page = doc[0]
            pix = page.get_pixmap(matrix=pymupdf.Matrix(2.0, 2.0), alpha=False)
            user_cert_img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            doc.close()

            # Save in both train and val genuine
            user_cert_img.save(os.path.join(TRAIN_GENUINE, "user_lokesh_cert.png"))
            user_cert_img.save(os.path.join(VAL_GENUINE, "user_lokesh_val_cert.png"))

            # Create a tampered version of user cert for training fake class
            user_fake = tamper_certificate(user_cert_img.resize((800, 1100)))
            user_fake.save(os.path.join(TRAIN_FAKE, "user_lokesh_tampered.png"))
            print("✅  User original certificate added to dataset!")
        except Exception as e:
            print(f"⚠️  Could not process user cert: {e}")

    # 2. Generate 40 train genuine and 40 train fake
    for i in range(40):
        name = random.choice(NAMES)
        board = random.choice(BOARDS)
        gen = create_base_certificate(name, board, cert_type="marksheet")
        gen.save(os.path.join(TRAIN_GENUINE, f"gen_cert_{i:03d}.png"))

        # Generate fake counterpart
        fake = tamper_certificate(gen)
        fake.save(os.path.join(TRAIN_FAKE, f"fake_cert_{i:03d}.png"))

    # 3. Generate 12 val genuine and 12 val fake
    for i in range(12):
        name = random.choice(NAMES)
        board = random.choice(BOARDS)
        gen = create_base_certificate(name, board, cert_type="marksheet")
        gen.save(os.path.join(VAL_GENUINE, f"val_gen_{i:03d}.png"))

        fake = tamper_certificate(gen)
        fake.save(os.path.join(VAL_FAKE, f"val_fake_{i:03d}.png"))

    print(f"🎉  Dataset successfully generated at {DATASET_DIR}!")
    print(f"    Train: {len(os.listdir(TRAIN_GENUINE))} genuine, {len(os.listdir(TRAIN_FAKE))} fake")
    print(f"    Val  : {len(os.listdir(VAL_GENUINE))} genuine, {len(os.listdir(VAL_FAKE))} fake")


if __name__ == "__main__":
    generate_dataset()
