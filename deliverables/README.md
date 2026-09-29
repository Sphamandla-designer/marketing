# Deliverables — Fisantekraal High School

Every printable document in one place. All A4, one page each, print at 100%
(no "fit to page", which would shrink the handwriting cells).

## Weekly fill-in forms — teachers complete these

| File | Form | Notes |
|---|---|---|
| SA-01-Register-Class-Form-BLANK.pdf | Register class weekly attendance and observation | 10 rows in Sections A and B |
| SA-02-Subject-Class-Form-BLANK.pdf | Subject class weekly attendance and observation | 6 rows, plus Section C for the ATP |
| SA-OC-Observation-Codes.pdf | Observation codes | Reference sheet, greyscale for photocopying |

Greyscale by design so they photocopy cleanly in black and white.

## Pre-printed reference documents — the class file carries these

| File | Code | Used with |
|---|---|---|
| RL-01-Register-Class-List-9B.pdf | RL-01 | SA-01 |
| SL-01-Split-Class-List-9B-MT.pdf | SL-01 | SA-02 (Mathematics, 19 learners) |
| SL-01-Split-Class-List-9B-ML.pdf | SL-01 | SA-02 (Mathematical Literacy, 15 learners) |
| CL-01-Combined-Class-List-9ABC-WW.pdf | CL-01 | SA-02 (Woodworking, 48 learners) |
| SC-01-Subject-Code-Key-Grade-9.pdf | SC-01 | SA-02 |
| AT-01-ATP-Weekly-EF-Gr8-T1..T4.pdf | AT-01 | SA-02 Section C (English FAL Grade 8, four terms) |

Full-colour; these are printed once and kept, not photocopied weekly.

**Before printing**, read the placeholder and provisional list in
`references/README.md`. Every learner name here is fictional, and the subject
class code format, the ATP code scheme and the list effective date are all
still provisional.

## Rebuilding

    python3 references/build.py --atp references/atp/english-fal-grade-8.json --check
    cd forms && npm run blanks
