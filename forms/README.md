# Fisantekraal High School – Weekly Attendance & Observation Forms

Interactive web forms for the **Register Class** (**SA-01** Register Class
Weekly Attendance & Observation) and **Subject Class** (**SA-02** Subject
Weekly Attendance & Observation) forms, with submission output as a professional
**PDF** and a high-resolution **PNG image** generated from the same completed
form data.

The layout follows the **First Home Finance application form** held at the
repository root; the colour is the school's own, taken from the crest. Brand
red `#B5121B` (the shield) carries every rule, heading and header bar, with
`#8F0F19` (the ribbon) for depth and `#8C5F62` — that red desaturated the way
the reference derives its instruction band from its header bar — for the
instruction bands. Label cells are pale grey, values sit in their own rounded
white boxes, and nothing has a square corner. The barcode modules are the
single deliberate exception, since rounding them would stop them scanning, and
`npm run blanks` asserts that nothing else is square.

```
Completed form  →  Form data model  →  layout engine (A4, mm)  →  PDF (jsPDF, vector, embedded Roboto)
                                                              →  PNG (canvas, 2480 × 3508 px, 300 DPI)
```

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

| | Section A (page 1) | Section A2 (page 2) | Total slots per day |
| --- | --- | --- | --- |
| Register Class (SA-01) | 10 | 12 | 22 |
| Subject Class (SA-02) | 6 | 8 | 14 |

Section A2 is a real continuation grid on page 2, not a note pointing at the
back of the page. It is laid out whole on one page; slots added beyond the
designed size flow normally rather than stranding a part-empty page. More
slots can be added from Section A2 on screen, up to `maxRows`.

Every page carries its own barcode and printed page code — `SA01-P1`,
`SA01-P2`, `SA02-P1` … — so a page separated from its set is identifiable, and
pages 2 onwards repeat a strip of Year, Term, Week and Class (plus Subject on
the subject form).

Sign-off has two columns. The educator signs on submission; the **HOD**
column (name, signature, date) is optional in validation because it is
normally counter-signed after the form is printed.

## Blank forms

**Download blank form** on either page produces the unfilled form for printing
and completion by hand (`Register-Class-BLANK.pdf`, `Subject-Class-BLANK.pdf`).
It runs the same data model → layout → PDF/PNG pipeline as a submission, fed an
empty data object, so a blank can never drift from the form people fill in.
Validation is not involved: nothing is being submitted. On a blank the schema
placeholders are printed as grey hints, the write-in boxes grow to fill the
page, and the generation stamp is omitted.

Run `npm run blanks` to regenerate them into `qa/output/blank/`; the committed
copies are in `samples/`.

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
npm run qa            # headless Chromium fills both forms (standard + long multi-page data), submits, downloads PDF + PNGs
npm run qa:inspect    # renders PDF pages, checks every value is in the PDF, page counts, 300 DPI size, PDF↔PNG parity, clipping
```

Requires `pip install pymupdf pillow` for the inspection step. Outputs land
in `qa/output/<scenario>/` (git-ignored). Sample outputs from the standard
scenarios are committed in `samples/`.

QA results for this build: all four scenarios pass (every submitted value
present in the PDF text layer; PDF page count equals PNG count; PNGs are
2480 × 3508 px; mean PDF-vs-PNG pixel difference ≤ 3/255; no ink at the
page edges; no text blocks outside the page).

## Notes on the design

* Layout, colours, section structure, tables and wording follow the
  *Register Class – Final Form Design v1* and *Subject Class – Final Form
  Design v3* references. The crest is a vector approximation of the school
  crest (`assets/crest.svg`); replace the file with the official artwork if
  available (any SVG at 1:1 aspect works).
* Header fields use SARS-style character boxes (year, term, week, date) and
  rounded field containers (class, subject, educator, ATP code).
* An **Educator sign-off** section (declaration, signature, date) was added
  to both forms so the generated document can be signed and dated.
* Long forms (more than the default 10 / 6 rows, or long comments) split
  across pages with a compact continuation header, repeated table headers
  and `Page X of Y` footers. The standard Register/Subject forms produce two
  pages: the attendance/observation sheet (page 1) and the comments/sign-off
  (page 2).
