#!/usr/bin/env python3
"""Builds the Fisantekraal High School pre-printed reference documents
(RL-01, SL-01, CL-01, SC-01, AT-01) as one-page A4 PDFs, matching OC-01."""
import base64, glob, hashlib, json, os, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE
PREV = HERE / "previews"

# ---------------------------------------------------------------- 0. SETTINGS
ACADEMIC_YEAR = 2027
TERM = 1
PHASE_LABEL = "Senior Phase (Grades 7–9)"
ATP_WEEK_CHAR_LIMIT = 230
LIST_VERSION = "1"
LIST_EFFECTIVE = "[date to be confirmed]"
CODE_FORMAT = "[Grade][Class]-[Subject], e.g. 9B-MT; combined classes list all letters, e.g. 9ABC-WW (PROVISIONAL)"
ATP_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"   # digits 2–9, A–Z without I and O (32 symbols)

def atp_code(subject, grade, term, week):
    """Provisional 4-character ATP code, unique per subject + grade + term + week."""
    h = hashlib.sha256(f"{subject}|{grade}|{term}|{week}".encode()).digest()
    return "".join(ATP_ALPHABET[b % 32] for b in h[:4])

# ---------------------------------------------------------------- DATA (fictional placeholders)
CLASS_9B = [  # (surname, first name) — alphabetical by surname
    ("Abrahams","Tamia"),("Adams","Keanu"),("Booysen","Chanté"),("Cupido","Ashwin"),
    ("Davids","Mikayla"),("Dlamini","Anathi"),("Fortuin","Jaden"),("Gqirana","Sinazo"),
    ("Hendricks","Dylan"),("Jacobs","Aaliyah"),("Jantjies","Tyrone"),("Kleinbooi","Chad"),
    ("Louw","Nathan"),("Mahlangu","Lerato"),("Maqubela","Luthando"),("Mbeki","Zanele"),
    ("Mentoor","Caleb"),("Mnyaka","Esihle"),("Ndlovu","Bongani"),("Nkosi","Thabo"),
    ("Nomvete","Siphokazi"),("Oktober","Liam"),("Pietersen","Shannon"),("Plaatjies","Kyle"),
    ("Qwabe","Unathi"),("September","Jordan"),("Sibeko","Lithemba"),("Sithole","Nomvula"),
    ("Swartz","Amber"),("Titus","Ethan"),("Tshabalala","Andile"),("Van der Merwe","Danielle"),
    ("Williams","Jesse"),("Zulu","Sibusiso"),
]
MT_SURNAMES = {"Abrahams","Booysen","Davids","Dlamini","Gqirana","Jacobs","Kleinbooi","Mahlangu",
               "Mbeki","Mnyaka","Ndlovu","Nomvete","Pietersen","Qwabe","Sibeko","Swartz",
               "Tshabalala","Van der Merwe","Zulu"}
WW_9B_SURNAMES = {"Adams","Cupido","Fortuin","Hendricks","Jantjies","Kleinbooi","Louw","Mentoor",
                  "Ndlovu","Oktober","Plaatjies","September","Titus","Tshabalala","Zulu"}
WW_9A = [("Arendse","Ruben"),("Barends","Tariq"),("Cloete","Mia"),("De Bruyn","Jason"),
         ("Engelbrecht","Leah"),("Goliath","Wesley"),("Isaacs","Robyn"),("Joseph","Cody"),
         ("Khumalo","Sandile"),("Makeleni","Aphiwe"),("Moses","Brandon"),("Ngxitho","Yamkela"),
         ("Paulse","Jenna"),("Samuels","Kaylin"),("Solomons","Devon"),("Thys","Nicole"),
         ("Zwane","Thandeka")]
WW_9C = [("Arries","Kayden"),("Benjamin","Tegan"),("Daniels","Ryan"),("Felix","Leandra"),
         ("George","Ashley"),("Hendricks","Micah"),("Kammies","Jerome"),("Madikane","Olwethu"),
         ("Maphumulo","Sanele"),("Meyer","Charné"),("Ngcobo","Lindiwe"),("Prins","Tristan"),
         ("Rhodes","Jayden"),("Smith","Zoë"),("Visagie","Bianca"),("Witbooi","Marco")]

