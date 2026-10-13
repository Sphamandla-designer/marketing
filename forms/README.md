# Fisantekraal High School – Weekly Attendance & Observation Forms

Interactive web forms for the **Register Class** (SA-01 Register Class Weekly
Attendance & Observation) and **Subject Class** (SA-01 Subject Weekly
Attendance & Observation) forms, with submission output as a professional
**PDF** and a high-resolution **PNG image** generated from the same completed
form data.

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
