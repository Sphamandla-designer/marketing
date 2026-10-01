// Builds the single-page A4 and Letter Word templates from the rendered artwork in assets/.
const fs = require('fs');
const { Document, Packer, Paragraph, TextRun } = require('docx');
const { PAPERS, layout } = require('./layout');
const { TW, INK, FONT, fullHeader, standardFooter } = require('./docx-parts');

function build(paper) {
  const L = layout(paper);
  const doc = new Document({
    creator: 'Kenzo Nail Bar',
    title: 'Kenzo Nail Bar Letterhead',
    styles: { default: { document: { run: { font: FONT, size: 21, color: INK } } } },
    sections: [{
      properties: { page: {
        size: { width: Math.round(L.w * TW), height: Math.round(L.h * TW) },
        margin: { top: L.top * TW, bottom: Math.round(L.bottom * TW), left: L.side * TW, right: L.side * TW,
                  header: L.headerDist * TW, footer: L.footerDist * TW },
      } },
      headers: { default: fullHeader(L) },
      footers: { default: standardFooter(L) },
      children: [new Paragraph({ children: [new TextRun('')] })],
    }],
  });

  const out = `Kenzo-Nail-Bar-Letterhead-${L.label}.docx`;
  return Packer.toBuffer(doc).then(b => { fs.writeFileSync(out, b); console.log('wrote', out); });
}

Promise.all(Object.keys(PAPERS).map(build));
