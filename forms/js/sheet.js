import { encodeCode128B } from './barcode.js';

/**
 * Sheet: the drawing layer shared by every Fisantekraal document — the weekly
 * forms (SA-01, SA-02) and the printed master documents (SA-03 … SA-05).
 *
 * It owns the page, the millimetre geometry, the rounded-card machinery and
 * the primitives; it knows nothing about any particular document. Subclasses
 * supply `pageHeader()` and their own blocks.
 *
 * Primitive types:
 *   { t:'rect',  x,y,w,h, fill?, stroke?, lw?, r?, tag? }
 *   { t:'line',  x1,y1,x2,y2, color, lw }
 *   { t:'text',  s, x, y, size, style, color }      // y = baseline, x = left edge
 *   { t:'image', src, x,y,w,h }
 */

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

export const RADIUS = { card: 2.4, bar: 1.6, band: 1.2, box: 1.0, chip: 1.4, sig: 1.8 };

/**
 * Geometry, in printed millimetres at 100% scale. Every handwriting cell is at
 * least CELL_H tall on a ROW_PITCH grid, which is what the rest of the budget
 * is built around.
 */
const BLOCK_GAP = 4;           // between header, info panel, sections, footer
const BOX_PAD_X = 4;           // section box left/right padding
const BOX_PAD_B = 3;           // section box bottom padding
const TITLE_BAR_H = 7;         // section title bar
const TITLE_GAP = 2;           // title bar to instruction bar
const INSTRUCTION_H = 5;       // instruction bar
const INSTR_GAP = 2;           // instruction bar to content
const ROW_PITCH = 7;           // row to row
const CELL_H = 6.5;            // handwriting cell height
const CELL_INSET = (ROW_PITCH - CELL_H) / 2;
const PAIR_GAP = 1.5;          // between the paired cells of one day
const DAY_GUTTER = 3;          // between day groups
const NO_COL_W = 8;            // row-number column
const NO_GAP = 3;              // row-number column to the first day
const PERIOD_ROW_H = 7;
const PERIOD_GAP = 1.5;        // period row to the day headers
const DAY_HEADER_H = 5;
const SUB_HEADER_H = 4;
const FIELD_H = 7;             // header entry fields
const LABEL_GAP = 2;           // inline label to its field
const BOX_7 = 7;               // week digit boxes
const BOX_GAP = 1.5;           // between digit boxes
const TICK = 5;                // completion tick boxes
const SIG_W = 45;              // signature box
const SIG_H = 12;
const HEADER_H = 20;           // crest, titles, form-code box and barcode
const CREST_MM = 18;
const CODEBOX_H = 12;
const BARCODE_H = 7;
const COMMENT_LINE_H = 7.5;    // ruled writing lines in section C
const RULE_LW = 0.18;          // 0.5 pt cell borders

// kept for the card machinery the reference sheet still uses
const CARD_PAD = BOX_PAD_X;
const CARD_GAP = BLOCK_GAP;
const BAND_GAP = 0;
const CARD_HEADER_H = TITLE_BAR_H;
const ROW_H = ROW_PITCH;

const PT = 0.352778; // 1pt in mm
const CAP = 0.711;   // Roboto cap height / em

/** Baseline y for text of `sizePt` vertically centred in a box [top, top+h]. */
export function centreBaseline(top, h, sizePt) {
  return top + (h + CAP * sizePt * PT) / 2;
}


export class Sheet {
  constructor(opts) {
    this.measureFn = opts.measure;
    this.crest = opts.crest;
    this.blank = !!opts.blank;
    this.pages = [];
    this.ops = null;
    this.card = null;
    this.y = 0;
    this.x0 = PAGE.ml;
    this.cw = PAGE.w - PAGE.ml - PAGE.mr;
    this.bottom = PAGE.h - PAGE.mb - PAGE.footerH;
    this.marks = [];
  }

