import test from 'node:test';
import assert from 'node:assert/strict';
import {characterScale, calibrationBlocks, calibrationView, templatePixel} from '../src/calibration.js';
import {Renderer} from '../src/renderer.js';
import {depthOrder} from '../src/scene.js';
import {canStand} from '../src/navigation.js';
import {validateAsset, validateLayout} from '../src/validation.js';
import {readFileSync} from 'node:fs';
const manifest = JSON.parse(readFileSync(new URL('../assets/F002-east-west.json', import.meta.url)));
const asset = {manifest, navigation: {schemaVersion: 1, cellWorldSize: 16, cells: Array.from({length: 32}, () => Array(32).fill(1))}};
const registry = new Map([[manifest.id, asset]]);
test('two-block path is exactly 1024×512 world / 1024×288 ground with valid connectors', () => {
  const blocks = calibrationBlocks([{value: manifest.id}, {value: manifest.id}, {value: 'unused'}], registry);
  assert.equal(blocks.length, 2); assert.deepEqual(blocks.map(b => [b.x, b.y, b.roadMask]), [[0, 0, 10], [1, 0, 10]]);
  assert.deepEqual(validateLayout(blocks), []); assert.throws(() => calibrationBlocks([{value: 'missing'}], registry));
});
test('visual scale never changes feet collision or depth order', () => {
  const world = {block: () => ({asset})}, blocks = [{x: 0, y: 0, asset}];
  for (const scale of [.5, .75, 1, 1.25, 1.5, 2]) {
    assert.equal(characterScale(scale), scale);
    assert.equal(canStand(world, 128, 160), false); assert.equal(canStand(world, 100, 125), true);
    assert.ok(depthOrder(blocks, {u: 100, v: 125, scale}).findIndex(o => o.id === 'nova') < depthOrder(blocks, {u: 100, v: 125, scale}).findIndex(o => o.id === '0,0/tree'));
  }
  for (const bad of [0, .4, 3, NaN, Infinity]) assert.throws(() => characterScale(bad));
});
test('tree/building checkpoints are safe and flip anchored foreground order', () => {
  const world = {block: () => ({asset})}, blocks = [{x: 0, y: 0, asset}];
  for (const [u, before, after, id] of [[100, 125, 191, 'tree'], [360, 330, 410, 'cabin']]) {
    for (const v of [before, after]) assert.equal(canStand(world, u, v), true);
    const a = depthOrder(blocks, {u, v: before}).map(o => o.id), b = depthOrder(blocks, {u, v: after}).map(o => o.id);
    assert.ok(a.indexOf('nova') < a.indexOf(`0,0/${id}`)); assert.ok(b.indexOf('nova') > b.indexOf(`0,0/${id}`));
  }
});
test('fixed overview fits both ground blocks; follow view retains existing camera behavior', () => {
  const view = calibrationView(526, 420, false, 2);
  assert.ok(view.zoom * 1024 < 526); assert.deepEqual(view.camera, {x: 512, y: 144});
  assert.deepEqual(calibrationView(526, 420, true, 1.5), {zoom: 1.5, camera: undefined});
});
test('renderer uses foot-centered scaling and debug does not alter scene order', () => {
  globalThis.devicePixelRatio = 1;
  for (const debug of [false, true]) {
    const calls = [], ctx = new Proxy({}, {get: (_, name) => (...args) => calls.push([name, ...args]), set: () => true});
    const renderer = new Renderer({width: 526, height: 420, clientWidth: 526, clientHeight: 420, getContext: () => ctx});
    renderer.draw([], {u: 100, v: 125, direction: 'south', protagonist: 'female'}, {zoom: 1, characterScale: 2, grid: debug, seams: debug}, 0);
    assert.ok(calls.some(c => c[0] === 'translate' && c[1] === 100 && c[2] === 125 * 9 / 16));
    assert.ok(calls.some(c => c[0] === 'scale' && c[1] === 2 && c[2] === 2));
    if (debug) assert.ok(calls.some(c => c[0] === 'ellipse' && c[3] === 6 && c[4] === 6 * 9 / 16));
  }
});
test('external opaque collar templates accept a new palette but still reject changed border pixels', () => {
  const image = (width, height) => ({width, height, pixels: new Uint8Array(width * height * 4).fill(255)});
  const templates = {id: 'reference-v1', edges: {}, corners: {'meadow-corner-v1': {}}};
  for (const socket of ['meadow-open-v1', 'meadow-road-v1']) {
    templates.edges[socket] = {};
    for (const d of ['north', 'east', 'south', 'west']) templates.edges[socket][d] = image(['north', 'south'].includes(d) ? 512 : 32, ['north', 'south'].includes(d) ? 18 : 288);
  }
  for (const d of ['nw', 'ne', 'se', 'sw']) templates.corners['meadow-corner-v1'][d] = image(32, 18);
  const imported = {...asset, templates, groundInfo: image(512, 288)};
  assert.deepEqual([...templatePixel(templates, manifest, 500, 280)], [255, 255, 255, 255]);
  assert.deepEqual(validateAsset(imported), []);
  imported.groundInfo.pixels[0] = 0;
  assert.ok(validateAsset(imported).some(i => i.category === 'seam-pixels'));
  const withoutTemplates = {...imported, templates: null};
  assert.ok(validateAsset(withoutTemplates).some(i => i.category === 'seam-pixels'));
  const invalid = structuredClone(imported); invalid.manifest.corners[0] = 'unknown';
  assert.ok(validateAsset(invalid).some(i => i.category === 'corner'));
});
