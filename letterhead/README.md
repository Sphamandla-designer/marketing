# Kenzo Nail Bar — Letterhead

A refreshed letterhead built around the new Kenzo Nail Bar logo
(`WhatsApp Image 2026-09-30 at 18.29.13.jpeg`), keeping the magenta-to-purple
palette and contact details from the original `Kenzo Letterhead.docx`.

| File | Use |
| --- | --- |
| `Kenzo-Nail-Bar-Letterhead.docx` | Editable Word template (US Letter). Type the letter in the body; header and footer repeat on every page. |
| `Kenzo-Nail-Bar-Letterhead.pdf` / `-preview.png` | Print-ready proof of the blank letterhead. |
| `assets/` | Artwork as SVG (scalable masters) and 300 dpi PNG, plus the logo with softened edges. |

## Design

- **Colours:** Magenta `#C64BC9`, Lavender `#9672E8`, Blush `#F4C6E6`, with Gold `#C9A55A` taken from the logo's ring. Text is ink `#2E2A4A`.
- **Type:** Century Gothic, the geometric sans used in the original letterhead.
- **Header:** A gradient band runs across the top and drops into a rounded panel with halftone dots, stars and a gold double ring that echoes the logo. The contact lines are right-aligned with round gradient icons, and a magenta/lavender/magenta rule sits underneath.
- **Footer:** A lavender/magenta/lavender rule above a gradient band, the reverse of the header rule.

## Editing

The contact details are live text in the Word header (double-click the header to edit them).
To change the artwork, edit `render-art.js` and run:

```bash
node render-art.js        # SVG → assets/*.png
node fade-logo.js         # assets/kenzo-logo.jpg → softened transparent PNG
node build-letterhead.js  # → Kenzo-Nail-Bar-Letterhead.docx
node render-preview.js    # → PDF + PNG proof (from preview.html)
```
