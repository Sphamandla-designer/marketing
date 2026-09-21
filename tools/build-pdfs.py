#!/usr/bin/env python3
"""Render the repo's markdown docs to PDF.

Writes one PDF per document plus a combined pack into dist/pdf/.

Requires: `pip install markdown` and a Chromium binary. Set CHROME to point at
one if it isn't at the default Playwright location.

    python3 tools/build-pdfs.py
"""
import os
import pathlib
import re
import subprocess
import sys

import markdown

REPO = pathlib.Path(__file__).resolve().parent.parent
OUT = REPO / "dist" / "pdf"
TMP = OUT / ".html"
CHROME = os.environ.get("CHROME", "/opt/pw-browsers/chromium")

# (source markdown, output slug, section kicker)
DOCS = [
    ("README.md", "00-overview", "Overview"),
    ("creative/brief.md", "01-creative-brief", "Creative"),
    ("creative/shot-list.md", "02-shot-list", "Creative"),
    ("creative/prompt-library.md", "03-prompt-library", "Creative"),
    ("copy/captions.md", "04-channel-copy", "Copy"),
    ("assets/workshop/README.md", "05-assets-note", "Assets"),
]

MD_EXTENSIONS = ["tables", "fenced_code", "sane_lists", "attr_list"]

CSS = """
@page { size: A4; margin: 20mm 18mm 18mm 18mm; }
* { box-sizing: border-box; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body {
  font-family: "Georgia", "Times New Roman", serif;
  font-size: 10.5pt; line-height: 1.6; color: #1c1917;
  margin: 0; padding: 0;
}
.kicker {
  font-family: "Helvetica Neue", Arial, sans-serif;
  font-size: 7.5pt; letter-spacing: .16em; text-transform: uppercase;
  color: #a16207; font-weight: 700; margin: 0 0 4px 0;
}
.doc-meta {
  font-family: "Helvetica Neue", Arial, sans-serif;
  font-size: 7.5pt; color: #a8a29e; letter-spacing: .06em;
  text-transform: uppercase; margin: 0 0 22px 0;
  border-bottom: 1px solid #e7e5e4; padding-bottom: 14px;
}
h1 {
  font-family: "Helvetica Neue", Arial, sans-serif;
  font-size: 22pt; line-height: 1.15; font-weight: 700;
  letter-spacing: -.01em; color: #0c0a09; margin: 0 0 10px 0;
}
h2 {
  font-family: "Helvetica Neue", Arial, sans-serif;
  font-size: 13pt; font-weight: 700; color: #0c0a09;
  margin: 26px 0 8px 0; letter-spacing: -.005em;
  break-after: avoid; page-break-after: avoid;
}
h3 {
  font-family: "Helvetica Neue", Arial, sans-serif;
  font-size: 10.5pt; font-weight: 700; color: #292524;
  margin: 18px 0 6px 0; break-after: avoid; page-break-after: avoid;
}
p { margin: 0 0 10px 0; }
ul, ol { margin: 0 0 12px 0; padding-left: 20px; }
li { margin: 0 0 5px 0; }
strong { color: #0c0a09; }
a { color: #92400e; text-decoration: none; word-break: break-all; }
hr { border: 0; border-top: 1px solid #e7e5e4; margin: 24px 0; }
blockquote {
  margin: 12px 0 16px 0; padding: 12px 16px;
  background: #fafaf9; border-left: 3px solid #d6d3d1;
  color: #44403c; font-size: 10pt; break-inside: avoid;
}
blockquote p:last-child { margin-bottom: 0; }
code {
  font-family: "SFMono-Regular", Menlo, Consolas, monospace;
  font-size: 8.8pt; background: #f5f5f4; color: #7c2d12;
  padding: 1px 4px; border-radius: 3px;
}
pre {
  background: #1c1917; color: #e7e5e4; padding: 12px 14px;
  border-radius: 5px; overflow-wrap: break-word; white-space: pre-wrap;
  font-size: 8.5pt; line-height: 1.5; break-inside: avoid;
  font-family: "SFMono-Regular", Menlo, Consolas, monospace;
}
pre code { background: none; color: inherit; padding: 0; font-size: inherit; }
table {
  width: 100%; border-collapse: collapse; margin: 12px 0 16px 0;
  font-family: "Helvetica Neue", Arial, sans-serif; font-size: 9pt;
  break-inside: avoid;
}
th {
  text-align: left; background: #f5f5f4; color: #0c0a09;
  font-size: 7.5pt; letter-spacing: .08em; text-transform: uppercase;
  padding: 8px 10px; border-bottom: 1.5px solid #d6d3d1;
}
td { padding: 8px 10px; border-bottom: 1px solid #e7e5e4; vertical-align: top; }
"""

