/**
 * Layout engine: converts (form schema + completed data) into a paginated
 * document made of simple drawing primitives in millimetres on A4 pages.
 *
 * The same primitive list is replayed by the PDF painter and the canvas
 * (PNG) painter, so both outputs are identical by construction.
 *
 * Primitive types:
 *   { t:'rect',  x,y,w,h, fill?, stroke?, lw?, r? }
 *   { t:'line',  x1,y1,x2,y2, color, lw }
 *   { t:'text',  s, x, y, size, style, color }      // y = baseline, x = left edge
 *   { t:'image', src, x,y,w,h }
 */
import { SCHOOL, DAYS, OBSERVATION_CODES, ATP_STATUS, getForm } from './schema.js';
import { encodeCode128B } from './barcode.js';
import { formatDisplayDate } from './model.js';

export const PAGE = { w: 210, h: 297, ml: 10, mr: 10, mt: 7, mb: 8, footerH: 8 };
export const COLORS = {
  red: '#B5121B',
  darkRed: '#8F0F19',
  pinkBanner: '#FBD3D6',
  pinkLabel: '#FCE4E5',
  pinkHead: '#FDEAEB',
  grid: '#8C9095',
  gridLight: '#C4C8CD',
  border: '#9DA3A8',
  text: '#1B1B1B',
  muted: '#5C6166',
  white: '#FFFFFF',
  boxFill: '#FFFFFF',
  boxBorder: '#A9AEB4',
  checkFill: '#FFFFFF',
};

const PT = 0.352778; // 1pt in mm
const CAP = 0.711;   // Roboto cap height / em

/** Baseline y for text of `sizePt` vertically centred in a box [top, top+h]. */
function centreBaseline(top, h, sizePt) {
  return top + (h + CAP * sizePt * PT) / 2;
}

export function buildDocument({ formType, data, docNumber, identifier, generatedAt, crest, measure }) {
  const b = new Builder({ formType, data, docNumber, identifier, generatedAt, crest, measure });
  return b.build();
}

class Builder {
  constructor(opts) {
    this.form = getForm(opts.formType);
    this.data = opts.data;
    this.docNumber = opts.docNumber;
    this.identifier = opts.identifier;
    this.generatedAt = opts.generatedAt || new Date();
    this.crest = opts.crest;
    this.measureFn = opts.measure;
    this.pages = [];
    this.ops = null;
    this.y = 0;
    this.x0 = PAGE.ml;
    this.cw = PAGE.w - PAGE.ml - PAGE.mr;
    this.bottom = PAGE.h - PAGE.mb - PAGE.footerH;
  }

