"""
The five pre-printed reference documents. Each function builds exactly one A4
portrait page and returns the Sheet.

These are reference documents, not forms: every number and code is printed. The
teacher reads a learner's number off them and writes it on SA-01 or SA-02.
"""
import settings
import data
from design import (Sheet, RED, INK, MUTED, HAIR, WHITE, TINT, BRAND, PALE, RADIUS,
                    centre_baseline, text_width)

YEAR = str(settings.ACADEMIC_YEAR)
TERM = str(settings.TERM)
VERSION = settings.LIST_VERSION_LABEL
GRADE = str(data.GRADE)


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


def _n_up(sheet, cols, groups, row_h, size=9, bold_cols=(0,), red_cols=(),
          wrap_cols=()):
    """`len(groups)` tables side by side with the standard gutter."""
    n = len(groups)
    w = (sheet.w - settings.TABLE_GUTTER * (n - 1)) / n
    y = sheet.y
    low = y
    for i, rows in enumerate(groups):
        x = sheet.x0 + i * (w + settings.TABLE_GUTTER)
        low = max(low, sheet.table(x, w, cols, rows, row_h, size=size, y=y,
                                   bold_cols=bold_cols, red_cols=red_cols,
                                   wrap_cols=wrap_cols))
    sheet.y = low + settings.BLOCK_GAP
    return sheet.y


def _start(code, name, title, instruction):
    s = Sheet()
    s.header(code, name, settings.LIST_STATUS)
    s.title_bar(title, instruction)
    return s


# ------------------------------------------------------------------- RL-01
def rl01():
    cls = data.REGISTER_CLASS
    learners = data.numbered(data.CLASS_10B)
    s = _start("RL-01", "REGISTER CLASS LIST", "REGISTER CLASS LIST",
               "Use these numbers on SA-01")
    s.info_bar([
        [("Class", cls["class"]), ("Class teacher", cls["teacher"]),
         ("Room", cls["room"]), ("Total learners", str(len(learners)))],
        [("Academic year", YEAR), ("Term", TERM),
         ("Phase", settings.phase_label(cls["grade"])), ("List version", VERSION)],
    ], big_first=True)
    s.status_line(settings.DRAFT_NOTICE)

    cols = [("No.", 10.0, "center"), ("SURNAME", None, "left"),
            ("First name", None, "left")]
    left, right = _split(learners, 30)
    _two_up(s, cols, left, right, 5.2)

    # Subjects panel: three blocks. Whole class and split side by side, the
    # combined block full width beneath them so that "Civil Technology
    # (Woodworking)" prints unshortened at 9 pt.
    top = s.panel_title("SUBJECTS FOR THIS CLASS")
    left_w = 84.0
    right_x = s.x0 + left_w + settings.TABLE_GUTTER
    right_w = s.w - left_w - settings.TABLE_GUTTER
    a = s.table(s.x0, left_w, [("Taken by the whole class", None, "left"),
                               ("Code", 20.0, "center")],
                data.WHOLE_CLASS_10B, 5.2, y=top, red_cols=(1,))
    b = s.table(right_x, right_w, [("Split within this class", None, "left"),
                                   ("Code", 20.0, "center"),
                                   ("Learners", 18.0, "center"),
                                   ("List", 16.0, "center")],
                data.SPLIT_10B, 5.2, y=top, red_cols=(1,), bold_cols=(2,))
    y = max(a, b) + settings.BLOCK_GAP
    s.y = s.table(s.x0, s.w, [("Combined with other classes", None, "left"),
                              ("With", 22.0, "center"), ("Code", 24.0, "center"),
                              ("Learners", 26.0, "center"), ("List", 16.0, "center")],
                  data.COMBINED_10B, 5.2, y=y, red_cols=(2,), bold_cols=(3,)) + 1.5
    s.note_line(data.ELECTIVE_NOTE)

    s.footer("RL-01", "Register class list",
             "Official list for the year. Use the learner numbers on SA-01. "
             "Notify the office of changes; a new version is issued when "
             "learners join or leave.")
    return s


