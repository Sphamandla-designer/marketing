"""Build the pre-printed reference documents RL-01, SL-01, CL-01 and SC-01.

    python3 ref.py        # writes the PDFs to reference-documents/ and checks them

Design follows OC-01 (Conduct Observation Code Reference). All layout values are
millimetres from the TOP of an A4 portrait page. Text that would overflow its
cell, or content that would run into the footer, stops the build.
"""
import math
import os
import re

import pymupdf
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.utils import simpleSplit
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

import refdata as D

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.dirname(HERE)
for name, f in [('R', 'DejaVuSans'), ('B', 'DejaVuSans-Bold'), ('M', 'DejaVuSansMono-Bold')]:
    pdfmetrics.registerFont(TTFont(name, os.path.join(HERE, 'fonts', f + '.ttf')))
CREST = os.path.join(HERE, 'assets', 'crest-red.png')


def hexc(h):
    return tuple(int(h[i:i + 2], 16) / 255 for i in (1, 3, 5))


RED, DARK, PINK = hexc('#C8102E'), hexc('#1A1A1A'), hexc('#FBE3E6')
PINK_LINE, TINT = hexc('#EFB6BE'), hexc('#FDF1F3')
GRID, GRID_OUT, GREY, WHITE = hexc('#E1E4E8'), hexc('#C3C9D0'), hexc('#5A6573'), (1, 1, 1)

PW, PH = A4[0] / mm, A4[1] / mm
MARGIN, HEADER_H, GAP, GAP_S, PANEL_PAD, CPAD, GUTTER = 10, 28, 4, 3, 3, 2, 6
LEFT, RIGHT, USABLE = MARGIN, PW - MARGIN, PW - 2 * MARGIN
TITLE_BAR_H, HDR_ROW_H, INFO_ROW_H = 8, 7, 6
MIN_TABLE, MIN_NOTE = 9, 8


def sw(s, font, size):
    return pdfmetrics.stringWidth(s, font, size) / mm


def cap(font, size):
    face = pdfmetrics.getFont(font).face
    return (face.capHeight or face.ascent * .7) / 1000 * size / mm


