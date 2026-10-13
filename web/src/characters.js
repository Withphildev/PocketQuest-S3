export function validateCharacterManifest(m) {
  if (m?.schemaVersion !== 1 || JSON.stringify(m.frameSize) !== '[32,48]' || JSON.stringify(m.pivot) !== '[16,44]') throw new Error('Nova requires schemaVersion 1, frameSize [32,48], pivot [16,44]; no distortion');
  for (const sex of ['female', 'male']) for (const direction of ['north', 'east', 'south', 'west']) {
    const frames = m.protagonists?.[sex]?.[direction];
    const names = Array.isArray(frames) ? frames : [frames];
    if ((Array.isArray(frames) && frames.length !== 4) || names.some(name => typeof name !== 'string' || !/^[A-Za-z0-9_-]+\.png$/.test(name))) throw new Error(`Missing Nova ${sex}/${direction}: flat PNG filename or four walking frames required`);
  }
  for (const [sex, directions] of Object.entries(m.idle || {})) {
    if (!['female', 'male'].includes(sex)) throw new Error('Unknown idle protagonist');
    for (const direction of ['north', 'east', 'south', 'west']) {
      const names = directions[direction];
      if (!Array.isArray(names) || names.length !== 4 || names.some(name => typeof name !== 'string' || !/^[A-Za-z0-9_-]+\.png$/.test(name))) throw new Error(`Nova idle ${sex}/${direction} requires four flat PNG filenames`);
    }
  }
  return m;
}
export function validateCharacterImage(info) {
  if (info.width !== 32 || info.height !== 48 || !info.transparent || !info.hasVisiblePixels) throw new Error('Nova frames must be visible transparent 32×48 PNGs; no resizing');
}
export async function loadCharacters(read, manifest, inspect) {
  validateCharacterManifest(manifest); const result = {female: {}, male: {}}, cache = new Map();
  for (const sex of ['female', 'male']) for (const direction of ['north', 'east', 'south', 'west']) {
    const entry = manifest.protagonists[sex][direction], names = Array.isArray(entry) ? entry : [entry];
    const frames = [];
    for (const name of names) {
      if (!cache.has(name)) { const info = await inspect(await read(name)); validateCharacterImage(info); cache.set(name, info); }
      frames.push(cache.get(name));
    }
    result[sex][direction] = Array.isArray(entry) ? frames : frames[0];
  }
  result.idle = {};
  for (const [sex, directions] of Object.entries(manifest.idle || {})) {
    result.idle[sex] = {};
    for (const [direction, names] of Object.entries(directions)) {
      result.idle[sex][direction] = [];
      for (const name of names) {
        if (!cache.has(name)) { const info = await inspect(await read(name)); validateCharacterImage(info); cache.set(name, info); }
        result.idle[sex][direction].push(cache.get(name));
      }
    }
  }
  return result;
}
export function characterFrame(characters, player, time) {
  const idle = characters?.idle?.[player.protagonist]?.[player.direction];
  if (!player.walking && idle) return idle[Math.floor(time / 350) % idle.length];
  const entry = characters?.[player.protagonist]?.[player.direction];
  return Array.isArray(entry) ? entry[player.walking ? Math.floor(time / 140) % entry.length : 1] : entry;
}
