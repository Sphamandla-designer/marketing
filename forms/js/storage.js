/** IndexedDB store for submitted forms (data + generated PDF/PNG blobs). */
const DB_NAME = 'fhs-forms';
const STORE = 'submissions';

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const s = db.createObjectStore(STORE, { keyPath: 'docNumber' });
        s.createIndex('submittedAt', 'submittedAt');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveSubmission(record) {
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(record);
    tx.oncomplete = resolve; tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function listSubmissions() {
  const db = await openDb();
  const rows = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result || []); req.onerror = () => reject(req.error);
  });
  db.close();
  return rows.sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''));
}

export async function deleteSubmission(docNumber) {
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(docNumber);
    tx.oncomplete = resolve; tx.onerror = () => reject(tx.error);
  });
  db.close();
}

const DRAFT_PREFIX = 'forms.draft.';
export function saveDraft(type, data) {
  try { localStorage.setItem(DRAFT_PREFIX + type, JSON.stringify(data)); } catch (e) { /* ignore */ }
}
export function loadDraft(type) {
  try { const s = localStorage.getItem(DRAFT_PREFIX + type); return s ? JSON.parse(s) : null; } catch (e) { return null; }
}
export function clearDraft(type) {
  try { localStorage.removeItem(DRAFT_PREFIX + type); } catch (e) { /* ignore */ }
}