  // ---------- primitives ----------
  measure(s, size, style = 'normal') { return this.measureFn(String(s), size, style); }
  rect(x, y, w, h, o = {}) { this.ops.push({ t: 'rect', x, y, w, h, fill: o.fill || null, stroke: o.stroke || null, lw: o.lw || 0.25, r: o.r || 0 }); }
  line(x1, y1, x2, y2, color = COLORS.grid, lw = 0.25) { this.ops.push({ t: 'line', x1, y1, x2, y2, color, lw }); }
  image(src, x, y, w, h) { this.ops.push({ t: 'image', src, x, y, w, h }); }
  /** Draw text; align: 'left' | 'center' | 'right'. y is the baseline. */
  text(s, x, y, o = {}) {
    s = String(s ?? '');
    if (!s) return 0;
    const size = o.size || 9; const style = o.style || 'normal';
    const w = this.measure(s, size, style);
    let left = x;
    if (o.align === 'center') left = x - w / 2;
    else if (o.align === 'right') left = x - w;
    this.ops.push({ t: 'text', s, x: left, y, size, style, color: o.color || COLORS.text });
    return w;
  }
  /** Text with manual letter spacing (mm between glyphs), deterministic in both painters. */
  spacedText(s, x, y, o = {}) {
    const size = o.size || 9; const style = o.style || 'normal'; const sp = o.spacing || 0.8;
    const chars = [...s];
    const total = chars.reduce((acc, c) => acc + this.measure(c, size, style), 0) + sp * (chars.length - 1);
    let cx = x;
    if (o.align === 'center') cx = x - total / 2; else if (o.align === 'right') cx = x - total;
    for (const c of chars) {
      const w = this.measure(c, size, style);
      if (c !== ' ') this.ops.push({ t: 'text', s: c, x: cx, y, size, style, color: o.color || COLORS.text });
      cx += w + sp;
    }
    return total;
  }
  /** Draw runs of differently styled text on one baseline. */
  runs(runs, x, y) {
    let cx = x;
    for (const r of runs) {
      if (!r.s) continue;
      this.ops.push({ t: 'text', s: r.s, x: cx, y, size: r.size || 9, style: r.style || 'normal', color: r.color || COLORS.text });
      cx += this.measure(r.s, r.size || 9, r.style || 'normal');
    }
    return cx - x;
  }
  wrap(text, maxW, size, style = 'normal') {
    const out = [];
    for (const para of String(text ?? '').split('\n')) {
      const words = para.split(/\s+/).filter(Boolean);
      if (!words.length) { out.push(''); continue; }
      let line = '';
      for (let word of words) {
        // break words that are too long on their own
        while (this.measure(word, size, style) > maxW) {
          let cut = word.length - 1;
          while (cut > 1 && this.measure(word.slice(0, cut), size, style) > maxW) cut--;
          if (line) { out.push(line); line = ''; }
          out.push(word.slice(0, cut));
          word = word.slice(cut);
        }
        const trial = line ? `${line} ${word}` : word;
        if (this.measure(trial, size, style) <= maxW) line = trial;
        else { out.push(line); line = word; }
      }
      out.push(line);
    }
    return out;
  }
  charBoxes(x, y, chars, n, o = {}) {
    const bw = o.bw || 5.4, bh = o.bh || 5.6, gap = o.gap ?? 0.9;
    for (let i = 0; i < n; i++) {
      const bx = x + i * (bw + gap);
      this.rect(bx, y, bw, bh, { fill: COLORS.boxFill, stroke: COLORS.boxBorder, lw: 0.25, r: 0.9 });
      const c = chars[i] || '';
      if (c) this.text(c, bx + bw / 2, centreBaseline(y, bh, o.size || 10), { size: o.size || 10, style: 'bold', align: 'center' });
    }
    return n * bw + (n - 1) * gap;
  }
  roundedField(x, y, w, h, value, o = {}) {
    this.rect(x, y, w, h, { fill: COLORS.boxFill, stroke: COLORS.boxBorder, lw: 0.25, r: 1.2 });
    if (value) {
      const size = o.size || 9.5;
      const maxW = w - 4;
      let s = String(value);
      while (s.length > 1 && this.measure(s, size, o.style || 'normal') > maxW) s = s.slice(0, -1);
      if (s !== String(value)) s = s.slice(0, -1) + '…';
      this.text(s, x + 2, centreBaseline(y, h, size), { size, style: o.style || 'normal' });
    }
  }

  // ---------- pages ----------
  newPage() {
    this.ops = [];
    this.pages.push({ ops: this.ops });
    this.y = PAGE.mt;
    if (this.pages.length === 1) this.fullHeader(); else this.compactHeader();
  }
  ensure(h) {
    if (this.y + h > this.bottom) { this.newPage(); return true; }
    return false;
  }

