"""Shared PLACEHOLDER dataset for the SA-03A/B/C, SA-04 and SA-05 master documents.

Every name below is fictional. Replace this file's data with real school data
before printing; all five documents read from here, so they stay consistent.
"""

YEAR = 2026
TERM = 2
GRADE = 8

# ---------------------------------------------------------------- learners
# (surname, first name). Fictional names reflecting a Western Cape community.
LEARNERS_8A = [
    ("Abrahams", "Chelsea"), ("Adonis", "Keenan"), ("Arendse", "Mikayla"),
    ("Bokwe", "Anathi"), ("Booysen", "Ruan"), ("Carelse", "Shanice"),
    ("Cupido", "Jaden"), ("Daniels", "Aaliyah"), ("Dumezweni", "Lwazi"),
    ("Engelbrecht", "Tiaan"), ("Februarie", "Jolene"), ("Gqola", "Siphosethu"),
    ("Goliath", "Nathan"), ("Hartzenberg", "Liezel"), ("Hlazo", "Yonela"),
    ("Isaacs", "Zaid"), ("Jiba", "Luthando"), ("Julies", "Monique"),
    ("Kleinbooi", "Dylan"), ("Kobese", "Likhona"), ("Koopman", "Bianca"),
    ("Lakay", "Reagan"), ("Mabandla", "Asemahle"), ("Makhaphela", "Onke"),
    ("Matiwane", "Sinovuyo"), ("Mdunyelwa", "Khanyisa"), ("Meyer", "Carmen"),
    ("Mfengu", "Thando"), ("Ngxola", "Esona"), ("Nkwinti", "Aphiwe"),
    ("Nqaba", "Mihlali"), ("Oliphant", "Wade"), ("Petersen", "Kayla"),
    ("Plaatjies", "Elrico"), ("Qumza", "Olwethu"), ("Sauls", "Nicole"),
    ("September", "Caleb"), ("Snyders", "Faith"), ("Sokhela", "Lithemba"),
    ("Somdaka", "Buhle"), ("Titus", "Gabriel"), ("Tyali", "Hlumelo"),
    ("Van der Merwe", "Riaan"), ("Van Wyk", "Jadine"), ("Williams", "Tyrone"),
    ("Zenani", "Kamva"),
]

LEARNERS_8B = [
    ("Adams", "Leah"), ("Bangani", "Lindokuhle"), ("Beukes", "Ethan"),
    ("Cloete", "Marchelle"), ("Davids", "Tasneem"), ("Dyasi", "Zintle"),
    ("Fortuin", "Kurt"), ("Gxabela", "Masixole"), ("Hendricks", "Shannon"),
    ("Jacobs", "Liam"), ("Jansen", "Yasmin"), ("Klaasen", "Deon"),
    ("Lottering", "Imran"), ("Maarman", "Jodi"), ("Mafuya", "Ayabonga"),
    ("Makeleni", "Unathi"), ("Mbenenge", "Qhawe"), ("Mgijima", "Vuyo"),
    ("Mgoqi", "Nosipho"), ("Mtshemla", "Simamkele"), ("Ndzimande", "Enzokuhle"),
    ("Ngqeleni", "Chuma"), ("Nkatha", "Siyamthanda"), ("Ntshona", "Ovayo"),
    ("Pieterse", "Waldo"), ("Rhoode", "Megan"), ("Samuels", "Ashwin"),
    ("Sityana", "Inam"), ("Solomons", "Nadia"), ("Stuurman", "Brandon"),
    ("Swartz", "Chanel"), ("Tshangana", "Athenkosi"), ("Visagie", "Jonathan"),
    ("Vollenhoven", "Kelly"), ("Wessels", "Morné"), ("Witbooi", "Janine"),
    ("Xaba", "Lulama"), ("Yako", "Iviwe"), ("Zwane", "Sibusiso"),
    ("Damons", "Robyn"), ("Europa", "Clint"), ("Kannemeyer", "Zoe"),
    ("Mentor", "Jason"), ("Ruiters", "Ashleigh"),
]

# ------------------------------------------------------------ educators
REGISTER_EDUCATOR = {"8A": "Ms N. Dyantyi", "8B": "Mr R. Pedro"}
COMPILED_BY = "Ms P. Loubser (Grade 8 head)"

# Subject abbreviations (provisional)
SUBJECTS = {
    "MT": "Mathematics",
    "ML": "Mathematical Literacy",
    "EH": "English Home Language",
    "AF": "Afrikaans First Additional Language",
    "NS": "Natural Sciences",
    "SS": "Social Sciences",
    "EM": "Economic and Management Sciences",
    "TC": "Technology",
    "CA": "Creative Arts",
    "LO": "Life Orientation",
}
# Short names, used only where a full name cannot fit (SA-03A Section B)
SHORT = {
    "MT": "Mathematics", "ML": "Maths Literacy", "EH": "English HL",
    "AF": "Afrikaans FAL", "NS": "Natural Sciences", "SS": "Social Sciences",
    "EM": "EMS", "TC": "Technology", "CA": "Creative Arts", "LO": "Life Orientation",
}
WHOLE_CLASS = ["EH", "AF", "LO", "NS", "SS", "TC", "CA"]
SPLIT = ["MT", "ML"]
COMBINED = ["EM"]

SUBJECT_EDUCATOR = {
    "EH": "Ms C. Kock", "AF": "Mr J. Botha", "LO": "Ms Z. Gxowa",
    "NS": "Mr T. Mjoli", "SS": "Ms R. Fredericks", "TC": "Mr D. Olivier",
    "CA": "Ms L. Ntuli", "MT": "Mr S. Hoosain", "ML": "Ms A. Marais",
    "EM": "Mr K. Mathebula",
}
# The same educator teaches a subject to both register classes in this placeholder.


