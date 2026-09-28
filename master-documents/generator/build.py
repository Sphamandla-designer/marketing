"""Build the SA-03A, SA-03B, SA-03C, SA-04 and SA-05 master documents.

    python3 build.py            # writes FILLED examples to ../filled-examples/ (not committed)

The header (crest and measured positions) is taken from SA-01, so SA-01's PDF
must be present in the repository root.
"""
import math
import os
import sys

import data as D
from forms import (Doc, probe, sw, LEFT, USABLE_W, PAD, GAP, TITLE_H, TITLE_GAP, INSTR_H,
                   COLHDR_H, GUTTER, CPAD, PH, MARGIN, FOOTER_H, MIN_TABLE, MIN_LABEL,
                   R_ROW, R_CELL, CELL, CHIP, DARK, WHITE, TEXT, LW_SECTION, LW_CELL, R_SECTION)
from reportlab.lib.utils import simpleSplit
from reportlab.lib.units import mm

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(os.path.dirname(HERE), 'filled-examples')
os.makedirs(OUT, exist_ok=True)
SA01 = os.path.join(ROOT, 'Register-Class-BLANK (10).pdf')
T = probe(SA01)
LIMIT = PH - MARGIN - FOOTER_H - GAP        # content must end here (mm from top)
REPORT = {}

INSTR_REGISTER = 'Learners are numbered alphabetically by surname. Use the number on THIS list when completing SA-01.'
INSTR_SUBJECT = ('Learners are numbered alphabetically by surname. Use the number on THIS list when '
                 'completing SA-02 for this class.')


def new(code, title, subtitle, form_title, fname):
    ref = code.replace('-', '') + '-P1'
    return Doc(os.path.join(OUT, fname), code, title, subtitle, form_title, ref, T)


def fit_cols(spec, total):
    """spec: (label, values, align, font, fixed_width or None). Grow free columns to fill total."""
    need = []
    for lab, vals, al, font, fixed in spec:
        if fixed:
            need.append(fixed)
        else:
            w = max([sw(lab, 'B', MIN_LABEL)] + [sw(str(v), font, MIN_TABLE) for v in vals])
            need.append(w + 2 * CPAD + 0.5)
    free = [i for i, s in enumerate(spec) if not s[4]]
    spare = total - sum(need)
    assert spare >= 0, f'columns do not fit: need {sum(need):.1f} mm of {total:.1f} mm'
    fw = sum(need[i] for i in free)
    widths = [n + (spare * n / fw if i in free else 0) for i, n in enumerate(need)]
    return [(s[0], w, s[2], s[3]) for s, w in zip(spec, widths)]


def two_col_list(doc, x, y, iw, cols_fn, data, n, pitch):
    half = (iw - GUTTER) / 2
    cols = cols_fn(half)
    for k in range(2):
        cx = x + k * (half + GUTTER)
        doc.col_header(cx, y, cols)
        doc.rows(cx, y + COLHDR_H, cols, data[k * n:(k + 1) * n], n, pitch)
    return y + COLHDR_H + n * pitch


def learner_rows(learners, extra=()):
    return [(i + 1, *r) for i, r in enumerate(learners)]


def list_section_height(n, pitch):
    return PAD + TITLE_H + TITLE_GAP + INSTR_H + 2 + COLHDR_H + n * pitch + PAD


