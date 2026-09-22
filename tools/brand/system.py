#!/usr/bin/env python3
"""The AX-Channels design system: tokens, shared CSS and layout components.

Everything visual in `brand-assets/` is generated from this file, so the
artwork stays consistent: one place defines the palette, the type scale, the
chevron motif angle and the page chrome.
"""

from __future__ import annotations

import os

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FONT_DIR = os.path.join(ROOT, "tools", "brand", "fonts")
LOGO_DIR = os.path.join(ROOT, "brand-assets", "logo")

# ---------------------------------------------------------------- tokens ----

INK = "#0C0C0C"          # primary brand black, straight off the logo artwork
GRAPHITE = "#17171B"     # raised surfaces on black
SLATE = "#55555F"
SILVER = "#B9B9C2"
MIST = "#F4F4F6"
WHITE = "#FFFFFF"

MAGENTA = "#D62F6C"      # brand accent, straight off the logo artwork
MAGENTA_DEEP = "#B02458"
MAGENTA_LIGHT = "#F06E9A"
MAGENTA_WASH = "#FCE8EF"

# The AX mark's diagonal sits at 51.6 degrees off horizontal. Every diagonal
# in the kit is cut to the same angle so the graphics rhyme with the logo.
AX_ANGLE = 51.6

# Placeholder contact details — swap before anything goes to print or live.
WEB = "www.axchannels.co.za"
EMAIL = "hello@axchannels.co.za"
PHONE = "+27 00 000 0000"
TAGLINE = "Designing Digital Experiences That Perform."

SERVICES = [
    ("UI / UX Design", "Interfaces people actually get through"),
    ("Web Design & Build", "Fast, responsive, built to convert"),
    ("Brand Identity", "Systems that hold up everywhere"),
    ("Digital Marketing", "Channels that earn their spend"),
]

# Placeholder proof points — replace with real numbers before publishing.
PROOF = [
    ("12", "Weeks from kick-off to launch"),
    ("4", "Disciplines under one roof"),
    ("100%", "Built responsive and accessible"),
]

PROCESS = [
    ("01", "Discover", "Audit, research, and a clear problem statement"),
    ("02", "Design", "Prototypes tested before a line of code is written"),
    ("03", "Build", "Production-ready, accessible, measurable"),
    ("04", "Optimise", "Iterate against real performance data"),
]


def font_face(family: str, weight: int) -> str:
    path = os.path.join(FONT_DIR, f"{family}-{weight}.woff2")
    return (
        "@font-face{font-family:'%s';font-style:normal;font-weight:%d;"
        "font-display:block;src:url('file://%s') format('woff2');}"
        % (family, weight, path)
    )


FONTS = "".join(
    [font_face("Poppins", w) for w in (300, 400, 500, 600, 700, 800)]
    + [font_face("Inter", w) for w in (300, 400, 500, 600, 700)]
)


def logo(name: str) -> str:
    """Absolute file:// URL for a prepared logo file."""
    return "file://" + os.path.join(LOGO_DIR, name)


BASE_CSS = f"""
{FONTS}
*,*::before,*::after{{box-sizing:border-box;margin:0;padding:0;}}
html,body{{background:{INK};}}
body{{
  font-family:'Inter','Liberation Sans',sans-serif;
  -webkit-font-smoothing:antialiased;
  text-rendering:geometricPrecision;
}}
.canvas{{
  position:relative;overflow:hidden;
  background:{INK};color:{WHITE};
}}
/* --- surfaces ------------------------------------------------------- */
.bg-ink{{background:{INK};color:{WHITE};}}
.bg-graphite{{background:{GRAPHITE};color:{WHITE};}}
.bg-white{{background:{WHITE};color:{INK};}}
.bg-mist{{background:{MIST};color:{INK};}}
.bg-magenta{{background:{MAGENTA};color:{WHITE};}}
.bg-gradient{{background:
  radial-gradient(120% 130% at 100% 0%, rgba(214,47,108,.42) 0%, rgba(214,47,108,0) 55%),
  linear-gradient(160deg, #151519 0%, {INK} 55%, #08080A 100%);
  color:{WHITE};}}

/* --- the chevron motif ---------------------------------------------- */
/* A screened-back AX mark bleeding off the canvas edge. */
.watermark{{
  position:absolute;pointer-events:none;
  background-repeat:no-repeat;background-size:contain;background-position:center;
}}
/* Repeating hairline stripes cut to the logo's own diagonal. */
.stripes{{
  position:absolute;inset:0;pointer-events:none;
  background-image:repeating-linear-gradient(
    {90 - AX_ANGLE}deg,
    rgba(255,255,255,.055) 0 2px,
    rgba(255,255,255,0) 2px 26px);
}}
.stripes-dark{{
  position:absolute;inset:0;pointer-events:none;
  background-image:repeating-linear-gradient(
    {90 - AX_ANGLE}deg,
    rgba(12,12,12,.05) 0 2px,
    rgba(12,12,12,0) 2px 26px);
}}
/* A solid magenta blade at the logo angle. */
.blade{{position:absolute;background:{MAGENTA};transform:rotate(-{AX_ANGLE}deg);
  transform-origin:center;pointer-events:none;}}

/* --- type ----------------------------------------------------------- */
.display,.headline,.subhead,.num{{font-family:'Poppins','Liberation Sans',sans-serif;}}
.display{{font-weight:700;letter-spacing:-.03em;line-height:.98;}}
.headline{{font-weight:600;letter-spacing:-.022em;line-height:1.08;}}
.subhead{{font-weight:500;letter-spacing:-.012em;line-height:1.25;}}
.body{{font-weight:400;line-height:1.55;color:rgba(255,255,255,.72);}}
.body-dark{{font-weight:400;line-height:1.55;color:rgba(12,12,12,.68);}}
.eyebrow{{
  font-family:'Inter',sans-serif;font-weight:600;text-transform:uppercase;
  letter-spacing:.28em;color:{MAGENTA};
}}
.eyebrow-light{{color:rgba(255,255,255,.55);}}
.accent{{color:{MAGENTA};}}
.meta{{font-family:'Inter',sans-serif;font-weight:500;letter-spacing:.16em;
  text-transform:uppercase;color:rgba(255,255,255,.55);}}
.meta-dark{{color:rgba(12,12,12,.55);}}

/* --- bits ------------------------------------------------------------ */
.rule{{height:1px;background:rgba(255,255,255,.14);border:0;}}
.rule-dark{{height:1px;background:rgba(12,12,12,.12);border:0;}}
.tick{{background:{MAGENTA};}}
.pill{{display:inline-flex;align-items:center;gap:.6em;border-radius:999px;
  background:{MAGENTA};color:{WHITE};font-family:'Poppins',sans-serif;font-weight:600;}}
.pill-outline{{display:inline-flex;align-items:center;gap:.6em;border-radius:999px;
  border:1px solid rgba(255,255,255,.28);color:{WHITE};
  font-family:'Poppins',sans-serif;font-weight:500;}}
.logo{{display:block;flex:none;object-fit:contain;}}
.row{{display:flex;align-items:center;}}
.col{{display:flex;flex-direction:column;}}
"""


