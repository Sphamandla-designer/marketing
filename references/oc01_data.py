"""
OC-01 Conduct Observation Code Reference, master version 0.2 (draft for
consultation). The codes and labels are Leon's, exactly as in v0.1; v0.2 adds a
one-line description of observable behaviour to every code, and PROPOSED flags
that await SMT approval:

  ▲  serious: the educator receives an incident report link after the form is
     scanned.
  ◆  safeguarding: follow the school's protected digital process immediately.
"""

MASTER_VERSION = "0.2"
STATUS = "DRAFT FOR CONSULTATION"
SERIOUS, SAFEGUARDING = "▲", "◆"     # ▲ ◆
LEGEND = ("▲ Incident report follows · ◆ Safeguarding: protected "
          "process · Flags proposed, awaiting SMT approval")

# (category title, tint, [(code, observation label, description, flag), ...])
PAGE_1 = [
    ("POSITIVE LEARNING CONDUCT", "green", [
        ("PA", "Positive attitude", "Approaches work and others willingly and constructively.", ""),
        ("EE", "Exceptional effort", "Effort clearly beyond what is usual for this learner.", ""),
        ("AP", "Active participation", "Contributes, asks or answers questions and takes part fully.", ""),
        ("IMP", "Marked improvement", "Clear improvement in work, conduct or participation.", ""),
        ("RP", "Respectful and prepared", "Arrives ready with materials and treats others with respect.", ""),
        ("HP", "Helpful to peers", "Supports classmates' learning without being asked.", ""),
    ]),
    ("LEARNING PARTICIPATION", "blue", [
        ("NW", "Not working in class", "Present but does not complete the set classwork.", ""),
        ("NH", "Homework not completed", "Homework not done or not handed in by the due date.", ""),
        ("NP", "Not participating", "Does not take part in the lesson or a required activity.", ""),
        ("DG", "Disengaged / staring into space", "Physically present but not attending to the lesson.", ""),
        ("SLP", "Sleeping in class", "Sleeps or rests head down during the lesson.", ""),
        ("UP", "Unprepared for lesson", "Arrives without required books, equipment or materials.", ""),
        ("CHW", "Copying homework", "Hands in another learner's homework as own work.", ""),
        ("UCT", "Unauthorised cellphone use", "Uses a cellphone in class without permission.", ""),
        ("EAT", "Eating in class", "Eats during the lesson without permission.", ""),
    ]),
    ("ATTENDANCE AND MOVEMENT", "orange", [
        ("LAT", "Late for class or activity", "Late for assembly or an activity. Lesson lateness: use the L column.", ""),
        ("LCP", "Leaves class without permission", "Leaves the classroom during the lesson without permission.", ""),
        ("BUN", "Bunking / missing a class", "At school but does not attend a scheduled lesson.", ""),
        ("TRU", "Truancy / unauthorised absence", "Absent from school without permission or a valid reason.", ""),
        ("USP", "Leaves school premises without permission", "Leaves the school grounds during school hours without permission.", ""),
    ]),
    ("CLASSROOM ORDER AND RESPECT", "orange", [
        ("XT", "Excessive talking", "Persistent talking that interferes with teaching or learning.", ""),
        ("DIS", "Disruptive behaviour", "Disrupts the lesson so that teaching or learning is interrupted.", ""),
        ("RIN", "Refuses reasonable instruction", "Refuses or ignores a reasonable instruction from the educator.", ""),
        ("RUD", "Disrespectful conduct", "Rude or disrespectful words or gestures towards staff or learners.", ""),
        ("PRF", "Swearing or profanity", "Uses swear words or offensive language.", ""),
        ("DCR", "Repeated or severe classroom disruption", "Disruption that continues after a warning or stops the lesson.", ""),
    ]),
]
PAGE_2 = [
    ("PEER RELATIONS", "pink", [
        ("TEA", "Teasing or needling", "Repeatedly teases or provokes another learner.", ""),
        ("BUL", "Bullying allegation", "Repeated intimidation or harm of a learner, observed or reported.", SERIOUS),
        ("THR", "Threatening behaviour", "Threatens harm to another person in words or actions.", SERIOUS),
        ("FGT", "Fighting", "Takes part in a physical fight.", SERIOUS),
        ("AIN", "Assault or intentional injury allegation", "Intentionally hurts or injures another person, observed or reported.", SERIOUS),
        ("DISCR", "Discriminatory conduct", "Treats or insults someone unfairly because of who they are.", SERIOUS),
        ("HATE", "Hate speech allegation", "Speech or writing promoting group hatred, observed or reported.", SERIOUS),
        ("SH", "Sexual harassment allegation", "Unwanted sexual comments or contact, observed or reported.", SERIOUS),
    ]),
    ("PROPERTY AND ENVIRONMENT", "blue", [
        ("LIT", "Littering", "Drops or leaves litter on school premises.", ""),
        ("MIS", "Misuse of school equipment", "Uses school equipment carelessly or for the wrong purpose.", ""),
        ("VAN", "Vandalism or property damage", "Deliberately damages or defaces school or others' property.", SERIOUS),
        ("THF", "Theft allegation", "Takes property that is not theirs, observed or reported.", SERIOUS),
        ("ARS", "Arson or attempted arson allegation", "Sets or tries to set a fire, observed or reported.", SERIOUS),
    ]),
    ("INTEGRITY AND ASSESSMENT", "purple", [
        ("DISH", "Minor dishonesty", "Tells a minor lie or misleads the educator.", ""),
        ("TCH", "Cheating in class test", "Copies or uses unauthorised help in a class test.", ""),
        ("EXC", "Formal assessment irregularity allegation", "Suspected irregularity in a formal SBA task or examination.", SERIOUS),
        ("FAL", "Falsification or false identity allegation", "Forges a signature or document, or poses as someone else.", SERIOUS),
    ]),
    ("SUBSTANCES, PROHIBITED ITEMS AND SAFETY", "pink", [
        ("SMK", "Smoking, vaping or tobacco", "Smokes, vapes or has tobacco products at school.", ""),
        ("ALC", "Alcohol possession, use or impairment", "Has or uses alcohol, or appears affected by it, at school.", SERIOUS),
        ("DRG", "Illegal drug possession, use or dealing allegation", "Has, uses or supplies illegal drugs, observed or reported.", SERIOUS),
        ("WPN", "Dangerous object or weapon allegation", "Has a weapon or dangerous object at school, observed or reported.", SERIOUS),
        ("POR", "Pornographic material", "Has or shares pornographic material, on paper or a device.", SERIOUS),
        ("GNG", "Gang-related activity", "Gang signs, clothing, recruitment or activity at school.", SERIOUS),
        ("BMB", "Bomb threat or similar threat", "Makes or passes on a bomb or similar threat to the school.", SERIOUS),
    ]),
    ("LEARNER SUPPORT AND SAFEGUARDING", "green", [
        ("WEL", "General welfare concern", "Something about the learner's wellbeing worries the educator.", SAFEGUARDING),
        ("DST", "Visible distress or emotional change", "Noticeably upset, withdrawn or changed in mood or behaviour.", SAFEGUARDING),
        ("HNG", "Possible hunger or unmet basic need", "Appears hungry, or lacks basic needs such as uniform or hygiene.", SAFEGUARDING),
        ("VIC", "Possible victimisation or safety concern", "Learner may be harmed, bullied or unsafe in or outside school.", SAFEGUARDING),
    ]),
]
PAGES = [PAGE_1, PAGE_2]

