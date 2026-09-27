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
import { SCHOOL, DAYS, ATP_STATUS, PERIOD_SLOTS, getForm } from './schema.js';
import {
  Sheet, centreBaseline, PAGE, COLORS, RADIUS,
  BLOCK_GAP, BOX_PAD_X, BOX_PAD_B, TITLE_BAR_H, TITLE_GAP, INSTRUCTION_H, INSTR_GAP,
  ROW_PITCH, CELL_H, CELL_INSET, PAIR_GAP, DAY_GUTTER, NO_COL_W, NO_GAP,
  PERIOD_ROW_H, PERIOD_GAP, DAY_HEADER_H, SUB_HEADER_H,
  FIELD_H, LABEL_GAP, BOX_7, BOX_GAP, TICK, SIG_W, SIG_H,
  HEADER_H, CREST_MM, CODEBOX_H, BARCODE_H, COMMENT_LINE_H, RULE_LW,
} from './sheet.js';
export { PAGE, COLORS, RADIUS };

import { encodeCode128B } from './barcode.js';
import { formatDisplayDate } from './model.js';


/**
 * Corner radii, in mm. The reference form has no square corners anywhere, so
 * `rect()` falls back to RADIUS.box whenever a call does not name one.
 */




export function buildDocument({ formType, data, docNumber, identifier, generatedAt, crest, measure, blank }) {
  const b = new Builder({ formType, data, docNumber, identifier, generatedAt, crest, measure, blank });
  return b.build();
}

class Builder extends Sheet {
  constructor(opts) {
    super(opts);
    this.form = getForm(opts.formType);
    this.data = opts.data || {};
    this.docNumber = opts.docNumber;
    this.identifier = opts.identifier;
    this.generatedAt = opts.generatedAt || new Date();
  }

  // ---------------------------------------------------------------- header
  pageHeader() { this.y = PAGE.mt; this.fullHeader(); }

  /**
   * Masthead, HEADER_H tall: crest left, school name and subtitle centred over
   * the printed term line, form-code box and barcode right.
   */
  fullHeader() {
    const y = this.y;
    const right = this.x0 + this.cw;
    const boxW = Math.max(62, this.measure(this.form.codeBoxText, 7, 'bold') + 8);
    const boxX = right - boxW;
    if (this.crest) this.image(this.crest.dataUrl, this.x0, y + (HEADER_H - CREST_MM) / 2, CREST_MM, CREST_MM);

    const cx = (this.x0 + CREST_MM + 4 + boxX - 4) / 2;
    this.text(SCHOOL.name, cx, y + 6.6, { size: 13, style: 'bold', color: COLORS.brand, align: 'center' });
    this.spacedText(this.form.headerTitle, cx, y + 12.2, { size: 8.5, spacing: 0.8, style: 'bold', align: 'center', color: COLORS.band });
    this.text(this.form.headerPeriod, cx, y + 18, { size: 9, style: 'italic', align: 'center', color: COLORS.brand });

    // form-code box: a dark cap bar over the one-line title
    this.rect(boxX, y, boxW, CODEBOX_H, { fill: COLORS.white, stroke: COLORS.brand, lw: 0.4, r: RADIUS.chip });
    this.rect(boxX + 0.8, y + 0.8, boxW - 1.6, 4.4, { fill: COLORS.brand, r: 0.8 });
    this.text('FORM CODE', boxX + boxW / 2, centreBaseline(y + 0.8, 4.4, 7), { size: 7, style: 'bold', align: 'center', color: COLORS.white });
    this.text(this.form.codeBoxText, boxX + boxW / 2, y + 9.6, { size: 7, style: 'bold', align: 'center', color: COLORS.band });

    // barcode with a clear white margin all round, for scanning
    const bcY = y + CODEBOX_H + (HEADER_H - CODEBOX_H - BARCODE_H), bcH = BARCODE_H;
    const code = this.pageCode();
    const codeW = this.measure(code, 7) + 3;
    this.rect(boxX, bcY, boxW, bcH, { fill: COLORS.white, r: RADIUS.box });
    this.barcode(boxX + 2, bcY + 1, boxW - 4 - codeW, bcH - 2, code);
    this.text(code, boxX + boxW - 2, centreBaseline(bcY, bcH, 7), { size: 7, align: 'right', color: COLORS.band });
    this.y = y + HEADER_H;
  }