# ---------------------------------------------------------------- SA-03A
def sa03a(cls='8A'):
    doc = new('SA-03A', 'Register class master list', 'REGISTER CLASS MASTER LIST',
              'REGISTER CLASS MASTER LIST', 'SA-03A Register class master list.pdf')
    learners = D.REGISTER[cls]
    y = doc.header() + GAP
    y = doc.info_panel(y, [[('Register class:', cls, 0.8, 'B'), ('Grade:', str(D.GRADE), 0.6, 'R'),
                            ('Educator:', D.REGISTER_EDUCATOR[cls], 3, 'R'),
                            ('Year:', str(D.YEAR), 0.9, 'R'),
                            ('Learners:', str(len(learners)), 0.6, 'R')]]) + GAP
    pitch = 5.2
    sec_b = PAD + TITLE_H + TITLE_GAP + 24 + PAD
    n = min(30, math.floor((LIMIT - y - GAP - sec_b - list_section_height(0, pitch)) / pitch + 1e-9))
    assert 2 * n >= len(learners), 'class does not fit'
    h = list_section_height(n, pitch)
    x, cy, iw = doc.section(y, h, 'A.  LEARNERS')
    cy = doc.instr_bar(x, cy, iw, INSTR_REGISTER) + 2
    cols = lambda half: [('No.', 10, 'c', 'B')] + fit_cols(
        [('Surname', [r[0] for r in learners], 'l', 'R', None),
         ('First name', [r[1] for r in learners], 'l', 'R', None)], half - 10)
    two_col_list(doc, x, cy, iw, cols, learner_rows(learners), n, pitch)
    y += h + GAP

    # Section B: subjects
    x, cy, iw = doc.section(y, sec_b, 'B.  SUBJECTS')
    together = [(D.SHORT[s], D.code(cls, s)) for s in D.WHOLE_CLASS]
    split = [(D.SHORT[s], D.code(cls, s)) for s in D.SPLIT]
    other = [c for c in ('8A', '8B') if c != cls]
    combined = [(D.SHORT[s], 'with ' + ' and '.join(other), D.code('X', s)) for s in D.COMBINED]
    # every split subject is listed on SA-03B and every combined one on SA-03C,
    # so the list reference sits in the box heading
    boxes = [('Taken together as a class', together, 2), ('Split subjects (SA-03B)', split, 1),
             ('Combined classes (SA-03C)', combined, 1)]
    VG = 2   # gap between values in a row (mm)

    def need(title, rows, ncol):
        per_col = math.ceil(len(rows) / ncol)
        cols = [rows[i:i + per_col] for i in range(0, len(rows), per_col)]
        widths = [max(sum(sw(v, 'M' if v[:1].isdigit() else 'R', MIN_TABLE) for v in r) + VG * (len(r) - 1)
                      for r in col) + 2 * CPAD for col in cols]
        return max(sw(title, 'B', MIN_LABEL) + 2 * CPAD + 2, sum(widths) + (ncol - 1) * 2 + 2)

    avail = iw - 2 * GUTTER
    needs = [need(*b) for b in boxes]
    if max(needs) * 3 <= avail:
        widths = [avail / 3] * 3
    else:
        spare = avail - sum(needs)
        assert spare >= 0, f'Section B boxes do not fit ({sum(needs):.1f} > {avail:.1f} mm)'
        widths = [n_ + spare / 3 for n_ in needs]
    REPORT['SA-03A section B widths (mm)'] = [round(w, 1) for w in widths]
    bx = x
    bh = 24
    for (title, rows, ncol), bw in zip(boxes, widths):
        doc.rrect(bx, cy, bw, bh, R_ROW, WHITE, CELL, LW_CELL)
        doc.rrect(bx + 1, cy + 1, bw - 2, 5, R_CELL, CHIP)
        doc.cell_text(bx + 1, cy + 1, bw - 2, 5, title, 'B', MIN_LABEL, color=DARK)
        per_col = math.ceil(len(rows) / ncol)
        rp = (bh - 7 - 1.4) / 4
        mw = (bw - 2 - (ncol - 1) * 2) / ncol
        for i, r in enumerate(rows):
            col, row = divmod(i, per_col)
            rx = bx + 1 + col * (mw + 2)
            ry = cy + 7 + row * rp
            b = doc.mid(ry, rp, 'R', MIN_TABLE)
            doc.text(rx + CPAD, b, r[0], 'R', MIN_TABLE, TEXT, max_w=mw - 2 * CPAD)
            # remaining values right-aligned, right to left
            xr = rx + mw - CPAD
            for v in reversed(r[1:]):
                font = 'M' if v[:1].isdigit() else 'R'
                doc.text(xr, b, v, font, MIN_TABLE, TEXT, 'r')
                xr -= sw(v, font, MIN_TABLE) + VG
            assert xr > rx + CPAD + sw(r[0], 'R', MIN_TABLE), f'Section B row overflows: {r}'
        bx += bw + GUTTER
    y += sec_b
    doc.save(y)
    REPORT['SA-03A'] = dict(rows_per_column=n, capacity=2 * n, pitch_mm=pitch, learners=len(learners))
    return doc