# Leon's v0.1 code list, in v0.1 order. v0.2 must carry exactly these.
V01_CODES = [
    "PA", "EE", "AP", "IMP", "RP", "HP",
    "NW", "NH", "NP", "DG", "SLP", "UP", "CHW", "UCT", "EAT",
    "LAT", "LCP", "BUN", "TRU", "USP",
    "XT", "DIS", "RIN", "RUD", "PRF", "DCR",
    "TEA", "BUL", "THR", "FGT", "AIN", "DISCR", "HATE", "SH",
    "LIT", "MIS", "VAN", "THF", "ARS",
    "DISH", "TCH", "EXC", "FAL",
    "SMK", "ALC", "DRG", "WPN", "POR", "GNG", "BMB",
    "WEL", "DST", "HNG", "VIC",
]
# The flags proposed for SMT approval, by code.
PROPOSED_SERIOUS = {"BUL", "THR", "FGT", "AIN", "DISCR", "HATE", "SH", "VAN", "THF",
                    "ARS", "EXC", "FAL", "ALC", "DRG", "WPN", "POR", "GNG", "BMB"}
PROPOSED_SAFEGUARDING = {"WEL", "DST", "HNG", "VIC"}

FOOTER_NOTE = ("Use only the approved code. Record observable conduct; do not write "
               "labels or diagnoses.")
FOOTER_SUBNOTE = "Allegation codes record an observation only and are not a finding of guilt."
FOOTER_ALERT = ("Serious or safeguarding matters: follow the school's protected digital "
                "process immediately.")


def rows():
    for page in PAGES:
        for _, _, items in page:
            for item in items:
                yield item