  pageCode() { return `${this.form.formCode.replace('-', '')}-P${this.pages.length}`; }

  // ----------------------------------------------------------- section box
  /**
   * Draws a section box of known height and returns the content cursor.
   * Heights are deterministic here, so the box is drawn before its contents
   * rather than patched afterwards.
   */
  sectionBox(h, { letter, title, subtitle, notes }) {
    const x = this.x0, w = this.cw, y = this.y;
    this.rect(x, y, w, h, { fill: COLORS.white, stroke: COLORS.brand, lw: 0.4, r: RADIUS.card });
    const ix = x + BOX_PAD_X, iw = w - BOX_PAD_X * 2;
    // the title bar is the box's header: flush with the top edge and the full
    // width, so the vertical budget spends nothing on top padding
    let cy = y;
    this.rect(x, cy, w, TITLE_BAR_H, { fill: COLORS.brand, r: RADIUS.card });
    const by = centreBaseline(cy, TITLE_BAR_H, 11);
    let tx = ix;
    if (letter) tx += this.runs([{ s: `${letter}.`, size: 11, style: 'bold', color: COLORS.white }], tx, by) + 2.6;
    tx += this.runs([{ s: title, size: 11, style: 'bold', color: COLORS.white }], tx, by);
    if (subtitle) this.runs([{ s: subtitle, size: 8, style: 'italic', color: COLORS.white }], tx + 2.5, by);
    cy += TITLE_BAR_H + TITLE_GAP;
    if (notes) {
      this.rect(x, cy, w, INSTRUCTION_H, { fill: COLORS.band, r: RADIUS.band });
      this.text(notes, x + 2.5, centreBaseline(cy, INSTRUCTION_H, 8), { size: 8, style: 'italic', color: COLORS.white });
      cy += INSTRUCTION_H + INSTR_GAP;
    }
    this.y = y + h + BLOCK_GAP;
    return { ix, iw, cy };
  }

  /** Column geometry shared by both grids. */
  grid(iw) {
    const gridX = NO_COL_W + NO_GAP;
    const dayW = (iw - gridX - DAY_GUTTER * (DAYS.length - 1)) / DAYS.length;
    return { gridX, dayW };
  }

  /** Day header row, then the paired sub-labels beneath it. */
  gridHeaders(ix, iw, y, subLabels) {
    const { gridX, dayW } = this.grid(iw);
    this.rect(ix, y, NO_COL_W, DAY_HEADER_H + SUB_HEADER_H, { fill: COLORS.pale, r: RADIUS.band });
    this.text('No.', ix + NO_COL_W / 2, centreBaseline(y, DAY_HEADER_H + SUB_HEADER_H, 7), { size: 7, style: 'bold', align: 'center', color: COLORS.brand });
    DAYS.forEach((d, i) => {
      const dx = ix + gridX + i * (dayW + DAY_GUTTER);
      this.rect(dx, y, dayW, DAY_HEADER_H, { fill: COLORS.band, r: RADIUS.band });
      this.text(d.label, dx + dayW / 2, centreBaseline(y, DAY_HEADER_H, 9), { size: 9, style: 'bold', align: 'center', color: COLORS.white });
      const [aW, bW] = subLabels.widths(dayW);
      this.rect(dx, y + DAY_HEADER_H, aW, SUB_HEADER_H, { fill: COLORS.pale, r: RADIUS.band });
      this.text(subLabels.a, dx + aW / 2, centreBaseline(y + DAY_HEADER_H, SUB_HEADER_H, 7), { size: 7, style: 'bold', align: 'center', color: COLORS.brand });
      this.rect(dx + aW + PAIR_GAP, y + DAY_HEADER_H, bW, SUB_HEADER_H, { fill: COLORS.pale, r: RADIUS.band });
      this.text(subLabels.b, dx + aW + PAIR_GAP + bW / 2, centreBaseline(y + DAY_HEADER_H, SUB_HEADER_H, 7), { size: 7, style: 'bold', align: 'center', color: COLORS.brand });
    });
  }

