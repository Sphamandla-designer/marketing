"""Extracts a high-resolution CMaxx logo from the current letterhead.

The only separate logo file supplied (source/logo.png) is 117 x 70 px, far too small to print.
The current letterhead is a full-page 2564 x 3628 px image with the logo on it, so this
separates the logo's white and orange from the red background behind it and writes a
transparent PNG (about 300 dpi at 2.6in wide).
"""
import io, zipfile
from pathlib import Path
import numpy as np
from PIL import Image

HERE = Path(__file__).parent
with zipfile.ZipFile(HERE / "source/CMaxx Solutions Letterhead Word.docx") as z:
    page = Image.open(io.BytesIO(z.read("word/media/image1.jpeg"))).convert("RGB")

x0, x1, y0, y1 = 170, 1000, 60, 496                       # logo region, above the orange swoosh
px = np.asarray(page).astype(float)[y0:y1, x0:x1]
R, G, B = px[..., 0], px[..., 1], px[..., 2]
ORANGE = np.array([243, 112, 33.0])

white = np.clip((np.minimum(G, B) - 90) / (215 - 90), 0, 1)
orange = np.clip(((G - B) - 20) / 40, 0, 1) * np.clip((R - 170) / 50, 0, 1)
orange = np.where(white > 0.5, 0, orange)
orange[380:, 757 + 46:] = 0                               # tail of the background swoosh beside the final "S"

alpha = np.maximum(white, orange)
rgb = (white[..., None] * 255 + orange[..., None] * ORANGE) / np.maximum(white + orange, 1e-6)[..., None]
logo = Image.fromarray(np.dstack([rgb, alpha * 255]).clip(0, 255).astype(np.uint8), "RGBA")
logo = logo.crop(logo.getbbox())
logo.save(HERE / "assets/cmaxx-logo.png")
print("assets/cmaxx-logo.png", logo.size)
