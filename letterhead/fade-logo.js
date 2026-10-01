// Softens the hard-cropped right/bottom edges of the logo JPEG into a transparent PNG.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
  const p = await b.newPage();
  const src = 'data:image/jpeg;base64,' + fs.readFileSync('assets/kenzo-logo.jpg').toString('base64');
  const out = await p.evaluate(async (src) => {
    const img = new Image(); img.src = src; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const x = c.getContext('2d');
    x.drawImage(img, 0, 0);
    // knock out the white background so it sits cleanly on any page
    const d = x.getImageData(0, 0, c.width, c.height), px = d.data;
    for (let i = 0; i < px.length; i += 4) {
      const m = Math.min(px[i], px[i + 1], px[i + 2]);
      if (m > 235) px[i + 3] = Math.round(255 * (255 - m) / 20);
    }
    x.putImageData(d, 0, 0);
    x.globalCompositeOperation = 'destination-in';
    const gx = x.createLinearGradient(c.width * 0.8, 0, c.width, 0);
    gx.addColorStop(0, 'rgba(0,0,0,1)'); gx.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = gx; x.fillRect(0, 0, c.width, c.height);
    const gy = x.createLinearGradient(0, c.height * 0.88, 0, c.height);
    gy.addColorStop(0, 'rgba(0,0,0,1)'); gy.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = gy; x.fillRect(0, 0, c.width, c.height);
    return c.toDataURL('image/png').split(',')[1];
  }, src);
  fs.writeFileSync('assets/kenzo-logo.png', Buffer.from(out, 'base64'));
  await b.close();
})();
