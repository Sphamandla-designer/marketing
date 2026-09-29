# Deliverables — Fisantekraal High School

Every printable document in one place. All A4, one page each, print at 100%
(no "fit to page", which would shrink the handwriting cells).

## Weekly fill-in forms — teachers complete these

| File | Form | Notes |
|---|---|---|
| SA-01-Register-Class-Form-BLANK.pdf | Register class weekly attendance and observation | 10 rows in Sections A and B |
| SA-02-Subject-Class-Form-BLANK.pdf | Subject class weekly attendance and observation | 6 rows, plus Section C for the ATP |

Greyscale by design so they photocopy cleanly in black and white, in the house
style of the First Home Finance application form. Section B on both forms
refers to the Conduct Observation Code Reference (OC-01).

## Reference documents — the class file carries these

| File | Code | Used with |
|---|---|---|
| RL-01-Register-Class-List-10B.pdf | RL-01 | SA-01 (10B, 34 learners) |
| SL-01-Split-Class-List-10B-MT.pdf | SL-01 | SA-02 (Mathematics, 19 learners) |
| SL-01-Split-Class-List-10B-ML.pdf | SL-01 | SA-02 (Mathematical Literacy, 15 learners) |
| SL-01-Split-Class-List-10B-TO.pdf | SL-01 | SA-02 (Tourism, 18 learners) |
| CL-01-Combined-Class-List-10ABC-CW.pdf | CL-01 | SA-02 (Civil Technology (Woodworking), 48 learners) |
| SC-01-Subject-Code-Key-Grade-10.pdf | SC-01 | SA-02 (Grade 10, 25 subject classes) |
| AT-01-ATP-Weekly-EF-Gr8-T1..T4.pdf | AT-01 | SA-02 Section C (English FAL Grade 8, four terms) |
| AT-01-ATP-Weekly-HI-Gr10-T1..T4.pdf | AT-01 | SA-02 Section C (History Grade 10, four terms) |
| OC-01-Conduct-Observation-Code-Reference.pdf | OC-01 | SA-01 and SA-02 Section B. v0.2 draft, two pages double-sided: Leon's 54 codes with one-line descriptions; the ▲ and ◆ flags are proposed, awaiting SMT approval |

Black and white like the forms, in the same First Home Finance house style; printed once and kept. Every
reference document is **version 0.1, draft for consultation**, and says so in
its controlled-reference box and in a red status line under the info bar.

**Before printing**, read the placeholder and provisional list in
`references/README.md`: fictional learners and staff, the provisional subject
class code format, the provisional ATP codes, the draft status, the 2023/24
ATP source, the list effective date to be set on approval, and OC-01 at
consultation stage (v0.2 draft; codes Leon's, flags proposed).

## Rebuilding

    python3 references/build.py --check --deliver
    cd forms && npm run blanks && npm run measure
    cp forms/qa/output/blank/Register-Class-BLANK.pdf deliverables/SA-01-Register-Class-Form-BLANK.pdf
    cp forms/qa/output/blank/Subject-Class-BLANK.pdf deliverables/SA-02-Subject-Class-Form-BLANK.pdf
