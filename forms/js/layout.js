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
import { SCHOOL, DAYS, OBSERVATION_CODES, CODE_LIST, ATP_STATUS, PERIOD_SLOTS, getForm } from './schema.js';
import { encodeCode128B } from './barcode.js';
import { formatDisplayDate } from './model.js';

export const PAGE = { w: 210, h: 297, ml: 8, mr: 8, mt: 8, mb: 8, footerH: 7 };
export const COLORS = {
  // Printed and photocopied in black and white. `rule` is the mid grey used for
  // every handwriting cell border, dark enough to survive a school copier.
  brand: '#141414',
  brandDeep: '#000000',
  band: '#6B6B6B',
  bandLight: '#9A9A9A',
  pale: '#E8E8E8',
  paleAlt: '#F4F4F4',
  border: '#141414',
  rule: '#555555',
  hair: '#C4C4C4',
  text: '#1B1B1B',
  muted: '#5E5E5E',
  placeholder: '#A3A3A3',
  white: '#FFFFFF',
  boxFill: '#FFFFFF',
  boxBorder: '#555555',
};

/**
 * Corner radii, in mm. The reference form has no square corners anywhere, so
 * `rect()` falls back to RADIUS.box whenever a call does not name one.
 */
export const RADIUS = { card: 2.4, bar: 1.6, band: 1.2, box: 1.0, chip: 1.4, sig: 1.8 };

/**
 * Geometry, in printed millimetres at 100% scale. Every handwriting cell is at
 * least CELL_H tall on a ROW_PITCH grid, which is what the rest of the budget
 * is built around.
 */
const CARD_PAD = 1.5;          // card outline to contents, vertically
const CARD_PAD_X = 3.2;        // card outline to contents, horizontally (free)
const BAND_GAP = 0;            // between a title bar and the band under it
const CARD_GAP = 3;            // between blocks
const ROW_PITCH = 7;           // row to row
const CELL_H = 6.5;            // handwriting cell height
const CELL_INSET = (ROW_PITCH - CELL_H) / 2;
const CELL_GAP_X = 1.1;        // horizontal air between adjacent cells
const FIELD_H = 7;             // header entry fields
const BOX_7 = 7;               // week / term character boxes
const TICK = 5;                // completion tick boxes
const PERIOD_ROW_H = 7;
const TITLE_BAR_H = 6;         // section title bar
const INSTRUCTION_H = 5;       // instruction bar
const DAY_HEADER_H = 5;
const SUB_HEADER_H = 4;
const NO_COL_W = 8;            // row-number column
const SIGN_PAD_W = 60;
const SIGN_PAD_H = 12;
const SIGN_BLOCK_H = 15;       // pad plus its label
const HEADER_H = 22.5;         // crest, titles, form-code box and barcode (spec max 24)
const COMMENT_LINE_H = 7.5;    // ruled writing lines in section C
const RULE_LW = 0.18;          // 0.5 pt cell borders

const CARD_HEADER_H = TITLE_BAR_H;
const ROW_H = ROW_PITCH;

const PT = 0.352778; // 1pt in mm
const CAP = 0.711;   // Roboto cap height / em

/** Baseline y for text of `sizePt` vertically centred in a box [top, top+h]. */
function centreBaseline(top, h, sizePt) {
  return top + (h + CAP * sizePt * PT) / 2;
}

export function buildDocument(opts) {
  const doc = new Builder(opts).build();
  // A form that fits on one page with room to spare reads as cramped at the
  // top and empty at the foot. Measure the slack and give it back to the block
  // gaps, then rebuild. Forms with no slack are left exactly as they are.
  if (doc.pages.length !== 1 || !doc.marks?.length) return doc;
  const gaps = doc.marks.length - 1;
  const slack = BOTTOM - doc.marks[doc.marks.length - 1].y - GAP_SAFETY;
  if (gaps < 1 || slack < 1) return doc;
  const respaced = new Builder({ ...opts, extraGap: slack / gaps }).build();
  return respaced.pages.length === 1 ? respaced : doc;
}

/** Content limit and the margin kept below the last block. */
const BOTTOM = PAGE.h - PAGE.mb - PAGE.footerH;
const GAP_SAFETY = 1.5;

class Builder {
  constructor(opts) {
    this.form = getForm(opts.formType);
    this.data = opts.data;
    this.docNumber = opts.docNumber;
    this.identifier = opts.identifier;
    this.generatedAt = opts.generatedAt || new Date();
    this.crest = opts.crest;
    this.measureFn = opts.measure;
    this.blank = !!opts.blank;
    /** Extra millimetres added to every block gap, to use up spare page. */
    this.extraGap = opts.extraGap || 0;
    /** Cumulative y after each block, for the print-geometry measurement. */
    this.marks = [];
    this.pages = [];
    this.ops = null;
    this.card = null;
    this.y = 0;
    this.x0 = PAGE.ml;
    this.cw = PAGE.w - PAGE.ml - PAGE.mr;
    this.bottom = PAGE.h - PAGE.mb - PAGE.footerH;
  }

