# Master documents (SA-03A, SA-03B, SA-03C, SA-04, SA-05)

Printable one-page A4 masters that support SA-01, SA-02 and SA-OC. The design
matches those forms; the header crest and positions are measured from SA-01.

**All learner names, educators, subject class codes and ATP codes are
PLACEHOLDERS.** Replace the data before printing.

## Regenerate

```
cd generator
pip install reportlab pymupdf
python3 build.py      # writes the five PDFs into master-documents/
python3 check.py      # page count, margins, text sizes, numbering, code cross-checks
```

- Real data goes in `generator/data.py`. All five documents read from it, so
  names, position numbers and codes stay consistent between documents.
- The build stops with an error rather than print text that overflows its box
  or a page that runs into the footer.
- `Register-Class-BLANK (10).pdf` (SA-01) must stay in the repository root;
  the header is measured from it.
- Fonts: Roboto and Roboto Mono (SIL Open Font License, see `generator/fonts`).