class Page:
    def __init__(self, fname, code, name, title, status='ISSUED'):
        self.path = os.path.join(OUT, fname)
        self.code, self.name, self.title, self.status = code, name, title, status
        self.c = canvas.Canvas(self.path, pagesize=A4)
        self.c.setTitle(f'{code} {title}')
        self.c.setAuthor('Fisantekraal High School')
        self.c.setCreator('Competence Studio School Intelligence Platform')
        self.table_rects = []           # (x0, y0, x1, y1) mm: text inside must be >= 9 pt

    # ---------------------------------------------------------- primitives
    def Y(self, y):
        return (PH - y) * mm

    def rect(self, x, y, w, h, fill=None, stroke=None, lw=.5, r=0):
        c = self.c
        if fill:
            c.setFillColorRGB(*fill)
        if stroke:
            c.setStrokeColorRGB(*stroke)
            c.setLineWidth(lw)
        if r:
            c.roundRect(x * mm, self.Y(y + h), w * mm, h * mm, r * mm, stroke=bool(stroke), fill=bool(fill))
        else:
            c.rect(x * mm, self.Y(y + h), w * mm, h * mm, stroke=bool(stroke), fill=bool(fill))

    def top_rounded(self, x, y, w, h, r, fill):
        self.rect(x, y, w, h, fill=fill, r=r)
        self.rect(x, y + r, w, h - r, fill=fill)

    def line(self, x0, y0, x1, y1, color, lw):
        self.c.setStrokeColorRGB(*color)
        self.c.setLineWidth(lw)
        self.c.line(x0 * mm, self.Y(y0), x1 * mm, self.Y(y1))

    def text(self, x, base, s, font, size, color=DARK, align='l', max_w=None, space=0):
        width = sw(s, font, size) + space * max(len(s) - 1, 0) / mm
        if max_w is not None:
            assert width <= max_w + 0.1, f'{self.code}: text too wide ({width:.1f} > {max_w:.1f} mm): {s!r}'
        x0 = {'l': x, 'c': x - width / 2, 'r': x - width}[align]
        t = self.c.beginText()
        t.setFont(font, size)
        t.setCharSpace(space)
        t.setFillColorRGB(*color)
        t.setTextOrigin(x0 * mm, self.Y(base))
        t.textOut(s)
        self.c.drawText(t)
        return width

    def mid(self, y, h, font, size):
        return y + h / 2 + cap(font, size) / 2

    # ---------------------------------------------------------- header, title bar, footer
    def header(self):
        c = self.c
        cy0, ch = MARGIN + 3, 21                                   # crest
        c.drawImage(CREST, LEFT * mm, self.Y(cy0 + ch), ch * mm, ch * mm, mask='auto',
                    preserveAspectRatio=True, anchor='c')
        bx0, bw, by0, bh = RIGHT - 52, 52, MARGIN + 1, 26          # controlled-reference box
        cx = (LEFT + ch + bx0) / 2                                 # centre of the title block
        self.text(cx, MARGIN + 9, 'FISANTEKRAAL HIGH SCHOOL', 'B', 16, RED, 'c', max_w=bx0 - LEFT - ch - 4)
        self.text(cx, MARGIN + 15, 'LEARN  \u00b7  GROW  \u00b7  CONTRIBUTE', 'R', 8, DARK, 'c', space=2.4,
                  max_w=bx0 - LEFT - ch - 4)
        self.text(cx, MARGIN + 21, 'Quality Education for a Brighter Tomorrow', 'R', 9, DARK, 'c')
        self.rect(bx0, by0, bw, bh, fill=WHITE, stroke=DARK, lw=.9)
        mx = bx0 + bw / 2
        self.text(mx, by0 + 5, 'CONTROLLED REFERENCE', 'B', 8, DARK, 'c', max_w=bw - 4)
        self.text(mx, by0 + 12.2, self.code, 'B', 18, RED, 'c', max_w=bw - 4)
        words = self.name.split()
        if sw(self.name, 'B', 8) <= bw - 4:
            lines = [self.name]
        else:   # two balanced lines
            splits = [(' '.join(words[:i]), ' '.join(words[i:])) for i in range(1, len(words))]
            lines = list(min(splits, key=lambda p: max(sw(p[0], 'B', 8), sw(p[1], 'B', 8))))
        base = by0 + (16.6 if len(lines) == 2 else 17.8)
        for ln in lines:
            self.text(mx, base, ln, 'B', 8, DARK, 'c', max_w=bw - 4)
            base += 3.4
        self.text(mx, by0 + bh - 2, f'VERSION {D.LIST_VERSION} · {self.status}', 'B', 8, GREY, 'c')
        return MARGIN + HEADER_H

    def title_bar(self, y, title, instr):
        self.rect(LEFT, y, USABLE, TITLE_BAR_H, fill=RED)
        w = self.text(LEFT + 3, self.mid(y, TITLE_BAR_H, 'B', 12), title, 'B', 12, WHITE)
        self.text(RIGHT - 3, self.mid(y, TITLE_BAR_H, 'R', 9), instr, 'R', 9, WHITE, 'r',
                  max_w=USABLE - 6 - w - 6)
        return y + TITLE_BAR_H

    def footer(self, notes):
        """Hairline, bold 8 pt note line(s), then code | title, school, platform. Returns top (mm)."""
        lines = simpleSplit(notes, 'B', 8, USABLE * mm)
        bottom_base = PH - MARGIN - 0.8
        note_base = bottom_base - 5
        top = note_base - (len(lines) - 1) * 3.6 - 4.2
        self.line(LEFT, top, RIGHT, top, DARK, .5)
        for i, ln in enumerate(lines):
            self.text(LEFT, note_base - (len(lines) - 1 - i) * 3.6, ln, 'B', 8, DARK)
        left = f'{self.code}  |  {self.title}'
        right = 'Controlled by Competence Studio School Intelligence Platform'
        wl = self.text(LEFT, bottom_base, left, 'R', 8, DARK)
        wr = self.text(RIGHT, bottom_base, right, 'R', 8, GREY, 'r')
        school = 'Fisantekraal High School'
        ws = sw(school, 'R', 8)
        free0, free1 = LEFT + wl, RIGHT - wr
        cx = min(max(PW / 2, free0 + 5 + ws / 2), free1 - 5 - ws / 2)   # page centre if it fits
        assert cx - ws / 2 >= free0 + 5 - 1e-6, 'footer too crowded'
        self.text(cx, bottom_base, school, 'R', 8, DARK, 'c')
        return top

    # ---------------------------------------------------------- info bar
    def info_bar(self, y, rows, block=None, gap=5):
        """rows: [[(label, value, style)]]; style 'v' value, 'code' red bold, 'b' bold.
        block: (label, value) shown large on the left (e.g. Class 9B)."""
        h = 2 * PANEL_PAD + len(rows) * INFO_ROW_H
        self.rect(LEFT, y, USABLE, h, fill=PINK, stroke=PINK_LINE, lw=.5, r=1.5)
        x0 = LEFT + PANEL_PAD
        if block:
            lab, val = block
            self.text(x0, y + PANEL_PAD + 3.6, lab, 'B', 9, DARK)
            self.text(x0, y + h - PANEL_PAD - .6, val, 'B', 20, RED)
            bw = max(sw(val, 'B', 20), sw(lab, 'B', 9)) + 4
            self.line(x0 + bw, y + 2, x0 + bw, y + h - 2, PINK_LINE, .6)
            x0 += bw + 4
        avail = RIGHT - PANEL_PAD - x0
        for i, row in enumerate(rows):
            base = self.mid(y + PANEL_PAD + i * INFO_ROW_H, INFO_ROW_H, 'B', 9)
            widths = [sw(l + ': ', 'B', 9) + sw(v, 'B' if st != 'v' else 'R', 9) for l, v, st in row]
            spare = avail - sum(widths)
            assert spare >= gap * (len(row) - 1) - 1e-6, f'{self.code}: info row too wide by {-spare:.1f} mm'
            x = x0
            for (l, v, st), w in zip(row, widths):
                lw = self.text(x, base, l + ': ', 'B', 9, DARK)
                self.text(x + lw, base, v, 'R' if st == 'v' else 'B', 9, RED if st == 'code' else DARK)
                x += w + max(gap, spare / max(len(row) - 1, 1) if len(row) > 1 else 0)
        return y + h

    # ---------------------------------------------------------- tables
    def table(self, x, y, cols, rows, pitch, hdr_h=HDR_ROW_H):
        """cols: (label, width, align, kind); kind: no | surname | text | code | bold."""
        w = sum(c[1] for c in cols)
        self.top_rounded(x, y, w, hdr_h, 1, RED)
        cx = x
        for lab, cw, al, kind in cols:
            xx = {'l': cx + CPAD, 'c': cx + cw / 2, 'r': cx + cw - CPAD}[al]
            self.text(xx, self.mid(y, hdr_h, 'B', 9), lab, 'B', 9, WHITE, al, max_w=cw - 2 * CPAD)
            cx += cw
        ry = y + hdr_h
        for i, row in enumerate(rows):
            if i % 2 == 0:
                self.rect(x, ry, w, pitch, fill=TINT)
            if i:
                self.line(x, ry, x + w, ry, GRID, .35)
            cx = x
            for (lab, cw, al, kind), v in zip(cols, row):
                font, color, s = {'no': ('B', DARK, str(v)), 'surname': ('B', DARK, str(v).upper()),
                                  'text': ('R', DARK, str(v)), 'code': ('B', RED, str(v)),
                                  'bold': ('B', DARK, str(v))}[kind]
                xx = {'l': cx + CPAD, 'c': cx + cw / 2, 'r': cx + cw - CPAD}[al]
                self.text(xx, self.mid(ry, pitch, font, MIN_TABLE), s, font, MIN_TABLE, color, al,
                          max_w=cw - 2 * CPAD)
                cx += cw
            ry += pitch
        # column separators and outer border (as OC-01)
        cx = x
        for lab, cw, al, kind in cols[:-1]:
            cx += cw
            self.line(cx, y + hdr_h, cx, ry, GRID_OUT, .35)
        self.line(x, y + hdr_h, x, ry, GRID_OUT, .5)
        self.line(x + w, y + hdr_h, x + w, ry, GRID_OUT, .5)
        self.line(x, ry, x + w, ry, GRID_OUT, .5)
        self.table_rects.append((x, y, x + w, ry))
        return ry

    def two_tables(self, y, cols_fn, data, pitch):
        """Learner list split into two side-by-side tables (balanced), numbering continues."""
        half = (USABLE - GUTTER) / 2
        cols = cols_fn(half)
        n_left = math.ceil(len(data) / 2)
        bottoms = []
        for k, part in enumerate((data[:n_left], data[n_left:])):
            if part:
                bottoms.append(self.table(LEFT + k * (half + GUTTER), y, cols, part, pitch))
        return max(bottoms)

    def section_label(self, y, s):
        self.text(LEFT, y + 4, s, 'B', 10, RED)
        return y + 5.5

    def save(self, content_bottom, notes):
        top = self.footer(notes)
        assert content_bottom + GAP_S <= top + 1e-6, \
            f'{self.code}: content ends {content_bottom:.1f} mm, footer rule at {top:.1f} mm'
        self.c.showPage()
        self.c.save()
        return self.path


