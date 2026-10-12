// Original code-drawn PNG placeholders, not generated/production artwork.
import {mkdirSync, writeFileSync} from 'node:fs';
import {deflateSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
import {canonicalPixel} from '../src/validation.js';
import {DIRECTIONS} from '../src/world.js';
const output = fileURLToPath(new URL('../assets/', import.meta.url));
mkdirSync(output, {recursive: true});
function crc(bytes) {
  let n = 0xffffffff;
  for (const b of bytes) { n ^= b; for (let i = 0; i < 8; i++) n = (n >>> 1) ^ (n & 1 ? 0xedb88320 : 0); }
  return (n ^ 0xffffffff) >>> 0;
}
function chunk(name, data) {
  const type = Buffer.from(name), length = Buffer.alloc(4), checksum = Buffer.alloc(4);
  length.writeUInt32BE(data.length); checksum.writeUInt32BE(crc(Buffer.concat([type, data])));
  return Buffer.concat([length, type, data, checksum]);
}
function png(name, width, height, pixel) {
  const header = Buffer.alloc(13); header.writeUInt32BE(width); header.writeUInt32BE(height, 4);
  header[8] = 8; header[9] = 6;
  const data = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) data.set(pixel(x, y), y * (width * 4 + 1) + 1 + x * 4);
  writeFileSync(`${output}/${name}`, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header), chunk('IDAT', deflateSync(data)), chunk('IEND', Buffer.alloc(0))]));
}
const variants = [['F001-clearing', 'F001', 0], ['F002-north-south', 'F002', 5],
  ['F002-east-west', 'F002', 10], ['F003-pond', 'F003', 0], ['F004-crossroads', 'F004', 15]];
const objects = [
  {id: 'tree', asset: 'tree.png', anchor: [128, 160], pivot: [48, 100], collision: [[114, 146], [142, 146], [142, 174], [114, 174]], renderBounds: [-48, -100, 96, 112], depthRule: 'ground-anchor'},
  {id: 'cabin', asset: 'cabin.png', anchor: [392, 392], pivot: [64, 108], collision: [[342, 344], [438, 344], [438, 392], [342, 392]], renderBounds: [-64, -108, 128, 120], depthRule: 'ground-anchor'},
  {id: 'rock', asset: 'rock.png', anchor: [390, 140], pivot: [24, 25], collision: [[372, 126], [406, 126], [408, 144], [374, 152]], renderBounds: [-24, -25, 48, 32], depthRule: 'ground-anchor'},
  {id: 'fence', asset: 'fence.png', anchor: [112, 380], pivot: [40, 26], collision: [[74, 374], [150, 374], [150, 382], [74, 382]], renderBounds: [-40, -26, 80, 32], depthRule: 'ground-anchor'}
];
for (const [id, family, roadMask] of variants) {
  const cells = Array.from({length: 32}, () => Array(32).fill(1));
  if (family === 'F003') for (let y = 11; y <= 20; y++) for (let x = 10; x <= 21; x++)
    if (((x + .5) * 16 - 256) ** 2 / 96 ** 2 + ((y + .5) * 16 - 256) ** 2 / 80 ** 2 < 1) cells[y][x] = 2;
  png(`${id}.png`, 512, 288, (x, y) => {
    if (family === 'F003' && cells[Math.floor(y * 16 / 9 / 16)]?.[Math.floor(x / 16)] === 2) return [64, 119, 147, 255];
    const edge = x < 32 || x >= 480 || y < 18 || y >= 270;
    if (!edge && !(roadMask & 5 && x >= 224 && x < 288) && !(roadMask & 10 && y >= 126 && y < 162) &&
        (x * 17 + y * 31) % 89 === 0) return [99, 132, 83, 255];
    return canonicalPixel(roadMask, x, y);
  });
  const manifest = {schemaVersion: 1, id, family, biome: 'forest', worldSize: [512, 512], groundPixels: [512, 288],
    projection: {xScale: 1, yNumerator: 9, yDenominator: 16}, ground: `${id}.png`, roadMask,
    edges: Object.fromEntries(Object.entries(DIRECTIONS).map(([name, bit]) => [name, roadMask & bit ? 'meadow-road-v1' : 'meadow-open-v1'])),
    corners: Array(4).fill('meadow-corner-v1'), navigation: {cellWorldSize: 16, width: 32, height: 32, source: `${id}-nav.json`},
    objects, spawnAnchors: [{id: 'arrival', u: 256, v: 440}], buildPads: [], assetVersion: 1};
  writeFileSync(`${output}/${id}.json`, JSON.stringify(manifest, null, 2) + '\n');
  writeFileSync(`${output}/${id}-nav.json`, JSON.stringify({schemaVersion: 1, cellWorldSize: 16, cells}) + '\n');
}
png('tree.png', 96, 112, (x, y) => {
  if (x >= 42 && x < 54 && y > 52 && y < 104) return [110, 75, 49, 255];
  const d = ((x - 48) / 43) ** 2 + ((y - 40) / 37) ** 2;
  return d < 1 ? (x < 45 ? [38, 75, 56, 255] : [49, 91, 61, 255]) : [0, 0, 0, 0];
});
png('cabin.png', 128, 120, (x, y) => {
  if (y >= 49 && y <= 108 && x >= 12 && x < 116) {
    if (x > 51 && x < 76 && y > 75) return [47, 52, 49, 255];
    if (y > 63 && y < 80 && ((x > 22 && x < 40) || (x > 88 && x < 105))) return [226, 180, 97, 255];
    return [135, 103, 67, 255];
  }
  if (y >= 10 && y < 57 && Math.abs(x - 64) < (y - 10) * 1.5) return [59, 78, 71, 255];
  return [0, 0, 0, 0];
});
png('rock.png', 48, 32, (x, y) => ((x - 24) / 21) ** 2 + ((y - 18) / 12) ** 2 < 1 ? [133, 144, 133, 255] : [0, 0, 0, 0]);
png('fence.png', 80, 32, (x, y) => y < 28 && ((x % 24 < 5) || (y >= 10 && y < 15) || (y >= 21 && y < 25)) ? [166, 134, 84, 255] : [0, 0, 0, 0]);
writeFileSync(`${output}/catalog.json`, JSON.stringify(variants.map(([id]) => `${id}.json`), null, 2) + '\n');
console.log('Generated 5 ground configurations, 4 foreground PNGs, manifests, and independent nav sources.');
