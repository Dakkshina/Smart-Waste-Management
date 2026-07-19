"""
SmartWaste AI Service — Image Utilities
Handles loading, validation, preprocessing for classification.
"""
import io, base64, hashlib, logging
from pathlib import Path
from typing import Tuple, Optional
import numpy as np
import config

logger = logging.getLogger(__name__)

# ── Optional heavy imports (graceful if not installed) ────────
try:
    import cv2
    HAS_CV2 = True
except ImportError:
    HAS_CV2 = False
    logger.warning("OpenCV not installed. Using Pillow fallback.")

try:
    from PIL import Image, ImageEnhance, ExifTags
    HAS_PIL = True
except ImportError:
    HAS_PIL = False


# ── Validation ───────────────────────────────────────────────

def validate_image_file(filename: str, content: bytes) -> None:
    """Raise ValueError for invalid images."""
    ext = Path(filename).suffix.lower()
    if ext not in config.ALLOWED_EXTS:
        raise ValueError(f"Unsupported format '{ext}'. Allowed: {config.ALLOWED_EXTS}")
    max_bytes = config.MAX_FILE_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise ValueError(f"File too large ({len(content)//1024}KB). Max: {config.MAX_FILE_MB}MB")
    # Check magic bytes
    magic = {b"\xff\xd8\xff": "JPEG", b"\x89PNG": "PNG", b"RIFF": "WEBP", b"BM": "BMP"}
    for sig, fmt in magic.items():
        if content[:len(sig)] == sig:
            return  # valid
    raise ValueError("File does not appear to be a valid image.")


# ── Loading ──────────────────────────────────────────────────

def bytes_to_array(data: bytes) -> np.ndarray:
    """Convert raw image bytes to a BGR numpy array."""
    if HAS_CV2:
        arr = np.frombuffer(data, dtype=np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("OpenCV could not decode image.")
        return img
    elif HAS_PIL:
        pil = Image.open(io.BytesIO(data)).convert("RGB")
        return np.array(pil)[:, :, ::-1]   # RGB → BGR
    else:
        raise RuntimeError("Neither OpenCV nor Pillow is installed.")


def base64_to_array(b64_str: str) -> np.ndarray:
    """Decode a base64-encoded image string to numpy array."""
    if "," in b64_str:
        b64_str = b64_str.split(",", 1)[1]
    data = base64.b64decode(b64_str)
    return bytes_to_array(data)


def url_to_array(url: str) -> np.ndarray:
    """Download an image URL and return numpy array."""
    import urllib.request
    with urllib.request.urlopen(url, timeout=10) as resp:
        data = resp.read()
    return bytes_to_array(data)


# ── Preprocessing ─────────────────────────────────────────────

def preprocess_image(image: np.ndarray, target_size: int = 640) -> np.ndarray:
    """
    Resize + normalise for YOLOv8 input.
    Keeps aspect ratio with letterbox padding.
    """
    h, w = image.shape[:2]
    scale = target_size / max(h, w)
    new_h, new_w = int(h * scale), int(w * scale)

    if HAS_CV2:
        resized = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_LINEAR)
        canvas  = np.full((target_size, target_size, 3), 114, dtype=np.uint8)
        pad_y   = (target_size - new_h) // 2
        pad_x   = (target_size - new_w) // 2
        canvas[pad_y:pad_y+new_h, pad_x:pad_x+new_w] = resized
    else:
        # Pillow fallback
        from PIL import Image as PILImage
        pil = PILImage.fromarray(image[:, :, ::-1])
        pil = pil.resize((new_w, new_h), PILImage.LANCZOS)
        canvas_pil = PILImage.new("RGB", (target_size, target_size), (114,114,114))
        pad_y = (target_size - new_h) // 2
        pad_x = (target_size - new_w) // 2
        canvas_pil.paste(pil, (pad_x, pad_y))
        canvas = np.array(canvas_pil)[:, :, ::-1]

    return canvas


def auto_orient(image: np.ndarray, raw_bytes: bytes) -> np.ndarray:
    """Correct EXIF orientation so portrait photos aren't rotated."""
    if not HAS_PIL:
        return image
    try:
        from PIL import Image as PILImage
        pil = PILImage.open(io.BytesIO(raw_bytes))
        exif = pil._getexif()
        if exif is None:
            return image
        orient_key = next((k for k,v in ExifTags.TAGS.items() if v == "Orientation"), None)
        if orient_key is None or orient_key not in exif:
            return image
        orientation = exif[orient_key]
        rot_map = {3: 180, 6: 270, 8: 90}
        deg = rot_map.get(orientation)
        if deg and HAS_CV2:
            k = {90:1, 180:2, 270:3}[deg]
            return cv2.rotate(image, {1:cv2.ROTATE_90_CLOCKWISE, 2:cv2.ROTATE_180, 3:cv2.ROTATE_90_COUNTERCLOCKWISE}[k])
    except Exception:
        pass
    return image


# ── Misc ─────────────────────────────────────────────────────

def image_hash(data: bytes) -> str:
    """MD5 hash of raw image bytes (for deduplication)."""
    return hashlib.md5(data).hexdigest()


def encode_image_base64(image: np.ndarray) -> str:
    """Encode numpy BGR array to base64 JPEG string."""
    if HAS_CV2:
        _, buf = cv2.imencode(".jpg", image, [cv2.IMWRITE_JPEG_QUALITY, 80])
        return base64.b64encode(buf.tobytes()).decode()
    elif HAS_PIL:
        pil = Image.fromarray(image[:, :, ::-1])
        buf = io.BytesIO()
        pil.save(buf, format="JPEG", quality=80)
        return base64.b64encode(buf.getvalue()).decode()
    return ""
