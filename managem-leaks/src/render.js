
const { chromium } = require('playwright');
(async () => {
  const FPS=30, N=45*FPS, out=process.argv[2];
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file://' + __dirname + '/ad.html'); await p.evaluate(() => window.ready);
  for (const t of [30.5,31.5,33,35,28]) { await p.evaluate(t => window.render(t), t); await p.waitForTimeout(150); }
  const t0=Date.now();
  for (let i=0;i<N;i++){ await p.evaluate(t => window.render(t), i/FPS); await p.screenshot({ path: `${out}/f${String(i).padStart(5,'0')}.jpg`, type:'jpeg', quality:93 }); if(i%150===0) console.log(i, ((Date.now()-t0)/1000).toFixed(0)+'s'); }
  await b.close();
})();
