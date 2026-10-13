import {mkdir, cp, readdir, readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const candidate = process.argv.includes('--artwork');
const groundValidation = process.argv.includes('--ground-validation');
const nova = process.argv.includes('--nova');
const novaV2 = process.argv.includes('--nova-v2');
const assetRoot = groundValidation ? `${root}/build/validated-ground` : candidate ? `${root}/build/artwork` : `${root}/assets`;
await mkdir(`${root}/dist`, {recursive: true});
for (const name of ['index.html', 'style.css', 'src', 'assets']) await cp(`${root}/${name}`, `${root}/dist/${name}`, {recursive: true});
const imports = {}, assets = {};
for (const name of await readdir(`${root}/src`)) if (name.endsWith('.js')) {
  const source = (await readFile(`${root}/src/${name}`, 'utf8')).replace(/from ['"]\.\/([^'"]+)['"]/g, "from 'pocketquest/$1'");
  imports[`pocketquest/${name}`] = 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
}
for (const name of await readdir(assetRoot)) if (/\.(png|json)$/.test(name)) assets[name] = (await readFile(`${assetRoot}/${name}`)).toString('base64');
if (nova) for (const name of await readdir(`${root}/build/nova`)) if (/\.(png|json)$/.test(name)) assets[name] = (await readFile(`${root}/build/nova/${name}`)).toString('base64');
if (novaV2) for (const name of await readdir(`${root}/build/nova-female-v2`)) if (/\.(png|json)$/.test(name)) assets[name] = (await readFile(`${root}/build/nova-female-v2/${name}`)).toString('base64');
if (candidate || groundValidation) {
  // Keep seeded-world defaults available without replacing their generator IDs.
  const builtins = JSON.parse(await readFile(`${root}/assets/catalog.json`, 'utf8'));
  for (const name of await readdir(`${root}/assets`)) if (!(name in assets)) assets[name] = (await readFile(`${root}/assets/${name}`)).toString('base64');
  assets['catalog.json'] = Buffer.from(JSON.stringify([...builtins,'F002-Sunlit-Forest-Left.json','F002-Sunlit-Forest-Right.json'])).toString('base64');
}
let html = (await readFile(`${root}/index.html`, 'utf8'))
  .replace('<link rel="stylesheet" href="./style.css">', `<style>${await readFile(`${root}/style.css`, 'utf8')}</style>`)
  .replace('<script type="module" src="./src/app.js"></script>',
    `<script type="application/json" id="embedded-assets">${JSON.stringify(assets)}</script>\n<script type="importmap">${JSON.stringify({imports})}</script>\n<script type="module">import 'pocketquest/app.js';</script>`);
if (groundValidation) html = html.replace('<option value="1">1×</option><option value="1.5" selected>1.5×</option>', '<option value="1" selected>1×</option><option value="1.5">1.5×</option>').replace('PHASE 2A.3 · ARTWORK PIPELINE','SUNLIT GROUND · VALIDATION REVIEW');
await writeFile(`${root}/dist/PocketQuest-S3-Phase2A.html`, html);
await writeFile(`${root}/dist/PocketQuest-S3-Phase2A.1.html`, html);
await writeFile(`${root}/dist/PocketQuest-S3-Phase2A.2.html`, html);
if (candidate) await writeFile(`${root}/dist/PocketQuest-S3-Phase2A.3.html`, html);
if (groundValidation) await writeFile(`${root}/dist/PocketQuest-Sunlit-Validated-Ground.html`, html);
if (nova) await writeFile(`${root}/dist/PocketQuest-Nova-Sprite-Review.html`, html);
if (novaV2) await writeFile(`${root}/dist/PocketQuest-Female-Nova-v2-Review.html`, html);
console.log(`Static build complete: web/dist (${(await readdir(`${root}/assets`)).length} placeholder asset files).`);
console.log('Offline single-file prototype: web/dist/PocketQuest-S3-Phase2A.html');
