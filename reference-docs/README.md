# Fisantekraal High School — pre-printed reference documents

Five controlled reference documents (seven A4 portrait pages) that teachers keep in the class
file and consult when completing the two weekly fill-in forms SA-01 (register class) and
SA-02 (subject class). They are printed with the data and codes already on them; nothing is
filled in by hand. The design matches the existing OC-01 Conduct Observation Code Reference.

| File | Document | Pages |
| --- | --- | --- |
| `RL-01_Register_Class_List_9B.pdf` | RL-01 Register Class List (9B, 34 learners) | 1 |
| `SL-01_Split_Subject_Class_List_9B-MT.pdf` | SL-01 Split Subject Class List, Mathematics 9B-MT (19 learners) | 1 |
| `SL-01_Split_Subject_Class_List_9B-ML.pdf` | SL-01 Split Subject Class List, Mathematical Literacy 9B-ML (15 learners) | 1 |
| `CL-01_Combined_Subject_Class_List_9ABC-WW.pdf` | CL-01 Combined Subject Class List, Woodworking 9ABC-WW (48 learners) | 1 |
| `SC-01_Subject_Code_Key_Grade_9.pdf` | SC-01 Subject Code Key, Grade 9 (24 subject classes) | 1 |
| `AT-01_ATP_Weekly_Plan_EFAL_Gr8_T1.pdf` | AT-01 ATP Weekly Plan, English FAL Grade 8 Term 1 (10 weeks) | 1 |
| `Fisantekraal_Reference_Set_RL-SL-CL-SC-AT.pdf` | All seven pages in one file, in the order above | 7 |

`previews/` holds a PNG of every page. `build.py` regenerates everything (`python3 build.py`);
it needs Playwright with the bundled Chromium, pypdf and Pillow, and DejaVu Sans installed.
All settings from section 0 of the brief are constants at the top of `build.py`.

## Settings used

| Setting | Value |
| --- | --- |
| ACADEMIC_YEAR | 2027 |
| TERM | 1 |
| PHASE_LABEL | Senior Phase (Grades 7–9) |
| SUBJECT_CLASS_CODE | [Grade][Class]-[Subject abbreviation], e.g. 9B-MT; combined classes list all letters, e.g. 9ABC-WW (provisional) |
| ATP_CODE | 4 characters from digits 2–9 and A–Z without I and O, derived from subject + grade + term + week (provisional) |
| ATP_WEEK_CHAR_LIMIT | 230 characters including spaces |
| LIST_VERSION | 1, effective [date to be confirmed] |
| DATA | fictional placeholder names |

## AT-01 Step A — weekly narratives (English FAL, Grade 8, Term 1)

Source: DBE Annual Teaching Plan 2023/24, English First Additional Language Grade 8, Term 1
(`ATP - English FAL - Grade 8.pdf` in the repository root). Each ATP week pair (1–2, 3–4, 5–6,
7–8, 9–10) was divided across its two weeks in the order the ATP gives the content.

| Week | ATP code | Narrative | Characters | Shortened heavily |
| --- | --- | --- | --- | --- |
| 1 | `GN9U` | Baseline assessment and orientation on days 1 to 3. Read a brochure aloud and discuss its format, purpose, audience and visual elements. Practise skimming and scanning. Language: nouns, adjectives, verbs, adverbs, simple tenses. | 228 | Yes |
| 2 | `HRWD` | Study poetry: figures of speech, imagery, rhyme, rhythm, lines, stanzas, mood, theme and message. Plan, draft, edit and present a brochure from visual stimuli. Language: proverbs, denotative and connotative meaning, punctuation. | 228 |  |
| 3 | `LY5A` | Listen to a video on writing an email; note tone, register and audience. Read an email by skimming and scanning. Plan and draft an email. Language: adverbs, articles, gerunds. Begin Task 1 Oral: reading aloud (20 marks). | 220 | Yes |
| 4 | `4K6Y` | Read folklore: character, plot, conflict, setting, narrator and theme. Revise, edit, proofread and present the email. Language: sentence structure, adjectival and adverbial clauses, synonyms, antonyms. Reading aloud continues. | 226 |  |
| 5 | `AZGQ` | Group discussion and brainstorming on the youth novel; listening comprehension for summary writing. Explore parts of a book. Plan and draft a narrative or reflective essay. Language: pronouns, subject-verb agreement. | 216 |  |
| 6 | `83UG` | Continue the youth novel and teach the principles of summary writing. Revise, edit, proofread and present the essay for Task 2 Writing: narrative or reflective essay (30 marks). Language: main and dependent clauses, punctuation. | 228 |  |
| 7 | `UBAT` | Prepare an oral on a newspaper article, report or editorial: research, organise and support with examples. Read such texts for features, format and language. Plan an article. Language: regular, irregular and auxiliary verbs. | 224 |  |
| 8 | `NRJ7` | Listening comprehension: main ideas and persuasive techniques. Read for inference, manipulative language. Draft, edit and present the article. Task 3 Response to Texts (60 marks): text 20, visual 10, summary 10, language 20. | 224 | Yes |
| 9 | `7M9Q` | Listen to a prepared speech by a former president or influential person; discuss its features and language. Read a speech for emotive language and structure. Plan own speech. Language: compound nouns, finite verbs, prepositions. | 228 | Yes |
| 10 | `XRFL` | Discuss the folktale: retell, defend a position, negotiate, take turns. Study plot, climax, resolution, foreshadowing, flashback, mood, irony and suspense. Draft, edit and present own speech. Language: homophones, abbreviations. | 228 | Yes |

