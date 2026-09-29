"""
OC-01 Conduct Observation Code Reference, master version 0.2: two A4 portrait
pages printed double-sided. Page 1 carries the full OC-01 header, title bar,
info bar and flag legend; page 2 a slim continuation header. Both carry the
footer. Codes and labels are Leon's v0.1; the descriptions and the proposed
flags are new in v0.2.
"""
import pymupdf as fitz

import settings
import oc01_data as d
from design import (Sheet, RED, INK, MUTED, HAIR, WHITE, PINK, centre_baseline,
                    text_width)

CODE_W, OBS_W, FLAG_W = 16.0, 52.0, 8.0
ROW_H = 5.5            # brief: 6 mm; 5.5 mm is what lets page 1 hold its four categories
BAR_H = 7.5            # brief: 8 mm; see ROW_H
LABEL_PT, DESC_PT, CODE_PT = 9.5, 9.0, 11.0
LABEL_LINE = 3.5       # a label wider than its column takes a second line (7.8 mm row)
CAT_GAP = 0.8
TINTS = {
    "green": (0xEE / 255, 0xF7 / 255, 0xEE / 255),
    "blue": (0xEC / 255, 0xF2 / 255, 0xFA / 255),
    "orange": (0xFD / 255, 0xF2 / 255, 0xE4 / 255),
    "pink": (0xFB / 255, 0xEA / 255, 0xEC / 255),
    "purple": (0xF1 / 255, 0xEE / 255, 0xF8 / 255),
}
TITLE = "Conduct Observation Code Reference"


def _category(s, title, tint, items):
    """A red category bar and its rows. Returns the y below the block."""
    x0, w = s.x0, s.w
    desc_w = w - CODE_W - OBS_W - FLAG_W
    y = s.y
    s.rect(x0, y, w, BAR_H, fill=RED)
    s.text(title, x0 + 3.0, centre_baseline(y, BAR_H, 9.5), 9.5, "b", WHITE)
    y += BAR_H
    for i, (code, label, desc, flag) in enumerate(items):
        lines = s.wrap(label, OBS_W - 3.0, LABEL_PT, "b")
        rh = ROW_H if len(lines) == 1 else 0.8 + LABEL_LINE * len(lines)
        if i % 2 == 0:
            s.rect(x0, y, w, rh, fill=TINTS[tint])
        # code, centred in its column
        s.text(code, x0 + CODE_W / 2, centre_baseline(y, rh, CODE_PT), CODE_PT,
               "b", RED, "center")
        # label, on one or two lines
        first = centre_baseline(y, rh, LABEL_PT) - (len(lines) - 1) * LABEL_LINE / 2
        for k, line in enumerate(lines):
            s.text(line, x0 + CODE_W + 1.5, first + k * LABEL_LINE, LABEL_PT, "b", INK)
        # description, always one line: the check fails if it would wrap
        dx = x0 + CODE_W + OBS_W + settings.CELL_PAD
        if text_width(desc, DESC_PT) > desc_w - settings.CELL_PAD * 2:
            s.truncated.append(f"{code}: description needs more than one line")
        s.text(desc, dx, centre_baseline(y, rh, DESC_PT), DESC_PT, "r", INK)
        if flag:
            s.text(flag, x0 + w - FLAG_W / 2, centre_baseline(y, rh, 9.5), 9.5, "r",
                   RED if flag == d.SERIOUS else INK, "center")
        s.line(x0, y + rh, x0 + w, y + rh, HAIR, 0.3)
        y += rh
    s.rect(x0, s.y, w, y - s.y, stroke=HAIR, lw=0.4)
    s.y = y + CAT_GAP
    return y


FOOT_LINE = 3.8


def _footer(s, page):
    """Leon's footer lines, one per line: at 8 pt on a portrait page the note
    and the alert cannot share a line, and the controlled line cannot hold
    all three of its parts, so the school name and the page number sit at the
    right of the sub-note line."""
    bottom = settings.PAGE_H - settings.MARGIN
    s.content_bottom = s.y
    top = bottom - (3.6 + FOOT_LINE * 3 + 1.0)
    s.line(s.x0, top, s.x0 + s.w, top, INK, 0.4)
    y = top + 3.6
    s.text(d.FOOTER_NOTE, s.x0, y, 8, "b", INK)
    y += FOOT_LINE
    s.text(d.FOOTER_ALERT, s.x0, y, 8, "b", RED)
    y += FOOT_LINE
    s.text(d.FOOTER_SUBNOTE, s.x0, y, 8, "r", MUTED)
    s.text(f"Fisantekraal High School \u00b7 Page {page} of 2", s.x0 + s.w, y, 8, "b",
           INK, "right")
    y = bottom - 0.8
    s.text(f"OC-01  |  {TITLE}", s.x0, y, 8, "r", MUTED)
    s.text(settings.CONTROLLER, s.x0 + s.w, y, 8, "r", MUTED, "right")
    s.footer_top = top


def page1():
    s = Sheet()
    s.header("OC-01", "CONDUCT OBSERVATION CODE MASTER", d.STATUS, version=d.MASTER_VERSION)
    s.title_bar("CONDUCT OBSERVATION CODE REFERENCE", "Copy the applicable code onto the daily form")
    s.info_bar([[
        ("Academic year", str(settings.ACADEMIC_YEAR)), ("Effective date", "__________"),
        ("Approved by", "SMT / SGB"), ("Master version", d.MASTER_VERSION),
        ("Status", d.STATUS, "red"),
    ]])
    # flag legend, directly under the info bar
    s.y -= settings.BLOCK_GAP - 1.5
    s.text(d.LEGEND, s.x0 + settings.PANEL_PAD, centre_baseline(s.y, 3.6, 8.5), 8.5, "b", INK)
    s.y += 3.6 + 1.5
    for title, tint, items in d.PAGE_1:
        _category(s, title, tint, items)
    s.y += settings.BLOCK_GAP - CAT_GAP
    _footer(s, 1)
    return s


def page2():
    s = Sheet()
    h = 8.0
    s.rect(s.x0, s.y, s.w, h, fill=RED)
    s.text(f"OC-01 · {TITLE} (continued)", s.x0 + 3.5,
           centre_baseline(s.y, h, 10), 10, "b", WHITE)
    s.text(f"v{d.MASTER_VERSION} \u00b7 {d.STATUS}", s.x0 + s.w - 3.5,
           centre_baseline(s.y, h, 8), 8, "r", WHITE, "right")
    s.y += h + settings.BLOCK_GAP
    for title, tint, items in d.PAGE_2:
        _category(s, title, tint, items)
    s.y += settings.BLOCK_GAP - CAT_GAP
    _footer(s, 2)
    return s


class Pages:
    """Two Sheets saved as one PDF; carries the checks' overflow/truncated view."""

    def __init__(self, sheets):
        self.sheets = sheets

    @property
    def overflow(self):
        return max(s.overflow for s in self.sheets)

    @property
    def truncated(self):
        return [t for s in self.sheets for t in s.truncated]

    def save(self, path):
        doc = fitz.open()
        for s in self.sheets:
            doc.insert_pdf(s.doc)
        try:
            doc.subset_fonts(verbose=False)
        except Exception:
            pass
        doc.save(str(path), deflate=True, garbage=4, clean=True)


def build():
    return Pages([page1(), page2()])
