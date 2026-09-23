/**
 * Interactive web form, generated from the shared schema and bound to the
 * shared data model. Provides character boxes, table grids, signature pad,
 * keyboard navigation and inline validation display.
 */
import { SCHOOL, DAYS, OBSERVATION_CODES, CODE_LIST, ATP_STATUS, PERIOD_SLOTS, getForm } from './schema.js';

// ------------------------------------------------------------ helpers
function el(tag, attrs = {}, children = []) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') n.className = v;
    else if (k === 'text') n.textContent = v;
    else if (k === 'html') n.innerHTML = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v === true ? '' : v);
  }
  for (const c of [].concat(children)) if (c != null) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  return n;
}
export function getPath(obj, path) { return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj); }
export function setPath(obj, path, value) {
  const keys = path.split('.');
  let o = obj;
  for (const k of keys.slice(0, -1)) { if (o[k] == null) o[k] = {}; o = o[k]; }
  o[keys[keys.length - 1]] = value;
}
const CHARSETS = {
  digit: /[^0-9]/g,
  code: /[^PECNpecn]/g,
  any: /[\r\n\t]/g,
};

// ------------------------------------------------------------ char boxes
/**
 * A group of single-character inputs. The group's value (concatenated
 * characters) is written to `path` in the data model.
 */
export function charGroup({ data, path, length, charset = 'any', label, onChange, upper = false, autoFocusNext = true, ariaLabel }) {
  const group = el('div', { class: 'char-group', 'data-path': path, role: 'group', 'aria-label': ariaLabel || label });
  const inputs = [];
  const initial = String(getPath(data, path) || '');
  for (let i = 0; i < length; i++) {
    const inp = el('input', {
      type: 'text', class: 'char-box', maxlength: 1, inputmode: charset === 'digit' ? 'numeric' : 'text',
      autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', 'aria-label': `${ariaLabel || label} character ${i + 1} of ${length}`,
    });
    inp.value = initial[i] || '';
    inputs.push(inp);
    group.appendChild(inp);
  }
  const commit = () => { setPath(data, path, inputs.map((i) => i.value).join('')); onChange && onChange(path); };
  inputs.forEach((inp, i) => {
    inp.addEventListener('input', (e) => {
      let v = inp.value.replace(CHARSETS[charset] || CHARSETS.any, '');
      if (upper) v = v.toUpperCase();
      if (v.length > 1) { // paste or IME: distribute
        for (let k = 0; k < v.length && i + k < inputs.length; k++) inputs[i + k].value = v[k];
        inputs[Math.min(i + v.length, inputs.length - 1)].focus();
      } else {
        inp.value = v;
        if (v && autoFocusNext && i < inputs.length - 1) { inputs[i + 1].focus(); inputs[i + 1].select(); }
      }
      commit();
    });
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !inp.value && i > 0) { inputs[i - 1].focus(); inputs[i - 1].value = ''; commit(); e.preventDefault(); }
      else if (e.key === 'ArrowLeft' && i > 0) { inputs[i - 1].focus(); e.preventDefault(); }
      else if (e.key === 'ArrowRight' && i < inputs.length - 1) { inputs[i + 1].focus(); e.preventDefault(); }
    });
    inp.addEventListener('focus', () => inp.select());
  });
  return group;
}