def name_cols(half, no_w=10, extra=()):
    rest = half - no_w - sum(e[1] for e in extra)
    return [('No.', no_w, 'c', 'no'), ('SURNAME', rest * .55, 'l', 'surname'),
            ('First name', rest * .45, 'l', 'text')] + list(extra)


def numbered(rows):
    return [(i + 1, *r) for i, r in enumerate(rows)]


# ================================================================ RL-01
def rl01(cls='9B'):
    learners = D.REGISTER_9B
    p = Page(f'RL-01-Register-Class-List-{cls}.pdf', 'RL-01', 'REGISTER CLASS LIST', 'Register class list')
    y = p.header() + GAP
    y = p.title_bar(y, 'REGISTER CLASS LIST', 'Use these numbers on SA-01') + GAP_S
    y = p.info_bar(y, [
        [('Class teacher', D.CLASS_TEACHER[cls], 'v'), ('Room', D.ROOM[cls], 'v'),
         ('Total learners', str(len(learners)), 'b'), ('Term', str(D.TERM), 'v')],
        [('Academic year', str(D.ACADEMIC_YEAR), 'v'), ('Phase', D.PHASE_LABEL, 'v'),
         ('List version', f'{D.LIST_VERSION} · effective TBC', 'v')]],
        block=('Class', cls), gap=4) + GAP
    y = p.two_tables(y, name_cols, numbered(learners), 5.2) + GAP

    # subjects panel: whole class (two mini tables) | split over combined
    rows_w = [(D.SHORT[s], D.class_code([cls], s)) for s in D.WHOLE_CLASS]
    rows_s = [(D.SHORT[s], D.class_code([cls], s), 'SL-01') for s in D.SPLIT]
    rows_c = [(D.SHORT[s], ', '.join(c for c in classes if c != cls), D.class_code(classes, s), 'CL-01')
              for s, classes in D.COMBINED.items() if cls in classes]

    def fit(spec, rows):
        out = []
        for i, (lab, al, kind) in enumerate(spec):
            font = 'B' if kind in ('code', 'bold') else 'R'
            out.append((lab, max([sw(lab, 'B', 9)] + [sw(r[i], font, 9) for r in rows]) + 2 * CPAD, al, kind))
        return out

    wcols = fit([('Subject', 'l', 'text'), ('Code', 'l', 'code')], rows_w)
    scols = fit([('Subject', 'l', 'text'), ('Code', 'l', 'code'), ('List', 'l', 'bold')], rows_s)
    ccols = fit([('Subject', 'l', 'text'), ('With', 'l', 'text'), ('Code', 'l', 'code'), ('List', 'l', 'bold')], rows_c)
    inner = USABLE - 2 * PANEL_PAD
    mini_gap = 3
    left_w = 2 * sum(c[1] for c in wcols) + mini_gap
    right_w = max(sum(c[1] for c in scols), sum(c[1] for c in ccols))
    spare = inner - GUTTER - left_w - right_w
    assert spare >= 0, f'RL-01 subjects panel too wide by {-spare:.1f} mm'
    grow = lambda cols, extra: [(l, w + (extra if i == 0 else 0), a, k) for i, (l, w, a, k) in enumerate(cols)]
    wcols = grow(wcols, spare / 2 / 2)
    left_w = 2 * sum(c[1] for c in wcols) + mini_gap
    right_w = inner - GUTTER - left_w
    scols = grow(scols, right_w - sum(c[1] for c in scols))
    ccols = grow(ccols, right_w - sum(c[1] for c in ccols))

    pitch, sub_h = 5.2, 5
    n_w = math.ceil(len(rows_w) / 2)
    left_h = sub_h + HDR_ROW_H + n_w * pitch
    right_h = sub_h + HDR_ROW_H + len(rows_s) * pitch + 2 + sub_h + HDR_ROW_H + len(rows_c) * pitch
    ph = PANEL_PAD + 6 + max(left_h, right_h) + PANEL_PAD
    p.rect(LEFT, y, USABLE, ph, fill=WHITE, stroke=PINK_LINE, lw=.6, r=1.5)
    p.text(LEFT + PANEL_PAD, y + PANEL_PAD + 3.8, 'SUBJECTS FOR THIS CLASS', 'B', 10, RED)
    cy = y + PANEL_PAD + 6
    x0 = LEFT + PANEL_PAD
    p.text(x0, cy + 3.6, 'Taken by the whole class', 'B', 9, DARK)
    mw = sum(c[1] for c in wcols)
    p.table(x0, cy + sub_h, wcols, rows_w[:n_w], pitch)
    p.table(x0 + mw + mini_gap, cy + sub_h, wcols, rows_w[n_w:], pitch)
    xr = x0 + left_w + GUTTER
    p.text(xr, cy + 3.6, 'Split subjects', 'B', 9, DARK)
    yb = p.table(xr, cy + sub_h, scols, rows_s, pitch) + 2
    p.text(xr, yb + 3.6, 'Combined with other classes', 'B', 9, DARK)
    p.table(xr, yb + sub_h, ccols, rows_c, pitch)
    y += ph
    p.save(y, 'Official list for the year. Use the learner numbers on SA-01. Notify the office of changes; '
              'a new version is issued when learners join or leave.')
    return p, {'codes': [r[1] for r in rows_w] + [r[1] for r in rows_s] + [r[2] for r in rows_c],
               'learners': learners}


