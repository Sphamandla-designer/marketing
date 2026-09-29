"""
Placeholder data for the reference documents.

Every learner name here is fictional. Real learner data replaces this before
printing and is kept only in the school's own copies. Lists are held in the
order the school captures them; `by_surname` does the alphabetical numbering,
which is the rule for every list: 1..n by surname, valid only for that list.
"""
import hashlib

import settings

# ---------------------------------------------------------------- learners
# 9B register class, 34 learners. FICTIONAL.
CLASS_9B = [
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

# The 9A and 9C learners who take the combined Woodworking class. FICTIONAL.
WOODWORK_9A = [
    ("BASSON", "Ruhan"), ("CUPIDO", "Leigh-Ann"), ("GOVENDER", "Priya"),
    ("HANSE", "Nathan"), ("JACOBS", "Wesley"), ("KLAASEN", "Storm"),
    ("MAKHANYA", "Anele"), ("MOSES", "Caitlin"), ("NAIDOO", "Kiara"),
    ("NTULI", "Siyabonga"), ("PAULSE", "Chad"), ("RHODE", "Jamie"),
    ("SEPTEMBER", "Ilse"), ("SITHOLE", "Mandla"), ("SWARTS", "Rene"),
    ("XABA", "Asanda"),
]
WOODWORK_9C = [
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
# Which of the 34 take the combined Woodworking class.
WOODWORK_9B_SURNAMES = {
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


MATHS_9B = [p for p in CLASS_9B if p[0] in MATHS_SURNAMES]
MATHS_LIT_9B = [p for p in CLASS_9B if p[0] not in MATHS_SURNAMES]
WOODWORK_9B = [p for p in CLASS_9B if p[0] in WOODWORK_9B_SURNAMES]
# The combined list carries the register class alongside each learner.
WOODWORK_COMBINED = (
    [(s, f, "9A") for s, f in WOODWORK_9A]
    + [(s, f, "9B") for s, f in WOODWORK_9B]
    + [(s, f, "9C") for s, f in WOODWORK_9C]
)

# ---------------------------------------------------------------- subjects
SUBJECT_ABBREVIATIONS = [
    ("MT", "Mathematics"),
    ("ML", "Mathematical Literacy"),
    ("EH", "English Home Language"),
    ("AF", "Afrikaans First Additional Language"),
    ("NS", "Natural Sciences"),
    ("SS", "Social Sciences"),
    ("EM", "Economic and Management Sciences"),
    ("TC", "Technology"),
    ("CA", "Creative Arts"),
    ("LO", "Life Orientation"),
    ("WW", "Woodworking"),
]

# 9B's own subjects, as they print on RL-01.
WHOLE_CLASS_9B = [
    ("English Home Language", "9B-EH"),
    ("Afrikaans First Additional Language", "9B-AF"),
    ("Life Orientation", "9B-LO"),
    ("Natural Sciences", "9B-NS"),
    ("Social Sciences", "9B-SS"),
    ("Economic and Management Sciences", "9B-EM"),
    ("Creative Arts", "9B-CA"),
]
SPLIT_9B = [
    ("Mathematics", "9B-MT", "SL-01"),
    ("Mathematical Literacy", "9B-ML", "SL-01"),
]
COMBINED_9B = [
    ("Woodworking", "9A, 9C", "9ABC-WW", "CL-01"),
]

REGISTER_CLASS = {
    "class": "9B",
    "teacher": "Mr L. Petersen",
    "room": "B12",
    "grade": 9,
}

EDUCATORS = {
    "9B-EH": "Ms N. Adonis", "9B-AF": "Mnr. H. de Villiers",
    "9B-LO": "Mr L. Petersen", "9B-NS": "Ms T. Mokoena",
    "9B-SS": "Mr G. Arendse", "9B-EM": "Ms F. Kholwane",
    "9B-CA": "Ms R. Daniels", "9B-MT": "Mrs S. Naicker",
    "9B-ML": "Mr D. Jantjies", "9ABC-WW": "Mr P. Kotze",
    "9A-EH": "Ms N. Adonis", "9A-AF": "Mnr. H. de Villiers",
    "9A-LO": "Ms B. Sithole", "9A-NS": "Ms T. Mokoena",
    "9A-SS": "Mr G. Arendse", "9A-MT": "Mrs S. Naicker",
    "9A-ML": "Mr D. Jantjies",
    "9C-EH": "Ms L. Booysen", "9C-AF": "Mnr. H. de Villiers",
    "9C-LO": "Mr K. Ngwenya", "9C-NS": "Ms T. Mokoena",
    "9C-SS": "Mr G. Arendse", "9C-MT": "Mrs S. Naicker",
    "9C-ML": "Mr D. Jantjies",
}

SUBJECT_BY_ABBR = dict(SUBJECT_ABBREVIATIONS)

# SC-01 holds one grade on one page. 9B prints in full, because RL-01, SL-01
# and CL-01 are all 9B documents; the 9A and 9C rows are placeholder padding and
# are trimmed to whatever the page holds at the 6 mm row pitch.
_9B_CODES = ["9B-EH", "9B-AF", "9B-LO", "9B-NS", "9B-SS", "9B-EM", "9B-CA",
             "9B-MT", "9B-ML"]
_PEER_CODES = ["EH", "AF", "NS", "SS", "MT", "ML"]


def subject_classes():
    """Every subject class on SC-01, in code order, one row each."""
    rows = []
    for code in _9B_CODES:
        rows.append(_row(code, "9B"))
    for cls in ("9A", "9C"):
        for abbr in _PEER_CODES:
            rows.append(_row(f"{cls}-{abbr}", cls))
    rows.append(("9ABC-WW", "Woodworking", "9A, 9B, 9C", "Combined",
                 EDUCATORS["9ABC-WW"], "CL-01"))
    return sorted(rows, key=lambda r: r[0])


def _row(code, cls):
    abbr = code.split("-")[1]
    subject = SUBJECT_BY_ABBR[abbr]
    split = abbr in ("MT", "ML")
    return (code, subject, cls, "Split" if split else "Whole class",
            EDUCATORS.get(code, "—"), "SL-01" if split else "RL-01")


# ------------------------------------------------------------------- ATP
def atp_code(subject_abbr, grade, term, week):
    """
    A 4-character ATP code, unique per subject + grade + term + week and stable
    across runs. Derived, not random, so reprinting a page gives the same codes.
    PROVISIONAL until the school fixes the scheme.
    """
    key = f"{subject_abbr}|{grade}|{term}|{week}".encode()
    digest = hashlib.sha256(key).digest()
    n = int.from_bytes(digest[:8], "big")
    out = ""
    base = len(settings.ATP_ALPHABET)
    for _ in range(settings.ATP_CODE_LENGTH):
        out += settings.ATP_ALPHABET[n % base]
        n //= base
    return out
