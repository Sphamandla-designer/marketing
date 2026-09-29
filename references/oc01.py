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
from design import (Sheet, RED, INK, MUTED, HAIR, WHITE, TINT, BRAND, BAND, RADIUS,
                    centre_baseline, text_width)

CODE_W, OBS_W, FLAG_W = 16.0, 52.0, 8.0
ROW_H = 5.8            # brief: 6 mm; 5.8 mm is what lets page 1 hold its four categories
BAR_H = 7.5            # brief: 8 mm; see ROW_H
LABEL_PT, DESC_PT, CODE_PT = 9.5, 9.0, 11.0
LABEL_LINE = 3.5       # a label wider than its column takes a second line (7.8 mm row)
CAT_GAP = 0.8
TITLE = "Conduct Observation Code Reference"


def _category(s, title, tint, items):
    """A red category bar and its rows. Returns the y below the block."""
    x0, w = s.x0, s.w
    desc_w = w - CODE_W - OBS_W - FLAG_W
    y = s.y
    s.rect(x0, y, w, BAR_H, fill=BRAND, radius=RADIUS["bar"])
    s.text(title, x0 + 3.0, centre_baseline(y, BAR_H, 9.5), 9.5, "b", WHITE)
    y += BAR_H
    for i, (code, label, desc, flag) in enumerate(items):
        lines = s.wrap(label, OBS_W - 3.0, LABEL_PT, "b")
        rh = ROW_H if len(lines) == 1 else 0.8 + LABEL_LINE * len(lines)
        if i % 2 == 1:
            s.rect(x0, y, w, rh, fill=TINT)
        # code, centred in its column
        s.text(code, x0 + CODE_W / 2, centre_baseline(y, rh, CODE_PT), CODE_PT,
               "b", BRAND, "center")
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
            s.symbol("triangle" if flag == d.SERIOUS else "diamond",
                     x0 + w - FLAG_W / 2, y + rh / 2, 2.6)
        s.line(x0, y + rh, x0 + w, y + rh, HAIR, 0.25)
        y += rh
    s.rect(x0, s.y + BAR_H, w, y - s.y - BAR_H, stroke=HAIR, lw=0.4)
    s.y = y + CAT_GAP
    return y


FOOT_LINE = 3.8


def _footer(s, page):
    """Leon's footer lines, one per line, then the controlled line with the
    page chip: at 8 pt on a portrait page the note and the alert cannot share
    a line."""
    s.footer("OC-01", TITLE, d.FOOTER_NOTE, alert=d.FOOTER_ALERT,
             subnote=d.FOOTER_SUBNOTE, page=(page, 2))


def page1():
    s = Sheet()
    s.header("OC-01", "CONDUCT OBSERVATION CODE MASTER", d.STATUS, version=d.MASTER_VERSION,
             period=f"Academic year {settings.ACADEMIC_YEAR}", masthead="CONDUCT OBSERVATION CODES")
    s.title_bar("CONDUCT OBSERVATION CODE REFERENCE", "Copy the applicable code onto the daily form")
    s.info_bar([[
        ("Academic year", str(settings.ACADEMIC_YEAR)), ("Effective date", "__________"),
        ("Approved by", "SMT / SGB"), ("Master version", d.MASTER_VERSION),
        ("Status", d.STATUS, "red"),
    ]])
    # flag legend, directly under the info bar
    s.y -= settings.BLOCK_GAP - 1.5
    # the legend, its flags drawn as shapes
    lx, lh = s.x0 + settings.PANEL_PAD, 3.6
    base = centre_baseline(s.y, lh, 8.5)
    for kind, text in (("triangle", "Incident report follows  \u00b7  "),
                       ("diamond", "Safeguarding: protected process  \u00b7  Flags proposed, awaiting SMT approval")):
        s.symbol(kind, lx + 1.3, s.y + lh / 2, 2.4)
        lx += 3.6
        lx += s.text(text, lx, base, 8.5, "b", BRAND)
    s.y += 3.6 + 1.5
    for title, tint, items in d.PAGE_1:
        _category(s, title, tint, items)
    s.y += settings.BLOCK_GAP - CAT_GAP
    _footer(s, 1)
    return s


def page2():
    s = Sheet()
    h = 8.0
    s.rect(s.x0, s.y, s.w, h, fill=BRAND, radius=RADIUS["bar"])
    s.text(f"OC-01 · {TITLE} (continued)", s.x0 + 3.5,
           centre_baseline(s.y, h, 10), 10, "b", WHITE)
    s.text(f"v{d.MASTER_VERSION} \u00b7 {d.STATUS}", s.x0 + s.w - 3.5,
           centre_baseline(s.y, h, 8), 8, "i", WHITE, "right")
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