  /** `n` rows of paired handwriting cells on the ROW_PITCH grid. */
  gridRows(ix, iw, y, n, widths, read) {
    const { gridX, dayW } = this.grid(iw);
    for (let r = 0; r < n; r++) {
      const ry = y + r * ROW_PITCH;
      this.text(String(r + 1), ix + NO_COL_W / 2, centreBaseline(ry, ROW_PITCH, 9), { size: 9, style: 'bold', align: 'center', color: COLORS.brand });
      DAYS.forEach((d, i) => {
        const dx = ix + gridX + i * (dayW + DAY_GUTTER);
        const [aW, bW] = widths(dayW);
        const [va, vb] = read(r, d);
        this.entryCell(dx, ry, aW, va);
        this.entryCell(dx + aW + PAIR_GAP, ry, bW, vb, true);
      });
    }
  }

  /** One handwriting cell: CELL_H tall, white, 0.5 pt dark-grey border. */
  entryCell(x, y, w, value, bold = false) {
    this.rect(x, y + CELL_INSET, w, CELL_H, { fill: COLORS.white, stroke: COLORS.rule, lw: RULE_LW, r: RADIUS.box, tag: 'cell' });
    if (value) {
      this.text(value, x + w / 2, centreBaseline(y + CELL_INSET, CELL_H, 10), {
        size: 10, style: bold ? 'bold' : 'normal', align: 'center', color: bold ? COLORS.brand : COLORS.text,
      });
    }
  }

  // ------------------------------------------------------------ info panel
  /**
   * Info panel. The first field of each row shares a left edge and width; the
   * right-hand groups share a left edge and a right edge, so the two rows line
   * up as columns.
   */
  infoPanel(spec) {
    const h = spec.padY * 2 + FIELD_H * 2 + spec.rowGap;
    const x = this.x0, w = this.cw;
    this.rect(x, this.y, w, h, { fill: COLORS.white, stroke: COLORS.brand, lw: 0.4, r: RADIUS.card });
    const ix = x + BOX_PAD_X, iw = w - BOX_PAD_X * 2;
    const rows = spec.rows;
    // the lead label column is as wide as the widest lead label
    const leadW = Math.max(...rows.map((r) => this.measure(r[0].label, 9, 'bold'))) + LABEL_GAP;
    rows.forEach((row, ri) => {
      const y = this.y + spec.padY + ri * (FIELD_H + spec.rowGap);
      // lead field
      const lead = row[0];
      this.text(lead.label, ix, centreBaseline(y, FIELD_H, 9), { size: 9, style: 'bold', color: COLORS.brand });
      this.roundedField(ix + leadW, y, spec.leadW, FIELD_H, this.value(lead), { size: 10 });
      // only the last trailing group is right-aligned to the panel edge, so
      // the Week and Date columns line up; any middle group follows the lead
      let gx = ix + leadW + spec.leadW + spec.colGap;
      const trailing = row.slice(1);
      trailing.forEach((f, ti) => {
        const last = ti === trailing.length - 1;
        const labelW = this.labelWidth(f);
        const groupW = f.kind === 'chars'
          ? labelW + LABEL_GAP + f.length * BOX_7 + (f.length - 1) * BOX_GAP
          : labelW + LABEL_GAP + f.width;
        const gx0 = last ? ix + iw - groupW : gx;
        this.drawLabel(f, gx0, y);
        const fx = gx0 + labelW + LABEL_GAP;
        if (f.kind === 'chars') {
          const v = String(this.value(f) || '');
          const chars = f.alignRight ? v.padStart(f.length, ' ').split('').map((c) => c.trim()) : v.split('');
          this.charBoxes(fx, y, chars, f.length, { bw: BOX_7, bh: BOX_7, gap: BOX_GAP, size: 11 });
        } else {
          this.roundedField(fx, y, f.width, FIELD_H, this.value(f), { size: 10 });
        }
        gx = gx0 + groupW + spec.colGap;
      });
    });
    this.y += h + BLOCK_GAP;
  }

  value(f) { return String(this.data.meta?.[f.key] ?? ''); }

  /** Label width, including the small format hint where a field has one. */
  labelWidth(f) {
    return this.measure(f.label, 9, 'bold') + (f.hint ? this.measure(` ${f.hint}`, 7) : 0);
  }

