"""
The five pre-printed reference documents. Each function builds exactly one A4
portrait page and returns the Sheet.

These are reference documents, not forms: every number and code is printed. The
teacher reads a learner's number off them and writes it on SA-01 or SA-02.
"""
import settings
import data
from design import (Sheet, RED, INK, MUTED, HAIR, WHITE, PINK, centre_baseline,
                    text_width)

YEAR = str(settings.ACADEMIC_YEAR)
TERM = str(settings.TERM)
VERSION = f"{settings.LIST_VERSION}, effective {settings.LIST_VERSION_EFFECTIVE}"


def _split(rows, cap):
    """
    Deal a numbered list into two side-by-side columns. At capacity this is the
    documented 1..cap on the left and the rest on the right; below capacity the
    two columns are balanced, so a short list does not print as one long column
    beside an empty one. Unused rows are left out, never drawn empty.
    """
    left = min(cap, -(-len(rows) // 2)) if len(rows) <= cap * 2 else cap
    return rows[:left], rows[left:]


def _two_up(sheet, cols, left, right, row_h, size=9, bold_cols=(0, 1),
            red_cols=()):
    """Two tables side by side with the standard gutter. Returns the lower y."""
    w = (sheet.w - settings.TABLE_GUTTER) / 2
    y = sheet.y
    a = sheet.table(sheet.x0, w, cols, left, row_h, size=size, y=y,
                    bold_cols=bold_cols, red_cols=red_cols)
    b = y
    if right:
        b = sheet.table(sheet.x0 + w + settings.TABLE_GUTTER, w, cols, right,
                        row_h, size=size, y=y, bold_cols=bold_cols,
                        red_cols=red_cols)
    sheet.y = max(a, b) + settings.BLOCK_GAP
    return sheet.y


# ------------------------------------------------------------------- RL-01
def rl01():
    cls = data.REGISTER_CLASS
    learners = data.numbered(data.CLASS_9B)
    s = Sheet()
    s.header("RL-01", "REGISTER CLASS LIST", settings.LIST_STATUS)
    s.title_bar("REGISTER CLASS LIST", "Use these numbers on SA-01")
    s.info_bar([
        [("Class", cls["class"]), ("Class teacher", cls["teacher"]),
         ("Room", cls["room"]), ("Total learners", str(len(learners)))],
        [("Academic year", YEAR), ("Term", TERM),
         ("Phase", settings.phase_label(cls["grade"])), ("List version", VERSION)],
    ], big_first=True)

    cols = [("No.", 10.0, "center"), ("SURNAME", None, "left"),
            ("First name", None, "left")]
    left, right = _split(learners, 30)
    _two_up(s, cols, left, right, 5.2)

    # Subjects panel. The three groups keep their own headed tables, but the
    # split and combined groups are stacked in the right-hand column: three
    # equal side-by-side tables cannot hold a name like "Economic and
    # Management Sciences" at 9 pt inside 190 mm without truncating it.
    top = s.panel_title("SUBJECTS FOR THIS CLASS")
    half = (s.w - settings.TABLE_GUTTER) / 2
    right_x = s.x0 + half + settings.TABLE_GUTTER
    s.table(s.x0, half, [("Taken by the whole class", None, "left"),
                         ("Code", 20.0, "center")],
            data.WHOLE_CLASS_9B, 5.2, y=top, red_cols=(1,))
    ry = s.table(right_x, half, [("Split subjects", None, "left"),
                                 ("Code", 20.0, "center"), ("List", 16.0, "center")],
                 data.SPLIT_9B, 5.2, y=top, red_cols=(1,))
    s.table(right_x, half, [("Combined with other classes", None, "left"),
                            ("With", 16.0, "center"), ("Code", 24.0, "center"),
                            ("List", 16.0, "center")],
            data.COMBINED_9B, 5.2, y=ry + settings.BLOCK_GAP, red_cols=(2,))
    s.y = top + 6.2 + 7 * 5.2 + settings.BLOCK_GAP

    s.footer("RL-01", "Register class list",
             "Official list for the year. Use the learner numbers on SA-01. "
             "Notify the office of changes; a new version is issued when "
             "learners join or leave.")
    return s


# ------------------------------------------------------------------- SL-01
def sl01(subject, code, learners, other_label, other_subject, educator):
    cls = data.REGISTER_CLASS
    rows = data.numbered(learners)
    s = Sheet()
    s.header("SL-01", "SPLIT SUBJECT CLASS LIST", settings.LIST_STATUS)
    s.title_bar("SPLIT SUBJECT CLASS LIST", "Use these numbers on SA-02")
    s.info_bar([
        [("Subject", subject), ("Subject class code", code),
         ("Grade", str(cls["grade"])), ("Split from register class", cls["class"])],
        [("Other group", other_label), ("Educator", educator),
         ("Total learners", str(len(rows))), ("Term", TERM)],
    ])
    cols = [("No.", 10.0, "center"), ("SURNAME", None, "left"),
            ("First name", None, "left")]
    left, right = _split(rows, 25)
    _two_up(s, cols, left, right, 6.2)
    s.footer("SL-01", "Split subject class list",
             f"This class splits for {subject}. Learners not on this list are "
             f"on the {other_subject} list.")
    return s


# ------------------------------------------------------------------- CL-01
def cl01():
    rows = [(n, s_, f) for n, s_, f in
            [(i + 1, p[0], p[1]) for i, p in
             enumerate(sorted(data.WOODWORK_COMBINED, key=lambda p: (p[0], p[1])))]]
    ordered = sorted(data.WOODWORK_COMBINED, key=lambda p: (p[0], p[1]))
    rows = [(i + 1, s_, f, c) for i, (s_, f, c) in enumerate(ordered)]
    s = Sheet()
    s.header("CL-01", "COMBINED SUBJECT CLASS LIST", settings.LIST_STATUS)
    s.title_bar("COMBINED SUBJECT CLASS LIST", "Use these numbers on SA-02")
    s.info_bar([
        [("Subject", "Woodworking"), ("Subject class code", "9ABC-WW"),
         ("Grade", "9"), ("Combined from", "9A, 9B, 9C")],
        [("Educator", data.EDUCATORS["9ABC-WW"]),
         ("Total learners", str(len(rows))), ("Term", TERM)],
    ])
    cols = [("No.", 9.0, "center"), ("SURNAME", None, "left"),
            ("First name", None, "left"), ("Class", 12.0, "center")]
    left, right = _split(rows, 30)
    _two_up(s, cols, left, right, 5.2)
    s.footer("CL-01", "Combined subject class list",
             "Learners from different register classes are numbered together "
             "on this list.")
    return s


# ------------------------------------------------------------------- SC-01
def sc01():
    s = Sheet()
    s.header("SC-01", "SUBJECT CODE KEY", settings.LIST_STATUS)
    s.title_bar("SUBJECT CODE KEY", "Write the subject class code on SA-02")
    s.info_bar([[
        ("Grade", "9"), ("Academic year", YEAR), ("Term", TERM),
        ("Code format", settings.SUBJECT_CLASS_CODE_FORMAT + "  (provisional)"),
    ]])

    top = s.panel_title("SUBJECT ABBREVIATIONS")
    s.y = top
    cols = [("Abbreviation", 26.0, "center"), ("Subject", None, "left")]
    abbr = data.SUBJECT_ABBREVIATIONS
    half = -(-len(abbr) // 2)
    _two_up(s, cols, abbr[:half], abbr[half:], 5.2, bold_cols=(0,), red_cols=(0,))

    top = s.panel_title("SUBJECT CLASSES")
    s.y = s.table(s.x0, s.w, [
        ("Code", 23.0, "center"), ("Subject", None, "left"),
        ("Register class(es)", 24.0, "center"), ("Type", 27.0, "center"),
        ("Educator", 34.0, "left"), ("Learner list", 18.0, "center"),
    ], data.subject_classes(), 6.0, y=top, bold_cols=(0,), red_cols=(0,)) \
        + settings.BLOCK_GAP

    s.footer("SC-01", "Subject code key",
             "Every subject class code in use for this grade this term. Write "
             "the code exactly as it appears here in the Subject class code "
             "field on SA-02.")
    return s


# ------------------------------------------------------------------- AT-01
def at01(subject, subject_abbr, grade, term, weeks, source):
    """
    `weeks` is a list of (week_number, narrative). The narratives come from the
    official DBE ATP and are produced in STEP A; this function only lays them
    out. It never invents curriculum content.
    """
    s = Sheet()
    s.header("AT-01", "ATP WEEKLY PLAN", settings.LIST_STATUS)
    s.title_bar("ANNUAL TEACHING PLAN — WEEKLY COVERAGE",
                "Copy the week's ATP code into Section C of SA-02")
    s.info_bar([[
        ("Subject", subject), ("Grade", str(grade)), ("Academic year", YEAR),
        ("Term", str(term)), ("Weeks", str(len(weeks))), ("Source", source),
    ]])

    week_w, code_w = 18.0, 24.0
    narrative_w = s.w - week_w - code_w
    row_h = 17.0
    head_h = 6.2
    top = s.y
    s.rect(s.x0, top, s.w, head_h, fill=RED)
    for label, x, w in (("Week", s.x0, week_w), ("ATP code", s.x0 + week_w, code_w),
                        ("What must be covered", s.x0 + week_w + code_w, narrative_w)):
        s.text(label, x + settings.CELL_PAD,
               centre_baseline(top, head_h, s.HEAD_PT), s.HEAD_PT, "b", WHITE)
    y = top + head_h
    for i, (week, narrative) in enumerate(weeks):
        if i % 2 == 1:
            s.rect(s.x0, y, s.w, row_h, fill=(0xFD / 255, 0xF3 / 255, 0xF5 / 255))
        s.text(f"Week {week}", s.x0 + settings.CELL_PAD,
               centre_baseline(y, row_h, 9), 9, "b", INK)
        box_w, box_h = code_w - 4.0, 7.0
        bx, by = s.x0 + week_w + 2.0, y + (row_h - box_h) / 2
        s.rect(bx, by, box_w, box_h, fill=WHITE, stroke=RED, lw=0.7)
        s.text(data.atp_code(subject_abbr, grade, term, week), bx + box_w / 2,
               centre_baseline(by, box_h, 13), 13, "m", RED, "center")
        lines = s.wrap(narrative, narrative_w - settings.CELL_PAD * 2, 9)
        first = y + (row_h - (len(lines) - 1) * 4.0) / 2 + 1.4
        for k, line in enumerate(lines[:3]):
            s.text(line, s.x0 + week_w + code_w + settings.CELL_PAD,
                   first + k * 4.0, 9, "r", INK)
        y += row_h
    s.rect(s.x0, top, s.w, y - top, stroke=HAIR, lw=0.4)
    s.line(s.x0, top + head_h, s.x0 + s.w, top + head_h, HAIR, 0.4)
    s.line(s.x0 + week_w, top, s.x0 + week_w, y, HAIR, 0.4)
    s.line(s.x0 + week_w + code_w, top, s.x0 + week_w + code_w, y, HAIR, 0.4)
    s.y = y + settings.BLOCK_GAP

    s.footer("AT-01", "ATP weekly plan",
             "ATP codes are provisional. Follow the official DBE ATP where "
             "this summary and the ATP differ.")
    return s
