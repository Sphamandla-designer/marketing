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
  // the ruled grid: shared cell borders, the row-number gutter and the zebra
  grid: '#9A9A9A',
  gutter: '#F2F2F2',
  zebra: '#FAFAFA',
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
 * least M.cell tall on a M.cell grid, which is what the rest of the budget
 * is built around.
 */
/**
 * The vertical scale, in millimetres. SPEC holds the print spec's target
 * values; FIT_LADDER below reduces them, in the order the spec dictates, until
 * a sheet fits one page. `useMetrics` publishes the chosen set as M.
 */
const SPEC = {
  margin: 12,    // page margin, all four sides
  pad: 4,        // section container inner padding, all sides
  gap: 5,        // vertical space between sections
  fieldGap: 4,   // between adjacent header fields
  field: 9,      // header input line height
  cell: 8,       // writable grid cell height; the row pitch of a ruled grid
  line: 8,       // ruled comment-line spacing
};
let M = { ...SPEC };
function useMetrics(m) {
  M = m;
  PAGE.ml = PAGE.mr = PAGE.mt = PAGE.mb = m.margin;
}

const LABEL_GAP = 3;           // a label to its own input field
const BAND_GAP = 0;            // between a title bar and the band under it
const PILL_GAP = 0.5;          // day-pill inset, so adjacent pills read apart
const BOX_7 = 7;               // week / term character boxes
const TICK = 5;                // completion tick boxes
const TICK_GAP = 3;            // a tick box to its label
const PERIOD_ROW_H = 7;
const TITLE_BAR_H = 6;         // section title bar
const INSTRUCTION_H = 5;       // instruction bar
const DAY_HEADER_H = 5;
const SUB_HEADER_H = 4;
const NO_COL_W = 8;            // row-number column
const SIGN_PAD_W = 60;
const SIGN_PAD_H = 10;
const SIGN_BLOCK_H = 13;       // pad plus its label
const SIGN_FIELD_ROW_H = 9;    // sign-off field band, where a form has one
const SIGN_PAD_LABEL_H = 3;
const HEADER_H = 22.5;         // crest, titles, form-code box and barcode
const RULE_LW = 0.18;          // 0.5 pt input-box borders
const GRID_LW = 0.18;          // 0.5 pt shared cell borders
const DAY_LW = 0.53;           // 1.5 pt divider between day groups
const TEXT_LINE = 4.4;         // one line of 10 pt body text in a code row
const NOTE_H = 6;              // the closing note on the reference sheet

const CARD_HEADER_H = TITLE_BAR_H;

const PT = 0.352778; // 1pt in mm
const CAP = 0.711;   // Roboto cap height / em

/** Baseline y for text of `sizePt` vertically centred in a box [top, top+h]. */
function centreBaseline(top, h, sizePt) {
  return top + (h + CAP * sizePt * PT) / 2;
}

/**
 * The spec's reduction order, applied cumulatively until a sheet fits one
 * page: section spacing, container padding, header field height, then cell
 * height. The page margin is not in the spec's ladder, but the ladder cannot
 * close the gap on the weekly forms on its own, so the margin is traded before
 * the 8 mm cell minimum and the result is reported on doc.metrics.
 */
const FIT_LADDER = [
  {},                // the spec's own values
  { margin: 10 },    // the page margin goes before any space between boxes
  { margin: 8 },
  { gap: 4.5 },      // the working floor for the space between boxes
  { fieldGap: 3 },
  { field: 8 },      // spec floor: header field height
  { line: 7.5 },
  { cell: 7 },       // the hard floor: never below 7 mm
  { pad: 3 },        // spec floor: container padding
  { fieldGap: 2 },
  { line: 7 },
  { pad: 2.5 },
  { field: 7 },
  { fieldGap: 1 },
  { pad: 2 },
  { pad: 1.5 },
  { gap: 4 },        // only once everything else has been spent
  { gap: 3.5 },
  { gap: 3 },
];

