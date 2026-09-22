#!/usr/bin/env node
/**
 * Screenshots the generated HTML pages into PNGs.
 *
 * Reads a jobs file: [{ html, out, width, height, scale }, ...]
 * Usage: node tools/brand/render.js <jobs.json>
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE ||
  '/opt/node22/lib/node_modules/playwright');

(async () => {
  const jobsPath = process.argv[2];
  const jobs = JSON.parse(fs.readFileSync(jobsPath, 'utf8'));
  const browser = await chromium.launch({ args: ['--font-render-hinting=none',
    '--disable-lcd-text', '--force-color-profile=srgb'] });

  for (const job of jobs) {
    const scale = job.scale || 1;
    const page = await browser.newPage({
      viewport: { width: job.width, height: job.height },
      deviceScaleFactor: scale,
    });
    await page.goto('file://' + path.resolve(job.html), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(120);
    fs.mkdirSync(path.dirname(job.out), { recursive: true });
    await page.screenshot({ path: job.out, type: 'png' });
    await page.close();
    const kb = (fs.statSync(job.out).size / 1024).toFixed(0);
    console.log(
      `  ${path.relative(process.cwd(), job.out)}  ` +
      `${job.width * scale}x${job.height * scale}  ${kb}KB`
    );
  }

  await browser.close();
})().catch((err) => { console.error(err); process.exit(1); });
