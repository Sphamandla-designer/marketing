"""
The shared design language for every Fisantekraal reference document, in the
black-and-white house style of the SA-01 and SA-02 forms, which themselves
follow the First Home Finance application form: Roboto, black rounded section
bars with white caps, a band-grey instruction strip, pale-grey label panels,
hairline rounded cards, a "CONTROLLED REFERENCE" panel in the masthead where
the forms carry "FORM CODE", and a page chip in the footer. Everything prints
in greyscale so it photocopies cleanly. The crest is desaturated on the way in.

Everything is placed in millimetres; `Sheet` converts to PDF points once.
"""
import pathlib

import pymupdf as fitz

import settings

MM = 72.0 / 25.4
ROOT = pathlib.Path(__file__).resolve().parent
CREST = ROOT.parent / "forms" / "assets" / "crest.svg"
FORM_FONTS = ROOT.parent / "forms" / "assets" / "fonts"
FONT_FILES = {
    "r": FORM_FONTS / "Roboto-Regular.ttf",
    "b": FORM_FONTS / "Roboto-Bold.ttf",
    "i": FORM_FONTS / "Roboto-Italic.ttf",
    "m": ROOT / "fonts" / "RobotoMono-Bold.ttf",
}
_FONTS = {k: fitz.Font(fontfile=str(v)) for k, v in FONT_FILES.items()}


def _hex(h):
    return tuple(int(h[i:i + 2], 16) / 255 for i in (1, 3, 5))


# The forms' palette (forms/js/layout.js COLORS), so the whole set reads as one
# family. The names RED and PINK are kept for the callers: in this house style
# RED is the brand black and PINK the pale label grey.
BRAND = _hex("#141414")     # every rule, heading and header bar
BAND = _hex("#6B6B6B")      # instruction bands, secondary text
PALE = _hex("#E8E8E8")      # label cells
PALE_ALT = _hex("#F4F4F4")  # alternating rows
GRID = _hex("#9A9A9A")      # table rules
HAIRLINE = _hex("#C4C4C4")
WHITE = (1.0, 1.0, 1.0)
RED = BRAND
INK = BRAND
PINK = PALE
TINT = PALE_ALT
HAIR = GRID
MUTED = BAND
BOX = BRAND
RADIUS = {"card": 2.4, "bar": 1.6, "band": 1.2, "box": 1.0, "chip": 1.4}

CAP = 0.711   # Roboto cap height, as a fraction of the em

_CREST_PIX = None


def crest_pixmap():
    """The crest, rasterised once and converted to greyscale (luma), as the
    forms do, so it is never the one colour element on the page."""
    global _CREST_PIX
    if _CREST_PIX is None:
        src = fitz.open(str(CREST))
        pix = src[0].get_pixmap(dpi=300, alpha=True)
        _CREST_PIX = fitz.Pixmap(fitz.csGRAY, pix)
    return _CREST_PIX


def text_width(s, size, font="r"):
    return _FONTS[font].text_length(str(s), fontsize=size) / MM


def centre_baseline(top, h, size):
    """Baseline that puts capitals of `size` optically centred in [top, top+h]."""
    return top + (h + CAP * size / MM) / 2


