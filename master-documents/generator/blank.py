"""Build the BLANK SA-03A, SA-03B, SA-03C, SA-04 and SA-05 master documents.

    python3 blank.py      # writes the five *-BLANK.pdf files to master-documents/

Writing boxes copy SA-01 / SA-02 exactly: 5.44 mm tall on a 7.0 mm row pitch,
0.8 mm apart side by side, 2.83 pt corners, 0.51 pt grey outline. Info-panel
value boxes are SA-01's 5.94 mm boxes on a 7 mm pitch. The script checks the
finished PDFs (boxes, margins, text sizes) before it reports success.
"""
import math
import os

import pymupdf

from forms import (Doc, probe, LEFT, USABLE_W, PAD, GAP, TITLE_H, TITLE_GAP, INSTR_H,
                   COLHDR_H, GUTTER, CPAD, PH, MARGIN, FOOTER_H, MIN_LABEL, R_ROW, R_CELL,
                   CELL, CHIP, DARK, WHITE, RULE, LW_SECTION, LW_CELL, SHADE, sw)

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.dirname(HERE)
SA01 = os.path.join(os.path.dirname(OUT), 'Register-Class-BLANK (10).pdf')
T = probe(SA01)
LIMIT = PH - MARGIN - FOOTER_H - GAP

# SA-01 / SA-02 writing-box standard (mm)
PITCH = 7.0
BOX_H = 5.44
INSET_Y = (PITCH - BOX_H) / 2          # 0.78 mm above and below -> 1.56 mm between rows
INSET_X = 0.4                          # 0.8 mm between boxes side by side
LINE_PITCH = 7.5                       # SA-02 Section C writing lines
REPORT = {}

INSTR_REGISTER = 'Learners are numbered alphabetically by surname. Use the number on THIS list when completing SA-01.'
INSTR_SUBJECT = ('Learners are numbered alphabetically by surname. Use the number on THIS list when '
                 'completing SA-02 for this class.')


def new(code, title, subtitle, fname, form_title=None):
    return Doc(os.path.join(OUT, fname), code, title, subtitle, form_title or subtitle,
               code.replace('-', '') + '-P1', T)


def wbox(doc, x, y, w, h=PITCH):
    """SA-01 writing box centred in the cell (x, y, w, h)."""
    doc.rrect(x + INSET_X, y + (h - BOX_H) / 2, w - 2 * INSET_X, BOX_H, R_CELL, WHITE, CELL, LW_CELL)


def blank_rows(doc, x, y, cols, n, first_no=1, shade=True):
    """cols: (label, width, kind) with kind 'no' (printed number) or 'box'."""
    w = sum(c[1] for c in cols)
    for i in range(n):
        ry = y + i * PITCH
        if shade and i % 2 == 0:
            doc.rrect(x, ry, w, PITCH, R_ROW, SHADE)
        cx = x
        for lab, cw, kind in cols:
            if kind == 'no':
                doc.cell_text(cx, ry, cw, PITCH, str(first_no + i), 'B', 9, 'c', DARK)
            else:
                wbox(doc, cx, ry, cw)
            cx += cw
    return y + n * PITCH


def header_row(doc, x, y, cols):
    return doc.col_header(x, y, [(lab, cw, 'c' if kind == 'no' else 'l') for lab, cw, kind in cols])


def list_columns(doc, x, y, iw, ncols, cols_fn, n):
    tw = (iw - (ncols - 1) * GUTTER) / ncols
    cols = cols_fn(tw)
    assert abs(sum(c[1] for c in cols) - tw) < 1e-6
    for k in range(ncols):
        cx = x + k * (tw + GUTTER)
        header_row(doc, cx, y, cols)
        blank_rows(doc, cx, y + COLHDR_H, cols, n, first_no=1 + k * n)
    return y + COLHDR_H + n * PITCH


def name_cols(no_w, rest, first_label='First name', extra=()):
    """No. | Surname | First name [| extra]; surname gets 55 % of the name width."""
    extra_w = sum(e[1] for e in extra)
    names = rest - no_w - extra_w
    return [('No.', no_w, 'no'), ('Surname', names * .55, 'box'), (first_label, names * .45, 'box')] + list(extra)


def list_section_height(n):
    return PAD + TITLE_H + TITLE_GAP + INSTR_H + 2 + COLHDR_H + n * PITCH + PAD


def blank_panel(doc, y, rows):
    return doc.info_panel(y, [[(lab, '', wt, 'R', mn) for lab, wt, mn in row] for row in rows])