def code(cls, subj):
    """Provisional subject class code: [Grade][Class][Subject]; combined uses X."""
    return f"{GRADE}{cls[-1]}{subj}"          # "8A" or "X" -> class letter


def by_surname(rows):
    return sorted(rows, key=lambda r: (r[0].lower(), r[1].lower()))


REGISTER = {"8A": by_surname(LEARNERS_8A), "8B": by_surname(LEARNERS_8B)}

# ------------------------------------------------ split groups (Maths / Maths Lit)
# Placeholder membership: 8A Mathematics 24 (Maths Literacy 22), 8B Mathematics 23 (21).
_MT_8A = {"Abrahams", "Arendse", "Bokwe", "Carelse", "Daniels", "Dumezweni",
          "Februarie", "Gqola", "Hartzenberg", "Isaacs", "Julies", "Kobese",
          "Lakay", "Mabandla", "Matiwane", "Meyer", "Ngxola", "Nqaba",
          "Petersen", "Qumza", "September", "Sokhela", "Van der Merwe", "Zenani"}
_MT_8B = {"Adams", "Beukes", "Davids", "Fortuin", "Hendricks", "Jansen",
          "Lottering", "Mafuya", "Mbenenge", "Mgoqi", "Ndzimande", "Nkatha",
          "Pieterse", "Samuels", "Solomons", "Swartz", "Visagie", "Wessels",
          "Xaba", "Zwane", "Kannemeyer", "Ruiters", "Damons"}

SPLIT_GROUPS = {
    ("8A", "MT"): by_surname([r for r in REGISTER["8A"] if r[0] in _MT_8A]),
    ("8A", "ML"): by_surname([r for r in REGISTER["8A"] if r[0] not in _MT_8A]),
    ("8B", "MT"): by_surname([r for r in REGISTER["8B"] if r[0] in _MT_8B]),
    ("8B", "ML"): by_surname([r for r in REGISTER["8B"] if r[0] not in _MT_8B]),
}

# ------------------------------------------------ combined EMS (8A + 8B), 58 learners
_EMS_OUT = {"Cupido", "Goliath", "Kleinbooi", "Oliphant", "Tyali", "Williams",
            "Hlazo", "Jiba", "Snyders", "Titus", "Van Wyk", "Koopman",  # 8A: 12 out -> 34
            "Cloete", "Europa", "Gxabela", "Klaasen", "Maarman", "Mentor",
            "Rhoode", "Sityana", "Stuurman", "Tshangana", "Vollenhoven",
            "Witbooi", "Yako", "Xaba", "Zwane", "Wessels", "Mtshemla",
            "Ngqeleni", "Beukes", "Jacobs"}                                # 8B: 20 out -> 24
COMBINED_EMS = sorted(
    [(s, f, "8A") for s, f in REGISTER["8A"] if s not in _EMS_OUT]
    + [(s, f, "8B") for s, f in REGISTER["8B"] if s not in _EMS_OUT],
    key=lambda r: (r[0].lower(), r[1].lower()))


def subject_classes():
    """All subject classes for the grade: (code, subject, classes, type, educator, list)."""
    rows = []
    for cls in ("8A", "8B"):
        for s in WHOLE_CLASS:
            rows.append((code(cls, s), SUBJECTS[s], cls, "Whole class", SUBJECT_EDUCATOR[s], "SA-03A"))
        for s in SPLIT:
            rows.append((code(cls, s), SUBJECTS[s], cls, "Split", SUBJECT_EDUCATOR[s], "SA-03B"))
    for s in COMBINED:
        rows.append((code("X", s), SUBJECTS[s], "8A and 8B", "Combined", SUBJECT_EDUCATOR[s], "SA-03C"))
    return rows


# ------------------------------------------------ ATP (Grade 8 Mathematics, Term 2)
# Provisional ATP code: [subject abbreviation][term digit][week letter]
# Week letters skip I and O: A=1 B=2 C=3 D=4 E=5 F=6 G=7 H=8 J=9 K=10 L=11 M=12
ATP_ALPHABET = set("23456789ABCDEFGHJKLMNPQRSTUVWXYZ")
WEEK_LETTERS = "ABCDEFGHJKLM"


def atp_code(subj, term, week):
    c = f"{subj}{term}{WEEK_LETTERS[week - 1]}"
    assert len(c) == 4 and set(c) <= ATP_ALPHABET, c
    return c


ATP_WEEKS = [
    "Algebraic expressions: like and unlike terms; add and subtract terms; multiply a monomial by a binomial or trinomial.",
    "Algebraic expressions: divide polynomials by a monomial; squares, cubes, square roots and cube roots of terms.",
    "Algebraic equations: solve equations by inspection, trial and improvement, and additive and multiplicative inverses.",
    "Algebraic equations: equations with brackets and exponents; set up and solve equations from word problems.",
    "Construction of geometric figures: bisect lines and angles; construct perpendicular lines and 30°, 45°, 60° angles.",
    "Construction of geometric figures: construct triangles and quadrilaterals; investigate their properties.",
    "Geometry of 2D shapes: classify triangles and quadrilaterals by sides and angles; congruent triangles.",
    "Geometry of 2D shapes: similar triangles; solve problems using the properties of triangles and quadrilaterals.",
    "Geometry of straight lines: angle pairs; angles formed by parallel lines cut by a transversal.",
    "Revision and assessment: consolidate Term 2 topics; write the formal Term 2 controlled test.",
]
