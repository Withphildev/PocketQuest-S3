import {readFile,writeFile,readdir,mkdir,copyFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {pngAssets} from './png-assets.mjs';
const web=fileURLToPath(new URL('../',import.meta.url)),assets={},imports={};
const assetBytes=await pngAssets(web);
async function add(dir,name){if(assets[name])throw Error(`Duplicate ${name}`);assets[name]=(await assetBytes(resolve(web,dir,name))).toString('base64');}
for(const name of await readdir(resolve(web,'build/validated-ground')))if(/\.(png|json)$/.test(name)&&!name.includes('Master'))await add('build/validated-ground',name);
assets['catalog.json']=Buffer.from(JSON.stringify(['F002-Sunlit-Forest-Left.json','F002-Sunlit-Forest-Right.json'])).toString('base64');
const nova=JSON.parse(await readFile(resolve(web,'build/nova-female-v2/nova.json'),'utf8'));const names=new Set(['nova.json']);
for(const section of [nova.protagonists,nova.idle])for(const sex of Object.values(section))for(const frames of Object.values(sex))for(const name of frames)names.add(name);
for(const name of names)await add('build/nova-female-v2',name);
await add('build/nova-sword','Nova-female-v2-attack-east-1.png');
const rest=JSON.parse(await readFile(resolve(web,'build/oakwood-rest/rest.json'),'utf8'));
for(const name of ['rest.json',rest.background,...Object.values(rest.characters).flatMap(c=>c.frames.map(f=>f.file))])await add('build/oakwood-rest',name);
for(const [dir,manifest]of [['slime-blue','slime.json'],['dire-wolf','wolf.json'],['goblin','goblin.json']]){
  const m=JSON.parse(await readFile(resolve(web,'build',dir,manifest),'utf8'));for(const name of m.frames)await add(`build/${dir}`,name);
}
for(const folder of ['src','route'])for(const name of await readdir(resolve(web,folder)))if(name.endsWith('.js')){
  const source=(await readFile(resolve(web,folder,name),'utf8')).replace(/from ['"]\.\.\/src\/([^'"]+)['"]/g,"from 'pq/src/$1'").replace(/from ['"]\.\/([^'"]+)['"]/g,`from 'pq/${folder}/$1'`);
  imports[`pq/${folder}/${name}`]='data:text/javascript;base64,'+Buffer.from(source).toString('base64');
}
let html=await readFile(resolve(web,'route/index.html'),'utf8');html=html.replace('<script type="module" src="app.js"></script>',`<script type="application/json" id="embedded-assets">${JSON.stringify(assets)}</script><script type="importmap">${JSON.stringify({imports})}</script><script type="module">import 'pq/route/app.js';</script>`);
const target=resolve(process.argv[2]||resolve(web,'dist/PocketQuest-Woodland-Route-Review.html'));await mkdir(resolve(target,'..'),{recursive:true});await writeFile(target,html);
await copyFile(resolve(web,'audio/The-Gentle-Glade.mp3'),resolve(target,'../PocketQuestMini-The-Gentle-Glade.mp3'));
console.log(`Built ${target}: ${Buffer.byteLength(html)} bytes; ${Object.keys(assets).length} embedded assets. Offline design demo; no firmware/API writes.`);
