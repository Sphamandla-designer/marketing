// Renders the letterhead artwork (SVG) to 300dpi PNGs with Chromium.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');

const MAGENTA = '#C64BC9', PURPLE = '#9672E8', BLUSH = '#F4C6E6', GOLD = '#C9A55A';
const DPI = 300;
const grad = (id, dir = 'h') => `<linearGradient id="${id}" ${dir === 'h' ? 'x1="0" y1="0" x2="1" y2="0"' : 'x1="0" y1="0" x2="0" y2="1"'}>
  <stop offset="0" stop-color="${MAGENTA}"/><stop offset="1" stop-color="${PURPLE}"/></linearGradient>`;

function dots(x0, y0, cols, rows, gap, r, fill, op) {
  let s = '';
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++)
    s += `<circle cx="${x0 + i * gap + (j % 2) * gap / 2}" cy="${y0 + j * gap}" r="${r}" fill="${fill}" opacity="${op}"/>`;
  return s;
}
const star = (cx, cy, R, fill, op, rot = 0) => {
  const pts = [];
  for (let k = 0; k < 10; k++) {
    const a = (Math.PI / 5) * k - Math.PI / 2 + rot;
    const rr = k % 2 ? R * 0.45 : R;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`);
  }
  return `<polygon points="${pts.join(' ')}" fill="${fill}" opacity="${op}"/>`;
};

// Units: 1 unit = 1/100 inch
const art = {
  // Full-bleed header: thin band across the top, rounded panel top-right
  header: { w: 850, h: 140, svg: `
    <defs><linearGradient id="gd" x1="0" y1="0" x2="850" y2="140" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="${MAGENTA}"/><stop offset="0.6" stop-color="${MAGENTA}"/><stop offset="1" stop-color="${PURPLE}"/></linearGradient>
      <clipPath id="shape"><path id="p" d="M0 0 H850 V128 H604 Q576 128 576 100 V34 Q576 18 560 18 H0 Z"/></clipPath></defs>
    <path d="M0 0 H850 V128 H604 Q576 128 576 100 V34 Q576 18 560 18 H0 Z" fill="url(#gd)"/>
    <g clip-path="url(#shape)">
      ${dots(606, 34, 8, 6, 13, 2.4, '#fff', 0.3)}
      <circle cx="820" cy="10" r="48" fill="#fff" opacity="0.14"/>
      <circle cx="782" cy="74" r="34" fill="none" stroke="${GOLD}" stroke-width="2.2" opacity="0.95"/>
      <circle cx="787" cy="70" r="30" fill="none" stroke="${GOLD}" stroke-width="1" opacity="0.75"/>
      ${star(718, 52, 10, BLUSH, 0.85, 0.2)}
      ${star(632, 112, 5, '#fff', 0.55)}
      <circle cx="712" cy="108" r="6" fill="${BLUSH}" opacity="0.7"/>
      <circle cx="718" cy="111" r="6" fill="#fff" opacity="0.35"/>
    </g>
    ${star(470, 9, 5, '#fff', 0.5)}${star(260, 9, 4, '#fff', 0.4, 0.5)}
    <circle cx="120" cy="9" r="3.5" fill="#fff" opacity="0.45"/>
    <circle cx="360" cy="9" r="2.5" fill="${BLUSH}" opacity="0.8"/>` },

  // Full-bleed footer: tri-colour rule + gradient band
  footer: { w: 850, h: 46, svg: `
    <defs>${grad('g')}</defs>
    <rect x="0" y="0" width="283" height="4" fill="${PURPLE}"/>
    <rect x="283" y="0" width="284" height="4" fill="${MAGENTA}"/>
    <rect x="567" y="0" width="283" height="4" fill="${PURPLE}"/>
    <rect x="0" y="12" width="850" height="34" fill="url(#g)"/>
    ${dots(20, 20, 6, 3, 9, 1.6, '#fff', 0.35)}
    ${dots(760, 20, 6, 3, 9, 1.6, '#fff', 0.35)}` },

  // Header divider under the contact block (7in content width)
  rule: { w: 700, h: 4, svg: `
    <rect x="0" y="0" width="233" height="4" fill="${MAGENTA}"/>
    <rect x="233" y="0" width="234" height="4" fill="${PURPLE}"/>
    <rect x="467" y="0" width="233" height="4" fill="${MAGENTA}"/>` },

  // Contact icons: white glyphs in gradient circles
  'icon-pin': { w: 24, h: 24, svg: `<defs>${grad('g')}</defs><circle cx="12" cy="12" r="12" fill="url(#g)"/>
    <path d="M12 5.2a4.6 4.6 0 0 0-4.6 4.6c0 3.4 4.6 8.6 4.6 8.6s4.6-5.2 4.6-8.6A4.6 4.6 0 0 0 12 5.2z" fill="#fff"/>
    <circle cx="12" cy="9.8" r="1.7" fill="${MAGENTA}"/>` },
  'icon-phone': { w: 24, h: 24, svg: `<defs>${grad('g')}</defs><circle cx="12" cy="12" r="12" fill="url(#g)"/>
    <path d="M9.1 6.3l1.4 2.9c.2.4.1.8-.2 1.1l-1 1c.7 1.5 1.9 2.7 3.4 3.4l1-1c.3-.3.7-.4 1.1-.2l2.9 1.4c.4.2.6.6.5 1l-.4 1.6c-.1.4-.5.7-.9.7C11.2 18.2 5.8 12.8 5.8 7.1c0-.4.3-.8.7-.9l1.6-.4c.4-.1.8.1 1 .5z" fill="#fff"/>` },
  'icon-mail': { w: 24, h: 24, svg: `<defs>${grad('g')}</defs><circle cx="12" cy="12" r="12" fill="url(#g)"/>
    <rect x="6" y="8" width="12" height="8.4" rx="1.3" fill="none" stroke="#fff" stroke-width="1.5"/>
    <path d="M6.6 8.8L12 12.8l5.4-4" fill="none" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/>` },
};

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
  const page = await browser.newPage();
  for (const [name, { w, h, svg }] of Object.entries(art)) {
    const pw = Math.round(w * DPI / 100), ph = Math.round(h * DPI / 100);
    await page.setViewportSize({ width: pw, height: ph });
    await page.setContent(`<html><body style="margin:0;background:transparent">
      <svg xmlns="http://www.w3.org/2000/svg" width="${pw}" height="${ph}" viewBox="0 0 ${w} ${h}">${svg}</svg></body></html>`);
    await page.screenshot({ path: `assets/${name}.png`, omitBackground: true, clip: { x: 0, y: 0, width: pw, height: ph } });
    fs.writeFileSync(`assets/${name}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">${svg}</svg>\n`);
    console.log(name, pw + 'x' + ph);
  }
  await browser.close();
})();