  /** Inline label, with the date format as a 7 pt hint beside it. */
  drawLabel(f, x, y) {
    const by = centreBaseline(y, FIELD_H, 9);
    const w = this.text(f.label, x, by, { size: 9, style: 'bold', color: COLORS.brand });
    if (f.hint) this.text(` ${f.hint}`, x + w, by, { size: 7, color: COLORS.band });
  }

  // -------------------------------------------------------------- sections
  attendanceSection(rows) {
    const sec = this.form.attendance;
    const h = TITLE_BAR_H + TITLE_GAP + INSTRUCTION_H + INSTR_GAP
      + PERIOD_ROW_H + PERIOD_GAP + DAY_HEADER_H + SUB_HEADER_H + rows * ROW_PITCH + BOX_PAD_B;
    const { ix, iw, cy } = this.sectionBox(h, {
      letter: sec.letter, title: sec.title, subtitle: sec.subtitle, notes: sec.notes[0],
    });
    const widths = (dayW) => { const a = (dayW - PAIR_GAP) / 2; return [a, a]; };
    this.periodRow(ix, iw, cy);
    this.gridHeaders(ix, iw, cy + PERIOD_ROW_H + PERIOD_GAP, { a: 'A', b: 'L', widths });
    this.gridRows(ix, iw, cy + PERIOD_ROW_H + PERIOD_GAP + DAY_HEADER_H + SUB_HEADER_H, rows, widths,
      (r, d) => [this.data.attendance?.[r]?.[d.key]?.a || '', this.data.attendance?.[r]?.[d.key]?.l || '']);
  }

  /** Period boxes above the day headers, one per slot per day. */
  periodRow(ix, iw, y) {
    const { gridX, dayW } = this.grid(iw);
    const slots = this.form.attendance.periodRow?.slots || PERIOD_SLOTS;
    this.rect(ix, y, NO_COL_W, PERIOD_ROW_H, { fill: COLORS.pale, r: RADIUS.band });
    this.text('Period', ix + NO_COL_W / 2, centreBaseline(y, PERIOD_ROW_H, 7), { size: 7, style: 'bold', align: 'center', color: COLORS.brand });
    DAYS.forEach((d, i) => {
      const dx = ix + gridX + i * (dayW + DAY_GUTTER);
      const bw = (dayW - PAIR_GAP * (slots - 1)) / slots;
      for (let k = 0; k < slots; k++) {
        this.roundedField(dx + k * (bw + PAIR_GAP), y, bw, PERIOD_ROW_H, this.data.periods?.[d.key]?.[k] || '',
          { size: 9, style: 'bold', align: 'center' });
      }
    });
  }

  observationsSection(rows) {
    const sec = this.form.observations;
    const h = TITLE_BAR_H + TITLE_GAP + INSTRUCTION_H + INSTR_GAP
      + DAY_HEADER_H + SUB_HEADER_H + rows * ROW_PITCH + BOX_PAD_B;
    const { ix, iw, cy } = this.sectionBox(h, {
      letter: sec.letter, title: sec.title, subtitle: sec.subtitle, notes: sec.notes[0],
    });
    // learner no. takes the wider share of the day group, code the narrower
    const widths = (dayW) => { const a = (dayW - PAIR_GAP) * 0.612; return [a, dayW - PAIR_GAP - a]; };
    this.gridHeaders(ix, iw, cy, { a: 'Learner no.', b: 'Code', widths });
    this.gridRows(ix, iw, cy + DAY_HEADER_H + SUB_HEADER_H, rows, widths,
      (r, d) => [this.data.observations?.[r]?.[d.key]?.learner || '', this.data.observations?.[r]?.[d.key]?.code || '']);
  }

