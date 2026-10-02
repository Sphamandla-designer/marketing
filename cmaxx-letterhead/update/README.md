# CMaxx letterhead — contact details update

The original CMaxx letterhead with **only the contact details changed**. Nothing else in the
design was touched.

| | Before | After |
| --- | --- | --- |
| Phone | 083 212 7065 | **010 140 3660** |
| Email | admin@cmaxxsolutions.co.za | **info@cmaxxwifisolutions.co.za** |
| Website | www.cmaxxsolutions.co.za | **www.cmaxxwifisolutions.co.za** |
| Address | 24 Walton Ave, Carlswald, Midrand, 1684 | unchanged (re-set in Outfit to match the lines above) |
| Size | about 14.4 pt | **11 pt** on the printed page |

| File | What it is |
| --- | --- |
| `CMaxx Solutions Letterhead.docx` | The original Word file (`../source/CMaxx Solutions Letterhead Word.docx`) with the new details. |
| `CMaxx Solutions Letterhead.pdf` | PDF of the same file: A4, letterhead image at full resolution, Arial embedded. |
| `letterhead-image.jpg` | The updated full-page letterhead image on its own. |

## How it was done

The original letterhead is one full-page picture in the Word header, with the contact details
drawn into it. `update-contacts.py`:

1. removes the old contact lettering (navy text on plain white),
2. sets the contact lines again in **Outfit Regular, 11 pt**, at the same left edge and navy ink
   colour as the original lettering, each line centred on its icon as before. 11 pt is a true Word
   point size on the printed A4 page: the script reads how wide the image is placed in the Word
   file (8.27 in for 2564 px = 309.9 px per printed inch), so 11 pt = 47.35 px. Checked against
   the same text typed in Word at Outfit 11 pt: printed heights 2.70 mm vs 2.77 mm, i.e. within
   one image pixel.
3. puts the edited area back into the original JPEG losslessly with `jpegtran -drop`, so every
   pixel outside the contact block is bit-for-bit the original (the script checks this),
4. writes a copy of the Word file in which that picture is the only part replaced; the page
   setup, header layout (full image on page 1, footer and watermark on later pages) and the
   sample text are the original's, byte for byte.

Rebuild: `python3 update-contacts.py` (needs Pillow, numpy and `jpegtran` from libjpeg-turbo),
then export the PDF with LibreOffice without image downsampling:

```bash
soffice --headless --convert-to 'pdf:writer_pdf_Export:{"ReduceImageResolution":{"type":"boolean","value":"false"},"Quality":{"type":"long","value":"100"}}' "CMaxx Solutions Letterhead.docx"
```

Outfit is in `fonts/` (SIL Open Font License, `fonts/OFL.txt`).
