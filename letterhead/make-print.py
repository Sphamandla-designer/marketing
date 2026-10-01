"""Builds the print PDFs from the Word templates.

  Kenzo-Nail-Bar-Letterhead-<size>.pdf        trim size, for office/desktop printers
  Kenzo-Nail-Bar-Letterhead-<size>-PRESS.pdf  trim + 3mm bleed with TrimBox/BleedBox, for a print shop

Needs LibreOffice Writer and Questrial installed as the "Century Gothic" substitute (see README).
"""
import json, subprocess, sys, tempfile
from pathlib import Path
from pypdf import PdfReader, PdfWriter, Transformation
from pypdf.generic import RectangleObject

HERE = Path(__file__).parent
PT = 72
papers = json.loads(subprocess.check_output(
    ["node", "-e", "const {PAPERS,BLEED}=require('./layout');console.log(JSON.stringify({PAPERS,BLEED}))"], cwd=HERE))
B = papers["BLEED"] * PT

with tempfile.TemporaryDirectory() as tmp:
    for key, p in papers["PAPERS"].items():
        name = f"Kenzo-Nail-Bar-Letterhead-{p['label']}"
        subprocess.run(["soffice", "--headless", "--convert-to", "pdf", "--outdir", str(HERE), str(HERE / f"{name}.docx")],
                       check=True, capture_output=True, timeout=300)
        trim_pdf = HERE / f"{name}.pdf"

        art_pdf = Path(tmp) / f"art-{key}.pdf"
        subprocess.run(["node", "bleed-art.js", key, str(art_pdf)], cwd=HERE, check=True)

        page = PdfReader(art_pdf).pages[0]
        letter = PdfReader(trim_pdf).pages[0]
        w, h = float(letter.mediabox.width), float(letter.mediabox.height)
        page.merge_transformed_page(letter, Transformation().translate(B, B))
        page.mediabox = page.bleedbox = RectangleObject([0, 0, w + 2 * B, h + 2 * B])
        page.trimbox = page.artbox = RectangleObject([B, B, B + w, B + h])
        out = PdfWriter()
        out.add_page(page)
        out.add_metadata({"/Title": "Kenzo Nail Bar Letterhead (print, 3mm bleed)"})
        with open(HERE / f"{name}-PRESS.pdf", "wb") as f:
            out.write(f)
        print("wrote", trim_pdf.name, "and", f"{name}-PRESS.pdf")
