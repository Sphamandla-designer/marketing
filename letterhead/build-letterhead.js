// Builds the A4 and Letter Word templates from the rendered artwork in assets/.
const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, ImageRun, Header, Footer, AlignmentType,
  HorizontalPositionRelativeFrom, VerticalPositionRelativeFrom,
} = require('docx');
const { PAPERS, layout } = require('./layout');

const IN = 914400;           // EMU per inch (floating offsets)
const TW = 1440;             // twips per inch (page layout)
const PX = 96;               // docx-js image sizes are in px at 96dpi
const INK = '2E2A4A';
const FONT = 'Century Gothic';

const img = (file, type, wIn, hIn, floating) => new ImageRun({
  type, data: fs.readFileSync(`assets/${file}`),
  transformation: { width: wIn * PX, height: hIn * PX },
  ...(floating && { floating }),
});
const atPage = (xIn, yIn, behind = true) => ({
  horizontalPosition: { relative: HorizontalPositionRelativeFrom.PAGE, offset: Math.round(xIn * IN) },
  verticalPosition: { relative: VerticalPositionRelativeFrom.PAGE, offset: Math.round(yIn * IN) },
  behindDocument: behind, allowOverlap: true,
});

const contact = (text, icon, before = 0) => new Paragraph({
  alignment: AlignmentType.RIGHT,
  spacing: { before, after: 110, line: 240 },
  children: [
    new TextRun({ text, font: FONT, size: 19, color: INK, characterSpacing: 6 }),
    new TextRun({ text: '   ', font: FONT, size: 19 }),
    img(icon, 'png', 0.2, 0.2),
  ],
});

function build(paper) {
  const L = layout(paper);
  const header = new Header({
    children: [
      new Paragraph({ spacing: { before: 0, after: 0 }, children: [
        img('header.png', 'png', L.w, L.headerH, atPage(0, 0)),
        img('kenzo-logo.png', 'png', L.logo.size, L.logo.size, atPage(L.logo.x, L.logo.y)),
      ] }),
      contact('Suite 1, 97 Main Road, Farrarmere, 1501', 'icon-pin.png', Math.round((L.contactTop - L.headerDist - 0.17) * TW)),
      contact('+27 60 560 6452', 'icon-phone.png'),
      contact('jeneshnee@gmail.com', 'icon-mail.png'),
      new Paragraph({ spacing: { before: 140 }, children: [img('rule.png', 'png', L.w - 2 * L.side, 0.04)] }),
    ],
  });

  const footer = new Footer({
    children: [new Paragraph({ children: [img('footer.png', 'png', L.w, L.footerH, atPage(0, L.h - L.footerH))] })],
  });

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
      headers: { default: header },
      footers: { default: footer },
      children: [new Paragraph({ children: [new TextRun('')] })],
    }],
  });

  const out = `Kenzo-Nail-Bar-Letterhead-${L.label}.docx`;
  return Packer.toBuffer(doc).then(b => { fs.writeFileSync(out, b); console.log('wrote', out); });
}

Promise.all(Object.keys(PAPERS).map(build));
