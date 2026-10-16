// Local transport mock: exact compressed firmware payload/headers. No device access.
import {createServer} from 'node:http';import {readFileSync} from 'node:fs';
const manifest=JSON.parse(readFileSync('web/build/route-delivery/manifest.json','utf8'));
const gzip=readFileSync('web/build/route-delivery/route.html.gz');
const dashboard=readFileSync('firmware/include/HeroPage.h','utf8').split('R"PQHERO(')[1].split(')PQHERO"')[0];
createServer((req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method!=='GET'){res.writeHead(405);res.end('Read-only: GET only');return;}
  if(req.url==='/play'){
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Content-Encoding':'gzip','Content-Length':gzip.length,'Content-Security-Policy':manifest.csp});res.end(gzip);return;
  }
  if(req.url?.startsWith('/api/')){res.writeHead(503,{'Content-Type':'application/json'});res.end('{"error":"LOCAL TRANSPORT MOCK, NOT A DEVICE"}');return;}
  res.setHeader('Content-Security-Policy',"default-src 'none'; img-src data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'");
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(dashboard);
}).listen(4192,'127.0.0.1',()=>console.log('Firmware transport MOCK (no device): http://127.0.0.1:4192'));
