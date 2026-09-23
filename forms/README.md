# Fisantekraal High School – Weekly Attendance & Observation Forms

Interactive web forms for the **Register Class** (**SA-01** Register Class
Weekly Attendance & Observation) and **Subject Class** (**SA-02** Subject
Weekly Attendance & Observation) forms, with submission output as a professional
**PDF** and a high-resolution **PNG image** generated from the same completed
form data.

The layout follows the **First Home Finance application form** held at the
repository root. The forms are printed and filed in black and white, so both
the screen form and the generated document are drawn in **greyscale**: `#141414`
carries every rule, heading and header bar, `#6B6B6B` the instruction bands and
`#E8E8E8` the label cells. The crest is converted to greyscale at raster time
(Rec. 709 luma) rather than left as the one colour element on the page. Screen
focus, error and success states stay coloured — they never reach the print.

Values sit in their own rounded white boxes and nothing has a square corner.
The barcode modules are the single deliberate exception, since rounding them
would stop them scanning, and `npm run blanks` asserts that nothing else is
square.

```
Completed form  →  Form data model  →  layout engine (A4, mm)  →  PDF (jsPDF, vector, embedded Roboto)
                                                              →  PNG (canvas, 2480 × 3508 px, 300 DPI)
```

The header carries the class, the week, the educator and a date, and the term
is printed in the masthead; the sign-off therefore captures nothing but the
educator's signature. Two period slots per day are recorded in the Period row
above the attendance grid.

## Run it

```bash
cd forms
npm install          # jsPDF (vendored copy already in vendor/) and Playwright for QA
npm start            # http://localhost:8080
```

The app is static (no build step). Any static file host works; the pages
must be served over HTTP (ES modules), not opened from `file://`.

| Page | Purpose |
| --- | --- |
| `index.html` | Choose a form; re-download forms generated on this device |
| `register-class.html` | Interactive Register Class form |
| `subject-class.html` | Interactive Subject Class form |

## How the attendance grid works

The grid is a **slot model**, not one row per learner: a row is an entry slot,
and the educator writes a learner's position number into the A (absent) or L
(late) column for the relevant day. A row per learner cannot fit a 45-learner
class on a page, so the form does not pretend to.

| | Entry slots per day |
| --- | --- |
| Register Class (SA-01) | 8 |
| Subject Class (SA-02) | 6 |

The slot count is fixed: the form is one page, so there is no continuation
section and no add-row control. A class with more entries than slots uses a
second copy of the form.

Above the day header sits a **Period** row — two boxes per day, for the
periods that day's register was taken in (`PERIOD_SLOTS` in `schema.js`).

Each page carries its own barcode and printed page code (`SA01-P1`, `SA02-P1`),
so a page separated from its set is identifiable.

Sign-off records the educator's **signature** and nothing else — the week is a
header field and the term is printed in the masthead. `signOff.fields` and
`signOff.dates` in `schema.js` are empty, and the layout drops the field band
entirely rather than printing an empty one; adding an entry to either brings
it back.

## Blank forms

**Download blank form** on either page produces the unfilled form for printing
and completion by hand (`Register-Class-BLANK.pdf`, `Subject-Class-BLANK.pdf`).
It runs the same data model → layout → PDF/PNG pipeline as a submission, fed an
empty data object, so a blank can never drift from the form people fill in.
Validation is not involved: nothing is being submitted. On a blank the schema
placeholders print as grey hints and the generation stamp is omitted.

Run `npm run blanks` to regenerate them into `qa/output/blank/`; the committed
copies are in `samples/`.

## One page

Both forms are designed to be a single A4 page, however full the grid. The
attendance and observation grids are therefore a fixed set of entry slots —
8 on the Register form, 6 on the Subject form — with no continuation section
and no add-row controls, and the write-in boxes keep their designed size
instead of growing. The submission stamp shares a baseline with the signature
caption rather than taking a line of its own, so a completed form is exactly
as tall as a blank. `npm run qa` and `npm run blanks` both fail if anything
spills onto a second page.


