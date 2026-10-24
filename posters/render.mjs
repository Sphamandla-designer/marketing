// Renders every posters/src/*.html to posters/out/<name>.png at 2x (2160×2700).
// Usage: node render.mjs [name ...]
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { readdirSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { resolve, basename } from 'node:path';
const src = resolve('src'), out = resolve('out');
const want = process.argv.slice(2);
const files = readdirSync(src).filter(f => f.endsWith('.html') && !f.endsWith('.built.html') && (!want.length || want.includes(f.replace('.html',''))));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 2 });
page.on('pageerror', e => console.error('JS error', e.message));
for (const f of files) {
  // {{inline:assets/x.svg}} → the file's contents, so an SVG can take currentColor
  const html = readFileSync(resolve(src, f), 'utf8').replace(/\{\{inline:([^}]+)\}\}/g, (_, p) => readFileSync(resolve(p), 'utf8').replace(/'Manrope'/g, "'ManropeLogo'"));
  page.on('console', m => m.type()==='error' && console.log('console', m.text()));
  const built = resolve(src, basename(f, '.html') + '.built.html');
  writeFileSync(built, html);
  await page.goto('file://' + built, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
  const name = basename(f, '.html');
  await page.screenshot({ path: resolve(out, name + '.png'), clip: { x: 0, y: 0, width: 1080, height: 1350 } });
  unlinkSync(built);
  console.log('rendered', name);
}
await browser.close();
