import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
import {World, chooseBlock, blockAt, parseSeed, project} from '../src/world.js';
import {canStand, movePlayer, circlePolygon} from '../src/navigation.js';
import {depthOrder, visibleBlocks, screenPosition} from '../src/scene.js';
import {validateAsset, validatePair, validateLayout} from '../src/validation.js';
const read = name => readFileSync(new URL(`../assets/${name}`, import.meta.url));
const json = name => JSON.parse(read(name));
function decode(name) {
  const b = read(name), width = b.readUInt32BE(16), height = b.readUInt32BE(20), parts = [];
  for (let offset = 8; offset < b.length;) {
    const length = b.readUInt32BE(offset), type = b.toString('ascii', offset + 4, offset + 8);
    if (type === 'IDAT') parts.push(b.subarray(offset + 8, offset + 8 + length));
    offset += length + 12;
  }
  const scan = inflateSync(Buffer.concat(parts)), pixels = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    assert.equal(scan[y * (width * 4 + 1)], 0, 'Placeholder decoder expects PNG filter 0');
    pixels.set(scan.subarray(y * (width * 4 + 1) + 1, (y + 1) * (width * 4 + 1)), y * width * 4);
  }
  return {width, height, pixels, transparent: pixels.some((n, i) => i % 4 === 3 && n < 255)};
}
const registry = new Map(json('catalog.json').map(name => {
  const manifest = json(name), asset = {manifest, navigation: json(manifest.navigation.source), groundInfo: decode(manifest.ground),
    objectImages: new Map(manifest.objects.map(o => [o.asset, decode(o.asset)]))};
  return [manifest.id, asset];
}));
const world = new World(323, registry);
test('all five actual PNG/nav/object configurations meet the asset contract', () => {
  for (const asset of registry.values()) assert.deepEqual(validateAsset(asset), []);
});
test('fixed seed/coordinate golden vectors, including signed coordinates', () => {
  const fixtures = [[323, 0, 0, 15, 'F004-crossroads'], [323, 1, 1, 0, 'F001-clearing'],
    [323, -3, 2, 0, 'F003-pond'], [0, -1, -1, 10, 'F002-east-west'], [4294967295, 17, -9, 10, 'F002-east-west']];
  for (const [seed, x, y, mask, id] of fixtures) { const b = chooseBlock(seed, x, y); assert.equal(b.roadMask, mask); assert.equal(b.assetId, id); }
  assert.equal(chooseBlock(323, 0, 0).reservedOakwood, true);
});
test('generation is order-independent and exact connectors match across 1,600 neighbors', () => {
  for (const seed of [0, 1, 323, 4294967295]) {
    const w = new World(seed, registry), first = new Map();
    for (let y = -10; y < 10; y++) for (let x = -10; x < 10; x++) {
      first.set(`${x},${y}`, chooseBlock(seed, x, y));
      const b = w.block(x, y);
      assert.deepEqual(validatePair(b.asset.manifest, w.block(x + 1, y).asset.manifest, 'east'), []);
      assert.deepEqual(validatePair(b.asset.manifest, w.block(x, y + 1).asset.manifest, 'south'), []);
    }
    for (let y = 9; y >= -10; y--) for (let x = 9; x >= -10; x--) assert.deepEqual(chooseBlock(seed, x, y), first.get(`${x},${y}`));
  }
});
test('floor division handles negative edges; projection and seed validation are explicit', () => {
  assert.deepEqual(blockAt(-.1, -512.1), {x: -1, y: -2});
  assert.deepEqual(blockAt(512, 512), {x: 1, y: 1}); assert.deepEqual(project(512, 512), {x: 512, y: 288});
  for (const bad of ['-1', '1.5', '4294967296', 'abc', '01']) assert.throws(() => parseSeed(bad));
  assert.equal(parseSeed('4294967295'), 4294967295);
  assert.throws(() => new World(323, new Map()).block(0, 0), /no fallback/);
});
test('continuous movement crosses east/west and north/south boundaries, including negatives', () => {
  for (const [u, v, dx, dy] of [[500, 440, 40, 0], [-2, 440, 20, 0], [256, 500, 0, 40], [256, -2, 0, 20]]) {
    const p = {u, v}; movePlayer(world, p, dx, dy);
    assert.ok(Math.abs(p.u - u - dx) < .00001); assert.ok(Math.abs(p.v - v - dy) < .00001);
  }
});
test('water collision is driven by navigation, not painted pixels', () => {
  const asset = registry.get('F003-pond'), pondWorld = {block: () => ({asset})};
  assert.equal(canStand(pondWorld, 256, 256), false);
  const p = {u: 256, v: 150}; movePlayer(pondWorld, p, 0, 220);
  assert.ok(p.v < 180, 'long frame sweep cannot tunnel through water');
  const modified = structuredClone(asset); modified.navigation.cells.forEach(row => row.fill(1));
  assert.equal(canStand({block: () => ({asset: modified})}, 256, 256), true);
});
test('foreground polygons obstruct movement; diagonal corner cells respect player radius', () => {
  assert.equal(canStand(world, 128, 160), false);
  assert.equal(canStand(world, 100, 160), true);
  assert.equal(circlePolygon(128, 160, 6, [[114, 146], [142, 146], [142, 174], [114, 174]]), true);
  const plain = {manifest: {objects: []}, navigation: {cells: Array.from({length: 32}, () => Array(32).fill(1))}};
  const blocked = structuredClone(plain); blocked.navigation.cells[0][0] = 0;
  const w = {block: (x, y) => ({asset: x === 1 && y === 1 ? blocked : plain})};
  assert.equal(canStand(w, 510, 510), false); assert.equal(canStand(w, 500, 500), true);
  assert.throws(() => movePlayer(world, {u: 0, v: 0}, NaN, 1));
});
test('tree depth switches correctly on both sides of its ground anchor', () => {
  const blocks = [world.block(0, 0)];
  const before = depthOrder(blocks, {u: 100, v: 130}).map(o => o.id);
  const after = depthOrder(blocks, {u: 100, v: 180}).map(o => o.id);
  assert.ok(before.indexOf('nova') < before.indexOf('0,0/tree'));
  assert.ok(after.indexOf('nova') > after.indexOf('0,0/tree'));
});
test('camera follows continuously across block boundaries with overhang-aware neighborhood', () => {
  for (const u of [511.9, 512, 512.1, -512]) {
    const p = {u, v: 600}, camera = project(p.u, p.v);
    assert.deepEqual(screenPosition(p.u, p.v, camera, 900, 560, 1.5), {x: 450, y: 280});
    const blocks = visibleBlocks(p, 900, 560, 1.5);
    assert.ok(blocks.some(b => b.x === Math.floor(u / 512) && b.y === 1));
    assert.ok(blocks.length < 100);
  }
});
test('unsupported masks, missing metadata, malformed records, blocked collars, and incorrect corners fail clearly', () => {
  const original = registry.get('F001-clearing');
  for (const mutation of [a => a.manifest.roadMask = 3, a => a.manifest.corners[0] = 'wrong',
    a => a.manifest.corners = 'abcd', a => a.manifest.objects[0].collision = 'invalid',
    a => a.manifest.objects.push(null), a => a.navigation.cells[0][0] = 0,
    a => a.navigation.cells[2][2] = 7, a => a.manifest.ground = '../private.png',
    a => a.manifest.objects[0].depthRule = 'split-front-back', a => a.groundInfo.width = 511]) {
    const a = structuredClone(original); mutation(a); assert.ok(validateAsset(a).length > 0);
  }
});
test('corrupt protected pixels and missing/opaque foreground images fail; compatible 2×2 corners pass', () => {
  const original = registry.get('F001-clearing');
  const a = structuredClone(original); a.groundInfo.pixels[0] ^= 1;
  assert.ok(validateAsset(a).some(i => i.category === 'seam-pixels'));
  const b = structuredClone(original); b.objectImages.delete('tree.png');
  assert.ok(validateAsset(b).some(i => i.category === 'image'));
  const c = structuredClone(original); c.objectImages.get('tree.png').transparent = false;
  assert.ok(validateAsset(c).some(i => i.category === 'image'));
  const invisible = structuredClone(original); invisible.objectImages.get('tree.png').hasVisiblePixels = false;
  assert.ok(validateAsset(invisible).some(i => i.message.includes('invisible')));
  const layout = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([x, y]) => world.block(x, y));
  assert.deepEqual(validateLayout(layout), []);
  layout[1].asset = original; assert.ok(validateLayout(layout).some(i => i.category === 'seam'));
});
test('blocked spawns and disconnected exits fail reachability validation', () => {
  const a = structuredClone(registry.get('F001-clearing'));
  a.manifest.spawnAnchors[0] = {id: 'inside-tree', u: 128, v: 160};
  assert.ok(validateAsset(a).some(i => i.category === 'spawn'));
  const b = structuredClone(registry.get('F001-clearing'));
  for (let y = 0; y < 32; y++) b.navigation.cells[y][16] = 0;
  assert.ok(validateAsset(b).some(i => i.category === 'connectivity'));
});
