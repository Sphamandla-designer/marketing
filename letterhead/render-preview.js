// Renders preview.html to a PNG and PDF proof of the letterhead.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
  const p = await b.newPage({ viewport: { width: 816, height: 1056 }, deviceScaleFactor: 2 });
  await p.goto('file://' + __dirname + '/preview.html', { waitUntil: 'networkidle' }).catch(() => {});
  await p.screenshot({ path: 'Kenzo-Nail-Bar-Letterhead-preview.png' });
  await p.pdf({ path: 'Kenzo-Nail-Bar-Letterhead.pdf', width: '8.5in', height: '11in', printBackground: true });
  await b.close();
})();
