#!/usr/bin/env python3
"""Normalise the supplied AX-Channels logo files into a tidy, named logo kit.

The uploaded PNGs are transparent exports straight out of the vectoriser: they
carry uneven padding and cryptic filenames ("Group 931.png"). This script trims
the transparent margin off each one, gives it a name that says what it is, and
derives the extra colourways, app icons and favicons that the rest of the kit
needs.

Run from the repository root:  python3 tools/brand/prep_logos.py
"""

from __future__ import annotations

import os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = ROOT
OUT = os.path.join(ROOT, "brand-assets", "logo")

INK = (12, 12, 12, 255)        # brand black
MAGENTA = (214, 47, 108, 255)  # brand magenta
WHITE = (255, 255, 255, 255)

# source file -> canonical name. "on-light" artwork is the dark/coloured
# artwork, "on-dark" is the knockout (white) artwork.
SOURCES = {
    "AX-Channels logo [Vectorized]-1.png": "ax-mark-primary-on-light.png",
    "AX-Channels logo [Vectorized]-2.png": "ax-mark-white-on-dark.png",
    "AX-Channels logo [Vectorized]-3.png": "ax-logo-primary-on-light.png",
    "AX-Channels logo [Vectorized].png": "ax-logo-white-on-dark.png",
    "Group 929.png": "ax-mark-tagline-primary-on-light.png",
    "Group 925.png": "ax-mark-tagline-white-on-dark.png",
    "Group 927.png": "ax-mark-tagline-mono-white.png",
    "Group 934.png": "ax-lockup-tagline-primary-on-light.png",
    "Group 926.png": "ax-lockup-tagline-white-on-dark.png",
    "Group 931.png": "ax-lockup-tagline-mono-black.png",
    "Group 928.png": "ax-lockup-tagline-mono-white.png",
}


def trim(im: Image.Image) -> Image.Image:
    """Crop away fully transparent rows and columns."""
    bbox = im.getchannel("A").getbbox()
    return im.crop(bbox) if bbox else im


def recolour(im: Image.Image, colour) -> Image.Image:
    """Replace every pixel's RGB with `colour`, keeping the alpha channel."""
    solid = Image.new("RGBA", im.size, colour[:3] + (255,))
    solid.putalpha(im.getchannel("A"))
    return solid


def contain(im: Image.Image, box: int, pad: float) -> Image.Image:
    """Scale `im` to fit a square of `box` px with `pad` fraction of margin."""
    inner = int(box * (1 - 2 * pad))
    scale = min(inner / im.width, inner / im.height)
    return im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))),
                     Image.LANCZOS)


def tile(mark: Image.Image, box: int, bg, pad: float = 0.20,
         radius: int | None = None, circle: bool = False) -> Image.Image:
    canvas = Image.new("RGBA", (box, box), (0, 0, 0, 0))
    shape = Image.new("RGBA", (box, box), bg)
    if circle or radius:
        mask = Image.new("L", (box * 4, box * 4), 0)
        d = ImageDraw.Draw(mask)
        if circle:
            d.ellipse((0, 0, box * 4 - 1, box * 4 - 1), fill=255)
        else:
            d.rounded_rectangle((0, 0, box * 4 - 1, box * 4 - 1), radius=radius * 4, fill=255)
        shape.putalpha(mask.resize((box, box), Image.LANCZOS))
    canvas.alpha_composite(shape)
    art = contain(mark, box, pad)
    canvas.alpha_composite(art, ((box - art.width) // 2, (box - art.height) // 2))
    return canvas


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    trimmed = {}

    for src, name in SOURCES.items():
        path = os.path.join(SRC, src)
        if not os.path.exists(path):
            raise SystemExit(f"missing source logo: {src}")
        im = trim(Image.open(path).convert("RGBA"))
        im.save(os.path.join(OUT, name))
        trimmed[name] = im
        print(f"{name:44s} {im.width}x{im.height}")

    mark_white = trimmed["ax-mark-white-on-dark.png"]
    logo_white = trimmed["ax-logo-white-on-dark.png"]
    lock_white = trimmed["ax-lockup-tagline-mono-white.png"]

    # Single-colour variants for one-colour print, watermarks and dark-on-brand use.
    derived = {
        "ax-mark-mono-black.png": (mark_white, INK),
        "ax-mark-mono-white.png": (mark_white, WHITE),
        "ax-mark-magenta.png": (mark_white, MAGENTA),
        "ax-logo-mono-black.png": (logo_white, INK),
        "ax-logo-mono-white.png": (logo_white, WHITE),
        "ax-logo-magenta.png": (logo_white, MAGENTA),
        "ax-lockup-tagline-magenta.png": (lock_white, MAGENTA),
    }
    for name, (base, colour) in derived.items():
        recolour(base, colour).save(os.path.join(OUT, name))
        print(f"{name:44s} derived")

    # App icons / avatars.
    icons = os.path.join(OUT, "icons")
    os.makedirs(icons, exist_ok=True)
    mark_black = recolour(mark_white, INK)

    for size in (1024, 512, 256):
        tile(mark_white, size, INK).save(os.path.join(icons, f"app-icon-black-{size}.png"))
        tile(mark_white, size, MAGENTA).save(os.path.join(icons, f"app-icon-magenta-{size}.png"))
        tile(mark_black, size, WHITE).save(os.path.join(icons, f"app-icon-white-{size}.png"))
        tile(mark_white, size, INK, radius=int(size * 0.22)).save(
            os.path.join(icons, f"app-icon-rounded-{size}.png"))
    print(f"{'icons/app-icon-*':44s} 1024/512/256, 4 colourways")

    # Round social avatars (Instagram, WhatsApp Business, LinkedIn page).
    for size in (1000, 400):
        tile(mark_white, size, INK, pad=0.24, circle=True).save(
            os.path.join(icons, f"avatar-round-black-{size}.png"))
        tile(mark_white, size, MAGENTA, pad=0.24, circle=True).save(
            os.path.join(icons, f"avatar-round-magenta-{size}.png"))
    # Square avatar — most platforms crop this themselves.
    tile(mark_white, 1000, INK, pad=0.24).save(os.path.join(icons, "avatar-square-black-1000.png"))
    print(f"{'icons/avatar-*':44s} round + square")

    # Favicons.
    for size in (16, 32, 48, 64, 180, 192, 512):
        tile(mark_white, size, INK, pad=0.16).save(os.path.join(icons, f"favicon-{size}.png"))
    print(f"{'icons/favicon-*':44s} 16-512")

    print(f"\nwrote {len(os.listdir(OUT)) - 1} logo files + {len(os.listdir(icons))} icons to {OUT}")


if __name__ == "__main__":
    main()
