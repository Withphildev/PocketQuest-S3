import {validateAsset} from './validation.js';
import {loadCharacters} from './characters.js';
import {MASTER, HALVES, splitMaster, inspectRoadMask} from './sunlit.js';
export async function inspectImage(blob) {
  const image = await createImageBitmap(blob), canvas = document.createElement('canvas');
  if (image.width > 512 || image.height > 512) { image.close(); throw new Error('Image exceeds 512×512 asset limit'); }
  canvas.width = image.width; canvas.height = image.height;
  const context = canvas.getContext('2d', {willReadFrequently: true}); context.drawImage(image, 0, 0);
  const pixels = context.getImageData(0, 0, image.width, image.height).data;
  return {image, width: image.width, height: image.height, pixels,
    transparent: pixels.some((n, i) => i % 4 === 3 && n === 0),
    hasVisiblePixels: pixels.some((n, i) => i % 4 === 3 && n > 0), bytes: blob.size};
}
export async function loadTemplates(read, manifest) {
  if (manifest?.schemaVersion !== 1 || !/^[A-Za-z0-9_-]+$/.test(manifest.id || '')) throw new Error('Invalid templates.json version/id');
  const result = {id: manifest.id, edges: {}, corners: {}};
  const image = async (name, width, height) => {
    if (!/^[A-Za-z0-9_-]+\.png$/.test(name || '')) throw new Error('Template image requires a flat PNG filename');
    const info = await inspectImage(await read(name));
    if (info.width !== width || info.height !== height || info.pixels.some((n, i) => i % 4 === 3 && n !== 255)) {
      info.image.close(); throw new Error(`Template ${name} must be opaque ${width}×${height}`);
    }
    return info;
  };
  for (const socket of ['meadow-open-v1', 'meadow-road-v1']) {
    result.edges[socket] = {};
    for (const direction of ['north', 'east', 'south', 'west']) result.edges[socket][direction] =
      await image(manifest.edges?.[socket]?.[direction], ['north', 'south'].includes(direction) ? 512 : 32, ['north', 'south'].includes(direction) ? 18 : 288);
  }
  result.corners['meadow-corner-v1'] = {};
  for (const direction of ['nw', 'ne', 'se', 'sw']) result.corners['meadow-corner-v1'][direction] = await image(manifest.corners?.['meadow-corner-v1']?.[direction], 32, 18);
  return result;
}
async function loadRegistry(read, names, templates = null) {
  const registry = new Map(), images = new Map(), issues = [];
  for (const name of names) {
    let asset;
    try {
      const manifest = JSON.parse(await (await read(name)).text());
      const preliminary = validateAsset({manifest, navigation: {}}).filter(i => i.category !== 'navigation');
      if (preliminary.length) { issues.push(...preliminary); continue; }
      const navigation = JSON.parse(await (await read(manifest.navigation.source)).text());
      const groundInfo = await inspectImage(await read(manifest.ground));
      const objectImages = new Map();
      for (const object of manifest.objects) {
        if (!images.has(object.asset)) images.set(object.asset, await inspectImage(await read(object.asset)));
        objectImages.set(object.asset, images.get(object.asset));
      }
      asset = {manifest, navigation, groundInfo, objectImages, templates};
      const errors = validateAsset(asset);
      if (registry.has(manifest.id)) errors.push({asset: manifest.id, category: 'identity', message: 'Duplicate asset ID'});
      if (errors.length) issues.push(...errors); else registry.set(manifest.id, asset);
    } catch (error) { issues.push({asset: name, category: 'load', message: error.message}); }
  }
  return {registry, images, issues};
}
export async function loadBuiltins({engineering = false} = {}) {
  const embedded = document.getElementById('embedded-assets');
  const embeddedFiles = embedded ? JSON.parse(embedded.textContent) : null;
  const read = async name => {
    if (!/^[A-Za-z0-9_-]+\.(json|png)$/.test(name)) throw new Error('Invalid asset path');
    if (embeddedFiles) {
      if (!embeddedFiles[name]) throw new Error(`Missing embedded ${name}`);
      return new Blob([Uint8Array.from(atob(embeddedFiles[name]), c => c.charCodeAt(0))],
        {type: name.endsWith('.png') ? 'image/png' : 'application/json'});
    }
    const response = await fetch(`./assets/${name}`);
    if (!response.ok) throw new Error(`Missing ${name}`);
    return response.blob();
  };
  const catalog = JSON.parse(await (await read('catalog.json')).text()).filter(name => !engineering || !name.startsWith('F002-Sunlit-Forest-'));
  const templates = catalog.includes('F002-Sunlit-Forest-Left.json') ? await loadTemplates(read, JSON.parse(await (await read('templates.json')).text())) : null;
  const result = await loadRegistry(read, catalog.filter(name => !name.startsWith('F002-Sunlit-Forest-')), null);
  if (templates) {
    const candidate = await loadRegistry(read, catalog.filter(name => name.startsWith('F002-Sunlit-Forest-')), templates);
    for (const [id, asset] of candidate.registry) result.registry.set(id, asset);
    result.issues.push(...candidate.issues);
  }
  if (templates) {
    await inspectRoadMask(await read('F002-Sunlit-Forest-RoadMask.png'));
    result.artStatus = 'Illustrated pipeline candidate · NOT production-approved';
  }
  if (embeddedFiles?.['nova.json'] && !engineering) result.characters = await loadCharacters(read, JSON.parse(await (await read('nova.json')).text()), inspectImage);
  return result;
}
export async function loadFiles(files) {
  const map = new Map();
  for (const file of files) {
    if (map.has(file.name)) throw new Error(`Duplicate filename ${file.name}; select a flat asset set`);
    if (file.size > 8 * 1024 * 1024) throw new Error(`${file.name}: file too large`);
    map.set(file.name, file);
  }
  const names = [];
  let generated = new Map();
  if (map.has(MASTER)) {
    if (HALVES.some(name => map.has(name))) throw new Error('Select master OR split halves, not both');
    generated = await splitMaster(map.get(MASTER));
    for (const [name, blob] of generated) map.set(name, blob);
  }
  const sunlit = HALVES.some(name => map.has(name));
  if (sunlit) {
    if (!map.has('templates.json') || !map.has('F002-Sunlit-Forest-RoadMask.png')) throw new Error('Sunlit requires templates.json and F002-Sunlit-Forest-RoadMask.png');
    await inspectRoadMask(map.get('F002-Sunlit-Forest-RoadMask.png'));
  }
  for (const [name, file] of map) if (name.endsWith('.json') && name !== 'catalog.json') {
    try { const data = JSON.parse(await file.text()); if ('family' in data || 'roadMask' in data) names.push(name); }
    catch { throw new Error(`Invalid JSON in ${name}`); }
  }
  if (!names.length) throw new Error('Select manifests, navigation JSON, and their PNGs together.');
  const read = async name => { if (!map.has(name)) throw new Error(`Missing ${name}`); return map.get(name); };
  const templates = map.has('templates.json') ? await loadTemplates(read, JSON.parse(await map.get('templates.json').text())) : null;
  const result = await loadRegistry(read, names, templates);
  if (sunlit && (result.registry.size !== 2 || HALVES.some(name => ![...result.registry.values()].some(a => a.manifest.ground === name && a.manifest.family === 'F002' && a.manifest.roadMask === 10)))) {
    result.issues.push({category:'sunlit', message:'Sunlit requires exactly two distinct F002 mask-10 manifests referencing Left and Right PNGs'});
  }
  result.generated = generated;
  result.characters = map.has('nova.json') ? await loadCharacters(read, JSON.parse(await map.get('nova.json').text()), inspectImage) : null;
  const engineering = map.has('art-status.json') && JSON.parse(await map.get('art-status.json').text()).status === 'engineering-fixture';
  result.artStatus = sunlit && !engineering ? 'Imported Sunlit candidate · visual approval pending' : 'Engineering fixtures · NOT illustrated Sunlit artwork';
  return result;
}