# ------------------------------------------------------------------- SL-01
def sl01(subject, code, learners, other_label, footer_note, educator):
    cls = data.REGISTER_CLASS
    rows = data.numbered(learners)
    s = _start("SL-01", "SPLIT SUBJECT CLASS LIST", "SPLIT SUBJECT CLASS LIST",
               "Use these numbers on SA-02")
    s.info_bar([
        [("Subject", subject), ("Subject class code", code),
         ("Grade", GRADE), ("Split from register class", cls["class"])],
        [("Other group", other_label), ("Educator", educator),
         ("Total learners", str(len(rows))), ("Term", TERM)],
    ])
    s.status_line(settings.DRAFT_NOTICE)
    cols = [("No.", 10.0, "center"), ("SURNAME", None, "left"),
            ("First name", None, "left")]
    left, right = _split(rows, 25)
    _two_up(s, cols, left, right, 6.2)
    s.footer("SL-01", "Split subject class list", footer_note)
    return s


# ------------------------------------------------------------------- CL-01
def cl01():
    ordered = sorted(data.CIVIL_TECH_COMBINED, key=lambda p: (p[0], p[1]))
    rows = [(i + 1, s_, f, c) for i, (s_, f, c) in enumerate(ordered)]
    s = _start("CL-01", "COMBINED SUBJECT CLASS LIST",
               "COMBINED SUBJECT CLASS LIST", "Use these numbers on SA-02")
    s.info_bar([
        [("Subject", data.SUBJECT_BY_ABBR[data.COMBINED_ABBR]),
         ("Subject class code", data.COMBINED_CODE),
         ("Grade", GRADE), ("Combined from", ", ".join(data.CLASSES))],
        [("Educator", data.EDUCATORS[data.COMBINED_CODE]),
         ("Total learners", str(len(rows))), ("Term", TERM)],
    ])
    s.status_line(settings.DRAFT_NOTICE)
    cols = [("No.", 9.0, "center"), ("SURNAME", None, "left"),
            ("First name", None, "left"), ("Class", 12.0, "center")]
    left, right = _split(rows, 30)
    _two_up(s, cols, left, right, 5.2)
    s.footer("CL-01", "Combined subject class list",
             "Learners from different register classes are numbered together "
             "on this list.")
    return s


# ------------------------------------------------------------------- SC-01
SC01_ROW_H = 5.5     # 9 pt; the brief allows 5.5 mm or more


