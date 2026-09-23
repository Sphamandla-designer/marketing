/**
 * Form data model: creation, validation and identifiers.
 * Used by the interactive form and by the document renderer alike.
 */
import { DAYS, OBSERVATION_CODES, ATP_STATUS, PERIOD_SLOTS, getForm } from './schema.js';

export function emptyAttendanceRow() {
  const row = {};
  for (const d of DAYS) row[d.key] = { a: '', l: '' };
  return row;
}

export function emptyObservationRow() {
  const row = {};
  for (const d of DAYS) row[d.key] = { learner: '', code: '' };
  return row;
}

/** Create a blank data object for a form type. */
export function createEmptyData(type) {
  const form = getForm(type);
  const meta = {};
  for (const row of form.meta.rows) for (const f of row) meta[f.key] = '';
  // attendance slots span Section A (page 1) and the Section A2 continuation
  const slots = form.attendance.defaultRows + (form.attendance.overflowRows || 0);
  const data = {
    formType: type,
    meta,
    attendance: Array.from({ length: slots }, emptyAttendanceRow),
    observations: Array.from({ length: form.observations.defaultRows }, emptyObservationRow),
    comments: '',
    periods: Object.fromEntries(DAYS.map((d) => [d.key, Array.from({ length: PERIOD_SLOTS }, () => '')])),
    signOff: { term: '', startDate: '', endDate: '', signature: null },
  };
  if (form.atp) data.atp = { code: '', status: '' };
  return data;
}

const CODE_SET = new Set(OBSERVATION_CODES.map((c) => c.code));
const STATUS_SET = new Set(ATP_STATUS.map((s) => s.value));

/**
 * Validate a data object. Returns an array of { path, message } errors.
 * `path` is a dotted path into the data object (matches data-path attributes
 * in the interactive form so errors can be attached to inputs).
 */
export function validate(data) {
  const form = getForm(data.formType);
  const errors = [];
  const push = (path, message) => errors.push({ path, message });

  for (const row of form.meta.rows) {
    for (const f of row) {
      const v = (data.meta[f.key] || '').trim();
      if (!v) {
        if (f.required) push(`meta.${f.key}`, `${f.label.replace(/:$/, '')} is required.`);
        continue;
      }
      if (f.validate) {
        const msg = f.validate(v);
        if (msg) push(`meta.${f.key}`, msg);
      }
      if (f.maxLength && v.length > f.maxLength) push(`meta.${f.key}`, `${f.label.replace(/:$/, '')} is too long.`);
    }
  }

  data.attendance.forEach((row, i) => {
    for (const d of DAYS) {
      for (const k of ['a', 'l']) {
        const v = (row[d.key][k] || '').trim();
        if (v && !/^\d{1,3}$/.test(v)) push(`attendance.${i}.${d.key}.${k}`, `Row ${i + 1}, ${d.label} ${k.toUpperCase()}: enter the learner’s position number (digits only).`);
      }
    }
  });

  data.observations.forEach((row, i) => {
    for (const d of DAYS) {
      const learner = (row[d.key].learner || '').trim();
      const code = (row[d.key].code || '').trim().toUpperCase();
      if (learner && !/^\d{1,3}$/.test(learner)) push(`observations.${i}.${d.key}.learner`, `Row ${i + 1}, ${d.label}: learner number must be digits only.`);
      if (code && !CODE_SET.has(code)) push(`observations.${i}.${d.key}.code`, `Row ${i + 1}, ${d.label}: code must be one of ${[...CODE_SET].join(', ')}.`);
      if (learner && !code) push(`observations.${i}.${d.key}.code`, `Row ${i + 1}, ${d.label}: enter an observation code for learner ${learner}.`);
      if (code && !learner) push(`observations.${i}.${d.key}.learner`, `Row ${i + 1}, ${d.label}: enter the learner number for code ${code}.`);
    }
  });

  if (form.atp) {
    const code = (data.atp?.code || '').trim();
    const status = data.atp?.status || '';
    if (!code) push('atp.code', 'ATP code is required.');
    else if (code.length > form.atp.codeMaxLength) push('atp.code', 'ATP code is too long.');
    if (!status) push('atp.status', 'Select whether the ATP reference was completed or not completed.');
    else if (!STATUS_SET.has(status)) push('atp.status', 'Invalid ATP completion status.');
  }

  if (form.comments) {
    const c = data.comments || '';
    if (form.comments.required && !c.trim()) push('comments', 'Comments are required.');
    if (c.length > form.comments.maxLength) push('comments', `Comments must be ${form.comments.maxLength} characters or fewer.`);
  }

  const sign = data.signOff || {};
  for (const f of form.signOff.fields) {
    const v = String(sign[f.key] || '').trim();
    if (!v) { push(`signOff.${f.key}`, `${f.label.replace(/:$/, '')} is required.`); continue; }
    const msg = f.validate ? f.validate(v) : null;
    if (msg) push(`signOff.${f.key}`, msg);
  }
  for (const d of form.signOff.dates) {
    const v = String(sign[d.key] || '').trim();
    if (!v) push(`signOff.${d.key}`, `${d.label.replace(/:$/, '')} is required.`);
    else if (!isValidIsoDate(v)) push(`signOff.${d.key}`, `Enter a valid date for ${d.label.replace(/:$/, '').toLowerCase()} (DD MM YYYY).`);
  }
  // an end date before its start date means the week was entered the wrong way round
  const startIso = String(sign.startDate || '').trim();
  const endIso = String(sign.endDate || '').trim();
  if (isValidIsoDate(startIso) && isValidIsoDate(endIso) && endIso < startIso) {
    push('signOff.endDate', 'The week cannot end before it starts.');
  }
  if (!sign.signature) push('signOff.signature', 'Educator signature is required.');

  for (const d of DAYS) {
    for (let i = 0; i < PERIOD_SLOTS; i++) {
      const v = String(data.periods?.[d.key]?.[i] || '').trim();
      if (v.length > 6) push(`periods.${d.key}.${i}`, `${d.label} period ${i + 1} is too long.`);
    }
  }

  return errors;
}

