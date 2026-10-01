"""Builds the print PDFs from the Word templates.

  <name>.pdf        trim size, for office/desktop printers
  <name>-PRESS.pdf  trim + 3mm bleed with TrimBox/BleedBox, for a print shop

Needs LibreOffice Writer and Questrial installed as the "Century Gothic" substitute (see README).
"""
import json, subprocess, tempfile
from pathlib import Path
from pypdf import PdfReader, PdfWriter, Transformation
from pypdf.generic import RectangleObject

HERE = Path(__file__).parent
PT = 72
cfg = json.loads(subprocess.check_output(
    ["node", "-e", "const {PAPERS,BLEED}=require('./layout');console.log(JSON.stringify({PAPERS,BLEED}))"], cwd=HERE))
B = cfg["BLEED"] * PT


def single_page_art(i, n):
    return "header", "footer"


def multi_page_art(i, n):
    """First page: full header. Last page: closing footer. Everything else: slim header."""
    header = "header" if i == 0 else "header-slim"
    footer = "footer-closing" if i == n - 1 else "footer"
    return header, footer


DOCUMENTS = [("Kenzo-Nail-Bar-Letterhead-{label}", single_page_art),
             ("Kenzo-Nail-Bar-Letter-MultiPage-{label}", multi_page_art)]

with tempfile.TemporaryDirectory() as tmp:
    for key, paper in cfg["PAPERS"].items():
        for pattern, art_for in DOCUMENTS:
            name = pattern.format(label=paper["label"])
            subprocess.run(["soffice", "--headless", "--convert-to", "pdf", "--outdir", str(HERE), str(HERE / f"{name}.docx")],
                           check=True, capture_output=True, timeout=300)
            trim_pages = PdfReader(HERE / f"{name}.pdf").pages
            out = PdfWriter()
            for i, trim in enumerate(trim_pages):
                header, footer = art_for(i, len(trim_pages))
                art_pdf = Path(tmp) / f"art-{key}-{header}-{footer}.pdf"
                if not art_pdf.exists():
                    subprocess.run(["node", "bleed-art.js", key, str(art_pdf), header, footer], cwd=HERE, check=True)
                page = PdfReader(art_pdf).pages[0]
                w, h = float(trim.mediabox.width), float(trim.mediabox.height)
                page.merge_transformed_page(trim, Transformation().translate(B, B))
                page.mediabox = page.bleedbox = RectangleObject([0, 0, w + 2 * B, h + 2 * B])
                page.trimbox = page.artbox = RectangleObject([B, B, B + w, B + h])
                out.add_page(page)
            out.add_metadata({"/Title": f"{name} (print, 3mm bleed)"})
            with open(HERE / f"{name}-PRESS.pdf", "wb") as f:
                out.write(f)
            print(f"wrote {name}.pdf and {name}-PRESS.pdf ({len(trim_pages)} pages)")
