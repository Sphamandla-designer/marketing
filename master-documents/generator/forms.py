"""Drawing kit that reproduces the SA-01 / SA-02 / SA-OC design language.

All layout values are in millimetres from the TOP of the page, converted to
PDF points internally. Every text call checks that the text fits its space,
so a layout that would overflow fails the build instead of printing badly.
"""
import os
import pymupdf
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.utils import simpleSplit
from reportlab.graphics.barcode import code128

HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(HERE, 'fonts')
for name, f in [('R', 'Roboto-Regular'), ('B', 'Roboto-Bold'), ('I', 'Roboto-Italic'),
                ('M', 'RobotoMono-Bold')]:
    pdfmetrics.registerFont(TTFont(name, os.path.join(FONTS, f + '.ttf')))

W, H = A4
PW, PH = W / mm, H / mm            # 210 x 297

# colours sampled from SA-01 / SA-OC
DARK = (0.08,) * 3
TEXT = (0x1B / 255,) * 3
GREY = (0x6B / 255,) * 3
BAR_GREY = (0x6B / 255,) * 3       # instruction bars
CHIP = (0.91,) * 3                 # label chips, column-header rows
SHADE = (0.96,) * 3                # alternating rows
CELL = (0.33,) * 3                 # value / writing box outlines
RULE = (0.77,) * 3
SEP = (0xC4 / 255,) * 3
WHITE = (1, 1, 1)

# radii (pt) and line widths measured from the originals
R_SECTION, R_BAR, R_ROW, R_CELL = 6.8, 4.5, 3.4, 2.8
LW_SECTION, LW_CELL = 1.13, 0.51

# spacing rules (mm)
MARGIN = 10
GAP = 5
PAD = 4
TITLE_GAP = 3
TITLE_H = 7
INSTR_H = 5
COLHDR_H = 6
CPAD = 2
GUTTER = 6
HEADER_H = 24
FOOTER_H = 6

# minimum text sizes
MIN_TABLE, MIN_NOTE, MIN_LABEL, TITLE_PT = 9, 8, 9, 11

LEFT, RIGHT = MARGIN, PW - MARGIN
USABLE_W = RIGHT - LEFT


def sw(s, font, size):
    return pdfmetrics.stringWidth(s, font, size) / mm


def cap_mm(font, size):
    face = pdfmetrics.getFont(font).face
    return (face.capHeight or face.ascent * 0.7) / 1000 * size / mm


