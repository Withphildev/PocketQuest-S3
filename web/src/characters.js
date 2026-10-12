export function validateCharacterManifest(m) {
  if (m?.schemaVersion !== 1 || JSON.stringify(m.frameSize) !== '[32,48]' || JSON.stringify(m.pivot) !== '[16,44]') throw new Error('Nova requires schemaVersion 1, frameSize [32,48], pivot [16,44]; no distortion');
  for (const sex of ['female', 'male']) for (const direction of ['north', 'east', 'south', 'west']) {
    if (!/^[A-Za-z0-9_-]+\.png$/.test(m.protagonists?.[sex]?.[direction] || '')) throw new Error(`Missing Nova ${sex}/${direction} flat PNG filename`);
  }
  return m;
}
export function validateCharacterImage(info) {
  if (info.width !== 32 || info.height !== 48 || !info.transparent || !info.hasVisiblePixels) throw new Error('Nova frames must be visible transparent 32×48 PNGs; no resizing');
}
export async function loadCharacters(read, manifest, inspect) {
  validateCharacterManifest(manifest); const result = {female: {}, male: {}}, cache = new Map();
  for (const sex of ['female', 'male']) for (const direction of ['north', 'east', 'south', 'west']) {
    const name = manifest.protagonists[sex][direction];
    if (!cache.has(name)) { const info = await inspect(await read(name)); validateCharacterImage(info); cache.set(name, info); }
    result[sex][direction] = cache.get(name);
  }
  return result;
}