export function isValidIsoDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  if (y < 2000 || y > 2099 || m < 1 || m > 12 || d < 1) return false;
  const dim = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return d <= dim;
}

/** Normalise user input (trim, upper-case codes) without altering meaning. */
export function normalise(data) {
  const out = JSON.parse(JSON.stringify(data));
  for (const k of Object.keys(out.meta)) out.meta[k] = String(out.meta[k] || '').trim();
  for (const row of out.attendance) for (const d of DAYS) { row[d.key].a = row[d.key].a.trim(); row[d.key].l = row[d.key].l.trim(); }
  for (const row of out.observations) for (const d of DAYS) { row[d.key].learner = row[d.key].learner.trim(); row[d.key].code = row[d.key].code.trim().toUpperCase(); }
  if (out.atp) out.atp.code = String(out.atp.code || '').trim();
  out.comments = String(out.comments || '').replace(/\r\n?/g, '\n').trim();
  if (!out.signOff) out.signOff = { term: '', startDate: '', endDate: '', signature: null };
  for (const k of ['term', 'startDate', 'endDate']) out.signOff[k] = String(out.signOff[k] || '').trim();
  if (!out.periods) out.periods = {};
  for (const d of DAYS) {
    const cur = Array.isArray(out.periods[d.key]) ? out.periods[d.key] : [];
    out.periods[d.key] = Array.from({ length: PERIOD_SLOTS }, (_, i) => String(cur[i] || '').trim().toUpperCase());
  }
  return out;
}

/** True when a table row has no values at all. */
export function isRowEmpty(row) {
  return DAYS.every((d) => Object.values(row[d.key]).every((v) => !String(v || '').trim()));
}

/**
 * Human-readable identifier used in file names, e.g. "9A-W5".
 * Built from the class and week in the header; falls back to the document
 * number if either is missing.
 */
export function buildIdentifier(data, docNumber) {
  const form = getForm(data.formType);
  const sign = data.signOff || {};
  const parts = [
    ...form.identifierKeys.map((k) => String(data.meta[k] || '').trim()),
    data.meta.week ? `W${String(data.meta.week).trim()}` : '',
  ];
  if (parts.some((p) => !p)) return docNumber;
  const id = parts.join('-').toUpperCase().replace(/[^A-Z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return id || docNumber;
}

/** Sequential document number stored per browser, e.g. SA01000001. */
export function nextDocumentNumber(prefix) {
  const key = `forms.docSequence.${prefix}`;
  let n = 0;
  try { n = parseInt(localStorage.getItem(key) || '0', 10) || 0; } catch (e) { /* storage unavailable */ }
  n += 1;
  try { localStorage.setItem(key, String(n)); } catch (e) { /* ignore */ }
  return `${prefix}${String(n).padStart(6, '0')}`;
}

export function formatDisplayDate(iso) {
  if (!isValidIsoDate(iso)) return iso || '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
