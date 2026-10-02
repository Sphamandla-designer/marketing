"""Builds the multi-page CMaxx letterhead from the updated single-page one.

The original Word file already carries its own multi-page design: page one uses the full
letterhead image (first-page header) and every later page uses the same image cropped to the
watermark and footer (default header), as in the Acceptable Use Policy. So the multi-page
version needs no new design. Only the sample body text changes: it runs over three pages using
the original's own paragraphs (Body Text style, Arial 9 pt) and page breaks. Every other part of
the Word file is copied across unchanged from the updated letterhead.
"""
import re, zipfile
from pathlib import Path

HERE = Path(__file__).parent
SOURCE = HERE / "CMaxx Solutions Letterhead.docx"        # built by update-contacts.py
OUT = HERE / "CMaxx Solutions Letterhead - Multi-page.docx"

with zipfile.ZipFile(SOURCE) as z:
    xml = z.read("word/document.xml").decode()

# The original's own paragraphs, used as templates
text_para = re.search(r'<w:p [^>]*w14:paraId="46DB5481".*?</w:p>', xml).group(0)   # "This is where your text goes."
blank_para = re.search(r'<w:p [^>]*w14:paraId="6745BCAA".*?</w:p>', xml).group(0)  # empty Body Text line

ids = iter(f"{0x1C0FFE00 + i:08X}" for i in range(100))        # fresh, unique paragraph ids


def para(template, text=None, page_break=False):
    p = re.sub(r'w14:paraId="[0-9A-F]+"', f'w14:paraId="{next(ids)}"', template)
    if text is not None:
        p = p.replace("This is where your text goes.", text)
    if page_break:
        p = p.replace("</w:pPr>", '</w:pPr><w:r><w:br w:type="page"/></w:r>', 1)
    return p


added = "".join([
    para(text_para, "This is where your text continues on page 2.", page_break=True),
    para(blank_para),
    para(text_para, "This is where your text continues on page 3.", page_break=True),
    para(blank_para),
])
# insert after page one's text and its empty line, before "Regards"
anchor = re.search(r'<w:p [^>]*w14:paraId="6745BCAA".*?</w:p>', xml)
xml = xml[:anchor.end()] + added + xml[anchor.end():]

with zipfile.ZipFile(SOURCE) as zin, zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as zout:
    for item in zin.infolist():
        data = zin.read(item.filename)
        if item.filename == "word/document.xml":
            data = xml.encode()
        zout.writestr(item, data)
print("wrote", OUT.name)