def sc01():
    s = _start("SC-01", "SUBJECT CODE KEY", "SUBJECT CODE KEY",
               "Write the subject class code on SA-02")
    s.info_bar([[
        ("Grade", GRADE), ("Academic year", YEAR), ("Term", TERM),
        ("Code format", settings.SUBJECT_CLASS_CODE_FORMAT + "  (provisional)"),
    ]])
    s.status_line(settings.DRAFT_NOTICE)

    # nine abbreviations in three side-by-side columns of three rows
    top = s.panel_title("SUBJECT ABBREVIATIONS")
    s.y = top
    cols = [("Abbr.", 16.0, "center"), ("Subject", None, "left")]
    abbr = data.SUBJECT_ABBREVIATIONS
    per = -(-len(abbr) // 3)
    _n_up(s, cols, [abbr[i:i + per] for i in range(0, len(abbr), per)], 5.2,
          bold_cols=(0,), red_cols=(0,), wrap_cols=(1,))

    top = s.panel_title("SUBJECT CLASSES")
    s.y = s.table(s.x0, s.w, [
        ("Code", 24.0, "center"), ("Subject", None, "left"),
        ("Register class(es)", 28.0, "center"), ("Type", 23.0, "center"),
        ("Educator", 34.0, "left"), ("Learner list", 20.0, "center"),
    ], data.subject_classes(), SC01_ROW_H, y=top, bold_cols=(0,), red_cols=(0,)) \
        + settings.BLOCK_GAP

    s.footer("SC-01", "Subject code key",
             "Every subject class code in use for this grade this term. Write "
             "the code exactly as it appears here in the Subject class code "
             "field on SA-02.")
    return s


# ------------------------------------------------------------------- AT-01
def at01(subject, subject_abbr, grade, term, weeks, source):
    """
    `weeks` is a list of (week_key, narrative). A key is a week number, or a
    span such as "6-10" for an examination block that is shown once. The
    narratives come from the official DBE ATP and are produced in STEP A; this
    function only lays them out. It never invents curriculum content.
    """
    s = _start("AT-01", "ATP WEEKLY PLAN", "ANNUAL TEACHING PLAN — WEEKLY COVERAGE",
               "Copy the week's ATP code into Section C of SA-02")
    s.info_bar([[
        ("Subject", subject), ("Grade", str(grade)), ("Academic year", YEAR),
        ("Term", str(term)), ("Rows", str(len(weeks))), ("Source", source),
    ]])
    s.status_line(settings.DRAFT_NOTICE)

    week_w, code_w = 24.0, 24.0   # 'Weeks 6–10' must fit the week column
    narrative_w = s.w - week_w - code_w
    head_h = 6.2
    top = s.y
    # about 17 mm per row; an eleven-week term takes what the page allows
    footer_h = 5.6 + 3.8 + 0.8   # the footer block for a one-line note
    avail = settings.PAGE_H - settings.MARGIN - footer_h - settings.BLOCK_GAP \
        - top - head_h
    row_h = min(17.0, avail / len(weeks))
    s.rect(s.x0, top, s.w, head_h, fill=BRAND, radius=RADIUS["box"])
    s.rect(s.x0, top + head_h - 1.2, s.w, 1.2, fill=BRAND)
    for label, x, w in (("Week", s.x0, week_w), ("ATP code", s.x0 + week_w, code_w),
                        ("What must be covered", s.x0 + week_w + code_w, narrative_w)):
        s.text(label, x + settings.CELL_PAD,
               centre_baseline(top, head_h, s.HEAD_PT), s.HEAD_PT, "b", WHITE)
    y = top + head_h
    for i, (week, narrative) in enumerate(weeks):
        if i % 2 == 1:
            s.rect(s.x0, y, s.w, row_h, fill=TINT)
        label = f"Weeks {week}".replace("-", "–") if "-" in str(week) else f"Week {week}"
        s.text(label, s.x0 + settings.CELL_PAD,
               centre_baseline(y, row_h, 9), 9, "b", INK)
        box_w, box_h = code_w - 4.0, 7.0
        bx, by = s.x0 + week_w + 2.0, y + (row_h - box_h) / 2
        s.rect(bx, by, box_w, box_h, fill=WHITE, stroke=BRAND, lw=0.6, radius=RADIUS["box"])
        s.text(data.atp_code(subject_abbr, grade, term, week), bx + box_w / 2,
               centre_baseline(by, box_h, 13), 13, "m", BRAND, "center")
        lines = s.wrap(narrative, narrative_w - settings.CELL_PAD * 2, 9)
        if len(lines) > 3:
            # never silently drop a line of the week's plan
            s.truncated.append(f"T{term} week {week}: {len(lines)} lines")
        first = y + (row_h - (len(lines) - 1) * 4.0) / 2 + 1.4
        for k, line in enumerate(lines[:3]):
            s.text(line, s.x0 + week_w + code_w + settings.CELL_PAD,
                   first + k * 4.0, 9, "r", INK)
        y += row_h
    s.rect(s.x0, top, s.w, y - top, stroke=HAIR, lw=0.4, radius=RADIUS["box"])
    s.line(s.x0 + week_w, top, s.x0 + week_w, y, HAIR, 0.4)
    s.line(s.x0 + week_w + code_w, top, s.x0 + week_w + code_w, y, HAIR, 0.4)
    s.y = y + settings.BLOCK_GAP

    s.footer("AT-01", "ATP weekly plan",
             "ATP codes are provisional. Follow the official DBE ATP where "
             "this summary and the ATP differ.")
    return s
