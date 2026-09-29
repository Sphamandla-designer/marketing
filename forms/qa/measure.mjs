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
// the restored design's figures: the header block plus its trailing gap,
// and a 60 x 12 mm signature box
// MAX_HEADER covers the header block plus its block gap, which grows to fill the page
// the hard floors of the grid spec: no writable box below 7 mm, no rounded
// corner on a cell or an input box, and every border a 0.5 pt mid grey
const MIN_CELL_H = 6, ROW_PITCH = 7, MIN_PT = 7, MAX_HEADER = 32, MIN_LINE = 7, GRID = '#9A9A9A';
const SIG_BOX = '60x12';

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
  for (const type of ['register', 'subject', 'codes']) {
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
    const rules = tagged('rule-line').map((o) => round(o.y)).sort((a, b) => a - b);
    const rulePitch = [...new Set(rules.slice(1).map((y, i) => round(y - rules[i])))];
    // info-panel fields must not overlap each other horizontally within a row
    const panelFields = tagged('field').filter((f) => f.y < 60);
    const overlaps = [];
    for (const a of panelFields) for (const b of panelFields) {
      if (a === b || Math.abs(a.y - b.y) > 0.5) continue;
      if (a.x < b.x && a.x + a.w > b.x + 0.01) overlaps.push(`${round(a.x)}+${round(a.w)} into ${round(b.x)}`);
    }
    const texts = ops.filter((o) => o.t === 'text');
    out[type] = {
      pages: doc.pages.length,
      metrics: doc.metrics,
      cellHeights: heights,
      cellWidths: widths,
      rowPitches: [...pitches].sort((a, b) => a - b),
      headerMm: doc.marks.length ? round(doc.marks[0].y - doc.metrics.margin) : 0,
      totalUsedMm: round(Math.max(...ops.filter((o) => o.y != null).map((o) => o.y + (o.h || 0))) - 8),
      commentLinePitch: rulePitch,
      panelOverlaps: [...new Set(overlaps)],
      tickBoxes: ticks,
      signatureBox: sig,
      minTextPt: round(Math.min(...texts.map((t) => t.size))),
      roundedCells: cells.filter((c) => c.r > 0).length,
      offGridBorders: [...new Set(ops.filter((o) => o.t === 'rect' && ['cell', 'field', 'tick', 'signature', 'writing-box'].includes(o.tag) && o.stroke && o.stroke !== '#9A9A9A').map((o) => o.stroke))],
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
  const m = r.metrics || {};
  console.log(`  metrics: margin ${m.margin} · container padding ${m.pad} · section gap ${m.gapUsed ?? m.gap} (base ${m.gap}) · header field ${m.field} + ${m.fieldGap} · cell ${m.cell} · comment line ${m.line} · ladder step ${m.step}`);
  console.log(`  header block: ${r.headerMm} mm`);
  console.log(`  total used height: ${r.totalUsedMm} mm of 281`);
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
    [r.leftmostMm >= m.margin - 0.01, `nothing left of the ${m.margin} mm margin (got ${r.leftmostMm})`],
    [r.rightmostMm <= 210 - m.margin + 0.01, `nothing right of the ${m.margin} mm margin (got ${r.rightmostMm})`],
    [r.lowestInkMm <= 297 - m.margin + 0.5, `nothing below ${297 - m.margin} mm (got ${r.lowestInkMm})`],
    [r.roundedCells === 0, `no rounded corners on cells or input boxes (got ${r.roundedCells})`],
    [r.offGridBorders.length === 0, `every cell border ${GRID} (stray: ${r.offGridBorders.join(', ') || 'none'})`],
    [r.headerMm === 0 || r.headerMm <= MAX_HEADER, `header block + gap <= ${MAX_HEADER} mm (got ${r.headerMm})`],
    [r.cellWidths.length === 0 || Math.min(...r.cellWidths) >= 11.9, `narrowest grid cell >= 12 mm (got ${Math.min(...r.cellWidths) || 'n/a'})`],
    [r.signatureBox.every((b) => b === SIG_BOX), `signature box ${SIG_BOX} mm (got ${r.signatureBox.join(', ') || 'n/a'})`],
    [r.tickBoxes.every((b) => b === '5x5'), `tick boxes 5x5 mm (got ${r.tickBoxes.join(', ') || 'n/a'})`],
    [r.commentLinePitch.every((p) => p >= MIN_LINE - 0.01), `comment lines >= ${MIN_LINE} mm (got ${r.commentLinePitch.join(', ') || 'n/a'})`],
    [r.panelOverlaps.length === 0, `no overlapping info-panel fields (${r.panelOverlaps.join('; ') || 'none'})`],
  ];
  for (const [ok, msg] of checks) { if (!ok) { fail++; console.log(`  FAIL: ${msg}`); } else console.log(`  ok: ${msg}`); }
}
console.log(fail ? `\nMEASUREMENT FAILED (${fail})` : '\nMEASUREMENT PASSED');
await browser.close(); server.kill();
process.exit(fail ? 1 : 0);
