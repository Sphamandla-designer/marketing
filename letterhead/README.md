# Kenzo Nail Bar — Letterhead

A refreshed letterhead built around the new Kenzo Nail Bar logo
(`WhatsApp Image 2026-09-30 at 18.29.13.jpeg`), keeping the magenta-to-purple
palette and contact details from the original `Kenzo Letterhead.docx`.

A4 is the main size (standard paper in South Africa). There's also a US Letter version.

| File | Use |
| --- | --- |
| `Kenzo-Nail-Bar-Letterhead-A4.docx` | Word template for typing letters. Print it on any office/home printer. |
| `Kenzo-Nail-Bar-Letterhead-A4.pdf` | Blank letterhead at A4 size, for printing a stack of letterhead on an office printer. |
| `Kenzo-Nail-Bar-Letterhead-A4-PRESS.pdf` | **Send this one to a print shop.** A4 plus 3mm bleed on every side, with TrimBox/BleedBox set and the font embedded. |
| `...-Letter.docx` / `.pdf` / `-PRESS.pdf` | The same three files at US Letter size. |
| `Kenzo-Nail-Bar-Letterhead-preview.png` | Quick look at the A4 design. |
| `assets/` | Artwork as SVG (scalable masters) and 300 dpi PNG, plus the logo with softened edges. |

## Printing

**Office / desktop printer** (Word file or the plain PDF)
- Print at **100% / "Actual size"**, not "Fit to page", and pick the same paper size as the file (A4 file on A4 paper).
- Most desktop printers can't print the outer ~4–5mm of the sheet. The design allows for that: the coloured bands at the
  top and bottom are wide enough that a band still shows if the edge comes out white, and all text, icons and small
  decorations sit at least 6mm in from the edge. On a printer with a large bottom margin, part of the bottom band may
  not print, but the thin coloured line above it still does.
- The Word file uses **Century Gothic**, which comes with Microsoft Office on Windows and Mac. If a computer doesn't have
  it, Word substitutes a different font for the contact details, so print from the PDF on that computer instead.

**Print shop** (`-PRESS.pdf`)
- Trim size A4 (210 × 297mm), document size 216 × 303mm including 3mm bleed. The coloured bands run into the bleed,
  so there are no white slivers at the edges after cutting.
- Artwork is 300 dpi. The logo comes out at about 280 dpi, because the source logo is only 500 × 500 px. That's fine for
  letterhead, but ask the logo designer for a larger PNG or a vector (AI/EPS/SVG/PDF) file for the sharpest print.
- The colours are RGB. Let the print shop convert them to CMYK with their own colour profile, and **ask for a printed
  proof first**. The bright lavender and magenta print a little darker and duller in CMYK than on screen.
- The text font in the PDFs is Questrial (SIL Open Font License, see `assets/fonts/`), a free near-match for
  Century Gothic, embedded so the file prints the same everywhere.

## Design

- **Colours:** Magenta `#C64BC9`, Lavender `#9672E8`, Blush `#F4C6E6`, with Gold `#C9A55A` taken from the logo's ring. Text is ink `#2E2A4A`.
- **Type:** Century Gothic, the geometric sans used in the original letterhead.
- **Header:** A gradient band runs across the top and drops into a rounded panel with halftone dots, stars and a gold double ring that echoes the logo. The contact lines are right-aligned with round gradient icons, and a magenta/lavender/magenta rule sits underneath.
- **Footer:** A lavender/magenta/lavender rule above a gradient band, the reverse of the header rule.

## Editing

The contact details are live text in the Word header (double-click the header to edit them).
To change the artwork or rebuild everything:

```bash
node render-art.js        # SVG → assets/*.png (trim and bleed versions)
node fade-logo.js         # assets/kenzo-logo.jpg → softened transparent PNG
node build-letterhead.js  # → A4 and Letter .docx (page geometry lives in layout.js)
python3 make-print.py     # → office and -PRESS PDFs (needs LibreOffice Writer + pypdf,
                          #   with Questrial installed and aliased to "Century Gothic" in fontconfig)
```
