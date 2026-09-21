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
  // Structure follows the First Home Finance application form; the hue is the
  // school's own, taken from the crest: #B5121B is the shield, #8F0F19 the
  // ribbon. `band` is that red desaturated and lightened the same way the
  // reference derives its instruction band from its header bar.
  brand: '#B5121B',
  brandDeep: '#8F0F19',
  band: '#8C5F62',
  bandLight: '#A08B8C',
  pale: '#EBECEE',
  paleAlt: '#F5F6F7',
  border: '#B5121B',
  hair: '#D3CACB',
  text: '#1B1B1B',
  muted: '#5C6166',
  placeholder: '#B0A4A5',
  white: '#FFFFFF',
  boxFill: '#FFFFFF',
  boxBorder: '#B5121B',
  crestRed: '#B5121B',
};

/**
 * Corner radii, in mm. The reference form has no square corners anywhere, so
 * `rect()` falls back to RADIUS.box whenever a call does not name one.
 */
export const RADIUS = { card: 2.4, bar: 1.6, band: 1.2, box: 1.0, chip: 1.4, sig: 1.8 };

/** Inset of a section card's contents from its outline. */
const CARD_PAD = 1.4;
/** Vertical gap between stacked bands inside a card. */
const BAND_GAP = 1.2;
/** Gap around each field box inside a table row. */
const CELL_INSET = 0.55;
/**
 * Heights inside the sign-off card. The HOD column carries an extra name row,
 * so it is the taller of the two and sets the card height.
 */
const SIGN_CAPTION_H = 7;      // caption band + gap
const SIGN_NAME_H = 7.6;       // name row + gap (HOD only)
const SIGN_PAD_H = 14;         // signature pad
const SIGN_PAD_LABEL_H = 4.4;  // "Signature" caption under the pad
const SIGN_DATE_H = 5.2;       // date character boxes
const SIGN_STAMP_H = 5.4;      // document/reference/generated line (submissions only)
/** Gap left below a closed card before the next one. */
const CARD_GAP = 3.6;
/** Height consumed by the page-2+ header: crest row, identity strip and gap. */
const CONTINUATION_HEADER_H = 23;

const PT = 0.352778; // 1pt in mm
const CAP = 0.711;   // Roboto cap height / em

/** Baseline y for text of `sizePt` vertically centred in a box [top, top+h]. */
function centreBaseline(top, h, sizePt) {
  return top + (h + CAP * sizePt * PT) / 2;
}