# ---------------------------------------------------------------- SA-03A
def sa03a():
    doc = new('SA-03A', 'Register class master list', 'REGISTER CLASS MASTER LIST',
              'SA-03A-Register-Class-Master-List-BLANK.pdf')
    y = doc.header() + GAP
    y = blank_panel(doc, y, [[('Register class:', 1, 12), ('Grade:', .5, 9), ('Educator:', 3, 24),
                              ('Year:', .8, 12), ('Learners:', .5, 10)]]) + GAP
    b_rows = 4
    bh = 11 + b_rows * PITCH + 1
    sec_b = PAD + TITLE_H + TITLE_GAP + bh + PAD
    n = math.floor((LIMIT - y - GAP - sec_b - list_section_height(0)) / PITCH + 1e-9)
    ncols = 3
    h = list_section_height(n)
    x, cy, iw = doc.section(y, h, 'A.  LEARNERS')
    cy = doc.instr_bar(x, cy, iw, INSTR_REGISTER) + 2
    list_columns(doc, x, cy, iw, ncols, lambda tw: name_cols(10, tw), n)
    y += h + GAP

    x, cy, iw = doc.section(y, sec_b, 'B.  SUBJECTS')
    avail = iw - 2 * GUTTER
    widths = [66, 48, avail - 66 - 48]
    boxes = [('Taken together as a class', [('Subject', None, 'box'), ('Code', 11.5, 'box')], 2),
             ('Split subjects', [('Subject', None, 'box'), ('Code', 11.5, 'box'), ('List', 10.5, 'box')], 1),
             ('Combined with other classes', [('Subject', None, 'box'), ('With', 12.5, 'box'),
                                              ('Code', 11.5, 'box'), ('List', 10.5, 'box')], 1)]
    bx = x
    for (title, spec, ncol), bw in zip(boxes, widths):
        doc.rrect(bx, cy, bw, bh, R_ROW, WHITE, CELL, LW_CELL)
        doc.rrect(bx + 1, cy + 1, bw - 2, 5, R_CELL, CHIP)
        doc.cell_text(bx + 1, cy + 1, bw - 2, 5, title, 'B', MIN_LABEL, color=DARK)
        mw = (bw - 2 - (ncol - 1) * 2) / ncol
        rest = mw - sum(s[1] for s in spec if s[1])
        cols = [(lab, cw if cw else rest, kind) for lab, cw, kind in spec]
        for c in range(ncol):
            mx = bx + 1 + c * (mw + 2)
            hx = mx
            for lab, cw, _ in cols:
                doc.cell_text(hx, cy + 6.5, cw, 4.5, lab, 'B', MIN_LABEL, color=DARK)
                hx += cw
            blank_rows(doc, mx, cy + 11, cols, b_rows, shade=False)
        bx += bw + GUTTER
    y += sec_b
    doc.save(y)
    REPORT['SA-03A'] = f'{ncols} columns x {n} rows (capacity {ncols * n})'
    return doc


# ---------------------------------------------------------------- SA-03B / SA-03C
def sa03b():
    doc = new('SA-03B', 'Split subject class list', 'SPLIT SUBJECT CLASS LIST',
              'SA-03B-Split-Subject-Class-List-BLANK.pdf')
    y = doc.header() + GAP
    y = blank_panel(doc, y, [[('Subject:', 3, 40), ('Subject class code:', 1, 22), ('Grade:', .4, 10)],
                             [('From register class:', 1, 14), ('Educator:', 3, 40), ('No. of learners:', .4, 12)]]) + GAP
    n, ncols = 25, 2
    h = list_section_height(n)
    assert y + h <= LIMIT + 1e-6, (y + h, LIMIT)
    x, cy, iw = doc.section(y, h, 'A.  LEARNERS')
    cy = doc.instr_bar(x, cy, iw, INSTR_SUBJECT) + 2
    list_columns(doc, x, cy, iw, ncols, lambda tw: name_cols(10, tw), n)
    doc.save(y + h)
    REPORT['SA-03B'] = f'{ncols} columns x {n} rows (capacity {ncols * n})'
    return doc


