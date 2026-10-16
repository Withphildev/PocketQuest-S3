// Local mock only. Never contacts the StickS3 or writes game saves.
import {createServer} from 'node:http';import {readFileSync} from 'node:fs';
function page(){return readFileSync('firmware/include/HeroPage.h','utf8').split('R"PQHERO(')[1].split(')PQHERO"')[0];}
const fixtures=JSON.parse(readFileSync('webui/build/fixtures.json','utf8'));let mode='saved';
const bar=`<nav style="padding:12px;background:#4d3020;color:white">LOCAL MOCK — not device telemetry. <label>Scenario <select id="mock-scenario">${['saved','pending','reboot','missing','failed','max','offline'].map(s=>`<option ${s===mode?'selected':''}>${s}</option>`).join('')}</select></label></nav><script>document.querySelector('#mock-scenario').onchange=async e=>{await fetch('/mock/scenario?value='+e.target.value);document.querySelector('#refresh').click()}</script>`;
createServer((req,res)=>{const url=new URL(req.url,'http://localhost');res.setHeader('Cache-Control','no-store');
 if(url.pathname==='/mock/scenario'){mode=Object.hasOwn(fixtures,url.searchParams.get('value'))||url.searchParams.get('value')==='offline'?url.searchParams.get('value'):'saved';res.end('OK');return;}
 if(url.pathname==='/api/hero'){res.setHeader('Content-Type','application/json');if(mode==='offline'){res.statusCode=503;res.end('{}');}else res.end(JSON.stringify(fixtures[mode]));return;}
 res.setHeader('Content-Type','text/html');res.end(page().replace('<main>',bar+'<main>'));
}).listen(4180,'127.0.0.1',()=>console.log('Hero MOCK preview: http://127.0.0.1:4180'));
