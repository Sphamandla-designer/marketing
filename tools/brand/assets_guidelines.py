#!/usr/bin/env python3
"""Brand guideline sheets — A4 landscape at 300 dpi (1240x877 CSS at 2x).

Four sheets: the logo system, colour, typography, and the rules for clear
space, minimum size and misuse.
"""

from __future__ import annotations

from system import (
    INK, GRAPHITE, SLATE, SILVER, MIST, WHITE,
    MAGENTA, MAGENTA_DEEP, MAGENTA_LIGHT, MAGENTA_WASH,
    TAGLINE, WEB, page, logo, logo_img, watermark,
)

W, H = 1240, 877
SCALE = 2


def sheet(number: str, title: str, content: str, *, dark: bool = False) -> str:
    bg = "bg-ink" if dark else "bg-white"
    ink = WHITE if dark else INK
    rule = "rgba(255,255,255,.14)" if dark else "rgba(12,12,12,.12)"
    foot = "meta" if dark else "meta meta-dark"
    mark = "ax-mark-mono-white.png" if dark else "ax-mark-mono-black.png"
    return f"""
    <div class="canvas {bg}" style="width:{W}px;height:{H}px;">
      <div class="col" style="height:100%;padding:64px 72px 52px;">
        <div class="row" style="justify-content:space-between;align-items:flex-start;
             border-bottom:1px solid {rule};padding-bottom:26px;">
          <div class="row" style="gap:22px;align-items:baseline;">
            <div class="num accent" style="font-size:19px;font-weight:700;">{number}</div>
            <div class="headline" style="font-size:33px;color:{ink};">{title}</div>
          </div>
          <div class="row" style="gap:20px;align-items:center;">
            <div class="{foot}" style="font-size:10px;">Brand guidelines</div>
            {logo_img(mark, height=21)}
          </div>
        </div>
        <div class="col" style="flex:1;padding-top:40px;">{content}</div>
        <div class="row" style="justify-content:space-between;align-items:center;
             border-top:1px solid {rule};padding-top:22px;">
          <div class="{foot}" style="font-size:10px;">AX-Channels · {TAGLINE}</div>
          <div class="{foot}" style="font-size:10px;">{WEB}</div>
        </div>
      </div>
    </div>"""


def _caption(label: str, filename: str, dark: bool = False) -> str:
    colour = "rgba(255,255,255,.55)" if dark else "rgba(12,12,12,.55)"
    ink = WHITE if dark else INK
    return f"""
      <div class="col" style="gap:3px;margin-top:9px;">
        <div style="font-size:12px;font-weight:600;color:{ink};">{label}</div>
        <div style="font-family:'Inter';font-size:10px;color:{colour};">{filename}</div>
      </div>"""


# ------------------------------------------------------- 01 logo system ----

def logo_system():
    def tile(art, label, filename, bg, height=None, width=None, pad=24):
        return f"""
        <div class="col">
          <div class="row" style="justify-content:center;align-items:center;background:{bg};
               height:142px;padding:{pad}px;border:1px solid rgba(12,12,12,.10);">
            {logo_img(art, height=height, width=width)}
          </div>
          {_caption(label, filename)}
        </div>"""

    row1 = "".join([
        tile('ax-logo-primary-on-light.png', 'Primary — on light',
             'ax-logo-primary-on-light.png', MIST, height=70),
        tile('ax-logo-white-on-dark.png', 'Primary — on dark',
             'ax-logo-white-on-dark.png', INK, height=70),
        tile('ax-lockup-tagline-primary-on-light.png', 'Lockup with tagline',
             'ax-lockup-tagline-primary-on-light.png', MIST, height=84),
    ])
    row2 = "".join([
        tile('ax-mark-primary-on-light.png', 'Mark only', 'ax-mark-primary-on-light.png',
             MIST, height=56),
        tile('ax-logo-mono-black.png', 'One colour — black', 'ax-logo-mono-black.png',
             MIST, height=70),
        tile('ax-logo-mono-white.png', 'One colour — white (reversed)',
             'ax-logo-mono-white.png', INK, height=70),
    ])
    row3 = "".join([
        tile('ax-logo-magenta.png', 'One colour — magenta', 'ax-logo-magenta.png',
             MAGENTA_WASH, height=70),
        tile('ax-lockup-tagline-mono-white.png', 'Reversed lockup',
             'ax-lockup-tagline-mono-white.png', GRAPHITE, height=84),
        f"""
        <div class="col" style="justify-content:center;gap:11px;padding:0 6px 0 22px;">
          <div class="eyebrow" style="font-size:10px;">Choosing one</div>
          <div class="body-dark" style="font-size:12.5px;">
            Reach for the primary two-colour logo first. Use the tagline lockup where the
            brand is being introduced — a cover, a banner, a card.
          </div>
          <div class="body-dark" style="font-size:12.5px;">
            Drop to one colour only where the process demands it: embroidery, etching,
            single-colour print, or a background too busy to hold the magenta.
          </div>
          <div class="body-dark" style="font-size:12.5px;">
            The mark alone is for small square spaces — avatars, favicons, app icons —
            where the wordmark would be illegible anyway.
          </div>
        </div>"""
    ])
    content = f"""
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px 26px;">
        {row1}{row2}{row3}
      </div>"""
    return dict(out="guidelines/01-logo-system.png",
                html=page(W, H, sheet("01", "Logo system", content)),
                width=W, height=H, scale=SCALE)


