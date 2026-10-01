// Shared page geometry (inches) for the CMaxx Word templates and the PDF proofs.
const PAPERS = {
  a4:     { label: 'A4',     w: 8.2677, h: 11.6929 },
  letter: { label: 'Letter', w: 8.5,    h: 11 },
};
const BLEED = 3 / 25.4;                          // 3mm print-shop bleed

const layout = (paper) => {
  const p = PAPERS[paper], s = p.w / 8.5;        // art is drawn at Letter width
  return {
    ...p, s,
    side: 0.85,                                  // left/right margin
    headerDist: 0.3, footerDist: 0.3,            // inside every desktop printer's printable area
    // page one
    headerH: 2.15 * s, footerH: 0.55 * s,
    logo: { x: 0.55, y: 0.34, h: 1.15 },          // white logo on the red sweep
    contactX: 4.85,                              // left edge of the contact column (icons)
    contactTop: 1.32,                            // first contact line, below the orange swoosh
    watermark: { size: 3.0, bottomGap: 0.85 },   // tower watermark, centred above the footer
    top: 2.95, bottom: 1.05,
    // multi-page letter: continuation pages and the closing page
    slimH: 1.2 * s, closingH: 1.15 * s,
    slimLogo: { x: 0.55, y: 0.22, h: 0.6 },
    slimTop: 1.95,                               // body starts below the slim header's rule
    closingBottom: 1.75,                         // keeps body text clear of the closing footer band
  };
};

module.exports = { PAPERS, BLEED, layout };