// ------------------------------------------------------------ signature pad
export function signaturePad({ data, path, onChange, who = 'Educator' }) {
  const wrap = el('div', { class: 'sig-wrap', 'data-path': path });
  const canvas = el('canvas', { class: 'sig-pad', width: 900, height: 240, 'aria-label': `${who} signature pad. Draw your signature with a mouse, finger or stylus.`, role: 'img', tabindex: 0 });
  const hint = el('div', { class: 'sig-hint', text: 'Sign here' });
  const clearBtn = el('button', { type: 'button', class: 'btn btn-ghost btn-sm', text: 'Clear signature', 'aria-label': `Clear ${who.toLowerCase()} signature` });
  wrap.append(canvas, hint, clearBtn);
  const ctx = canvas.getContext('2d');
  ctx.lineWidth = 3.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#14213d';
  let drawing = false; let hasInk = false; let last = null;
  const pos = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (canvas.width / r.width), y: (e.clientY - r.top) * (canvas.height / r.height) };
  };
  const restore = () => {
    const sig = getPath(data, path);
    if (sig && sig.dataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const ratio = Math.min((canvas.width - 40) / img.width, (canvas.height - 40) / img.height, 1);
        const w = img.width * ratio, h = img.height * ratio;
        ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
        hasInk = true; hint.hidden = true;
      };
      img.src = sig.dataUrl;
    }
  };
  restore();
  const commit = () => {
    if (!hasInk) { setPath(data, path, null); onChange && onChange(path); return; }
    // trim to ink bounds with padding for a compact, crisp signature image
    const { width, height } = canvas;
    const px = ctx.getImageData(0, 0, width, height).data;
    let minX = width, minY = height, maxX = -1, maxY = -1;
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      if (px[(y * width + x) * 4 + 3] > 10) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
    }
    if (maxX < 0) { setPath(data, path, null); onChange && onChange(path); return; }
    const pad = 12;
    minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad); maxX = Math.min(width - 1, maxX + pad); maxY = Math.min(height - 1, maxY + pad);
    const out = document.createElement('canvas');
    out.width = maxX - minX + 1; out.height = maxY - minY + 1;
    out.getContext('2d').drawImage(canvas, minX, minY, out.width, out.height, 0, 0, out.width, out.height);
    setPath(data, path, { dataUrl: out.toDataURL('image/png'), width: out.width, height: out.height });
    onChange && onChange(path);
  };
  canvas.addEventListener('pointerdown', (e) => { drawing = true; last = pos(e); canvas.setPointerCapture(e.pointerId); hint.hidden = true; e.preventDefault(); });
  canvas.addEventListener('pointermove', (e) => {
    if (!drawing) return;
    const p = pos(e);
    ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    last = p; hasInk = true; e.preventDefault();
  });
  const end = (e) => { if (!drawing) return; drawing = false; if (last) { ctx.beginPath(); ctx.arc(last.x, last.y, 1.4, 0, Math.PI * 2); ctx.fillStyle = ctx.strokeStyle; ctx.fill(); hasInk = true; } commit(); };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('pointerleave', (e) => { if (drawing) end(e); });
  clearBtn.addEventListener('click', () => { ctx.clearRect(0, 0, canvas.width, canvas.height); hasInk = false; hint.hidden = false; commit(); });
  return wrap;
}