# ================================================================ SL-01
def sl01(cls='9B', subj='MT'):
    other = [s for s in D.SPLIT if s != subj][0]
    learners = D.SPLIT_9B[subj]
    code, other_code = D.class_code([cls], subj), D.class_code([cls], other)
    p = Page(f'SL-01-Split-Subject-Class-List-{code}.pdf', 'SL-01', 'SPLIT SUBJECT CLASS LIST',
             'Split subject class list')
    y = p.header() + GAP
    y = p.title_bar(y, 'SPLIT SUBJECT CLASS LIST', 'Use these numbers on SA-02') + GAP_S
    y = p.info_bar(y, [
        [('Subject', D.SUBJECTS[subj], 'b'), ('Subject class code', code, 'code'), ('Grade', str(D.GRADE), 'v'),
         ('Split from register class', cls, 'b')],
        [('Other group', f'{D.SUBJECTS[other]} — {other_code}', 'v'), ('Educator', D.EDUCATOR[subj], 'v'),
         ('Total learners', str(len(learners)), 'b'), ('Term', str(D.TERM), 'v')]]) + GAP
    y = p.two_tables(y, name_cols, numbered(learners), 6.2)
    p.save(y, f'This class splits for {D.SUBJECTS[subj]}. Learners not on this list are on the '
              f'{D.SUBJECTS[other]} list ({other_code}).')
    return p, {'codes': [code], 'learners': learners}


