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
  { name: 'Register Class', page: 'register-class.html', type: 'register' },
  { name: 'Subject Class', page: 'subject-class.html', type: 'subject' },
  // SA-OC has no fields, so it is generated from the register page
  { name: 'Observation Codes', page: 'register-class.html', type: 'codes', viaApi: true },
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

      let info;
      if (target.viaApi) {
        info = await page.evaluate(async (type) => {
          const { generateBlank } = await import('./js/export.js');
          const res = await generateBlank(type);
          const toB64 = (blob) => new Promise((resolve) => { const r = new FileReader(); r.onload = () => resolve(String(r.result).split(',')[1]); r.readAsDataURL(blob); });
          return { pdfName: res.pdf.filename, pageCount: res.pageCount, pdfB64: await toB64(res.pdf.blob), images: res.images.map((i) => ({ filename: i.filename, w: i.canvas.width, h: i.canvas.height })) };
        }, target.type);
        fs.writeFileSync(path.join(outDir, info.pdfName), Buffer.from(info.pdfB64, 'base64'));
      } else {
        const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#btn-blank')]);
        await dl.saveAs(path.join(outDir, dl.suggestedFilename()));
        await page.waitForFunction(() => window.__lastBlank);
        info = await page.evaluate(() => window.__lastBlank);
      }
      console.log(`[blank] ${target.name}: ${info.pdfName} (${info.pageCount} page(s)); images ${info.images.map((i) => `${i.filename} ${i.w}x${i.h}`).join(', ')}`);

      // a blank must not be padded out with extra pages
      if (info.pageCount > 2) { failures++; console.log(`  FAIL: blank form should not need ${info.pageCount} pages`); }

      // save the blank PNGs too, so the image output is reviewable alongside the PDF
      const pngs = await page.evaluate(async (type) => {
        const { generateBlank } = await import('./js/export.js');
        const res = await generateBlank(type);
        const toB64 = (blob) => new Promise((resolve) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result).split(',')[1]);
          r.readAsDataURL(blob);
        });
        return Promise.all(res.images.map(async (im) => ({ filename: im.filename, b64: await toB64(im.blob) })));
      }, target.type);
      for (const im of pngs) fs.writeFileSync(path.join(outDir, im.filename), Buffer.from(im.b64, 'base64'));
      console.log(`  saved ${pngs.length} PNG page(s): ${pngs.map((i) => i.filename).join(', ')}`);

      // corners: rounded on the section containers, square on everything a
      // pen goes into, which is what the grid spec asks for
      const corners = await page.evaluate(async (type) => {
        const { buildFormDocument } = await import('./js/export.js');
        const { createEmptyData } = await import('./js/model.js');
        const { doc } = await buildFormDocument(createEmptyData(type), { blank: true, docNumber: 'SA01BLANK', identifier: 'BLANK' });
        const CELL = ['cell', 'field', 'tick', 'signature', 'writing-box'];
        const rounded = [], containers = [];
        doc.pages.forEach((p, pi) => p.ops.forEach((op) => {
          if (op.t !== 'rect') return;
          if (CELL.includes(op.tag) && op.r > 0) rounded.push({ page: pi + 1, tag: op.tag, x: op.x, y: op.y });
          // a section container is the full-width card outline
          if (!op.tag && op.stroke && op.w > 150 && op.h > 12) containers.push({ page: pi + 1, r: op.r });
        }));
        return { rounded, containers };
      }, target.type);
      const squareContainers = corners.containers.filter((c) => !c.r);
      console.log(`  corners: ${corners.rounded.length} rounded cell(s)/input(s), ${corners.containers.length} section container(s) of which ${squareContainers.length} square`);
      if (corners.rounded.length) { failures++; console.log('  FAIL: rounded cells at', JSON.stringify(corners.rounded.slice(0, 5))); }
      if (squareContainers.length) { failures++; console.log('  FAIL: section container without rounded corners'); }

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
