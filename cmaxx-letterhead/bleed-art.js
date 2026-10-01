// Renders bleed-extended header/footer art onto a blank trim+bleed page (PDF),
// used by make-print.py as the background of the print-shop PDF.
//   node bleed-art.js <paper> <out.pdf> [header art] [footer art]
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const { layout, BLEED: B } = require('./layout');
const [paper, out, header = 'header', footer = 'footer'] = process.argv.slice(2);
const L = layout(paper), W = L.w + 2 * B, H = L.h + 2 * B;
const heights = { header: L.headerH, 'header-slim': L.slimH, footer: L.footerH, 'footer-closing': L.closingH };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
  const p = await b.newPage();
  await p.goto('file://' + __dirname + '/assets/');
  await p.setContent(`<style>@page{size:${W}in ${H}in;margin:0}body{margin:0}img{position:absolute;left:0;width:${W}in}</style>
    <img src="file://${__dirname}/assets/${header}-bleed-${paper}.png" style="top:0;height:${heights[header] + B}in">
    <img src="file://${__dirname}/assets/${footer}-bleed-${paper}.png" style="bottom:0;height:${heights[footer] + B}in">`, { waitUntil: 'load' });
  await p.pdf({ path: out, width: `${W}in`, height: `${H}in`, printBackground: true, pageRanges: '1' });
  await b.close();
})();