# ================================================================ CL-01
def cl01(subj='WW'):
    classes = D.COMBINED[subj]
    learners = D.COMBINED_WW
    code = D.class_code(classes, subj)
    p = Page(f'CL-01-Combined-Subject-Class-List-{code}.pdf', 'CL-01', 'COMBINED SUBJECT CLASS LIST',
             'Combined subject class list')
    y = p.header() + GAP
    y = p.title_bar(y, 'COMBINED SUBJECT CLASS LIST', 'Use these numbers on SA-02') + GAP_S
    y = p.info_bar(y, [
        [('Subject', D.SUBJECTS[subj], 'b'), ('Subject class code', code, 'code'), ('Grade', str(D.GRADE), 'v'),
         ('Combined from', ', '.join(classes), 'b')],
        [('Educator', D.EDUCATOR[subj], 'v'), ('Total learners', str(len(learners)), 'b'),
         ('Term', str(D.TERM), 'v')]]) + GAP
    y = p.two_tables(y, lambda h: name_cols(h, 10, [('Class', 13.5, 'c', 'bold')]), numbered(learners), 5.2)
    p.save(y, 'Learners from different register classes are numbered together on this list.')
    return p, {'codes': [code], 'learners': learners}


# ================================================================ SC-01
def sc01():
    p = Page(f'SC-01-Subject-Code-Key-Grade-{D.GRADE}.pdf', 'SC-01', 'SUBJECT CODE KEY', 'Subject code key',
             status='PROVISIONAL')
    y = p.header() + GAP
    y = p.title_bar(y, 'SUBJECT CODE KEY', 'Write the subject class code on SA-02') + GAP_S
    y = p.info_bar(y, [[('Grade', str(D.GRADE), 'b'), ('Academic year', str(D.ACADEMIC_YEAR), 'v'),
                        ('Term', str(D.TERM), 'v'),
                        ('Code format (provisional)', '[Grade][Class]-[Subject], e.g. 9B-MT', 'v')]], gap=4) + GAP
    y = p.section_label(y, 'SUBJECT ABBREVIATIONS')
    abbr = list(D.SUBJECTS.items())
    half = (USABLE - GUTTER) / 2
    cols = [('Abbreviation', 27.5, 'c', 'code'), ('Subject', half - 27.5, 'l', 'text')]
    k = math.ceil(len(abbr) / 2)
    b1 = p.table(LEFT, y, cols, abbr[:k], 5.2)
    p.table(LEFT + half + GUTTER, y, cols, abbr[k:], 5.2)
    y = b1 + GAP
    y = p.section_label(y, 'SUBJECT CLASSES')
    rows = sorted(D.subject_classes(), key=lambda r: r[0])
    spec = [('Code', 'code'), ('Subject', 'text'), ('Register class(es)', 'text'), ('Type', 'text'),
            ('Educator', 'text'), ('Learner list', 'bold')]
    need = [max([sw(lab, 'B', 9)] + [sw(r[i], 'B' if kind in ('code', 'bold') else 'R', 9) for r in rows]) + 2 * CPAD
            for i, (lab, kind) in enumerate(spec)]
    spare = USABLE - sum(need)
    assert spare >= 0, f'SC-01 columns too wide by {-spare:.1f} mm'
    widths = [n + spare / len(need) for n in need]
    cols = [(lab, w, 'l', kind) for (lab, kind), w in zip(spec, widths)]
    notes = ('Every subject class code used on RL-01, SL-01 and CL-01 appears here. '
             'Codes are provisional until the final scheme is approved.')
    # rows that fit above the footer (capacity 24)
    foot_top = _footer_top(notes)
    fit_rows = min(24, math.floor((foot_top - GAP_S - y - HDR_ROW_H) / 6 + 1e-9))
    shown, omitted = rows[:fit_rows], rows[fit_rows:]
    y = p.table(LEFT, y, cols, shown, 6)
    p.save(y, notes)
    return p, {'codes': [r[0] for r in shown], 'omitted': [r[0] for r in omitted], 'capacity': fit_rows}