  fullHeader() {
    const y = this.y;
    // crest
    if (this.crest) this.image(this.crest.dataUrl, this.x0, y, 25, 25);
    // title block (centred between crest and form code box)
    const boxW = 40, boxX = this.x0 + this.cw - boxW;
    const cx = (this.x0 + 27 + boxX - 2) / 2;
    this.text(SCHOOL.name, cx, y + 9.5, { size: 20, style: 'bold', color: COLORS.red, align: 'center' });
    this.spacedText(SCHOOL.motto, cx, y + 15.5, { size: 8, spacing: 1.1, align: 'center', color: COLORS.text });
    this.text(SCHOOL.tagline, cx, y + 21.5, { size: 10, style: 'italic', align: 'center' });
    // form code box
    this.rect(boxX, y, boxW, 15.5, { fill: COLORS.white, stroke: COLORS.grid, lw: 0.35, r: 0.6 });
    this.text('FORM CODE', boxX + boxW / 2, y + 3.4, { size: 6.5, style: 'bold', align: 'center' });
    this.text(this.form.formCode, boxX + boxW / 2, y + 8.6, { size: 12.5, style: 'bold', align: 'center' });
    this.text(this.form.codeBoxLines[0], boxX + boxW / 2, y + 11.7, { size: 5.2, style: 'bold', align: 'center' });
    this.text(this.form.codeBoxLines[1], boxX + boxW / 2, y + 14.3, { size: 5.2, style: 'bold', align: 'center' });
    // barcode
    this.barcode(boxX, y + 17.3, boxW, 5.8, this.docNumber);
    this.text(this.docNumber, boxX + boxW / 2, y + 26, { size: 6.5, align: 'center' });
    this.y = y + 29;
  }
  compactHeader() {
    const y = this.y;
    if (this.crest) this.image(this.crest.dataUrl, this.x0, y, 12, 12);
    this.text(SCHOOL.name, this.x0 + 15, y + 5.2, { size: 12, style: 'bold', color: COLORS.red });
    this.text(`${this.form.formCode}  ·  ${this.form.title}  ·  continued`, this.x0 + 15, y + 10, { size: 8, color: COLORS.muted });
    const right = this.x0 + this.cw;
    this.text(this.docNumber, right, y + 5.2, { size: 8.5, style: 'bold', align: 'right' });
    const m = this.data.meta;
    const ctx = [m.registerClass || m.subjectClass, m.academicYear && `Year ${m.academicYear}`, m.term && `Term ${m.term}`, m.week && `Week ${m.week}`].filter(Boolean).join('  ·  ');
    this.text(ctx, right, y + 10, { size: 8, color: COLORS.muted, align: 'right' });
    this.line(this.x0, y + 14, right, y + 14, COLORS.red, 0.4);
    this.y = y + 17;
  }
  barcode(x, y, w, h, value) {
    const widths = encodeCode128B(value);
    const totalModules = widths.reduce((a, b) => a + b, 0) + 20; // quiet zones
    const mod = w / totalModules;
    let cx = x + 10 * mod;
    widths.forEach((wd, i) => {
      if (i % 2 === 0) this.rect(cx, y, wd * mod, h, { fill: '#000000' });
      cx += wd * mod;
    });
  }
  footers() {
    const n = this.pages.length;
    this.pages.forEach((p, i) => {
      const saved = this.ops; this.ops = p.ops;
      const y = PAGE.h - PAGE.mb - PAGE.footerH;
      this.line(this.x0, y + 1.5, this.x0 + this.cw, y + 1.5, COLORS.gridLight, 0.25);
      const by = y + 6;
      this.runs([
        { s: this.form.formCode, size: 7.5, style: 'bold', color: COLORS.muted },
        { s: '   |   ', size: 7.5, color: COLORS.muted },
        { s: this.form.title, size: 7.5, color: COLORS.muted },
      ], this.x0, by);
      this.text(SCHOOL.name.replace(/\b(\w)(\w*)/g, (_, a, r) => a + r.toLowerCase()), this.x0 + this.cw / 2 - 8, by, { size: 7.5, color: COLORS.muted, align: 'center' });
      this.text(SCHOOL.mottoWords.join('  ·  '), this.x0 + this.cw - 30, by, { size: 7.5, color: COLORS.muted, align: 'right' });
      this.text(`Page ${i + 1} of ${n}`, this.x0 + this.cw, by, { size: 7.5, style: 'bold', color: COLORS.muted, align: 'right' });
      this.ops = saved;
    });
  }