// ------------------------------------------------------------ main renderer
export function renderForm(root, data, { onChange } = {}) {
  const form = getForm(data.formType);
  root.innerHTML = '';
  root.classList.add('sheet');
  const change = (path) => { clearFieldError(root, path); onChange && onChange(path, data); };

  const textInput = (path, opts = {}) => {
    const inp = el('input', {
      type: opts.type || 'text', class: `field-input ${opts.class || ''}`, 'data-path': path, maxlength: opts.maxLength, placeholder: opts.placeholder,
      inputmode: opts.inputmode, autocomplete: 'off', 'aria-label': opts.ariaLabel, spellcheck: 'false',
    });
    inp.value = getPath(data, path) ?? '';
    inp.addEventListener('input', () => {
      let v = inp.value;
      if (opts.charset) v = v.replace(CHARSETS[opts.charset], '');
      if (opts.upper) v = v.toUpperCase();
      if (v !== inp.value) inp.value = v;
      setPath(data, path, v); change(path);
    });
    return inp;
  };

  // ---- sheet header
  root.appendChild(el('header', { class: 'sheet-header' }, [
    el('img', { class: 'crest', src: './assets/crest.svg', alt: 'Fisantekraal High School crest' }),
    el('div', { class: 'brand' }, [
      el('h1', { class: 'school-name', text: SCHOOL.name }),
      el('div', { class: 'motto', text: form.headerTitle }),
      el('div', { class: 'tagline', text: form.headerPeriod }),
    ]),
    el('div', { class: 'form-code-box', 'aria-label': 'Form code' }, [
      el('div', { class: 'fc-label', text: 'FORM CODE' }),
      el('div', { class: 'fc-code', text: form.formCode }),
      el('div', { class: 'fc-title', html: form.codeBoxLines.join('<br>') }),
    ]),
  ]));

  // ---- error summary placeholder
  root.appendChild(el('div', { id: 'error-summary', class: 'error-summary', role: 'alert', 'aria-live': 'assertive', hidden: true }));

  // ---- meta grid
  const meta = el('div', { class: 'meta-grid' });
  for (const row of form.meta.rows) {
    const r = el('div', { class: 'meta-row', style: `grid-template-columns: ${row.map((f) => `${f.span}fr`).join(' ')}` });
    for (const f of row) {
      const cell = el('div', { class: 'meta-cell' });
      const id = `meta-${f.key}`;
      cell.appendChild(el('label', { class: 'meta-label', for: f.kind === 'text' ? id : null, text: f.label }));
      const valueWrap = el('div', { class: 'meta-value' });
      if (f.kind === 'chars') {
        valueWrap.appendChild(charGroup({ data, path: `meta.${f.key}`, length: f.length, charset: f.charset, label: f.label.replace(/:$/, ''), onChange: change }));
        if (f.placeholder) valueWrap.appendChild(el('span', { class: 'field-hint', text: f.placeholder }));
      } else {
        const inp = textInput(`meta.${f.key}`, { maxLength: f.maxLength, placeholder: f.placeholder, ariaLabel: f.label.replace(/:$/, '') });
        inp.id = id;
        if (f.required) inp.required = true;
        valueWrap.appendChild(el('div', { class: 'rounded-field' }, inp));
      }
      cell.appendChild(valueWrap);
      r.appendChild(cell);
    }
    meta.appendChild(r);
  }
  root.appendChild(meta);

  // ---- section helpers
  const banner = (letter, title, subtitle) => el('div', { class: 'section-banner' }, [
    letter ? el('span', { class: 'sec-letter', text: `${letter}.` }) : null,
    el('span', { class: 'sec-title', text: title }),
    subtitle ? el('span', { class: 'sec-sub', text: subtitle }) : null,
  ]);
  const notes = (lines) => el('div', { class: 'section-notes' }, lines.map((l) => el('p', { text: l })));

  const cellInput = (path, opts) => {
    const inp = textInput(path, { ...opts, class: 'cell-input' });
    return inp;
  };

  // ---- Section A: attendance (slot model) + Section A2 continuation
  const att = form.attendance;
  const attHead = () => el('thead', {}, [
    // period row: which period each day's register was taken in
    att.periodRow ? el('tr', { class: 'period-row' }, [
      el('th', { class: 'col-no period-label', text: att.periodRow.label }),
      ...DAYS.map((d) => el('th', { colspan: 2 },
        el('div', { class: 'period-slots' }, Array.from({ length: att.periodRow.slots || PERIOD_SLOTS }, (_, k) =>
          textInput(`periods.${d.key}.${k}`, {
            maxLength: 6, upper: true, class: 'period-input',
            ariaLabel: `${d.label} period ${k + 1}`, placeholder: `P${k + 1}`,
          })))),
      ),
    ]) : null,
    el('tr', {}, [el('th', { rowspan: 2, class: 'col-no', text: '#' }), ...DAYS.map((d) => el('th', { colspan: 2, text: d.label }))]),
    el('tr', {}, DAYS.flatMap((d) => [el('th', { class: 'sub', text: 'A', 'aria-label': `${d.label} absent` }), el('th', { class: 'sub', text: 'L', 'aria-label': `${d.label} late` })])),
  ]);
  /** Builds one attendance grid over data.attendance[from..to). */
  const attendanceGrid = (from, to, extraClass = '') => {
    const wrap = el('div', { class: 'table-scroll' });
    const table = el('table', { class: `grid-table attendance-table ${extraClass}`.trim() });
    table.appendChild(attHead());
    const tbody = el('tbody');
    table.appendChild(tbody);
    const render = () => {
      tbody.innerHTML = '';
      const end = to == null ? data.attendance.length : Math.min(to, data.attendance.length);
      for (let i = from; i < end; i++) {
        const tr = el('tr', {}, [el('th', { scope: 'row', class: 'col-no', text: String(i + 1) })]);
        for (const d of DAYS) {
          for (const k of ['a', 'l']) {
            tr.appendChild(el('td', {}, cellInput(`attendance.${i}.${d.key}.${k}`, { maxLength: 3, charset: 'digit', inputmode: 'numeric', ariaLabel: `Slot ${i + 1} ${d.label} ${k === 'a' ? 'absent' : 'late'} learner number` })));
          }
        }
        tbody.appendChild(tr);
      }
    };
    render();
    wrap.appendChild(table);
    return { wrap, render, tbody };
  };

  // Section A. The grid is a fixed set of entry slots on a single-page form,
  // so there is no continuation section and no add/remove row controls.
  const secA = el('section', { class: 'form-section', 'aria-labelledby': 'sec-a' });
  const bannerA = banner(att.letter, att.title, att.subtitle); bannerA.id = 'sec-a';
  secA.append(bannerA, notes(att.notes));
  secA.appendChild(attendanceGrid(0, att.defaultRows, 'attendance-primary').wrap);
  root.appendChild(secA);

  // ---- Section B: observations
  const secB = el('section', { class: 'form-section', 'aria-labelledby': 'sec-b' });
  const bannerB = banner(form.observations.letter, form.observations.title, form.observations.subtitle); bannerB.id = 'sec-b';
  secB.append(bannerB, notes(form.observations.notes));
  const tableBWrap = el('div', { class: 'table-scroll' });
  const tableB = el('table', { class: `grid-table obs-table obs-${form.observations.mode}` });
  tableB.appendChild(el('thead', {}, [
    el('tr', {}, [el('th', { rowspan: 2, class: 'col-no', text: 'No.' }), ...DAYS.map((d) => el('th', { colspan: 2, text: d.label }))]),
    el('tr', {}, DAYS.flatMap(() => [el('th', { class: 'sub', text: 'Learner No.' }), el('th', { class: 'sub', text: 'Code' })])),
  ]));
  const tbodyB = el('tbody');
  tableB.appendChild(tbodyB);
  const renderObsRows = () => {
    tbodyB.innerHTML = '';
    data.observations.forEach((row, i) => {
      const tr = el('tr', {}, [el('th', { scope: 'row', class: 'col-no', text: String(i + 1) })]);
      for (const d of DAYS) {
        tr.appendChild(el('td', { class: 'learner-cell' }, cellInput(`observations.${i}.${d.key}.learner`, { maxLength: 3, charset: 'digit', inputmode: 'numeric', ariaLabel: `Row ${i + 1} ${d.label} learner number` })));
        tr.appendChild(el('td', { class: 'code-cell' }, cellInput(`observations.${i}.${d.key}.code`, { maxLength: 1, charset: 'code', upper: true, class: 'char-box', ariaLabel: `Row ${i + 1} ${d.label} observation code` })));
      }
      tbodyB.appendChild(tr);
    });
  };
  renderObsRows();
  tableBWrap.appendChild(tableB);
  secB.appendChild(tableBWrap);

  // ---- code list: sits inside Section B, identical on both forms
  secB.appendChild(el('div', { class: 'code-list' }, [
    el('div', { class: 'code-list-title' }, [el('strong', { text: CODE_LIST.title }), ' ', el('span', { text: CODE_LIST.subtitle })]),
    el('div', { class: 'code-list-items' }, OBSERVATION_CODES.map((c) => el('span', { class: 'code-item' }, [el('b', { text: c.code }), el('span', { text: c.label })]))),
  ]));
  root.appendChild(secB);

  // ---- Section C (ATP) or additional comments
  if (form.atp) {
    const secC = el('section', { class: 'form-section', 'aria-labelledby': 'sec-c' });
    const bannerC = banner(form.atp.letter, form.atp.title, ''); bannerC.id = 'sec-c';
    secC.appendChild(bannerC);
    const atpRow = el('div', { class: 'atp-row' });
    atpRow.appendChild(el('label', { class: 'atp-label', for: 'atp-code', text: form.atp.codeLabel }));
    const codeInp = textInput('atp.code', { maxLength: form.atp.codeMaxLength, placeholder: 'e.g. MATH-9-T3-W5', ariaLabel: 'ATP code' });
    codeInp.id = 'atp-code'; codeInp.required = true;
    atpRow.appendChild(el('div', { class: 'rounded-field atp-code-field' }, codeInp));
    const statusGroup = el('div', { class: 'check-group', role: 'radiogroup', 'aria-label': 'ATP completion status', 'data-path': 'atp.status' });
    for (const s of ATP_STATUS) {
      const id = `atp-status-${s.value}`;
      const radio = el('input', { type: 'radio', name: 'atp-status', id, value: s.value, class: 'check-input' });
      radio.checked = data.atp?.status === s.value;
      radio.addEventListener('change', () => { setPath(data, 'atp.status', s.value); change('atp.status'); });
      statusGroup.appendChild(el('label', { class: 'check-label', for: id }, [radio, el('span', { class: 'check-box', 'aria-hidden': 'true' }), el('span', { text: s.label })]));
    }
    atpRow.appendChild(statusGroup);
    secC.appendChild(atpRow);
    secC.appendChild(el('div', { class: 'comments-label' }, [el('strong', { text: form.atp.commentsLabel }), ' ', el('span', { text: form.atp.commentsHint })]));
    secC.appendChild(commentsArea(data, form, change, 'Educator comments'));
    root.appendChild(secC);
  } else {
    const secC = el('section', { class: 'form-section', 'aria-labelledby': 'sec-comments' });
    const bannerC = banner(null, form.comments.title, form.comments.subtitle); bannerC.id = 'sec-comments';
    secC.append(bannerC, commentsArea(data, form, change, 'Additional comments'));
    root.appendChild(secC);
  }

  // ---- sign-off: term, week, the week's dates and the educator's signature
  const secD = el('section', { class: 'form-section signoff', 'aria-labelledby': 'sec-signoff' });
  const bannerD = banner(form.signOff.letter, form.signOff.title, ''); bannerD.id = 'sec-signoff';
  secD.appendChild(bannerD);
  const body = el('div', { class: 'signoff-body' });
  body.appendChild(el('p', { class: 'declaration', text: form.signOff.declaration }));

  /** Date field with DD / MM / YYYY boxes bound to an ISO path on `data`. */
  const dateField = (path, label) => {
    const field = el('div', { class: 'signoff-field date-field', 'data-path': path });
    field.appendChild(el('span', { class: 'field-label', text: label }));
    const parts = { dd: '', mm: '', yyyy: '' };
    const current = getPath(data, path) || '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(current)) { [parts.yyyy, parts.mm, parts.dd] = current.split('-'); }
    const scratch = { ...parts };
    const boxes = el('div', { class: 'date-boxes' });
    const mkPart = (key, len, partLabel) => {
      const g = charGroup({ data: scratch, path: key, length: len, charset: 'digit', label: partLabel, onChange: () => {
        const { dd, mm, yyyy } = scratch;
        setPath(data, path, (dd || mm || yyyy) ? `${yyyy}-${mm}-${dd}` : '');
        change(path);
      } });
      g.classList.add('date-part');
      return g;
    };
    boxes.append(mkPart('dd', 2, 'Day'), el('span', { class: 'date-sep', text: '/' }), mkPart('mm', 2, 'Month'), el('span', { class: 'date-sep', text: '/' }), mkPart('yyyy', 4, 'Year'));
    field.appendChild(boxes);
    field.appendChild(el('span', { class: 'field-hint', text: 'DD / MM / YYYY' }));
    const todayBtn = el('button', { type: 'button', class: 'btn btn-ghost btn-sm', text: 'Use today' });
    todayBtn.addEventListener('click', () => {
      const t = new Date();
      const yyyy = String(t.getFullYear()), mm = String(t.getMonth() + 1).padStart(2, '0'), dd = String(t.getDate()).padStart(2, '0');
      Object.assign(scratch, { dd, mm, yyyy });
      for (const [k, v] of Object.entries({ dd, mm, yyyy })) {
        const g = boxes.querySelector(`[data-path="${k}"]`);
        [...g.querySelectorAll('input')].forEach((inp, i) => { inp.value = v[i] || ''; });
      }
      setPath(data, path, `${yyyy}-${mm}-${dd}`); change(path);
    });
    field.appendChild(todayBtn);
    return field;
  };

  // any fields the sign-off captures besides the signature (none at present)
  const fieldRow = el('div', { class: 'signoff-row' });
  for (const f of form.signOff.fields) {
    const field = el('div', { class: 'signoff-field', 'data-path': `signOff.${f.key}` });
    field.appendChild(el('span', { class: 'field-label', text: f.label }));
    field.appendChild(charGroup({ data, path: `signOff.${f.key}`, length: f.length, charset: 'digit', label: f.label.replace(/:$/, ''), onChange: change }));
    fieldRow.appendChild(field);
  }
  for (const d of form.signOff.dates) fieldRow.appendChild(dateField(`signOff.${d.key}`, d.label));
  if (fieldRow.childElementCount) body.appendChild(fieldRow);

  body.appendChild(el('div', { class: 'signoff-field signoff-sign' }, [
    el('span', { class: 'field-label', text: `${form.signOff.educatorLabel} signature:` }),
    signaturePad({ data, path: 'signOff.signature', onChange: change, who: form.signOff.educatorLabel }),
  ]));

  secD.appendChild(body);
  root.appendChild(secD);

  // footer strip
  root.appendChild(el('footer', { class: 'sheet-footer' }, [
    el('span', {}, [el('b', { text: form.formCode }), `  |  ${form.title}`]),
    el('span', { text: SCHOOL.name.replace(/\b(\w)(\w*)/g, (_, a, r) => a + r.toLowerCase()) }),
    el('span', { text: SCHOOL.mottoWords.join('  ·  ') }),
  ]));

  enableGridKeyboardNav(root);
  return { form, data };
}