CLASS_TEACHER_9B = "Mr L. Petersen"; ROOM_9B = "B12"
EDUCATORS = {  # subject abbreviation -> {class: educator}
    "EH": {"9A":"Ms A. Jacobs","9B":"Ms A. Jacobs","9C":"Ms N. Cloete"},
    "AF": {"9A":"Mr P. van Wyk","9B":"Mr P. van Wyk","9C":"Mr P. van Wyk"},
    "LO": {"9A":"Ms T. Ndlovu","9B":"Ms T. Ndlovu","9C":"Ms T. Ndlovu"},
    "NS": {"9A":"Mr S. Adams","9B":"Mr S. Adams","9C":"Ms B. Solomons"},
    "SS": {"9A":"Ms R. Fortuin","9B":"Ms R. Fortuin","9C":"Ms R. Fortuin"},
    "EM": {"9A":"Mr K. Booysen","9B":"Mr K. Booysen","9C":"Mr K. Booysen"},
    "CA": {"9A":"Ms L. Daniels","9B":"Ms L. Daniels","9C":"Ms L. Daniels"},
}
EDU_MT = "Mr L. Petersen"; EDU_ML = "Ms Z. Mnyaka"; EDU_WW = "Mr J. Hendricks"

ABBREVIATIONS = [("MT","Mathematics"),("ML","Mathematical Literacy"),("EH","English Home Language"),
    ("AF","Afrikaans First Additional Language"),("NS","Natural Sciences"),("SS","Social Sciences"),
    ("EM","Economic and Management Sciences"),("TC","Technology"),("CA","Creative Arts"),
    ("LO","Life Orientation"),("WW","Woodworking")]
WHOLE_CLASS = [("English HL","EH"),("Afrikaans FAL","AF"),("Life Orientation","LO"),
               ("Natural Sciences","NS"),("Social Sciences","SS"),("EMS","EM"),("Creative Arts","CA")]

# ---------------------------------------------------------------- AT-01 narratives (Step A)
ATP_SUBJECT = "English First Additional Language"; ATP_SUBJECT_KEY = "EFAL"; ATP_GRADE = 8
ATP_SOURCE = "DBE Annual Teaching Plan 2023/24"
NARRATIVES = {
 1: "Baseline assessment and orientation on days 1 to 3. Read a brochure aloud and discuss its format, purpose, audience and visual elements. Practise skimming and scanning. Language: nouns, adjectives, verbs, adverbs, simple tenses.",
 2: "Study poetry: figures of speech, imagery, rhyme, rhythm, lines, stanzas, mood, theme and message. Plan, draft, edit and present a brochure from visual stimuli. Language: proverbs, denotative and connotative meaning, punctuation.",
 3: "Listen to a video on writing an email; note tone, register and audience. Read an email by skimming and scanning. Plan and draft an email. Language: adverbs, articles, gerunds. Begin Task 1 Oral: reading aloud (20 marks).",
 4: "Read folklore: character, plot, conflict, setting, narrator and theme. Revise, edit, proofread and present the email. Language: sentence structure, adjectival and adverbial clauses, synonyms, antonyms. Reading aloud continues.",
 5: "Group discussion and brainstorming on the youth novel; listening comprehension for summary writing. Explore parts of a book. Plan and draft a narrative or reflective essay. Language: pronouns, subject-verb agreement.",
 6: "Continue the youth novel and teach the principles of summary writing. Revise, edit, proofread and present the essay for Task 2 Writing: narrative or reflective essay (30 marks). Language: main and dependent clauses, punctuation.",
 7: "Prepare an oral on a newspaper article, report or editorial: research, organise and support with examples. Read such texts for features, format and language. Plan an article. Language: regular, irregular and auxiliary verbs.",
 8: "Listening comprehension: main ideas and persuasive techniques. Read for inference, manipulative language. Draft, edit and present the article. Task 3 Response to Texts (60 marks): text 20, visual 10, summary 10, language 20.",
 9: "Listen to a prepared speech by a former president or influential person; discuss its features and language. Read a speech for emotive language and structure. Plan own speech. Language: compound nouns, finite verbs, prepositions.",
 10: "Discuss the folktale: retell, defend a position, negotiate, take turns. Study plot, climax, resolution, foreshadowing, flashback, mood, irony and suspense. Draft, edit and present own speech. Language: homophones, abbreviations.",
}
HEAVILY_SHORTENED = {1, 3, 8, 9, 10}   # weeks where ATP content had to be cut hard to fit 230 chars

# ---------------------------------------------------------------- HTML scaffolding
CREST_B64 = base64.b64encode((HERE / "crest.png").read_bytes()).decode()

