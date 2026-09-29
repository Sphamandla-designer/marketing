"""
Placeholder data for the reference documents: Grade 10, FET Phase, register
classes 10A, 10B and 10C.

Every learner and staff name here is fictional. Real data replaces this before
printing and is kept only in the school's own copies. Lists are held in the
order the school captures them; `by_surname` does the alphabetical numbering,
which is the rule for every list: 1..n by surname, valid only for that list.
"""
import hashlib

import settings

GRADE = 10
CLASSES = ["10A", "10B", "10C"]

# ---------------------------------------------------------------- learners
# 10B register class, 34 learners. FICTIONAL.
CLASS_10B = [
    ("ABRAHAMS", "Chloe"), ("ADAMS", "Liam"), ("BOOYSEN", "Michaela"),
    ("CLOETE", "Jaden"), ("DAMONS", "Kayla"), ("DAVIDS", "Ethan"),
    ("DLAMINI", "Sindiswa"), ("ERASMUS", "Nicole"), ("FEBRUARIE", "Shaun"),
    ("FORTUIN", "Ashwin"), ("GQOLA", "Lithemba"), ("HENDRICKS", "Rushdi"),
    ("ISAACS", "Tasneem"), ("JANTJIES", "Deon"), ("JONAS", "Zintle"),
    ("KHUMALO", "Sipho"), ("KOOPMAN", "Chanel"), ("LOUW", "Elzaan"),
    ("MABASO", "Nomvula"), ("MADIKIZELA", "Ayanda"), ("MAY", "Brandon"),
    ("MBEKI", "Thando"), ("NDLOVU", "Bongani"), ("NGCOBO", "Zanele"),
    ("OCTOBER", "Denzil"), ("PETERSEN", "Aaliyah"), ("PIETERSE", "Ruan"),
    ("PLAATJIES", "Megan"), ("QWABE", "Luyanda"), ("SAMUELS", "Jodie"),
    ("SOLOMONS", "Keegan"), ("TSHABALALA", "Lerato"), ("VAN WYK", "Danielle"),
    ("WILLEMSE", "Tristan"),
]

# The 10A and 10C learners who take the combined Civil Technology
# (Woodworking) class. FICTIONAL.
CIVIL_TECH_10A = [
    ("BASSON", "Ruhan"), ("CUPIDO", "Leigh-Ann"), ("GOVENDER", "Priya"),
    ("HANSE", "Nathan"), ("JACOBS", "Wesley"), ("KLAASEN", "Storm"),
    ("MAKHANYA", "Anele"), ("MOSES", "Caitlin"), ("NAIDOO", "Kiara"),
    ("NTULI", "Siyabonga"), ("PAULSE", "Chad"), ("RHODE", "Jamie"),
    ("SEPTEMBER", "Ilse"), ("SITHOLE", "Mandla"), ("SWARTS", "Rene"),
    ("XABA", "Asanda"),
]
CIVIL_TECH_10C = [
    ("ADONIS", "Gino"), ("BEUKES", "Anika"), ("CARELSE", "Devon"),
    ("DIKO", "Athi"), ("ESAU", "Rowan"), ("GAMIET", "Yusuf"),
    ("HERMANUS", "Shantel"), ("JOSEPH", "Aidan"), ("LEEUW", "Kirsten"),
    ("MANGENA", "Owami"), ("NOVEMBER", "Tyrone"), ("PRINS", "Charne"),
    ("SKOSANA", "Kgomotso"), ("TITUS", "Bianca"), ("VISAGIE", "Marco"),
    ("ZWANE", "Nokuthula"),
]

# Which of the 34 take Mathematics; the rest take Mathematical Literacy. The
# two groups are disjoint and together they are the whole class.
MATHS_SURNAMES = {
    "ABRAHAMS", "ADAMS", "CLOETE", "DAVIDS", "DLAMINI", "FEBRUARIE", "GQOLA",
    "HENDRICKS", "JANTJIES", "KHUMALO", "LOUW", "MADIKIZELA", "MBEKI",
    "NGCOBO", "PETERSEN", "PLAATJIES", "SAMUELS", "TSHABALALA", "WILLEMSE",
}
# Which of the 34 take the combined Civil Technology (Woodworking) class. The
# rest of 10B take Tourism within the register class: the elective slot.
CIVIL_TECH_10B_SURNAMES = {
    "ABRAHAMS", "BOOYSEN", "DAMONS", "DLAMINI", "FORTUIN", "ISAACS", "JONAS",
    "KOOPMAN", "MABASO", "MAY", "NDLOVU", "OCTOBER", "PIETERSE", "SAMUELS",
    "TSHABALALA", "VAN WYK",
}


def by_surname(learners):
    """Alphabetical by surname, then first name. This is the numbering order."""
    return sorted(learners, key=lambda p: (p[0], p[1]))


def numbered(learners):
    """1..n in alphabetical order. The number is valid only for this list."""
    return [(i + 1, s, f) for i, (s, f) in enumerate(by_surname(learners))]


MATHS_10B = [p for p in CLASS_10B if p[0] in MATHS_SURNAMES]
MATHS_LIT_10B = [p for p in CLASS_10B if p[0] not in MATHS_SURNAMES]
CIVIL_TECH_10B = [p for p in CLASS_10B if p[0] in CIVIL_TECH_10B_SURNAMES]
TOURISM_10B = [p for p in CLASS_10B if p[0] not in CIVIL_TECH_10B_SURNAMES]
# The combined list carries the register class alongside each learner.
CIVIL_TECH_COMBINED = (
    [(s, f, "10A") for s, f in CIVIL_TECH_10A]
    + [(s, f, "10B") for s, f in CIVIL_TECH_10B]
    + [(s, f, "10C") for s, f in CIVIL_TECH_10C]
)