Every ATP week pair carries far more detail than 230 characters can hold, so every week is a
summary. The weeks flagged above lost the most (baseline assessment plus brochure plus grammar
in week 1; the email unit plus the start of the oral task in week 3; the full Task 3 breakdown
plus reading strategies in week 8; the speech unit in weeks 9 and 10).

## Checks before delivery (section 8)

Render checks, measured in the browser at print size:

| Page | Pages | Smallest table text | Smallest text anywhere | Content bottom (of 277 mm) | Problems |
| --- | --- | --- | --- | --- | --- |
| RL-01_Register_Class_List_9B | 1 | 9 pt | 8 pt | 264 mm | none |
| SL-01_Split_Subject_Class_List_9B-MT | 1 | 9 pt | 8 pt | 177.3 mm | none |
| SL-01_Split_Subject_Class_List_9B-ML | 1 | 9 pt | 8 pt | 152.5 mm | none |
| CL-01_Combined_Subject_Class_List_9ABC-WW | 1 | 9 pt | 8 pt | 215.4 mm | none |
| SC-01_Subject_Code_Key_Grade_9 | 1 | 9 pt | 8 pt | 254.5 mm | none |
| AT-01_ATP_Weekly_Plan_EFAL_Gr8_T1 | 1 | 9 pt | 8 pt | 228.7 mm | none |

Data checks:

- PASS: RL-01 sorted, 34 learners
- PASS: SL-01 MT sorted (19)
- PASS: SL-01 ML sorted (15)
- PASS: SL-01 groups disjoint and equal 9B
- PASS: CL-01 sorted across classes (48)
- PASS: CL-01 9B learners are on RL-01
- PASS: every list code appears on SC-01
- PASS: SC-01 rows within capacity 24
- PASS: AT-01 narratives <= 230 chars
- PASS: AT-01 codes 4 allowed chars, unique

## Placeholder and provisional items

- **All learner names** on RL-01, SL-01 and CL-01 are fictional. Real learner data replaces them before printing and is kept only in the school's copies.
- **All educator names** (Mr L. Petersen, Ms A. Jacobs, Mr P. van Wyk, Ms T. Ndlovu, Mr S. Adams, Ms R. Fortuin, Mr K. Booysen, Ms L. Daniels, Ms Z. Mnyaka, Mr J. Hendricks, Ms N. Cloete, Ms B. Solomons) and room B12 are fictional.
- **Subject class code format** is provisional, as the brief states.
- **ATP codes** are provisional. The 4-character codes are generated from a hash of subject, grade, term and week using the allowed alphabet; they will change when the final scheme is set.
- **List version effective date** is the placeholder "[date to be confirmed]".
- **Split placeholder**: only 9B is shown splitting into Mathematics and Mathematical Literacy. To stay within the 24-row capacity of SC-01, the Grade 9 key shows 9A and 9C with their seven whole-class subjects only; their Mathematics rows are not shown. A real Grade 9 key with three classes that all take Mathematics needs 26 to 28 rows, so either the capacity rises or SC-01 is issued per register class.
- **Subject set**: Mathematical Literacy and Woodworking are not CAPS Senior Phase subjects; they appear because the brief uses them as placeholders. The abbreviation table lists TC (Technology), but no Technology class is placed on the placeholder lists.
- **RL-01 info bar**: "Academic year" sits on row 1 rather than row 2 because the full placeholder strings for Phase and List version did not fit on one 190 mm row at 9 pt with "Academic year" alongside them. When the real effective date replaces the placeholder it can move back.
- **Row pitch in the RL-01 subjects panel** is 4 mm (9 pt text), tighter than the learner tables, so that the 30-row learner table and the seven whole-class subjects fit one page.
- **Cell padding** in the small subject tables is 1.5 mm rather than 2 mm for the same reason.
- **AT-01** was produced for Term 1 only, as the placeholder run in the brief specifies. Terms 2 to 4 need the same Step A conversion.
- **School crest** is cropped from the OC-01 demo image; replace `crest.png` with the master artwork before printing.
