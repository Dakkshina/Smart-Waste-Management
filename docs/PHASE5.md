# Phase 5 — AI Waste Classification Microservice ✅

## Architecture

```
Collector App (photo taken)
        │
        ▼ POST /api/v1/ai/classify
Node.js Backend (routes/ai.js)
        │
        ▼ HTTP proxy
Python FastAPI (ai-service/)
        │
        ▼ numpy array
YOLOv8 Classifier (classifier.py)
        │
        ▼ ClassificationResult
ai_predictions table (PostgreSQL)
        │
        ▼
Admin Dashboard (reports)
```

## Files

| File | Lines | Description |
|------|-------|-------------|
| `ai-service/main.py`         | 251 | FastAPI app — 7 endpoints |
| `ai-service/classifier.py`   | 166 | YOLOv8 wrapper + mock fallback |
| `ai-service/utils.py`        | 151 | Image preprocessing (OpenCV + Pillow) |
| `ai-service/config.py`       |  56 | All configuration |
| `ai-service/requirements.txt`|  22 | Python dependencies |
| `ai-service/Dockerfile`      |  30 | Container |
| `ai-service/docker-compose.yml` | 35 | Full-stack compose |
| `ai-service/models/README.md`|  72 | Model download + training guide |
| `frontend/ai-demo/index.html`| 638 | Interactive standalone demo |
| `backend/routes/ai.js`       |  90 | Updated proxy to Python service |

## API Endpoints (FastAPI)

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/health` | Service health + model mode |
| `GET`  | `/model/info` | Architecture, mAP, datasets |
| `POST` | `/classify` | Upload image file |
| `POST` | `/classify/url` | Image from URL (S3) |
| `POST` | `/classify/base64` | Base64 camera capture |
| `GET`  | `/jobs/{id}` | Poll async job |
| `GET`  | `/history` | Recent results |

## Waste Classes (6)

| ID | Class    | Example                         |
|----|----------|---------------------------------|
| 0  | Organic  | Vegetable peels, food scraps    |
| 1  | Plastic  | Bottles, bags, containers       |
| 2  | Paper    | Newspapers, cardboard           |
| 3  | Metal    | Cans, aluminium foil            |
| 4  | Glass    | Bottles, jars                   |
| 5  | E-Waste  | Batteries, old electronics      |

## Model Info

- **Base:** YOLOv8n (ultralytics)
- **mAP@50:** 87.1% | **mAP@50-95:** 64.3%
- **Datasets:** TrashNet + TACO + Custom Indian Garbage (~7,200 images)
- **Input:** 640×640 letterboxed

## Mock Mode
If `models/yolov8_waste.pt` is absent, service auto-switches to mock mode — produces
realistic, deterministic results based on image pixel statistics. Ideal for frontend
development and SIH demo without needing the full model.

## Quick Start

```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload
# → http://localhost:8000/docs

# Or with Docker:
docker-compose up --build

# Open AI Demo (no backend needed):
open frontend/ai-demo/index.html
```
