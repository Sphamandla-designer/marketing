# Master documents (SA-03A, SA-03B, SA-03C, SA-04, SA-05)

Blank, printable one-page A4 masters that support SA-01, SA-02 and SA-OC. The
design matches those forms; the header crest and positions are measured from SA-01.

| File | Form |
|---|---|
| `SA-03A-Register-Class-Master-List-BLANK.pdf` | Register class master list (50 learners) |
| `SA-03B-Split-Subject-Class-List-BLANK.pdf` | Split subject class list (50 learners) |
| `SA-03C-Combined-Subject-Class-List-BLANK.pdf` | Combined subject class list (60 learners) |
| `SA-04-Subject-Class-Code-Key-BLANK.pdf` | Subject class code key (22 subject classes) |
| `SA-05-Term-ATP-Weekly-Plan-BLANK.pdf` | Term ATP weekly plan and codes (10 weeks) |

Every writing box sits 0.75 mm inside its cell, so neighbouring boxes are always
1.5 mm apart and never touch.

## Regenerate

```
cd generator
pip install reportlab pymupdf
python3 blank.py      # builds the five blank forms and checks them
```

`blank.py` checks each page before reporting success: one page, 10 mm margins,
no text under 8 pt outside the form-code box, no writing boxes closer than
1 mm, and the header and footer text.

Optional: `python3 build.py` writes typed examples from the placeholder data in
`data.py` to `filled-examples/` (not committed), and `python3 check.py` checks them.

`Register-Class-BLANK (10).pdf` (SA-01) must stay in the repository root; the
header is measured from it. Fonts: Roboto and Roboto Mono (SIL Open Font License,
see `generator/fonts`).