def page(width: int, height: int, body: str, css: str = "") -> str:
    """Wrap page content in a fixed-size document ready for screenshotting."""
    return f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<style>{BASE_CSS}
html,body{{width:{width}px;height:{height}px;}}
.canvas{{width:{width}px;height:{height}px;}}
{css}
</style></head>
<body><div class="canvas">{body}</div></body></html>"""


def watermark(art: str, *, size: str, top: str = "auto", left: str = "auto",
              right: str = "auto", bottom: str = "auto", opacity: float = 0.06,
              rotate: float = 0) -> str:
    """A screened-back logo mark used as a background graphic."""
    tf = f"transform:rotate({rotate}deg);" if rotate else ""
    return (
        f'<div class="watermark" style="background-image:url({logo(art)});'
        f'width:{size};height:{size};top:{top};left:{left};right:{right};bottom:{bottom};'
        f'opacity:{opacity};{tf}"></div>'
    )


def blade(cx: float, cy: float, length: float, thickness: float = 8,
          *, colour: str = MAGENTA, opacity: float = 1.0) -> str:
    """A magenta stroke cut to the logo's diagonal, centred on (cx, cy)."""
    return (
        f'<div class="blade" style="width:{thickness}px;height:{length}px;'
        f'left:{cx - thickness / 2}px;top:{cy - length / 2}px;'
        f'background:{colour};opacity:{opacity};"></div>'
    )


def blades(cx: float, cy: float, length: float, *, count: int = 3,
           thickness: float = 8, gap: float = 30, taper: bool = True,
           colour: str = MAGENTA, opacity: float = 1.0) -> str:
    """A run of parallel strokes — the kit's signature accent."""
    out = []
    for i in range(count):
        t = thickness if not taper else max(2, thickness * (1 - i * 0.32))
        out.append(blade(cx + i * gap, cy, length, t, colour=colour,
                         opacity=opacity * (1 - i * 0.22)))
    return "".join(out)


def wedge(corner: str, width: float, *, colour: str = MAGENTA,
          opacity: float = 1.0) -> str:
    """A corner triangle whose hypotenuse matches the logo's diagonal."""
    height = width * 1.264  # tan(51.6 degrees)
    pos = {
        "bottom-right": ("bottom:0;right:0;", "polygon(100% 0, 100% 100%, 0 100%)"),
        "bottom-left": ("bottom:0;left:0;", "polygon(0 0, 100% 100%, 0 100%)"),
        "top-right": ("top:0;right:0;", "polygon(100% 0, 100% 100%, 0 0)"),
        "top-left": ("top:0;left:0;", "polygon(0 0, 100% 0, 0 100%)"),
    }[corner]
    return (
        f'<div style="position:absolute;{pos[0]}width:{width}px;height:{height}px;'
        f'background:{colour};opacity:{opacity};clip-path:{pos[1]};pointer-events:none;"></div>'
    )


_LOGO_SIZES: dict[str, tuple[int, int]] = {}


def logo_img(name: str, *, height: float | None = None, width: float | None = None,
             style: str = "", cls: str = "logo") -> str:
    """An <img> for a logo file with BOTH dimensions written out.

    Flex containers stretch an image that only has one dimension set, which
    silently distorts the mark — so the intrinsic aspect ratio is read off the
    file here and both sides are emitted.
    """
    from PIL import Image

    if name not in _LOGO_SIZES:
        with Image.open(os.path.join(LOGO_DIR, name)) as im:
            _LOGO_SIZES[name] = im.size
    iw, ih = _LOGO_SIZES[name]
    if height is None and width is None:
        raise ValueError("logo_img needs a height or a width")
    if height is None:
        height = width * ih / iw
    if width is None:
        width = height * iw / ih
    return (
        f'<img class="{cls}" src="{logo(name)}" width="{width:.1f}" height="{height:.1f}" '
        f'style="width:{width:.1f}px;height:{height:.1f}px;flex:none;{style}">'
    )
