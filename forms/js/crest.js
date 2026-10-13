/** Rasterises the vector crest once at high resolution for both outputs. */
let crestPromise = null;

export function loadCrest(url = './assets/crest.svg', px = 800) {
  if (crestPromise) return crestPromise;
  crestPromise = (async () => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load crest: ${res.status}`);
    const svg = await res.text();
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const objUrl = URL.createObjectURL(blob);
    try {
      const img = new Image();
      img.decoding = 'sync';
      await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = () => reject(new Error('Crest SVG failed to decode')); img.src = objUrl; });
      const canvas = document.createElement('canvas');
      canvas.width = px; canvas.height = px;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, px, px);
      const dataUrl = canvas.toDataURL('image/png');
      return { dataUrl, width: px, height: px, aspect: 1 };
    } finally {
      URL.revokeObjectURL(objUrl);
    }
  })();
  return crestPromise;
}
