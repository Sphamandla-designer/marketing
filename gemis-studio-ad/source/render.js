const {chromium}=require('playwright');const {spawn}=require('child_process');
(async()=>{const fmt=process.argv[4];const sz={v:[1080,1920],s:[1080,1080],h:[1920,1080]}[fmt];
const b=await chromium.launch({args:['--allow-file-access-from-files','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:sz[0],height:sz[1]}});
await p.goto('file://'+process.argv[2]+'/ad.html#'+fmt);await p.waitForFunction(()=>window.READY,{timeout:20000});await p.evaluate(()=>window.READY);
const FPS=30,D=await p.evaluate(()=>window.DUR),N=Math.round(D*FPS);
const ff=spawn('ffmpeg',['-y','-v','error','-f','image2pipe','-framerate',String(FPS),'-c:v','mjpeg','-i','-','-vf','fade=t=out:st=45.3:d=0.7:color=white','-c:v','libx264','-preset','medium','-crf','16','-pix_fmt','yuv420p',process.argv[3]],{stdio:['pipe','inherit','inherit']});
for(let i=0;i<N;i++){await p.evaluate(t=>window.render(t),i/FPS);const buf=await p.screenshot({type:'jpeg',quality:96});if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r));}
ff.stdin.end();await new Promise(r=>ff.on('close',r));await b.close();console.log('done',fmt)})();