class Doc:
    def __init__(self, path, code, title, subtitle, form_title, barcode_ref, template):
        self.path, self.code, self.title = path, code, title
        self.subtitle, self.form_title, self.ref = subtitle, form_title, barcode_ref
        self.template = template
        self.c = canvas.Canvas(path, pagesize=A4)
        self.c.setTitle(f'{code} {title}')
        self.c.setSubject(f'{code} {title}')
        self.c.setCreator('Fisantekraal High School forms')
        self.c.setAuthor('Fisantekraal High School')
        self.min_pt = 99
        self.boxes = []             # (x0, y0, x1, y1) in mm, for overlap checks

    # ------------------------------------------------------------ primitives
    def Y(self, y_mm):
        return H - y_mm * mm

    def rrect(self, x, y, w, h, r, fill=None, stroke=None, lw=0.5):
        c = self.c
        if fill:
            c.setFillColorRGB(*fill)
        if stroke:
            c.setStrokeColorRGB(*stroke)
            c.setLineWidth(lw)
        c.roundRect(x * mm, self.Y(y + h), w * mm, h * mm, r,
                    stroke=1 if stroke else 0, fill=1 if fill else 0)

    def text(self, x, base, s, font, size, color=TEXT, align='l', max_w=None, space=0):
        if max_w is not None:
            need = sw(s, font, size) + space * max(len(s) - 1, 0) / mm
            assert need <= max_w + 1e-6, f'text too wide ({need:.1f} > {max_w:.1f} mm): {s!r}'
        self.min_pt = min(self.min_pt, size)
        c = self.c
        c.setFillColorRGB(*color)
        if space:
            t = c.beginText()
            t.setFont(font, size)
            t.setCharSpace(space)
            width = sw(s, font, size) + space * (len(s) - 1) / mm
            x0 = {'l': x, 'c': x - width / 2, 'r': x - width}[align]
            t.setTextOrigin(x0 * mm, self.Y(base))
            t.textOut(s)
            c.drawText(t)
            return
        c.setFont(font, size)
        {'l': c.drawString, 'c': c.drawCentredString, 'r': c.drawRightString}[align](
            x * mm, self.Y(base), s)

    def mid(self, y, h, font, size):
        """Baseline that vertically centres capitals in a band."""
        return y + h / 2 + cap_mm(font, size) / 2

    def cell_text(self, x, y, w, h, s, font='R', size=MIN_TABLE, align='l', color=TEXT):
        if not s:
            return
        b = self.mid(y, h, font, size)
        xx = {'l': x + CPAD, 'c': x + w / 2, 'r': x + w - CPAD}[align]
        self.text(xx, b, s, font, size, color, align, max_w=w - 2 * CPAD)

    # ------------------------------------------------------------ header / footer
    def header(self):
        """Crest copied from SA-01; the rest redrawn with SA-01's measured positions."""
        t = self.template
        dy = MARGIN - t['top']                # originals sit at an 8 mm top margin
        dx = MARGIN - t['left']
        # title block
        cx = t['title_cx']
        self.text(cx, t['title_base'] + dy, 'FISANTEKRAAL HIGH SCHOOL', 'B', 13.5, DARK, 'c')
        # SA-01 spaces its subtitle as 'R E G I S T E R   C L A S S' (one space between
        # letters, three between words)
        spaced = '   '.join(' '.join(word) for word in self.subtitle.split())
        self.text(cx, t['sub_base'] + dy, spaced, 'B', 9, GREY, 'c',
                  max_w=2 * min(cx - 32, 139 - cx))   # between crest and form-code box
        self.text(cx, t['term_base'] + dy, '2026 · Term 2', 'I', 9, TEXT, 'c')
        # form-code box
        bx0, by0, bx1, by1 = t['box']
        bx0 -= dx; bx1 -= dx
        self.rrect(bx0, by0 + dy, bx1 - bx0, by1 - by0, t['box_r'], WHITE, DARK, LW_SECTION)
        rx0, ry0, rx1, ry1 = t['bar']
        rx0 -= dx; rx1 -= dx
        self.rrect(rx0, ry0 + dy, rx1 - rx0, ry1 - ry0, t['bar_r'], DARK)
        mx = (bx0 + bx1) / 2
        self.text(mx, t['fc_base'] + dy, 'FORM CODE', 'B', 7, WHITE, 'c')
        self.text(mx, t['code_base'] + dy, self.code, 'B', 10.5, DARK, 'c')
        lines = self.form_title if isinstance(self.form_title, (list, tuple)) else [self.form_title]
        bases = ([(t['l1_base'] + t['l2_base']) / 2] if len(lines) == 1
                 else [t['l1_base'], t['l2_base']])
        for s, b in zip(lines, bases):
            self.text(mx, b + dy, s, 'B', 7, GREY, 'c', max_w=bx1 - bx0 - 4)
        # barcode box
        cx0, cy0, cx1, cy1 = t['bc_box']
        cx0 -= dx; cx1 -= dx
        self.rrect(cx0, cy0 + dy, cx1 - cx0, cy1 - cy0, t['bc_r'], WHITE, RULE, 0.85)
        bars_top, bars_bot = t['bars_y']
        bc = code128.Code128(self.ref, barHeight=(bars_bot - bars_top) * mm,
                             barWidth=0.29 * mm, quiet=False, humanReadable=False)
        self.c.setFillColorRGB(0, 0, 0)
        bc.drawOn(self.c, (t['bars_x0'] - dx) * mm, self.Y(bars_bot + dy))
        assert t['bars_x0'] - dx + bc.width / mm < cx1 - sw(self.ref, 'R', 7) - 3, 'barcode too wide'
        self.text(cx1 - t['ref_right_pad'], t['ref_base'] + dy, self.ref, 'R', 7, GREY, 'r')
        # crest: the same image SA-01 uses, at the same size
        x0, y0, x1, y1 = t['crest']
        self.c.drawImage(crest_image(t['pdf']), (x0 + dx) * mm, self.Y(y1 + dy), (x1 - x0) * mm,
                         (y1 - y0) * mm, mask='auto')
        self.header_bottom = max(by1, cy1) + dy
        assert self.header_bottom <= MARGIN + HEADER_H
        return MARGIN + HEADER_H

    def footer(self):
        top = PH - MARGIN - FOOTER_H
        self.c.setFillColorRGB(*RULE)
        self.c.rect(LEFT * mm, self.Y(top + 0.3), USABLE_W * mm, 0.3 * mm, stroke=0, fill=1)
        pill_h = 4.6
        py = PH - MARGIN - pill_h
        b = self.mid(py, pill_h, 'R', 8)
        pw = sw('Page 1 of 1', 'B', 8) + 6
        left_w = sw(self.code, 'B', 8) + sw('   |   ', 'R', 8) + sw(self.title, 'R', 8)
        school, motto = 'Fisantekraal High School', 'Learn \u00b7 Grow \u00b7 Contribute'
        widths = [left_w, sw(school, 'R', 8), sw(motto, 'I', 8), pw]
        gap = (USABLE_W - sum(widths)) / 3
        assert gap >= 5, 'footer too crowded'
        x = LEFT
        self.text(x, b, self.code, 'B', 8, DARK); x += sw(self.code, 'B', 8)
        self.text(x, b, '   |   ', 'R', 8, SEP); x += sw('   |   ', 'R', 8)
        self.text(x, b, self.title, 'R', 8, GREY)
        x = LEFT + widths[0] + gap
        self.text(x, b, school, 'R', 8, GREY)
        x += widths[1] + gap
        self.text(x, b, motto, 'I', 8, GREY)
        pw = sw('Page 1 of 1', 'B', 8) + 6
        self.rrect(RIGHT - pw, py, pw, pill_h, 4, CHIP)
        self.text(RIGHT - pw / 2, b, 'Page 1 of 1', 'B', 8, DARK, 'c')
        return top

    # ------------------------------------------------------------ blocks
    def box(self, y, h, x=LEFT, w=USABLE_W):
        self.rrect(x, y, w, h, R_SECTION, WHITE, DARK, LW_SECTION)
        self.boxes.append((x, y, x + w, y + h))

    def title_bar(self, x, y, w, title, subtitle=None):
        self.rrect(x, y, w, TITLE_H, R_BAR, DARK)
        b = self.mid(y, TITLE_H, 'B', TITLE_PT)
        self.text(x + 3, b, title, 'B', TITLE_PT, WHITE)
        if subtitle:
            x2 = x + 3 + sw(title, 'B', TITLE_PT) + 2
            self.text(x2, b, subtitle, 'I', 8, WHITE, max_w=x + w - 3 - x2)
        return y + TITLE_H

    def instr_bar(self, x, y, w, s):
        self.rrect(x, y, w, INSTR_H, R_ROW, BAR_GREY)
        self.text(x + 3, self.mid(y, INSTR_H, 'I', 8), s, 'I', 8, WHITE, max_w=w - 6)
        return y + INSTR_H

    def section(self, y, h, title, subtitle=None):
        """Section box with 4 mm padding; returns (inner_x, content_top, inner_w)."""
        self.box(y, h)
        ix, iw = LEFT + PAD, USABLE_W - 2 * PAD
        ty = self.title_bar(ix, y + PAD, iw, title, subtitle)
        return ix, ty + TITLE_GAP, iw

    def info_panel(self, y, rows):
        """rows: list of rows; each row is a list of (label, value, weight, font)."""
        row_h, row_gap = 8, 2
        h = 2 * PAD + len(rows) * row_h + (len(rows) - 1) * row_gap
        self.box(y, h)
        ry = y + PAD
        for row in rows:
            inner = USABLE_W - 2 * PAD
            chips = [sw(lab, 'B', MIN_LABEL) + 2 * CPAD for lab, *_ in row]
            mins = [sw(val, font, MIN_TABLE) + 2 * CPAD + 1 for _, val, _, font in row]
            spare = inner - sum(chips) - sum(mins) - len(row) * 2 - (len(row) - 1) * 4
            assert spare >= 0, f'info panel row does not fit: {row}'
            total_w = sum(r[2] for r in row)
            x = LEFT + PAD
            for (lab, val, wt, font), cw, mn in zip(row, chips, mins):
                self.rrect(x, ry + 0.4, cw, row_h - 0.8, R_CELL, CHIP)
                self.cell_text(x, ry + 0.4, cw, row_h - 0.8, lab, 'B', MIN_LABEL, color=DARK)
                x += cw + 2
                vw = mn + spare * wt / total_w
                self.rrect(x, ry, vw, row_h, R_CELL, WHITE, CELL, LW_CELL)
                self.cell_text(x, ry, vw, row_h, val, font, MIN_TABLE)
                x += vw + 4
            ry += row_h + row_gap
        return y + h

    def col_header(self, x, y, cols):
        """cols: list of (label, width_mm, align)."""
        w = sum(c[1] for c in cols)
        self.rrect(x, y, w, COLHDR_H, R_ROW, CHIP)
        for lab, cw, al, *_ in cols:
            self.cell_text(x, y, cw, COLHDR_H, lab, 'B', MIN_LABEL, al, DARK)
            x += cw
        return y + COLHDR_H

    def rows(self, x, y, cols, data, n, pitch):
        """cols: (label, width, align, font); data: list of tuples (blank rows beyond)."""
        w = sum(c[1] for c in cols)
        for i in range(n):
            ry = y + i * pitch
            if i % 2 == 0:
                self.rrect(x, ry, w, pitch, R_ROW, SHADE)
            if i < len(data):
                cx = x
                for (lab, cw, al, font), v in zip(cols, data[i]):
                    self.cell_text(cx, ry, cw, pitch, str(v), font, MIN_TABLE, al)
                    cx += cw
        return y + n * pitch

    def note(self, x, base, s, max_w):
        self.text(x, base, s, 'I', MIN_NOTE, GREY, max_w=max_w)

    # ------------------------------------------------------------ output
    def save(self, bottom_used):
        foot_top = self.footer()
        assert bottom_used + GAP - 1e-6 <= foot_top, \
            f'{self.code}: content ends at {bottom_used:.1f} mm, footer starts {foot_top:.1f} mm'
        self.c.showPage()
        self.c.save()
        return foot_top