def _footer_top(notes):
    lines = simpleSplit(notes, 'B', 8, USABLE * mm)
    return PH - MARGIN - 0.8 - 5 - (len(lines) - 1) * 3.6 - 4.2


# ================================================================ checks
def verify(path, table_rects):
    """One A4 portrait page, inside margins, no overlapping text, table text >= 9 pt, other text >= 8 pt."""
    k = 72 / 25.4
    doc = pymupdf.open(path)
    probs = []
    if doc.page_count != 1:
        probs.append('not one page')
    pg = doc[0]
    if abs(pg.rect.width / k - 210) > .2 or abs(pg.rect.height / k - 297) > .2:
        probs.append('not A4 portrait')
    spans = [s for b in pg.get_text('dict')['blocks'] for l in b.get('lines', []) for s in l['spans']
             if s['text'].strip()]
    for s in spans:
        x0, y0, x1, y1 = [v / k for v in s['bbox']]
        if x0 < 10 - .3 or x1 > 200 + .3 or y0 < 10 - .3 or y1 > 287 + .3:
            probs.append(f'outside margins: {s["text"]!r}')
        in_table = any(a - .1 <= x0 and x1 <= c + .1 and b - .1 <= y0 and y1 <= d + .1 for a, b, c, d in table_rects)
        if s['size'] < (MIN_TABLE if in_table else MIN_NOTE) - .01:
            probs.append(f'{s["size"]:.1f} pt text: {s["text"]!r}')
    for i, a in enumerate(spans):
        ra = pymupdf.Rect(a['bbox'])
        for b in spans[i + 1:]:
            r = ra & pymupdf.Rect(b['bbox'])
            if not r.is_empty and r.width > .8 and r.height > 1.5:
                probs.append(f'overlap: {a["text"]!r} / {b["text"]!r}')
    for d in pg.get_drawings():
        r = d['rect']
        if r.x0 / k < 10 - .5 or r.x1 / k > 200 + .5 or r.y0 / k < 10 - .5 or r.y1 / k > 287 + .5:
            probs.append(f'drawing outside margins {r}')
    return probs, pg.get_text()