def sa03c():
    doc = new('SA-03C', 'Combined subject class list', 'COMBINED SUBJECT CLASS LIST',
              'SA-03C-Combined-Subject-Class-List-BLANK.pdf')
    y = doc.header() + GAP
    y = blank_panel(doc, y, [[('Subject:', 3, 40), ('Subject class code:', 1, 22), ('Grade:', .4, 10)],
                             [('Combined classes:', 1, 16), ('Educator:', 3, 40), ('No. of learners:', .4, 12)]]) + GAP
    n, ncols = 20, 3
    h = list_section_height(n)
    assert y + h <= LIMIT + 1e-6, (y + h, LIMIT)
    x, cy, iw = doc.section(y, h, 'A.  LEARNERS')
    cy = doc.instr_bar(x, cy, iw, INSTR_SUBJECT) + 2
    list_columns(doc, x, cy, iw, ncols,
                 lambda tw: name_cols(10, tw, 'Name', extra=[('Class', 12.7, 'box')]), n)
    doc.save(y + h)
    REPORT['SA-03C'] = f'{ncols} columns x {n} rows (capacity {ncols * n})'
    return doc


# ---------------------------------------------------------------- SA-04
def sa04():
    doc = new('SA-04', 'Subject class code key', 'SUBJECT CLASS CODE KEY',
              'SA-04-Subject-Class-Code-Key-BLANK.pdf')
    y = doc.header() + GAP
    y = blank_panel(doc, y, [[('Grade:', .5, 10), ('Year:', .8, 14), ('Compiled by:', 3, 40)]]) + GAP
    # A: 10 abbreviations as 5 columns x 2 rows
    a_cols, a_rows = 5, 2
    h = PAD + TITLE_H + TITLE_GAP + a_rows * PITCH + PAD
    x, cy, iw = doc.section(y, h, 'A.  SUBJECT ABBREVIATIONS', '(abbreviation and subject)')
    tw = (iw - (a_cols - 1) * GUTTER) / a_cols
    for k in range(a_cols):
        blank_rows(doc, x + k * (tw + GUTTER), cy, [('Abbreviation', 11, 'box'), ('Subject', tw - 11, 'box')],
                   a_rows)
    y += h + GAP
    note_h = 5.5
    over = PAD + TITLE_H + TITLE_GAP + COLHDR_H + note_h + PAD
    n = min(22, math.floor((LIMIT - y - over) / PITCH + 1e-9))
    h = over + n * PITCH
    x, cy, iw = doc.section(y, h, 'B.  SUBJECT CLASSES', '(Type: Whole class, Split or Combined)')
    fixed = [('Subject class code', 31, 'box'), (None, None, 'box'), ('Register class(es)', 30, 'box'),
             ('Type', 22, 'box'), ('Educator', 30, 'box'), ('Master list', 20, 'box')]
    subj_w = iw - sum(c[1] for c in fixed if c[1])
    cols = [c if c[0] else ('Subject', subj_w, 'box') for c in fixed]
    cy = header_row(doc, x, cy, cols)
    cy = blank_rows(doc, x, cy, cols, n)
    doc.note(x + CPAD, cy + 4, 'Code format is provisional: [Grade][Class][Subject], e.g. 8AMT. '
             'Combined classes use X, e.g. 8XEM.', iw - 2 * CPAD)
    doc.save(y + h)
    REPORT['SA-04'] = f'A: {a_cols} x {a_rows} abbreviation slots, B: {n} subject-class rows'
    return doc


