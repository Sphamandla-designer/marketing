/**
 * Loads the Roboto font files once and exposes them both as browser
 * FontFaces (for measurement and canvas rendering) and as base64 strings
 * (for embedding into the PDF), so the two outputs share exact metrics.
 */
export const FONT_FAMILY = 'FormRoboto';

const FILES = {
  normal: 'Roboto-Regular.ttf',
  bold: 'Roboto-Bold.ttf',
  italic: 'Roboto-Italic.ttf',
};

let loadPromise = null;

function bufferToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  return btoa(bin);
}

export function loadFonts(baseUrl = './assets/fonts/') {
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    const out = {};
    for (const [style, file] of Object.entries(FILES)) {
      const res = await fetch(baseUrl + file);
      if (!res.ok) throw new Error(`Failed to load font ${file}: ${res.status}`);
      const buf = await res.arrayBuffer();
      const face = new FontFace(FONT_FAMILY, buf, {
        weight: style === 'bold' ? '700' : '400',
        style: style === 'italic' ? 'italic' : 'normal',
      });
      await face.load();
      document.fonts.add(face);
      out[style] = { file, base64: bufferToBase64(buf) };
    }
    await document.fonts.ready;
    return out;
  })();
  return loadPromise;
}