if __name__ == '__main__':
    results = {'RL-01': rl01(), 'SL-01 MT': sl01(subj='MT'), 'SL-01 ML': sl01(subj='ML'), 'CL-01': cl01(),
               'SC-01': sc01()}
    ok = True
    texts = {}
    for key, (page, info) in results.items():
        probs, txt = verify(page.path, page.table_rects)
        texts[key] = txt
        ok &= not probs
        print(f'{os.path.basename(page.path)}: {"OK" if not probs else "FAIL"}')
        for pr in probs[:6]:
            print('    ', pr)

    def check(cond, msg):
        global ok
        ok &= bool(cond)
        print(('  ok   ' if cond else '  FAIL ') + msg)

    print('cross-document')
    for key in ('RL-01', 'SL-01 MT', 'SL-01 ML', 'CL-01'):
        L = results[key][1]['learners']
        keys = [(r[0].lower(), r[1].lower()) for r in L]
        check(keys == sorted(keys), f'{key}: {len(L)} learners, alphabetical by surname')
        nums = [int(m) for m in re.findall(r'^(\d+)$', texts[key], re.M)]
        check(sorted(set(nums)) == list(range(1, len(L) + 1)), f'{key}: printed numbers run 1..{len(L)}')
        check(all(r[0].upper() in texts[key] for r in L), f'{key}: every surname printed')
    reg = {(s, f) for s, f in D.REGISTER_9B}
    mt, ml = ({(s, f) for s, f in D.SPLIT_9B[x]} for x in ('MT', 'ML'))
    check(len(mt) == 19 and len(ml) == 15, 'SL-01 groups: Mathematics 19, Mathematical Literacy 15')
    check(not (mt & ml) and (mt | ml) == reg, 'SL-01 groups together equal 9B, no learner on both')
    check({(s, f) for s, f, c in D.COMBINED_WW if c == '9B'} <= reg, 'CL-01 9B learners identical to RL-01')
    check(len(D.COMBINED_WW) == 48, 'CL-01 has 48 learners')
    sc = results['SC-01'][1]
    used = set(results['RL-01'][1]['codes']) | set(results['SL-01 MT'][1]['codes']) | \
        set(results['SL-01 ML'][1]['codes']) | set(results['CL-01'][1]['codes'])
    check(used <= set(sc['codes']) and all(c in texts['SC-01'] for c in used),
          f'all {len(used)} codes on RL-01/SL-01/CL-01 appear on SC-01')
    print(f'SC-01 shows {len(sc["codes"])} subject classes (capacity {sc["capacity"]}); '
          f'not shown: {sc["omitted"] or "none"}')
    print('ALL CHECKS PASSED' if ok else 'CHECKS FAILED')