export function buildDocument({ formType, data, docNumber, identifier, generatedAt, crest, measure, blank }) {
  const b = new Builder({ formType, data, docNumber, identifier, generatedAt, crest, measure, blank });
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
    this.blank = !!opts.blank;
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
    this.ops.push({ t: 'rect', x, y, w, h, fill: o.fill || null, stroke: o.stroke || null, lw: o.lw || 0.25, r });
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
      this.rect(bx, y, bw, bh, { fill: COLORS.boxFill, stroke: COLORS.brand, lw: 0.3, r: RADIUS.box });
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
    this.rect(x, y, w, h, { fill: COLORS.boxFill, stroke: COLORS.brand, lw: 0.3, r: RADIUS.box });
    const size = o.size || 9;
    const shown = value ? String(value) : (o.placeholder || '');
    if (!shown) return;
    const maxW = w - 4;
    let str = shown;
    while (str.length > 1 && this.measure(str, size, o.style || 'normal') > maxW) str = str.slice(0, -1);
    if (str !== shown) str = str.slice(0, -1) + '…';
    this.text(str, x + 2.2, centreBaseline(y, h, size), {
      size,
      style: value ? (o.style || 'normal') : 'italic',
      color: value ? COLORS.text : COLORS.placeholder,
    });
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
  endCard(gap = CARD_GAP) {
    this.sealCard(this.y + CARD_PAD);
    this.card = null;
    this.y += CARD_PAD + gap;
  }
  /** Navy header bar inside the top of the open card. */
  cardHeader(letter, title, subtitle) {
    const h = 7.4;
    const x = this.x0 + CARD_PAD, w = this.cw - CARD_PAD * 2;
    this.y += CARD_PAD;
    this.rect(x, this.y, w, h, { fill: COLORS.brand, r: RADIUS.bar });
    const by = centreBaseline(this.y, h, 10.5);
    let tx = x + 3;
    if (letter) tx += this.runs([{ s: `${letter}.`, size: 10.5, style: 'bold', color: COLORS.white }], tx, by) + 2.6;
    tx += this.runs([{ s: title, size: 10.5, style: 'bold', color: COLORS.white }], tx, by);
    if (subtitle) this.runs([{ s: subtitle, size: 8.2, style: 'italic', color: COLORS.white }], tx + 2.4, by);
    this.y += h;
  }
  /** Slate instruction band with white text, as under SECTION A of the reference. */
  instructionBand(notes) {
    const size = 8.2, lh = 3.9, pad = 1.5;
    const x = this.x0 + CARD_PAD, w = this.cw - CARD_PAD * 2;
    const lines = notes.flatMap((n) => this.wrap(n, w - 5, size, 'italic'));
    const h = lines.length * lh + pad * 2;
    this.y += BAND_GAP;
    this.rect(x, this.y, w, h, { fill: COLORS.band, r: RADIUS.band });
    lines.forEach((l, i) => this.text(l, x + 2.6, this.y + pad + lh * (i + 1) - 1.1, { size, style: 'italic', color: COLORS.white }));
    this.y += h;
  }

  fullHeader() {
    const y = this.y;
    if (this.crest) this.image(this.crest.dataUrl, this.x0, y, 23, 23);
    const panelW = 44, panelX = this.x0 + this.cw - panelW;
    const cx = (this.x0 + 25 + panelX - 3) / 2;
    this.text(SCHOOL.name, cx, y + 9, { size: 19, style: 'bold', color: COLORS.brand, align: 'center' });
    this.spacedText(SCHOOL.motto, cx, y + 14.6, { size: 7.6, spacing: 1.1, align: 'center', color: COLORS.band });
    this.text(SCHOOL.tagline, cx, y + 20.4, { size: 9.5, style: 'italic', align: 'center', color: COLORS.brand });
    // form code panel: brand cap bar over a white body, both rounded
    const capH = 4.6, panelH = 16.4;
    this.rect(panelX, y, panelW, panelH, { fill: COLORS.white, stroke: COLORS.brand, lw: 0.4, r: RADIUS.chip });
    this.rect(panelX + 0.8, y + 0.8, panelW - 1.6, capH, { fill: COLORS.brand, r: 0.8 });
    this.text('FORM CODE', panelX + panelW / 2, centreBaseline(y + 0.8, capH, 6.2), { size: 6.2, style: 'bold', align: 'center', color: COLORS.white });
    this.text(this.form.formCode, panelX + panelW / 2, y + 11.2, { size: 12, style: 'bold', align: 'center', color: COLORS.brand });
    this.text(this.form.codeBoxLines[0], panelX + panelW / 2, y + 13.7, { size: 4.9, style: 'bold', align: 'center', color: COLORS.band });
    this.text(this.form.codeBoxLines[1], panelX + panelW / 2, y + 15.9, { size: 4.9, style: 'bold', align: 'center', color: COLORS.band });
    // barcode sits in its own rounded white plate
    const bcY = y + panelH + 1.4, bcH = 9.6;
    this.rect(panelX, bcY, panelW, bcH, { fill: COLORS.white, stroke: COLORS.hair, lw: 0.3, r: RADIUS.box });
    const pageCode = this.pageCode();
    this.barcode(panelX + 1.2, bcY + 1.1, panelW - 2.4, 5, pageCode);
    this.text(pageCode, panelX + panelW / 2, bcY + bcH - 1.4, { size: 5.8, align: 'center', color: COLORS.band });
    this.y = Math.max(y + 24.5, bcY + bcH) + 2.6;
  }
  /**
   * Page 2 onwards. Carries a barcode of its own and a strip of the identifying
   * meta fields, so a page separated from the set still makes sense.
   */
  compactHeader() {
    const y = this.y;
    if (this.crest) this.image(this.crest.dataUrl, this.x0, y, 11, 11);
    this.text(SCHOOL.name, this.x0 + 13.5, y + 4.6, { size: 11, style: 'bold', color: COLORS.brand });
    this.text(`${this.form.formCode}  ·  ${this.form.title}  ·  continued`, this.x0 + 13.5, y + 9.2, { size: 7.6, color: COLORS.band });
    const right = this.x0 + this.cw;
    const bcW = 34, bcH = 7.6;
    const pageCode = this.pageCode();
    this.barcode(right - bcW, y + 0.4, bcW, 4.6, pageCode);
    this.text(pageCode, right, y + 8.6, { size: 6.4, style: 'bold', align: 'right', color: COLORS.band });
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
      this.rect(this.x0, y + 1.5, this.cw, 0.35, { fill: COLORS.hair, r: 0.17 });
      const by = y + 6.2;
      this.runs([
        { s: this.form.formCode, size: 7.2, style: 'bold', color: COLORS.brand },
        { s: '   |   ', size: 7.2, color: COLORS.hair },
        { s: this.form.title, size: 7.2, color: COLORS.band },
      ], this.x0, by);
      this.text(SCHOOL.name.replace(/\b(\w)(\w*)/g, (_, a, r) => a + r.toLowerCase()), this.x0 + this.cw / 2 - 10, by, { size: 7.2, color: COLORS.band, align: 'center' });
      // page chip, matching the numbered chip in the reference header
      const chipW = 20, chipH = 5.2, chipX = this.x0 + this.cw - chipW, chipY = by - 3.9;
      this.rect(chipX, chipY, chipW, chipH, { fill: COLORS.pale, r: RADIUS.chip });
      this.text(`Page ${i + 1} of ${n}`, chipX + chipW / 2, centreBaseline(chipY, chipH, 7), { size: 7, style: 'bold', color: COLORS.brand, align: 'center' });
      this.text(SCHOOL.mottoWords.join('  ·  '), chipX - 4, by, { size: 7.2, color: COLORS.band, align: 'right' });
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
    const rowH = 7.6;
    this.ensure(rowH * rows.length + CARD_PAD * 2 + 4);
    this.beginCard();
    this.y += CARD_PAD;
    const x0 = this.x0 + CARD_PAD, cw = this.cw - CARD_PAD * 2;
    rows.forEach((row, ri) => {
      const y = this.y + ri * rowH;
      const spanTotal = row.reduce((a, f) => a + f.span, 0);
      let x = x0;
      for (const f of row) {
        const w = (cw * f.span) / spanTotal;
        const labelW = this.measure(f.label, 9, 'bold') + 5;
        this.rect(x + 0.4, y + 0.4, labelW, rowH - 0.8, { fill: COLORS.pale, r: RADIUS.band });
        this.text(f.label, x + 3, centreBaseline(y, rowH, 9), { size: 9, style: 'bold', color: COLORS.brand });
        const value = String(this.data.meta[f.key] ?? '');
        if (f.kind === 'chars') {
          const chars = value.split('');
          if (f.key === 'week' && chars.length === 1) chars.unshift(''); // right-align single digit week in 2 boxes
          this.charBoxes(x + labelW + 2.4, y + (rowH - 5.6) / 2, chars, f.length);
        } else {
          this.roundedField(x + labelW + 2.4, y + 1.2, w - labelW - 4.4, rowH - 2.4, value, { placeholder: this.blank ? f.placeholder : '' });
        }
        x += w;
      }
    });
    this.y += rowH * rows.length;
    this.endCard();
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
          if (cell.text) this.text(cell.text, x + w / 2, centreBaseline(y, rowSpanH, cell.size || 8.6), { size: cell.size || 8.6, style: 'bold', align: 'center', color: cell.tone === 'pale' ? COLORS.brand : COLORS.white });
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
    const ix = x + CELL_INSET, iy = y + CELL_INSET;
    const iw = w - CELL_INSET * 2, ih = h - CELL_INSET * 2;
    this.rect(ix, iy, iw, ih, { fill: COLORS.white, stroke: COLORS.brand, lw: 0.25, r: RADIUS.box });
    if (value !== '' && value != null) this.text(value, ix + iw / 2, centreBaseline(iy, ih, o.size || 9), { size: o.size || 9, style: o.style || 'normal', align: 'center', color: o.color || COLORS.text });
  }
  /** Row-number gutter: plain brand-coloured figure on the band, no box (as the reference). */
  rowNumber(x, y, w, h, n) {
    this.text(String(n), x + w / 2, centreBaseline(y, h, 8.6), { size: 8.6, style: 'bold', align: 'center', color: COLORS.brand });
  }

  /**
   * Slot model: a row is an entry slot, not a learner. Section A holds the
   * slots that fit on page 1; anything beyond continues in Section A2.
   */
  attendanceGrid({ sec, rows, firstSlot, letter, title, subtitle, notes, footerText, keepTogether }) {
    const cw = this.cw - CARD_PAD * 2;
    const noW = 9; const dayW = (cw - noW) / DAYS.length; const subW = dayW / 2;
    const cols = [{ w: noW }, ...DAYS.flatMap(() => [{ w: subW }, { w: subW }])];
    const headerRows = [
      { h: 5.8, cells: [{ span: 1, text: '#', rowSpan: 3, tone: 'pale' }, ...DAYS.map((d) => ({ span: 2, text: d.label }))] },
      { h: 4.8, cells: [{ span: 1, text: '', skip: true }, ...DAYS.flatMap(() => [{ span: 1, text: 'A', tone: 'pale' }, { span: 1, text: 'L', tone: 'pale' }])] },
      { h: 4.4, cells: [{ span: 1, text: '', skip: true }, ...DAYS.flatMap(() => [{ span: 1, text: 'Learner No.', size: 6.2, tone: 'pale' }, { span: 1, text: 'Learner No.', size: 6.2, tone: 'pale' }])] },
    ];
    const rowH = 6.4;
    const open = (continued) => {
      this.beginCard();
      this.cardHeader(letter, title, continued ? '(continued)' : subtitle);
      if (!continued && notes) this.instructionBand(notes);
    };
    const headerH = headerRows.reduce((a, r) => a + r.h, 0);
    const frame = CARD_PAD + 7.4 + (notes ? 10 : 0) + BAND_GAP + headerH;
    const whole = frame + rowH * rows.length + CARD_PAD + CARD_GAP;
    // A2 is "the continuation grid on page 2", so it should not split across
    // pages. Only worth forcing when it could actually fit on a fresh page —
    // an oversized grid would otherwise leave a page blank and still split.
    const fitsAFreshPage = whole <= this.bottom - PAGE.mt - CONTINUATION_HEADER_H;
    this.ensure(keepTogether && fitsAFreshPage ? whole : frame + rowH * 2);
    open(false);
    this.table({
      cols, headerRows, rows, rowH,
      continuedBanner: () => open(true),
      footerRow: footerText ? { h: 6, text: footerText } : null,
      drawRow: (row, i, y, h) => {
        let x = this.x0 + CARD_PAD;
        this.rowNumber(x, y, noW, h, firstSlot + i); x += noW;
        for (const d of DAYS) {
          this.cell(x, y, subW, h, row[d.key].a); x += subW;
          this.cell(x, y, subW, h, row[d.key].l); x += subW;
        }
      },
    });
    this.endCard();
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
      footerText: sec.continueNote,
    });
  }

  /** Section A2: the continuation grid printed on page 2. */
  attendanceOverflowSection() {
    const sec = this.form.attendance;
    const rows = this.data.attendance.slice(sec.defaultRows);
    if (!rows.length) return;
    this.attendanceGrid({
      sec,
      rows,
      firstSlot: sec.defaultRows + 1,
      letter: sec.overflow.letter,
      title: sec.overflow.title,
      subtitle: sec.overflow.subtitle,
      notes: null,
      footerText: null,
      // the designed grid stays whole on one page; slots added beyond it flow
      // normally rather than stranding a part-empty page
      keepTogether: rows.length <= sec.overflowRows,
    });
  }

  observationsSection() {
    const sec = this.form.observations;
    const rows = this.data.observations;
    const cw = this.cw - CARD_PAD * 2;
    const noW = 11; const dayW = (cw - noW) / DAYS.length;
    const rowH = 6.4;
    const open = (continued) => {
      this.beginCard();
      this.cardHeader(sec.letter, sec.title, continued ? '(continued)' : sec.subtitle);
      if (!continued) this.instructionBand(sec.notes);
    };
    this.ensure(CARD_PAD + 7.4 + 12 + 11 + rowH * 2);
    open(false);
    // both forms use the split Learner No. / Code layout
    const learnerW = dayW * 0.6, codeW = dayW * 0.4;
    const cols = [{ w: noW }, ...DAYS.flatMap(() => [{ w: learnerW }, { w: codeW }])];
    const headerRows = [
      { h: 6, cells: [{ span: 1, text: 'No.', rowSpan: 2, tone: 'pale' }, ...DAYS.map((d) => ({ span: 2, text: d.label }))] },
      { h: 5, cells: [{ span: 1, text: '', skip: true }, ...DAYS.flatMap(() => [{ span: 1, text: 'Learner No.', size: 7, tone: 'pale' }, { span: 1, text: 'Code', size: 7, tone: 'pale' }])] },
    ];
    this.table({
      cols, headerRows, rows, rowH, continuedBanner: () => open(true),
      drawRow: (row, i, y, h) => {
        let x = this.x0 + CARD_PAD;
        this.rowNumber(x, y, noW, h, i + 1); x += noW;
        for (const d of DAYS) {
          this.cell(x, y, learnerW, h, row[d.key].learner); x += learnerW;
          this.cell(x, y, codeW, h, row[d.key].code, { style: 'bold', color: COLORS.brand }); x += codeW;
        }
      },
    });
    this.endCard();
  }

  codeListBox() {
    const cl = this.form.codeList;
    const h1 = 6.4, h2 = 7.4;
    this.ensure(CARD_PAD * 2 + h1 + h2 + 4);
    this.beginCard();
    this.y += CARD_PAD;
    const x0 = this.x0 + CARD_PAD, cw = this.cw - CARD_PAD * 2;
    const y = this.y;
    this.rect(x0, y, cw, h1, { fill: COLORS.pale, r: RADIUS.band });
    this.runs([{ s: cl.title, size: 9.5, style: 'bold', color: COLORS.brand }, { s: `  ${cl.subtitle}`, size: 8.2, style: 'italic', color: COLORS.band }], x0 + 3, centreBaseline(y, h1, 9.5));
    const by = centreBaseline(y + h1, h2, 9.5);
    const n = OBSERVATION_CODES.length;
    const slot = (cw - 4) / n;
    OBSERVATION_CODES.forEach((c, i) => {
      const sx = x0 + 2 + i * slot;
      // the code itself sits in a small rounded box, like the reference's tick boxes
      const bw = 5.4, bh = 5.4, bY = y + h1 + (h2 - bh) / 2;
      this.rect(sx, bY, bw, bh, { fill: COLORS.white, stroke: COLORS.brand, lw: 0.3, r: RADIUS.box });
      this.text(c.code, sx + bw / 2, centreBaseline(bY, bh, 9.5), { size: 9.5, style: 'bold', align: 'center', color: COLORS.brand });
      this.text(c.label, sx + bw + 2.4, by, { size: 8.6 });
    });
    this.y = y + h1 + h2;
    this.endCard();
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
      const y0 = this.y + BAND_GAP;
      this.rect(x0, y0, cw, take * lh + 2, { fill: COLORS.white, stroke: COLORS.brand, lw: 0.3, r: RADIUS.box });
      for (let k = 0; k < take; k++) {
        const ly = y0 + 1 + lh * k;
        if (ruled && k < take - 1) this.rect(x0 + 3, ly + lh, cw - 6, 0.25, { fill: COLORS.hair, r: 0.12 });
        const s = lines[i + k];
        if (s) this.text(s, x0 + 3, ly + lh - 1.6, { size, style });
      }
      this.y = y0 + take * lh + 2;
      i += take;
      if (i < textCount) { this.newPage(); if (continuedBanner) continuedBanner(); }
    }
  }

  commentsSection() {
    const c = this.form.comments;
    const size = 9, lh = 5.6;
    const lines = this.wrap(this.data.comments, this.cw - CARD_PAD * 2 - 6, size);
    this.ensure(CARD_PAD + 7.4 + lh * 2 + 6);
    const open = (cont) => { this.beginCard(); this.cardHeader(null, c.title, cont ? '(continued)' : c.subtitle); };
    open(false);
    this.flowLines(lines, { lh, minLines: this.writingLines(c.minLines, lh), size, ruled: this.blank, continuedBanner: () => open(true) });
    this.endCard();
  }

  /**
   * How many empty lines to leave in a write-in box. A submitted form keeps
   * the schema minimum; a blank grows the box to fill the space left on the
   * page once the sign-off card is accounted for, so there is room to write.
   */
  writingLines(min, lh) {
    if (!this.blank) return min;
    // space the box itself costs beyond its lines: leading gap, inner padding
    // and the closing edge of the card it sits in
    const boxOverhead = BAND_GAP + 2 + CARD_PAD + CARD_GAP;
    const room = this.bottom - this.y - boxOverhead - this.signOffHeight() - 1;
    return Math.max(min, Math.floor(room / lh));
  }
  /** Total height the sign-off card occupies, including its frame and trailing gap. */
  signOffHeight() {
    return CARD_PAD + 7.4 + BAND_GAP + this.signOffBodyHeight() + CARD_PAD + CARD_GAP;
  }
  /**
   * Body height, measured rather than guessed: the declaration is wrapped at
   * the real column width and the taller (HOD) signature column decides the
   * rest. Guessing this is what previously pushed the date boxes through the
   * bottom of the card.
   */
  signOffBodyHeight() {
    const cw = this.cw - CARD_PAD * 2;
    const declLines = this.wrap(this.form.signOff.declaration, cw - 6, 8.2, 'italic').length;
    const tallestColumn = SIGN_CAPTION_H + SIGN_NAME_H + SIGN_PAD_H + SIGN_PAD_LABEL_H + SIGN_DATE_H;
    // the stamp gets its own line below both columns rather than overprinting them
    return 3.6 + declLines * 4 + 1.5 + tallestColumn + 2.5 + (this.blank ? 0 : SIGN_STAMP_H);
  }

  atpSection() {
    const sec = this.form.atp;
    const atp = this.data.atp || { code: '', status: '' };
    const size = 9, lh = 6;
    const lines = this.wrap(this.data.comments, this.cw - CARD_PAD * 2 - 6, size);
    this.ensure(CARD_PAD + 7.4 + 11 + 7 + lh * 2 + 4);
    const open = (cont) => { this.beginCard(); this.cardHeader(sec.letter, sec.title, cont ? '(continued)' : ''); };
    open(false);
    const x0 = this.x0 + CARD_PAD, cw = this.cw - CARD_PAD * 2;
    const rowH = 10.6;
    const y = this.y + BAND_GAP;
    this.rect(x0, y, cw, rowH, { fill: COLORS.paleAlt, r: RADIUS.band });
    const by = centreBaseline(y, rowH, 9);
    let x = x0 + 3;
    x += this.text(sec.codeLabel, x, by, { size: 9, style: 'bold', color: COLORS.brand }) + 3;
    const fieldW = 52;
    this.roundedField(x, y + 2.2, fieldW, rowH - 4.4, atp.code, { size: 9.5, style: 'bold' });
    x += fieldW + 8;
    for (const s of ATP_STATUS) {
      const bs = 5.2; const cy = y + (rowH - bs) / 2;
      this.rect(x, cy, bs, bs, { fill: COLORS.white, stroke: COLORS.brand, lw: 0.3, r: RADIUS.box });
      if (atp.status === s.value) {
        this.line(x + 1.1, cy + 2.7, x + 2.2, cy + 4.1, COLORS.brand, 0.6);
        this.line(x + 2.2, cy + 4.1, x + 4.3, cy + 1.2, COLORS.brand, 0.6);
      }
      x += bs + 2.2;
      x += this.text(s.label, x, by, { size: 9 }) + 7;
    }
    this.y = y + rowH;
    // comments label band
    const labH = 6.6;
    this.y += BAND_GAP;
    this.rect(x0, this.y, cw, labH, { fill: COLORS.pale, r: RADIUS.band });
    this.runs([{ s: sec.commentsLabel, size: 9, style: 'bold', color: COLORS.brand }, { s: ` ${sec.commentsHint}`, size: 8.2, style: 'italic', color: COLORS.band }], x0 + 3, centreBaseline(this.y, labH, 9));
    this.y += labH;
    this.flowLines(lines, { lh, minLines: this.writingLines(this.form.comments.minLines, lh), size, ruled: true, continuedBanner: () => open(true) });
    this.endCard();
  }

  /** One signature block: caption, name line (HOD only), pad and date boxes. */
  signBlock(x, w, { caption, nameLabel, name, signature, iso, top }) {
    let y = top;
    this.rect(x, y, w, 5.4, { fill: COLORS.pale, r: RADIUS.band });
    this.text(caption, x + 2.6, centreBaseline(y, 5.4, 8.2), { size: 8.2, style: 'bold', color: COLORS.brand });
    y += SIGN_CAPTION_H;
    if (nameLabel) {
      const lw = this.text(nameLabel, x + 1, y + 3.4, { size: 8.2, style: 'bold' });
      this.roundedField(x + lw + 3, y, w - lw - 4, 5.6, name, { size: 8.6, placeholder: this.blank ? 'Full name' : '' });
      y += SIGN_NAME_H;
    }
    const sigH = SIGN_PAD_H;
    this.rect(x + 1, y, w - 2, sigH, { fill: COLORS.white, stroke: COLORS.brand, lw: 0.35, r: RADIUS.sig });
    if (signature && signature.dataUrl) {
      const pad = 1.2;
      const ratio = Math.min((w - 2 - pad * 2) / signature.width, (sigH - pad * 2) / signature.height);
      const sw = signature.width * ratio, sh = signature.height * ratio;
      this.image(signature.dataUrl, x + 1 + (w - 2 - sw) / 2, y + (sigH - sh) / 2, sw, sh);
    }
    this.text('Signature', x + 1, y + sigH + 3, { size: 7, color: COLORS.band });
    y += sigH + SIGN_PAD_LABEL_H;
    let dx = x + 1;
    dx += this.text('Date:', dx, y + 4, { size: 8.2, style: 'bold' }) + 2.5;
    const [yy, mm, dd] = String(iso || '').split('-');
    const bo = { bw: 4.4, bh: 5.2, gap: 0.7, size: 8.6 };
    dx += this.charBoxes(dx, y, (dd || '').split(''), 2, bo) + 1.2;
    this.text('/', dx, centreBaseline(y, bo.bh, 9), { size: 9, color: COLORS.band }); dx += 2.2;
    dx += this.charBoxes(dx, y, (mm || '').split(''), 2, bo) + 1.2;
    this.text('/', dx, centreBaseline(y, bo.bh, 9), { size: 9, color: COLORS.band }); dx += 2.2;
    this.charBoxes(dx, y, (yy || '').split(''), 4, bo);
    return y + bo.bh - top;
  }

  signOffSection() {
    const so = this.form.signOff;
    const bodyH = this.signOffBodyHeight();
    this.ensure(this.signOffHeight());
    this.beginCard();
    this.cardHeader(so.letter, so.title, '');
    const x0 = this.x0 + CARD_PAD, cw = this.cw - CARD_PAD * 2;
    const y = this.y + BAND_GAP;
    const decl = this.wrap(so.declaration, cw - 6, 8.2, 'italic');
    decl.forEach((l, i) => this.text(l, x0 + 3, y + 3.6 + i * 4, { size: 8.2, style: 'italic', color: COLORS.band }));
    const top = y + 3.6 + decl.length * 4 + 1.5;
    // two columns: the educator signs on submission, the HOD counter-signs after
    const gap = 6, colW = (cw - gap) / 2;
    const sign = this.data.signOff || {};
    this.signBlock(x0, colW, {
      caption: so.educatorLabel, nameLabel: null, name: '',
      signature: sign.signature, iso: sign.date, top,
    });
    this.signBlock(x0 + colW + gap, colW, {
      caption: so.hodLabel, nameLabel: 'Name:', name: sign.hod?.name || '',
      signature: sign.hod?.signature, iso: sign.hod?.date, top,
    });
    if (!this.blank) {
      const gen = this.generatedAt;
      const stamp = `${String(gen.getDate()).padStart(2, '0')}/${String(gen.getMonth() + 1).padStart(2, '0')}/${gen.getFullYear()} ${String(gen.getHours()).padStart(2, '0')}:${String(gen.getMinutes()).padStart(2, '0')}`;
      this.text(`Document No. ${this.docNumber}   ·   Reference ${this.identifier}   ·   Generated ${stamp}`, x0 + cw - 1, y + bodyH - 1.6, { size: 6.8, color: COLORS.band, align: 'right' });
    }
    this.y = y + bodyH;
    this.endCard();
  }

  build() {
    this.newPage();
    this.metaTable();
    this.attendanceSection();
    this.observationsSection();
    this.attendanceOverflowSection();
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
