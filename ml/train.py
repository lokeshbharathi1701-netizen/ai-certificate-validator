"""
train.py — YOLOv8 Training Script
====================================
Trains a YOLOv8n model on the Roboflow Certificate Forgery Dataset.

Prerequisites:
    • Dataset must be placed at: dataset/
    • Structure: dataset/train/, dataset/valid/, dataset/test/, dataset/data.yaml
    • Install deps:  pip install -r requirements.txt

Usage:
    python train.py

Output:
    Best model weights saved to: runs/detect/train/weights/best.pt
"""

import os
import sys


def check_dataset():
    """Verify dataset structure before training."""
    required_paths = [
        "dataset/data.yaml",
        "dataset/train/images",
        "dataset/train/labels",
        "dataset/valid/images",
        "dataset/valid/labels",
    ]
    missing = [p for p in required_paths if not os.path.exists(p)]

    if missing:
        print("❌  Dataset not found or incomplete!")
        print("    Missing paths:")
        for p in missing:
            print(f"      • {p}")
        print("\n📌  Expected dataset structure:")
        print("      dataset/")
        print("        ├── train/images/   ← training certificate images")
        print("        ├── train/labels/   ← YOLO label .txt files")
        print("        ├── valid/images/   ← validation images")
        print("        ├── valid/labels/")
        print("        ├── test/images/    (optional)")
        print("        └── data.yaml       ← dataset config")
        print("\n💡  Download from Roboflow and export as 'YOLOv8' format.")
        sys.exit(1)

    print("✅  Dataset found!")


def train():
    """Run YOLOv8 training on the certificate dataset."""
    check_dataset()

    from ultralytics import YOLO

    print("\n🚀  Starting YOLOv8 Training")
    print("=" * 50)
    print("   Model   : yolov8n.pt (nano — fast, lightweight)")
    print("   Epochs  : 50")
    print("   Image   : 640×640")
    print("   Device  : CPU (change to device=0 for GPU)")
    print("=" * 50)

    # Load the base YOLOv8 nano model (downloads ~6 MB automatically)
    model = YOLO("yolov8n.pt")

    # Train on the certificate dataset
    results = model.train(
        data="dataset/data.yaml",   # Path to dataset config
        epochs=50,                   # Number of training epochs
        imgsz=640,                   # Input image size
        batch=16,                    # Batch size (reduce if OOM)
        lr0=0.01,                    # Initial learning rate
        lrf=0.01,                    # Final lr (as fraction of lr0)
        momentum=0.937,
        weight_decay=0.0005,
        warmup_epochs=3,
        patience=10,                 # Early stopping patience
        project="runs/detect",       # Output project folder
        name="train",                # Run name
        save=True,                   # Save best.pt and last.pt
        save_period=-1,              # Only save best (not every epoch)
        device="cpu",                # Change to "0" for GPU
        workers=2,                   # Dataloader workers
        verbose=True,
        exist_ok=True,               # Allow re-running in same dir
    )

    best_path = "runs/detect/train/weights/best.pt"
    print("\n" + "=" * 50)
    print("✅  Training Complete!")
    print(f"📁  Best model : {best_path}")
    print(f"📊  Results    : runs/detect/train/")
    print("=" * 50)
    print("\n📌  Next steps:")
    print("    1. Ensure best.pt exists at:", best_path)
    print("    2. Start Flask API: python app.py")
    print("    3. Start Node.js:   cd ../server && npm start")
    print("    4. Start React:     cd ../client && npm run dev")

    return results


if __name__ == "__main__":
    train()