CSS = """
@page { size: A4 portrait; margin: 10mm; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 190mm; background: #fff; }
body { font-family: "DejaVu Sans", Inter, sans-serif; color: #1A1A1A; font-size: 9pt; line-height: 1.25; }
.page { width: 190mm; height: 277mm; display: flex; flex-direction: column; overflow: hidden; }
.header { height: 28mm; display: flex; align-items: center; flex: none; }
.crest { height: 22mm; width: auto; margin-left: 1mm; }
.hcenter { flex: 1; text-align: center; padding-right: 2mm; }
.school { color: #C8102E; font-weight: bold; font-size: 19pt; letter-spacing: 0.4pt; line-height: 1.1; }
.tag { font-size: 8pt; letter-spacing: 3.2pt; color: #333; margin-top: 1.2mm; }
.motto { font-size: 9.5pt; margin-top: 1.6mm; }
.cbox { border: 0.45mm solid #1A1A1A; width: 47mm; text-align: center; padding: 1.5mm 2mm; flex: none; }
.cbox .lbl { font-size: 8pt; font-weight: bold; }
.cbox .code { font-size: 19pt; font-weight: bold; color: #C8102E; line-height: 1.15; margin: 0.4mm 0; }
.cbox .name { font-size: 8pt; font-weight: bold; line-height: 1.2; }
.cbox .ver { font-size: 8pt; font-weight: bold; color: #444; margin-top: 0.8mm; }
.gap { height: 3mm; flex: none; } .gap4 { height: 4mm; flex: none; }
.titlebar { background: #C8102E; color: #fff; height: 8mm; display: flex; align-items: center;
            justify-content: space-between; padding: 0 3mm; flex: none; }
.titlebar .t { font-weight: bold; font-size: 13.5pt; letter-spacing: 0.3pt; white-space: nowrap; }
.titlebar .i { font-size: 9pt; text-align: right; max-width: 62mm; line-height: 1.15; }
.titlebar.long .t { font-size: 12.5pt; }
.infobar { background: #FBE3E6; border-radius: 1.5mm; padding: 1.4mm 3mm; flex: none; }
.inforow { display: flex; align-items: baseline; justify-content: space-between; gap: 4mm; }
.inforow > div { flex: 0 1 auto; font-size: 9pt; white-space: nowrap; }
.inforow > div.wrapv { white-space: normal; flex: 1 1 auto; line-height: 1.2; }
.inforow + .inforow { margin-top: 0.9mm; }
.inforow.auto { justify-content: space-between; gap: 4mm; }
.inforow.auto > div { flex: 0 0 auto; }
.inforow b { font-weight: bold; } .inforow .v { font-weight: bold; }
.inforow .big { font-size: 13pt; color: #C8102E; line-height: 1; }
table { border-collapse: collapse; width: 100%; table-layout: fixed; }
th { background: #C8102E; color: #fff; font-weight: bold; text-align: left; font-size: 9pt;
     padding: 0 2mm; height: 5mm; }
td { padding: 0 2mm; font-size: 9pt; border-bottom: 0.2mm solid #E4E4E4; vertical-align: middle;
     white-space: nowrap; overflow: hidden; }
tbody tr:nth-child(even) td { background: #FCF2F3; }
.r52 td { height: 5.2mm; } .r62 td { height: 6.2mm; } .r60 td { height: 6mm; } .r50 td { height: 5mm; }
.sub th { height: 4.5mm; padding: 0 1.5mm; } .sub td { height: 4mm; padding: 0 1.5mm; }
.sub.wrap td { white-space: normal; line-height: 1.15; padding-top: 0.4mm; padding-bottom: 0.4mm; }
.wrapth th { white-space: normal; height: auto; min-height: 5.2mm; line-height: 1.15; padding-top: 0.6mm; padding-bottom: 0.6mm; vertical-align: middle; }
.num, th.num { text-align: center; padding: 0; }
td.num { font-weight: bold; }
.sur { font-weight: bold; text-transform: uppercase; }
.code, td.code { font-weight: bold; color: #C8102E; }
.twocol { display: flex; gap: 6mm; align-items: flex-start; flex: none; }
.twocol > * { flex: 1; min-width: 0; }
.section-title { background: #C8102E; color: #fff; font-weight: bold; font-size: 9.5pt;
                 padding: 0 3mm; height: 5.5mm; line-height: 5.5mm; flex: none; }
.panel { border: 0.25mm solid #E3BFC4; border-radius: 1.5mm; padding: 3mm; flex: none; }
.subhead { font-weight: bold; font-size: 9pt; color: #C8102E; margin-bottom: 0.8mm; }
.footer { margin-top: auto; border-top: 0.2mm solid #999; padding-top: 1mm; flex: none; }
.fnote { font-size: 8pt; font-weight: bold; line-height: 1.2; }
.fline { display: flex; justify-content: space-between; font-size: 8pt; color: #555; margin-top: 0.8mm; }
.fline .l { font-weight: bold; color: #1A1A1A; }
/* AT-01 */
.atp td { white-space: normal; height: 17mm; }
.atp .wk { font-weight: bold; font-size: 9pt; white-space: nowrap; padding: 0 1mm; }
.atp .codecell { text-align: center; padding: 0 1mm; }
.atp .codebox { display: inline-block; border: 0.35mm solid #C8102E; border-radius: 1mm; padding: 1.2mm 1.5mm;
                font-family: "DejaVu Sans Mono", monospace; font-size: 13pt; font-weight: bold; color: #C8102E;
                letter-spacing: 0.5pt; line-height: 1; background: #fff; }
.atp .nar { font-size: 9pt; line-height: 4.0mm; }
"""

