#!/usr/bin/env python3
"""Assemble a single overview image of everything in `brand-assets/`.

    python3 tools/brand/contact_sheet.py
"""

from __future__ import annotations

import glob
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ASSETS = os.path.join(ROOT, "brand-assets")
OUT = os.path.join(ASSETS, "00-kit-overview.png")

INK = (12, 12, 12)
MAGENTA = (214, 47, 108)
GREY = (150, 150, 158)

COLS = 5
CELL = 380
PAD = 22
LABEL = 34
HEADER = 190

SECTIONS = ["guidelines", "social", "presentation", "collateral", "stationery", "ads"]


def font(size: int, bold: bool = False):
    path = ("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold
            else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")
    return ImageFont.truetype(path, size)


def main() -> None:
    groups = []
    for section in SECTIONS:
        files = sorted(glob.glob(os.path.join(ASSETS, section, "*.png")))
        if files:
            groups.append((section, files))

    # Work out the canvas height first.
    height = HEADER
    for _, files in groups:
        rows = (len(files) + COLS - 1) // COLS
        height += 76 + rows * (CELL + LABEL + PAD)
    width = COLS * (CELL + PAD) + PAD

    sheet = Image.new("RGB", (width, height + 40), INK)
    draw = ImageDraw.Draw(sheet)

    logo = Image.open(os.path.join(ASSETS, "logo", "ax-logo-white-on-dark.png")).convert("RGBA")
    logo.thumbnail((360, 140), Image.LANCZOS)
    sheet.paste(logo, (PAD + 6, 46), logo)
    draw.text((PAD + 6 + logo.width + 40, 70), "BRAND ASSET KIT", font=font(30, True), fill=(255, 255, 255))
    draw.text((PAD + 6 + logo.width + 40, 112), "Designing Digital Experiences That Perform.",
              font=font(24), fill=GREY)
    draw.line((PAD, HEADER - 26, width - PAD, HEADER - 26), fill=(48, 48, 54), width=2)

    y = HEADER
    for section, files in groups:
        draw.text((PAD + 6, y + 8), section.upper(), font=font(26, True), fill=MAGENTA)
        draw.text((width - PAD - 190, y + 12), f"{len(files)} files", font=font(22), fill=GREY)
        y += 76
        for i, path in enumerate(files):
            col, row = i % COLS, i // COLS
            x = PAD + col * (CELL + PAD)
            cy = y + row * (CELL + LABEL + PAD)
            im = Image.open(path).convert("RGB")
            im.thumbnail((CELL, CELL), Image.LANCZOS)
            box = ((CELL - im.width) // 2, (CELL - im.height) // 2)
            draw.rectangle((x, cy, x + CELL, cy + CELL), fill=(22, 22, 26))
            sheet.paste(im, (x + box[0], cy + box[1]))
            name = os.path.basename(path).replace(".png", "")
            if len(name) > 44:
                name = name[:42] + "…"
            draw.text((x, cy + CELL + 9), name, font=font(17), fill=GREY)
        y += ((len(files) + COLS - 1) // COLS) * (CELL + LABEL + PAD)

    sheet.save(OUT)
    print(f"{OUT}  {sheet.size[0]}x{sheet.size[1]}")


if __name__ == "__main__":
    main()
