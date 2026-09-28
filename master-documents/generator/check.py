"""Checks for the FILLED example documents (run after build.py). blank.py checks the blank forms itself."""
import glob
import os
import re

import pymupdf

import data as D

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'filled-examples')
MM = 72 / 25.4
ok = True


def check(cond, msg):
    global ok
    print(('  ok   ' if cond else '  FAIL ') + msg)
    ok &= bool(cond)


def spans(page):
    for b in page.get_text('dict')['blocks']:
        for l in b.get('lines', []):
            for s in l['spans']:
                if s['text'].strip():
                    yield s


texts = {}
for f in sorted(glob.glob(os.path.join(OUT, 'SA-*.pdf'))):
    name = os.path.basename(f)
    print(name)
    doc = pymupdf.open(f)
    page = doc[0]
    check(doc.page_count == 1, 'exactly one page')
    check(abs(page.rect.width / MM - 210) < .1 and abs(page.rect.height / MM - 297) < .1, 'A4')
    ss = list(spans(page))
    inside = all(10 * MM - .5 <= s['bbox'][0] and s['bbox'][2] <= 200 * MM + .5
                 and 10 * MM - .5 <= s['bbox'][1] and s['bbox'][3] <= 287 * MM + .5 for s in ss)
    dr = [d['rect'] for d in page.get_drawings()]
    inside &= all(r.x0 >= 10 * MM - 1 and r.x1 <= 200 * MM + 1 and r.y0 >= 10 * MM - 1 and r.y1 <= 287 * MM + 1
                  for r in dr)
    check(inside, 'all text and drawing within the 10 mm margins')
    small = sorted({(round(s['size'], 1), s['text'].strip()) for s in ss if s['size'] < 8})
    in_formbox = all(s['bbox'][0] > 140 * MM and s['bbox'][3] < 35 * MM for s in ss if s['size'] < 8)
    check(in_formbox, f'text below 8 pt only inside the form-code box (as on SA-01/02/OC): {[t for _, t in small]}')
    # overlapping text spans (same line fragments excluded)
    bad = []
    for i, a in enumerate(ss):
        ra = pymupdf.Rect(a['bbox'])
        for b in ss[i + 1:]:
            rb = pymupdf.Rect(b['bbox'])
            inter = ra & rb
            if not inter.is_empty and inter.width > .8 and inter.height > 1.5:
                bad.append((a['text'], b['text']))
    check(not bad, f'no overlapping text {bad[:3]}')
    txt = page.get_text()
    texts[name] = txt
    check('2026 · Term 2' in txt, 'header shows "2026 · Term 2"')
    check('Learn · Grow · Contribute' in txt, 'footer includes the motto')
    check('Page 1 of 1' in txt, 'footer page pill')

print('cross-document')
# numbering and order
for label, lst in [('SA-03A 8A', D.REGISTER['8A']), ('SA-03B 8AMT', D.SPLIT_GROUPS[('8A', 'MT')]),
                   ('SA-03C 8XEM', D.COMBINED_EMS)]:
    keys = [(r[0].lower(), r[1].lower()) for r in lst]
    check(keys == sorted(keys), f'{label}: alphabetical by surname ({len(lst)} learners)')

def listed(name):
    """(no, surname, first) triples read back from a PDF's learner table."""
    page = pymupdf.open(os.path.join(OUT, name))[0]
    rows = {}
    for s in spans(page):
        y = round(s['bbox'][3], 0)
        rows.setdefault((s['bbox'][0] > 105 * MM, y), []).append((s['bbox'][0], s['text'].strip()))
    out = []
    for (_, y), cells in rows.items():
        cells.sort()
        if cells and cells[0][1].isdigit() and len(cells) >= 3 and y > 80 * MM:
            out.append((int(cells[0][1]), cells[1][1], cells[2][1]))
    return sorted(out)


for name, lst in [('SA-03A Register class master list.pdf', D.REGISTER['8A']),
                  ('SA-03B Split subject class list.pdf', D.SPLIT_GROUPS[('8A', 'MT')]),
                  ('SA-03C Combined subject class list.pdf', [(s, f) for s, f, _ in D.COMBINED_EMS])]:
    got = listed(name)
    check([n for n, *_ in got] == list(range(1, len(lst) + 1)), f'{name[:6]}: numbered 1..{len(lst)} on the page')
    check([(s, f) for _, s, f in got] == list(lst), f'{name[:6]}: printed names match the dataset')

# names consistent: every learner on a subject list exists in their register class
reg = {(s, f): c for c in D.REGISTER for s, f in D.REGISTER[c]}
check(all(reg.get((s, f)) == '8A' for s, f in D.SPLIT_GROUPS[('8A', 'MT')]), 'SA-03B learners match 8A register names')
check(all(reg.get((s, f)) == c for s, f, c in D.COMBINED_EMS), 'SA-03C learners and classes match register names')

# codes on SA-03 documents appear on SA-04
code_re = re.compile(r'\b8[ABX][A-Z]{2}\b')
sa04 = set(code_re.findall(texts['SA-04 Subject class code key.pdf']))
for n in ('SA-03A Register class master list.pdf', 'SA-03B Split subject class list.pdf',
          'SA-03C Combined subject class list.pdf'):
    codes = set(code_re.findall(texts[n]))
    check(codes and codes <= sa04, f'{n[:6]} codes {sorted(codes)} all on SA-04')

atp = re.findall(r'\b[A-Z0-9]{4}\b', texts['SA-05 Term ATP weekly plan.pdf'])
atp = [c for c in atp if c.startswith('MT')]
check(len(atp) == 10 and all(len(c) == 4 and set(c) <= D.ATP_ALPHABET for c in atp),
      f'ATP codes 4 chars from 2-9 and A-Z without I/O: {atp}')
print('\nALL CHECKS PASSED' if ok else '\nSOME CHECKS FAILED')