  /** Subclasses draw their page header here and leave `this.y` below it. */
  pageHeader() { this.y = PAGE.mt; }

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
    this.pageHeader(this.pages.length === 1);
    if (hadCard) this.beginCard();
    return hadCard;
  }

  ensure(h) {
    if (this.y + h > this.bottom) { this.newPage(); return true; }
    return false;
  }

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

  endCard(gap = CARD_GAP) {
    this.sealCard(this.y + CARD_PAD);
    this.card = null;
    this.y += CARD_PAD + gap;
  }

  /** Navy header bar inside the top of the open card. */
  cardHeader(letter, title, subtitle) {
    const h = TITLE_BAR_H;
    const x = this.x0 + CARD_PAD, w = this.cw - CARD_PAD * 2;
    this.y += CARD_PAD;
    this.rect(x, this.y, w, h, { fill: COLORS.brand, r: RADIUS.bar });
    const by = centreBaseline(this.y, h, 11);
    let tx = x + 3;
    if (letter) tx += this.runs([{ s: `${letter}.`, size: 11, style: 'bold', color: COLORS.white }], tx, by) + 2.6;
    tx += this.runs([{ s: title, size: 11, style: 'bold', color: COLORS.white }], tx, by);
    if (subtitle) this.runs([{ s: subtitle, size: 8, style: 'italic', color: COLORS.white }], tx + 2.4, by);
    this.y += h;
  }

  /** One instruction bar, INSTRUCTION_H tall, 8 pt italic on the band grey. */
  instructionBand(notes) {
    const size = 8;
    const x = this.x0 + CARD_PAD, w = this.cw - CARD_PAD * 2;
    const line = notes.join(' ');
    this.rect(x, this.y, w, INSTRUCTION_H, { fill: COLORS.band, r: RADIUS.band });
    this.text(line, x + 2.6, centreBaseline(this.y, INSTRUCTION_H, size), { size, style: 'italic', color: COLORS.white });
    this.y += INSTRUCTION_H;
  }

  bandHeight() { return INSTRUCTION_H; }

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

  /**
   * Generic table with repeated header rows across page breaks. Rows are drawn
   * as alternating full-width bands; `drawRow` places the inset field boxes.
   */
  table({ cols, headerRows, rows, rowH, drawRow, keepWithHeader = 2, continuedBanner, footerRow }) {
    const x0 = this.x0 + CARD_PAD, cw = this.cw - CARD_PAD * 2;
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
          this.rect(x + 0.3, y + 0.3, w - 0.6, rowSpanH - 0.6, { fill: cell.tone === 'pale' ? COLORS.pale : COLORS.band, r: RADIUS.band });
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
    const ix = x + 0.4, iy = y + CELL_INSET;
    const iw = w - 0.8, ih = CELL_H;
    this.rect(ix, iy, iw, ih, { fill: COLORS.white, stroke: COLORS.rule, lw: RULE_LW, r: RADIUS.box, tag: 'cell' });
    if (value !== '' && value != null) this.text(value, ix + iw / 2, centreBaseline(iy, ih, o.size || 10), { size: o.size || 10, style: o.style || 'normal', align: 'center', color: o.color || COLORS.text });
  }

  /** Row-number gutter: plain brand-coloured figure on the band, no box (as the reference). */
  rowNumber(x, y, w, h, n) {
    this.text(String(n), x + w / 2, centreBaseline(y, h, 9), { size: 9, style: 'bold', align: 'center', color: COLORS.brand });
  }

  /**
   * Flow wrapped text lines across pages inside a rounded container.
   * `minLines` pads the first block with blank lines, but blank padding never
   * spills onto a new page.
   */
  flowLines(lines, { lh, minLines, size, style, ruled, continuedBanner }) {
    const x0 = this.x0 + CARD_PAD, cw = this.cw - CARD_PAD * 2;
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

}

export {
  BLOCK_GAP, BOX_PAD_X, BOX_PAD_B, TITLE_BAR_H, TITLE_GAP, INSTRUCTION_H, INSTR_GAP,
  ROW_PITCH, CELL_H, CELL_INSET, PAIR_GAP, DAY_GUTTER, NO_COL_W, NO_GAP,
  PERIOD_ROW_H, PERIOD_GAP, DAY_HEADER_H, SUB_HEADER_H,
  FIELD_H, LABEL_GAP, BOX_7, BOX_GAP, TICK, SIG_W, SIG_H,
  HEADER_H, CREST_MM, CODEBOX_H, BARCODE_H, COMMENT_LINE_H, RULE_LW,
  CARD_PAD, CARD_GAP, BAND_GAP, CARD_HEADER_H, ROW_H,
};