class Sheet:
    """One A4 portrait page, drawn in millimetres from the top left."""

    def __init__(self):
        self.doc = fitz.open()
        self.page = self.doc.new_page(width=settings.PAGE_W * MM,
                                      height=settings.PAGE_H * MM)
        for name, path in FONT_FILES.items():
            self.page.insert_font(fontname=name, fontfile=str(path))
        self.x0 = settings.MARGIN
        self.w = settings.PAGE_W - 2 * settings.MARGIN
        self.y = settings.MARGIN
        self.content_bottom = self.y
        self.footer_top = settings.PAGE_H
        # anything the clip guard had to shorten; a delivery check fails on it
        self.truncated = []

    # ------------------------------------------------------------ primitives
    def _r(self, x, y, w, h):
        return fitz.Rect(x * MM, y * MM, (x + w) * MM, (y + h) * MM)

    def rect(self, x, y, w, h, fill=None, stroke=None, lw=0.4, radius=None):
        kw = {}
        if radius:
            kw["radius"] = min(0.5, radius / min(w, h))
        self.page.draw_rect(self._r(x, y, w, h), color=stroke, fill=fill,
                            width=lw if stroke else 0, **kw)

    def line(self, x1, y1, x2, y2, color=HAIR, lw=0.4):
        self.page.draw_line(fitz.Point(x1 * MM, y1 * MM),
                            fitz.Point(x2 * MM, y2 * MM), color=color, width=lw)

    def text(self, s, x, y, size=9, font="r", color=INK, align="left"):
        """`y` is the baseline. Returns the width drawn, in mm."""
        s = str(s)
        if not s:
            return 0.0
        w = text_width(s, size, font)
        left = x - w if align == "right" else x - w / 2 if align == "center" else x
        self.page.insert_text(fitz.Point(left * MM, y * MM), s, fontname=font,
                              fontsize=size, color=color)
        return w

    def symbol(self, kind, cx, cy, size=2.6, color=BRAND):
        """A filled flag glyph drawn as a shape, so it needs no symbol font:
        "triangle" (serious) or "diamond" (safeguarding), `size` mm tall,
        centred on (cx, cy)."""
        h = size / 2
        if kind == "triangle":
            pts = [(cx - h, cy + h), (cx + h, cy + h), (cx, cy - h)]
        else:
            pts = [(cx, cy - h), (cx + h, cy), (cx, cy + h), (cx - h, cy)]
        pts = [fitz.Point(px * MM, py * MM) for px, py in pts]
        self.page.draw_polyline(pts + [pts[0]], color=color, fill=color, width=0.2)

    def tracked(self, s, x, y, size=9, font="r", color=INK, track=1.6,
                align="left"):
        """Letter-spaced text, for the document title line under the school."""
        chars = list(str(s))
        total = sum(text_width(c, size, font) for c in chars) + track * (len(chars) - 1)
        cx = x - total / 2 if align == "center" else x
        for c in chars:
            if c != " ":
                self.text(c, cx, y, size, font, color)
            cx += text_width(c, size, font) + track
        return total

    def clip(self, s, max_w, size, font="r"):
        """Last-resort guard: shorten with an ellipsis rather than overflow."""
        s = str(s)
        if text_width(s, size, font) <= max_w:
            return s
        self.truncated.append(s)
        while len(s) > 1 and text_width(s + "…", size, font) > max_w:
            s = s[:-1]
        return s + "…"

    def wrap(self, s, max_w, size, font="r"):
        """Greedy word wrap, returning a list of lines."""
        out, line = [], ""
        for word in str(s).split():
            trial = f"{line} {word}".strip()
            if text_width(trial, size, font) <= max_w or not line:
                line = trial
            else:
                out.append(line)
                line = word
        out.append(line)
        return out

    # ---------------------------------------------------------------- blocks
    def header(self, code, name, status, version=None, period=None, masthead=None):
        """Crest, centred school block and the CONTROLLED REFERENCE panel, laid
        out as the forms' masthead: school name, the document title letter-
        spaced beneath it, and the period line."""
        y = self.y
        h = settings.HEADER_H
        crest = 20.0
        self.page.insert_image(self._r(self.x0, y + 1.0, crest, crest),
                               pixmap=crest_pixmap())

        panel_w = 60.0
        panel_x = self.x0 + self.w - panel_w
        cx = (self.x0 + crest + 3 + panel_x - 3) / 2
        self.text(settings.SCHOOL_NAME, cx, y + 7.2, 13.5, "b", BRAND, "center")
        self.tracked(masthead or name, cx, y + 13.4, 8.5, "b", BAND, track=1.6, align="center")
        self.text(period or f"{settings.ACADEMIC_YEAR} · Term {settings.TERM}",
                  cx, y + 20.4, 9, "i", BRAND, "center")

        # the panel: a black strip with the panel title, then the code, the
        # document name and the version line. Nothing in it is below 8 pt.
        strip_h = 4.6
        name_lines = self.wrap(name, panel_w - 6, 8, "b")
        panel_h = strip_h + 6.0 + 3.6 * len(name_lines) + 4.6
        self.rect(panel_x, y, panel_w, panel_h, fill=WHITE, stroke=BRAND, lw=0.6,
                  radius=RADIUS["box"])
        self.rect(panel_x + 0.6, y + 0.6, panel_w - 1.2, strip_h, fill=BRAND,
                  radius=RADIUS["box"])
        pcx = panel_x + panel_w / 2
        self.text("CONTROLLED REFERENCE", pcx, centre_baseline(y + 0.6, strip_h, 8),
                  8, "b", WHITE, "center")
        self.text(code, pcx, y + strip_h + 5.4, 12, "b", BRAND, "center")
        ny = y + strip_h + 8.6
        for i, line in enumerate(name_lines):
            self.text(line, pcx, ny + i * 3.6, 8, "b", BRAND, "center")
        self.text(f"VERSION {version or settings.LIST_VERSION} · {status}", pcx,
                  ny + len(name_lines) * 3.6 + 0.8, 8, "r", BAND, "center")
        # the page code under the panel, as the forms print beside the barcode
        self.text(f"{code.replace('-', '')}-P1", self.x0 + self.w, y + h - 1.6, 8,
                  "r", BAND, "right")
        self.y = y + h + settings.BLOCK_GAP

    def title_bar(self, title, instruction):
        """The section bar: black, rounded, white bold caps, the instruction
        in white italic on the right, as the forms' card headers."""
        h = 8.0
        self.rect(self.x0, self.y, self.w, h, fill=BRAND, radius=RADIUS["bar"])
        self.text(title, self.x0 + 3.5, centre_baseline(self.y, h, 11), 11, "b",
                  WHITE)
        self.text(instruction, self.x0 + self.w - 3.5,
                  centre_baseline(self.y, h, 8.5), 8.5, "i", WHITE, "right")
        self.y += h + settings.BLOCK_GAP

    def status_line(self, text):
        """The forms' instruction band: band grey, white italic."""
        h = 5.0
        self.rect(self.x0, self.y, self.w, h, fill=BAND, radius=RADIUS["band"])
        self.text(text, self.x0 + 2.6, centre_baseline(self.y, h, 8), 8, "i", WHITE)
        self.y += h + 2.5

    def note_line(self, text, font="i", size=8, color=MUTED):
        """One line of small text below a block, e.g. the elective note."""
        h = 4.0
        self.text(text, self.x0 + 1.0, centre_baseline(self.y, h, size), size,
                  font, color)
        self.y += h + settings.BLOCK_GAP

    MIN_ITEM_GAP = 6.0

    def info_bar(self, rows, big_first=False):
        """
        The pale label panel: a rounded pale-grey card; `rows` is a list of
        lists of (label, value) or (label, value, "red") for an emphasised
        value. A row whose items cannot sit MIN_ITEM_GAP apart is broken over
        more lines, so a long value can never run into the label beside it.
        """
        line_h = 6.2
        rows = self._fit_info_rows(rows, big_first, line_h)
        h = settings.PANEL_PAD * 2 + line_h * len(rows)
        self.rect(self.x0, self.y, self.w, h, fill=PALE, radius=RADIUS["card"])
        for ri, row in enumerate(rows):
            top = self.y + settings.PANEL_PAD + ri * line_h
            base = centre_baseline(top, line_h, 9)

            def spec(ci, pair):
                label, value = pair[0], pair[1]
                red = len(pair) > 2 and pair[2] == "red"
                big = big_first and ri == 0 and ci == 0
                lw = text_width(f"{label}:  ", 8.5, "b")
                vw = text_width(value, 12 if big else 9, "b" if (big or red) else "r")
                return label, value, big, lw, vw, red
            items = [spec(ci, pair) for ci, pair in enumerate(row)]
            natural = sum(i[3] + i[4] for i in items)
            free = self.w - settings.PANEL_PAD * 2 - natural
            spread = free / (len(items) - 1) if len(items) > 1 else 0
            step = max(self.MIN_ITEM_GAP, min(spread, 26.0))
            x = self.x0 + settings.PANEL_PAD
            for label, value, big, lw, vw, red in items:
                self.text(f"{label}:  ", x, base, 8.5, "b", BRAND)
                self.text(value, x + lw,
                          centre_baseline(top, line_h, 12) if big else base,
                          12 if big else 9, "b" if (big or red) else "r", BRAND)
                x += lw + vw + step
        self.y += h + settings.BLOCK_GAP

    def _fit_info_rows(self, rows, big_first, line_h):
        """Break any row whose items will not fit on one line."""
        out = []
        avail = self.w - settings.PANEL_PAD * 2
        for ri, row in enumerate(rows):
            def width(ci, pair):
                big = big_first and ri == 0 and ci == 0
                red = len(pair) > 2 and pair[2] == "red"
                return (text_width(f"{pair[0]}:  ", 8.5, "b")
                        + text_width(pair[1], 12 if big else 9, "b" if (big or red) else "r"))
            line, used = [], 0.0
            for ci, pair in enumerate(row):
                pw = width(ci, pair)
                gap = self.MIN_ITEM_GAP if line else 0
                if line and used + gap + pw > avail:
                    out.append(line)
                    line, used = [pair], pw
                else:
                    line.append(pair)
                    used += gap + pw
            out.append(line)
        return out

    HEAD_PT = 9.0     # the spec's 9 pt minimum applies to headings too
    HEAD_LINE = 3.9
    LINE = 3.6

    def table(self, x, w, cols, rows, row_h, head_h=None, size=9, y=None,
              zebra=True, bold_cols=(), red_cols=(), wrap_cols=()):
        """
        A table with a black header row, alternating pale rows and grid rules,
        in a rounded hairline frame. `cols` is a list of (heading, width_mm,
        align); a width of None shares out the remaining width. The heading
        row grows to as many lines as the longest heading needs, so a heading
        is never shortened. Returns the y below the table.
        """
        top = self.y if y is None else y
        widths = _resolve(cols, w)
        heads = [self.wrap(c[0], cw - settings.CELL_PAD * 2, self.HEAD_PT, "b")
                 for c, cw in zip(cols, widths)]
        if head_h is None:
            head_h = 2.4 + self.HEAD_LINE * max(len(h) for h in heads)
        self.rect(x, top, w, head_h, fill=BRAND, radius=RADIUS["box"])
        # square off the bottom of the header so it meets the rows cleanly
        self.rect(x, top + head_h - 1.2, w, 1.2, fill=BRAND)
        cx = x
        for (head, _, align), cw, lines in zip(cols, widths, heads):
            first = centre_baseline(top, head_h, self.HEAD_PT) \
                - (len(lines) - 1) * self.HEAD_LINE / 2
            for k, line in enumerate(lines):
                hx = (cx + cw / 2 if align == "center"
                      else cx + cw - settings.CELL_PAD if align == "right"
                      else cx + settings.CELL_PAD)
                self.text(line, hx, first + k * self.HEAD_LINE, self.HEAD_PT,
                          "b", WHITE, align)
            cx += cw
        ty = top + head_h
        for ri, row in enumerate(rows):
            wrapped = {}
            for ci in wrap_cols:
                font = "b" if ci in bold_cols else "r"
                lines = self.wrap(row[ci], widths[ci] - settings.CELL_PAD * 2, size, font)
                if len(lines) > 1:
                    wrapped[ci] = lines
            rh = max(row_h, 1.4 + self.LINE * max((len(v) for v in wrapped.values()), default=1)) \
                if wrapped else row_h
            if zebra and ri % 2 == 1:
                self.rect(x, ty, w, rh, fill=TINT)
            cx = x
            for ci, (value, cw) in enumerate(zip(row, widths)):
                align = cols[ci][2]
                font = "b" if ci in bold_cols else "r"
                colour = INK
                if ci in wrapped:
                    lines = wrapped[ci]
                    first = centre_baseline(ty, rh, size) - (len(lines) - 1) * self.LINE / 2
                    for k, line in enumerate(lines):
                        self.text(line, cx + settings.CELL_PAD, first + k * self.LINE,
                                  size, font, colour)
                else:
                    self._cell(value, cx, ty, cw, rh, size, font, colour, align)
                cx += cw
            ty += rh
            self.line(x, ty, x + w, ty, GRID, 0.25)
        self.rect(x, top, w, ty - top, stroke=GRID, lw=0.4, radius=RADIUS["box"])
        return ty

    def _cell(self, value, x, y, w, h, size, font, colour, align):
        base = centre_baseline(y, h, size)
        value = self.clip(value, w - settings.CELL_PAD * 2, size, font)
        if align == "center":
            self.text(value, x + w / 2, base, size, font, colour, "center")
        elif align == "right":
            self.text(value, x + w - settings.CELL_PAD, base, size, font, colour, "right")
        else:
            self.text(value, x + settings.CELL_PAD, base, size, font, colour)

    def panel_title(self, title, y=None, w=None, x=None):
        """A black rounded group bar with the heading in white caps."""
        top = self.y if y is None else y
        h = 6.0
        self.rect(self.x0 if x is None else x, top, self.w if w is None else w,
                  h, fill=BRAND, radius=RADIUS["bar"])
        self.text(title, (self.x0 if x is None else x) + 3.0,
                  centre_baseline(top, h, 9), 9, "b", WHITE)
        return top + h + 1.2

    def footer(self, code, title, note, alert=None, subnote=None, page_label=None,
               page=(1, 1)):
        """Hairline, the bold 8 pt note (and the alert beneath it), an optional
        grey sub-note, then the forms' controlled line: code and title on the
        left, the controller in the middle, the page chip on the right."""
        bottom = settings.PAGE_H - settings.MARGIN
        self.content_bottom = self.y
        lines = self.wrap(note, self.w, 8, "b")
        extra = (3.8 if alert else 0) + (3.8 if subnote else 0)
        top = bottom - 6.4 - 3.8 * len(lines) - extra
        self.line(self.x0, top, self.x0 + self.w, top, HAIRLINE, 0.3)
        y = top + 3.6
        for line in lines:
            self.text(line, self.x0, y, 8, "b", BRAND)
            y += 3.8
        if alert:
            self.text(alert, self.x0, y, 8, "b", BRAND)
            y += 3.8
        if subnote:
            self.text(subnote, self.x0, y, 8, "r", BAND)
            if page_label:
                self.text(page_label, self.x0 + self.w, y, 8, "b", BRAND, "right")
            y += 3.8
        base = bottom - 1.0
        lw = self.text(code, self.x0, base, 8, "b", BRAND)
        lw += self.text("   |   ", self.x0 + lw, base, 8, "r", HAIRLINE)
        self.text(title, self.x0 + lw, base, 8, "r", BAND)
        chip_w, chip_h = 20.0, 4.6
        chip_x, chip_y = self.x0 + self.w - chip_w, base - 3.4
        self.rect(chip_x, chip_y, chip_w, chip_h, fill=PALE, radius=RADIUS["chip"])
        self.text(f"Page {page[0]} of {page[1]}", chip_x + chip_w / 2,
                  centre_baseline(chip_y, chip_h, 8), 8, "b", BRAND, "center")
        self.text(settings.CONTROLLER, chip_x - 4.0, base, 8, "r", BAND, "right")
        self.footer_top = top
        return top

    @property
    def overflow(self):
        """Millimetres by which the content ran past the footer rule."""
        return round(self.content_bottom - settings.BLOCK_GAP - self.footer_top, 2)

    def save(self, path):
        pathlib.Path(path).parent.mkdir(parents=True, exist_ok=True)
        try:
            self.doc.subset_fonts(verbose=False)
        except Exception:
            pass
        self.doc.save(str(path), deflate=True, garbage=4, clean=True)


def _resolve(cols, total):
    fixed = sum(c[1] for c in cols if c[1] is not None)
    flex = [c for c in cols if c[1] is None]
    share = (total - fixed) / len(flex) if flex else 0
    return [c[1] if c[1] is not None else share for c in cols]
