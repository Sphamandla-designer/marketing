// Shared Word building blocks for the single- and multi-page letterheads.
const fs = require('fs');
const {
  Paragraph, TextRun, ImageRun, Header, Footer, AlignmentType,
  HorizontalPositionRelativeFrom, VerticalPositionRelativeFrom,
} = require('docx');

const IN = 914400;           // EMU per inch (floating offsets)
const TW = 1440;             // twips per inch (page layout)
const PX = 96;               // docx-js image sizes are in px at 96dpi
const INK = '2E2A4A';
const FONT = 'Century Gothic';
const ADDRESS = 'Suite 1, 97 Main Road, Farrarmere, 1501';
const PHONE = '+27 60 560 6452';
const EMAIL = 'jeneshnee@gmail.com';

const img = (file, type, wIn, hIn, floating) => new ImageRun({
  type, data: fs.readFileSync(`${__dirname}/assets/${file}`),
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

const rule = (L, before, after = 0) => new Paragraph({ spacing: { before, after }, children: [img('rule.png', 'png', L.w - 2 * L.side, 0.04)] });

// Page-one header: full band and panel, large logo, contact block.
// gapAfter pads the header's bottom so that, when the header is taller than the section's top
// margin (multi-page letter), Word pushes the body down to the same place as on the single page.
const fullHeader = (L, gapAfter = 0) => new Header({
  children: [
    new Paragraph({ spacing: { before: 0, after: 0 }, children: [
      img('header.png', 'png', L.w, L.headerH, atPage(0, 0)),
      img('kenzo-logo.png', 'png', L.logo.size, L.logo.size, atPage(L.logo.x, L.logo.y)),
    ] }),
    contact(ADDRESS, 'icon-pin.png', Math.round((L.contactTop - L.headerDist - 0.17) * TW)),
    contact(PHONE, 'icon-phone.png'),
    contact(EMAIL, 'icon-mail.png'),
    rule(L, 140, gapAfter),
  ],
});

const standardFooter = (L) => new Footer({
  children: [new Paragraph({ children: [img('footer.png', 'png', L.w, L.footerH, atPage(0, L.h - L.footerH))] })],
});

module.exports = {
  TW, INK, FONT, ADDRESS, PHONE, EMAIL,
  img, atPage, contact, rule, fullHeader, standardFooter,
};