# ---------------------------------------------------------------- SA-05
def sa05(weeks=10):
    doc = new('SA-05', 'Term ATP weekly plan', 'ANNUAL TEACHING PLAN — WEEKLY CODES',
              'SA-05-Term-ATP-Weekly-Plan-BLANK.pdf', 'TERM ATP WEEKLY PLAN')
    y = doc.header() + GAP
    y = blank_panel(doc, y, [[('Academic year:', .8, 14), ('Grade:', .5, 10), ('Subject:', 3, 40),
                              ('No. of weeks:', .5, 10)]]) + GAP
    y = doc.instr_bar(LEFT, y, USABLE_W, 'Copy this week’s ATP code into Section C of SA-02, '
                      'then tick Completed or Not completed.') + GAP
    per_col = math.ceil(weeks / 2)
    bgap = 4
    bh = min(40, math.floor(((LIMIT - 6 - y) - (per_col - 1) * bgap) / per_col))
    bw = (USABLE_W - GUTTER) / 2
    top_line, line_gap = 9, 3
    lines = math.floor((bh - 2 * PAD - top_line - line_gap) / LINE_PITCH + 1e-9)
    for i in range(weeks):
        col, row = divmod(i, per_col)
        bx, by = LEFT + col * (bw + GUTTER), y + row * (bh + bgap)
        doc.box(by, bh, bx, bw)
        ix, iy, iw = bx + PAD, by + PAD, bw - 2 * PAD
        doc.text(ix, doc.mid(iy, top_line, 'B', 11), f'Week {i + 1}', 'B', 11, DARK)
        cx0 = ix + iw - 26                      # 26 x 9 mm code box, 4 character cells
        doc.rrect(cx0, iy, 26, 9, R_CELL, WHITE, DARK, LW_SECTION)
        doc.c.setStrokeColorRGB(*RULE)
        doc.c.setLineWidth(0.5)
        for k in (1, 2, 3):
            xx = (cx0 + k * 6.5) * 72 / 25.4
            doc.c.line(xx, doc.Y(iy + 1.5), xx, doc.Y(iy + 7.5))
        doc.text(cx0 - 2, doc.mid(iy, top_line, 'B', 9), 'ATP code', 'B', 9, DARK, 'r')
        for k in range(lines):                  # writing lines, SA-02 spacing
            yy = iy + top_line + line_gap + (k + 1) * LINE_PITCH
            doc.c.line(ix * 72 / 25.4, doc.Y(yy), (ix + iw) * 72 / 25.4, doc.Y(yy))
    y += per_col * bh + (per_col - 1) * bgap
    doc.note(LEFT, y + 4, 'ATP codes are provisional and will be replaced with the final coding scheme.', USABLE_W)
    doc.save(y + 5)
    REPORT['SA-05'] = f'{weeks} week boxes {bh} mm tall, {lines} writing lines {LINE_PITCH} mm apart'
    return doc


# ---------------------------------------------------------------- checks
def verify(path):
    MM = 72 / 25.4
    doc = pymupdf.open(path)
    p = doc[0]
    problems = []
    if doc.page_count != 1:
        problems.append('not one page')
    boxes, sizes = [], set()
    for d in p.get_drawings():
        r = d['rect']
        if not (r.x0 >= 10 * MM - 1 and r.x1 <= 200 * MM + 1 and r.y0 >= 10 * MM - 1 and r.y1 <= 287 * MM + 1):
            problems.append(f'drawing outside margins {r}')
        if d.get('fill') == (1.0, 1.0, 1.0) and d.get('color') and abs(d['color'][0] - CELL[0]) < .02 \
                and d.get('width') and d['width'] < 0.6 and r.height / MM < 7:
            boxes.append(r)
            sizes.add(round(r.height / MM, 2))
    gx = gy = 99
    for i, a in enumerate(boxes):
        for b in boxes[i + 1:]:
            dx = max(b.x0 - a.x1, a.x0 - b.x1) / MM
            dy = max(b.y0 - a.y1, a.y0 - b.y1) / MM
            if dx < 0.75 and dy < 0.75:
                problems.append(f'writing boxes touch: {a} {b}')
            if dy < 0 and dx >= 0:
                gx = min(gx, dx)
            if dx < 0 and dy >= 0:
                gy = min(gy, dy)
    for b in p.get_text('dict')['blocks']:
        for l in b.get('lines', []):
            for s in l['spans']:
                if not s['text'].strip():
                    continue
                if s['size'] < 8 and not (s['bbox'][0] > 140 * MM and s['bbox'][3] < 35 * MM):
                    problems.append(f'text below 8 pt: {s["text"]!r}')
                sr = pymupdf.Rect(s['bbox'])
                for r in boxes:
                    inter = sr & r
                    if not inter.is_empty and inter.width > 1 and inter.height > 2:
                        problems.append(f'text inside a writing box: {s["text"]!r}')
    txt = p.get_text()
    for need in ('2026 · Term 2', 'Learn · Grow · Contribute', 'Page 1 of 1'):
        if need not in txt:
            problems.append(f'missing {need!r}')
    return problems, len(boxes), sorted(sizes), gx, gy


if __name__ == '__main__':
    ok = True
    for fn in (sa03a, sa03b, sa03c, sa04, sa05):
        d = fn()
        probs, nbox, sizes, gx, gy = verify(d.path)
        ok &= not probs
        print(f'{os.path.basename(d.path)}: {"OK" if not probs else "FAIL"} | {nbox} boxes, heights {sizes} mm, '
              f'gaps: side {gx:.2f} / rows {gy:.2f} mm | {REPORT[d.code]}')
        for pr in probs[:5]:
            print('   ', pr)
    print('ALL CHECKS PASSED' if ok else 'CHECKS FAILED')