# ---------------------------------------------------------------- SA-03B
def sa03b(cls='8A', subj='MT'):
    doc = new('SA-03B', 'Split subject class list', 'SPLIT SUBJECT CLASS LIST',
              'SPLIT SUBJECT CLASS LIST', 'SA-03B Split subject class list.pdf')
    learners = D.SPLIT_GROUPS[(cls, subj)]
    y = doc.header() + GAP
    y = doc.info_panel(y, [
        [('Subject:', D.SUBJECTS[subj], 2.2, 'R'), ('Subject class code:', D.code(cls, subj), 1, 'M'),
         ('Grade:', str(D.GRADE), 0.5, 'R')],
        [('From register class:', cls, 1, 'B'), ('Educator:', D.SUBJECT_EDUCATOR[subj], 2, 'R'),
         ('No. of learners:', str(len(learners)), 0.6, 'R')]]) + GAP
    n, pitch = 25, 6.5
    h = list_section_height(n, pitch)
    assert y + h <= LIMIT, f'SA-03B does not fit ({y + h:.1f} > {LIMIT:.1f})'
    x, cy, iw = doc.section(y, h, 'A.  LEARNERS')
    cy = doc.instr_bar(x, cy, iw, INSTR_SUBJECT) + 2
    cols = lambda half: [('No.', 10, 'c', 'B')] + fit_cols(
        [('Surname', [r[0] for r in learners], 'l', 'R', None),
         ('First name', [r[1] for r in learners], 'l', 'R', None)], half - 10)
    two_col_list(doc, x, cy, iw, cols, learner_rows(learners), n, pitch)
    doc.save(y + h)
    REPORT['SA-03B'] = dict(rows_per_column=n, capacity=2 * n, pitch_mm=pitch, learners=len(learners))
    return doc


# ---------------------------------------------------------------- SA-03C
def sa03c(subj='EM'):
    doc = new('SA-03C', 'Combined subject class list', 'COMBINED SUBJECT CLASS LIST',
              'COMBINED SUBJECT CLASS LIST', 'SA-03C Combined subject class list.pdf')
    learners = D.COMBINED_EMS
    y = doc.header() + GAP
    y = doc.info_panel(y, [
        [('Subject:', D.SUBJECTS[subj], 2.6, 'R'), ('Subject class code:', D.code('X', subj), 1, 'M'),
         ('Grade:', str(D.GRADE), 0.5, 'R')],
        [('Combined classes:', '8A and 8B', 1, 'B'), ('Educator:', D.SUBJECT_EDUCATOR[subj], 2, 'R'),
         ('No. of learners:', str(len(learners)), 0.6, 'R')]]) + GAP
    n, pitch = 30, 5.5
    h = list_section_height(n, pitch)
    assert y + h <= LIMIT, f'SA-03C does not fit ({y + h:.1f} > {LIMIT:.1f})'
    x, cy, iw = doc.section(y, h, 'A.  LEARNERS')
    cy = doc.instr_bar(x, cy, iw, INSTR_SUBJECT) + 2
    cols = lambda half: [('No.', 9, 'c', 'B')] + fit_cols(
        [('Surname', [r[0] for r in learners], 'l', 'R', None),
         ('First name', [r[1] for r in learners], 'l', 'R', None)], half - 9 - 14) + [('Class', 14, 'c', 'B')]
    two_col_list(doc, x, cy, iw, cols, learner_rows(learners), n, pitch)
    doc.save(y + h)
    REPORT['SA-03C'] = dict(rows_per_column=n, capacity=2 * n, pitch_mm=pitch, learners=len(learners))
    return doc


# ---------------------------------------------------------------- SA-04
def sa04():
    doc = new('SA-04', 'Subject class code key', 'SUBJECT CLASS CODE KEY',
              'SUBJECT CLASS CODE KEY', 'SA-04 Subject class code key.pdf')
    y = doc.header() + GAP
    y = doc.info_panel(y, [[('Grade:', str(D.GRADE), 0.6, 'R'), ('Year:', str(D.YEAR), 0.8, 'R'),
                            ('Compiled by:', D.COMPILED_BY, 3, 'R')]]) + GAP
    # A. abbreviations
    pitch = 6
    h = PAD + TITLE_H + TITLE_GAP + 5 * pitch + PAD
    x, cy, iw = doc.section(y, h, 'A.  SUBJECT ABBREVIATIONS', '(provisional)')
    abbr = list(D.SUBJECTS.items())
    half = (iw - GUTTER) / 2
    cols = [('Abbreviation', 18, 'l', 'M'), ('Subject', half - 18, 'l', 'R')]
    for k in range(2):
        doc.rows(x + k * (half + GUTTER), cy, cols, abbr[k * 5:(k + 1) * 5], 5, pitch)
    y += h + GAP
    # B. subject classes
    rows = D.subject_classes()
    n = 22
    assert len(rows) <= n
    note_h = 5.5
    h = PAD + TITLE_H + TITLE_GAP + COLHDR_H + n * pitch + note_h + PAD
    assert y + h <= LIMIT, f'SA-04 does not fit ({y + h:.1f} > {LIMIT:.1f})'
    x, cy, iw = doc.section(y, h, 'B.  SUBJECT CLASSES')
    spec = [('Subject class code', [r[0] for r in rows], 'l', 'M', None),
            ('Subject', [r[1] for r in rows], 'l', 'R', None),
            ('Class(es)', [r[2] for r in rows], 'l', 'R', None),
            ('Type', [r[3] for r in rows], 'l', 'R', None),
            ('Educator', [r[4] for r in rows], 'l', 'R', None),
            ('Master list', [r[5] for r in rows], 'l', 'B', None)]
    cols = fit_cols(spec, iw)
    cy = doc.col_header(x, cy, cols)
    cy = doc.rows(x, cy, cols, rows, n, pitch)
    doc.note(x + CPAD, cy + 4, 'Code format is provisional: [Grade][Class][Subject], e.g. 8AMT. '
             'Combined classes use X, e.g. 8XEM.', iw - 2 * CPAD)
    doc.save(y + h)
    REPORT['SA-04'] = dict(rows=n, used=len(rows), pitch_mm=pitch)
    return doc


