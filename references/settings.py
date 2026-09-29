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


# [Grade][Class]-[Subject abbreviation], e.g. 10B-MT. A combined class lists
# every letter, e.g. 10ABC-CW. PROVISIONAL.
SUBJECT_CLASS_CODE_FORMAT = "[Grade][Class]-[Subject abbreviation], e.g. 10B-MT"

# ATP codes: 4 characters from a handwriting-safe set only — digits 3 4 6 7 9
# and letters A C D E F H J K L M N P Q R T W X Y. No I, O, 0, 1, Z, 2, S, 5,
# U, V, B, 8 or G, so no character can be misread as another when copied by
# hand. Unique across every subject, grade, term and week. PROVISIONAL.
ATP_ALPHABET = "34679ACDEFHJKLMNPQRTWXY"
ATP_CODE_LENGTH = 4
ATP_WEEK_CHAR_LIMIT = 230

# Status and version. Every reference document is a draft for consultation,
# matching OC-01. The list effective date is set on approval.
LIST_VERSION = "0.1"
LIST_STATUS = "DRAFT FOR CONSULTATION"
LIST_VERSION_LABEL = "0.1 (draft)"
DRAFT_NOTICE = "Draft for consultation — placeholder data, not for use in class."

# Words that must appear nowhere in any built document. "Woodworking" is
# allowed only inside the subject name "Civil Technology (Woodworking)".
FORBIDDEN_WORDS = ["Mnr.", "Grade 9", "9A", "9B", "9C", "Woodworking", "SA-OC", "ISSUED"]
FORBIDDEN_ALLOWED_PHRASES = ["Civil Technology (Woodworking)"]

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
