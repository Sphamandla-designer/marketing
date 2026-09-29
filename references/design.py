"""
The shared design language for every Fisantekraal reference document, built to
the written OC-01 specification: red masthead block, outlined controlled-
reference box, full-width red title bar, light pink info panel, red-headed
tables and a three-part footer.

Everything is placed in millimetres; `Sheet` converts to PDF points once.
"""
import pathlib

import pymupdf as fitz

import settings

MM = 72.0 / 25.4
ROOT = pathlib.Path(__file__).resolve().parent
CREST = ROOT.parent / "forms" / "assets" / "crest.svg"
FONT_DIR = pathlib.Path("/usr/share/fonts/truetype/dejavu")
FONT_FILES = {
    "r": FONT_DIR / "DejaVuSans.ttf",
    "b": FONT_DIR / "DejaVuSans-Bold.ttf",
    "m": FONT_DIR / "DejaVuSansMono-Bold.ttf",
}
_FONTS = {k: fitz.Font(fontfile=str(v)) for k, v in FONT_FILES.items()}

RED = (0xC8 / 255, 0x10 / 255, 0x2E / 255)
INK = (0x1A / 255, 0x1A / 255, 0x1A / 255)
PINK = (0xFB / 255, 0xE3 / 255, 0xE6 / 255)
TINT = (0xFD / 255, 0xF3 / 255, 0xF5 / 255)     # alternating row tint
WHITE = (1.0, 1.0, 1.0)
HAIR = (0xC9 / 255, 0xC9 / 255, 0xC9 / 255)
MUTED = (0x5E / 255, 0x5E / 255, 0x5E / 255)