def header(code, name, status="ISSUED"):
    return f"""
<div class="header">
  <img class="crest" src="data:image/png;base64,{CREST_B64}" alt="Strive to Excel">
  <div class="hcenter">
    <div class="school">FISANTEKRAAL HIGH SCHOOL</div>
    <div class="tag">L E A R N &nbsp;·&nbsp; G R O W &nbsp;·&nbsp; C O N T R I B U T E</div>
    <div class="motto">Quality Education for a Brighter Tomorrow</div>
  </div>
  <div class="cbox">
    <div class="lbl">CONTROLLED REFERENCE</div>
    <div class="code">{code}</div>
    <div class="name">{name}</div>
    <div class="ver">VERSION {LIST_VERSION} · {status}</div>
  </div>
</div>"""

def titlebar(title, instruction):
    return f'<div class="titlebar"><div class="t">{title}</div><div class="i">{instruction}</div></div>'

def infobar(rows):
    """rows: list of lists of (label, value_html, extra_class)"""
    out = ['<div class="infobar">']
    for row in rows:
        rowcls = "inforow"
        if row and isinstance(row[0], str):
            rowcls += " " + row[0]; row = row[1:]
        out.append(f'<div class="{rowcls}">')
        for item in row:
            label, value = item[0], item[1]
            cls = item[2] if len(item) > 2 else ""
            out.append(f'<div class="{cls}"><b>{label}:</b> <span class="v">{value}</span></div>')
        out.append('</div>')
    out.append('</div>')
    return "".join(out)

def footer(code, title, note):
    return f"""
<div class="footer">
  <div class="fnote">{note}</div>
  <div class="fline"><div class="l">{code} &nbsp;|&nbsp; {title}</div><div>Fisantekraal High School</div>
       <div>Controlled by Competence Studio School Intelligence Platform</div></div>
</div>"""

def learner_table(rows, start, pitch_cls, num_w="10mm", with_class=False, class_w="12mm"):
    """rows: list of (surname, first, [class]) already numbered from `start`."""
    cols = f'<col style="width:{num_w}"><col><col>' + (f'<col style="width:{class_w}">' if with_class else "")
    head = '<th class="num">No.</th><th>SURNAME</th><th>First name</th>' + ('<th>Class</th>' if with_class else "")
    body = []
    for i, r in enumerate(rows):
        n = start + i
        cells = f'<td class="num">{n}</td><td class="sur">{r[0]}</td><td>{r[1]}</td>'
        if with_class:
            cells += f'<td class="code">{r[2]}</td>'
        body.append(f"<tr>{cells}</tr>")
    return f'<table class="{pitch_cls}"><colgroup>{cols}</colgroup><thead><tr>{head}</tr></thead><tbody>{"".join(body)}</tbody></table>'

def two_tables(learners, per_side, pitch_cls, **kw):
    left = learners[:per_side]; right = learners[per_side:per_side * 2]
    l = learner_table(left, 1, pitch_cls, **kw)
    r = learner_table(right, per_side + 1, pitch_cls, **kw) if right else "<div></div>"
    return f'<div class="twocol">{l}{r}</div>'

def page(body_html, title):
    return f'<!DOCTYPE html><html><head><meta charset="utf-8"><title>{title}</title><style>{CSS}</style></head><body><div class="page">{body_html}</div></body></html>'

def sort_learners(ls):
    return sorted(ls, key=lambda r: (r[0].lower(), r[1].lower()))