  /** Section C: ATP code and tick boxes, then ruled lines with the signature. */
  atpSection() {
    const sec = this.form.atp;
    const atp = this.data.atp || {};
    const lines = this.form.comments.minLines;
    const ATP_ROW_H = 9;
    const h = TITLE_BAR_H + TITLE_GAP + ATP_ROW_H + 2 + INSTRUCTION_H + 1.5
      + lines * COMMENT_LINE_H + BOX_PAD_B;
    const { ix, iw, cy } = this.sectionBox(h, { letter: sec.letter, title: sec.title });

    const by = centreBaseline(cy, ATP_ROW_H, 9);
    let x = ix;
    x += this.text(sec.codeLabel, x, by, { size: 9, style: 'bold', color: COLORS.brand }) + LABEL_GAP;
    this.roundedField(x, cy + (ATP_ROW_H - FIELD_H) / 2, 40, FIELD_H, atp.code || '', { size: 10, style: 'bold' });
    x += 40 + 6;
    x += this.text(sec.tickLabel, x, by, { size: 9, style: 'bold', color: COLORS.brand }) + LABEL_GAP;
    ATP_STATUS.forEach((st, i) => {
      if (i) x += 8;
      const ty = cy + (ATP_ROW_H - TICK) / 2;
      this.rect(x, ty, TICK, TICK, { fill: COLORS.white, stroke: COLORS.rule, lw: RULE_LW, r: RADIUS.box, tag: 'tick' });
      if (atp.status === st.value) {
        this.line(x + 1, ty + 2.6, x + 2.1, ty + 4, COLORS.brand, 0.6);
        this.line(x + 2.1, ty + 4, x + 4.1, ty + 1.1, COLORS.brand, 0.6);
      }
      x += TICK + 2;
      x += this.text(st.label, x, by, { size: 9 });
    });

    const labY = cy + ATP_ROW_H + 2;
    this.rect(ix, labY, iw, INSTRUCTION_H, { fill: COLORS.pale, r: RADIUS.band });
    this.runs([
      { s: sec.commentsLabel, size: 8, style: 'bold', color: COLORS.brand },
      { s: ` ${sec.commentsHint}`, size: 8, style: 'italic', color: COLORS.band },
    ], ix + 3, centreBaseline(labY, INSTRUCTION_H, 8));

    // ruled lines; the last two stop short so the signature box sits beside them
    const linesY = labY + INSTRUCTION_H + 1.5;
    const written = this.wrap(this.data.comments || '', iw, 9);
    const shortBy = SIG_W + 5;
    for (let i = 0; i < lines; i++) {
      const ly = linesY + i * COMMENT_LINE_H + COMMENT_LINE_H;
      const w = i >= lines - 2 ? iw - shortBy : iw;
      this.rect(ix, ly - 0.6, w, 0.2, { fill: COLORS.rule, r: 0.1, tag: 'rule-line' });
      if (written[i]) this.text(written[i], ix + 1, ly - 2, { size: 9 });
    }
    this.signatureBox(ix + iw - SIG_W, linesY + (lines - 2) * COMMENT_LINE_H);
  }

  /** Signature box, labelled inside its top-left corner. */
  signatureBox(x, y) {
    this.rect(x, y, SIG_W, SIG_H, { fill: COLORS.white, stroke: COLORS.rule, lw: RULE_LW, r: RADIUS.sig, tag: 'signature' });
    this.text('Signature', x + 2, y + 3.4, { size: 8, color: COLORS.band });
    const sig = this.data.signOff?.signature;
    if (sig && sig.dataUrl) {
      const pad = 1.2, top = 4;
      const ratio = Math.min((SIG_W - pad * 2) / sig.width, (SIG_H - top - pad) / sig.height);
      const sw = sig.width * ratio, sh = sig.height * ratio;
      this.image(sig.dataUrl, x + (SIG_W - sw) / 2, y + top + (SIG_H - top - pad - sh) / 2, sw, sh);
    }
  }

  /** Footer text, drawn at a baseline the caller chooses. */
  footerText(by, rightLimit) {
    this.runs([
      { s: this.form.formCode, size: 7, style: 'bold', color: COLORS.brand },
      { s: '  |  ', size: 7, color: COLORS.hair },
      { s: this.form.title, size: 7, color: COLORS.band },
      { s: '   ', size: 7 },
      { s: SCHOOL.name.replace(/\b(\w)(\w*)/g, (_, a, r) => a + r.toLowerCase()), size: 7, color: COLORS.band },
      { s: '   ', size: 7 },
      { s: SCHOOL.mottoWords.join(' · '), size: 7, color: COLORS.band },
    ], this.x0, by);
    this.text(`Page 1 of ${this.pages.length}`, rightLimit ?? this.x0 + this.cw, by, { size: 7, style: 'bold', color: COLORS.brand, align: 'right' });
  }

