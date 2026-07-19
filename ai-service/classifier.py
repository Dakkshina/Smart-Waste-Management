"""
SmartWaste AI Service — YOLOv8 Waste Classifier
Wraps ultralytics YOLOv8 with a realistic mock fallback for demo/testing.
"""
import os, random, logging, time
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import numpy as np
import config

logger = logging.getLogger(__name__)


class ClassificationResult:
    """Structured output from the waste classifier."""

    def __init__(
        self,
        class_percentages: Dict[str, float],
        confidence: float,
        raw_detections: List[dict],
        model_version: str,
        inference_ms: float,
    ):
        self.class_percentages = class_percentages          # {"Organic": 42.1, ...}
        self.confidence        = round(confidence, 2)
        self.raw_detections    = raw_detections
        self.model_version     = model_version
        self.inference_ms      = round(inference_ms, 1)
        self.mixed_waste       = self._check_mixed()
        self.segregation_pass  = not self.mixed_waste
        self.dominant_class    = max(class_percentages, key=class_percentages.get)
        self.total_area_pct    = round(sum(class_percentages.values()), 1)

    def _check_mixed(self) -> bool:
        """Return True if incompatible waste types both exceed MIXED_WASTE_THRESHOLD."""
        pct = self.class_percentages
        for a, b in config.INCOMPATIBLE_PAIRS:
            if pct.get(a, 0) > config.MIXED_WASTE_THRESHOLD and \
               pct.get(b, 0) > config.MIXED_WASTE_THRESHOLD:
                return True
        return False

    def to_dict(self) -> dict:
        return {
            "class_percentages": self.class_percentages,
            "dominant_class":    self.dominant_class,
            "confidence":        self.confidence,
            "mixed_waste":       self.mixed_waste,
            "segregation_pass":  self.segregation_pass,
            "inference_ms":      self.inference_ms,
            "model_version":     self.model_version,
            "total_area_pct":    self.total_area_pct,
            "raw_detections":    self.raw_detections,
        }


class WasteClassifier:
    """
    YOLOv8 waste classifier with automatic mock fallback.

    - If models/yolov8_waste.pt exists → loads real YOLOv8 model
    - Otherwise           → uses a seeded mock that produces realistic results
    """

    def __init__(self):
        self.model       = None
        self.is_loaded   = False
        self.model_path  = config.MODEL_PATH
        self._try_load()

    # ── Model Loading ────────────────────────────────────────
    def _try_load(self):
        if not Path(self.model_path).exists():
            logger.warning(
                f"[AI] Model file not found at '{self.model_path}'. "
                "Running in MOCK mode. See models/README.md to download."
            )
            return
        try:
            from ultralytics import YOLO        # only imported if model exists
            self.model     = YOLO(self.model_path)
            self.is_loaded = True
            logger.info(f"[AI] YOLOv8 model loaded from '{self.model_path}'")
        except Exception as e:
            logger.error(f"[AI] Failed to load model: {e}. Falling back to mock.")

    # ── Public API ───────────────────────────────────────────
    def classify(self, image_array: np.ndarray) -> ClassificationResult:
        """Classify a numpy BGR image array."""
        start = time.perf_counter()
        if self.is_loaded:
            result = self._real_inference(image_array)
        else:
            result = self._mock_inference(image_array)
        result.inference_ms = (time.perf_counter() - start) * 1000
        return result

    # ── Real YOLOv8 Inference ────────────────────────────────
    def _real_inference(self, image: np.ndarray) -> ClassificationResult:
        results = self.model.predict(
            source    = image,
            imgsz     = config.IMG_SIZE,
            conf      = config.CONFIDENCE_THRESHOLD,
            iou       = config.IOU_THRESHOLD,
            verbose   = False,
        )[0]

        class_areas: Dict[str, float] = {c: 0.0 for c in config.WASTE_CLASSES.values()}
        raw_detections = []
        total_area = image.shape[0] * image.shape[1]

        for box in results.boxes:
            cls_id     = int(box.cls[0])
            cls_name   = config.WASTE_CLASSES.get(cls_id, "Unknown")
            conf       = float(box.conf[0])
            x1,y1,x2,y2 = map(float, box.xyxy[0])
            area_pct   = ((x2-x1)*(y2-y1)) / total_area * 100

            class_areas[cls_name] += area_pct
            raw_detections.append({
                "class": cls_name, "confidence": round(conf,3),
                "bbox": [round(x1,1), round(y1,1), round(x2,1), round(y2,1)],
                "area_pct": round(area_pct, 2),
            })

        total = sum(class_areas.values()) or 1
        pct   = {k: round(v/total*100, 1) for k, v in class_areas.items() if v > 0}
        avg_conf = float(np.mean([d["confidence"] for d in raw_detections])) if raw_detections else 0.0

        return ClassificationResult(pct, avg_conf, raw_detections, config.MODEL_VERSION, 0)

    # ── Mock Inference (Demo / Testing) ──────────────────────
    MOCK_PROFILES = [
        # (label, weights_per_class, typical_confidence)
        ("clean_organic",   [60, 5,  15, 2,  1,  0],  0.94),
        ("clean_dry",       [5,  40, 25, 15, 10, 3],   0.91),
        ("mixed_bad",       [35, 30, 10, 8,  5,  2],   0.87),
        ("mostly_plastic",  [8,  65, 12, 5,  8,  2],   0.93),
        ("kitchen_organic", [72, 3,  12, 2,  0,  0],   0.96),
        ("construction",    [2,  5,  10, 45, 30, 8],   0.89),
        ("e_waste_heavy",   [0,  15, 5,  10, 2,  68],  0.92),
    ]

    def _mock_inference(self, image: np.ndarray) -> ClassificationResult:
        """Produce deterministic-ish realistic mock results based on image hash."""
        # Use image mean pixel values as a pseudo-seed for repeatability
        seed = int(np.mean(image) * 100) % len(self.MOCK_PROFILES)
        label, weights, conf = self.MOCK_PROFILES[seed]

        # Add small random jitter (±5 %)
        rng = random.Random(seed)
        raw = [max(0, w + rng.uniform(-5, 5)) for w in weights]
        total = sum(raw) or 1
        names = list(config.WASTE_CLASSES.values())
        pct   = {names[i]: round(raw[i]/total*100, 1) for i in range(len(names)) if raw[i] > 0}

        # Build synthetic "detections"
        raw_detections = [
            {"class": k, "confidence": round(conf - rng.uniform(0, .08), 3),
             "bbox": [50, 50, 300, 300], "area_pct": round(v, 2)}
            for k, v in pct.items()
        ]

        jitter_conf = round(conf + rng.uniform(-.03, .03), 3)
        return ClassificationResult(pct, jitter_conf, raw_detections, f"{config.MODEL_VERSION}-mock", 0)
