/**
 * Generates the blank (unfilled) PDF + PNG for both forms by driving the real
 * "Download blank form" button in headless Chromium, so what is saved here is
 * exactly what an educator gets from the page.
 *
 * Usage: npm run blanks   (writes to qa/output/blank/)
 */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const outDir = path.join(here, 'output', 'blank');
const PORT = 8124;

const PAGES = [
  { name: 'Register Class', page: 'register-class.html' },
  { name: 'Subject Class', page: 'subject-class.html' },
];

async function run() {
  fs.mkdirSync(outDir, { recursive: true });
  const server = spawn(process.execPath, [path.join(root, 'server.js')], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 600));
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium' });
  let failures = 0;
  try {
    for (const target of PAGES) {
      const ctx = await browser.newContext({ viewport: { width: 1200, height: 1000 }, acceptDownloads: true });
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
      await page.goto(`http://localhost:${PORT}/${target.page}`);
      await page.waitForSelector('#form-root .meta-grid');

      const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#btn-blank')]);
      await dl.saveAs(path.join(outDir, dl.suggestedFilename()));
      await page.waitForFunction(() => window.__lastBlank);
      const info = await page.evaluate(() => window.__lastBlank);
      console.log(`[blank] ${target.name}: ${info.pdfName} (${info.pageCount} page(s)); images ${info.images.map((i) => `${i.filename} ${i.w}x${i.h}`).join(', ')}`);

      // a blank must not be padded out with extra pages
      if (info.pageCount > 2) { failures++; console.log(`  FAIL: blank form should not need ${info.pageCount} pages`); }

      // the design brief is that nothing on the form has a square corner;
      // the barcode modules are the one deliberate exception
      // save the blank PNGs too, so the image output is reviewable alongside the PDF
      const pngs = await page.evaluate(async () => {
        const { generateBlank } = await import('./js/export.js');
        const res = await generateBlank(document.body.dataset.formType);
        const toB64 = (blob) => new Promise((resolve) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result).split(',')[1]);
          r.readAsDataURL(blob);
        });
        return Promise.all(res.images.map(async (im) => ({ filename: im.filename, b64: await toB64(im.blob) })));
      });
      for (const im of pngs) fs.writeFileSync(path.join(outDir, im.filename), Buffer.from(im.b64, 'base64'));
      console.log(`  saved ${pngs.length} PNG page(s): ${pngs.map((i) => i.filename).join(', ')}`);

      const corners = await page.evaluate(async () => {
        const { buildFormDocument } = await import('./js/export.js');
        const { createEmptyData } = await import('./js/model.js');
        const type = document.body.dataset.formType;
        const { doc } = await buildFormDocument(createEmptyData(type), { blank: true, docNumber: 'SA01BLANK', identifier: 'BLANK' });
        const square = [];
        doc.pages.forEach((p, pi) => p.ops.forEach((op) => {
          if (op.t === 'rect' && !op.r && op.fill !== '#000000') square.push({ page: pi + 1, x: op.x, y: op.y, w: op.w, h: op.h });
        }));
        return { total: doc.pages.reduce((a, p) => a + p.ops.filter((o) => o.t === 'rect').length, 0), square };
      });
      console.log(`  rounded: ${corners.total - corners.square.length}/${corners.total} rectangles; square corners outside the barcode: ${corners.square.length}`);
      if (corners.square.length) { failures++; console.log('  FAIL: square corners at', JSON.stringify(corners.square.slice(0, 5))); }

      if (errors.length) { failures++; console.log('  FAIL: browser errors:', errors); }
      await ctx.close();
    }
  } finally {
    await browser.close();
    server.kill();
  }
  console.log(failures ? `\nBlank generation finished with ${failures} failure(s)` : '\nBlank forms generated – no failures.');
  process.exit(failures ? 1 : 0);
}
run().catch((e) => { console.error(e); process.exit(1); });