  // ---------- blocks ----------
  metaTable() {
    const rows = this.form.meta.rows;
    const rowH = 7.4;
    this.ensure(rowH * rows.length + 2);
    const y0 = this.y;
    rows.forEach((row, ri) => {
      const y = y0 + ri * rowH;
      const spanTotal = row.reduce((a, f) => a + f.span, 0);
      let x = this.x0;
      for (const f of row) {
        const w = (this.cw * f.span) / spanTotal;
        const labelW = this.measure(f.label, 9.5, 'bold') + 5;
        this.rect(x, y, labelW, rowH, { fill: COLORS.pinkLabel, stroke: COLORS.grid, lw: 0.3 });
        this.rect(x + labelW, y, w - labelW, rowH, { fill: COLORS.white, stroke: COLORS.grid, lw: 0.3 });
        this.text(f.label, x + 2.5, centreBaseline(y, rowH, 9.5), { size: 9.5, style: 'bold' });
        const value = String(this.data.meta[f.key] ?? '');
        if (f.kind === 'chars') {
          const chars = value.split('');
          if (f.key === 'week' && chars.length === 1) chars.unshift(''); // right-align single digit week in 2 boxes
          this.charBoxes(x + labelW + 2, y + (rowH - 5.6) / 2, chars, f.length);
        } else {
          this.roundedField(x + labelW + 2, y + 1, w - labelW - 4, rowH - 2, value);
        }
        x += w;
      }
    });
    this.y = y0 + rowH * rows.length + 3.5;
  }

  banner(letter, title, subtitle, o = {}) {
    const h = o.h || 8.2;
    this.rect(this.x0, this.y, this.cw, h, { fill: COLORS.pinkBanner, stroke: COLORS.red, lw: 0.35 });
    let x = this.x0 + 2.5;
    const by = centreBaseline(this.y, h, 12.5);
    if (letter) x += this.runs([{ s: `${letter}.`, size: 12.5, style: 'bold', color: COLORS.red }], x, by) + 3;
    x += this.runs([{ s: title, size: 12.5, style: 'bold', color: COLORS.text }], x, by);
    if (subtitle) this.runs([{ s: subtitle, size: 9.5, color: COLORS.text }], x + 3, by);
    this.y += h;
  }

  notesBox(notes) {
    const size = 9; const lh = 4.6; const pad = 1.6;
    const lines = notes.flatMap((n) => this.wrap(n, this.cw - 5, size));
    const h = lines.length * lh + pad * 2;
    this.rect(this.x0, this.y, this.cw, h, { fill: COLORS.white, stroke: COLORS.red, lw: 0.35 });
    lines.forEach((l, i) => this.text(l, this.x0 + 2.5, this.y + pad + lh * (i + 1) - 1.1, { size }));
    this.y += h;
  }

  /**
   * Generic table with repeated header rows across page breaks.
   * cols: [{ w }], header: [{ h, cells:[{ span, text, size, sub }] }] rows drawn by `drawRow(row, y, h)`.
   */
  table({ cols, headerRows, rows, rowH, drawRow, keepWithHeader = 2, continuedBanner, footerRow }) {
    const headerH = headerRows.reduce((a, r) => a + r.h, 0);
    const drawHeader = () => {
      let y = this.y;
      for (const hr of headerRows) {
        let ci = 0; let x = this.x0;
        for (const cell of hr.cells) {
          const w = cols.slice(ci, ci + cell.span).reduce((a, c) => a + c.w, 0);
          if (cell.skip) { x += w; ci += cell.span; continue; } // covered by a rowSpan cell above
          const rowSpanH = cell.rowSpan ? headerRows.slice(headerRows.indexOf(hr), headerRows.indexOf(hr) + cell.rowSpan).reduce((a, r) => a + r.h, 0) : hr.h;
          this.rect(x, y, w, rowSpanH, { fill: COLORS.pinkHead, stroke: COLORS.grid, lw: 0.3 });
          if (cell.text) this.text(cell.text, x + w / 2, centreBaseline(y, rowSpanH, cell.size || 9.5), { size: cell.size || 9.5, style: 'bold', align: 'center' });
          x += w; ci += cell.span;
        }
        y += hr.h;
      }
      this.y = y;
    };
    // keep banner (already drawn by caller) + header + first rows together
    const need = headerH + rowH * Math.min(keepWithHeader, rows.length) + (rows.length <= keepWithHeader && footerRow ? footerRow.h : 0);
    if (this.y + need > this.bottom) {
      this.newPage();
      if (continuedBanner) continuedBanner();
    }
    drawHeader();
    rows.forEach((row, i) => {
      const isLast = i === rows.length - 1;
      const extra = isLast && footerRow ? footerRow.h : 0;
      if (this.y + rowH + extra > this.bottom) {
        this.newPage();
        if (continuedBanner) continuedBanner();
        drawHeader();
      }
      drawRow(row, i, this.y, rowH);
      this.y += rowH;
    });
    if (footerRow) {
      this.rect(this.x0, this.y, this.cw, footerRow.h, { fill: COLORS.white, stroke: COLORS.grid, lw: 0.3 });
      this.text(footerRow.text, this.x0 + 2.5, centreBaseline(this.y, footerRow.h, 9), { size: 9 });
      this.y += footerRow.h;
    }
    // heavier outer border bottom edge for a crisp finish
    this.line(this.x0, this.y, this.x0 + this.cw, this.y, COLORS.grid, 0.35);
  }

