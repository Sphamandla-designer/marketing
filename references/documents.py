"""
The pre-printed reference documents. Each function builds exactly one A4
portrait page and returns the Sheet, in the First Home Finance card grammar:
a rounded card per block, a dark title bar, a slate heading band, and every
value in its own rounded box.

These are reference documents, not forms: every number and code is printed. The
teacher reads a learner's number off them and writes it on SA-01 or SA-02.
"""
import settings
import data
from design import (Sheet, INK, WHITE, TINT, BRAND, PALE, RADIUS, centre_baseline,
                    text_width)

YEAR = str(settings.ACADEMIC_YEAR)
TERM = str(settings.TERM)
VERSION = settings.LIST_VERSION_LABEL
GRADE = str(data.GRADE)
PITCH = 6.0            # the form's row pitch: a 4.8 mm box plus 1.2 mm of air


def _split(rows, cap):
    """
    Deal a numbered list into two side-by-side columns. At capacity this is the
    documented 1..cap on the left and the rest on the right; below capacity the
    two columns are balanced, so a short list does not print as one long column
    beside an empty one. Unused rows are left out, never drawn empty.
    """
    left = min(cap, -(-len(rows) // 2)) if len(rows) <= cap * 2 else cap
    return rows[:left], rows[left:]


def _two_up(sheet, cols, left, right, row_h, size=9, bold_cols=(0, 1)):
    """Two boxed tables side by side inside the current card."""
    x0, cw = sheet._inner()
    w = (cw - settings.TABLE_GUTTER) / 2
    y = sheet.y
    a = sheet.table(x0, w, cols, left, row_h, size=size, y=y, bold_cols=bold_cols)
    b = y
    if right:
        b = sheet.table(x0 + w + settings.TABLE_GUTTER, w, cols, right, row_h,
                        size=size, y=y, bold_cols=bold_cols)
    sheet.y = max(a, b)
    return sheet.y


def _n_up(sheet, cols, groups, row_h, size=9, bold_cols=(0,), wrap_cols=()):
    """`len(groups)` boxed tables side by side inside the current card."""
    x0, cw = sheet._inner()
    n = len(groups)
    w = (cw - settings.TABLE_GUTTER * (n - 1)) / n
    y = sheet.y
    low = y
    for i, rows in enumerate(groups):
        x = x0 + i * (w + settings.TABLE_GUTTER)
        low = max(low, sheet.table(x, w, cols, rows, row_h, size=size, y=y,
                                   bold_cols=bold_cols, wrap_cols=wrap_cols))
    sheet.y = low
    return sheet.y


def _start(code, name, title, instruction, info, big_first=False):
    """Header, then the first card: title bar, boxed info, status band."""
    s = Sheet()
    s.header(code, name, settings.LIST_STATUS)
    s.card_begin()
    s.title_bar(title, instruction)
    s.info_bar(info, big_first=big_first)
    s.status_line(settings.DRAFT_NOTICE)
    s.y -= 1.5
    s.card_end()
    return s


LEARNER_COLS = [("No.", 11.0, "center"), ("SURNAME", None, "left"),
                ("First name", None, "left")]


# ------------------------------------------------------------------- RL-01
def rl01():
    cls = data.REGISTER_CLASS
    learners = data.numbered(data.CLASS_10B)
    s = _start("RL-01", "REGISTER CLASS LIST", "REGISTER CLASS LIST",
               "Use these numbers on SA-01", [
                   [("Class", cls["class"]), ("Class teacher", cls["teacher"]),
                    ("Room", cls["room"]), ("Total learners", str(len(learners)))],
                   [("Academic year", YEAR), ("Term", TERM),
                    ("Phase", settings.phase_label(cls["grade"])), ("List version", VERSION)],
               ], big_first=True)

    s.card_begin()
    s.bar("LEARNERS", "Numbered 1 to 34, alphabetical by surname")
    left, right = _split(learners, 30)
    _two_up(s, LEARNER_COLS, left, right, PITCH)
    s.card_end()

    # Subjects: whole class and split side by side, the combined block full
    # width beneath them so that "Civil Technology (Woodworking)" prints whole.
    s.card_begin()
    s.bar("SUBJECTS FOR THIS CLASS")
    x0, cw = s._inner()
    left_w = 84.0
    right_x = x0 + left_w + settings.TABLE_GUTTER
    right_w = cw - left_w - settings.TABLE_GUTTER
    top = s.y
    a = s.table(x0, left_w, [("Taken by the whole class", None, "left"),
                             ("Code", 22.0, "center")],
                data.WHOLE_CLASS_10B, PITCH, y=top, bold_cols=(1,), chip_cols=())
    b = s.table(right_x, right_w, [("Split within this class", None, "left"),
                                   ("Code", 22.0, "center"), ("Learners", 18.0, "center"),
                                   ("List", 16.0, "center")],
                data.SPLIT_10B, PITCH, y=top, bold_cols=(1, 2), chip_cols=())
    s.y = max(a, b) + 1.5
    s.table(x0, cw, [("Combined with other classes", None, "left"),
                     ("With", 22.0, "center"), ("Code", 26.0, "center"),
                     ("Learners", 26.0, "center"), ("List", 16.0, "center")],
            data.COMBINED_10B, PITCH, bold_cols=(2, 3), chip_cols=())
    s.y += 1.0
    s.note_line(data.ELECTIVE_NOTE)
    s.card_end()

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
               "Use these numbers on SA-02", [
                   [("Subject", subject), ("Subject class code", code),
                    ("Grade", GRADE), ("Split from register class", cls["class"])],
                   [("Other group", other_label), ("Educator", educator),
                    ("Total learners", str(len(rows))), ("Term", TERM)],
               ])
    s.card_begin()
    s.bar("LEARNERS", f"Numbered 1 to {len(rows)}, alphabetical by surname, "
                      "for this group only")
    left, right = _split(rows, 25)
    _two_up(s, LEARNER_COLS, left, right, PITCH)
    s.card_end()
    s.footer("SL-01", "Split subject class list", footer_note)
    return s


# ------------------------------------------------------------------- CL-01
def cl01():
    ordered = sorted(data.CIVIL_TECH_COMBINED, key=lambda p: (p[0], p[1]))
    rows = [(i + 1, s_, f, c) for i, (s_, f, c) in enumerate(ordered)]
    s = _start("CL-01", "COMBINED SUBJECT CLASS LIST", "COMBINED SUBJECT CLASS LIST",
               "Use these numbers on SA-02", [
                   [("Subject", data.SUBJECT_BY_ABBR[data.COMBINED_ABBR]),
                    ("Subject class code", data.COMBINED_CODE),
                    ("Grade", GRADE), ("Combined from", ", ".join(data.CLASSES))],
                   [("Educator", data.EDUCATORS[data.COMBINED_CODE]),
                    ("Total learners", str(len(rows))), ("Term", TERM)],
               ])
    s.card_begin()
    s.bar("LEARNERS", f"Numbered 1 to {len(rows)} across all combined classes")
    cols = [("No.", 11.0, "center"), ("SURNAME", None, "left"),
            ("First name", None, "left"), ("Class", 14.0, "center")]
    left, right = _split(rows, 30)
    _two_up(s, cols, left, right, PITCH)
    s.card_end()
    s.footer("CL-01", "Combined subject class list",
             "Learners from different register classes are numbered together "
             "on this list.")
    return s


# ------------------------------------------------------------------- SC-01
SC01_PITCH = 5.4       # 25 subject classes on one page: a 4.2 mm box plus air


def sc01():
    s = _start("SC-01", "SUBJECT CODE KEY", "SUBJECT CODE KEY",
               "Write the subject class code on SA-02", [[
                   ("Grade", GRADE), ("Academic year", YEAR), ("Term", TERM),
                   ("Code format", settings.SUBJECT_CLASS_CODE_FORMAT + "  (provisional)"),
               ]])

    s.card_begin()
    s.bar("SUBJECT ABBREVIATIONS")
    cols = [("Abbr.", 17.0, "center"), ("Subject", None, "left")]
    abbr = data.SUBJECT_ABBREVIATIONS
    per = -(-len(abbr) // 3)
    _n_up(s, cols, [abbr[i:i + per] for i in range(0, len(abbr), per)], SC01_PITCH,
          bold_cols=(0,), wrap_cols=(1,))
    s.card_end()

    s.card_begin()
    s.bar("SUBJECT CLASSES", "Every subject class code for this grade")
    x0, cw = s._inner()
    s.table(x0, cw, [
        ("Code", 24.0, "center"), ("Subject", None, "left"),
        ("Register class", 28.0, "center"), ("Type", 24.0, "center"),
        ("Educator", 34.0, "left"), ("List", 16.0, "center"),
    ], data.subject_classes(), SC01_PITCH, bold_cols=(0,))
    s.card_end()

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
               "Copy the week's ATP code into Section C of SA-02", [[
                   ("Subject", subject), ("Grade", str(grade)), ("Academic year", YEAR),
                   ("Term", str(term)), ("Rows", str(len(weeks))), ("Source", source),
               ]])

    s.card_begin()
    s.bar("WEEKLY COVERAGE", "One ATP code per week")
    x0, cw = s._inner()
    week_w, code_w = 24.0, 26.0
    cols = [("Week", week_w, "center"), ("ATP code", code_w, "center"),
            ("What must be covered", None, "left")]
    widths = s.heading_band(x0, cw, cols)
    narrative_w = widths[2] - s.BOX_X
    # about 17 mm per row; an eleven-week term takes what the page allows
    footer_h = 6.4 + 3.8 + s.PAD + s.CARD_GAP
    avail = settings.PAGE_H - settings.MARGIN - footer_h - settings.BLOCK_GAP - s.y
    row_h = min(17.0, avail / len(weeks))
    box_h = row_h - s.BOX_GAP
    y = s.y
    for i, (week, narrative) in enumerate(weeks):
        if i % 2 == 1:
            s.rect(x0 - 0.6, y - s.BOX_GAP / 2, cw + 1.2, row_h, fill=TINT, radius=0.8)
        label = f"Weeks {week}".replace("-", "–") if "-" in str(week) else f"Week {week}"
        s.box(x0, y, week_w - s.BOX_X, box_h, label, 9, "b", "center", chip=True)
        # the ATP code, large, in its own box
        bx = x0 + week_w
        s.box(bx, y, code_w - s.BOX_X, box_h)
        s.text(data.atp_code(subject_abbr, grade, term, week), bx + (code_w - s.BOX_X) / 2,
               centre_baseline(y, box_h, 13), 13, "m", BRAND, "center")
        lines = s.wrap(narrative, narrative_w - settings.CELL_PAD * 2, 9)
        if len(lines) > 3:
            # never silently drop a line of the week's plan
            s.truncated.append(f"T{term} week {week}: {len(lines)} lines")
        s.box(x0 + week_w + code_w, y, narrative_w, box_h, lines=lines[:3])
        y += row_h
    s.y = y
    s.card_end()

    s.footer("AT-01", "ATP weekly plan",
             "ATP codes are provisional. Follow the official DBE ATP where "
             "this summary and the ATP differ.")
    return s
