// Shared page geometry (inches) for the Word templates and the PDF proofs.
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
    headerH: 1.4 * s, footerH: 0.6 * s,
    logo: { x: 0.6, y: 0.48, size: 1.8 },
    contactTop: 1.45,                            // first contact line, clear of the panel
    lineH: 0.25,                                 // contact line pitch (as Word lays it out)
    headerDist: 0.3, footerDist: 0.3,            // inside every desktop printer's printable area
    top: 2.75, bottom: 1.15,
  };
};

module.exports = { PAPERS, BLEED, layout };