# ------------------------------------------------------------ 02 colour ----

def colour():
    def card(name, hexv, rgb, cmyk, bg, fg, note, tall=True):
        return f"""
        <div class="col" style="flex:1;border:1px solid rgba(12,12,12,.12);">
          <div class="col" style="background:{bg};height:{'150' if tall else '110'}px;
               padding:22px;justify-content:flex-end;">
            <div class="headline" style="font-size:23px;color:{fg};">{name}</div>
          </div>
          <div class="col" style="padding:18px 22px;gap:7px;">
            <div class="row" style="justify-content:space-between;">
              <div class="meta meta-dark" style="font-size:10px;">HEX</div>
              <div style="font-size:14px;font-weight:600;color:{INK};">{hexv}</div>
            </div>
            <div class="row" style="justify-content:space-between;">
              <div class="meta meta-dark" style="font-size:10px;">RGB</div>
              <div style="font-size:14px;color:{INK};">{rgb}</div>
            </div>
            <div class="row" style="justify-content:space-between;">
              <div class="meta meta-dark" style="font-size:10px;">CMYK</div>
              <div style="font-size:14px;color:{INK};">{cmyk}</div>
            </div>
            <div class="body-dark" style="font-size:11.5px;margin-top:7px;">{note}</div>
          </div>
        </div>"""

    cards = "".join([
        card("AX Ink", "#0C0C0C", "12 · 12 · 12", "0 · 0 · 0 · 95", INK, WHITE,
             "The default surface. For solid print areas ask for a rich black "
             "(C60 M40 Y40 K100) so it doesn't go grey."),
        card("AX Magenta", "#D62F6C", "214 · 47 · 108", "0 · 78 · 49 · 16", MAGENTA, WHITE,
             "The accent — and only the accent. Nearest Pantone is 213 C; confirm "
             "against a physical swatch before a press run."),
        card("Paper White", "#FFFFFF", "255 · 255 · 255", "0 · 0 · 0 · 0", WHITE, INK,
             "The second surface. Reversed artwork on ink, primary artwork on white."),
    ])

    tints = "".join(f"""
      <div class="col" style="flex:1;">
        <div style="height:54px;background:{v};border:1px solid rgba(12,12,12,.10);"></div>
        <div style="font-size:12px;font-weight:600;color:{INK};margin-top:9px;">{n}</div>
        <div style="font-size:11px;color:{SLATE};">{v}</div>
      </div>""" for n, v in [
        ("Magenta deep", MAGENTA_DEEP), ("Magenta", MAGENTA),
        ("Magenta light", MAGENTA_LIGHT), ("Magenta wash", MAGENTA_WASH),
        ("Graphite", GRAPHITE), ("Slate", SLATE), ("Silver", SILVER), ("Mist", MIST),
    ])

    content = f"""
      <div class="row" style="gap:26px;align-items:stretch;flex:none;">{cards}</div>

      <div class="col" style="margin-top:32px;gap:14px;flex:none;">
        <div class="eyebrow" style="font-size:11px;">Supporting palette — interface and layout only</div>
        <div class="row" style="gap:16px;align-items:flex-start;">{tints}</div>
      </div>

      <div class="col" style="margin-top:auto;gap:12px;flex:none;">
        <div class="eyebrow" style="font-size:11px;">Balance</div>
        <div class="row" style="height:34px;width:100%;flex:none;">
          <div style="flex:60;background:{INK};"></div>
          <div style="flex:30;background:{MIST};border-top:1px solid rgba(12,12,12,.12);
               border-bottom:1px solid rgba(12,12,12,.12);"></div>
          <div style="flex:10;background:{MAGENTA};"></div>
        </div>
        <div class="row" style="justify-content:space-between;">
          <div class="body-dark" style="font-size:12px;">60% ink</div>
          <div class="body-dark" style="font-size:12px;">30% white / mist</div>
          <div class="body-dark" style="font-size:12px;">10% magenta</div>
        </div>
        <div class="body-dark" style="font-size:12.5px;max-width:1020px;margin-top:2px;">
          Magenta earns its power by being rare: one accent per composition — a rule, a
          button, a run of strokes, a single highlighted word. Never body copy.
        </div>
      </div>"""
    return dict(out="guidelines/02-colour.png",
                html=page(W, H, sheet("02", "Colour", content)),
                width=W, height=H, scale=SCALE)


