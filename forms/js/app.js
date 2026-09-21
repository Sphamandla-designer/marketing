/** Page glue: renders the interactive form, handles submit → PDF + PNG, result panel. */
import { createEmptyData, validate, normalise } from './model.js';
import { renderForm, showErrors } from './form-ui.js';
import { submitForm, downloadBlob } from './export.js';
import { loadFonts } from './fonts.js';
import { loadCrest } from './crest.js';
import { saveDraft, loadDraft, clearDraft } from './storage.js';
import { getForm } from './schema.js';

function $(sel) { return document.querySelector(sel); }

export function initFormPage(formType) {
  const form = getForm(formType);
  const root = $('#form-root');
  const status = $('#status');
  const result = $('#result');
  const busy = $('#busy');
  let data = loadDraft(formType) || createEmptyData(formType);
  if (data.formType !== formType) data = createEmptyData(formType);
  let lastSubmission = null;

  const autosave = () => { saveDraft(formType, data); status.textContent = 'Draft saved'; status.classList.add('show'); setTimeout(() => status.classList.remove('show'), 1200); };
  renderForm(root, data, { onChange: autosave });

  // warm up fonts + crest so the first generation is fast
  Promise.all([loadFonts(), loadCrest()]).catch((e) => console.warn(e));

  const setBusy = (on, msg) => { busy.hidden = !on; if (msg) busy.querySelector('.busy-text').textContent = msg; };

  $('#btn-submit').addEventListener('click', async () => {
    const errors = validate(normalise(data));
    showErrors(root, errors);
    if (errors.length) return;
    setBusy(true, 'Generating your form…');
    try {
      lastSubmission = await submitForm(data);
      window.__lastSubmission = lastSubmission; // for automated QA
      renderResult(lastSubmission);
      clearDraft(formType);
    } catch (e) {
      console.error(e);
      alert(`Something went wrong while generating the form: ${e.message}`);
    } finally {
      setBusy(false);
    }
  });

  $('#btn-clear').addEventListener('click', () => {
    if (!confirm('Clear the whole form? This cannot be undone.')) return;
    data = createEmptyData(formType);
    clearDraft(formType);
    renderForm(root, data, { onChange: autosave });
    showErrors(root, []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  function renderResult(sub) {
    result.hidden = false;
    root.parentElement.classList.add('submitted');
    result.innerHTML = '';
    const h = document.createElement('div'); h.className = 'result-head';
    h.innerHTML = `
      <div class="result-check" aria-hidden="true">✓</div>
      <div>
        <h2>${form.shortTitle} form generated</h2>
        <p>Document number <b>${sub.docNumber}</b> · Reference <b>${sub.identifier}</b> · ${sub.pageCount} ${sub.pageCount === 1 ? 'page' : 'pages'}${sub.remote ? ' · submitted to server' : sub.stored ? ' · saved on this device' : ''}</p>
      </div>`;
    result.appendChild(h);

    const actions = document.createElement('div'); actions.className = 'result-actions';
    const pdfBtn = button('Download PDF', 'btn btn-primary', () => downloadBlob(sub.pdf.blob, sub.pdf.filename));
    pdfBtn.id = 'btn-download-pdf';
    actions.appendChild(pdfBtn);
    if (sub.images.length === 1) {
      const b = button('Download Image (PNG)', 'btn btn-secondary', () => downloadBlob(sub.images[0].blob, sub.images[0].filename));
      b.id = 'btn-download-png';
      actions.appendChild(b);
    } else {
      const b = button(`Download all ${sub.images.length} images (PNG)`, 'btn btn-secondary', async () => { for (const im of sub.images) { downloadBlob(im.blob, im.filename); await new Promise((r) => setTimeout(r, 400)); } });
      b.id = 'btn-download-png';
      actions.appendChild(b);
    }
    actions.appendChild(button('Edit form', 'btn btn-ghost', () => { result.hidden = true; root.parentElement.classList.remove('submitted'); saveDraft(formType, data); window.scrollTo({ top: 0, behavior: 'smooth' }); }));
    actions.appendChild(button('Start a new form', 'btn btn-ghost', () => { data = createEmptyData(formType); clearDraft(formType); renderForm(root, data, { onChange: autosave }); result.hidden = true; root.parentElement.classList.remove('submitted'); window.scrollTo({ top: 0, behavior: 'smooth' }); }));
    result.appendChild(actions);

    const files = document.createElement('ul'); files.className = 'file-list';
    files.innerHTML = `<li><span class="file-icon">PDF</span> ${sub.pdf.filename} <small>(${fmtSize(sub.pdf.blob.size)})</small></li>` +
      sub.images.map((im) => `<li><span class="file-icon">PNG</span> ${im.filename} <small>(${im.canvas.width} × ${im.canvas.height} px, ${fmtSize(im.blob.size)})</small> <button type="button" class="link-btn" data-page="${im.page}">download</button></li>`).join('');
    files.querySelectorAll('[data-page]').forEach((b) => b.addEventListener('click', () => { const im = sub.images[+b.dataset.page - 1]; downloadBlob(im.blob, im.filename); }));
    result.appendChild(files);

    const previews = document.createElement('div'); previews.className = 'previews';
    sub.images.forEach((im) => {
      const fig = document.createElement('figure'); fig.className = 'page-preview';
      const img = document.createElement('img');
      img.alt = `${form.shortTitle} form, page ${im.page} of ${sub.pageCount}`;
      img.src = URL.createObjectURL(im.blob);
      img.loading = 'lazy';
      const cap = document.createElement('figcaption'); cap.textContent = `Page ${im.page} of ${sub.pageCount}`;
      fig.append(img, cap);
      previews.appendChild(fig);
    });
    result.appendChild(previews);
    result.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function button(text, cls, onClick) { const b = document.createElement('button'); b.type = 'button'; b.className = cls; b.textContent = text; b.addEventListener('click', onClick); return b; }
function fmtSize(n) { return n > 1024 * 1024 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`; }
