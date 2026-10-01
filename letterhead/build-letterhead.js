// Builds Kenzo-Nail-Bar-Letterhead.docx from the rendered artwork in assets/.
const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, ImageRun, Header, Footer, AlignmentType,
  HorizontalPositionRelativeFrom, VerticalPositionRelativeFrom,
} = require('docx');

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
  spacing: { before, after: 50, line: 240 },
  children: [
    new TextRun({ text, font: FONT, size: 19, color: INK, characterSpacing: 6 }),
    new TextRun({ text: '   ', font: FONT, size: 19 }),
    img(icon, 'png', 0.2, 0.2),
  ],
});

const header = new Header({
  children: [
    new Paragraph({ children: [
      img('header.png', 'png', 8.5, 1.4, atPage(0, 0)),
      img('kenzo-logo.png', 'png', 1.95, 1.95, atPage(0.6, 0.24)),
    ] }),
    contact('Suite 1, 97 Main Road, Farrarmere, 1501', 'icon-pin.png', 1.42 * TW),
    contact('+27 60 560 6452', 'icon-phone.png'),
    contact('jeneshnee@gmail.com', 'icon-mail.png'),
    new Paragraph({ spacing: { before: 140 }, children: [img('rule.png', 'png', 6.8, 0.04)] }),
  ],
});

const footer = new Footer({
  children: [new Paragraph({ children: [img('footer.png', 'png', 8.5, 0.46, atPage(0, 11 - 0.46))] })],
});

const doc = new Document({
  creator: 'Kenzo Nail Bar',
  title: 'Kenzo Nail Bar Letterhead',
  styles: { default: { document: { run: { font: FONT, size: 21, color: INK } } } },
  sections: [{
    properties: { page: {
      size: { width: 12240, height: 15840 },  // US Letter, as in the original
      margin: { top: 2.75 * TW, bottom: 1.1 * TW, left: 0.85 * TW, right: 0.85 * TW, header: 0, footer: 0 },
    } },
    headers: { default: header },
    footers: { default: footer },
    children: [new Paragraph({ children: [new TextRun('')] })],
  }],
});

Packer.toBuffer(doc).then(b => {
  fs.writeFileSync('Kenzo-Nail-Bar-Letterhead.docx', b);
  console.log('wrote Kenzo-Nail-Bar-Letterhead.docx');
});