function commentsArea(data, form, change, ariaLabel) {
  const ta = el('textarea', { class: 'comments-input', 'data-path': 'comments', rows: form.comments.minLines + 1, maxlength: form.comments.maxLength, 'aria-label': ariaLabel, placeholder: 'Type here…' });
  ta.value = data.comments || '';
  const counter = el('div', { class: 'char-counter', text: `${ta.value.length} / ${form.comments.maxLength}` });
  ta.addEventListener('input', () => { setPath(data, 'comments', ta.value); counter.textContent = `${ta.value.length} / ${form.comments.maxLength}`; change('comments'); });
  return el('div', { class: `comments-wrap style-${form.comments.style}` }, [ta, counter]);
}


/** Arrow-key navigation between cells of the grid tables. */
function enableGridKeyboardNav(root) {
  root.addEventListener('keydown', (e) => {
    const inp = e.target;
    if (!(inp instanceof HTMLInputElement) || !inp.classList.contains('cell-input')) return;
    const td = inp.closest('td'); const tr = td?.parentElement; if (!tr) return;
    const col = [...tr.children].indexOf(td);
    let target = null;
    if (e.key === 'ArrowDown' || e.key === 'Enter') target = tr.nextElementSibling?.children[col]?.querySelector('input');
    else if (e.key === 'ArrowUp') target = tr.previousElementSibling?.children[col]?.querySelector('input');
    else if (e.key === 'ArrowRight' && inp.selectionStart === inp.value.length) target = td.nextElementSibling?.querySelector('input');
    else if (e.key === 'ArrowLeft' && inp.selectionStart === 0) target = td.previousElementSibling?.querySelector('input');
    if (target) { e.preventDefault(); target.focus(); target.select(); }
  });
}

