"""
Section 0 settings for the Fisantekraal High School reference documents.

Everything the school changes between years or terms lives here and nowhere
else. Values marked PROVISIONAL are not final school policy yet.
"""

ACADEMIC_YEAR = 2027
TERM = 1

# Senior Phase covers Grades 7-9; Grades 10-12 are FET Phase.
PHASES = {
    7: "Senior Phase (Grades 7–9)",
    8: "Senior Phase (Grades 7–9)",
    9: "Senior Phase (Grades 7–9)",
    10: "FET Phase (Grades 10–12)",
    11: "FET Phase (Grades 10–12)",
    12: "FET Phase (Grades 10–12)",
}


def phase_label(grade):
    return PHASES[int(grade)]


# [Grade][Class]-[Subject abbreviation], e.g. 9B-MT. A combined class lists
# every letter, e.g. 9ABC-WW. PROVISIONAL.
SUBJECT_CLASS_CODE_FORMAT = "[Grade][Class]-[Subject abbreviation], e.g. 9B-MT"

# ATP codes: 4 characters, digits 2-9 and letters A-Z without I and O, so no
# character can be misread as another. Exactly 32 symbols. PROVISIONAL.
ATP_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
ATP_CODE_LENGTH = 4
ATP_WEEK_CHAR_LIMIT = 230

LIST_VERSION = 1
LIST_VERSION_EFFECTIVE = "[date to be confirmed]"
LIST_STATUS = "ISSUED"

SCHOOL_NAME = "FISANTEKRAAL HIGH SCHOOL"
SCHOOL_MOTTO = "LEARN · GROW · CONTRIBUTE"
SCHOOL_TAGLINE = "Quality Education for a Brighter Tomorrow"
CONTROLLER = "Controlled by Competence Studio School Intelligence Platform"

# Page and spacing rules, in millimetres.
PAGE_W, PAGE_H = 210.0, 297.0
MARGIN = 10.0
HEADER_H = 28.0
BLOCK_GAP = 3.5          # 3-4 mm between blocks
PANEL_PAD = 3.0
CELL_PAD = 2.0
TABLE_GUTTER = 6.0
MIN_TABLE_PT = 9.0
MIN_NOTE_PT = 8.0
