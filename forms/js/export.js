/**
 * Submission pipeline:  completed data → layout document → PDF + PNG(s).
 * Both outputs are produced from the same `doc` primitives.
 */
import { getForm } from './schema.js';
import { createEmptyData, normalise, buildIdentifier, nextDocumentNumber } from './model.js';
import { buildDocument } from './layout.js';
import { renderPdf, renderPageToCanvas, canvasToPngBlob, makeMeasurer } from './painters.js';
import { loadFonts } from './fonts.js';
import { loadCrest } from './crest.js';
import { CONFIG } from './config.js';
import { saveSubmission } from './storage.js';

/** Build the layout document for the given data (no side effects). */
export async function buildFormDocument(rawData, { docNumber, identifier, generatedAt, blank } = {}) {
  const [fonts, crest] = await Promise.all([loadFonts(), loadCrest()]);
  const data = normalise(rawData);
  const form = getForm(data.formType);
  docNumber = docNumber || nextDocumentNumber(form.docPrefix);
  identifier = identifier || buildIdentifier(data, docNumber);
  const doc = buildDocument({
    formType: data.formType, data, docNumber, identifier,
    generatedAt: generatedAt || new Date(), crest, measure: makeMeasurer(), blank,
  });
  return { doc, data, fonts, form, docNumber, identifier };
}

/**
 * Generate PDF and PNG outputs. Returns
 * { docNumber, identifier, pdf: {blob, filename}, images: [{blob, filename, canvas}], pageCount }
 */
export async function generateOutputs(rawData, opts = {}) {
  const { doc, data, fonts, form, docNumber, identifier } = await buildFormDocument(rawData, opts);
  const stem = `${form.fileStem}-${identifier}`;

  const pdf = renderPdf(doc, fonts, { title: `${form.title} – ${identifier}`, author: data.meta.educator || '' });
  const pdfBlob = pdf.output('blob');

  const images = [];
  const n = doc.pages.length;
  for (let i = 0; i < n; i++) {
    const canvas = await renderPageToCanvas(doc, i, opts.dpi || CONFIG.PNG_DPI);
    const blob = await canvasToPngBlob(canvas);
    const filename = n === 1 ? `${stem}.png` : `${stem}-page-${i + 1}-of-${n}.png`;
    images.push({ blob, filename, canvas, page: i + 1 });
  }
  return { docNumber, identifier, form, data, doc, pageCount: n, pdf: { blob: pdfBlob, filename: `${stem}.pdf` }, images };
}

/** Full submission: generate, persist locally, optionally POST to a backend. */
export async function submitForm(rawData, opts = {}) {
  const result = await generateOutputs(rawData, opts);
  const submittedAt = new Date().toISOString();
  const record = {
    docNumber: result.docNumber, identifier: result.identifier, formType: result.data.formType,
    title: result.form.title, submittedAt, data: result.data, pageCount: result.pageCount,
    pdf: { filename: result.pdf.filename, blob: result.pdf.blob },
    images: result.images.map((im) => ({ filename: im.filename, blob: im.blob, page: im.page })),
  };
  let stored = false;
  try { await saveSubmission(record); stored = true; } catch (e) { console.warn('Local storage of submission failed', e); }

  let remote = null;
  if (CONFIG.SUBMIT_ENDPOINT) {
    const fd = new FormData();
    fd.append('formType', result.data.formType);
    fd.append('docNumber', result.docNumber);
    fd.append('identifier', result.identifier);
    fd.append('data', JSON.stringify(result.data));
    fd.append('pdf', result.pdf.blob, result.pdf.filename);
    result.images.forEach((im, i) => fd.append(`image-${i + 1}`, im.blob, im.filename));
    const res = await fetch(CONFIG.SUBMIT_ENDPOINT, { method: 'POST', body: fd });
    if (!res.ok) throw new Error(`Submission to server failed (${res.status})`);
    remote = await res.json().catch(() => ({}));
  }
  return { ...result, submittedAt, stored, remote };
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/**
 * Blank (unfilled) form for printing and hand completion.
 *
 * It runs the same data model → layout → PDF/PNG pipeline as a submission —
 * it is simply fed an empty data object — so a blank can never drift from the
 * form people actually fill in. Validation is not involved: nothing is being
 * submitted, so there is nothing to validate.
 */
export async function generateBlank(formType, opts = {}) {
  const form = getForm(formType);
  const data = createEmptyData(formType);
  if (opts.rows) {
    const { emptyAttendanceRow, emptyObservationRow } = await import('./model.js');
    while (data.attendance.length < opts.rows) data.attendance.push(emptyAttendanceRow());
    while (data.observations.length < opts.rows) data.observations.push(emptyObservationRow());
  }
  return generateOutputs(data, {
    ...opts,
    blank: true,
    docNumber: form.docPrefix + 'BLANK',
    identifier: 'BLANK',
  });
}