# ---------------------------------------------------------------- RL-01
def build_rl01():
    learners = sort_learners(CLASS_9B)
    info = infobar([
        [("Class", '<span class="big">9B</span>'), ("Class teacher", CLASS_TEACHER_9B), ("Room", ROOM_9B), ("Total learners", str(len(learners))), ("Academic year", str(ACADEMIC_YEAR))],
        [("Term", str(TERM)), ("Phase", PHASE_LABEL), ("List version", f"{LIST_VERSION} · effective {LIST_EFFECTIVE}")],
    ])
    whole = "".join(f'<tr><td>{s}</td><td class="code">9B-{c}</td></tr>' for s, c in WHOLE_CLASS)
    split = ('<tr><td>Mathematics</td><td class="code">9B-MT</td><td class="code">SL-01</td></tr>'
             '<tr><td>Mathematical Literacy</td><td class="code">9B-ML</td><td class="code">SL-01</td></tr>')
    combined = '<tr><td>Woodworking</td><td>9A, 9C</td><td class="code">9ABC-WW</td><td class="code">CL-01</td></tr>'
    subjects = f"""
<div class="section-title">SUBJECTS FOR THIS CLASS</div>
<div class="gap" style="height:1.2mm"></div>
<div class="twocol" style="gap:3mm">
  <div style="flex:1"><div class="subhead">Taken by the whole class</div>
    <table class="sub"><colgroup><col><col style="width:16mm"></colgroup><thead><tr><th>Subject</th><th>Code</th></tr></thead><tbody>{whole}</tbody></table></div>
  <div style="flex:none;width:58mm"><div class="subhead">Split subjects</div>
    <table class="sub wrap"><colgroup><col><col style="width:15mm"><col style="width:15mm"></colgroup><thead><tr><th>Subject</th><th>Code</th><th>List</th></tr></thead><tbody>{split}</tbody></table></div>
  <div style="flex:none;width:74mm"><div class="subhead">Combined with other classes</div>
    <table class="sub wrap"><colgroup><col><col style="width:14mm"><col style="width:21mm"><col style="width:15mm"></colgroup><thead><tr><th>Subject</th><th>With</th><th>Code</th><th>List</th></tr></thead><tbody>{combined}</tbody></table></div>
</div>"""
    body = (header("RL-01", "REGISTER CLASS LIST") + titlebar("REGISTER CLASS LIST", "Use these numbers on SA-01")
            + '<div class="gap"></div>' + info + '<div class="gap"></div>'
            + two_tables(learners, 30, "r52") + '<div class="gap"></div>' + subjects
            + footer("RL-01", "Register Class List",
                     "Official list for the year. Use the learner numbers on SA-01. Notify the office of changes; a new version is issued when learners join or leave."))
    return page(body, "RL-01 Register Class List 9B"), learners

# ---------------------------------------------------------------- SL-01
def build_sl01(subject, code, other_subject, other_code, educator, learners):
    learners = sort_learners(learners)
    info = infobar([
        [("Subject", subject), ("Subject class code", f'<span class="big">{code}</span>'), ("Grade", "9"), ("Split from register class", "9B")],
        [("Other group", f"{other_subject} — <span class='code'>{other_code}</span>", "w2"), ("Educator", educator), ("Total learners", str(len(learners))), ("Term", str(TERM))],
    ])
    body = (header("SL-01", "SPLIT SUBJECT CLASS LIST") + titlebar("SPLIT SUBJECT CLASS LIST", "Use these numbers on SA-02")
            + '<div class="gap"></div>' + info + '<div class="gap"></div>'
            + two_tables(learners, 25, "r62")
            + footer("SL-01", "Split Subject Class List",
                     f"This class splits for {subject}. Learners not on this list are on the {other_subject} ({other_code}) list."))
    return page(body, f"SL-01 Split Subject Class List {code}"), learners

# ---------------------------------------------------------------- CL-01
def build_cl01():
    ww9b = [(s, f, "9B") for s, f in CLASS_9B if s in WW_9B_SURNAMES]
    assert len(ww9b) == len(WW_9B_SURNAMES)
    learners = sort_learners([(s, f, "9A") for s, f in WW_9A] + ww9b + [(s, f, "9C") for s, f in WW_9C])
    info = infobar([
        [("Subject", "Woodworking"), ("Subject class code", '<span class="big">9ABC-WW</span>'), ("Grade", "9"), ("Combined from", "9A, 9B, 9C")],
        [("Educator", EDU_WW), ("Total learners", str(len(learners))), ("Term", str(TERM)), ("Academic year", str(ACADEMIC_YEAR))],
    ])
    body = (header("CL-01", "COMBINED SUBJECT CLASS LIST") + titlebar("COMBINED SUBJECT CLASS LIST", "Use these numbers on SA-02")
            + '<div class="gap"></div>' + info + '<div class="gap"></div>'
            + two_tables(learners, 30, "r52", num_w="9mm", with_class=True)
            + footer("CL-01", "Combined Subject Class List",
                     "Learners from different register classes are numbered together on this list."))
    return page(body, "CL-01 Combined Subject Class List 9ABC-WW"), learners