# ---------------------------------------------------------------- subjects
# CAPS FET: every learner takes seven subjects. Five whole-class, one of
# Mathematics / Mathematical Literacy, and one elective: Civil Technology
# (Woodworking) combined across the grade, or Tourism within the class.
SUBJECT_ABBREVIATIONS = [
    ("EH", "English Home Language"),
    ("AF", "Afrikaans First Additional Language"),
    ("LO", "Life Orientation"),
    ("HI", "History"),
    ("LS", "Life Sciences"),
    ("MT", "Mathematics"),
    ("ML", "Mathematical Literacy"),
    ("TO", "Tourism"),
    ("CW", "Civil Technology (Woodworking)"),
]
SUBJECT_BY_ABBR = dict(SUBJECT_ABBREVIATIONS)

WHOLE_CLASS_ABBRS = ["EH", "AF", "LO", "HI", "LS"]
SPLIT_ABBRS = ["MT", "ML", "TO"]        # split within the register class
COMBINED_ABBR = "CW"                     # combined across the grade
COMBINED_CODE = "10ABC-CW"

# Staff placeholders. FICTIONAL. "Mr", "Mrs" or "Ms" only. No staff surname
# may match any learner surname; check.py fails the build if one does.
STAFF = {
    "EH": "Ms N. Mthembu",
    "AF": "Mr H. de Villiers",
    "LO": "Mr L. Hartzenberg",
    "HI": "Mr G. Arendse",
    "LS": "Ms T. Mokoena",
    "MT": "Mrs S. Naicker",
    "ML": "Mr D. Fredericks",
    "TO": "Ms R. Kannemeyer",
    "CW": "Mr P. Kotze",
}

REGISTER_CLASS = {
    "class": "10B",
    "teacher": STAFF["LO"],      # Mr L. Hartzenberg, also 10B's LO educator
    "room": "B12",
    "grade": GRADE,
}


def staff_surname(name):
    """'Mr H. de Villiers' -> 'DE VILLIERS'; 'Mrs S. Naicker' -> 'NAICKER'."""
    parts = name.split()
    return " ".join(parts[2:]).upper() if len(parts) > 2 else parts[-1].upper()


def all_codes():
    """Every subject class code in the data, in the order SC-01 prints them."""
    codes = []
    for cls in CLASSES:
        for abbr in WHOLE_CLASS_ABBRS + SPLIT_ABBRS:
            codes.append(f"{cls}-{abbr}")
    codes.append(COMBINED_CODE)
    return codes


# The same staff teach every class unless the data needs otherwise.
EDUCATORS = {code: STAFF[code.split("-")[1]] for code in all_codes()}

# 10B's own subjects, as they print on RL-01.
WHOLE_CLASS_10B = [(SUBJECT_BY_ABBR[a], f"10B-{a}") for a in WHOLE_CLASS_ABBRS]
SPLIT_10B = [
    ("Mathematics", "10B-MT", str(len(MATHS_10B)), "SL-01"),
    ("Mathematical Literacy", "10B-ML", str(len(MATHS_LIT_10B)), "SL-01"),
    ("Tourism", "10B-TO", str(len(TOURISM_10B)), "SL-01"),
]
COMBINED_10B = [
    ("Civil Technology (Woodworking)", "10A, 10C", COMBINED_CODE,
     f"{len(CIVIL_TECH_10B)} from 10B", "CL-01"),
]
ELECTIVE_NOTE = ("Elective slot: learners take either Civil Technology "
                 "(Woodworking) or Tourism.")


def subject_classes():
    """Every subject class on SC-01, one row each: 8 per class plus the
    combined class, 25 rows for three classes."""
    rows = []
    for code in all_codes():
        abbr = code.split("-")[1]
        if abbr == COMBINED_ABBR:
            rows.append((code, SUBJECT_BY_ABBR[abbr], ", ".join(CLASSES),
                         "Combined", EDUCATORS[code], "CL-01"))
        elif abbr in SPLIT_ABBRS:
            rows.append((code, SUBJECT_BY_ABBR[abbr], code.split("-")[0],
                         "Split", EDUCATORS[code], "SL-01"))
        else:
            rows.append((code, SUBJECT_BY_ABBR[abbr], code.split("-")[0],
                         "Whole class", EDUCATORS[code], "RL-01"))
    return rows


def printed_codes():
    """Every code printed on RL-01, SL-01 and CL-01."""
    return ({c for _, c in WHOLE_CLASS_10B}
            | {c for _, c, _, _ in SPLIT_10B}
            | {c for _, _, c, _, _ in COMBINED_10B})


# ------------------------------------------------------------------- ATP
def atp_code(subject_abbr, grade, term, week):
    """
    A 4-character ATP code from the handwriting-safe alphabet, unique per
    subject + grade + term + week and stable across runs. Derived, not random,
    so reprinting a page gives the same codes. A code that would contain a
    forbidden string (such as "9A") is re-derived. PROVISIONAL until the
    school fixes the scheme.
    """
    base = len(settings.ATP_ALPHABET)
    for salt in range(1000):
        key = f"{subject_abbr}|{grade}|{term}|{week}|{salt}".encode()
        n = int.from_bytes(hashlib.sha256(key).digest()[:8], "big")
        out = ""
        for _ in range(settings.ATP_CODE_LENGTH):
            out += settings.ATP_ALPHABET[n % base]
            n //= base
        if not any(w in out for w in settings.FORBIDDEN_WORDS):
            return out
    raise RuntimeError("no ATP code found")
