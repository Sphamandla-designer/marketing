// Renders the CMaxx letterhead artwork (SVG) to 300dpi PNGs with Chromium, plus 3mm-bleed
// versions of the edge-touching pieces for the print-shop PDFs.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');

// Colours sampled from the current CMaxx letterhead
const RED = '#EB1C24', DEEP = '#A3161D', ORANGE = '#F37221', NAVY = '#21202E', PEACH = '#FCE6D9', GREY = '#D9D9DE';
const DPI = 300;

// Faint "network" texture (nodes and links) like the circuit pattern on the current header.
// Seeded so every build draws the same pattern.
function network(seed, x0, y0, x1, y1, n, opacity) {
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const pts = Array.from({ length: n }, () => [x0 + rnd() * (x1 - x0), y0 + rnd() * (y1 - y0)]);
  let out = '';
  pts.forEach(([x, y], i) => {
    const near = pts.map((p, j) => [Math.hypot(p[0] - x, p[1] - y), j]).filter(([d, j]) => j !== i && d < 120).sort((a, b) => a[0] - b[0]).slice(0, 2);
    near.forEach(([, j]) => { out += `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${pts[j][0].toFixed(1)}" y2="${pts[j][1].toFixed(1)}"/>`; });
  });
  const dots = pts.map(([x, y], i) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${i % 3 ? 1.6 : 2.8}"/>`).join('');
  return `<g opacity="${opacity}" stroke="#fff" stroke-width="0.7" fill="#fff">${out}${dots}</g>`;
}

// Signal arcs (the logo's wifi rings) centred on (cx, cy)
const arcs = (cx, cy, radii, color, width, opacity) => radii.map(r =>
  `<path d="M${cx - r * 0.7} ${cy - r * 0.7} A${r} ${r} 0 0 0 ${cx - r * 0.7} ${cy + r * 0.7}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" opacity="${opacity}"/>` +
  `<path d="M${cx + r * 0.7} ${cy - r * 0.7} A${r} ${r} 0 0 1 ${cx + r * 0.7} ${cy + r * 0.7}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" opacity="${opacity}"/>`).join('');

const redGrad = (id, x2, y2) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}" gradientUnits="userSpaceOnUse">
  <stop offset="0" stop-color="${RED}"/><stop offset="0.55" stop-color="#D01920"/><stop offset="1" stop-color="${DEEP}"/></linearGradient>`;

// Units: 1 unit = 1/100 inch on a 8.5in-wide page (A4 uses the same art scaled to 8.27in).
// Edge-touching shapes run 20 units past the trim so the art can be cropped with bleed.
// Logo, text and icons stay ≥0.25in from the paper edge, inside a desktop printer's printable area.
const RED_EDGE = 'C160,192 300,150 430,108 C560,68 700,42 870,40';              // red's lower edge, left → right
const art = {
  // Page-one header: red sweep (logo sits on it), orange swoosh, navy crescent at the right edge
  header: { w: 850, h: 215, bleed: 'top', svg: `
    <defs>${redGrad('rg', 850, 200)}
      <clipPath id="red"><path d="M-20 -20 H870 V40 C700,42 560,68 430,108 C300,150 160,192 -20,198 Z"/></clipPath></defs>
    <path d="M-20 -20 H870 V40 C700,42 560,68 430,108 C300,150 160,192 -20,198 Z" fill="url(#rg)"/>
    <g clip-path="url(#red)">
      ${network(7, 300, -10, 860, 110, 34, 0.16)}
      ${arcs(760, 4, [18, 30, 42], '#fff', 2.2, 0.18)}
    </g>
    <path d="M-20 198 ${RED_EDGE} L870 48 C700,52 560,82 430,124 C300,168 160,210 -20,214 Z" fill="${ORANGE}"/>
    <path d="M560 82 C680,58 800,56 870,72 V172 C836,122 730,88 560,82 Z" fill="${NAVY}"/>` },

  // Continuation-page header: the same sweep, shallower
  'header-slim': { w: 850, h: 120, bleed: 'top', svg: `
    <defs>${redGrad('rg', 850, 120)}
      <clipPath id="red"><path d="M-20 -20 H870 V34 C640,34 400,76 -20,104 Z"/></clipPath></defs>
    <path d="M-20 -20 H870 V34 C640,34 400,76 -20,104 Z" fill="url(#rg)"/>
    <g clip-path="url(#red)">${network(11, 300, -10, 860, 66, 18, 0.16)}</g>
    <path d="M-20 104 C400,76 640,34 870,34 L870 41 C640,43 400,88 -20,117 Z" fill="${ORANGE}"/>
    <path d="M640 49 C730,41 820,45 870,64 V112 C840,82 760,58 640,49 Z" fill="${NAVY}"/>` },

  // Standard footer: orange rounded bar resting on a navy band
  footer: { w: 850, h: 55, bleed: 'bottom', svg: `
    <rect x="50" y="0" width="750" height="20" rx="10" fill="${ORANGE}"/>
    <rect x="-20" y="12" width="890" height="63" fill="${NAVY}"/>` },

  // Closing-page footer: deeper navy band that carries the contact line (text is live in Word)
  'footer-closing': { w: 850, h: 115, bleed: 'bottom', svg: `
    <rect x="50" y="0" width="750" height="20" rx="10" fill="${ORANGE}"/>
    <rect x="-20" y="12" width="890" height="123" fill="${NAVY}"/>
    <g>${arcs(790, 64, [14, 24, 34], ORANGE, 2.2, 0.35)}${arcs(60, 64, [14, 24, 34], ORANGE, 2.2, 0.35)}</g>` },

  // Body watermark: the logo's tower and rings, very light so text prints cleanly over it
  watermark: { w: 300, h: 300, svg: `
    ${arcs(150, 110, [70, 100, 130], PEACH, 16, 0.75)}
    <g opacity="0.6" fill="none" stroke="${GREY}" stroke-linecap="round" stroke-linejoin="round">
      <path d="M150 140 L116 292 M150 140 L184 292" stroke-width="13"/>
      <path d="M140 186 L168 236 M160 186 L132 236 M128 244 L176 292 M172 244 L124 292" stroke-width="8"/>
    </g>
    <circle cx="150" cy="110" r="36" fill="${GREY}" opacity="0.6"/>` },

  // Divider under the slim header: navy hairline with an orange lead-in
  rule: { w: 700, h: 4, svg: `<rect x="0" y="1.2" width="700" height="1.6" fill="${NAVY}" opacity="0.85"/><rect x="0" y="0" width="110" height="4" rx="2" fill="${ORANGE}"/>` },

  // Contact icons: white glyphs in orange discs
  'icon-phone': { w: 24, h: 24, svg: `<circle cx="12" cy="12" r="12" fill="${ORANGE}"/>
    <rect x="8.2" y="5" width="7.6" height="14" rx="1.6" fill="none" stroke="#fff" stroke-width="1.5"/>
    <circle cx="12" cy="16.4" r="0.95" fill="#fff"/>` },
  'icon-mail': { w: 24, h: 24, svg: `<circle cx="12" cy="12" r="12" fill="${ORANGE}"/>
    <rect x="6" y="8" width="12" height="8.4" rx="1.3" fill="none" stroke="#fff" stroke-width="1.5"/>
    <path d="M6.6 8.8L12 12.8l5.4-4" fill="none" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/>` },
  'icon-web': { w: 24, h: 24, svg: `<circle cx="12" cy="12" r="12" fill="${ORANGE}"/>
    <g fill="none" stroke="#fff" stroke-width="1.3"><circle cx="12" cy="12" r="6.2"/><ellipse cx="12" cy="12" rx="2.7" ry="6.2"/>
    <path d="M5.8 12h12.4M6.8 8.8h10.4M6.8 15.2h10.4"/></g>` },
  'icon-pin': { w: 24, h: 24, svg: `<circle cx="12" cy="12" r="12" fill="${ORANGE}"/>
    <path d="M12 5.2a4.6 4.6 0 0 0-4.6 4.6c0 3.4 4.6 8.6 4.6 8.6s4.6-5.2 4.6-8.6A4.6 4.6 0 0 0 12 5.2z" fill="#fff"/>
    <circle cx="12" cy="9.8" r="1.7" fill="${ORANGE}"/>` },
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
    // trim-size art (used in the Word files and office PDFs), 300dpi at Letter width
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
