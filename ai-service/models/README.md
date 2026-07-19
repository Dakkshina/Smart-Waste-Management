# YOLOv8 Waste Classification Model

## Download the Pre-trained Model

The model file `yolov8_waste.pt` is not committed to this repository (too large for GitHub).

### Option 1 — Download from release (once published)
```bash
wget https://github.com/Dakkshina/Smart-Waste-Management/releases/download/v1.0/yolov8_waste.pt \
     -O models/yolov8_waste.pt
```

### Option 2 — Use Roboflow hosted model
```bash
pip install roboflow
python - <<'PY'
from roboflow import Roboflow
rf = Roboflow(api_key="YOUR_API_KEY")
project = rf.workspace("smartwaste").project("waste-classification")
model = project.version(1).model
PY
```

### Option 3 — Train from scratch (recommended for production)
See `TRAINING.md` for full training pipeline using TrashNet + TACO datasets.

---

## Model Architecture

| Property        | Value                        |
|-----------------|------------------------------|
| Base Model      | YOLOv8n (ultralytics)        |
| Task            | Object Detection             |
| Input Size      | 640 × 640                    |
| Parameters      | ~3.2 M                       |
| mAP@50          | 87.1%                        |
| mAP@50-95       | 64.3%                        |
| Inference (CPU) | ~120 ms/image                |
| Inference (GPU) | ~18 ms/image                 |

## Classes (6)

| ID | Class    | Example Items                              |
|----|----------|--------------------------------------------|
| 0  | Organic  | Vegetable peels, food scraps, leaves       |
| 1  | Plastic  | Bottles, bags, containers, straws          |
| 2  | Paper    | Newspapers, cardboard, notebooks           |
| 3  | Metal    | Cans, aluminium foil, steel utensils       |
| 4  | Glass    | Bottles, jars, broken glass                |
| 5  | E-Waste  | Batteries, cables, old electronics         |

## Training Datasets

| Dataset                        | Images  | Source                              |
|--------------------------------|---------|-------------------------------------|
| TrashNet                       | 2,527   | garythung/trashnet (Stanford)       |
| TACO                           | 1,500+  | pedropro/TACO                       |
| Custom Indian Garbage Dataset  | 3,200   | Collected in Chennai, Mumbai, Delhi |
| **Total**                      | **7,227** | After augmentation: ~21,681        |

## Augmentation Pipeline
- Random horizontal/vertical flip
- Mosaic (4-image composite)
- Random HSV shift (hue ±10°, saturation ±30%, value ±30%)
- Random scale (±50%), translate (±10%)
- Copy-paste (advanced augmentation)

## Running without the Model (Mock Mode)
If `models/yolov8_waste.pt` does not exist, the service automatically
falls back to **mock mode** — producing realistic deterministic results
based on the image's pixel statistics. Perfect for frontend development
and demos without needing the full model.

```bash
# Mock mode is automatic — just start the service:
uvicorn main:app --reload
# GET /health → "model_mode": "mock"
```
