"""Updates the contact details on the original CMaxx letterhead, changing nothing else.

The original letterhead (source/CMaxx Solutions Letterhead Word.docx) is a Word file whose
header holds one full-page image (2564 x 3628 px) with the contact details drawn into it.
This script:
  1. removes the old contact lettering from that image (it sits on plain white),
  2. sets the contact lines again in Outfit Regular at 11 pt (a true Word point size on the
     printed page, worked out from how large the image is placed in the Word file), at the same
     left edge and ink colour as the original lettering, each line centred on its icon as before,
  3. puts the edited area back into the original JPEG losslessly (jpegtran -drop), so every
     pixel outside the contact area is bit-for-bit the original,
  4. writes a copy of the Word file in which only that image is replaced; every other
     part of the file is copied across unchanged.
"""
import io, re, subprocess, tempfile, zipfile
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).parent
SOURCE = HERE.parent / "source" / "CMaxx Solutions Letterhead Word.docx"
OUT_DOCX = HERE / "CMaxx Solutions Letterhead.docx"
IMAGE = "word/media/image1.jpeg"

POINT_SIZE = 11                                                         # contact details, in Word points
INK = (12, 19, 34)                                                      # measured from the original lettering
LEFT = 1573                                                             # left edge of the original lettering (px)
IMAGE_WIDTH_PX = 2564
FONT_FILE = str(HERE / "fonts" / "Outfit-400.ttf")

# Each line's visual centre in the original (px), which is also the centre of its icon row,
# and the original gap between the two address lines at the original size (70px at a 62px font).
CENTRES = [484, 583, 696, 813]
ADDRESS_LEADING_RATIO = 70 / 62
TEXT = ["010 140 3660",
        "info@cmaxxwifisolutions.co.za",
        "www.cmaxxwifisolutions.co.za",
        "24 Walton Ave, Carlswald,",       # address unchanged, re-set in Outfit to match
        "Midrand, 1684"]


def printed_px_per_inch(zin) -> float:
    """How many image pixels make one printed inch: the image's width on the page comes from
    the page-one header (wp:extent, in EMU; 914400 EMU = 1 inch)."""
    header = zin.read("word/header2.xml").decode()
    cx = int(re.search(r'<wp:extent cx="(\d+)"', header).group(1))
    return IMAGE_WIDTH_PX / (cx / 914400)


def lines_for(font):
    """(text, baseline) pairs: cap height centred where the original line was centred."""
    cap = -font.getbbox("H", anchor="ls")[1]
    baselines = [c + cap / 2 for c in CENTRES]
    baselines.append(baselines[3] + ADDRESS_LEADING_RATIO * font.size)
    return list(zip(TEXT, baselines))


# Ink boxes of the old lettering (x0, y0, x1, y1), measured from the original; each is cleared with a
# small margin. The orange icons end at x=1536 and the navy curve starts at x>=2360 on these rows.
OLD_LINES = [(1573, 463, 1923, 505), (1574, 561, 2332, 611), (1572, 674, 2272, 718),
             (1577, 791, 2263, 842), (1579, 861, 1956, 911)]
MARGIN = 8
PATCH = (1552, 448, 2416, 928)         # 16px-aligned area that is re-encoded; covers all of the above


def update_image(data: bytes, px_per_inch: float) -> bytes:
    FONT = ImageFont.truetype(FONT_FILE, POINT_SIZE * px_per_inch / 72)   # 1 pt = 1/72 inch
    LINES = lines_for(FONT)
    src = Image.open(io.BytesIO(data))
    img = src.convert("RGB")

    # each area being cleared must hold only navy lettering on white: no orange or red artwork,
    # and white all round its edge (so it doesn't touch the navy curve or the icons)
    px = np.asarray(img).astype(int)
    draw = ImageDraw.Draw(img)
    for x0, y0, x1, y1 in OLD_LINES:
        x0, y0, x1, y1 = x0 - MARGIN, y0 - MARGIN, x1 + MARGIN, y1 + MARGIN
        region = px[y0:y1 + 1, x0:x1 + 1]
        assert (region[..., 0] - region[..., 2] < 40).all(), "unexpected artwork in the contact area"
        edge = np.concatenate([region[0], region[-1], region[:, 0], region[:, -1]])
        assert (edge >= 235).all(), "cleared area touches other artwork"
        draw.rectangle((x0, y0, x1, y1), fill=(255, 255, 255))
    cleared = np.asarray(img).astype(int)
    for text, baseline in LINES:
        bearing = FONT.getbbox(text, anchor="ls")[0]
        draw.text((LEFT - bearing, baseline), text, font=FONT, fill=INK, anchor="ls")

    # every line must end well clear of the navy curve (measured with the old lettering removed)
    for text, baseline in LINES:
        b = FONT.getbbox(text, anchor="ls")
        right, top, bottom = LEFT + b[2] - b[0], int(baseline + b[1]), int(baseline + b[3]) + 1
        rows = cleared[top:bottom + 1, right:]
        dark = rows.sum(2) < 380
        curve = min((np.argmax(r) for r in dark if r.any()), default=10**6)
        assert curve > 30, f"{text!r} comes within {curve}px of the navy curve"

    # Re-encode only the 16px-aligned block around the contact text (4:2:0 MCUs are 16 x 16), with
    # the original's own quantisation tables, and drop it into the untouched original JPEG.
    x0, y0, x1, y1 = PATCH
    with tempfile.TemporaryDirectory() as tmp:
        patch, base = Path(tmp) / "patch.jpg", Path(tmp) / "base.jpg"
        base.write_bytes(data)
        img.crop(PATCH).save(patch, "JPEG", qtables=src.quantization, subsampling=2)
        out = subprocess.run(["jpegtran", "-copy", "all", "-drop", f"+{x0}+{y0}", str(patch), str(base)],
                             check=True, capture_output=True).stdout

    # check: identical outside the patch. (Decoders smooth colour across block edges, so the
    # 2px ring just outside the patch can shift slightly when decoded; the stored data is unchanged.)
    before = np.asarray(src.convert("RGB")).astype(int)
    after = np.asarray(Image.open(io.BytesIO(out)).convert("RGB")).astype(int)
    outside = np.ones(before.shape[:2], bool)
    outside[y0 - 2:y1 + 2, x0 - 2:x1 + 2] = False
    assert (before[outside] == after[outside]).all(), "pixels outside the contact area changed"
    return out


with zipfile.ZipFile(SOURCE) as zin:
    ppi = printed_px_per_inch(zin)
print(f"image prints at {ppi:.1f} px/inch; contact details set at {POINT_SIZE} pt = {POINT_SIZE * ppi / 72:.2f} px em")

with zipfile.ZipFile(SOURCE) as zin, zipfile.ZipFile(OUT_DOCX, "w", zipfile.ZIP_DEFLATED) as zout:
    for item in zin.infolist():
        data = zin.read(item.filename)
        if item.filename == IMAGE:
            data = update_image(data, ppi)
            (HERE / "letterhead-image.jpg").write_bytes(data)
        zout.writestr(item, data)
print("wrote", OUT_DOCX.name)
