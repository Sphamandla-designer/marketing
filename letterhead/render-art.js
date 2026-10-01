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

// Units: 1 unit = 1/100 inch on a 8.5in-wide page (A4 uses the same art scaled to 8.27in).
// Edge-touching shapes run 20 units past the trim so the same art can be cropped with bleed.
// Small decorations stay ≥0.25in from the paper edge, inside a desktop printer's printable area.
const art = {
  // Full-bleed header: band across the top, rounded panel top-right
  header: { w: 850, h: 140, bleed: 'top', svg: `
    <defs><linearGradient id="gd" x1="0" y1="0" x2="850" y2="140" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="${MAGENTA}"/><stop offset="0.6" stop-color="${MAGENTA}"/><stop offset="1" stop-color="${PURPLE}"/></linearGradient>
      <clipPath id="shape"><path d="M-20 -20 H870 V128 H604 Q576 128 576 100 V52 Q576 36 560 36 H-20 Z"/></clipPath></defs>
    <path d="M-20 -20 H870 V128 H604 Q576 128 576 100 V52 Q576 36 560 36 H-20 Z" fill="url(#gd)"/>
    <g clip-path="url(#shape)">
      ${dots(606, 52, 8, 5, 13, 2.4, '#fff', 0.3)}
      <circle cx="820" cy="10" r="48" fill="#fff" opacity="0.14"/>
      <circle cx="778" cy="84" r="32" fill="none" stroke="${GOLD}" stroke-width="2.2" opacity="0.95"/>
      <circle cx="783" cy="80" r="28" fill="none" stroke="${GOLD}" stroke-width="1" opacity="0.75"/>
      ${star(716, 62, 10, BLUSH, 0.85, 0.2)}
      ${star(632, 114, 5, '#fff', 0.55)}
      <circle cx="710" cy="112" r="6" fill="${BLUSH}" opacity="0.7"/>
      <circle cx="716" cy="115" r="6" fill="#fff" opacity="0.35"/>
    </g>
    ${star(470, 27, 4.5, '#fff', 0.5)}${star(260, 27, 3.5, '#fff', 0.4, 0.5)}
    <circle cx="120" cy="27" r="3" fill="#fff" opacity="0.45"/>
    <circle cx="360" cy="27" r="2.5" fill="${BLUSH}" opacity="0.8"/>` },

  // Full-bleed footer: tri-colour rule + gradient band
  footer: { w: 850, h: 60, bleed: 'bottom', svg: `
    <defs><linearGradient id="g" x1="0" y1="0" x2="850" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${MAGENTA}"/><stop offset="1" stop-color="${PURPLE}"/></linearGradient></defs>
    <rect x="-20" y="0" width="303" height="4" fill="${PURPLE}"/>
    <rect x="283" y="0" width="284" height="4" fill="${MAGENTA}"/>
    <rect x="567" y="0" width="303" height="4" fill="${PURPLE}"/>
    <rect x="-20" y="14" width="890" height="66" fill="url(#g)"/>
    ${dots(36, 26, 6, 2, 9, 1.6, '#fff', 0.35)}
    ${dots(760, 26, 6, 2, 9, 1.6, '#fff', 0.35)}` },

  // Continuation-page header: the same top band, ending in a small rounded tab top-right
  'header-slim': { w: 850, h: 80, bleed: 'top', svg: `
    <defs><linearGradient id="gs" x1="0" y1="0" x2="850" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="${MAGENTA}"/><stop offset="0.65" stop-color="${MAGENTA}"/><stop offset="1" stop-color="${PURPLE}"/></linearGradient>
      <clipPath id="tab"><path d="M-20 -20 H870 V70 H708 Q690 70 690 52 Q690 36 674 36 H-20 Z"/></clipPath></defs>
    <path d="M-20 -20 H870 V70 H708 Q690 70 690 52 Q690 36 674 36 H-20 Z" fill="url(#gs)"/>
    <g clip-path="url(#tab)">
      ${dots(712, 46, 5, 2, 11, 2, '#fff', 0.3)}
      <circle cx="800" cy="44" r="17" fill="none" stroke="${GOLD}" stroke-width="1.8" opacity="0.95"/>
      <circle cx="803" cy="42" r="14.5" fill="none" stroke="${GOLD}" stroke-width="0.8" opacity="0.75"/>
      ${star(772, 28, 5, BLUSH, 0.85, 0.2)}
    </g>
    ${star(470, 27, 4.5, '#fff', 0.5)}${star(260, 27, 3.5, '#fff', 0.4, 0.5)}
    <circle cx="120" cy="27" r="3" fill="#fff" opacity="0.45"/>
    <circle cx="360" cy="27" r="2.5" fill="${BLUSH}" opacity="0.8"/>` },

  // Last-page footer: tri-colour rule + a deeper band that carries the contact line (text is live in Word)
  'footer-closing': { w: 850, h: 110, bleed: 'bottom', svg: `
    <defs><linearGradient id="gc" x1="0" y1="0" x2="850" y2="110" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${MAGENTA}"/><stop offset="0.55" stop-color="${MAGENTA}"/><stop offset="1" stop-color="${PURPLE}"/></linearGradient>
      <clipPath id="band"><rect x="-20" y="14" width="890" height="116"/></clipPath></defs>
    <rect x="-20" y="0" width="303" height="4" fill="${PURPLE}"/>
    <rect x="283" y="0" width="284" height="4" fill="${MAGENTA}"/>
    <rect x="567" y="0" width="303" height="4" fill="${PURPLE}"/>
    <rect x="-20" y="14" width="890" height="116" fill="url(#gc)"/>
    <g clip-path="url(#band)">
      <circle cx="40" cy="30" r="40" fill="#fff" opacity="0.12"/>
      ${dots(36, 30, 6, 2, 9, 1.6, '#fff', 0.35)}
      ${dots(760, 30, 6, 2, 9, 1.6, '#fff', 0.35)}
      <circle cx="788" cy="66" r="22" fill="none" stroke="${GOLD}" stroke-width="1.8" opacity="0.9"/>
      <circle cx="791" cy="63" r="19" fill="none" stroke="${GOLD}" stroke-width="0.8" opacity="0.7"/>
    </g>` },

  // Contact icons reversed out (white discs, magenta glyphs) for use on the gradient band
  'icon-pin-light': { w: 24, h: 24, svg: `<circle cx="12" cy="12" r="12" fill="#fff"/>
    <path d="M12 5.2a4.6 4.6 0 0 0-4.6 4.6c0 3.4 4.6 8.6 4.6 8.6s4.6-5.2 4.6-8.6A4.6 4.6 0 0 0 12 5.2z" fill="${MAGENTA}"/>
    <circle cx="12" cy="9.8" r="1.7" fill="#fff"/>` },
  'icon-phone-light': { w: 24, h: 24, svg: `<circle cx="12" cy="12" r="12" fill="#fff"/>
    <path d="M9.1 6.3l1.4 2.9c.2.4.1.8-.2 1.1l-1 1c.7 1.5 1.9 2.7 3.4 3.4l1-1c.3-.3.7-.4 1.1-.2l2.9 1.4c.4.2.6.6.5 1l-.4 1.6c-.1.4-.5.7-.9.7C11.2 18.2 5.8 12.8 5.8 7.1c0-.4.3-.8.7-.9l1.6-.4c.4-.1.8.1 1 .5z" fill="${MAGENTA}"/>` },
  'icon-mail-light': { w: 24, h: 24, svg: `<circle cx="12" cy="12" r="12" fill="#fff"/>
    <rect x="6" y="8" width="12" height="8.4" rx="1.3" fill="none" stroke="${MAGENTA}" stroke-width="1.5"/>
    <path d="M6.6 8.8L12 12.8l5.4-4" fill="none" stroke="${MAGENTA}" stroke-width="1.5" stroke-linejoin="round"/>` },

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

// Paper sizes in inches; bleed is 3mm, the standard print-shop allowance.
const PAPERS = { a4: 8.2677, letter: 8.5 };
const BLEED_IN = 3 / 25.4;

async function shoot(page, name, vb, pw, ph, svg) {
  await page.setViewportSize({ width: pw, height: ph });
  await page.setContent(`<html><body style="margin:0;background:transparent">
    <svg xmlns="http://www.w3.org/2000/svg" width="${pw}" height="${ph}" viewBox="${vb.join(' ')}" preserveAspectRatio="none">${svg}</svg></body></html>`);
  await page.screenshot({ path: `assets/${name}.png`, omitBackground: true, clip: { x: 0, y: 0, width: pw, height: ph } });
  console.log(name, pw + 'x' + ph);
}

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
  const page = await browser.newPage();
  for (const [name, { w, h, svg, bleed }] of Object.entries(art)) {
    fs.writeFileSync(`assets/${name}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">${svg}</svg>\n`);
    // trim-size art (used in the Word files and desktop PDFs), 300dpi at Letter width
    await shoot(page, name, [0, 0, w, h], Math.round(w * DPI / 100), Math.round(h * DPI / 100), svg);
    if (!bleed) continue;
    for (const [paper, widthIn] of Object.entries(PAPERS)) {
      const B = BLEED_IN * 100 * 8.5 / widthIn;      // bleed in art units at this paper's scale
      const vb = bleed === 'top' ? [-B, -B, w + 2 * B, h + B] : [-B, 0, w + 2 * B, h + B];
      const scale = DPI * widthIn / 850;              // px per art unit at 300dpi on this paper
      await shoot(page, `${name}-bleed-${paper}`, vb, Math.round(vb[2] * scale), Math.round(vb[3] * scale), svg);
    }
  }
  await browser.close();
})();
