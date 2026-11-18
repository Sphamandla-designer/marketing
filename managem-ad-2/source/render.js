const {chromium}=require('playwright');const {spawn}=require('child_process');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
await p.goto('file://'+process.argv[2]+'/ad.html');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(1000);
const FPS=30,D=await p.evaluate(()=>window.DUR),N=Math.round(D*FPS);
const ff=spawn('ffmpeg',['-y','-v','error','-f','image2pipe','-framerate',String(FPS),'-c:v','mjpeg','-i','-','-c:v','libx264','-preset','slow','-crf','15','-pix_fmt','yuv420p',process.argv[3]],{stdio:['pipe','inherit','inherit']});
for(let i=0;i<N;i++){await p.evaluate(t=>window.render(t),i/FPS);const buf=await p.screenshot({type:'jpeg',quality:96});if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r));if(i%150==0)console.log(i,N)}
ff.stdin.end();await new Promise(r=>ff.on('close',r));await b.close();console.log('done')})();