export function buildDocument(opts) {
  const metrics = { ...SPEC };
  let doc = null, chosen = null;
  for (let i = 0; i < FIT_LADDER.length; i++) {
    Object.assign(metrics, FIT_LADDER[i]);
    useMetrics({ ...metrics });
    doc = new Builder(opts).build();
    chosen = { ...metrics, step: i };
    if (doc.pages.length === 1) break;
  }
  doc.metrics = chosen;
  // A form that fits with room to spare reads as cramped at the top and empty
  // at the foot. Measure the slack and give it back to the block gaps, then
  // rebuild. Forms with no slack are left exactly as they are.
  if (doc.pages.length !== 1 || !doc.marks?.length) return doc;
  const gaps = doc.gapSlots || doc.marks.length - 1;
  const slack = bottomY() - doc.marks[doc.marks.length - 1].y - GAP_SAFETY;
  if (gaps < 1 || slack < 1) return doc;
  const respaced = new Builder({ ...opts, extraGap: slack / gaps }).build();
  if (respaced.pages.length !== 1) return doc;
  respaced.metrics = { ...chosen, gapUsed: Math.round((chosen.gap + slack / gaps) * 10) / 10 };
  return respaced;
}

/** Content limit and the margin kept below the last block. */
function bottomY() { return PAGE.h - PAGE.mb - PAGE.footerH; }
const GAP_SAFETY = 0.5;

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
    /** Block gaps that grow with extraGap, so slack is shared out correctly. */
    this.gapSlots = 0;
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
      this.rect(bx, y, bw, bh, { fill: COLORS.boxFill, stroke: COLORS.grid, lw: GRID_LW, r: 0, tag: o.tag || 'field' });
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
    this.rect(x, y, w, h, { fill: COLORS.boxFill, stroke: COLORS.grid, lw: GRID_LW, r: 0, tag: o.tag || 'field' });
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
  endCard(gap = M.gap + this.extraGap) {
    this.sealCard(this.y + M.pad);
    this.card = null;
    this.gapSlots++;
    this.y += M.pad + gap;
  }
  /** Navy header bar inside the top of the open card. */
  cardHeader(letter, title, subtitle) {
    const h = TITLE_BAR_H;
    const x = this.x0 + M.pad, w = this.cw - M.pad * 2;
    this.y += M.pad;
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
    const x = this.x0 + M.pad, w = this.cw - M.pad * 2;
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
    this.gapSlots++;
    this.y = y + HEADER_H + M.gap + this.extraGap;
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
   * Header block: a pale label cell, then LABEL_GAP of air, then the input line.
   * Rows are M.field tall and sit M.fieldGap apart, and fields within a row are
   * separated by the same M.fieldGap.
   */
  metaTable() {
    const rows = this.form.meta.rows;
    const pitch = M.field + M.fieldGap;
    const bodyH = M.field + (rows.length - 1) * pitch;
    this.ensure(M.pad * 2 + bodyH + M.gap);
    this.beginCard();
    this.y += M.pad;
    const x0 = this.x0 + M.pad, cw = this.cw - M.pad * 2;
    // one label width for the first field of every row, so the inputs line up
    const leadLabelW = Math.max(...rows.map((r) => this.labelWidth(r[0]))) + 4;
    rows.forEach((row, ri) => {
      const y = this.y + ri * pitch;
      const spanTotal = row.reduce((a, f) => a + f.span, 0);
      const free = cw - M.fieldGap * (row.length - 1);
      let x = x0;
      row.forEach((f, fi) => {
        const w = (free * f.span) / spanTotal;
        const labelW = fi === 0 ? leadLabelW : this.labelWidth(f) + 4;
        this.rect(x, y, labelW, M.field, { fill: COLORS.pale, r: 0 });
        const by = centreBaseline(y, M.field, 9);
        let lx = x + 2.5;
        lx += this.text(f.label, lx, by, { size: 9, style: 'bold', color: COLORS.brand });
        // the date format is a small label beside the field, never inside it
        if (f.hint) this.text(` ${f.hint}`, lx, by, { size: 7, color: COLORS.band });
        const value = String(this.data.meta[f.key] ?? '');
        const fx = x + labelW + LABEL_GAP;
        if (f.kind === 'chars') {
          const chars = f.alignRight ? value.padStart(f.length, ' ').split('').map((c) => c.trim()) : value.split('');
          this.charBoxes(fx, y + (M.field - BOX_7) / 2, chars, f.length, { bw: BOX_7, bh: BOX_7, gap: 0.8, size: 11, tag: 'field' });
        } else {
          this.roundedField(fx, y, w - labelW - LABEL_GAP, M.field, value, { size: 10, tag: 'field' });
        }
        x += w + M.fieldGap;
      });
    });
    this.y += bodyH;
    this.endCard();
  }

  /** Width of a field's label, including its hint where it has one. */
  labelWidth(f) {
    return this.measure(f.label, 9, 'bold') + (f.hint ? this.measure(` ${f.hint}`, 7) : 0);
  }

  /**
   * Ruled grid. Cells share their borders: the body goes down as flat fills
   * (the row-number gutter, the zebra bands and the cells themselves) and every
   * border is then drawn once as a continuous rule over the top, so no cell
   * carries a box or a rounded corner of its own. Day groups are divided by a
   * 1.5 pt rule, the two columns inside one day by a 0.5 pt rule.
   */
  table({ noW, groups, rows, rowH, drawRow, continuedBanner, footerRow }) {
    const x0 = this.x0 + M.pad;
    const gw = groups.map((g) => g.widths.reduce((a, b) => a + b, 0));
    const groupX = []; let gx = x0 + noW;
    for (const w of gw) { groupX.push(gx); gx += w; }
    const right = gx;
    const headerH = DAY_HEADER_H + SUB_HEADER_H;

    const drawHeader = () => {
      const y = this.y;
      this.rect(x0, y, noW, DAY_HEADER_H, { fill: COLORS.pale, r: 0 });
      this.text('No.', x0 + noW / 2, centreBaseline(y, DAY_HEADER_H, 7), { size: 7, style: 'bold', align: 'center', color: COLORS.brand });
      // one pill per day, spanning its own group exactly
      groups.forEach((g, i) => {
        this.rect(groupX[i] + PILL_GAP, y + 0.3, gw[i] - PILL_GAP * 2, DAY_HEADER_H - 0.6, { fill: COLORS.band, r: RADIUS.band });
        this.text(g.label, groupX[i] + gw[i] / 2, centreBaseline(y, DAY_HEADER_H, 9), { size: 9, style: 'bold', align: 'center', color: COLORS.white });
      });
      // the column sub-labels sit directly under the pill, 7 pt spaced caps
      const sy = y + DAY_HEADER_H;
      this.rect(x0, sy, right - x0, SUB_HEADER_H, { fill: COLORS.pale, r: 0 });
      groups.forEach((g, i) => {
        let sx = groupX[i];
        g.widths.forEach((w, k) => {
          const label = g.subs[k].toUpperCase();
          const base = this.measure(label, 7, 'bold');
          const sp = Math.max(0, Math.min(0.4, (w - 2.5 - base) / Math.max(1, label.length - 1)));
          this.spacedText(label, sx + w / 2, centreBaseline(sy, SUB_HEADER_H, 7), { size: 7, style: 'bold', align: 'center', color: COLORS.brand, spacing: sp });
          sx += w;
        });
      });
      this.y = sy + SUB_HEADER_H;
    };

    if (this.y + headerH + rowH * Math.min(2, rows.length) > this.bottom) {
      this.newPage();
      if (continuedBanner) continuedBanner();
    }
    let top = this.y;
    drawHeader();
    let bodyTop = this.y;
    rows.forEach((row, i) => {
      if (this.y + rowH > this.bottom) {
        this.gridRules({ x0, top, right, bottom: this.y, bodyTop, rowH, noW, groups, groupX, gw });
        this.newPage();
        if (continuedBanner) continuedBanner();
        top = this.y; drawHeader(); bodyTop = this.y;
      }
      const y = this.y;
      // the gutter is tinted for its full height; body rows alternate
      this.rect(x0, y, noW, rowH, { fill: COLORS.gutter, r: 0 });
      if (i % 2 === 1) this.rect(groupX[0], y, right - groupX[0], rowH, { fill: COLORS.zebra, r: 0 });
      drawRow(row, i, y, rowH);
      this.y += rowH;
    });
    this.gridRules({ x0, top, right, bottom: this.y, bodyTop, rowH, noW, groups, groupX, gw });
    if (footerRow) {
      this.rect(x0, this.y + 1, right - x0, footerRow.h - 1, { fill: COLORS.pale, r: RADIUS.band });
      this.text(footerRow.text, x0 + 3, centreBaseline(this.y + 1, footerRow.h - 1, 8.4), { size: 8.4, style: 'italic', color: COLORS.brand });
      this.y += footerRow.h;
    }
  }

  /** Every shared border of one grid, drawn once as a continuous rule. */
  gridRules({ x0, top, right, bottom, bodyTop, rowH, noW, groups, groupX, gw }) {
    const g = COLORS.grid;
    const n = Math.round((bottom - bodyTop) / rowH);
    this.rect(x0, top, right - x0, bottom - top, { stroke: g, lw: GRID_LW, r: 0, tag: 'grid-frame' });
    for (let i = 0; i < n; i++) {
      const y = bodyTop + i * rowH;
      this.line(x0, y, right, y, g, GRID_LW);
    }
    this.line(x0 + noW, top, x0 + noW, bottom, g, GRID_LW);
    groups.forEach((grp, gi) => {
      let inner = groupX[gi];
      for (let k = 0; k < grp.widths.length - 1; k++) {
        inner += grp.widths[k];
        // inside a day, a thin rule, and only where the two columns divide
        this.line(inner, bodyTop - SUB_HEADER_H, inner, bottom, g, GRID_LW);
      }
      if (gi < groups.length - 1) this.line(groupX[gi] + gw[gi], top, groupX[gi] + gw[gi], bottom, g, DAY_LW);
    });
  }

  /** One grid cell. It has no border of its own: the shared rules draw them. */
  cell(x, y, w, h, value, o = {}) {
    this.rect(x, y, w, h, { r: 0, tag: 'cell' });
    if (value !== '' && value != null) this.text(value, x + w / 2, centreBaseline(y, h, o.size || 10), { size: o.size || 10, style: o.style || 'normal', align: 'center', color: o.color || COLORS.text });
  }
  /** Row-number gutter: the figure centred on its tinted column. */
  rowNumber(x, y, w, h, n) {
    this.text(String(n), x + w / 2, centreBaseline(y, h, 9), { size: 9, style: 'bold', align: 'center', color: COLORS.brand });
  }

  /**
   * Slot model: a row is an entry slot, not a learner. Section A holds the
   * slots that fit on page 1; anything beyond continues in Section A2.
   */
  attendanceGrid({ sec, rows, firstSlot, letter, title, subtitle, notes, footerText }) {
    const cw = this.cw - M.pad * 2;
    const noW = NO_COL_W; const dayW = (cw - noW) / DAYS.length; const subW = dayW / 2;
    const groups = DAYS.map((d) => ({ label: d.label, subs: ['A', 'L'], widths: [subW, subW] }));
    const rowH = M.cell;
    const open = () => {
      this.beginCard();
      this.cardHeader(letter, title, subtitle);
      if (notes) this.instructionBand(notes);
    };
    const headerH = DAY_HEADER_H + SUB_HEADER_H;
    const periodH = sec.periodRow ? PERIOD_ROW_H + BAND_GAP : 0;
    const frame = M.pad + CARD_HEADER_H + (notes ? this.bandHeight() : 0) + periodH + BAND_GAP + headerH;
    // the form is a single page by design, so the whole grid is kept together
    this.ensure(frame + rowH * rows.length + (footerText ? 6 : 0) + M.pad + M.gap);
    open();
    if (sec.periodRow) this.periodRow(sec.periodRow, noW, dayW);
    this.table({
      noW, groups, rows, rowH,
      footerRow: footerText ? { h: 6, text: footerText } : null,
      drawRow: (row, i, y, h) => {
        let x = this.x0 + M.pad;
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
    const x0 = this.x0 + M.pad;
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
        this.roundedField(x + 1.5 + k * (bw + gap), y, bw, h, this.data.periods?.[d.key]?.[k] || '', { size: 9, style: 'bold', align: 'center' });
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
    const cw = this.cw - M.pad * 2;
    const noW = NO_COL_W; const dayW = (cw - noW) / DAYS.length;
    const rowH = M.cell;
    const headerH = DAY_HEADER_H + SUB_HEADER_H;
    const frame = M.pad + CARD_HEADER_H + this.bandHeight() + BAND_GAP + headerH;
    this.ensure(frame + rowH * rows.length + (sec.showCodeList ? this.codeListHeight() : 0) + M.pad + M.gap);
    this.beginCard();
    this.cardHeader(sec.letter, sec.title, sec.subtitle);
    this.instructionBand(sec.notes);
    const learnerW = dayW * 0.6, codeW = dayW * 0.4;
    const groups = DAYS.map((d) => ({ label: d.label, subs: ['Learner no.', 'Code'], widths: [learnerW, codeW] }));
    this.table({
      noW, groups, rows, rowH,
      drawRow: (row, i, y, h) => {
        let x = this.x0 + M.pad;
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
    const x0 = this.x0 + M.pad, cw = this.cw - M.pad * 2;
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
    const x0 = this.x0 + M.pad, cw = this.cw - M.pad * 2;
    const textCount = lines.length;
    const total = Math.max(textCount, minLines || 0);
    let i = 0;
    while (i < total) {
      if (i > 0 && i >= textCount) break; // only padding left – do not spill onto a new page
      const avail = Math.floor((this.bottom - this.y - M.pad - 2) / lh);
      if (avail < Math.min(2, total - i)) { this.newPage(); if (continuedBanner) continuedBanner(); continue; }
      let take = Math.min(avail, total - i);
      const remainingText = textCount - i;
      // avoid orphaning a single last text line on the next page
      if (remainingText > take && remainingText - take === 1 && take > 2) take -= 1;
      const y0 = this.y;
      this.rect(x0, y0, cw, take * lh + 1.5, { fill: COLORS.white, stroke: COLORS.grid, lw: GRID_LW, r: 0, tag: 'writing-box' });
      for (let k = 0; k < take; k++) {
        const ly = y0 + 0.75 + lh * k;
        if (ruled && k < take - 1) this.rect(x0 + 3, ly + lh, cw - 6, 0.2, { fill: COLORS.hair, r: 0, tag: 'rule-line' });
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
    const lines = this.wrap(this.data.comments, this.cw - M.pad * 2 - 6, size);
    this.ensure(M.pad + CARD_HEADER_H + lh * 2 + 6);
    const open = (cont) => { this.beginCard(); this.cardHeader(null, c.title, cont ? '(continued)' : c.subtitle); };
    open(false);
    this.flowLines(lines, { lh, minLines: c.minLines, size, ruled: this.blank, continuedBanner: () => open(true) });
    this.endCard();
  }

  /** Total height the sign-off card occupies, including its frame and trailing gap. */
  signOffHeight() {
    return M.pad + CARD_HEADER_H + BAND_GAP + this.signOffBodyHeight() + M.pad + M.gap;
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
    const cw = this.cw - M.pad * 2;
    const declLines = this.wrap(this.form.signOff.declaration, cw - 6, 7.8, 'italic').length;
    const band = this.hasSignOffFields() ? SIGN_FIELD_ROW_H + 1.6 : 0;
    return 3.2 + declLines * 3.7 + band + 1.8 + SIGN_PAD_H + SIGN_PAD_LABEL_H;
  }

  /** The signature pad itself, drawn at (x, y). */
  signaturePad(x, y, w) {
    this.rect(x, y, w, SIGN_PAD_H, { fill: COLORS.white, stroke: COLORS.grid, lw: GRID_LW, r: 0, tag: 'signature' });
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
    const x0 = this.x0 + M.pad, cw = this.cw - M.pad * 2;
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
    // the footer follows directly, so no trailing gap is reserved here
    this.y = y + SIGN_BLOCK_H;
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
    const size = 9, lh = M.line;
    const lines = this.wrap(this.data.comments, this.cw - M.pad * 2 - 6, size);
    const rowH = Math.max(9, M.field), labH = INSTRUCTION_H;
    const minLines = this.form.comments.minLines;
    this.ensure(M.pad * 2 + TITLE_BAR_H + labH + rowH + labH + lh * minLines + 1.5 + M.gap);
    this.beginCard();
    this.cardHeader(sec.letter, sec.title, '');
    const x0 = this.x0 + M.pad, cw = this.cw - M.pad * 2;
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
    this.roundedField(x, y + (rowH - M.field) / 2, fieldW, M.field, atp.code, { size: 10, style: 'bold' });
    x += fieldW + 8;
    x += this.text(sec.tickLabel, x, by, { size: 9, style: 'bold', color: COLORS.brand }) + TICK_GAP;
    for (const st of ATP_STATUS) {
      const cy = y + (rowH - TICK) / 2;
      this.rect(x, cy, TICK, TICK, { fill: COLORS.white, stroke: COLORS.grid, lw: GRID_LW, r: 0, tag: 'tick' });
      if (atp.status === st.value) {
        this.line(x + 1, cy + 2.6, x + 2.1, cy + 4, COLORS.brand, 0.6);
        this.line(x + 2.1, cy + 4, x + 4.1, cy + 1.1, COLORS.brand, 0.6);
      }
      x += TICK + TICK_GAP;
      x += this.text(st.label, x, by, { size: 9 }) + 6;
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
   * SA-OC: the observation-code reference sheet. Same grid, rules and spacing
   * scale as sections A and B, so the three sheets read as one set. Each code
   * row is as tall as its own text plus M.pad above and below; the blank rows
   * for the school's own codes are three separate input boxes, LABEL_GAP apart.
   */
  codeTable(cfg, title, subtitle, rows, blank) {
    const { codeW, obsW } = cfg;
    const x0 = this.x0 + M.pad, cw = this.cw - M.pad * 2;
    const descX = x0 + codeW + obsW, descW = cw - codeW - obsW;
    const HEAD_H = 5;
    const rowPad = Math.min(M.pad, 3);
    const blankH = Math.max(9, M.field);
    // measure each row before drawing any of it, so the grid rules are exact
    const body = rows.map((r) => {
      if (blank) return { h: blankH };
      const obsL = this.wrap(r[1], obsW - rowPad * 2, 10, 'bold');
      const descL = this.wrap(r[2], descW - rowPad * 2, 10);
      return { h: rowPad * 2 + Math.max(obsL.length, descL.length, 1) * TEXT_LINE, code: r[0], obsL, descL };
    });
    const bodyH = body.reduce((a, b) => a + b.h, 0);
    this.ensure(M.pad + CARD_HEADER_H + HEAD_H + bodyH + M.pad + M.gap);
    this.beginCard();
    this.cardHeader(null, title, subtitle);
    const top = this.y;

    // column headings, in the same pale band the grids use
    this.rect(x0, this.y, cw, HEAD_H, { fill: COLORS.pale, r: 0 });
    const hb = centreBaseline(this.y, HEAD_H, 7);
    this.text('Code', x0 + rowPad, hb, { size: 7, style: 'bold', color: COLORS.brand });
    this.text('Observation', x0 + codeW + rowPad, hb, { size: 7, style: 'bold', color: COLORS.brand });
    this.text('Description', descX + rowPad, hb, { size: 7, style: 'bold', color: COLORS.brand });
    this.y += HEAD_H;

    const bodyTop = this.y;
    const edges = [];
    body.forEach((b, i) => {
      const y = this.y;
      if (i % 2 === 1) this.rect(x0, y, cw, b.h, { fill: COLORS.zebra, r: 0 });
      if (blank) {
        // three input boxes, LABEL_GAP apart, for the school's own codes
        const cols = [[x0, codeW], [x0 + codeW, obsW], [descX, descW]];
        cols.forEach(([cx, cwid], k) => {
          const left = cx + (k ? LABEL_GAP / 2 : 0);
          const width = cwid - (k ? LABEL_GAP / 2 : 0) - (k < 2 ? LABEL_GAP / 2 : 0);
          this.rect(left, y, width, b.h, { fill: COLORS.white, stroke: COLORS.grid, lw: GRID_LW, r: 0, tag: 'field' });
        });
      } else {
        this.text(b.code, x0 + rowPad, centreBaseline(y, b.h, 14), { size: 14, style: 'bold', color: COLORS.brand });
        const centre = centreBaseline(y, b.h, 10);
        b.obsL.forEach((l, k) => this.text(l, x0 + codeW + rowPad, centre - (b.obsL.length - 1) * (TEXT_LINE / 2) + k * TEXT_LINE, { size: 10, style: 'bold' }));
        b.descL.forEach((l, k) => this.text(l, descX + rowPad, centre - (b.descL.length - 1) * (TEXT_LINE / 2) + k * TEXT_LINE, { size: 10 }));
      }
      this.y += b.h;
      edges.push(this.y);
    });

    if (!blank) {
      // the same shared borders as the weekly grids
      this.rect(x0, top, cw, this.y - top, { stroke: COLORS.grid, lw: GRID_LW, r: 0, tag: 'grid-frame' });
      this.line(x0, bodyTop, x0 + cw, bodyTop, COLORS.grid, GRID_LW);
      edges.slice(0, -1).forEach((y) => this.line(x0, y, x0 + cw, y, COLORS.grid, GRID_LW));
      this.line(x0 + codeW, top, x0 + codeW, this.y, COLORS.grid, GRID_LW);
      this.line(descX, top, descX, this.y, COLORS.grid, DAY_LW);
    }
    this.endCard();
  }

  buildReference() {
    const f = this.form;
    const mark = (name) => this.marks.push({ name, y: Math.round(this.y * 100) / 100, page: this.pages.length });
    this.newPage();
    mark('header');
    const intro = this.wrap(f.intro, this.cw - 6, 9);
    intro.forEach((l, i) => this.text(l, this.x0 + 1, this.y + 4 + i * 4.4, { size: 9 }));
    this.y += 4 + intro.length * 4.4 + 4;
    mark('intro');
    this.codeTable(f.table, f.table.title, '', f.rows, false);
    mark('codes');
    this.codeTable(f.table, f.blankHeading, f.blankSubtitle, Array.from({ length: f.blankRows }, () => null), true);
    mark('additional codes');
    // the closing note is part of the sheet's budget: if it will not fit, the
    // sheet does not fit, and the fit ladder takes another step down
    this.ensure(NOTE_H);
    this.text(f.note, this.x0 + 1, this.y + 3.5, { size: 8, style: 'italic', color: COLORS.band });
    this.y += NOTE_H;
    mark('note');
    this.footers();
    return {
      width: PAGE.w, height: PAGE.h, pages: this.pages,
      docNumber: this.docNumber, identifier: this.identifier,
      title: `${f.formCode} ${f.title}`, marks: this.marks, gapSlots: this.gapSlots,
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
      marks: this.marks, gapSlots: this.gapSlots,
    };
  }
}
