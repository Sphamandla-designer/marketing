import { listSubmissions, deleteSubmission } from './storage.js';
import { downloadBlob } from './export.js';

async function render() {
  const list = document.querySelector('#recent');
  const rows = await listSubmissions().catch(() => []);
  if (!rows.length) { list.innerHTML = '<p class="muted">No forms have been generated on this device yet.</p>'; return; }
  list.innerHTML = '';
  for (const r of rows) {
    const li = document.createElement('li');
    const when = new Date(r.submittedAt);
    li.innerHTML = `<div><b>${r.title}</b><br><small>${r.docNumber} · ${r.identifier} · ${when.toLocaleString()}</small></div>`;
    const acts = document.createElement('div'); acts.className = 'recent-actions';
    const pdf = document.createElement('button'); pdf.className = 'btn btn-sm btn-primary'; pdf.textContent = 'PDF'; pdf.onclick = () => downloadBlob(r.pdf.blob, r.pdf.filename);
    acts.appendChild(pdf);
    r.images.forEach((im) => { const b = document.createElement('button'); b.className = 'btn btn-sm btn-secondary'; b.textContent = r.images.length > 1 ? `PNG p${im.page}` : 'PNG'; b.onclick = () => downloadBlob(im.blob, im.filename); acts.appendChild(b); });
    const del = document.createElement('button'); del.className = 'btn btn-sm btn-ghost'; del.textContent = 'Delete'; del.onclick = async () => { if (confirm(`Delete ${r.docNumber} from this device?`)) { await deleteSubmission(r.docNumber); render(); } };
    acts.appendChild(del);
    li.appendChild(acts);
    list.appendChild(li);
  }
}
render();
