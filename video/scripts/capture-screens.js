// Captures the product screens used by the "Please Hold" film from the ManaGEM
// product build. Nothing on the page is edited: the script signs in, types into
// the product's own search boxes, and screenshots.
//
// Inserts are a 640x360 CSS-pixel window at 3x device scale, which is exactly
// 1920x1080 output pixels, so the film shows them without any scaling.
//
// Usage: node scripts/capture-screens.js <path-to-managem-app.html> [out-dir]
const { chromium } = require('playwright');

const [appPath, out = 'public/films/please-hold/screens'] = process.argv.slice(2);
if (!appPath) {
  console.error('usage: capture-screens.js <managem-app.html> [out-dir]');
  process.exit(1);
}
const URL = 'file://' + appPath;
const W = 640;
const H = 360;

const signIn = async (page) => {
  await page.goto(URL);
  await page.waitForTimeout(800);
  await page.click('button:has-text("Sign in")');
  await page.waitForTimeout(1200);
};
const search = async (page, q) => {
  const s = await page.$('main input[placeholder^="Search"]');
  await s.fill(q);
  await page.waitForTimeout(500);
};
// A WxH clip centred on a rectangle, kept inside the viewport.
const clipAround = (page, r, dx = 0, dy = 0) => {
  const vp = page.viewportSize();
  const x = Math.max(0, Math.min(vp.width - W, r.x + r.width / 2 - W / 2 + dx));
  const y = Math.max(0, Math.min(vp.height - H, r.y + r.height / 2 - H / 2 + dy));
  return { x: Math.round(x), y: Math.round(y), width: W, height: H };
};

(async () => {
  const browser = await chromium.launch();

  // Full screen, 1920x1080 at 1x: the over-the-shoulder placeholder.
  const full = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await signIn(full);
  await full.click('text="Open Enquiries"');
  await full.waitForTimeout(700);
  await search(full, 'MST');
  await full.screenshot({ path: `${out}/enquiries-filtered.png` });
  await full.close();

  // Inserts, 3x.
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 3 });
  await signIn(page);

  // A — Grand Total on the enquiry record.
  await page.click('text="Open Enquiries"');
  await page.waitForTimeout(700);
  await search(page, 'MST');
  await (await page.$('main tbody tr')).click();
  await page.waitForTimeout(800);
  const totalRect = async () =>
    page.evaluate(() => {
      const label = [...document.querySelectorAll('main *')].find(
        (e) => e.children.length === 0 && e.textContent.trim() === 'Grand Total',
      );
      const row = label.parentElement;
      row.scrollIntoView({ block: 'center' });
      const r = row.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    });
  await totalRect();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/insert-grand-total.png`, clip: clipAround(page, await totalRect(), 0, 40) });

  // B — STOCK on the product list.
  await page.click('text="Products & Pricing"');
  await page.waitForTimeout(700);
  await search(page, '20L');
  const stock = await page.evaluate(() => {
    const ths = [...document.querySelectorAll('main thead th')];
    const i = ths.findIndex((t) => t.textContent.trim().toUpperCase() === 'STOCK');
    const td = document.querySelector('main tbody tr').children[i];
    const a = ths[i].getBoundingClientRect();
    const c = td.getBoundingClientRect();
    return { x: Math.min(a.left, c.left), y: a.top, width: Math.max(a.width, c.width), height: c.bottom - a.top };
  });
  await page.screenshot({ path: `${out}/insert-stock.png`, clip: clipAround(page, stock) });

  // C — START / DAYS / FOREMAN on the bookings list.
  await page.click('text="Projects Module"');
  await page.waitForTimeout(600);
  await page.click('main >> text=Bookings & Calendar');
  await page.waitForTimeout(700);
  await search(page, 'MST');
  const booking = await page.evaluate(() => {
    const ths = [...document.querySelectorAll('main thead th')];
    const i = ths.findIndex((t) => t.textContent.trim().toUpperCase() === 'START');
    const j = ths.findIndex((t) => t.textContent.trim().toUpperCase() === 'FOREMAN');
    const tr = document.querySelector('main tbody tr');
    const a = ths[i].getBoundingClientRect();
    const z = tr.children[j].getBoundingClientRect();
    return { x: a.left, y: a.top, width: z.right - a.left, height: z.bottom - a.top };
  });
  await page.screenshot({ path: `${out}/insert-booking.png`, clip: clipAround(page, booking) });

  await browser.close();
  console.log('captured');
})();
