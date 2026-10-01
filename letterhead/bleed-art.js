// Renders the bleed-extended header/footer art onto a blank trim+bleed page (PDF),
// used by make-print.py as the background of the print-shop PDF.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const { layout, BLEED: B } = require('./layout');
const [paper, out] = process.argv.slice(2);
const L = layout(paper), W = L.w + 2 * B, H = L.h + 2 * B;
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
  const p = await b.newPage();
  await p.goto('file://' + __dirname + '/assets/');
  await p.setContent(`<style>@page{size:${W}in ${H}in;margin:0}body{margin:0}img{position:absolute;left:0;width:${W}in}</style>
    <img src="file://${__dirname}/assets/header-bleed-${paper}.png" style="top:0;height:${L.headerH + B}in">
    <img src="file://${__dirname}/assets/footer-bleed-${paper}.png" style="bottom:0;height:${L.footerH + B}in">`, { waitUntil: 'load' });
  await p.pdf({ path: out, width: `${W}in`, height: `${H}in`, printBackground: true, pageRanges: '1' });
  await b.close();
})();
