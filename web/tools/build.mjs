import {mkdir, cp, readdir, readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
await mkdir(`${root}/dist`, {recursive: true});
for (const name of ['index.html', 'style.css', 'src', 'assets']) await cp(`${root}/${name}`, `${root}/dist/${name}`, {recursive: true});
const imports = {}, assets = {};
for (const name of await readdir(`${root}/src`)) if (name.endsWith('.js')) {
  const source = (await readFile(`${root}/src/${name}`, 'utf8')).replace(/from ['"]\.\/([^'"]+)['"]/g, "from 'pocketquest/$1'");
  imports[`pocketquest/${name}`] = 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
}
for (const name of await readdir(`${root}/assets`)) assets[name] = (await readFile(`${root}/assets/${name}`)).toString('base64');
const html = (await readFile(`${root}/index.html`, 'utf8'))
  .replace('<link rel="stylesheet" href="./style.css">', `<style>${await readFile(`${root}/style.css`, 'utf8')}</style>`)
  .replace('<script type="module" src="./src/app.js"></script>',
    `<script type="application/json" id="embedded-assets">${JSON.stringify(assets)}</script>\n<script type="importmap">${JSON.stringify({imports})}</script>\n<script type="module">import 'pocketquest/app.js';</script>`);
await writeFile(`${root}/dist/PocketQuest-S3-Phase2A.html`, html);
await writeFile(`${root}/dist/PocketQuest-S3-Phase2A.1.html`, html);
await writeFile(`${root}/dist/PocketQuest-S3-Phase2A.2.html`, html);
console.log(`Static build complete: web/dist (${(await readdir(`${root}/assets`)).length} placeholder asset files).`);
console.log('Offline single-file prototype: web/dist/PocketQuest-S3-Phase2A.html');