# ---------------------------------------------------------------- SC-01
def subject_class_rows():
    rows = []
    for cls in ("9A", "9B", "9C"):
        for subj, ab in WHOLE_CLASS:
            full = dict(ABBREVIATIONS)[ab]
            rows.append((f"{cls}-{ab}", full, cls, "Whole class", EDUCATORS[ab][cls], "RL-01"))
        if cls == "9B":
            rows.append(("9B-MT", "Mathematics", "9B", "Split", EDU_MT, "SL-01"))
            rows.append(("9B-ML", "Mathematical Literacy", "9B", "Split", EDU_ML, "SL-01"))
    rows.append(("9ABC-WW", "Woodworking", "9A, 9B, 9C", "Combined", EDU_WW, "CL-01"))
    return rows

def build_sc01():
    rows = subject_class_rows()
    assert len(rows) <= 24, len(rows)
    half = (len(ABBREVIATIONS) + 1) // 2
    def abbr_table(items):
        b = "".join(f'<tr><td class="code">{a}</td><td>{s}</td></tr>' for a, s in items)
        return f'<table class="r50 sub"><colgroup><col style="width:27mm"><col></colgroup><thead><tr><th>Abbreviation</th><th>Subject</th></tr></thead><tbody>{b}</tbody></table>'
    abbr = f'<div class="twocol">{abbr_table(ABBREVIATIONS[:half])}{abbr_table(ABBREVIATIONS[half:])}</div>'
    body_rows = "".join(f'<tr><td class="code">{c}</td><td>{s}</td><td>{r}</td><td>{t}</td><td>{e}</td><td class="code">{l}</td></tr>'
                        for c, s, r, t, e, l in rows)
    sc = f"""<table class="r60 wrapth"><colgroup><col style="width:22mm"><col><col style="width:24mm"><col style="width:24mm"><col style="width:32mm"><col style="width:22mm"></colgroup>
<thead><tr><th>Code</th><th>Subject</th><th>Register class(es)</th><th>Type</th><th>Educator</th><th>Learner list</th></tr></thead><tbody>{body_rows}</tbody></table>"""
    info = infobar([[("Grade", '<span class="big">9</span>'), ("Academic year", str(ACADEMIC_YEAR)), ("Term", str(TERM)), ("Classes", "9A, 9B, 9C")],
                    [("Code format (provisional)", "[Grade][Class]-[Subject abbreviation], e.g. 9B-MT · combined classes list all letters, e.g. 9ABC-WW", "wrapv")]])
    body = (header("SC-01", "SUBJECT CODE KEY") + titlebar("SUBJECT CODE KEY", "Write the subject class code on SA-02")
            + '<div class="gap"></div>' + info + '<div class="gap"></div>'
            + '<div class="section-title">SUBJECT ABBREVIATIONS</div>' + abbr + '<div class="gap"></div>'
            + '<div class="section-title">SUBJECT CLASSES</div>' + sc
            + footer("SC-01", "Subject Code Key",
                     "Codes are provisional until the final scheme is approved. Every subject class code written on SA-02 must appear on this key."))
    return page(body, "SC-01 Subject Code Key Grade 9"), rows

