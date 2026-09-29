"""SETTINGS and the shared PLACEHOLDER dataset for RL-01, SL-01, CL-01, SC-01 (and AT-01).

All names are fictional. Real learner data replaces them before printing and is
kept only in the school's copies. Every document reads from this file, so names,
numbers and codes agree between documents.
"""

# ------------------------------------------------------------------ SETTINGS
ACADEMIC_YEAR = 2027
TERM = 1
GRADE = 9
PHASE_LABEL = 'Senior Phase (Grades 7–9)'      # FET Phase (Grades 10–12) for Grades 10–12
LIST_VERSION = '1'
LIST_EFFECTIVE = 'date to be confirmed'
ATP_WEEK_CHAR_LIMIT = 230
ATP_ALPHABET = set('23456789ABCDEFGHJKLMNPQRSTUVWXYZ')   # no 0/1/I/O


def class_code(classes, subj):
    """Provisional subject class code: [Grade][Class]-[Subject]; combined lists all letters."""
    return f"{GRADE}{''.join(c[-1] for c in classes)}-{subj}"


# ------------------------------------------------------------------ subjects
SUBJECTS = {
    'MT': 'Mathematics', 'ML': 'Mathematical Literacy', 'EH': 'English Home Language',
    'AF': 'Afrikaans First Additional Language', 'NS': 'Natural Sciences', 'SS': 'Social Sciences',
    'EM': 'Economic and Management Sciences', 'TC': 'Technology', 'CA': 'Creative Arts',
    'LO': 'Life Orientation', 'WW': 'Woodworking',
}
SHORT = {'EH': 'English HL', 'AF': 'Afrikaans FAL', 'LO': 'Life Orientation', 'NS': 'Natural Sciences',
         'SS': 'Social Sciences', 'EM': 'EMS', 'CA': 'Creative Arts', 'MT': 'Mathematics',
         'ML': 'Mathematical Literacy', 'TC': 'Technology', 'WW': 'Woodworking'}
WHOLE_CLASS = ['EH', 'AF', 'LO', 'NS', 'SS', 'EM', 'CA']
SPLIT = ['MT', 'ML']
COMBINED = {'WW': ['9A', '9B', '9C']}
CLASSES = ['9A', '9B', '9C']

CLASS_TEACHER = {'9A': 'Ms N. Dyantyi', '9B': 'Mr L. Petersen', '9C': 'Mr R. Pedro'}
ROOM = {'9A': 'B10', '9B': 'B12', '9C': 'B14'}
EDUCATOR = {'EH': 'Ms R. Adonis', 'AF': 'Mr J. Botes', 'LO': 'Ms Z. Mfeketo', 'NS': 'Mr T. Mjoli',
            'SS': 'Ms R. Salie', 'EM': 'Mr K. Mathebula', 'CA': 'Ms L. Ntuli', 'MT': 'Mr S. Hoosain',
            'ML': 'Ms A. Marais', 'WW': 'Mr D. Olivier'}

# ------------------------------------------------------------------ learners
# 9B: the 34 placeholder learners from the school's Register Class mock-up.
CLASS_9B = [
    ('Adams', 'Leah'), ('Africa', 'Joshua'), ('Botha', 'Mia'), ('Daniels', 'Jason'),
    ('Davids', 'Aaliyah'), ('Fredericks', 'Liam'), ('George', 'Kayla'), ('Hamilton', 'Ethan'),
    ('Jacobs', 'Amy'), ('Khan', 'Zain'), ('Klaasen', 'Nicole'), ('Lawrence', 'Tyler'),
    ('Lewis', 'Jordan'), ('Louw', 'Emma'), ('Manuel', 'Nathan'), ('Martin', 'Zoe'),
    ('Meyer', 'Daniel'), ('Mitchell', 'Grace'), ('Morake', 'Kabelo'), ('Naidoo', 'Priya'),
    ('Ndlovu', 'Sibusiso'), ('Nkosi', 'Thando'), ('Peters', 'Ryan'), ('Phillips', 'Cayden'),
    ('Reddy', 'Kiara'), ('Rhodes', 'Alexandra'), ('Robinson', 'Caleb'), ('Smith', 'Hannah'),
    ('Solomon', 'Isaiah'), ('Swart', 'Danielle'), ('Thomas', 'Lucas'), ('Van der Merwe', 'Anke'),
    ('Williams', 'Lunathi'), ('Wilson', 'Tristen'),
]
# Only the 9A and 9C learners who take Woodworking are needed for these placeholders.
WW_9A = [
    ('Abrahams', 'Jada'), ('Allen', 'Reece'), ('Baker', 'Liyema'), ('Brown', 'Kayden'),
    ('Chetty', 'Riya'), ('Clarke', 'Damon'), ('Coetzee', 'Minke'), ('Damons', 'Lwandile'),
    ('Gomes', 'Isabella'), ('Govender', 'Yash'), ('Hendricks', 'Mikaeel'), ('Ismail', 'Aisha'),
    ('Johnson', 'Tyler'), ('Moodley', 'Tashreeq'), ('Patel', 'Nikhil'), ('Van Wyk', 'Simone'),
]
WW_9C = [
    ('Booysen', 'Keegan'), ('Cupido', 'Chanté'), ('Dlamini', 'Ayanda'), ('Februarie', 'Jodi'),
    ('Goliath', 'Marco'), ('Jantjies', 'Leandri'), ('Koopman', 'Ruben'), ('Maqubela', 'Sinethemba'),
    ('Mthembu', 'Lwazi'), ('Ngcobo', 'Asanda'), ('Oliphant', 'Jaydene'), ('Pietersen', 'Wian'),
    ('Qwabe', 'Owethu'), ('Samuels', 'Ashton'), ('Tshabalala', 'Karabo'), ('Xaba', 'Luyanda'),
]
ML_9B = {'Africa', 'Daniels', 'George', 'Hamilton', 'Klaasen', 'Lewis', 'Manuel', 'Morake', 'Nkosi',
         'Peters', 'Rhodes', 'Solomon', 'Swart', 'Williams', 'Wilson'}                 # 15; the other 19 take MT
WW_9B = {'Adams', 'Botha', 'Davids', 'Fredericks', 'Jacobs', 'Khan', 'Lawrence', 'Louw', 'Martin',
         'Meyer', 'Mitchell', 'Naidoo', 'Ndlovu', 'Phillips', 'Reddy', 'Robinson'}     # 16


def by_surname(rows):
    return sorted(rows, key=lambda r: (r[0].lower(), r[1].lower()))


REGISTER_9B = by_surname(CLASS_9B)
SPLIT_9B = {'MT': by_surname([r for r in CLASS_9B if r[0] not in ML_9B]),
            'ML': by_surname([r for r in CLASS_9B if r[0] in ML_9B])}
COMBINED_WW = by_surname([(s, f, '9A') for s, f in WW_9A] + [(s, f, '9B') for s, f in CLASS_9B if s in WW_9B]
                         + [(s, f, '9C') for s, f in WW_9C])


def subject_classes():
    """Every subject class in Grade 9: (code, subject, classes, type, educator, list)."""
    rows = []
    for cls in CLASSES:
        for s in WHOLE_CLASS:
            rows.append((class_code([cls], s), SHORT[s], cls, 'Whole class', EDUCATOR[s], 'RL-01'))
        for s in SPLIT:
            rows.append((class_code([cls], s), SHORT[s], cls, 'Split', EDUCATOR[s], 'SL-01'))
    for s, classes in COMBINED.items():
        rows.append((class_code(classes, s), SHORT[s], ', '.join(classes), 'Combined', EDUCATOR[s], 'CL-01'))
    return rows