# ---------------------------------------------------------------- SA-05
def sa05(subj='MT'):
    doc = new('SA-05', 'Term ATP weekly plan', 'ANNUAL TEACHING PLAN — WEEKLY CODES',
              'TERM ATP WEEKLY PLAN', 'SA-05 Term ATP weekly plan.pdf')
    weeks = D.ATP_WEEKS
    y = doc.header() + GAP
    y = doc.info_panel(y, [[('Academic year:', str(D.YEAR), 0.8, 'R'), ('Grade:', str(D.GRADE), 0.5, 'R'),
                            ('Subject:', D.SUBJECTS[subj], 2, 'R'),
                            ('No. of weeks:', str(len(weeks)), 0.5, 'R')]]) + GAP
    y = doc.instr_bar(LEFT, y, USABLE_W,
                      'Copy this week’s ATP code into Section C of SA-02, then tick Completed or Not completed.') + GAP
    per_col = math.ceil(len(weeks) / 2)
    bh, bgap = (36, 4) if len(weeks) <= 10 else (30, 4)
    bw = (USABLE_W - GUTTER) / 2
    top_line, line_gap, leading = 9, 3, 4.5
    max_lines = math.floor((bh - 2 * PAD - top_line - line_gap) / leading + 1e-9)
    codes = []
    for i, topic in enumerate(weeks):
        col, row = divmod(i, per_col)
        bx = LEFT + col * (bw + GUTTER)
        by = y + row * (bh + bgap)
        doc.box(by, bh, bx, bw)
        ix, iy, iw = bx + PAD, by + PAD, bw - 2 * PAD
        doc.text(ix, doc.mid(iy, top_line, 'B', 11), f'Week {i + 1}', 'B', 11, DARK)
        code = D.atp_code(subj, D.TERM, i + 1)
        codes.append(code)
        doc.rrect(ix + iw - 26, iy, 26, 9, R_CELL, WHITE, DARK, LW_SECTION)
        doc.text(ix + iw - 13, doc.mid(iy, 9, 'M', 14), code, 'M', 14, DARK, 'c', max_w=24)
        lines = simpleSplit(topic, 'R', MIN_TABLE, iw * mm)
        assert len(lines) <= max_lines, f'week {i + 1}: {len(lines)} lines > {max_lines}'
        b = iy + top_line + line_gap + 3.2
        for ln in lines:
            doc.text(ix, b, ln, 'R', MIN_TABLE, TEXT, max_w=iw)
            b += leading
    y += per_col * bh + (per_col - 1) * bgap
    doc.note(LEFT, y + 4, 'ATP codes are provisional and will be replaced with the final coding scheme.', USABLE_W)
    doc.save(y + 5)
    REPORT['SA-05'] = dict(weeks=len(weeks), box_mm=bh, box_pitch_mm=bh + bgap, max_lines=max_lines,
                           line_pitch_mm=leading, codes=codes)
    return doc


if __name__ == '__main__':
    docs = [sa03a(), sa03b(), sa03c(), sa04(), sa05()]
    for d in docs:
        print('built', os.path.basename(d.path), '| smallest text', d.min_pt, 'pt')
    for k, v in REPORT.items():
        print(k, v)