# -------------------------------------------------------- 03 typography ----

def typography():
    scale_rows = "".join(f"""
      <div class="row" style="justify-content:space-between;align-items:baseline;
           border-top:1px solid rgba(12,12,12,.10);padding:13px 0;">
        <div style="font-size:13px;font-weight:600;color:{INK};width:150px;">{name}</div>
        <div style="font-size:12px;color:{SLATE};width:190px;">{font}</div>
        <div style="font-size:12px;color:{SLATE};width:150px;">{size}</div>
        <div style="font-size:12px;color:{SLATE};flex:1;">{use}</div>
      </div>""" for name, font, size, use in [
        ("Display", "Poppins Bold 700", "-3% tracking", "Hero statements, covers, posters"),
        ("Headline", "Poppins SemiBold 600", "-2.2% tracking", "Section and card headings"),
        ("Subhead", "Poppins Medium 500", "-1.2% tracking", "Standfirsts, quotes, captions"),
        ("Body", "Inter Regular 400", "1.55 leading", "Paragraphs, descriptions, letters"),
        ("Eyebrow", "Inter SemiBold 600", "+28% tracking, caps", "Labels above a heading"),
        ("Meta", "Inter Medium 500", "+16% tracking, caps", "Footers, URLs, reference codes"),
    ])

    content = f"""
      <div class="row" style="gap:44px;align-items:flex-start;flex:none;">
        <div class="col" style="flex:1;gap:22px;">
          <div class="eyebrow" style="font-size:11px;">Display face</div>
          <div class="display" style="font-size:96px;color:{INK};">Poppins</div>
          <div class="display" style="font-size:40px;color:{INK};">AaBbCc 0123456789</div>
          <div class="body-dark" style="font-size:13px;max-width:430px;">
            A geometric sans that matches the wordmark's own lettering. Set headlines tight
            and large; it loses its character at small sizes.
          </div>
        </div>
        <div style="width:1px;align-self:stretch;background:rgba(12,12,12,.12);"></div>
        <div class="col" style="flex:1;gap:22px;">
          <div class="eyebrow" style="font-size:11px;">Text face</div>
          <div style="font-family:'Inter';font-weight:600;font-size:96px;color:{INK};
               letter-spacing:-.03em;">Inter</div>
          <div style="font-family:'Inter';font-size:40px;color:{INK};">AaBbCc 0123456789</div>
          <div class="body-dark" style="font-size:13px;max-width:430px;">
            Carries everything Poppins shouldn't: paragraphs, labels, tables, interface
            copy. Both faces are open source, so they install anywhere without licensing.
          </div>
        </div>
      </div>

      <div class="col" style="margin-top:auto;gap:12px;flex:none;">
        <div class="eyebrow" style="font-size:11px;">Type scale</div>
        <div class="col" style="border-bottom:1px solid rgba(12,12,12,.10);">{scale_rows}</div>
        <div class="body-dark" style="font-size:13px;margin-top:10px;max-width:960px;">
          The wordmark is artwork, not type — never re-set "AX-Channels" in Poppins to fake
          the logo. Where neither face is available (email clients, Office templates), fall
          back to Arial or Helvetica rather than substituting another display face.
        </div>
      </div>"""
    return dict(out="guidelines/03-typography.png",
                html=page(W, H, sheet("03", "Typography", content)),
                width=W, height=H, scale=SCALE)


# ------------------------------------------- 04 clear space and misuse ----