  cell(x, y, w, h, value, o = {}) {
    this.rect(x, y, w, h, { fill: o.fill || COLORS.white, stroke: COLORS.grid, lw: 0.3 });
    if (value !== '' && value != null) this.text(value, x + w / 2, centreBaseline(y, h, o.size || 9.5), { size: o.size || 9.5, style: o.style || 'normal', align: 'center', color: o.color });
  }

  attendanceSection() {
    const sec = this.form.attendance;
    const rows = this.data.attendance;
    const noW = 12; const dayW = (this.cw - noW) / DAYS.length; const subW = dayW / 2;
    const cols = [{ w: noW }, ...DAYS.flatMap(() => [{ w: subW }, { w: subW }])];
    const headerRows = [
      { h: 6, cells: [{ span: 1, text: 'No.', rowSpan: 2 }, ...DAYS.map((d) => ({ span: 2, text: d.label }))] },
      { h: 5.4, cells: [{ span: 1, text: '', skip: true }, ...DAYS.flatMap(() => [{ span: 1, text: 'A' }, { span: 1, text: 'L' }])] },
    ];
    const rowH = 6.5;
    const drawBanner = (continued) => { this.banner(sec.letter, sec.title, continued ? '(continued)' : sec.subtitle); if (!continued) this.notesBox(sec.notes); };
    this.ensure(8.2 + 14 + 11.4 + rowH * 2);
    drawBanner(false);
    const extra = rows.length - sec.defaultRows;
    const footerText = extra > 0
      ? `${sec.extraRowsNoteLabel} – recorded in rows ${sec.defaultRows + 1} to ${rows.length}.`
      : `${sec.extraRowsNoteLabel} – none recorded.`;
    this.table({
      cols, headerRows, rows, rowH,
      continuedBanner: () => drawBanner(true),
      footerRow: { h: 6, text: footerText },
      drawRow: (row, i, y, h) => {
        let x = this.x0;
        this.cell(x, y, noW, h, String(i + 1), { style: 'bold', size: 9.5 }); x += noW;
        for (const d of DAYS) {
          this.cell(x, y, subW, h, row[d.key].a, { size: 9.5 }); x += subW;
          this.cell(x, y, subW, h, row[d.key].l, { size: 9.5 }); x += subW;
        }
      },
    });
    this.y += 4;
  }

