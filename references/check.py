"""
Section 10 delivery checks. Run with `python3 references/build.py --check`.
The build fails if any check fails.

Half of these read the built PDFs (one page, margins, type size, nothing under
the footer, no forbidden word) and half read the data (numbering, the 10B
learners matching across every list, the split groups partitioning the class,
code coverage, staff surnames, ATP codes and narratives).
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


def forbidden_in(path):
    """Forbidden words found in a PDF's text, allowed phrases removed first."""
    doc = fitz.open(path)
    text = "\n".join(page.get_text() for page in doc)
    doc.close()
    text = re.sub(r"\s+", " ", text)
    for phrase in settings.FORBIDDEN_ALLOWED_PHRASES:
        text = text.replace(phrase, "")
    return sorted({w for w in settings.FORBIDDEN_WORDS if w in text})


def check_forbidden(paths):
    out = []
    for path in paths:
        found = forbidden_in(path)
        out.append((not found, f"{pathlib.Path(path).name}: no forbidden word "
                               f"({found or 'none'})"))
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
    reg = data.numbered(data.CLASS_10B)
    mt = data.numbered(data.MATHS_10B)
    ml = data.numbered(data.MATHS_LIT_10B)
    to = data.numbered(data.TOURISM_10B)
    combined = sorted(data.CIVIL_TECH_COMBINED, key=lambda p: (p[0], p[1]))
    comb_rows = [(i + 1, s, f) for i, (s, f, _) in enumerate(combined)]

    for label, rows in (("RL-01", reg), ("SL-01 10B-MT", mt),
                        ("SL-01 10B-ML", ml), ("SL-01 10B-TO", to),
                        ("CL-01", comb_rows)):
        out.append((_numbering_ok(rows),
                    f"{label}: numbered from 1, alphabetical by surname"))

    reg_set = {(s, f) for _, s, f in reg}
    mt_set = {(s, f) for _, s, f in mt}
    ml_set = {(s, f) for _, s, f in ml}
    to_set = {(s, f) for _, s, f in to}
    cw_10b = {(s, f) for s, f, c in data.CIVIL_TECH_COMBINED if c == "10B"}
    out.append((not (mt_set & ml_set), f"MT ∩ ML = ∅ ({len(mt_set & ml_set)} shared)"))
    out.append((mt_set | ml_set == reg_set, "RL-01 = MT ∪ ML"))
    out.append((not (cw_10b & to_set), f"CW(10B) ∩ TO = ∅ ({len(cw_10b & to_set)} shared)"))
    out.append((cw_10b | to_set == reg_set, "RL-01 = CW(10B) ∪ TO"))
    out.append((len(combined) == len({(s, f, c) for s, f, c in combined}),
                "CL-01 has no duplicate learners"))

    # a learner who appears on more than one list carries the same name
    seen, clash = {}, []
    for label, people in (("RL-01", reg_set), ("MT", mt_set), ("ML", ml_set),
                          ("TO", to_set),
                          ("CL-01", {(s, f) for s, f, _ in data.CIVIL_TECH_COMBINED})):
        for s, f in people:
            key = s
            if key in seen and seen[key][0] != f and seen[key][1] in ("RL-01",) \
                    and label != "CL-01":
                clash.append((s, seen[key][0], f))
            seen.setdefault(key, (f, label))
    # the strict form: every 10B learner on any 10B list is the identical tuple
    for label, people in (("MT", mt_set), ("ML", ml_set), ("TO", to_set),
                          ("CL-01 10B", cw_10b)):
        bad = people - reg_set
        out.append((not bad, f"{label}: every learner is identical to RL-01 "
                             f"({sorted(bad)[:3] if bad else 'none'})"))

    # SC-01 codes equal the data's codes and cover every printed code
    sc_codes = {r[0] for r in data.subject_classes()}
    data_codes = set(data.all_codes())
    printed = data.printed_codes()
    out.append((sc_codes == data_codes,
                f"SC-01 codes equal the data's codes ({sc_codes ^ data_codes or 'exact'})"))
    out.append((printed <= sc_codes,
                f"every code printed on the lists appears on SC-01 "
                f"({printed - sc_codes or 'none missing'})"))
    out.append((len(sc_codes) == 25, f"SC-01 has 25 rows (got {len(sc_codes)})"))

    # staff surnames never match a learner surname
    learners = {s for s, _ in data.CLASS_10B + data.CIVIL_TECH_10A + data.CIVIL_TECH_10C}
    staff = {data.staff_surname(n) for n in data.STAFF.values()}
    out.append((not (staff & learners),
                f"no staff surname matches a learner surname ({staff & learners or 'none'})"))
    titles_ok = all(n.split()[0] in ("Mr", "Mrs", "Ms") for n in data.STAFF.values())
    out.append((titles_ok, "staff titles are Mr, Mrs or Ms only"))
    return out


def check_atp(specs):
    """ATP codes are 4 allowed characters and unique across every subject,
    grade, term and week; narratives fit the character limit and the voice."""
    out = []
    pattern = re.compile(f"^[{settings.ATP_ALPHABET}]{{{settings.ATP_CODE_LENGTH}}}$")
    if not specs:
        out.append((True, "AT-01: not built (no DBE ATP supplied) — skipped"))
        return out
    seen = {}
    for spec in specs:
        blocks = spec["terms"] if "terms" in spec else [
            {"term": spec["term"], "weeks": spec["weeks"]}]
        for block in blocks:
            for w in block["weeks"]:
                where = f"{spec['abbr']} Gr{spec['grade']} T{block['term']} week {w['week']}"
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
                out.append(("your own" not in w["narrative"].lower(),
                            f"{where}: narrative never says 'your own'"))
                seen[code] = where
    return out


def run(built, sheets=(), specs=(), extra_pdfs=()):
    results = []
    for code, path in built:
        results.append((None, f"--- {code}  {pathlib.Path(path).name}"))
        results += check_pdf(path)
    results.append((None, "--- forbidden words"))
    results += check_forbidden([p for _, p in built] + list(extra_pdfs))
    results.append((None, "--- data"))
    results += check_data()
    results += check_overflow(sheets)
    results.append((None, "--- ATP"))
    results += check_atp(specs)

    fails = 0
    for ok, msg in results:
        if ok is None:
            print(f"\n{msg}")
        else:
            print(f"  {'ok  ' if ok else 'FAIL'}  {msg}")
            fails += 0 if ok else 1
    print(f"\n{'CHECKS PASSED' if not fails else f'CHECKS FAILED ({fails})'}")
    return 1 if fails else 0