def clearspace_and_misuse():
    unit = 34  # one clear-space unit on this sheet

    def bad(inner: str, label: str) -> str:
        return f"""
        <div class="col">
          <div class="row" style="position:relative;justify-content:center;align-items:center;
               background:{MIST};height:128px;padding:22px;overflow:hidden;
               border:1px solid rgba(12,12,12,.10);">
            {inner}
            <div style="position:absolute;top:8px;right:8px;width:20px;height:20px;
                 border-radius:999px;background:{MAGENTA};color:#fff;font-size:13px;
                 line-height:20px;text-align:center;font-weight:700;">&times;</div>
          </div>
          <div class="body-dark" style="font-size:12px;margin-top:9px;">{label}</div>
        </div>"""

    misuse = "".join([
        bad(logo_img('ax-logo-primary-on-light.png', height=52,
                     style="transform:scaleX(1.42);"), "Don't stretch or condense it"),
        bad(logo_img('ax-logo-primary-on-light.png', height=52,
                     style="transform:rotate(-13deg);"), "Don't rotate it"),
        bad(logo_img('ax-logo-primary-on-light.png', height=52,
                     style="filter:hue-rotate(125deg) saturate(1.6);"),
            "Don't recolour the mark"),
        bad(logo_img('ax-logo-primary-on-light.png', height=52,
                     style="filter:drop-shadow(6px 8px 5px rgba(12,12,12,.5));"),
            "No shadows, glows or bevels"),
        bad(f'<div style="position:absolute;inset:0;background:{MAGENTA};"></div>'
            + logo_img('ax-logo-primary-on-light.png', height=52, style="position:relative;"),
            "Don't sit it on a clashing colour"),
        bad(f"""<div class="row" style="gap:12px;align-items:center;">
                  {logo_img('ax-mark-primary-on-light.png', height=40)}
                  <div style="font-family:'Liberation Serif',serif;font-size:30px;color:{INK};">
                    AX-Channels</div>
                </div>""", "Don't re-set the wordmark"),
    ])

    clear = f"""
      <div class="col" style="flex:1;gap:16px;">
        <div class="eyebrow" style="font-size:11px;">Clear space</div>
        <div class="row" style="justify-content:center;align-items:center;background:{MIST};
             padding:30px;border:1px solid rgba(12,12,12,.10);">
          <div style="position:relative;padding:{unit}px;border:1px dashed {MAGENTA};">
            <div style="position:absolute;left:0;top:0;width:{unit}px;height:{unit}px;
                 background:rgba(214,47,108,.14);"></div>
            <div style="position:absolute;right:0;bottom:0;width:{unit}px;height:{unit}px;
                 background:rgba(214,47,108,.14);"></div>
            {logo_img('ax-logo-primary-on-light.png', height=68)}
          </div>
          <div class="col" style="margin-left:26px;gap:8px;max-width:250px;">
            <div class="headline" style="font-size:19px;color:{INK};">x = half the mark's height</div>
            <div class="body-dark" style="font-size:12px;">
              Keep at least one x of empty space on every side. Nothing — type, rules,
              photographs, page edges — comes inside it.
            </div>
          </div>
        </div>
      </div>"""

    minimums = f"""
      <div class="col" style="flex:1;gap:16px;">
        <div class="eyebrow" style="font-size:11px;">Minimum size</div>
        <div class="row" style="background:{MIST};border:1px solid rgba(12,12,12,.10);
             padding:26px 30px;gap:34px;align-items:center;flex:1;">
          <div class="col" style="align-items:center;gap:12px;">
            {logo_img('ax-logo-primary-on-light.png', width=120)}
            <div class="body-dark" style="font-size:11px;text-align:center;">Screen<br>120px wide</div>
          </div>
          <div class="col" style="align-items:center;gap:12px;">
            {logo_img('ax-logo-primary-on-light.png', width=90)}
            <div class="body-dark" style="font-size:11px;text-align:center;">Print<br>25mm wide</div>
          </div>
          <div class="col" style="align-items:center;gap:12px;">
            {logo_img('ax-mark-primary-on-light.png', width=44)}
            <div class="body-dark" style="font-size:11px;text-align:center;">Mark alone<br>24px / 8mm</div>
          </div>
          <div class="body-dark" style="font-size:12px;flex:1;">
            Below these sizes the tagline and the wordmark's counters fill in. Use the mark
            on its own instead of shrinking the full logo further.
          </div>
        </div>
      </div>"""

    content = f"""
      <div class="row" style="gap:30px;align-items:stretch;flex:none;">{clear}{minimums}</div>
      <div class="col" style="margin-top:30px;gap:14px;flex:none;">
        <div class="eyebrow" style="font-size:11px;">Misuse — none of these, ever</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:22px 26px;">{misuse}</div>
      </div>"""
    return dict(out="guidelines/04-clear-space-and-misuse.png",
                html=page(W, H, sheet("04", "Clear space, sizing and misuse", content)),
                width=W, height=H, scale=SCALE)


def all_assets():
    return [logo_system(), colour(), typography(), clearspace_and_misuse()]
