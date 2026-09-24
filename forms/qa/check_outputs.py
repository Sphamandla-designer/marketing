"""
Inspects the QA outputs in qa/output/<scenario>/:
  * renders every PDF page to PNG (qa/output/<scenario>/inspect/pdf-page-N.png) for visual review
  * checks that every submitted value appears in the PDF text layer
  * checks PDF page count == number of PNG files, PNG resolution == A4 @ 300 DPI
  * compares each PDF page (rasterised) with the PNG of the same page (mean pixel difference)
Requires: pip install pymupdf pillow
"""
import json, os, sys, glob, re
import fitz  # PyMuPDF
from PIL import Image, ImageChops, ImageStat

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'output')
DAYS = ['mon', 'tue', 'wed', 'thu', 'fri']
failures = 0

def expected_values(data):
    vals = []
    for k, v in data['meta'].items():
        if v: vals.append(v)
    for row in data['attendance']:
        for d in DAYS:
            for k in ('a', 'l'):
                if row[d][k]: vals.append(row[d][k])
    for row in data['observations']:
        for d in DAYS:
            if row[d]['learner']: vals.append(row[d]['learner'])
            if row[d]['code']: vals.append(row[d]['code'])
    if data.get('atp'):
        vals.append(data['atp']['code'])
    if data.get('comments'):
        vals += [w for w in re.findall(r"[A-Za-z0-9']+", data['comments']) if len(w) > 3][:80]
    return vals

for scen in sorted(os.listdir(OUT)):
    d = os.path.join(OUT, scen)
    if not os.path.isdir(d): continue
    # qa/output/blank holds generated blanks, not scenario runs — skip it here
    if not os.path.exists(os.path.join(d, 'data.json')): continue
    info = json.load(open(os.path.join(d, 'data.json')))
    pdfs = glob.glob(os.path.join(d, '*.pdf'))
    pngs = sorted(p for p in glob.glob(os.path.join(d, '*.png')) if os.path.basename(p) not in ('interactive-form.png', 'result-panel.png'))
    print(f'\n=== {scen}: {os.path.basename(pdfs[0])}')
    doc = fitz.open(pdfs[0])
    print(f'  pages: {len(doc)}  png files: {len(pngs)}  identifier: {info["identifier"]}  doc no: {info["docNumber"]}')
    if len(doc) != len(pngs) or len(doc) != info['pageCount']:
        failures += 1; print('  FAIL: page count mismatch')
    w, h = doc[0].rect.width / 72 * 25.4, doc[0].rect.height / 72 * 25.4
    print(f'  page size: {w:.1f} x {h:.1f} mm; fonts: {sorted({f[3] for p in doc for f in p.get_fonts()})}')
    text = '\n'.join(p.get_text() for p in doc)
    flat = re.sub(r'\s+', ' ', text)
    missing = [v for v in expected_values(info['data']) if v not in flat]
    print(f'  values checked: {len(expected_values(info["data"]))}; missing from PDF text: {missing if missing else "none"}')
    if missing: failures += 1
    form_code = 'SA-02' if 'Subject' in info['pdfName'] else 'SA-01'
    prefix = form_code.replace('-', '')
    must_have = [
        info['docNumber'], info['identifier'],
        'FISANTEKRAAL HIGH SCHOOL', 'FORM CODE', form_code,
        'ATTENDANCE', 'Period',                         # section A and its period row
        'Week:',
        'Educator signature',
        'Date:',                                        # header date field
        f'Page {len(doc)} of {len(doc)}',
    ]
    # both forms are designed to be a single page
    if len(doc) != 1:
        failures += 1
        print(f'  FAIL: expected 1 page, got {len(doc)}')
    # the register prints the code list and a titled sign-off; the subject form
    # leaves both off to make room for section C
    if 'Register' in info['pdfName']:
        must_have += ['Observation Code List', 'SIGN-OFF']
    for must in must_have:
        if must not in flat: failures += 1; print(f'  FAIL: "{must}" not found in PDF text')
    # every page carries its own barcode identifier, e.g. SA01-P1 … SA01-Pn
    for i in range(len(doc)):
        code = f'{prefix}-P{i+1}'
        if code not in re.sub(r'\s+', ' ', doc[i].get_text()):
            failures += 1; print(f'  FAIL: page {i+1} is missing its page code "{code}"')
    print(f'  page codes: {prefix}-P1 … {prefix}-P{len(doc)}')
    idir = os.path.join(d, 'inspect'); os.makedirs(idir, exist_ok=True)
    for i, page in enumerate(doc):
        pix = page.get_pixmap(dpi=110)
        pix.save(os.path.join(idir, f'pdf-page-{i+1}.png'))
        # parity check vs PNG output
        png = Image.open(pngs[i]).convert('RGB')
        if png.size != (2480, 3508): failures += 1; print(f'  FAIL: PNG {os.path.basename(pngs[i])} is {png.size}, expected 2480x3508')
        pp = page.get_pixmap(dpi=300)
        pdf_img = Image.frombytes('RGB', (pp.width, pp.height), pp.samples)
        a = pdf_img.resize((496, 702), Image.LANCZOS); b = png.resize((496, 702), Image.LANCZOS)
        diff = ImageChops.difference(a, b).convert('L')
        mean = ImageStat.Stat(diff).mean[0]
        bbox = diff.point(lambda v: 255 if v > 60 else 0).getbbox()
        print(f'  page {i+1}: PDF vs PNG mean pixel diff = {mean:.2f}/255 (strong-diff bbox: {bbox})')
        if mean > 6: failures += 1; print('  FAIL: PDF and PNG differ too much')
        # clipping check: nothing drawn within the outer 6 mm margin except footer/header area
        arr = png.resize((248, 351)).convert('L')
        edge = [arr.getpixel((x, y)) for y in range(351) for x in (0, 1, 246, 247)]
        if min(edge) < 200: failures += 1; print('  FAIL: ink touches the page edge (possible clipping)')
    # text blocks outside page bounds?
    for i, page in enumerate(doc):
        for b in page.get_text('blocks'):
            if b[0] < 0 or b[1] < 0 or b[2] > page.rect.width + 0.5 or b[3] > page.rect.height + 0.5:
                failures += 1; print(f'  FAIL: text block outside page {i+1}: {b[:4]} {b[4][:40]!r}')
print('\nINSPECTION FAILED' if failures else '\nINSPECTION PASSED – now open qa/output/*/inspect/pdf-page-*.png and the PNGs to review visually.')
sys.exit(1 if failures else 0)
