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

CODE_W, OBS_W, FLAG_W = 18.0, 52.0, 8.0
ROW_H = 5.3            # brief: 6 mm; 5.3 mm is what lets page 1 hold its four categories in cards
BAR_H = 7.5            # brief: 8 mm; see ROW_H
LABEL_PT, DESC_PT, CODE_PT = 9.5, 9.0, 11.0
LABEL_LINE = 3.3       # a label wider than its column takes a second line (7.2 mm box)
CAT_GAP = 1.2
TITLE = "Conduct Observation Code Reference"


def _category(s, title, tint, items):
    """A black category bar and its boxed rows: code chip, label box,
    description box and flag box, on alternating pale bands. Returns the y
    below the block."""
    x0, w = s._inner()
    desc_w = w - CODE_W - OBS_W - FLAG_W
    s.bar(title, size=9.5, h=6.0)
    s.y -= 0.5
    y = s.y
    box_h = ROW_H - s.BOX_GAP
    for i, (code, label, desc, flag) in enumerate(items):
        lines = s.wrap(label, OBS_W - s.BOX_X - 3.0, LABEL_PT, "b")
        bh = box_h if len(lines) == 1 else 0.6 + LABEL_LINE * len(lines)
        if i % 2 == 1:
            s.rect(x0 - 0.6, y - s.BOX_GAP / 2, w + 1.2, bh + s.BOX_GAP, fill=TINT, radius=0.8)
        s.box(x0, y, CODE_W - s.BOX_X, bh, code, CODE_PT, "b", "center", chip=True)
        lx = x0 + CODE_W
        s.box(lx, y, OBS_W - s.BOX_X, bh)
        first = centre_baseline(y, bh, LABEL_PT) - (len(lines) - 1) * LABEL_LINE / 2
        for k, line in enumerate(lines):
            s.text(line, lx + 1.5, first + k * LABEL_LINE, LABEL_PT, "b", BRAND)
        dx = x0 + CODE_W + OBS_W
        if text_width(desc, DESC_PT) > desc_w - s.BOX_X - settings.CELL_PAD * 2:
            s.truncated.append(f"{code}: description needs more than one line")
        s.box(dx, y, desc_w - s.BOX_X, bh, desc, DESC_PT)
        fx = x0 + w - FLAG_W
        s.box(fx, y, FLAG_W, bh)
        if flag:
            s.symbol("triangle" if flag == d.SERIOUS else "diamond", fx + FLAG_W / 2,
                     y + bh / 2, 2.6)
        y += bh + s.BOX_GAP
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
    s.card_begin()
    s.title_bar("CONDUCT OBSERVATION CODE REFERENCE", "Copy the applicable code onto the daily form")
    s.info_bar([[
        ("Academic year", str(settings.ACADEMIC_YEAR)), ("Effective date", "__________"),
        ("Approved by", "SMT / SGB"), ("Master version", d.MASTER_VERSION),
        ("Status", d.STATUS, "red"),
    ]])
    # the flag legend, its flags drawn as shapes
    x0, _ = s._inner()
    lx, lh = x0 + 1.0, 3.6
    base = centre_baseline(s.y, lh, 8.5)
    for kind, text in (("triangle", "Incident report follows  \u00b7  "),
                       ("diamond", "Safeguarding: protected process  \u00b7  Flags proposed, awaiting SMT approval")):
        s.symbol(kind, lx + 1.3, s.y + lh / 2, 2.4)
        lx += 3.6
        lx += s.text(text, lx, base, 8.5, "b", BRAND)
    s.y += lh + 1.5
    s.status_line(settings.DRAFT_NOTICE)
    s.y -= 1.5
    s.card_end()
    s.card_begin()
    for title, tint, items in d.PAGE_1:
        _category(s, title, tint, items)
    s.y -= CAT_GAP
    s.card_end(gap=settings.BLOCK_GAP)
    _footer(s, 1)
    return s


def page2():
    s = Sheet()
    s.card_begin()
    s.bar(f"OC-01 \u00b7 {TITLE} (continued)", f"v{d.MASTER_VERSION} \u00b7 {d.STATUS}")
    for title, tint, items in d.PAGE_2:
        _category(s, title, tint, items)
    s.y -= CAT_GAP
    s.card_end(gap=settings.BLOCK_GAP)
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
