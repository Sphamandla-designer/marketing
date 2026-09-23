/**
 * Automated QA: completes each form with realistic data in headless Chromium,
 * submits it, and saves the generated PDF + PNG files plus the data model to
 * qa/output/<scenario>/ for inspection (see qa/check_outputs.py).
 *
 * Usage: npm run qa   (starts its own static server on a free port)
 */
import { chromium } from "playwright";
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const outRoot = path.join(here, 'output');
const PORT = 8123;

const ONLY = process.argv[2];
const scenarios = [
  {
    name: 'register-standard', page: 'register-class.html',
    meta: { academicYear: '2026', term: '3', week: '5', registerClass: '9A', educator: 'Ms N. Dlamini' },
    attendance: { 0: { mon: { a: '14' }, wed: { l: '7' } }, 1: { mon: { a: '22' }, thu: { a: '22' } }, 2: { tue: { l: '3' } }, 3: { fri: { a: '31' } }, 4: { wed: { a: '9' }, thu: { a: '9' }, fri: { a: '9' } } },
    observations: { 0: { mon: { learner: '14', code: 'C' }, wed: { learner: '5', code: 'P' } }, 1: { tue: { learner: '22', code: 'N' } }, 2: { fri: { learner: '8', code: 'E' } } },
    comments: 'Learner 9 was absent for three consecutive days; parents contacted on Thursday. Learner 8 delivered an exceptional oral presentation on Friday.',
    date: { dd: '19', mm: '09', yyyy: '2026' },
  },
  {
    name: 'subject-standard', page: 'subject-class.html',
    meta: { academicYear: '2026', term: '3', week: '5', subject: 'Mathematics', subjectClass: '9A G1', educator: 'Mr T. Jacobs', dayPeriods: 'Mon P1–2, Wed P4, Fri P6' },
    attendance: { 0: { mon: { a: '14' } }, 1: { mon: { l: '2' }, wed: { l: '2' } }, 2: { fri: { a: '27' } } },
    observations: { 0: { mon: { learner: '14', code: 'C' }, wed: { learner: '11', code: 'E' } }, 1: { fri: { learner: '3', code: 'P' } }, 2: { wed: { learner: '27', code: 'N' } } },
    atp: { code: 'MATH-9-T3-W5', status: 'not_completed' },
    comments: 'Deviation: Unit 5.3 (linear equations) not completed due to Wednesday assembly. Focus for next week: complete 5.3 and begin 5.4 with remedial support for learners 14 and 27.',
    date: { dd: '19', mm: '09', yyyy: '2026' },
  },
  {
    name: 'register-long', page: 'register-class.html',
    meta: { academicYear: '2026', term: '3', week: '10', registerClass: '10B', educator: 'Mrs S. van der Merwe' },
    extraAttendanceRows: 22, extraObservationRows: 12,
    attendance: Object.fromEntries(Array.from({ length: 32 }, (_, i) => [i, { mon: { a: String(i + 1) }, fri: { l: String((i * 3) % 40 + 1) } }])),
    observations: Object.fromEntries(Array.from({ length: 22 }, (_, i) => [i, { tue: { learner: String(i + 1), code: 'PECN'[i % 4] } }])),
    comments: Array.from({ length: 9 }, (_, i) => `Comment paragraph ${i + 1}: this is a deliberately long set of educator comments used to verify that the additional comments box flows correctly across page boundaries without clipping, overflow or orphaned lines.`).join('\n'),
    date: { dd: '25', mm: '09', yyyy: '2026' },
  },
  {
    name: 'subject-long', page: 'subject-class.html',
    meta: { academicYear: '2026', term: '4', week: '2', subject: 'Physical Sciences', subjectClass: '11C G2', educator: 'Dr L. Mokoena', dayPeriods: 'Tue P3, Thu P5–6' },
    extraAttendanceRows: 18, extraObservationRows: 14,
    attendance: Object.fromEntries(Array.from({ length: 24 }, (_, i) => [i, { tue: { a: String(i + 1) } }])),
    observations: Object.fromEntries(Array.from({ length: 20 }, (_, i) => [i, { thu: { learner: String(i + 1), code: 'PECN'[i % 4] } }])),
    atp: { code: 'PHSC-11-T4-W2', status: 'completed' },
    comments: Array.from({ length: 10 }, (_, i) => `Note ${i + 1}: practical investigation on Newton's second law completed; learners requiring consolidation are listed in observations. The next cycle begins with momentum and impulse.`).join(' '),
    date: { dd: '16', mm: '10', yyyy: '2026' },
  },
];

async function typeChars(page, groupSelector, value) {
  const first = page.locator(`${groupSelector} input`).first();
  await first.click();
  await page.keyboard.type(value, { delay: 10 });
}

