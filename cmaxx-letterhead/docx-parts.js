// Shared Word building blocks for the CMaxx single- and multi-page letterheads.
const fs = require('fs');
const {
  Paragraph, TextRun, ImageRun, Header, Footer, TabStopType,
  HorizontalPositionRelativeFrom, VerticalPositionRelativeFrom,
} = require('docx');

const IN = 914400;           // EMU per inch (floating offsets)
const TW = 1440;             // twips per inch (page layout)
const PX = 96;               // docx-js image sizes are in px at 96dpi
const NAVY = '21202E';
const FONT = 'Calibri';
const LOGO_RATIO = 754 / 424;                    // assets/cmaxx-logo.png

// Contact details exactly as on the current letterhead
const PHONE = '083 212 7065';
const EMAIL = 'admin@cmaxxsolutions.co.za';
const WEB = 'www.cmaxxsolutions.co.za';
const ADDRESS = ['24 Walton Ave, Carlswald,', 'Midrand, 1684'];

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
const logo = (x, y, h) => img('cmaxx-logo.png', 'png', h * LOGO_RATIO, h, atPage(x, y, false));

// One line of the contact column: orange icon, tab, text. The hanging indent puts the text at the
// same x on every line, so a second address line (no icon) lines up under the first.
const ICON = 0.22, TEXT_OFFSET = 0.36;
const contactLine = (L, text, icon, { before = 0, after = 110 } = {}) => {
  const textX = Math.round((L.contactX - L.side + TEXT_OFFSET) * TW);
  return new Paragraph({
    indent: { left: textX, ...(icon && { hanging: Math.round(TEXT_OFFSET * TW) }) },
    tabStops: [{ type: TabStopType.LEFT, position: textX }],
    spacing: { before, after, line: 240 },
    children: [
      ...(icon ? [img(icon, 'png', ICON, ICON), new TextRun({ text: '\t' })] : []),
      // raised 4pt so the text centres on the icon (inline images sit on the baseline)
      new TextRun({ text, font: FONT, size: 22, color: NAVY, position: '8' }),
    ],
  });
};

// Page-one header: red sweep with the logo, contact column, optional watermark.
// gapAfter pads the header's bottom so that, when the header is taller than the section's top
// margin (multi-page letter), Word pushes the body down to the same place as on the single page.
const fullHeader = (L, { gapAfter = 0, watermark = true } = {}) => {
  const W = L.watermark.size;
  return new Header({
    children: [
      new Paragraph({ spacing: { before: 0, after: 0 }, children: [
        img('header.png', 'png', L.w, L.headerH, atPage(0, 0)),
        logo(L.logo.x, L.logo.y, L.logo.h),
        ...(watermark ? [img('watermark.png', 'png', W, W, atPage((L.w - W) / 2, L.h - L.footerH - L.watermark.bottomGap - W))] : []),
      ] }),
      contactLine(L, PHONE, 'icon-phone.png', { before: Math.round((L.contactTop - L.headerDist - 0.17) * TW) }),
      contactLine(L, EMAIL, 'icon-mail.png'),
      contactLine(L, WEB, 'icon-web.png'),
      contactLine(L, ADDRESS[0], 'icon-pin.png', { after: 0 }),
      contactLine(L, ADDRESS[1], null, { after: gapAfter }),
    ],
  });
};

const standardFooter = (L) => new Footer({
  children: [new Paragraph({ children: [img('footer.png', 'png', L.w, L.footerH, atPage(0, L.h - L.footerH))] })],
});

module.exports = {
  TW, NAVY, FONT, PHONE, EMAIL, WEB, ADDRESS,
  img, atPage, logo, fullHeader, standardFooter,
};