# ---------------------------------------------------------------- AT-01
def build_at01():
    weeks = sorted(NARRATIVES)
    codes = {w: atp_code(ATP_SUBJECT_KEY, ATP_GRADE, TERM, w) for w in weeks}
    assert len(set(codes.values())) == len(weeks), "ATP codes must be unique"
    for w in weeks:
        assert len(NARRATIVES[w]) <= ATP_WEEK_CHAR_LIMIT, (w, len(NARRATIVES[w]))
        assert all(ch in ATP_ALPHABET for ch in codes[w]) and len(codes[w]) == 4
    rows = "".join(f'<tr><td class="wk">Week {w}</td><td class="codecell"><span class="codebox">{codes[w]}</span></td><td class="nar">{NARRATIVES[w]}</td></tr>' for w in weeks)
    table = f"""<table class="atp"><colgroup><col style="width:18mm"><col style="width:24mm"><col></colgroup>
<thead><tr><th>Week</th><th class="num">ATP code</th><th>What must be covered</th></tr></thead><tbody>{rows}</tbody></table>"""
    info = infobar([[("Subject", ATP_SUBJECT, "w2"), ("Grade", str(ATP_GRADE)), ("Academic year", str(ACADEMIC_YEAR)), ("Term", str(TERM))],
                    [("Number of weeks", str(len(weeks))), ("Source", ATP_SOURCE)]])
    body = (header("AT-01", "ATP WEEKLY PLAN") + titlebar("ANNUAL TEACHING PLAN — WEEKLY COVERAGE", "Copy the week's ATP code into Section C of SA-02").replace('class="titlebar"', 'class="titlebar long"')
            + '<div class="gap"></div>' + info + '<div class="gap"></div>' + table
            + footer("AT-01", "ATP Weekly Plan",
                     "ATP codes are provisional. Follow the official DBE ATP where this summary and the ATP differ."))
    return page(body, f"AT-01 ATP Weekly Plan {ATP_SUBJECT_KEY} Grade {ATP_GRADE} Term {TERM}"), codes

# ---------------------------------------------------------------- render + checks
CHECK_JS = """
() => {
  const mm = 96/25.4, page = document.querySelector('.page');
  const pr = page.getBoundingClientRect();
  const problems = [];
  if (page.scrollHeight > page.clientHeight + 1) problems.push('page content overflows by ' + ((page.scrollHeight-page.clientHeight)/mm).toFixed(1) + 'mm');
  const footer = document.querySelector('.footer').getBoundingClientRect();
  if (footer.bottom > pr.bottom + 0.5) problems.push('footer below page');
  for (const el of page.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (r.bottom > pr.bottom + 0.5 || r.right > pr.right + 0.5) { problems.push('element outside page: ' + el.tagName + '.' + el.className + ' "' + (el.textContent||'').slice(0,30) + '"'); break; }
  }
  for (const td of page.querySelectorAll('td, th, .inforow > div')) {
    if (td.scrollWidth > td.clientWidth + 1) problems.push('cell text clipped: "' + td.textContent.trim().slice(0,40) + '"');
    if (td.scrollHeight > td.clientHeight + 1) problems.push('cell text overflows vertically: "' + td.textContent.trim().slice(0,40) + '"');
  }
  let minTable = 99, minAll = 99;
  for (const el of page.querySelectorAll('*')) {
    if (!el.textContent.trim() || el.children.length) continue;
    const pt = parseFloat(getComputedStyle(el).fontSize) * 72/96;
    minAll = Math.min(minAll, pt);
    if (el.closest('table')) minTable = Math.min(minTable, pt);
  }
  let atpLines = null;
  const nars = [...page.querySelectorAll('.atp .nar')];
  if (nars.length) atpLines = Math.max(...nars.map(n => { const r=document.createRange(); r.selectNodeContents(n); return r.getBoundingClientRect().height/(4*mm); }));
  const last = [...page.querySelectorAll('.page > *')].filter(e=>!e.classList.contains('footer')).pop().getBoundingClientRect();
  return {problems, minTablePt: +minTable.toFixed(2), minAllPt: +minAll.toFixed(2), atpMaxLines: atpLines && +atpLines.toFixed(2),
          contentBottomMm: +((last.bottom - pr.top)/mm).toFixed(1), footerTopMm: +((footer.top - pr.top)/mm).toFixed(1)};
}
"""

def render_all(docs):
    from playwright.sync_api import sync_playwright
    import pypdf
    exe = glob.glob('/opt/pw-browsers/chromium-*/chrome-linux/chrome')[0]
    report = {}
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=exe)
        for fname, html in docs:
            pg = b.new_page(viewport={"width": 794, "height": 1123})
            (HERE / "html").mkdir(exist_ok=True)
            (HERE / "html" / f"{fname}.html").write_text(html, encoding="utf-8")
            pg.set_content(html, wait_until="load")
            pg.emulate_media(media="print")
            res = pg.evaluate(CHECK_JS)
            pdf_path = OUT / f"{fname}.pdf"
            pg.pdf(path=str(pdf_path), format="A4", prefer_css_page_size=True, print_background=True)
            pg.screenshot(path=str(PREV / f"{fname}.png"), full_page=True)
            res["pages"] = len(pypdf.PdfReader(str(pdf_path)).pages)
            report[fname] = res
            pg.close()
        b.close()
    return report