  /** SA-01's bottom band: footer text left, signature box right, no footer row. */
  bottomBand() {
    const y = this.y;
    const sigX = this.x0 + this.cw - SIG_W;
    this.signatureBox(sigX, y);
    this.footerText(y + SIG_H - 1.2, sigX - 5);
    this.y = y + SIG_H;
  }

  // ------------------------------------------------------- reference sheet
  /** SA-OC: a printed reference sheet with no fields. */
  buildReference() {
    const f = this.form;
    this.newPage();
    this.y += 5;
    const intro = this.wrap(f.intro, this.cw, 9);
    intro.forEach((l, i) => this.text(l, this.x0, this.y + 4 + i * 4.4, { size: 9 }));
    this.y += 4 + intro.length * 4.4 + 6;

    const codeW = f.columns.code, obsW = f.columns.observation;
    const descW = this.cw - codeW - obsW;
    const headerRow = (y) => {
      this.rect(this.x0, y, this.cw, 7, { fill: COLORS.brand, r: RADIUS.bar });
      this.text('Code', this.x0 + 3, centreBaseline(y, 7, 8), { size: 8, style: 'bold', color: COLORS.white });
      this.text('Observation', this.x0 + codeW + 3, centreBaseline(y, 7, 8), { size: 8, style: 'bold', color: COLORS.white });
      this.text('Description', this.x0 + codeW + obsW + 3, centreBaseline(y, 7, 8), { size: 8, style: 'bold', color: COLORS.white });
    };
    const row = (y, code, obs, desc) => {
      if (code) this.text(code, this.x0 + 3, centreBaseline(y, f.rowH, 14), { size: 14, style: 'bold', color: COLORS.brand });
      if (obs) this.text(obs, this.x0 + codeW + 3, centreBaseline(y, f.rowH, 10), { size: 10, style: 'bold' });
      if (desc) {
        const dl = this.wrap(desc, descW - 6, 10);
        dl.forEach((l, i) => this.text(l, this.x0 + codeW + obsW + 3, centreBaseline(y, f.rowH, 10) - (dl.length - 1) * 2 + i * 4, { size: 10 }));
      }
      this.rect(this.x0, y + f.rowH - 0.2, this.cw, 0.2, { fill: COLORS.hair, r: 0.1 });
    };

    headerRow(this.y); this.y += 7;
    for (const [c, o, d] of f.rows) { row(this.y, c, o, d); this.y += f.rowH; }

    this.y += 8;
    this.text(f.blankHeading, this.x0, this.y + 4, { size: 10, style: 'bold', color: COLORS.brand });
    this.y += 7;
    headerRow(this.y); this.y += 7;
    for (let i = 0; i < f.blankRows; i++) { row(this.y, '', '', ''); this.y += f.rowH; }

    this.y += 5;
    this.text(f.note, this.x0, this.y + 3.5, { size: 8, style: 'italic', color: COLORS.band });
    this.footerText(PAGE.h - PAGE.mb - 1.5);
    return this.doc();
  }

  doc() {
    return {
      width: PAGE.w, height: PAGE.h, pages: this.pages,
      docNumber: this.docNumber, identifier: this.identifier,
      title: `${this.form.formCode} ${this.form.title}`, marks: this.marks,
    };
  }

  build() {
    if (this.form.kind === 'reference') return this.buildReference();
    const mark = (name) => this.marks.push({ name, y: Math.round(this.y * 100) / 100, page: this.pages.length });
    const isRegister = !this.form.atp;
    this.newPage();
    mark('header');
    this.y += BLOCK_GAP + (isRegister ? 1 : 0);
    this.infoPanel(this.form.panel);
    mark('info panel');
    if (isRegister) this.y += 1;
    this.attendanceSection(this.form.attendance.defaultRows);
    mark('section A');
    if (isRegister) this.y += 1.25;
    this.observationsSection(this.form.observations.defaultRows);
    mark('section B');
    if (this.form.atp) { this.atpSection(); mark('section C'); }
    if (isRegister) {
      this.y += 1.25;
      this.bottomBand();
    } else {
      this.y -= BLOCK_GAP - 3;
      this.footerText(this.y + 3.2);
      this.y += 4.5;
    }
    mark('bottom');
    return this.doc();
  }
}