  // ---------- primitives ----------
  measure(s, size, style = 'normal') { return this.measureFn(String(s), size, style); }
  /**
   * Every rectangle is rounded. `r` defaults to RADIUS.box and is clamped to
   * half the shorter side so thin bands stay pill-shaped rather than breaking.
   * Pass r:0 only for the barcode modules, which must stay square to scan.
   */
  rect(x, y, w, h, o = {}) {
    const want = o.r === undefined ? RADIUS.box : o.r;
    const r = Math.min(want, w / 2, h / 2);
    this.ops.push({ t: 'rect', x, y, w, h, fill: o.fill || null, stroke: o.stroke || null, lw: o.lw || 0.25, r, tag: o.tag || null });
  }
  line(x1, y1, x2, y2, color = COLORS.brand, lw = 0.25) { this.ops.push({ t: 'line', x1, y1, x2, y2, color, lw }); }
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
      this.rect(bx, y, bw, bh, { fill: COLORS.boxFill, stroke: COLORS.rule, lw: RULE_LW, r: RADIUS.box, tag: o.tag || 'field' });
      const c = chars[i] || '';
      if (c) this.text(c, bx + bw / 2, centreBaseline(y, bh, o.size || 10), { size: o.size || 10, style: 'bold', align: 'center', color: COLORS.brand });
    }
    return n * bw + (n - 1) * gap;
  }
  /**
   * Rounded white input field. On a blank form the schema placeholder is shown
   * in light grey, the way the reference prints "DD / MM / YYYY" and "R".
   */
  roundedField(x, y, w, h, value, o = {}) {
    this.rect(x, y, w, h, { fill: COLORS.boxFill, stroke: COLORS.rule, lw: RULE_LW, r: RADIUS.box, tag: o.tag || 'field' });
    const size = o.size || 9;
    const shown = value ? String(value) : '';
    if (!shown) return;
    const maxW = w - 4;
    let str = shown;
    while (str.length > 1 && this.measure(str, size, o.style || 'normal') > maxW) str = str.slice(0, -1);
    if (str !== shown) str = str.slice(0, -1) + '…';
    const opts = {
      size,
      style: value ? (o.style || 'normal') : 'italic',
      color: value ? COLORS.text : COLORS.placeholder,
    };
    if (o.align === 'center') this.text(str, x + w / 2, centreBaseline(y, h, size), { ...opts, align: 'center' });
    else this.text(str, x + 2.2, centreBaseline(y, h, size), opts);
  }

  // ---------- pages ----------
  /**
   * Starts a new page. When a section card is open it is sealed at the bottom
   * of the outgoing page and reopened at the top of the new one, so a section
   * that spans pages is framed correctly on each.
   */
  newPage() {
    const hadCard = !!this.card;
    if (hadCard) { this.sealCard(this.bottom - 1); this.card = null; }
    this.ops = [];
    this.pages.push({ ops: this.ops });
    this.y = PAGE.mt;
    if (this.pages.length === 1) this.fullHeader(); else this.compactHeader();
    if (hadCard) this.beginCard();
    return hadCard;
  }
  ensure(h) {
    if (this.y + h > this.bottom) { this.newPage(); return true; }
    return false;
  }

  // ---------- section cards ----------
  /**
   * Opens a rounded card. The outline is reserved as a placeholder op now and
   * filled in once the card's height is known, so it paints behind its
   * contents without a second layout pass.
   */
  beginCard() {
    const ph = { t: 'noop' };
    this.ops.push(ph);
    this.card = { ph, y0: this.y };
  }
  sealCard(endY) {
    const c = this.card;
    if (!c) return;
    Object.assign(c.ph, {
      t: 'rect', x: this.x0, y: c.y0, w: this.cw, h: Math.max(endY - c.y0, 6),
      fill: COLORS.white, stroke: COLORS.brand, lw: 0.4, r: RADIUS.card,
    });
  }
  endCard(gap = CARD_GAP + this.extraGap) {
    this.sealCard(this.y + CARD_PAD);
    this.card = null;
    this.y += CARD_PAD + gap;
  }
  /** Navy header bar inside the top of the open card. */
  cardHeader(letter, title, subtitle) {
    const h = TITLE_BAR_H;
    const x = this.x0 + CARD_PAD_X, w = this.cw - CARD_PAD_X * 2;
    this.y += CARD_PAD;
    this.rect(x, this.y, w, h, { fill: COLORS.brand, r: RADIUS.bar });
    const by = centreBaseline(this.y, h, 11);
    let tx = x + 3;
    if (letter) tx += this.runs([{ s: `${letter}.`, size: 11, style: 'bold', color: COLORS.white }], tx, by) + 2.6;
    tx += this.runs([{ s: title, size: 11, style: 'bold', color: COLORS.white }], tx, by);
    if (subtitle) this.runs([{ s: subtitle, size: 8, style: 'italic', color: COLORS.white }], tx + 2.4, by);
    this.y += h;
  }
  /** Slate instruction band with white text, as under SECTION A of the reference. */
  /** One instruction bar, INSTRUCTION_H tall, 8 pt italic on the band grey. */
  instructionBand(notes) {
    const size = 8;
    const x = this.x0 + CARD_PAD_X, w = this.cw - CARD_PAD_X * 2;
    const line = notes.join(' ');
    this.rect(x, this.y, w, INSTRUCTION_H, { fill: COLORS.band, r: RADIUS.band });
    this.text(line, x + 2.6, centreBaseline(this.y, INSTRUCTION_H, size), { size, style: 'italic', color: COLORS.white });
    this.y += INSTRUCTION_H;
  }
  bandHeight() { return INSTRUCTION_H; }

  /**
   * Masthead: crest, school name, form title, the year and a term box on the
   * left two thirds; form-code panel over the barcode on the right. The whole
   * block is HEADER_H tall and nothing in it is set below 7 pt.
   */
  fullHeader() {
    const y = this.y;
    const right = this.x0 + this.cw;
    // the panel is sized from its widest title line so the 7 pt text can never
    // overflow the box it sits in
    const panelW = Math.max(52, ...this.form.codeBoxLines.map((l) => this.measure(l, 7, 'bold'))) + 7;
    const panelX = right - panelW;
    if (this.crest) this.image(this.crest.dataUrl, this.x0, y + 1, 20, 20);
    const cx = (this.x0 + 22 + panelX - 3) / 2;
    this.text(SCHOOL.name, cx, y + 6.6, { size: 13.5, style: 'bold', color: COLORS.brand, align: 'center' });
    this.spacedText(this.form.headerTitle, cx, y + 12, { size: 9, spacing: 0.8, style: 'bold', align: 'center', color: COLORS.band });

    // the term line is printed, not a field
    this.text(this.form.headerPeriod, cx, y + 19, { size: 9, style: 'italic', align: 'center', color: COLORS.brand });

    // form-code panel
    const panelH = 15.4, capH = 4.2;
    this.rect(panelX, y, panelW, panelH, { fill: COLORS.white, stroke: COLORS.brand, lw: 0.4, r: RADIUS.chip });
    this.rect(panelX + 0.8, y + 0.8, panelW - 1.6, capH, { fill: COLORS.brand, r: 0.8 });
    this.text('FORM CODE', panelX + panelW / 2, centreBaseline(y + 0.8, capH, 7), { size: 7, style: 'bold', align: 'center', color: COLORS.white });
    this.text(this.form.formCode, panelX + panelW / 2, y + 9.2, { size: 10.5, style: 'bold', align: 'center', color: COLORS.brand });
    this.text(this.form.codeBoxLines[0], panelX + panelW / 2, y + 11.8, { size: 7, style: 'bold', align: 'center', color: COLORS.band });
    this.text(this.form.codeBoxLines[1], panelX + panelW / 2, y + 14.3, { size: 7, style: 'bold', align: 'center', color: COLORS.band });

    // barcode plate, sized so the printed code clears the bars
    const bcY = y + panelH + 0.6, bcH = HEADER_H - panelH - 0.6;
    this.rect(panelX, bcY, panelW, bcH, { fill: COLORS.white, stroke: COLORS.hair, lw: 0.3, r: RADIUS.box });
    const pageCode = this.pageCode();
    const codeW = this.measure(pageCode, 7) + 2.4;
    this.barcode(panelX + 1.2, bcY + 0.8, panelW - 2.4 - codeW, bcH - 1.6, pageCode);
    this.text(pageCode, panelX + panelW - 1.2, centreBaseline(bcY, bcH, 7), { size: 7, align: 'right', color: COLORS.band });
    this.y = y + HEADER_H + CARD_GAP + this.extraGap;
  }

  compactHeader() {
    const y = this.y;
    if (this.crest) this.image(this.crest.dataUrl, this.x0, y, 11, 11);
    this.text(SCHOOL.name, this.x0 + 13.5, y + 4.6, { size: 11, style: 'bold', color: COLORS.brand });
    this.text(`${this.form.formCode}  ·  ${this.form.title}  ·  continued`, this.x0 + 13.5, y + 9.2, { size: 7, color: COLORS.band });
    const right = this.x0 + this.cw;
    const bcW = 34, bcH = 7.6;
    const pageCode = this.pageCode();
    this.barcode(right - bcW, y + 0.4, bcW, 4.6, pageCode);
    this.text(pageCode, right, y + 8.6, { size: 7, style: 'bold', align: 'right', color: COLORS.band });
    this.y = y + 13;
    this.identityStrip();
  }
  /** Labelled Year / Term / Week / Class (+ Subject) band. */
  identityStrip() {
    const m = this.data.meta;
    const fields = [
      ['Year', m.academicYear],
      ['Term', m.term],
      ['Week', m.week],
      ['Class', m.registerClass || m.subjectClass],
    ];
    if (this.form.type === 'subject') fields.splice(3, 0, ['Subject', m.subject]);
    const h = 6.8;
    this.rect(this.x0, this.y, this.cw, h, { fill: COLORS.pale, r: RADIUS.band });
    const slot = this.cw / fields.length;
    const by = centreBaseline(this.y, h, 8.4);
    fields.forEach(([label, value], i) => {
      const sx = this.x0 + 2.5 + i * slot;
      const lw = this.text(`${label}:`, sx, by, { size: 8.4, style: 'bold', color: COLORS.brand });
      // a writable box, so a printed page 2 can be labelled by hand
      const fx = sx + lw + 2;
      this.roundedField(fx, this.y + 1, slot - lw - 6, h - 2, value, { size: 8.4 });
    });
    this.y += h + 2.6;
  }
  /** Identifier printed and encoded on each page, e.g. SA01-P2. */
  pageCode() {
    return `${this.form.docPrefix}-P${this.pages.length}`;
  }
  barcode(x, y, w, h, value) {
    const widths = encodeCode128B(value);
    const totalModules = widths.reduce((a, b) => a + b, 0) + 20; // quiet zones
    const mod = w / totalModules;
    let cx = x + 10 * mod;
    widths.forEach((wd, i) => {
      // bars stay square: rounding the modules would break the scan
      if (i % 2 === 0) this.rect(cx, y, wd * mod, h, { fill: '#000000', r: 0 });
      cx += wd * mod;
    });
  }
  footers() {
    const n = this.pages.length;
    this.pages.forEach((p, i) => {
      const saved = this.ops; this.ops = p.ops;
      const y = PAGE.h - PAGE.mb - PAGE.footerH;
      this.rect(this.x0, y + 1, this.cw, 0.3, { fill: COLORS.hair, r: 0.15 });
      const by = y + 5.4;
      this.runs([
        { s: this.form.formCode, size: 7, style: 'bold', color: COLORS.brand },
        { s: '   |   ', size: 7, color: COLORS.hair },
        { s: this.form.title, size: 7, color: COLORS.band },
      ], this.x0, by);
      this.text(SCHOOL.name.replace(/\b(\w)(\w*)/g, (_, a, r) => a + r.toLowerCase()), this.x0 + this.cw / 2 + 8, by, { size: 7, color: COLORS.band, align: 'center' });
      const chipW = 20, chipH = 4.6, chipX = this.x0 + this.cw - chipW, chipY = by - 3.4;
      this.rect(chipX, chipY, chipW, chipH, { fill: COLORS.pale, r: RADIUS.chip });
      this.text(`Page ${i + 1} of ${n}`, chipX + chipW / 2, centreBaseline(chipY, chipH, 7), { size: 7, style: 'bold', color: COLORS.brand, align: 'center' });
      this.ops = saved;
    });
  }

  // ---------- blocks ----------
  /**
   * Header block: label cell in pale grey, value in a rounded white field,
   * exactly as the "In case of incomplete information" block of the reference.
   */
  metaTable() {
    const rows = this.form.meta.rows;
    this.ensure(CARD_PAD * 2 + FIELD_H * rows.length + CARD_GAP);
    this.beginCard();
    this.y += CARD_PAD;
    const x0 = this.x0 + CARD_PAD_X, cw = this.cw - CARD_PAD_X * 2;
    // one label width for the first field of every row, so the boxes line up
    const leadLabelW = Math.max(...rows.map((r) => this.labelWidth(r[0]))) + 4;
    rows.forEach((row, ri) => {
      const y = this.y + ri * FIELD_H;
      const spanTotal = row.reduce((a, f) => a + f.span, 0);
      let x = x0;
      row.forEach((f, fi) => {
        const w = (cw * f.span) / spanTotal;
        const labelW = fi === 0 ? leadLabelW : this.labelWidth(f) + 4;
        this.rect(x + 0.3, y + 0.3, labelW, FIELD_H - 0.6, { fill: COLORS.pale, r: RADIUS.band });
        const by = centreBaseline(y, FIELD_H, 9);
        let lx = x + 2.5;
        lx += this.text(f.label, lx, by, { size: 9, style: 'bold', color: COLORS.brand });
        // the date format is a small label beside the field, never inside it
        if (f.hint) this.text(` ${f.hint}`, lx, by, { size: 7, color: COLORS.band });
        const value = String(this.data.meta[f.key] ?? '');
        if (f.kind === 'chars') {
          const chars = f.alignRight ? value.padStart(f.length, ' ').split('').map((c) => c.trim()) : value.split('');
          this.charBoxes(x + labelW + 2, y + (FIELD_H - BOX_7) / 2, chars, f.length, { bw: BOX_7, bh: BOX_7, gap: 0.8, size: 11, tag: 'field' });
        } else {
          this.roundedField(x + labelW + 2, y, w - labelW - 2.4, FIELD_H, value, { size: 10, tag: 'field' });
        }
        x += w;
      });
    });
    this.y += FIELD_H * rows.length;
    this.endCard();
  }

  /** Width of a field's label, including its hint where it has one. */
  labelWidth(f) {
    return this.measure(f.label, 9, 'bold') + (f.hint ? this.measure(` ${f.hint}`, 7) : 0);
  }

  /**
   * Generic table with repeated header rows across page breaks. Rows are drawn
   * as alternating full-width bands; `drawRow` places the inset field boxes.
   */
  table({ cols, headerRows, rows, rowH, drawRow, keepWithHeader = 2, continuedBanner, footerRow }) {
    const x0 = this.x0 + CARD_PAD_X, cw = this.cw - CARD_PAD_X * 2;
    const headerH = headerRows.reduce((a, r) => a + r.h, 0);
    const drawHeader = () => {
      let y = this.y + BAND_GAP;
      for (const hr of headerRows) {
        let ci = 0; let x = x0;
        for (const cell of hr.cells) {
          const w = cols.slice(ci, ci + cell.span).reduce((a, c) => a + c.w, 0);
          if (cell.skip) { x += w; ci += cell.span; continue; } // covered by a rowSpan cell above
          const rowSpanH = cell.rowSpan ? headerRows.slice(headerRows.indexOf(hr), headerRows.indexOf(hr) + cell.rowSpan).reduce((a, r) => a + r.h, 0) : hr.h;
          // each header group is its own rounded chip with a hairline gap
          this.rect(x + CELL_GAP_X, y + 0.3, w - CELL_GAP_X * 2, rowSpanH - 0.6, { fill: cell.tone === 'pale' ? COLORS.pale : COLORS.band, r: RADIUS.band });
          if (cell.text) this.text(cell.text, x + w / 2, centreBaseline(y, rowSpanH, cell.size || 9), { size: cell.size || 9, style: 'bold', align: 'center', color: cell.tone === 'pale' ? COLORS.brand : COLORS.white });
          x += w; ci += cell.span;
        }
        y += hr.h;
      }
      this.y = y;
    };
    const need = BAND_GAP + headerH + rowH * Math.min(keepWithHeader, rows.length) + (rows.length <= keepWithHeader && footerRow ? footerRow.h : 0);
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
      // zebra band behind the row, no cell grid
      if (i % 2 === 0) this.rect(x0, this.y, cw, rowH, { fill: COLORS.paleAlt, r: RADIUS.band });
      drawRow(row, i, this.y, rowH);
      this.y += rowH;
    });
    if (footerRow) {
      this.rect(x0 + 0.3, this.y + 0.6, cw - 0.6, footerRow.h - 0.6, { fill: COLORS.pale, r: RADIUS.band });
      this.text(footerRow.text, x0 + 3, centreBaseline(this.y + 0.6, footerRow.h - 0.6, 8.4), { size: 8.4, style: 'italic', color: COLORS.brand });
      this.y += footerRow.h;
    }
  }

  /** One inset rounded field inside a table row. */
  cell(x, y, w, h, value, o = {}) {
    const ix = x + CELL_GAP_X, iy = y + CELL_INSET;
    const iw = w - CELL_GAP_X * 2, ih = CELL_H;
    this.rect(ix, iy, iw, ih, { fill: COLORS.white, stroke: COLORS.rule, lw: RULE_LW, r: RADIUS.box, tag: 'cell' });
    if (value !== '' && value != null) this.text(value, ix + iw / 2, centreBaseline(iy, ih, o.size || 10), { size: o.size || 10, style: o.style || 'normal', align: 'center', color: o.color || COLORS.text });
  }
  /** Row-number gutter: plain brand-coloured figure on the band, no box (as the reference). */
  rowNumber(x, y, w, h, n) {
    this.text(String(n), x + w / 2, centreBaseline(y, h, 9), { size: 9, style: 'bold', align: 'center', color: COLORS.brand });
  }

  /**
   * Slot model: a row is an entry slot, not a learner. Section A holds the
   * slots that fit on page 1; anything beyond continues in Section A2.
   */
  attendanceGrid({ sec, rows, firstSlot, letter, title, subtitle, notes, footerText }) {
    const cw = this.cw - CARD_PAD_X * 2;
    const noW = NO_COL_W; const dayW = (cw - noW) / DAYS.length; const subW = dayW / 2;
    const cols = [{ w: noW }, ...DAYS.flatMap(() => [{ w: subW }, { w: subW }])];
    const headerRows = [
      { h: DAY_HEADER_H, cells: [{ span: 1, text: 'No.', rowSpan: 2, tone: 'pale', size: 7 }, ...DAYS.map((d) => ({ span: 2, text: d.label, size: 9 }))] },
      { h: SUB_HEADER_H, cells: [{ span: 1, text: '', skip: true }, ...DAYS.flatMap(() => [{ span: 1, text: 'A', tone: 'pale', size: 7 }, { span: 1, text: 'L', tone: 'pale', size: 7 }])] },
    ];
    const rowH = ROW_H;
    const open = () => {
      this.beginCard();
      this.cardHeader(letter, title, subtitle);
      if (notes) this.instructionBand(notes);
    };
    const headerH = headerRows.reduce((a, r) => a + r.h, 0);
    const periodH = sec.periodRow ? PERIOD_ROW_H + BAND_GAP : 0;
    const frame = CARD_PAD + CARD_HEADER_H + (notes ? this.bandHeight() : 0) + periodH + BAND_GAP + headerH;
    // the form is a single page by design, so the whole grid is kept together
    this.ensure(frame + rowH * rows.length + (footerText ? 6 : 0) + CARD_PAD + CARD_GAP);
    open();
    if (sec.periodRow) this.periodRow(sec.periodRow, noW, dayW);
    this.table({
      cols, headerRows, rows, rowH,
      footerRow: footerText ? { h: 6, text: footerText } : null,
      drawRow: (row, i, y, h) => {
        let x = this.x0 + CARD_PAD_X;
        this.rowNumber(x, y, noW, h, firstSlot + i); x += noW;
        for (const d of DAYS) {
          this.cell(x, y, subW, h, row[d.key].a); x += subW;
          this.cell(x, y, subW, h, row[d.key].l); x += subW;
        }
      },
    });
    this.endCard();
  }

  /** A row of per-day period boxes sitting above the day header. */
  periodRow(cfg, noW, dayW) {
    const x0 = this.x0 + CARD_PAD_X;
    const y = this.y;
    const h = PERIOD_ROW_H;
    const slots = cfg.slots || PERIOD_SLOTS;
    this.rect(x0, y, noW, h, { fill: COLORS.pale, r: RADIUS.box });
    this.text(cfg.label, x0 + noW / 2, centreBaseline(y, h, 7), { size: 7, style: 'bold', align: 'center', color: COLORS.brand });
    DAYS.forEach((d, i) => {
      const x = x0 + noW + i * dayW;
      // one box per period slot, sharing the day's column
      const gap = 1.2;
      const bw = (dayW - 3 - gap * (slots - 1)) / slots;
      for (let k = 0; k < slots; k++) {
        this.roundedField(x + 1.5 + k * (bw + gap), y + 0.25, bw, h - 0.5, this.data.periods?.[d.key]?.[k] || '', { size: 9, style: 'bold', align: 'center' });
      }
    });
    this.y = y + h;
  }

  attendanceSection() {
    const sec = this.form.attendance;
    this.attendanceGrid({
      sec,
      rows: this.data.attendance.slice(0, sec.defaultRows),
      firstSlot: 1,
      letter: sec.letter,
      title: sec.title,
      subtitle: sec.subtitle,
      notes: sec.notes,
      footerText: null,
    });
  }

  observationsSection() {
    const sec = this.form.observations;
    const rows = this.data.observations;
    const cw = this.cw - CARD_PAD_X * 2;
    const noW = NO_COL_W; const dayW = (cw - noW) / DAYS.length;
    const rowH = ROW_H;
    const headerRows = [
      { h: DAY_HEADER_H, cells: [{ span: 1, text: 'No.', rowSpan: 2, tone: 'pale', size: 7 }, ...DAYS.map((d) => ({ span: 2, text: d.label, size: 9 }))] },
      { h: SUB_HEADER_H, cells: [{ span: 1, text: '', skip: true }, ...DAYS.flatMap(() => [{ span: 1, text: 'Learner no.', size: 7, tone: 'pale' }, { span: 1, text: 'Code', size: 7, tone: 'pale' }])] },
    ];
    const headerH = headerRows.reduce((a, r) => a + r.h, 0);
    const frame = CARD_PAD + CARD_HEADER_H + this.bandHeight() + BAND_GAP + headerH;
    this.ensure(frame + rowH * rows.length + (sec.showCodeList ? this.codeListHeight() : 0) + CARD_PAD + CARD_GAP);
    this.beginCard();
    this.cardHeader(sec.letter, sec.title, sec.subtitle);
    this.instructionBand(sec.notes);
    const learnerW = dayW * 0.6, codeW = dayW * 0.4;
    const cols = [{ w: noW }, ...DAYS.flatMap(() => [{ w: learnerW }, { w: codeW }])];
    this.table({
      cols, headerRows, rows, rowH,
      drawRow: (row, i, y, h) => {
        let x = this.x0 + CARD_PAD_X;
        this.rowNumber(x, y, noW, h, i + 1); x += noW;
        for (const d of DAYS) {
          this.cell(x, y, learnerW, h, row[d.key].learner); x += learnerW;
          this.cell(x, y, codeW, h, row[d.key].code, { style: 'bold', color: COLORS.brand }); x += codeW;
        }
      },
    });
    // where it is printed, the code list belongs with the observations it
    // explains, so it sits inside this card rather than one of its own
    if (sec.showCodeList) this.codeList();
    this.endCard();
  }

  codeListHeight() { return BAND_GAP + 5.0 + 5.8; }

  /** Observation codes, printed inside Section B. Identical on both forms. */
  codeList() {
    const x0 = this.x0 + CARD_PAD_X, cw = this.cw - CARD_PAD_X * 2;
    const y = this.y + BAND_GAP;
    const h1 = 5.0, h2 = 5.8;
    this.rect(x0, y, cw, h1, { fill: COLORS.pale, r: RADIUS.band });
    this.runs([
      { s: CODE_LIST.title, size: 8.6, style: 'bold', color: COLORS.brand },
      { s: `  ${CODE_LIST.subtitle}`, size: 7.4, style: 'italic', color: COLORS.band },
    ], x0 + 3, centreBaseline(y, h1, 8.6));
    const by = centreBaseline(y + h1, h2, 8.6);
    const slot = (cw - 4) / OBSERVATION_CODES.length;
    OBSERVATION_CODES.forEach((c, i) => {
      const sx = x0 + 2 + i * slot;
      const bw = 4.8, bh = 4.8, bY = y + h1 + (h2 - bh) / 2;
      this.rect(sx, bY, bw, bh, { fill: COLORS.white, stroke: COLORS.brand, lw: 0.3, r: RADIUS.box });
      this.text(c.code, sx + bw / 2, centreBaseline(bY, bh, 8.6), { size: 8.6, style: 'bold', align: 'center', color: COLORS.brand });
      this.text(c.label, sx + bw + 2.2, by, { size: 7.8 });
    });
    this.y = y + h1 + h2;
  }

  /**
   * Flow wrapped text lines across pages inside a rounded container.
   * `minLines` pads the first block with blank lines, but blank padding never
   * spills onto a new page.
   */
  flowLines(lines, { lh, minLines, size, style, ruled, continuedBanner }) {
    const x0 = this.x0 + CARD_PAD_X, cw = this.cw - CARD_PAD_X * 2;
    const textCount = lines.length;
    const total = Math.max(textCount, minLines || 0);
    let i = 0;
    while (i < total) {
      if (i > 0 && i >= textCount) break; // only padding left – do not spill onto a new page
      const avail = Math.floor((this.bottom - this.y - CARD_PAD - 2) / lh);
      if (avail < Math.min(2, total - i)) { this.newPage(); if (continuedBanner) continuedBanner(); continue; }
      let take = Math.min(avail, total - i);
      const remainingText = textCount - i;
      // avoid orphaning a single last text line on the next page
      if (remainingText > take && remainingText - take === 1 && take > 2) take -= 1;
      const y0 = this.y;
      this.rect(x0, y0, cw, take * lh + 1.5, { fill: COLORS.white, stroke: COLORS.rule, lw: RULE_LW, r: RADIUS.box, tag: 'writing-box' });
      for (let k = 0; k < take; k++) {
        const ly = y0 + 0.75 + lh * k;
        if (ruled && k < take - 1) this.rect(x0 + 3, ly + lh, cw - 6, 0.2, { fill: COLORS.hair, r: 0.1 });
        const s = lines[i + k];
        if (s) this.text(s, x0 + 3, ly + lh - 1.8, { size, style });
      }
      this.y = y0 + take * lh + 1.5;
      i += take;
      if (i < textCount) { this.newPage(); if (continuedBanner) continuedBanner(); }
    }
  }

  commentsSection() {
    const c = this.form.comments;
    const size = 8.6, lh = 5.2;
    const lines = this.wrap(this.data.comments, this.cw - CARD_PAD_X * 2 - 6, size);
    this.ensure(CARD_PAD + CARD_HEADER_H + lh * 2 + 6);
    const open = (cont) => { this.beginCard(); this.cardHeader(null, c.title, cont ? '(continued)' : c.subtitle); };
    open(false);
    this.flowLines(lines, { lh, minLines: c.minLines, size, ruled: this.blank, continuedBanner: () => open(true) });
    this.endCard();
  }

  /** Total height the sign-off card occupies, including its frame and trailing gap. */
  signOffHeight() {
    return CARD_PAD + CARD_HEADER_H + BAND_GAP + this.signOffBodyHeight() + CARD_PAD + CARD_GAP;
  }
  /**
   * Body height, measured rather than guessed: the declaration is wrapped at
   * the real column width and the taller (HOD) signature column decides the
   * rest. Guessing this is what previously pushed the date boxes through the
   * bottom of the card.
   */
  /** True when the sign-off captures anything besides the signature. */
  hasSignOffFields() {
    const so = this.form.signOff;
    return (so.fields?.length || 0) + (so.dates?.length || 0) > 0;
  }
  signOffBodyHeight() {
    const cw = this.cw - CARD_PAD_X * 2;
    const declLines = this.wrap(this.form.signOff.declaration, cw - 6, 7.8, 'italic').length;
    const band = this.hasSignOffFields() ? SIGN_FIELD_ROW_H + 1.6 : 0;
    return 3.2 + declLines * 3.7 + band + 1.8 + SIGN_PAD_H + SIGN_PAD_LABEL_H;
  }

  /** The signature pad itself, drawn at (x, y). */
  signaturePad(x, y, w) {
    this.rect(x, y, w, SIGN_PAD_H, { fill: COLORS.white, stroke: COLORS.rule, lw: RULE_LW, r: RADIUS.sig, tag: 'signature' });
    const sig = this.data.signOff?.signature;
    if (sig && sig.dataUrl) {
      const pad = 1.2;
      const ratio = Math.min((w - pad * 2) / sig.width, (SIGN_PAD_H - pad * 2) / sig.height);
      const sw = sig.width * ratio, sh = sig.height * ratio;
      this.image(sig.dataUrl, x + (w - sw) / 2, y + (SIGN_PAD_H - sh) / 2, sw, sh);
    }
  }

  /**
   * Sign-off. 'card' draws a titled section with the declaration; 'bare' drops
   * the section entirely and leaves a right-aligned signature box, which gives
   * the section above it the rest of the page.
   */
  signOffSection() {
    if (this.form.signOff.style === 'bare') return this.bareSignature();
    const so = this.form.signOff;
    const bodyH = this.signOffBodyHeight();
    this.ensure(this.signOffHeight());
    this.beginCard();
    this.cardHeader(so.letter, so.title, '');
    const x0 = this.x0 + CARD_PAD_X, cw = this.cw - CARD_PAD_X * 2;
    const y = this.y + BAND_GAP;
    const sign = this.data.signOff || {};
    const decl = this.wrap(so.declaration, cw - 6, 7.8, 'italic');
    decl.forEach((l, i) => this.text(l, x0 + 3, y + 3.2 + i * 3.7, { size: 7.8, style: 'italic', color: COLORS.band }));

    // a band of fields, only when the sign-off captures anything besides the signature
    let rowY = y + 3.2 + decl.length * 3.7;
    if (this.hasSignOffFields()) {
      rowY += 1.6;
      this.rect(x0, rowY, cw, SIGN_FIELD_ROW_H, { fill: COLORS.paleAlt, r: RADIUS.band });
      const by = centreBaseline(rowY, SIGN_FIELD_ROW_H, 8.4);
      const bo = { bw: 4.6, bh: 5.2, gap: 0.7, size: 8.6 };
      const boxY = rowY + (SIGN_FIELD_ROW_H - bo.bh) / 2;
      let x = x0 + 3;
      for (const f of so.fields) {
        x += this.text(f.label, x, by, { size: 8.4, style: 'bold', color: COLORS.brand }) + 2.2;
        // a single-digit value reads better in the right-hand box, as "  5" not "5  "
        const raw = String(sign[f.key] || '');
        const chars = f.alignRight ? raw.padStart(f.length, ' ').split('').map((c) => c.trim()) : raw.split('');
        x += this.charBoxes(x, boxY, chars, f.length, bo) + 7;
      }
      for (const d of so.dates) {
        x += this.text(d.label, x, by, { size: 8.4, style: 'bold', color: COLORS.brand }) + 2.2;
        x += this.dateBoxes(x, boxY, sign[d.key], bo) + 7;
      }
      rowY += SIGN_FIELD_ROW_H;
    }

    const padY = rowY + 1.8;
    const padW = Math.min(cw - 6, 62);
    this.signaturePad(x0 + 3, padY, padW);
    const capBy = padY + SIGN_PAD_H + 3;
    this.text(`${so.educatorLabel} signature`, x0 + 3, capBy, { size: 7, color: COLORS.band });
    // the stamp shares the caption's baseline rather than taking a line of its
    // own, so a submitted form is exactly as tall as a blank and stays on one page
    if (!this.blank) this.text(this.stampLine(), x0 + cw - 1, capBy, { size: 6.6, color: COLORS.band, align: 'right' });
    this.y = y + bodyH;
    this.endCard();
  }

  /** Signature box alone, right-aligned, with no surrounding section. */
  bareSignature() {
    const so = this.form.signOff;
    const w = SIGN_PAD_W;
    // the footer follows, so the block needs its own height only — reserving a
    // trailing gap here was pushing the subject form onto a second page
    this.ensure(SIGN_BLOCK_H);
    const y = this.y;
    const x = this.x0 + this.cw - w;
    this.signaturePad(x, y, w);
    const capBy = y + SIGN_PAD_H + 2.6;
    this.text(`${so.educatorLabel} signature`, x, capBy, { size: 7, color: COLORS.band });
    if (!this.blank) this.text(this.stampLine(), this.x0, capBy, { size: 7, color: COLORS.band });
    this.y = y + SIGN_BLOCK_H + CARD_GAP;
  }

  /** Document number, reference and generation time, for submitted forms. */
  stampLine() {
    const gen = this.generatedAt;
    const stamp = `${String(gen.getDate()).padStart(2, '0')}/${String(gen.getMonth() + 1).padStart(2, '0')}/${gen.getFullYear()} ${String(gen.getHours()).padStart(2, '0')}:${String(gen.getMinutes()).padStart(2, '0')}`;
    return `Document No. ${this.docNumber}   ·   Reference ${this.identifier}   ·   Generated ${stamp}`;
  }

  /** DD / MM / YYYY boxes from an ISO date. Returns the width drawn. */
  dateBoxes(x, y, iso, bo) {
    const [yy, mm, dd] = String(iso || '').split('-');
    let dx = x;
    dx += this.charBoxes(dx, y, (dd || '').split(''), 2, bo) + 1;
    this.text('/', dx, centreBaseline(y, bo.bh, 8.6), { size: 8.6, color: COLORS.band }); dx += 2;
    dx += this.charBoxes(dx, y, (mm || '').split(''), 2, bo) + 1;
    this.text('/', dx, centreBaseline(y, bo.bh, 8.6), { size: 8.6, color: COLORS.band }); dx += 2;
    dx += this.charBoxes(dx, y, (yy || '').split(''), 4, bo);
    return dx - x;
  }

  /** Section C on the subject form: ATP reference, completion tick and notes. */
  atpSection() {
    const sec = this.form.atp;
    const atp = this.data.atp || { code: '', status: '' };
    const size = 9, lh = COMMENT_LINE_H;
    const lines = this.wrap(this.data.comments, this.cw - CARD_PAD_X * 2 - 6, size);
    const rowH = 9, labH = INSTRUCTION_H;
    const minLines = this.form.comments.minLines;
    this.ensure(CARD_PAD * 2 + TITLE_BAR_H + labH + rowH + labH + lh * minLines + 1.5 + CARD_GAP);
    this.beginCard();
    this.cardHeader(sec.letter, sec.title, '');
    const x0 = this.x0 + CARD_PAD_X, cw = this.cw - CARD_PAD_X * 2;
    // the ATP label is 86 mm at 9 pt, so it takes its own bar rather than
    // squeezing the 60 mm field and the tick boxes off the page
    this.rect(x0, this.y, cw, labH, { fill: COLORS.pale, r: RADIUS.band });
    this.text(sec.codeLabel, x0 + 3, centreBaseline(this.y, labH, 9), { size: 9, style: 'bold', color: COLORS.brand });
    this.y += labH;
    const y = this.y;
    this.rect(x0, y, cw, rowH, { fill: COLORS.paleAlt, r: RADIUS.band });
    const by = centreBaseline(y, rowH, 9);
    let x = x0 + 3;
    const fieldW = 60;
    this.roundedField(x, y + (rowH - FIELD_H) / 2, fieldW, FIELD_H, atp.code, { size: 10, style: 'bold' });
    x += fieldW + 8;
    x += this.text(sec.tickLabel, x, by, { size: 9, style: 'bold', color: COLORS.brand }) + 3;
    for (const st of ATP_STATUS) {
      const cy = y + (rowH - TICK) / 2;
      this.rect(x, cy, TICK, TICK, { fill: COLORS.white, stroke: COLORS.rule, lw: RULE_LW, r: RADIUS.box, tag: 'tick' });
      if (atp.status === st.value) {
        this.line(x + 1, cy + 2.6, x + 2.1, cy + 4, COLORS.brand, 0.6);
        this.line(x + 2.1, cy + 4, x + 4.1, cy + 1.1, COLORS.brand, 0.6);
      }
      x += TICK + 2;
      x += this.text(st.label, x, by, { size: 9 }) + 5;
    }
    this.y = y + rowH;
    this.rect(x0, this.y, cw, labH, { fill: COLORS.pale, r: RADIUS.band });
    this.runs([
      { s: sec.commentsLabel, size: 8, style: 'bold', color: COLORS.brand },
      { s: ` ${sec.commentsHint}`, size: 8, style: 'italic', color: COLORS.band },
    ], x0 + 3, centreBaseline(this.y, labH, 8));
    this.y += labH;
    this.flowLines(lines, { lh, minLines, size, ruled: true });
    this.endCard();
  }

  /**
   * SA-OC: the observation-code reference sheet. It has no fields, so it is
   * drawn from the same cards, title bars and bands as the weekly forms.
   */
  codeTable(cfg, title, subtitle, rows, blank) {
    const { codeW, obsW, rowH } = cfg;
    const bodyH = rows.length * rowH;
    this.ensure(CARD_PAD + CARD_HEADER_H + BAND_GAP + 5 + bodyH + CARD_PAD + CARD_GAP);
    this.beginCard();
    this.cardHeader(null, title, subtitle);
    const x0 = this.x0 + CARD_PAD_X, cw = this.cw - CARD_PAD_X * 2;
    const descX = x0 + codeW + obsW;
    const descW = cw - codeW - obsW;

    // column headings, in the same pale band the grids use
    this.rect(x0, this.y, cw, 5, { fill: COLORS.pale, r: RADIUS.band });
    const hb = centreBaseline(this.y, 5, 7);
    this.text('Code', x0 + 3, hb, { size: 7, style: 'bold', color: COLORS.brand });
    this.text('Observation', x0 + codeW + 3, hb, { size: 7, style: 'bold', color: COLORS.brand });
    this.text('Description', descX + 3, hb, { size: 7, style: 'bold', color: COLORS.brand });
    this.y += 5;

    rows.forEach((r, i) => {
      const y = this.y + i * rowH;
      if (i % 2 === 0) this.rect(x0, y, cw, rowH, { fill: COLORS.paleAlt, r: RADIUS.band });
      if (blank) {
        // empty rows for the school's own codes
        this.rect(x0 + 1, y + 2, codeW - 2, rowH - 4, { fill: COLORS.white, stroke: COLORS.rule, lw: RULE_LW, r: RADIUS.box, tag: 'field' });
        this.rect(x0 + codeW + 1, y + 2, obsW - 2, rowH - 4, { fill: COLORS.white, stroke: COLORS.rule, lw: RULE_LW, r: RADIUS.box, tag: 'field' });
        this.rect(descX + 1, y + 2, descW - 2, rowH - 4, { fill: COLORS.white, stroke: COLORS.rule, lw: RULE_LW, r: RADIUS.box, tag: 'field' });
        return;
      }
      const [code, obs, desc] = r;
      this.text(code, x0 + 3, centreBaseline(y, rowH, 14), { size: 14, style: 'bold', color: COLORS.brand });
      const ol = this.wrap(obs, obsW - 6, 10, 'bold');
      ol.forEach((l, k) => this.text(l, x0 + codeW + 3, centreBaseline(y, rowH, 10) - (ol.length - 1) * 2 + k * 4, { size: 10, style: 'bold' }));
      const dl = this.wrap(desc, descW - 6, 10);
      dl.forEach((l, k) => this.text(l, descX + 3, centreBaseline(y, rowH, 10) - (dl.length - 1) * 2 + k * 4, { size: 10 }));
    });
    this.y += bodyH;
    this.endCard();
  }

  buildReference() {
    const f = this.form;
    this.newPage();
    const intro = this.wrap(f.intro, this.cw - 6, 9);
    intro.forEach((l, i) => this.text(l, this.x0 + 1, this.y + 4 + i * 4.4, { size: 9 }));
    this.y += 4 + intro.length * 4.4 + 4;
    this.codeTable(f.table, f.table.title, '', f.rows, false);
    this.codeTable(f.table, f.blankHeading, f.blankSubtitle, Array.from({ length: f.blankRows }, () => null), true);
    this.text(f.note, this.x0 + 1, this.y + 3.5, { size: 8, style: 'italic', color: COLORS.band });
    this.footers();
    return {
      width: PAGE.w, height: PAGE.h, pages: this.pages,
      docNumber: this.docNumber, identifier: this.identifier,
      title: `${f.formCode} ${f.title}`, marks: this.marks,
    };
  }

  build() {
    if (this.form.kind === 'reference') return this.buildReference();
    const mark = (name) => this.marks.push({ name, y: Math.round(this.y * 100) / 100, page: this.pages.length });
    this.newPage();
    mark('header');
    this.metaTable();
    mark('info panel');
    this.attendanceSection();
    mark('section A');
    this.observationsSection();
    mark('section B');
    if (this.form.atp) { this.atpSection(); mark('section C'); }
    else if (this.form.comments) { this.commentsSection(); mark('comments'); }
    this.signOffSection();
    mark('signature');
    this.footers();
    return {
      width: PAGE.w, height: PAGE.h, pages: this.pages,
      docNumber: this.docNumber, identifier: this.identifier, title: `${this.form.formCode} ${this.form.title}`,
      marks: this.marks,
    };
  }
}
