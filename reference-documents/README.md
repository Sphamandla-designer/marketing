# Pre-printed reference documents (RL-01, SL-01, CL-01, SC-01, AT-01)

Reference documents teachers keep in their class file when completing SA-01 and
SA-02. They are printed with the data already on them. The design follows OC-01
(Conduct Observation Code Reference).

| File | Document |
|---|---|
| `RL-01-Register-Class-List-9B.pdf` | Register class list, 9B (34 learners) |
| `SL-01-Split-Subject-Class-List-9B-MT.pdf` | Split list, Mathematics 9B-MT (19 learners) |
| `SL-01-Split-Subject-Class-List-9B-ML.pdf` | Split list, Mathematical Literacy 9B-ML (15 learners) |
| `CL-01-Combined-Subject-Class-List-9ABC-WW.pdf` | Combined list, Woodworking 9ABC-WW (48 learners) |
| `SC-01-Subject-Code-Key-Grade-9.pdf` | Subject code key, Grade 9 |
| AT-01 | ATP weekly plan: waiting for the DBE ATP PDF |

**All learner names, educators, rooms and codes are fictional placeholders.**
Real learner data replaces them before printing and is kept only in the school's copies.

## Regenerate

```
cd generator
pip install reportlab pymupdf
python3 ref.py     # builds the PDFs and runs the checks
```

- Settings (year, term, phase, list version) and all data are in `generator/refdata.py`.
- The build stops if text would overflow its cell or content would run into the footer.
- The checks confirm one A4 portrait page each, text sizes (9 pt in tables, 8 pt
  elsewhere), numbering 1..n by surname, that the SL-01 groups add up to 9B with
  no overlap, that CL-01's 9B learners match RL-01, and that every code on the
  lists is on SC-01.
- Crest: taken from OC-01 (`generator/assets/crest-red.png`). Fonts: DejaVu Sans
  (see `generator/fonts/LICENSE-DejaVu`).
