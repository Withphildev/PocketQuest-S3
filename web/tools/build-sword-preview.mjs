import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const web=fileURLToPath(new URL('../',import.meta.url)),root=web+'/build/nova-sword';
const m=JSON.parse(await readFile(root+'/nova-attack.json','utf8')),images={};
for(const names of Object.values(m.directions))for(const name of names)images[name]=(await readFile(root+'/'+name)).toString('base64');
for(const d of m.directionOrder)images['idle-'+d]=(await readFile(web+`/build/nova-female-v2/Nova-female-v2-${d}-idle-0.png`)).toString('base64');
const rgb=(await readFile(root+'/NovaSword.rgb565')).toString('base64'),mask=(await readFile(root+'/NovaSword.mask1')).toString('base64');
const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Female Nova · Sword animation review</title>
<style>body{background:#14241f;color:#f5e6c2;font:17px system-ui;max-width:960px;margin:40px auto;padding:20px}h1{font-family:Georgia}canvas{image-rendering:pixelated;background:#13241f;width:720px;max-width:100%;border:2px solid #a38957}button,select{font:inherit;padding:10px;margin:6px;background:#e8c684;color:#172b23;border:0;border-radius:5px}p{line-height:1.6}#status{color:#a6dba8}</style>
<h1>Female Nova · Sword swing</h1><p>StickS3 240×135 pixel art preview · not firmware or physical hardware testing.</p>
<label>Direction <select id="direction"><option value="south">Down / front</option><option value="north">Up / back</option><option value="west">Left</option><option value="east" selected>Right · battle-facing</option></select></label>
<label>Format <select id="format"><option value="lcd">LCD RGB565 + 1-bit transparency</option><option value="png">PNG with full alpha</option></select></label>
<button id="play">Swing sword</button><label><input id="loop" type="checkbox">Loop preview</label><p id="status">Loading sprites…</p><canvas id="screen" width="240" height="135"></canvas>
<p>Attack frames: 80×64 · ground pivot (40,56) · four poses, 480 ms total. Body target approximately 32×48. Native screen shown enlarged 3× with nearest-neighbor scaling. Sword reach is cosmetic here; no hitboxes or combat rules changed.</p>
<script type="application/json" id="assets">${JSON.stringify({m,images,rgb,mask})}</script><script type="module">
const {m,images,rgb,mask}=JSON.parse(document.querySelector('#assets').textContent),bitmaps={};
for(const [name,b64] of Object.entries(images))bitmaps[name]=await createImageBitmap(new Blob([Uint8Array.from(atob(b64),c=>c.charCodeAt(0))],{type:'image/png'}));
const bytes=Uint8Array.from(atob(rgb),c=>c.charCodeAt(0)),bits=Uint8Array.from(atob(mask),c=>c.charCodeAt(0)),lcd=[];
for(let f=0;f<16;f++){const cv=document.createElement('canvas');cv.width=80;cv.height=64;const ctx=cv.getContext('2d'),data=ctx.createImageData(80,64);for(let i=0;i<5120;i++){const n=f*5120+i,v=bytes[n*2]|bytes[n*2+1]<<8,r=v>>11,g=v>>5&63,b=v&31;data.data.set([(r<<3)|(r>>2),(g<<2)|(g>>4),(b<<3)|(b>>2),bits[n>>3]&(1<<(7-(n&7)))?255:0],i*4);}ctx.putImageData(data,0,0);lcd.push(cv);}
const canvas=document.querySelector('#screen'),ctx=canvas.getContext('2d'),status=document.querySelector('#status');ctx.imageSmoothingEnabled=false;let began=null;
document.querySelector('#play').onclick=()=>began=performance.now();document.querySelector('#direction').onchange=()=>began=null;
function tick(now){const d=document.querySelector('#direction').value,row=m.directionOrder.indexOf(d);let elapsed=began===null?480:now-began;
if(document.querySelector('#loop').checked&&elapsed>=650){began=now;elapsed=0;}let phase=-1,remaining=elapsed;for(let i=0;i<4;i++){if(remaining<m.durationMs[i]){phase=i;break;}remaining-=m.durationMs[i];}
ctx.fillStyle='#142d25';ctx.fillRect(0,0,240,135);ctx.fillStyle='#ecd6a0';ctx.font='9px monospace';ctx.fillText('PocketQuest · sprite QA',5,11);ctx.fillStyle='#396047';ctx.fillRect(0,87,240,48);
if(phase<0)ctx.drawImage(bitmaps['idle-'+d],44-16,82-44);else ctx.drawImage(document.querySelector('#format').value==='lcd'?lcd[row*4+phase]:bitmaps[m.directions[d][phase]],44-40,82-56);
ctx.fillStyle='#ecd6a0';ctx.fillText(phase<0?'Ready':m.phases[phase],100,60);ctx.fillText('Artwork review only',5,122);
status.textContent='Loaded 16 attack frames · '+d+' · '+(phase<0?'idle':('frame '+(phase+1)+' / '+m.phases[phase]));requestAnimationFrame(tick);}
requestAnimationFrame(tick);
</script></html>`;
await mkdir(web+'/dist',{recursive:true});await writeFile(web+'/dist/PocketQuest-Female-Nova-Sword-Review.html',html);console.log('Sword animation preview built.');