COVER_CSS = """
.cover { height: 247mm; display: flex; flex-direction: column; justify-content: center;
         break-after: page; page-break-after: always; }
.cover h1 { font-size: 34pt; margin: 0 0 14px 0; }
.cover .sub { font-family: "Helvetica Neue", Arial, sans-serif; font-size: 11pt;
              color: #57534e; max-width: 120mm; line-height: 1.5; }
.cover .rule { width: 46px; height: 3px; background: #a16207; margin: 0 0 22px 0; }
.cover .toc { margin-top: 40px; font-family: "Helvetica Neue", Arial, sans-serif; font-size: 9.5pt; }
.cover .toc div { padding: 7px 0; border-bottom: 1px solid #e7e5e4; color: #44403c; }
.cover .toc span { color: #a8a29e; }
section { break-before: page; page-break-before: always; }
section:first-of-type { break-before: auto; page-break-before: auto; }
"""


def convert(md_path):
    """Return (title, html_body) for a markdown file, title taken from its H1."""
    src = (REPO / md_path).read_text(encoding="utf-8")
    body = markdown.markdown(src, extensions=MD_EXTENSIONS)
    m = re.search(r"<h1[^>]*>(.*?)</h1>", body, re.S)
    title = re.sub(r"<[^>]+>", "", m.group(1)).strip() if m else md_path
    return title, body


def section(md_path, kicker, body):
    return (
        f'<section><p class="kicker">{kicker}</p>'
        f'<p class="doc-meta">AI Training Workshop &middot; {md_path}</p>'
        f"{body}</section>"
    )


def to_pdf(html, slug):
    html_file = TMP / f"{slug}.html"
    html_file.write_text(html, encoding="utf-8")
    pdf = OUT / f"{slug}.pdf"
    subprocess.run(
        [CHROME, "--headless", "--disable-gpu", "--no-sandbox",
         "--no-pdf-header-footer", f"--print-to-pdf={pdf}", html_file.as_uri()],
        check=True, capture_output=True,
    )
    print(f"  {pdf.relative_to(REPO)}")


def page(title, css, body):
    return (
        '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">'
        f"<title>{title}</title><style>{css}</style></head>"
        f"<body>{body}</body></html>"
    )


def main():
    if not os.path.exists(CHROME):
        sys.exit(f"Chromium not found at {CHROME} — set CHROME to its path.")
    OUT.mkdir(parents=True, exist_ok=True)
    TMP.mkdir(parents=True, exist_ok=True)

    toc, sections = [], []
    for md_path, slug, kicker in DOCS:
        if not (REPO / md_path).exists():
            print(f"  skipped (missing): {md_path}")
            continue
        title, body = convert(md_path)
        to_pdf(page(title, CSS, section(md_path, kicker, body)), slug)
        toc.append(f'<div>{title} <span>&nbsp;·&nbsp; {md_path}</span></div>')
        sections.append(section(md_path, kicker, body))

    cover = (
        '<div class="cover"><p class="kicker">Marketing Materials</p>'
        '<div class="rule"></div><h1>AI Training Workshop</h1>'
        '<p class="sub">Visual direction, shot list, prompt library and '
        "channel-ready copy for a premium AI training workshop aimed at South "
        'African marketing professionals.</p>'
        f'<div class="toc">{"".join(toc)}</div></div>'
    )
    to_pdf(
        page("AI Training Workshop — Marketing Materials",
             CSS + COVER_CSS, cover + "".join(sections)),
        "workshop-marketing-pack",
    )


if __name__ == "__main__":
    main()