  observationsSection() {
    const sec = this.form.observations;
    const rows = this.data.observations;
    const noW = 12; const dayW = (this.cw - noW) / DAYS.length;
    const rowH = 6.5;
    const drawBanner = (continued) => { this.banner(sec.letter, sec.title, continued ? '(continued)' : sec.subtitle); if (!continued) this.notesBox(sec.notes); };
    this.ensure(8.2 + 14 + 12 + rowH * 2);
    drawBanner(false);
    if (sec.mode === 'split') {
      const learnerW = dayW * 0.6, codeW = dayW * 0.4;
      const cols = [{ w: noW }, ...DAYS.flatMap(() => [{ w: learnerW }, { w: codeW }])];
      const headerRows = [
        { h: 6, cells: [{ span: 1, text: 'No.', rowSpan: 2 }, ...DAYS.map((d) => ({ span: 2, text: d.label }))] },
        { h: 5.4, cells: [{ span: 1, text: '', skip: true }, ...DAYS.flatMap(() => [{ span: 1, text: 'Learner No.', size: 7.5 }, { span: 1, text: 'Code', size: 7.5 }])] },
      ];
      this.table({
        cols, headerRows, rows, rowH, continuedBanner: () => drawBanner(true),
        drawRow: (row, i, y, h) => {
          let x = this.x0;
          this.cell(x, y, noW, h, String(i + 1), { style: 'bold' }); x += noW;
          for (const d of DAYS) {
            this.cell(x, y, learnerW, h, row[d.key].learner); x += learnerW;
            this.cell(x, y, codeW, h, row[d.key].code, { style: 'bold' }); x += codeW;
          }
        },
      });
    } else {
      const cols = [{ w: noW }, ...DAYS.map(() => ({ w: dayW }))];
      const headerRows = [{ h: 6.5, cells: [{ span: 1, text: 'No.' }, ...DAYS.map((d) => ({ span: 1, text: d.label }))] }];
      this.table({
        cols, headerRows, rows, rowH, continuedBanner: () => drawBanner(true),
        drawRow: (row, i, y, h) => {
          let x = this.x0;
          this.cell(x, y, noW, h, String(i + 1), { style: 'bold' }); x += noW;
          for (const d of DAYS) {
            const { learner, code } = row[d.key];
            this.cell(x, y, dayW, h, '');
            if (learner || code) {
              // learner number left, code in a small character box right
              this.runs([{ s: 'Learner ', size: 7.5, color: COLORS.muted }, { s: learner, size: 9.5 }], x + 2.2, centreBaseline(y, h, 9.5));
              const bw = 5, bh = 5;
              const bx = x + dayW - bw - 2, by = y + (h - bh) / 2;
              this.rect(bx, by, bw, bh, { fill: COLORS.boxFill, stroke: COLORS.boxBorder, lw: 0.25, r: 0.8 });
              if (code) this.text(code, bx + bw / 2, centreBaseline(by, bh, 9.5), { size: 9.5, style: 'bold', align: 'center' });
            }
            x += dayW;
          }
        },
      });
    }
    this.y += 4;
  }

  codeListBox() {
    const cl = this.form.codeList;
    const h1 = 6.6, h2 = 7.2;
    this.ensure(h1 + h2 + 4);
    const y = this.y;
    this.rect(this.x0, y, this.cw, h1, { fill: COLORS.pinkLabel, stroke: COLORS.red, lw: 0.35 });
    this.rect(this.x0, y + h1, this.cw, h2, { fill: COLORS.white, stroke: COLORS.red, lw: 0.35 });
    this.runs([{ s: cl.title, size: 10, style: 'bold' }, { s: `  ${cl.subtitle}`, size: 9 }], this.x0 + 2.5, centreBaseline(y, h1, 10));
    const by = centreBaseline(y + h1, h2, 10);
    const n = OBSERVATION_CODES.length;
    const slot = (this.cw - 5) / n;
    OBSERVATION_CODES.forEach((c, i) => {
      const sx = this.x0 + 2.5 + i * slot;
      if (cl.style === 'pipes') {
        this.runs([{ s: c.code, size: 10.5, style: 'bold' }, { s: `      ${c.label}`, size: 9.5 }], sx + 6, by);
        if (i > 0) this.text('|', sx - 1, by, { size: 10.5, align: 'center', color: COLORS.muted });
      } else {
        this.runs([{ s: c.code, size: 10.5, style: 'bold' }, { s: `  =  ${c.label}`, size: 9.5 }], sx + 6, by);
      }
    });
    this.y = y + h1 + h2 + 4;
  }

