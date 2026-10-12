// Crop existing engineering placeholders into exact authoring references; no new artwork.
import {mkdirSync, readFileSync, writeFileSync, copyFileSync} from 'node:fs';
import {inflateSync, deflateSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url)), out = `${root}/build/calibration-kit`;
mkdirSync(out, {recursive: true});
function crc(b) { let n = 0xffffffff; for (const v of b) { n ^= v; for (let i = 0; i < 8; i++) n = (n >>> 1) ^ (n & 1 ? 0xedb88320 : 0); } return (n ^ 0xffffffff) >>> 0; }
function chunk(type, b) { const t = Buffer.from(type), h = Buffer.alloc(4), c = Buffer.alloc(4); h.writeUInt32BE(b.length); c.writeUInt32BE(crc(Buffer.concat([t, b]))); return Buffer.concat([h, t, b, c]); }
function pixels(name) {
  const b = readFileSync(`${root}/assets/${name}`), width = b.readUInt32BE(16), height = b.readUInt32BE(20), parts = [];
  for (let p = 8; p < b.length;) { const n = b.readUInt32BE(p); if (b.toString('ascii', p + 4, p + 8) === 'IDAT') parts.push(b.subarray(p + 8, p + 8 + n)); p += n + 12; }
  const scan = inflateSync(Buffer.concat(parts)), data = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) { if (scan[y * (width * 4 + 1)] !== 0) throw new Error('Kit exporter only supports bundled filter-0 placeholders, not arbitrary art'); scan.copy(data, y * width * 4, y * (width * 4 + 1) + 1, (y + 1) * (width * 4 + 1)); }
  return {width, data};
}
function crop(source, name, x, y, w, h) {
  const header = Buffer.alloc(13); header.writeUInt32BE(w); header.writeUInt32BE(h, 4); header[8] = 8; header[9] = 6;
  const rows = Buffer.alloc(h * (w * 4 + 1));
  for (let row = 0; row < h; row++) source.data.copy(rows, row * (w * 4 + 1) + 1, ((y + row) * source.width + x) * 4, ((y + row) * source.width + x + w) * 4);
  writeFileSync(`${out}/${name}`, Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', header), chunk('IDAT', deflateSync(rows)), chunk('IEND', Buffer.alloc(0))]));
}
const open = pixels('F001-clearing.png'), vertical = pixels('F002-north-south.png'), horizontal = pixels('F002-east-west.png');
const templates = {schemaVersion: 1, id: 'placeholder-reference-v1', edges: {}, corners: {'meadow-corner-v1': {}}};
const rects = {north: [0,0,512,18], east: [480,0,32,288], south: [0,270,512,18], west: [0,0,32,288]};
for (const socket of ['meadow-open-v1', 'meadow-road-v1']) {
  templates.edges[socket] = {};
  for (const [direction, rect] of Object.entries(rects)) {
    const name = `${socket}-${direction}.png`, source = socket === 'meadow-open-v1' ? open : ['north','south'].includes(direction) ? vertical : horizontal;
    crop(source, name, ...rect); templates.edges[socket][direction] = name;
  }
}
for (const [direction, x, y] of [['nw',0,0],['ne',480,0],['se',480,270],['sw',0,270]]) {
  const name = `corner-${direction}.png`; crop(open, name, x, y, 32, 18); templates.corners['meadow-corner-v1'][direction] = name;
}
writeFileSync(`${out}/templates.json`, JSON.stringify(templates, null, 2) + '\n');
for (const side of ['left', 'right']) {
  const m = JSON.parse(readFileSync(`${root}/assets/F002-east-west.json`)); m.id = `F002-reference-${side}`;
  m.ground = `${m.id}.png`; m.navigation.source = `${m.id}-nav.json`;
  copyFileSync(`${root}/assets/F002-east-west.png`, `${out}/${m.ground}`);
  copyFileSync(`${root}/assets/F002-east-west-nav.json`, `${out}/${m.navigation.source}`);
  writeFileSync(`${out}/${m.id}.json`, JSON.stringify(m, null, 2) + '\n');
}
for (const name of ['tree.png', 'cabin.png', 'rock.png', 'fence.png']) copyFileSync(`${root}/assets/${name}`, `${out}/${name}`);
console.log(`Calibration reference kit: ${out}`);