## User flow

1. Complete the form. Progress is auto-saved on the device (draft).
2. **Submit / Generate Form** validates the form (errors are listed and linked
   to the fields) and generates the PDF and PNG(s).
3. The result panel shows page previews and offers **Download PDF** and
   **Download Image (PNG)**. Generated files are also stored in the browser's
   IndexedDB and listed on the landing page.

File names: `Register-Class-<identifier>.pdf` / `.png` and
`Subject-Class-<identifier>.pdf` / `.png`, where `<identifier>` is
`<class>-<year>-T<term>-W<week>` (e.g. `9A-2026-T3-W5`). Multi-page forms
produce one PNG per page: `…-page-2-of-3.png`.

Each generated document also carries a sequential document number
(`SA01000001`, shown as a Code 128 barcode in the header) and a generation
timestamp in the sign-off section.

## Backend submission (optional)

No backend existed in this repository, so submissions are stored locally.
To also POST each submission to a server, set `SUBMIT_ENDPOINT` in
`js/config.js`. The request is `multipart/form-data` with fields
`formType`, `docNumber`, `identifier`, `data` (JSON), `pdf` (file) and
`image-1 … image-N` (PNG files).

## Architecture (single source of truth)

| File | Role |
| --- | --- |
| `js/schema.js` | Form definitions for both forms (fields, sections, labels, rows, codes) |
| `js/model.js` | Empty data factory, validation, normalisation, identifiers |
| `js/form-ui.js` | Interactive form generated from the schema (character boxes, grids, signature pad, keyboard navigation, inline errors) |
| `js/layout.js` | Layout engine: schema + data → paginated A4 drawing primitives (mm), with intelligent page breaks (repeated table headers, keep-together sections, flowing comments, no orphan lines) |
| `js/painters.js` | Replays the primitives into jsPDF (vector PDF) and into a 300 DPI canvas (PNG) |
| `js/export.js` | Submission pipeline: generate → store → optional POST → download |
| `js/fonts.js`, `js/crest.js`, `js/barcode.js` | Roboto font loading (embedded in the PDF and used on canvas), vector crest rasterisation, Code 128 |
| `js/storage.js` | IndexedDB submissions store and localStorage drafts |

Because the PDF and PNG painters consume the exact same primitive list
(text is measured and wrapped once, with the same font file embedded in the
PDF and loaded on the canvas), both outputs always contain identical
information and layout.

## QA

```bash
npm run qa            # headless Chromium fills both forms (typical and every-slot-full), submits, downloads PDF + PNG
npm run qa:inspect    # renders PDF pages, checks every value is in the PDF, page count, 300 DPI size, PDF↔PNG parity, clipping
npm run blanks        # generates the blanks and audits every corner
```

Requires `pip install pymupdf pillow` for the inspection step. Outputs land
in `qa/output/` (git-ignored). Committed copies are in `samples/`.

QA results for this build: all four scenarios pass — every submitted value is
present in the PDF text layer, every form is a single page, PNGs are
2480 × 3508 px, mean PDF-vs-PNG pixel difference ≤ 2.1/255, no clipping. The
blanks are one page each with 287/287 and 252/252 rectangles rounded and no
square corner outside the barcode.

## Notes on the design

* Structure follows the **First Home Finance application form**, drawn in
  greyscale for black-and-white printing. `assets/crest.svg` still holds the
  crest in its own colours; it is desaturated on the way into the document, so
  replacing that file with the official artwork needs no other change (any SVG
  at 1:1 aspect works).
* The masthead prints the form's own title and the term it covers in place of
  the school motto and tagline. That term line is fixed text, so a new blank
  is generated each term.
* Fields use SARS-style character boxes (term, week, dates) alongside rounded
  field containers (class, subject, educator, ATP code).
* The observation code list is identical on both forms and is printed inside
  Section B, with the observations it explains.
