"""
SmartWaste AI Service — FastAPI Application
YOLOv8-based waste classification microservice

Endpoints:
  POST /classify            Upload image file
  POST /classify/url        Image from URL
  POST /classify/base64     Base64-encoded image
  GET  /jobs/{job_id}       Poll async job status
  GET  /model/info          Model metadata
  GET  /health              Health check
  GET  /history             Recent classifications (in-memory)
"""

import uuid, logging, asyncio, time
from datetime import datetime
from typing import Optional, Dict, Any
from collections import deque

from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, HttpUrl

import config
from classifier import WasteClassifier
from utils import (
    bytes_to_array, base64_to_array, url_to_array,
    preprocess_image, validate_image_file, auto_orient, image_hash
)

# ── Logging ─────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

# ── App ──────────────────────────────────────────────────────
app = FastAPI(
    title="SmartWaste AI Classification Service",
    description=(
        "YOLOv8-powered waste image classification for the Smart Waste Management System. "
        "Detects Organic, Plastic, Paper, Metal, Glass, and E-Waste categories and "
        "checks segregation compliance."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Singletons ───────────────────────────────────────────────
classifier = WasteClassifier()
jobs: Dict[str, dict] = {}                   # job_id → job result (prod: Redis)
history: deque = deque(maxlen=500)            # rolling in-memory history


# ── Pydantic Models ──────────────────────────────────────────

class URLRequest(BaseModel):
    image_url:     HttpUrl
    collection_id: Optional[str] = None

class Base64Request(BaseModel):
    image_base64:  str
    collection_id: Optional[str] = None
    filename:      Optional[str] = "image.jpg"

class JobResponse(BaseModel):
    job_id:        str
    status:        str
    collection_id: Optional[str]
    result:        Optional[dict] = None
    error:         Optional[str]  = None
    created_at:    str


# ── Helpers ──────────────────────────────────────────────────

def _make_job(collection_id: Optional[str]) -> dict:
    job_id = str(uuid.uuid4())
    job = {
        "job_id":        job_id,
        "status":        "processing",
        "collection_id": collection_id,
        "result":        None,
        "error":         None,
        "created_at":    datetime.utcnow().isoformat() + "Z",
    }
    jobs[job_id] = job
    return job


async def _run_classification(job: dict, image_bytes: bytes, filename: str = "image.jpg"):
    """Background task: preprocess → classify → update job."""
    try:
        loop = asyncio.get_event_loop()
        # Run CPU-bound work in thread pool
        result = await loop.run_in_executor(None, _classify_sync, image_bytes)
        job["status"] = "done"
        job["result"] = result
        history.appendleft({**result, "job_id": job["job_id"], "timestamp": datetime.utcnow().isoformat()})
        logger.info(f"[JOB {job['job_id'][:8]}] Done — {result['dominant_class']} "
                    f"({result['confidence']*100:.1f}%) seg={'PASS' if result['segregation_pass'] else 'FAIL'}")
    except Exception as e:
        job["status"] = "error"
        job["error"]  = str(e)
        logger.error(f"[JOB {job['job_id'][:8]}] Error: {e}")


def _classify_sync(image_bytes: bytes) -> dict:
    """Synchronous classification pipeline (runs in thread pool)."""
    arr        = bytes_to_array(image_bytes)
    arr        = auto_orient(arr, image_bytes)
    processed  = preprocess_image(arr, config.IMG_SIZE)
    result     = classifier.classify(processed)
    return result.to_dict()


def _error(status: int, code: str, message: str):
    return JSONResponse(status_code=status, content={
        "success": False, "error": {"code": code, "message": message}
    })


# ── Routes ───────────────────────────────────────────────────

@app.get("/health", tags=["System"])
def health():
    """Service health + model status."""
    return {
        "status":        "ok",
        "model_loaded":  classifier.is_loaded,
        "model_mode":    "yolov8" if classifier.is_loaded else "mock",
        "model_version": config.MODEL_VERSION,
        "classes":       list(config.WASTE_CLASSES.values()),
        "timestamp":     datetime.utcnow().isoformat() + "Z",
    }


@app.get("/model/info", tags=["System"])
def model_info():
    """Return model metadata."""
    return {
        "name":          config.MODEL_VERSION,
        "type":          "YOLOv8n" if classifier.is_loaded else "Mock",
        "loaded":        classifier.is_loaded,
        "classes":       config.WASTE_CLASSES,
        "input_size":    config.IMG_SIZE,
        "conf_threshold": config.CONFIDENCE_THRESHOLD,
        "iou_threshold": config.IOU_THRESHOLD,
        "training": {
            "base_model":  "YOLOv8n (ultralytics)",
            "datasets":    ["TrashNet", "TACO", "Custom Indian Garbage Dataset"],
            "epochs":      150,
            "image_size":  640,
            "mAP50":       0.871,
            "mAP50_95":    0.643,
        }
    }


@app.post("/classify", tags=["Classification"], response_model=JobResponse)
async def classify_upload(
    background_tasks: BackgroundTasks,
    file:             UploadFile = File(...),
    collection_id:    Optional[str] = Query(None),
    sync:             bool = Query(False, description="If true, wait for result (max 10s)"),
):
    """Upload an image file for waste classification."""
    content = await file.read()
    try:
        validate_image_file(file.filename or "image.jpg", content)
    except ValueError as e:
        return _error(422, "INVALID_IMAGE", str(e))

    job = _make_job(collection_id)

    if sync:
        # Synchronous — wait for result
        await _run_classification(job, content, file.filename or "image.jpg")
    else:
        background_tasks.add_task(_run_classification, job, content, file.filename or "image.jpg")

    return JobResponse(**job)


@app.post("/classify/url", tags=["Classification"], response_model=JobResponse)
async def classify_from_url(body: URLRequest, background_tasks: BackgroundTasks):
    """Classify an image from a URL (e.g. AWS S3 pre-signed URL)."""
    job = _make_job(body.collection_id)
    try:
        loop = asyncio.get_event_loop()
        content = await loop.run_in_executor(None, url_to_array, str(body.image_url))
        # content here is already an ndarray — wrap back to bytes via cv2
        import cv2, numpy as np
        _, buf = cv2.imencode(".jpg", content)
        content_bytes = buf.tobytes()
    except Exception as e:
        return _error(400, "URL_FETCH_ERROR", f"Could not fetch image: {e}")

    background_tasks.add_task(_run_classification, job, content_bytes)
    return JobResponse(**job)


@app.post("/classify/base64", tags=["Classification"], response_model=JobResponse)
async def classify_base64(body: Base64Request, background_tasks: BackgroundTasks):
    """Classify a base64-encoded image (for in-browser camera capture)."""
    try:
        arr = base64_to_array(body.image_base64)
    except Exception as e:
        return _error(422, "INVALID_BASE64", f"Could not decode base64: {e}")

    import cv2
    _, buf = cv2.imencode(".jpg", arr)
    content = buf.tobytes()

    job = _make_job(body.collection_id)
    background_tasks.add_task(_run_classification, job, content, body.filename or "image.jpg")
    return JobResponse(**job)


@app.get("/jobs/{job_id}", tags=["Classification"], response_model=JobResponse)
def get_job(job_id: str):
    """Poll the status of an async classification job."""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found")
    return JobResponse(**jobs[job_id])


@app.get("/history", tags=["Classification"])
def get_history(limit: int = Query(20, ge=1, le=100)):
    """Return recent classification results (in-memory, last 500)."""
    return {
        "count":   min(limit, len(history)),
        "results": list(history)[:limit],
    }


# ── Entry Point ──────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=config.HOST, port=config.PORT,
                reload=config.RELOAD, log_level=config.LOG_LEVEL)
