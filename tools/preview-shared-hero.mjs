// LOOPBACK SYNTHETIC DEVICE ONLY. No physical device and no persistent disk saves.
import {createServer} from 'node:http';import {readFileSync} from 'node:fs';import {spawn} from 'node:child_process';import {createInterface} from 'node:readline';
const child=spawn(process.argv[2],process.argv.slice(3).filter(a=>a!=='--no-handheld-seed'),{stdio:['pipe','pipe','inherit']}),pending=[];let token='';
createInterface({input:child.stdout}).on('line',line=>{const value=JSON.parse(line);token=value.state.token;pending.shift()?.(value);});
const ask=line=>new Promise(resolve=>{pending.push(resolve);child.stdin.write(line+'\n');});
const manifest=JSON.parse(readFileSync('web/build/route-delivery/manifest.json','utf8')),page=readFileSync('web/build/route-delivery/route.html.gz');
const audio=readFileSync('web/audio/The-Gentle-Glade.mp3');
const server=createServer(async(req,res)=>{
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 if(req.url==='/play'&&req.method==='GET'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Content-Encoding':'gzip','Content-Length':page.length,'Content-Security-Policy':manifest.csp});res.end(page);return;}
 if(req.url==='/audio/the-gentle-glade.mp3'&&req.method==='GET'){
  res.setHeader('Accept-Ranges','bytes');let first=0,last=audio.length-1,status=200;
  if(req.headers.range){const m=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);if(!m||(!m[1]&&!m[2])){res.writeHead(416,{'Content-Range':`bytes */${audio.length}`});res.end();return;}
   first=m[1]?Number(m[1]):Math.max(0,audio.length-Number(m[2]));last=m[1]&&m[2]?Math.min(last,Number(m[2])):last;status=206;
   if(first>last||(!m[1]&&Number(m[2])===0)){res.writeHead(416,{'Content-Range':`bytes */${audio.length}`});res.end();return;}
   res.setHeader('Content-Range',`bytes ${first}-${last}/${audio.length}`);
  }
  res.writeHead(status,{'Content-Type':'audio/mpeg','Content-Length':last-first+1});res.end(audio.subarray(first,last+1));return;
 }
 const json=(status,value)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(value));};
 if(req.url==='/api/route'&&req.method==='GET'){const r=await ask('get');json(r.code,r.state);return;}
 if(req.url==='/api/route/command'&&req.method==='POST'){
  // Mock-only trusted origin. Firmware uses PocketQuest/IP, never localhost.
  if(req.headers.origin!=='http://127.0.0.1:4193'||req.headers['x-pq-token']!==token){const r=await ask('get');json(403,{...r.state,error:'Mock origin/token rejected'});return;}
  let body='';for await(const chunk of req){body+=chunk;if(body.length>160){res.writeHead(400);res.end('{}');return;}}
  const p=new URLSearchParams(body),names=[...p.keys()];
  if(names.length!==3||!['base','action','target'].every(n=>names.includes(n))){res.writeHead(400);res.end('{}');return;}
  const codes=['start','attack','skill','guard','item','run','continue','camp','depart','return','advance','chest'],c=codes.indexOf(p.get('action'));
  if(c<0||!/^\d{1,20}$/.test(p.get('base'))||!(/^[0-3]$/).test(p.get('target'))){res.writeHead(400);res.end('{}');return;}
  const r=await ask(`cmd ${p.get('base')} ${c} ${p.get('target')}`);json(r.code,r.state);return;
 }
 // Test-only harness controls, never compiled/embedded into firmware.
 if(req.url==='/mock/reboot'||req.url==='/mock/handheld'){const r=await ask(req.url.endsWith('reboot')?'reboot':'handheld');json(r.code,r.state);return;}
 res.writeHead(404);res.end('LOCAL C++ AUTHORITY MOCK ONLY. Open /play.');
});await ask(process.argv.includes('--no-handheld-seed')?'get':'handheld');server.listen(4193,'127.0.0.1',()=>console.log('SYNTHETIC C++ device/save mock: http://127.0.0.1:4193/play (disposable engine state; no hardware)'));
process.on('SIGINT',()=>{child.kill();server.close();process.exit(0);});
