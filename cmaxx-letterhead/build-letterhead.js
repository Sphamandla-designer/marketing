// Builds the single-page CMaxx A4 and Letter Word templates from the rendered artwork in assets/.
const fs = require('fs');
const { Document, Packer, Paragraph, TextRun } = require('docx');
const { PAPERS, layout } = require('./layout');
const { TW, NAVY, FONT, fullHeader, standardFooter } = require('./docx-parts');

function build(paper) {
  const L = layout(paper);
  const doc = new Document({
    creator: 'CMaxx WiFi Solutions',
    title: 'CMaxx WiFi Solutions Letterhead',
    styles: { default: { document: { run: { font: FONT, size: 22, color: NAVY } } } },
    sections: [{
      properties: { page: {
        size: { width: Math.round(L.w * TW), height: Math.round(L.h * TW) },
        margin: { top: Math.round(L.top * TW), bottom: Math.round(L.bottom * TW), left: L.side * TW, right: L.side * TW,
                  header: L.headerDist * TW, footer: L.footerDist * TW },
      } },
      headers: { default: fullHeader(L) },
      footers: { default: standardFooter(L) },
      children: [new Paragraph({ children: [new TextRun('')] })],
    }],
  });

  const out = `CMaxx-Letterhead-${L.label}.docx`;
  return Packer.toBuffer(doc).then(b => { fs.writeFileSync(out, b); console.log('wrote', out); });
}

Promise.all(Object.keys(PAPERS).map(build));