def main():
    docs = []
    rl_html, rl_learners = build_rl01(); docs.append(("RL-01_Register_Class_List_9B", rl_html))
    mt = [l for l in CLASS_9B if l[0] in MT_SURNAMES]; ml = [l for l in CLASS_9B if l[0] not in MT_SURNAMES]
    sl_mt, mt_l = build_sl01("Mathematics", "9B-MT", "Mathematical Literacy", "9B-ML", EDU_MT, mt)
    sl_ml, ml_l = build_sl01("Mathematical Literacy", "9B-ML", "Mathematics", "9B-MT", EDU_ML, ml)
    docs += [("SL-01_Split_Subject_Class_List_9B-MT", sl_mt), ("SL-01_Split_Subject_Class_List_9B-ML", sl_ml)]
    cl_html, cl_learners = build_cl01(); docs.append(("CL-01_Combined_Subject_Class_List_9ABC-WW", cl_html))
    sc_html, sc_rows = build_sc01(); docs.append(("SC-01_Subject_Code_Key_Grade_9", sc_html))
    at_html, codes = build_at01(); docs.append(("AT-01_ATP_Weekly_Plan_EFAL_Gr8_T1", at_html))

    # ---- data checks (section 8)
    checks = {}
    def is_sorted(ls): return [tuple(x[:2]) for x in ls] == [tuple(x[:2]) for x in sort_learners(ls)]
    checks["RL-01 sorted, 34 learners"] = is_sorted(rl_learners) and len(rl_learners) == 34
    checks["SL-01 MT sorted (19)"] = is_sorted(mt_l) and len(mt_l) == 19
    checks["SL-01 ML sorted (15)"] = is_sorted(ml_l) and len(ml_l) == 15
    checks["SL-01 groups disjoint and equal 9B"] = (not (set(mt_l) & set(ml_l))) and set(mt_l) | set(ml_l) == set(rl_learners)
    checks["CL-01 sorted across classes (48)"] = is_sorted(cl_learners) and len(cl_learners) == 48
    cl_9b = {(s, f) for s, f, c in cl_learners if c == "9B"}
    checks["CL-01 9B learners are on RL-01"] = cl_9b <= set(rl_learners) and len(cl_9b) == 15
    used_codes = {f"9B-{c}" for _, c in WHOLE_CLASS} | {"9B-MT", "9B-ML", "9ABC-WW"}
    checks["every list code appears on SC-01"] = used_codes <= {r[0] for r in sc_rows}
    checks["SC-01 rows within capacity 24"] = len(sc_rows) <= 24
    checks["AT-01 narratives <= 230 chars"] = all(len(n) <= ATP_WEEK_CHAR_LIMIT for n in NARRATIVES.values())
    checks["AT-01 codes 4 allowed chars, unique"] = all(len(c) == 4 and set(c) <= set(ATP_ALPHABET) for c in codes.values()) and len(set(codes.values())) == len(codes)

    report = render_all(docs)
    # combined set
    import pypdf
    w = pypdf.PdfWriter()
    for fname, _ in docs:
        for pgobj in pypdf.PdfReader(str(OUT / f"{fname}.pdf")).pages: w.add_page(pgobj)
    with open(OUT / "Fisantekraal_Reference_Set_RL-SL-CL-SC-AT.pdf", "wb") as fh: w.write(fh)

    summary = {"render": report, "data_checks": checks,
               "atp": [{"week": wk, "code": codes[wk], "chars": len(NARRATIVES[wk]), "heavily_shortened": wk in HEAVILY_SHORTENED, "narrative": NARRATIVES[wk]} for wk in sorted(NARRATIVES)],
               "sc01_rows": len(sc_rows)}
    (HERE / "build-report.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False))
    print(json.dumps({k: v for k, v in summary.items() if k != "atp"}, indent=2, ensure_ascii=False))
    for a in summary["atp"]:
        print(f"Week {a['week']:>2} | {a['code']} | {a['chars']:>3} chars | {'SHORTENED HEAVILY' if a['heavily_shortened'] else ''}")
    ok = all(checks.values()) and all(r["pages"] == 1 and not r["problems"] and r["minTablePt"] >= 9 and r["minAllPt"] >= 8 for r in report.values())
    print("ALL CHECKS PASSED" if ok else "CHECKS FAILED")
    return 0 if ok else 1

if __name__ == "__main__":
    sys.exit(main())