  /**
   * Flow wrapped text lines across pages inside a (optionally ruled/boxed)
   * container. `minLines` pads the first block with blank lines, but blank
   * padding never spills onto a new page.
   */
  flowLines(lines, { lh, minLines, size, style, ruled, boxed, continuedBanner }) {
    const textCount = lines.length;
    const total = Math.max(textCount, minLines || 0);
    let i = 0;
    while (i < total) {
      if (i > 0 && i >= textCount) break; // only padding left – do not spill onto a new page
      const avail = Math.floor((this.bottom - this.y - 2) / lh);
      if (avail < Math.min(2, total - i)) { this.newPage(); if (continuedBanner) continuedBanner(); continue; }
      let take = Math.min(avail, total - i);
      const remainingText = textCount - i;
      // avoid orphaning a single last text line on the next page
      if (remainingText > take && remainingText - take === 1 && take > 2) take -= 1;
      const y0 = this.y;
      if (boxed) this.rect(this.x0, y0, this.cw, take * lh + 2, { fill: COLORS.white, stroke: COLORS.border, lw: 0.3 });
      for (let k = 0; k < take; k++) {
        const ly = y0 + 1 + lh * k;
        if (ruled) this.line(this.x0 + 2.5, ly + lh, this.x0 + this.cw - 2.5, ly + lh, COLORS.gridLight, 0.25);
        const s = lines[i + k];
        if (s) this.text(s, this.x0 + 2.5, ly + lh - 1.6, { size, style });
      }
      this.y = y0 + take * lh + 2;
      i += take;
      if (i < textCount) { this.newPage(); if (continuedBanner) continuedBanner(); }
    }
  }

  commentsSection() {
    const c = this.form.comments;
    const size = 9.5, lh = 5.6;
    const lines = this.wrap(this.data.comments, this.cw - 5, size);
    const bannerH = 8.2;
    this.ensure(bannerH + lh * 2 + 6);
    const drawBanner = (cont) => this.banner(null, c.title, cont ? '(continued)' : c.subtitle);
    drawBanner(false);
    this.flowLines(lines, { lh, minLines: c.minLines, size, boxed: true, continuedBanner: () => drawBanner(true) });
    this.y += 4;
  }

  atpSection() {
    const sec = this.form.atp;
    const atp = this.data.atp || { code: '', status: '' };
    const size = 9.5, lh = 6;
    const lines = this.wrap(this.data.comments, this.cw - 5, size);
    this.ensure(8.2 + 11 + 7 + lh * 2 + 4);
    const drawBanner = (cont) => this.banner(sec.letter, sec.title, cont ? '(continued)' : '');
    drawBanner(false);
    // body frame top part
    const rowH = 11;
    const y = this.y;
    this.rect(this.x0, y, this.cw, rowH, { fill: COLORS.white, stroke: COLORS.red, lw: 0.35 });
    const by = centreBaseline(y, rowH, 9.5);
    let x = this.x0 + 2.5;
    x += this.text(sec.codeLabel, x, by, { size: 9.5, style: 'bold' }) + 3;
    const fieldW = 52;
    this.roundedField(x, y + 2.2, fieldW, rowH - 4.4, atp.code, { size: 10, style: 'bold' });
    x += fieldW + 6;
    for (const s of ATP_STATUS) {
      const bs = 5.2; const cy = y + (rowH - bs) / 2;
      this.rect(x, cy, bs, bs, { fill: COLORS.checkFill, stroke: COLORS.text, lw: 0.35, r: 0.5 });
      if (atp.status === s.value) {
        this.line(x + 1.1, cy + 2.7, x + 2.2, cy + 4.1, COLORS.red, 0.6);
        this.line(x + 2.2, cy + 4.1, x + 4.3, cy + 1.2, COLORS.red, 0.6);
      }
      x += bs + 2;
      x += this.text(s.label, x, by, { size: 9.5 }) + 6;
    }
    this.y = y + rowH;
    // comments label
    const labH = 7;
    this.rect(this.x0, this.y, this.cw, labH, { fill: COLORS.white, stroke: COLORS.border, lw: 0.3 });
    this.runs([{ s: sec.commentsLabel, size: 9.5, style: 'bold' }, { s: ` ${sec.commentsHint}`, size: 9 }], this.x0 + 2.5, centreBaseline(this.y, labH, 9.5));
    this.y += labH;
    this.flowLines(lines, { lh, minLines: this.form.comments.minLines, size, ruled: true, boxed: true, continuedBanner: () => { drawBanner(true); } });
    this.y += 4;
  }

