"""
SmartWaste AI Service — Configuration
"""
import os

# ── Model ────────────────────────────────────────────────────
MODEL_VERSION   = os.getenv("MODEL_VERSION",    "yolov8n-waste-v1")
MODEL_PATH      = os.getenv("MODEL_PATH",       "models/yolov8_waste.pt")
CONFIDENCE_THRESHOLD = float(os.getenv("CONF_THRESHOLD", "0.45"))
IOU_THRESHOLD   = float(os.getenv("IOU_THRESHOLD",  "0.50"))
IMG_SIZE        = int(os.getenv("IMG_SIZE",     "640"))

# ── Waste Classes ─────────────────────────────────────────────
WASTE_CLASSES = {
    0: "Organic",
    1: "Plastic",
    2: "Paper",
    3: "Metal",
    4: "Glass",
    5: "E-Waste",
}

# ── Segregation Rules ─────────────────────────────────────────
# A collection passes segregation if no two incompatible classes exceed threshold %
INCOMPATIBLE_PAIRS = [
    ("Organic", "Plastic"),
    ("Organic", "Metal"),
    ("Organic", "Glass"),
    ("Organic", "E-Waste"),
    ("E-Waste", "Organic"),
    ("E-Waste", "Plastic"),
]
MIXED_WASTE_THRESHOLD = float(os.getenv("MIXED_THRESHOLD", "15.0"))  # % above which it's "mixed"

# ── Server ────────────────────────────────────────────────────
HOST       = os.getenv("HOST",       "0.0.0.0")
PORT       = int(os.getenv("PORT",   "8000"))
RELOAD     = os.getenv("RELOAD",     "true").lower() == "true"
LOG_LEVEL  = os.getenv("LOG_LEVEL",  "info")

# ── Storage ───────────────────────────────────────────────────
AWS_BUCKET  = os.getenv("AWS_S3_BUCKET", "smart-waste-images")
AWS_REGION  = os.getenv("AWS_REGION",    "ap-south-1")
MAX_FILE_MB = int(os.getenv("MAX_FILE_MB", "10"))
ALLOWED_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}

# ── Database (for storing predictions) ───────────────────────
DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/smart_waste_db")

# ── Redis (job queue) ─────────────────────────────────────────
REDIS_URL  = os.getenv("REDIS_URL",  "redis://localhost:6379")
JOB_TTL    = int(os.getenv("JOB_TTL", "3600"))  # seconds
