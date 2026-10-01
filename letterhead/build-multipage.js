// Builds the multi-page letter template (A4 and Letter): a first page with the full header,
// continuation pages with a slim header and page numbers, and a closing page whose footer
// carries the contact details.
//
// Word only distinguishes "first page" from "other pages" within a section, so the closing
// page is its own section with its own footer.
const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Header, Footer, AlignmentType, PageNumber, SectionType, BorderStyle,
} = require('docx');
const { PAPERS, layout } = require('./layout');
const { TW, INK, FONT, ADDRESS, PHONE, EMAIL, img, atPage, rule, fullHeader, standardFooter } = require('./docx-parts');

const MUTED = '8A86A0';
const FIRST_PAGE_GAP = 560;   // twips below page one's rule, so its body starts ~2.75in down

// Continuation header: slim band, small logo, page number above the rule
const slimHeader = (L) => new Header({
  children: [
    new Paragraph({ spacing: { before: 0, after: 0 }, children: [
      img('header-slim.png', 'png', L.w, L.slimH, atPage(0, 0)),
      img('kenzo-logo.png', 'png', L.slimLogo.size, L.slimLogo.size, atPage(L.slimLogo.x, L.slimLogo.y)),
    ] }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: Math.round((1.24 - L.headerDist - 0.17) * TW), after: 0 },
      children: [
        new TextRun({ text: 'Page ', font: FONT, size: 17, color: MUTED, characterSpacing: 10 }),
        new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 17, color: INK, bold: true }),
        new TextRun({ text: ' of ', font: FONT, size: 17, color: MUTED, characterSpacing: 10 }),
        new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: 17, color: INK, bold: true }),
      ],
    }),
    rule(L, 130),
  ],
});

// Closing footer: deep band with the business name and contact line reversed out in white
const closingFooter = (L) => {
  const white = (text, extra = {}) => new TextRun({ text, font: FONT, size: 16, color: 'FFFFFF', ...extra });
  const gap = () => white('      ');
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER, spacing: { after: 70 },
        children: [
          img('footer-closing.png', 'png', L.w, L.closingH, atPage(0, L.h - L.closingH)),
          white('KENZO  ·  NAIL BAR', { size: 15, characterSpacing: 60 }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER, spacing: { after: 0 },
        children: [
          img('icon-pin-light.png', 'png', 0.17, 0.17), white('  ' + ADDRESS), gap(),
          img('icon-phone-light.png', 'png', 0.17, 0.17), white('  ' + PHONE), gap(),
          img('icon-mail-light.png', 'png', 0.17, 0.17), white('  ' + EMAIL),
        ],
      }),
    ],
  });
};

// Placeholder letter body
const P = (text, opts = {}) => new Paragraph({
  spacing: { after: 160, line: 300 },
  ...opts.para,
  children: [new TextRun({ text, color: opts.color || INK, bold: opts.bold, italics: opts.italics })],
});
const hint = (text) => P(text, { color: MUTED });
const blank = () => new Paragraph({ spacing: { after: 0 }, children: [] });

const firstPageBody = [
  P('[Date]'),
  blank(),
  ...['[Recipient name]', '[Company]', '[Street address]', '[City, postal code]']
    .map(t => new Paragraph({ spacing: { after: 0, line: 280 }, children: [new TextRun(t)] })),
  blank(),
  P('Re: [Subject of the letter]', { bold: true, para: { spacing: { before: 120, after: 200 } } }),
  P('Dear [Recipient name],'),
  hint('[Start your letter here. Page one carries the full Kenzo Nail Bar header with the address, ' +
       'phone number and email, so it is the page the reader sees first.]'),
  hint('[Keep typing. When the text runs past this page, Word carries it onto a continuation page ' +
       'with the slim header and page number, like the next page.]'),
  hint('[Replace these bracketed notes with your own text.]'),
];

const middlePageBody = [
  new Paragraph({ pageBreakBefore: true, spacing: { after: 160, line: 300 },
    children: [new TextRun({ text: '[Continuation page. The slim header leaves more of the page for text, ' +
      'and the page number updates on its own.]', color: MUTED })] }),
  hint('[Add or remove continuation pages as needed. Every page between the first and the closing ' +
       'page gets this design automatically.]'),
];

const closingPageBody = [
  hint('[Closing page. Finish the letter here. This page has the signature block and a footer ' +
       'that repeats the contact details, so the reader has them at the end of the letter.]'),
  P('Kind regards,', { para: { spacing: { before: 240, after: 0 } } }),
  new Paragraph({  // signature line
    spacing: { before: 720, after: 60 },
    indent: { right: Math.round(4.2 * TW) },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'C64BC9', space: 1 } },
    children: [],
  }),
  new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: '[Your name]', bold: true })] }),
  new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: '[Job title], Kenzo Nail Bar', color: MUTED })] }),
];

function build(paper) {
  const L = layout(paper);
  const size = { width: Math.round(L.w * TW), height: Math.round(L.h * TW) };
  const sides = { left: L.side * TW, right: L.side * TW, header: L.headerDist * TW, footer: L.footerDist * TW };

  const doc = new Document({
    creator: 'Kenzo Nail Bar',
    title: 'Kenzo Nail Bar Letter (multi-page)',
    styles: { default: { document: { run: { font: FONT, size: 21, color: INK } } } },
    sections: [
      {
        // First page + continuation pages. The top margin fits the slim header; on page one the
        // taller full header pushes the body down past it.
        properties: {
          titlePage: true,
          page: { size, margin: { ...sides, top: Math.round(L.slimTop * TW), bottom: Math.round(L.bottom * TW) } },
        },
        headers: { first: fullHeader(L, FIRST_PAGE_GAP), default: slimHeader(L) },
        footers: { first: standardFooter(L), default: standardFooter(L) },
        children: [
          ...firstPageBody,
          ...middlePageBody,
        ],
      },
      {
        // Closing page
        properties: {
          type: SectionType.NEXT_PAGE,
          page: { size, margin: { ...sides, top: Math.round(L.slimTop * TW), bottom: Math.round(L.closingBottom * TW) } },
        },
        headers: { default: slimHeader(L) },
        footers: { default: closingFooter(L) },
        children: closingPageBody,
      },
    ],
  });

  const out = `Kenzo-Nail-Bar-Letter-MultiPage-${L.label}.docx`;
  return Packer.toBuffer(doc).then(b => { fs.writeFileSync(out, b); console.log('wrote', out); });
}

Promise.all(Object.keys(PAPERS).map(build));