CAP = 0.729   # DejaVu Sans cap height, as a fraction of the em


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
            kw["radius"] = radius / min(w, h) / 2
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

    def tracked(self, s, x, y, size=9, font="r", color=INK, track=1.6,
                align="left"):
        """Letter-spaced text, for the motto line."""
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
        while len(s) > 1 and text_width(s + "\u2026", size, font) > max_w:
            s = s[:-1]
        return s + "\u2026"

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
    def header(self, code, name, status):
        """Crest, centred school block and the controlled-reference box."""
        y = self.y
        h = settings.HEADER_H
        crest = 18.0
        src = fitz.open(str(CREST))
        pdf = fitz.open("pdf", src.convert_to_pdf())
        self.page.show_pdf_page(self._r(self.x0, y + 1.5, crest, crest), pdf, 0)

        box_w = 58.0
        box_x = self.x0 + self.w - box_w
        cx = (self.x0 + crest + 4 + box_x) / 2
        self.text(settings.SCHOOL_NAME, cx, y + 7.6, 14, "b", RED, "center")
        self.tracked(settings.SCHOOL_MOTTO, cx, y + 13.6, 8, "b", MUTED,
                     track=1.4, align="center")
        self.text(settings.SCHOOL_TAGLINE, cx, y + 19.4, 8.5, "r", MUTED, "center")

        # controlled-reference box. Nothing in it is set below 8 pt; the
        # document name wraps rather than shrink to fit.
        box_h = 25.0
        self.rect(box_x, y, box_w, box_h, fill=WHITE, stroke=RED, lw=0.9)
        cbx = box_x + box_w / 2
        self.text("CONTROLLED REFERENCE", cbx, y + 5.0, 8, "b", MUTED, "center")
        self.text(code, cbx, y + 13.2, 15, "b", RED, "center")
        name_lines = self.wrap(name, box_w - 4, 8, "b")
        for i, line in enumerate(name_lines):
            self.text(line, cbx, y + 17.8 + i * 3.6, 8, "b", INK, "center")
        self.text(f"VERSION {settings.LIST_VERSION} \u00b7 {status}", cbx,
                  y + 17.8 + len(name_lines) * 3.6 + 1.0, 8, "r", MUTED, "center")
        self.y = y + h + settings.BLOCK_GAP

    def title_bar(self, title, instruction):
        h = 8.0
        self.rect(self.x0, self.y, self.w, h, fill=RED, radius=1.2)
        self.text(title, self.x0 + 3.5, centre_baseline(self.y, h, 11), 11, "b",
                  WHITE)
        self.text(instruction, self.x0 + self.w - 3.5,
                  centre_baseline(self.y, h, 8.5), 8.5, "r", WHITE, "right")
        self.y += h + settings.BLOCK_GAP

    MIN_ITEM_GAP = 6.0

    def info_bar(self, rows, big_first=False):
        """
        Light pink panel; `rows` is a list of lists of (label, value). A row
        whose items cannot sit MIN_ITEM_GAP apart is broken over more lines, so
        a long value can never run into the label beside it.
        """
        line_h = 6.2
        rows = self._fit_info_rows(rows, big_first, line_h)
        h = settings.PANEL_PAD * 2 + line_h * len(rows)
        self.rect(self.x0, self.y, self.w, h, fill=PINK, radius=1.6)
        for ri, row in enumerate(rows):
            top = self.y + settings.PANEL_PAD + ri * line_h
            base = centre_baseline(top, line_h, 9)
            # each pair takes its natural width; what is left over is shared out
            # between them, so a long value can never run into the next label
            def spec(ci, pair):
                label, value = pair
                big = big_first and ri == 0 and ci == 0
                lw = text_width(f"{label}  ", 8.5, "b")
                vw = text_width(value, 12 if big else 9, "b" if big else "r")
                return label, value, big, lw, vw
            items = [spec(ci, pair) for ci, pair in enumerate(row)]
            natural = sum(i[3] + i[4] for i in items)
            free = self.w - settings.PANEL_PAD * 2 - natural
            spread = free / (len(items) - 1) if len(items) > 1 else 0
            # a line that is not full keeps a steady gap rather than stretching
            step = max(self.MIN_ITEM_GAP, min(spread, 26.0))
            x = self.x0 + settings.PANEL_PAD
            for label, value, big, lw, vw in items:
                self.text(f"{label}  ", x, base, 8.5, "b", MUTED)
                self.text(value, x + lw,
                          centre_baseline(top, line_h, 12) if big else base,
                          12 if big else 9, "b" if big else "r",
                          RED if big else INK)
                x += lw + vw + step
        self.y += h + settings.BLOCK_GAP

    def _fit_info_rows(self, rows, big_first, line_h):
        """Break any row whose items will not fit on one line."""
        out = []
        avail = self.w - settings.PANEL_PAD * 2
        for ri, row in enumerate(rows):
            def width(ci, pair):
                big = big_first and ri == 0 and ci == 0
                return (text_width(f"{pair[0]}  ", 8.5, "b")
                        + text_width(pair[1], 12 if big else 9, "b" if big else "r"))
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

    def table(self, x, w, cols, rows, row_h, head_h=None, size=9, y=None,
              zebra=True, bold_cols=(), red_cols=()):
        """
        A table with a red header row. `cols` is a list of (heading, width_mm,
        align); a width of None shares out the remaining width. The heading row
        grows to as many lines as the longest heading needs, so a heading is
        never shortened. Returns the y below the table.
        """
        top = self.y if y is None else y
        widths = _resolve(cols, w)
        heads = [self.wrap(c[0], cw - settings.CELL_PAD * 2, self.HEAD_PT, "b")
                 for c, cw in zip(cols, widths)]
        if head_h is None:
            head_h = 2.4 + self.HEAD_LINE * max(len(h) for h in heads)
        self.rect(x, top, w, head_h, fill=RED)
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
            if zebra and ri % 2 == 1:
                self.rect(x, ty, w, row_h, fill=TINT)
            cx = x
            for ci, (value, cw) in enumerate(zip(row, widths)):
                align = cols[ci][2]
                font = "b" if ci in bold_cols else "r"
                colour = RED if ci in red_cols else INK
                self._cell(value, cx, ty, cw, row_h, size, font, colour, align)
                cx += cw
            ty += row_h
        self.rect(x, top, w, ty - top, stroke=HAIR, lw=0.4)
        self.line(x, top + head_h, x + w, top + head_h, HAIR, 0.4)
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

    def panel_title(self, title, y=None):
        """A small red rule and a bold caption above a sub-panel."""
        top = self.y if y is None else y
        self.text(title, self.x0, top + 3.4, 9, "b", RED)
        self.line(self.x0, top + 4.6, self.x0 + self.w, top + 4.6, RED, 0.6)
        return top + 6.4

    def footer(self, code, title, note):
        """Hairline, bold 8 pt note over as many lines as it needs, then the
        three-part controlled line."""
        bottom = settings.PAGE_H - settings.MARGIN
        self.content_bottom = self.y
        lines = self.wrap(note, self.w, 8, "b")
        top = bottom - 5.6 - 3.8 * len(lines)
        self.line(self.x0, top, self.x0 + self.w, top, HAIR, 0.4)
        for i, line in enumerate(lines):
            self.text(line, self.x0, top + 3.6 + i * 3.8, 8, "b", INK)
        base = bottom - 0.8
        left = f"{code}  |  {title}"
        lw = self.text(left, self.x0, base, 8, "r", MUTED)
        rw = text_width(settings.CONTROLLER, 8, "r")
        self.text(settings.CONTROLLER, self.x0 + self.w, base, 8, "r", MUTED, "right")
        # the middle sits in what is left between the two, not at the page centre
        mid = (self.x0 + lw + (self.x0 + self.w - rw)) / 2
        self.text("Fisantekraal High School", mid, base, 8, "r", MUTED, "center")
        self.footer_top = top
        return top

    @property
    def overflow(self):
        """Millimetres by which the content ran past the footer rule."""
        return round(self.content_bottom - settings.BLOCK_GAP - self.footer_top, 2)

    def save(self, path):
        pathlib.Path(path).parent.mkdir(parents=True, exist_ok=True)
        self.doc.save(str(path), deflate=True)


def _resolve(cols, total):
    fixed = sum(c[1] for c in cols if c[1] is not None)
    flex = [c for c in cols if c[1] is None]
    share = (total - fixed) / len(flex) if flex else 0
    return [c[1] if c[1] is not None else share for c in cols]