  signOffSection() {
    const so = this.form.signOff;
    const bannerH = 8.2, bodyH = 33;
    this.ensure(bannerH + bodyH + 2);
    this.banner(so.letter, so.title, '');
    const y = this.y;
    this.rect(this.x0, y, this.cw, bodyH, { fill: COLORS.white, stroke: COLORS.red, lw: 0.35 });
    const decl = this.wrap(so.declaration, this.cw - 5, 8.5, 'italic');
    decl.forEach((l, i) => this.text(l, this.x0 + 2.5, y + 4.6 + i * 4.2, { size: 8.5, style: 'italic' }));
    const rowY = y + 4.6 + decl.length * 4.2 + 1.5;
    // signature
    let x = this.x0 + 2.5;
    const sigW = 70, sigH = 16;
    x += this.text('Educator signature:', x, rowY + sigH / 2 + 1.2, { size: 9.5, style: 'bold' }) + 3;
    this.rect(x, rowY, sigW, sigH, { fill: COLORS.boxFill, stroke: COLORS.boxBorder, lw: 0.25, r: 1.2 });
    const sig = this.data.signOff?.signature;
    if (sig && sig.dataUrl) {
      const pad = 1.2;
      const maxW = sigW - pad * 2, maxH = sigH - pad * 2;
      const ratio = Math.min(maxW / sig.width, maxH / sig.height);
      const w = sig.width * ratio, h = sig.height * ratio;
      this.image(sig.dataUrl, x + (sigW - w) / 2, rowY + (sigH - h) / 2, w, h);
    }
    x += sigW + 8;
    // date boxes DD MM YYYY
    x += this.text('Date:', x, rowY + sigH / 2 + 1.2, { size: 9.5, style: 'bold' }) + 3;
    const iso = this.data.signOff?.date || '';
    const [yy, mm, dd] = iso.split('-');
    const boxY = rowY + (sigH - 5.6) / 2;
    x += this.charBoxes(x, boxY, (dd || '').split(''), 2) + 1.5;
    this.text('/', x, centreBaseline(boxY, 5.6, 10), { size: 10, color: COLORS.muted }); x += 2.5;
    x += this.charBoxes(x, boxY, (mm || '').split(''), 2) + 1.5;
    this.text('/', x, centreBaseline(boxY, 5.6, 10), { size: 10, color: COLORS.muted }); x += 2.5;
    x += this.charBoxes(x, boxY, (yy || '').split(''), 4);
    // generated line
    const gen = this.generatedAt;
    const stamp = `${String(gen.getDate()).padStart(2, '0')}/${String(gen.getMonth() + 1).padStart(2, '0')}/${gen.getFullYear()} ${String(gen.getHours()).padStart(2, '0')}:${String(gen.getMinutes()).padStart(2, '0')}`;
    this.text(`Document No. ${this.docNumber}   ·   Reference ${this.identifier}   ·   Generated ${stamp}`, this.x0 + this.cw - 2.5, y + bodyH - 2.2, { size: 7, color: COLORS.muted, align: 'right' });
    this.y = y + bodyH + 3;
  }

  build() {
    this.newPage();
    this.metaTable();
    this.attendanceSection();
    this.observationsSection();
    this.codeListBox();
    if (this.form.atp) this.atpSection(); else this.commentsSection();
    this.signOffSection();
    this.footers();
    return {
      width: PAGE.w, height: PAGE.h, pages: this.pages,
      docNumber: this.docNumber, identifier: this.identifier, title: `${this.form.formCode} ${this.form.title}`,
    };
  }
}
