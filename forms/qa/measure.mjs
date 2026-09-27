/**
 * Measures the printed geometry of both blank forms against the print spec:
 * cell heights, row pitch, comment-line spacing, minimum type size, header
 * block height and page overflow. Usage: npm run measure
 */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8161;
const MIN_CELL_H = 6.5, ROW_PITCH = 7, MIN_PT = 7, MAX_HEADER = 24, PAGE_BOTTOM = 289;

const server = spawn(process.execPath, [path.join(root, 'server.js')], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 600));
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext()).newPage();
page.on('pageerror', (e) => { console.log('PAGEERROR:', e.message); });
await page.goto(`http://localhost:${PORT}/register-class.html`);
await page.waitForSelector('#form-root .meta-grid');

const report = await page.evaluate(async () => {
  const { buildFormDocument } = await import('./js/export.js');
  const { createEmptyData } = await import('./js/model.js');
  const out = {};
  for (const type of ['register', 'subject']) {
    const { doc } = await buildFormDocument(createEmptyData(type), { blank: true, docNumber: 'X', identifier: 'BLANK' });
    const ops = doc.pages.flatMap((p) => p.ops);
    const round = (n) => Math.round(n * 100) / 100;
    // rects are tagged by role, so ticks and rule boxes are not mistaken for
    // handwriting cells
    const tagged = (t) => ops.filter((o) => o.t === 'rect' && o.tag === t);
    const cells = [...tagged('cell'), ...tagged('field')];
    const heights = [...new Set(cells.map((c) => round(c.h)))].sort((a, b) => a - b);
    const widths = [...new Set(tagged('cell').map((c) => round(c.w)))].sort((a, b) => a - b);
    const ticks = [...new Set(tagged('tick').map((c) => `${round(c.w)}x${round(c.h)}`))];
    const sig = tagged('signature').map((c) => `${round(c.w)}x${round(c.h)}`);
    const grid = tagged('cell');
    const byX = new Map();
    for (const c of grid) { const k = round(c.x); (byX.get(k) || byX.set(k, []).get(k)).push(round(c.y)); }
    const pitches = new Set();
    for (const ys of byX.values()) {
      const sorted = [...new Set(ys)].sort((a, b) => a - b);
      for (let i = 1; i < sorted.length; i++) pitches.add(round(sorted[i] - sorted[i - 1]));
    }
    // ruled writing lines inside section C, for the comment-line pitch
    const box = tagged('writing-box')[0];
    const rules = box
      ? ops.filter((o) => o.t === 'rect' && o.h <= 0.3 && o.y > box.y && o.y < box.y + box.h).map((o) => round(o.y)).sort((a, b) => a - b)
      : [];
    const rulePitch = [...new Set(rules.slice(1).map((y, i) => round(y - rules[i])))];
    const texts = ops.filter((o) => o.t === 'text');
    out[type] = {
      pages: doc.pages.length,
      cellHeights: heights,
      cellWidths: widths,
      rowPitches: [...pitches].sort((a, b) => a - b),
      headerMm: round(doc.marks[0].y - 8 - 3),
      commentLinePitch: rulePitch,
      tickBoxes: ticks,
      signatureBox: sig,
      minTextPt: round(Math.min(...texts.map((t) => t.size))),
      lowestInkMm: round(Math.max(...ops.filter((o) => o.h != null).map((o) => o.y + o.h))),
      leftmostMm: round(Math.min(...ops.filter((o) => o.x != null).map((o) => o.x))),
      rightmostMm: round(Math.max(...ops.filter((o) => o.w != null).map((o) => o.x + o.w))),
    };
  }
  return out;
});

let fail = 0;
for (const [type, r] of Object.entries(report)) {
  const small = r.cellHeights.filter((h) => h < MIN_CELL_H - 0.01);
  const badPitch = r.rowPitches.filter((p) => p < ROW_PITCH - 0.01);
  console.log(`\n=== ${type}`);
  console.log(`  pages: ${r.pages}`);
  console.log(`  header block: ${r.headerMm} mm`);
  console.log(`  entry cell heights (mm): ${r.cellHeights.join(', ')}`);
  console.log(`  entry cell widths (mm): ${r.cellWidths.join(', ')}`);
  console.log(`  row pitch (mm): ${r.rowPitches.join(', ')}`);
  console.log(`  tick boxes (mm): ${r.tickBoxes.join(', ') || 'n/a'}`);
  console.log(`  signature box (mm): ${r.signatureBox.join(', ')}`);
  console.log(`  comment line pitch (mm): ${r.commentLinePitch.join(', ') || 'n/a'}`);
  console.log(`  smallest text: ${r.minTextPt} pt`);
  console.log(`  ink extent: x ${r.leftmostMm}–${r.rightmostMm} mm, lowest y ${r.lowestInkMm} mm`);
  const checks = [
    [r.pages === 1, `one page (got ${r.pages})`],
    [small.length === 0, `every entry cell >= ${MIN_CELL_H} mm (short: ${small.join(', ') || 'none'})`],
    [badPitch.length === 0, `row pitch >= ${ROW_PITCH} mm (tight: ${badPitch.join(', ') || 'none'})`],
    [r.minTextPt >= MIN_PT, `no text below ${MIN_PT} pt (got ${r.minTextPt})`],
    [r.leftmostMm >= 7.99, `nothing left of the 8 mm margin (got ${r.leftmostMm})`],
    [r.rightmostMm <= 202.01, `nothing right of the 8 mm margin (got ${r.rightmostMm})`],
    [r.lowestInkMm <= PAGE_BOTTOM, `nothing below ${PAGE_BOTTOM} mm (got ${r.lowestInkMm})`],
    [r.headerMm <= MAX_HEADER, `header block <= ${MAX_HEADER} mm (got ${r.headerMm})`],
    [Math.min(...r.cellWidths) >= 13, `narrowest grid cell >= 13 mm (got ${Math.min(...r.cellWidths)})`],
    [r.signatureBox.every((b) => b === '60x12'), `signature box 60x12 mm (got ${r.signatureBox.join(', ')})`],
    [r.tickBoxes.every((b) => b === '5x5'), `tick boxes 5x5 mm (got ${r.tickBoxes.join(', ') || 'n/a'})`],
    [r.commentLinePitch.every((p) => Math.abs(p - 7.5) < 0.01), `comment lines at 7.5 mm (got ${r.commentLinePitch.join(', ') || 'n/a'})`],
  ];
  for (const [ok, msg] of checks) { if (!ok) { fail++; console.log(`  FAIL: ${msg}`); } else console.log(`  ok: ${msg}`); }
}
console.log(fail ? `\nMEASUREMENT FAILED (${fail})` : '\nMEASUREMENT PASSED');
await browser.close(); server.kill();
process.exit(fail ? 1 : 0);