_CREST = {}


def crest_image(pdf):
    if pdf not in _CREST:
        from io import BytesIO
        from reportlab.lib.utils import ImageReader
        doc = pymupdf.open(pdf)
        xref, smask = doc[0].get_images(full=True)[0][:2]
        pix = pymupdf.Pixmap(doc, xref)
        if smask:
            pix = pymupdf.Pixmap(pix, pymupdf.Pixmap(doc, smask))
        _CREST[pdf] = ImageReader(BytesIO(pix.tobytes('png')))
    return _CREST[pdf]


def probe(sa01_pdf):
    """Measure SA-01's header so the new documents reproduce it exactly (values in mm)."""
    p = pymupdf.open(sa01_pdf)[0]
    k = 1 / mm
    spans = []
    for b in p.get_text('rawdict')['blocks']:
        for l in b.get('lines', []):
            for s in l['spans']:
                txt = ''.join(ch['c'] for ch in s['chars'])
                spans.append((txt, s))

    def find(pred):
        return [s for t, s in spans if pred(t, s)]

    def base(s):
        return s['origin'][1] * k

    title = find(lambda t, s: 'FISANTEKRAAL' in t)[0]
    term = find(lambda t, s: 'Term 2' in t and s['bbox'][1] < 95)[0]
    # subtitle: 9 pt grey single letters on one baseline below the title
    sub = sorted(find(lambda t, s: abs(s['size'] - 9) < .1 and s['bbox'][1] < 65
                      and s['bbox'][1] > title['bbox'][3] - 1 and 'FISANTEKRAAL' not in t),
                 key=lambda s: s['origin'][0])
    first_chars = [ch for s in sub for ch in s['chars']]
    x0 = first_chars[0]['origin'][0]
    a, b_ = first_chars[0], first_chars[1]
    adv = pdfmetrics.stringWidth(a['c'], 'B', 9)
    space = b_['origin'][0] - a['origin'][0] - adv
    fc = find(lambda t, s: t == 'FORM CODE')[0]
    code = find(lambda t, s: t.startswith('SA-0') and abs(s['size'] - 10.5) < .1)[0]
    small = sorted(find(lambda t, s: abs(s['size'] - 7) < .1 and s['bbox'][1] > fc['bbox'][3]
                        and s['bbox'][1] < 66 and s['origin'][0] > 380),
                   key=lambda s: s['origin'][1])
    ref = find(lambda t, s: t.startswith('SA01-P'))[0]

    rects = []
    for d in p.get_drawings():
        r = d['rect']
        first = next((it for it in d['items'] if it[0] == 'l'), None)
        rad = (first[1].x - r.x0) if first else 0
        rects.append((r, rad, d))
    box = next((r, rad) for r, rad, d in rects if r.x0 > 380 and r.y0 < 25 and r.height > 30)
    bar = next((r, rad) for r, rad, d in rects if r.x0 > 380 and r.y0 < 26 and r.height < 14 and r.width > 100)
    bcb = next((r, rad) for r, rad, d in rects if r.x0 > 380 and 60 < r.y0 < 75 and r.width > 100)
    bars = [r for r, rad, d in rects if r.x0 > 400 and r.width < 4 and 65 < r.y0 < 75]
    crest = p.get_image_info()[0]['bbox']
    R = lambda r: tuple(v * k for v in (r.x0, r.y0, r.x1, r.y1))
    return dict(
        pdf=sa01_pdf,
        top=box[0].y0 * k, left=crest[0] * k,
        title_cx=(title['bbox'][0] + title['bbox'][2]) / 2 * k, title_base=base(title),
        sub_base=base(sub[0]), sub_space=space, sub_x0=x0 * k,
        term_base=base(term),
        crest=tuple(v * k for v in crest),
        box=R(box[0]), box_r=box[1], bar=R(bar[0]), bar_r=bar[1],
        fc_base=base(fc), code_base=base(code),
        l1_base=base(small[0]), l2_base=base(small[-1]) if len(small) > 1 else base(small[0]) + 2.5,
        bc_box=R(bcb[0]), bc_r=bcb[1],
        bars_y=(min(r.y0 for r in bars) * k, max(r.y1 for r in bars) * k),
        bars_x0=min(r.x0 for r in bars) * k,
        ref_base=base(ref), ref_right_pad=(bcb[0].x1 - ref['bbox'][2]) * k,
    )