async function fill(page, sc) {
  for (const [k, v] of Object.entries(sc.meta)) {
    const group = page.locator(`.char-group[data-path="meta.${k}"]`);
    if (await group.count()) await typeChars(page, `.char-group[data-path="meta.${k}"]`, v);
    else await page.locator(`input[data-path="meta.${k}"]`).fill(v);
  }
  for (let i = 0; i < (sc.extraAttendanceRows || 0); i++) await page.locator('.attendance-table').locator('..').locator('..').locator('.row-controls button', { hasText: 'Add row' }).click();
  for (let i = 0; i < (sc.extraObservationRows || 0); i++) await page.locator('.obs-table').locator('..').locator('..').locator('.row-controls button', { hasText: 'Add row' }).click();
  for (const [row, days] of Object.entries(sc.attendance || {})) for (const [d, cells] of Object.entries(days)) for (const [k, v] of Object.entries(cells)) await page.locator(`input[data-path="attendance.${row}.${d}.${k}"]`).fill(v);
  for (const [row, days] of Object.entries(sc.observations || {})) for (const [d, cells] of Object.entries(days)) for (const [k, v] of Object.entries(cells)) await page.locator(`input[data-path="observations.${row}.${d}.${k}"]`).fill(v);
  if (sc.atp) {
    await page.locator('input[data-path="atp.code"]').fill(sc.atp.code);
    await page.locator(`label[for="atp-status-${sc.atp.status}"]`).click();
  }
  if (sc.comments) await page.locator('textarea[data-path="comments"]').fill(sc.comments);
  // signature: draw a looping stroke
  const pad = page.locator('canvas.sig-pad');
  await pad.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  const box = await pad.boundingBox();
  const pts = [];
  for (let t = 0; t <= 60; t++) { const x = box.x + 20 + (box.width - 40) * (t / 60); const y = box.y + box.height / 2 + Math.sin(t / 3) * (box.height / 3.2) + Math.cos(t / 7) * 6; pts.push([x, y]); }
  await page.mouse.move(pts[0][0], pts[0][1]); await page.mouse.down();
  for (const [x, y] of pts) await page.mouse.move(x, y, { steps: 2 });
  await page.mouse.up();
  await typeChars(page, '.date-part[data-path="dd"]', sc.date.dd);
  await typeChars(page, '.date-part[data-path="mm"]', sc.date.mm);
  await typeChars(page, '.date-part[data-path="yyyy"]', sc.date.yyyy);
}

async function run() {
  if (!ONLY) fs.rmSync(outRoot, { recursive: true, force: true });
  fs.mkdirSync(outRoot, { recursive: true });
  const server = spawn(process.execPath, [path.join(root, 'server.js')], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 600));
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium' });
  let failures = 0;
  try {
    for (const sc of scenarios.filter((s) => !ONLY || s.name === ONLY)) {
      const dir = path.join(outRoot, sc.name);
      fs.mkdirSync(dir, { recursive: true });
      const ctx = await browser.newContext({ viewport: { width: 1200, height: 1000 }, acceptDownloads: true });
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
      await page.goto(`http://localhost:${PORT}/${sc.page}`);
      await page.waitForSelector('#form-root .meta-grid');

      // 1) validation must block an empty form
      await page.click('#btn-submit');
      const errCount = await page.locator('#error-summary li').count();
      console.log(`[${sc.name}] empty-form validation errors shown: ${errCount}`);
      if (!errCount) { failures++; console.log('  FAIL: expected validation errors'); }

      // 2) fill and submit
      await fill(page, sc);
      await page.screenshot({ path: path.join(dir, 'interactive-form.png'), fullPage: true });
      await page.click('#btn-submit');
      await Promise.race([
        page.waitForSelector('#btn-download-pdf', { timeout: 60000 }),
        page.waitForSelector('#error-summary:not([hidden])', { timeout: 60000 }).then(async () => { throw new Error(`Validation blocked submit: ${(await page.locator('#error-summary li').allTextContents()).join(' | ')}`); }),
      ]);
      const info = await page.evaluate(() => { const s = window.__lastSubmission; return { docNumber: s.docNumber, identifier: s.identifier, pageCount: s.pageCount, pdfName: s.pdf.filename, images: s.images.map((i) => ({ filename: i.filename, w: i.canvas.width, h: i.canvas.height })), data: s.data }; });
      console.log(`[${sc.name}] generated ${info.pdfName} (${info.pageCount} page(s)); images: ${info.images.map((i) => `${i.filename} ${i.w}x${i.h}`).join(', ')}`);
      fs.writeFileSync(path.join(dir, 'data.json'), JSON.stringify(info, null, 2));

      // 3) download via the real buttons
      const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#btn-download-pdf')]);
      await dl.saveAs(path.join(dir, dl.suggestedFilename()));
      const downloads = [];
      const collect = (d) => downloads.push(d);
      page.on('download', collect);
      await page.click('#btn-download-png');
      const deadline = Date.now() + 15000;
      while (downloads.length < info.pageCount && Date.now() < deadline) await new Promise((r) => setTimeout(r, 100));
      page.off('download', collect);
      for (const d of downloads) await d.saveAs(path.join(dir, d.suggestedFilename()));
      await page.screenshot({ path: path.join(dir, 'result-panel.png'), fullPage: true });
      if (downloads.length !== info.pageCount) { failures++; console.log(`  FAIL: expected ${info.pageCount} PNG downloads, got ${downloads.length}`); }
      if (errors.length) { failures++; console.log('  FAIL: browser errors:', errors); }
      await ctx.close();
    }
  } finally {
    await browser.close();
    server.kill();
  }
  console.log(failures ? `\nQA finished with ${failures} failure(s)` : '\nQA run complete – no failures. Now run: npm run qa:inspect');
  process.exit(failures ? 1 : 0);
}
run().catch((e) => { console.error(e); process.exit(1); });
