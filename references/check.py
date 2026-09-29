"""
Section 8 delivery checks. Run with `python3 references/build.py --check`.

Half of these read the built PDFs (one page, margins, type size, nothing under
the footer) and half read the data (numbering, the 9B learners matching across
three documents, the split groups partitioning the class, code coverage).
"""
import pathlib
import re

import pymupdf as fitz

import settings
import data

MM = 72.0 / 25.4
TABLE_MIN_PT = settings.MIN_TABLE_PT
PAGE_MIN_PT = settings.MIN_NOTE_PT


def _spans(page):
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            for span in line["spans"]:
                yield span


def check_pdf(path):
    """One A4 portrait page, inside the margins, nothing set too small."""
    out = []
    doc = fitz.open(path)
    ok = doc.page_count == 1
    out.append((ok, f"exactly one page (got {doc.page_count})"))
    page = doc[0]
    w, h = page.rect.width / MM, page.rect.height / MM
    out.append((abs(w - 210) < 0.5 and abs(h - 297) < 0.5,
                f"A4 portrait (got {w:.1f} x {h:.1f} mm)"))

    # the crest is artwork; the lettering inside it is not document text
    crest = fitz.Rect(settings.MARGIN * MM, settings.MARGIN * MM,
                      (settings.MARGIN + 20) * MM, (settings.MARGIN + 22) * MM)
    small, left, right, low, high = [], 999.0, 0.0, 0.0, 999.0
    for sp in _spans(page):
        if crest.contains(fitz.Rect(sp["bbox"])):
            continue
        if sp["size"] < PAGE_MIN_PT - 0.01:
            small.append((round(sp["size"], 1), sp["text"][:24]))
        x0, y0, x1, y1 = sp["bbox"]
        left, right = min(left, x0 / MM), max(right, x1 / MM)
        high, low = min(high, y0 / MM), max(low, y1 / MM)
    out.append((not small, f"no text below {PAGE_MIN_PT} pt "
                           f"({small[:3] if small else 'none'})"))
    m = settings.MARGIN
    out.append((left >= m - 0.6, f"nothing left of the {m} mm margin ({left:.1f})"))
    out.append((right <= 210 - m + 0.6,
                f"nothing right of the {m} mm margin ({right:.1f})"))
    out.append((high >= m - 0.6, f"nothing above the {m} mm margin ({high:.1f})"))
    out.append((low <= 297 - m + 0.6,
                f"nothing below the {m} mm margin ({low:.1f})"))
    doc.close()
    return out


def check_overflow(sheets):
    out = []
    for code, sheet in sheets:
        out.append((sheet.overflow <= 0.01,
                    f"{code}: content clears the footer rule "
                    f"(overflow {sheet.overflow} mm)"))
        out.append((not sheet.truncated,
                    f"{code}: nothing shortened to fit its column "
                    f"({sheet.truncated[:3] if sheet.truncated else 'none'})"))
    return out


def _numbering_ok(rows):
    """1..n, and in alphabetical order by surname then first name."""
    nums = [r[0] for r in rows]
    names = [(r[1], r[2]) for r in rows]
    return nums == list(range(1, len(rows) + 1)) and names == sorted(names)


def check_data():
    out = []
    reg = data.numbered(data.CLASS_9B)
    mt = data.numbered(data.MATHS_9B)
    ml = data.numbered(data.MATHS_LIT_9B)
    combined = sorted(data.WOODWORK_COMBINED, key=lambda p: (p[0], p[1]))
    comb_rows = [(i + 1, s, f) for i, (s, f, _) in enumerate(combined)]

    for label, rows in (("RL-01", reg), ("SL-01 9B-MT", mt),
                        ("SL-01 9B-ML", ml), ("CL-01", comb_rows)):
        out.append((_numbering_ok(rows),
                    f"{label}: numbered from 1, alphabetical by surname"))

    reg_set = {(s, f) for _, s, f in reg}
    mt_set = {(s, f) for _, s, f in mt}
    ml_set = {(s, f) for _, s, f in ml}
    out.append((not (mt_set & ml_set),
                f"SL-01 groups do not overlap ({len(mt_set & ml_set)} shared)"))
    out.append((mt_set | ml_set == reg_set,
                "SL-01 groups together equal the whole 9B class"))

    ww_9b = {(s, f) for s, f, c in data.WOODWORK_COMBINED if c == "9B"}
    out.append((ww_9b <= reg_set,
                f"CL-01's 9B learners all appear on RL-01 "
                f"({len(ww_9b - reg_set)} missing)"))
    out.append((len(combined) == len({(s, f, c) for s, f, c in combined}),
                "CL-01 has no duplicate learners"))

    # every code on the lists must appear on SC-01
    sc_codes = {r[0] for r in data.subject_classes()}
    used = ({c for _, c in data.WHOLE_CLASS_9B}
            | {c for _, c, _ in data.SPLIT_9B}
            | {c for _, _, c, _ in data.COMBINED_9B})
    missing = used - sc_codes
    out.append((not missing, f"every list code appears on SC-01 ({missing or 'none'})"))
    return out


def check_atp(spec=None):
    """ATP codes are 4 allowed characters; narratives fit the character limit."""
    out = []
    pattern = re.compile(f"^[{settings.ATP_ALPHABET}]{{{settings.ATP_CODE_LENGTH}}}$")
    if not spec:
        out.append((True, "AT-01: not built (no DBE ATP supplied) — skipped"))
        return out
    seen = {}
    blocks = spec["terms"] if "terms" in spec else [
        {"term": spec["term"], "weeks": spec["weeks"]}]
    for block in blocks:
        for w in block["weeks"]:
            where = f"T{block['term']} week {w['week']}"
            code = data.atp_code(spec["abbr"], spec["grade"], block["term"],
                                 w["week"])
            out.append((bool(pattern.match(code)),
                        f"{where}: ATP code {code} uses 4 allowed characters"))
            n = len(w["narrative"])
            out.append((n <= settings.ATP_WEEK_CHAR_LIMIT,
                        f"{where}: narrative {n} of "
                        f"{settings.ATP_WEEK_CHAR_LIMIT} characters"))
            out.append((code not in seen,
                        f"{where}: ATP code is unique (else {seen.get(code)})"))
            seen[code] = where
    return out


def run(built, sheets=(), atp_spec=None):
    results = []
    for code, path in built:
        results.append((None, f"--- {code}  {pathlib.Path(path).name}"))
        results += check_pdf(path)
    results.append((None, "--- data"))
    results += check_data()
    results += check_overflow(sheets)
    results += check_atp(atp_spec)

    fails = 0
    for ok, msg in results:
        if ok is None:
            print(f"\n{msg}")
        else:
            print(f"  {'ok  ' if ok else 'FAIL'}  {msg}")
            fails += 0 if ok else 1
    print(f"\n{'CHECKS PASSED' if not fails else f'CHECKS FAILED ({fails})'}")
    return 1 if fails else 0
