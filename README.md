# CertVerify AI — Certificate Authenticity & Tampering Detection System

AI-powered certificate authenticity verification using **YOLOv8** object detection and **EasyOCR** text extraction, presented through a stunning glassmorphism React frontend.

---

## Architecture

```
┌─────────────────┐     /api/upload      ┌──────────────────┐     /predict     ┌──────────────────┐
│  React + Vite   │ ──────────────────►  │  Node.js Express │ ──────────────►  │  Flask + YOLOv8  │
│  :5173          │                      │  :3001           │                  │  :5000           │
└─────────────────┘                      └──────────────────┘                  └──────────────────┘
```

---

## Quick Start

### 1 — Python ML API (Flask)
```powershell
# Run in a dedicated terminal
cd "A:\CODING WORK\Ideathon\Project-1\ml"
pip install -r requirements.txt
python app.py
# Runs on http://localhost:5000
```
> No model weights? It auto-falls back to simulation mode — perfect for demos.

### 2 — Node.js Backend
```powershell
# Run in a dedicated terminal
cd "A:\CODING WORK\Ideathon\Project-1\server"
npm install
npm run dev
# Runs on http://localhost:3001
```

### 3 — React Frontend
```powershell
# Run in a dedicated terminal
cd "A:\CODING WORK\Ideathon\Project-1\client"
npm install
node node_modules/vite/bin/vite.js --port 5173
# Opens http://localhost:5173
```

---

## Features

- 🧠 **YOLOv8 Detection** — Locates forged/tampered regions with bounding boxes
- 🔍 **EasyOCR Extraction** — Extracts student name, cert number, institute, date, course
- ⚡ **Real-time Analysis** — Full pipeline in seconds
- 🎨 **Premium UI** — Dark glassmorphism, animated confidence meter, bounding box overlay
- 🛡️ **Simulation Mode** — Works without trained model weights (for demos)

---

## Training the Model

```powershell
cd "A:\CODING WORK\Ideathon\Project-1\ml"
# 1. Download your certificate dataset from Roboflow in YOLOv8 format
# 2. Place it at ml/dataset/ with the structure:
#    dataset/train/images, dataset/train/labels
#    dataset/valid/images, dataset/valid/labels
#    dataset/data.yaml
python train.py
# Saves best.pt to runs/detect/train/weights/best.pt
```
