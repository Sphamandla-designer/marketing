/**
 * Two painters that replay the same layout primitives:
 *   renderPdf(doc, fonts)            → jsPDF instance (vector, A4, embedded Roboto)
 *   renderPageToCanvas(doc, i, dpi)  → HTMLCanvasElement (raster, default 300 DPI)
 */
import { FONT_FAMILY } from './fonts.js';

const PT = 0.352778;

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

// ---------------------------------------------------------------- PDF
export function renderPdf(doc, fonts, meta = {}) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: 'mm', format: [doc.width, doc.height], orientation: 'portrait', compress: true });
  for (const [style, f] of Object.entries(fonts)) {
    pdf.addFileToVFS(f.file, f.base64);
    pdf.addFont(f.file, FONT_FAMILY, style);
  }
  pdf.setProperties({ title: meta.title || doc.title, subject: meta.subject || doc.title, author: meta.author || '', creator: 'Fisantekraal High School forms' });
  pdf.setCharSpace(0);
  const imageCache = new Map();
  let imgIndex = 0;
  doc.pages.forEach((page, i) => {
    if (i > 0) pdf.addPage([doc.width, doc.height], 'portrait');
    for (const op of page.ops) {
      switch (op.t) {
        case 'rect': {
          if (op.fill) pdf.setFillColor(...hexToRgb(op.fill));
          if (op.stroke) { pdf.setDrawColor(...hexToRgb(op.stroke)); pdf.setLineWidth(op.lw); }
          const style = op.fill && op.stroke ? 'FD' : op.fill ? 'F' : 'S';
          if (op.r) pdf.roundedRect(op.x, op.y, op.w, op.h, op.r, op.r, style);
          else pdf.rect(op.x, op.y, op.w, op.h, style);
          break;
        }
        case 'line':
          pdf.setDrawColor(...hexToRgb(op.color)); pdf.setLineWidth(op.lw); pdf.setLineCap('butt');
          pdf.line(op.x1, op.y1, op.x2, op.y2);
          break;
        case 'text':
          pdf.setFont(FONT_FAMILY, op.style); pdf.setFontSize(op.size); pdf.setTextColor(...hexToRgb(op.color));
          pdf.text(op.s, op.x, op.y, { baseline: 'alphabetic' });
          break;
        case 'image': {
          let alias = imageCache.get(op.src);
          if (!alias) { alias = `img${imgIndex++}`; imageCache.set(op.src, alias); }
          pdf.addImage(op.src, 'PNG', op.x, op.y, op.w, op.h, alias, 'SLOW');
          break;
        }
        default: break;
      }
    }
  });
  return pdf;
}

// ------------------------------------------------------------- Canvas
const imgCache = new Map();
function loadImage(src) {
  if (imgCache.has(src)) return imgCache.get(src);
  const p = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to decode image for PNG export'));
    img.src = src;
  });
  imgCache.set(src, p);
  return p;
}

function roundedPath(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

export async function renderPageToCanvas(doc, pageIndex, dpi = 300) {
  const page = doc.pages[pageIndex];
  const scale = dpi / 25.4; // px per mm
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(doc.width * scale);
  canvas.height = Math.round(doc.height * scale);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.scale(scale, scale);
  ctx.textBaseline = 'alphabetic';
  ctx.fontKerning = 'none';
  ctx.lineCap = 'butt';
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const images = new Map();
  for (const op of page.ops) if (op.t === 'image' && !images.has(op.src)) images.set(op.src, await loadImage(op.src));

  for (const op of page.ops) {
    switch (op.t) {
      case 'rect':
        if (op.r) roundedPath(ctx, op.x, op.y, op.w, op.h, op.r);
        else { ctx.beginPath(); ctx.rect(op.x, op.y, op.w, op.h); }
        if (op.fill) { ctx.fillStyle = op.fill; ctx.fill(); }
        if (op.stroke) { ctx.strokeStyle = op.stroke; ctx.lineWidth = op.lw; ctx.stroke(); }
        break;
      case 'line':
        ctx.beginPath(); ctx.moveTo(op.x1, op.y1); ctx.lineTo(op.x2, op.y2);
        ctx.strokeStyle = op.color; ctx.lineWidth = op.lw; ctx.stroke();
        break;
      case 'text': {
        const weight = op.style === 'bold' ? '700' : '400';
        const st = op.style === 'italic' ? 'italic' : 'normal';
        ctx.font = `${st} ${weight} ${op.size * PT}px ${FONT_FAMILY}`;
        ctx.fillStyle = op.color;
        ctx.fillText(op.s, op.x, op.y);
        break;
      }
      case 'image':
        ctx.drawImage(images.get(op.src), op.x, op.y, op.w, op.h);
        break;
      default: break;
    }
  }
  return canvas;
}

export function canvasToPngBlob(canvas) {
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG encoding failed'))), 'image/png'));
}

/** Text measurement in mm using the browser font engine (shared by both outputs). */
let measureCtx = null;
export function makeMeasurer() {
  if (!measureCtx) {
    const c = document.createElement('canvas');
    measureCtx = c.getContext('2d');
    measureCtx.fontKerning = 'none';
  }
  return (s, sizePt, style = 'normal') => {
    const weight = style === 'bold' ? '700' : '400';
    const st = style === 'italic' ? 'italic' : 'normal';
    measureCtx.font = `${st} ${weight} ${sizePt}px ${FONT_FAMILY}`;
    return measureCtx.measureText(s).width * PT;
  };
}
