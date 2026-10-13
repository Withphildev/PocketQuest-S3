import {readFile,writeFile,readdir,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const source=process.argv[2];if(!source)throw Error('Pass the extracted candidate directory');
const assets={},imports={};
for(const name of ['F002-Sunlit-Forest-Left-CANDIDATE.png','F002-Sunlit-Forest-Right-CANDIDATE.png','F002-Contract-Overlay.png'])assets[name]=(await readFile(`${source}/${name}`)).toString('base64');
assets['F002-east-west.json']=(await readFile(`${root}/assets/F002-east-west.json`)).toString('base64');
for(const name of ['Sunlit-Tree.png','tree-placement.json'])assets[name]=(await readFile(`${root}/build/artwork/${name}`)).toString('base64');
for(const name of await readdir(`${root}/src`))if(name.endsWith('.js')){const js=(await readFile(`${root}/src/${name}`,'utf8')).replace(/from ['"]\.\/([^'"]+)['"]/g,"from 'pocketquest/$1'");imports[`pocketquest/${name}`]='data:text/javascript;base64,'+Buffer.from(js).toString('base64');}
const html=(await readFile(`${root}/candidate-review.html`,'utf8')).replace('<!-- ASSETS -->',`<script type="application/json" id="candidate-assets">${JSON.stringify(assets)}</script><script type="importmap">${JSON.stringify({imports})}</script>`).replace('<script type="module" src="./src/candidate-review.js"></script>',`<script>document.getElementById('overlay').src='data:image/png;base64,${assets['F002-Contract-Overlay.png']}';</script><script type="module">import 'pocketquest/candidate-review.js';</script>`);
await mkdir(`${root}/dist`,{recursive:true});await writeFile(`${root}/dist/PocketQuest-Sunlit-Candidate-Review.html`,html);console.log('Built diagnostic review: invalid candidates are not installed in the game registry');