// ------------------------------------------------------------ errors
/** Remove the invalid state from one field once the user edits it. */
export function clearFieldError(root, path) {
  const target = root.querySelector(`[data-path="${path}"]`);
  if (!target) return;
  target.classList.remove('is-invalid'); target.removeAttribute('aria-invalid'); target.removeAttribute('title');
  const holder = target.closest('.meta-value, .signoff-field, .comments-wrap, .atp-row, .check-group') || target.parentElement;
  holder?.querySelectorAll(':scope > .field-error').forEach((n) => n.remove());
  const summary = root.querySelector('#error-summary');
  if (summary && !summary.hidden) {
    summary.querySelectorAll(`li[data-error-path="${path}"]`).forEach((n) => n.remove());
    if (!summary.querySelector('li')) { summary.hidden = true; summary.innerHTML = ''; }
  }
}

export function showErrors(root, errors) {
  root.querySelectorAll('.is-invalid').forEach((n) => { n.classList.remove('is-invalid'); n.removeAttribute('aria-invalid'); });
  root.querySelectorAll('.field-error').forEach((n) => n.remove());
  const summary = root.querySelector('#error-summary');
  if (!errors.length) { summary.hidden = true; summary.innerHTML = ''; return; }
  summary.hidden = false;
  summary.innerHTML = '';
  summary.appendChild(el('h2', { text: `Please fix ${errors.length} ${errors.length === 1 ? 'item' : 'items'} before generating the form` }));
  const list = el('ul');
  const seen = new Set();
  for (const err of errors) {
    const target = root.querySelector(`[data-path="${err.path}"]`);
    if (target) {
      target.classList.add('is-invalid');
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) target.setAttribute('aria-invalid', 'true');
      if (!target.classList.contains('cell-input') && !seen.has(err.path)) {
        const holder = target.closest('.meta-value, .signoff-field, .comments-wrap, .atp-row, .check-group') || target.parentElement;
        holder.appendChild(el('div', { class: 'field-error', text: err.message }));
      }
      target.setAttribute('title', err.message);
    }
    seen.add(err.path);
    const link = el('a', { href: '#', text: err.message });
    link.addEventListener('click', (ev) => { ev.preventDefault(); const t = root.querySelector(`[data-path="${err.path}"]`); const f = t?.matches('input,textarea') ? t : t?.querySelector('input,textarea,canvas'); (f || t)?.focus(); (f || t)?.scrollIntoView({ block: 'center', behavior: 'smooth' }); });
    list.appendChild(el('li', { 'data-error-path': err.path }, link));
  }
  summary.appendChild(list);
  summary.scrollIntoView({ block: 'start', behavior: 'smooth' });
  summary.focus?.();
}
