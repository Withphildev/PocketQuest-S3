import {DIRECTIONS, SUPPORTED_MASKS} from './world.js';
import {canStand} from './navigation.js';
import {templatePixel} from './calibration.js';
const DIRECTIONS_LIST = Object.keys(DIRECTIONS), CORNER = 'meadow-corner-v1';
export function canonicalPixel(mask, x, y) {
  const road = ((mask & 5) && x >= 224 && x < 288) || ((mask & 10) && y >= 126 && y < 162);
  const light = ((Math.floor(x / 16) + Math.floor(y / 18)) % 2) === 0;
  return road ? (light ? [166, 137, 87, 255] : [159, 130, 82, 255]) :
    (light ? [75, 107, 72, 255] : [72, 103, 69, 255]);
}
export function validateAsset(asset) {
  const issues = [], add = (category, message) => issues.push({asset: asset?.manifest?.id || '?', category, message});
  const m = asset?.manifest, nav = asset?.navigation;
  if (!m || typeof m !== 'object') return [{asset: '?', category: 'manifest', message: 'Manifest is missing'}];
  const fields = ['schemaVersion', 'id', 'family', 'biome', 'worldSize', 'groundPixels', 'projection', 'ground', 'roadMask', 'edges', 'corners', 'navigation', 'objects', 'spawnAnchors', 'buildPads', 'assetVersion'];
  for (const field of fields) if (!(field in m)) add('metadata', `Missing ${field}`);
  for (const field of Object.keys(m)) if (!fields.includes(field)) add('metadata', `Unsupported field ${field}`);
  if (m.schemaVersion !== 1 || m.assetVersion !== 1) add('version', 'Unsupported manifest/asset version');
  if (!/^F00[1-4]-[A-Za-z0-9_-]+$/.test(m.id || '') || !['F001', 'F002', 'F003', 'F004'].includes(m.family) || !m.id?.startsWith(m.family + '-')) add('identity', 'Invalid family/id');
  if (m.biome !== 'forest' || JSON.stringify(m.worldSize) !== '[512,512]' || JSON.stringify(m.groundPixels) !== '[512,288]') add('geometry', 'Expected forest, 512×512 world and 512×288 ground');
  if (m.projection?.xScale !== 1 || m.projection?.yNumerator !== 9 || m.projection?.yDenominator !== 16) add('projection', 'Expected x=u, y=9v/16');
  if (!SUPPORTED_MASKS.includes(m.roadMask)) add('mask', `Unsupported mask ${m.roadMask}; supported: 0,5,10,15`);
  const familyMasks = {F001: [0], F002: [5, 10], F003: [0], F004: [15]};
  if (!familyMasks[m.family]?.includes(m.roadMask)) add('family-mask', 'Unsupported initial family/road-mask configuration');
  for (const direction of DIRECTIONS_LIST) {
    const expected = m.roadMask & DIRECTIONS[direction] ? 'meadow-road-v1' : 'meadow-open-v1';
    if (m.edges?.[direction] !== expected) add('edge', `${direction}: expected ${expected}`);
  }
  if (!Array.isArray(m.corners) || m.corners.length !== 4 || m.corners.some(c => c !== CORNER)) add('corner', 'NW/NE/SE/SW must use meadow-corner-v1');
  if (!/^[A-Za-z0-9_-]+\.png$/.test(m.ground || '') || !/^[A-Za-z0-9_-]+\.json$/.test(m.navigation?.source || '')) add('path', 'Only flat local PNG/JSON filenames allowed');
  if (m.navigation?.cellWorldSize !== 16 || m.navigation?.width !== 32 || m.navigation?.height !== 32) add('navigation', 'Expected 32×32 navigation at 16 world units per cell');
  const cellsOk = nav?.schemaVersion === 1 && nav.cellWorldSize === 16 && Array.isArray(nav.cells) && nav.cells.length === 32 &&
    nav.cells.every(row => Array.isArray(row) && row.length === 32 && row.every(n => Number.isInteger(n) && n >= 0 && n <= 3));
  if (!cellsOk) add('navigation', 'Invalid navigation source/cell values');
  else {
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++)
      if ((x < 2 || x >= 30 || y < 2 || y >= 30) && nav.cells[y][x] !== 1) add('navigation', `Blocked collar cell ${x},${y}`);
  }
  const point = p => Array.isArray(p) && p.length === 2 && p.every(n => Number.isFinite(n) && n >= 0 && n <= 512);
  const ids = new Set();
  if (!Array.isArray(m.objects) || !Array.isArray(m.spawnAnchors) || !Array.isArray(m.buildPads)) add('metadata', 'objects/spawnAnchors/buildPads must be arrays');
  for (const o of Array.isArray(m.objects) ? m.objects : []) {
    if (!o || typeof o !== 'object') { add('object', 'Invalid object record'); continue; }
    if (!o.id || ids.has(o.id)) add('object', 'Missing/duplicate object ID'); ids.add(o.id);
    if (!point(o.anchor) || !Array.isArray(o.collision) || !o.collision.every(point) || o.collision.length < 3 || o.collision.some(p => p.some(n => n < 48 || n > 464))) add('object', `${o.id}: invalid footprint/anchor or protected-border obstruction`);
    if (!Array.isArray(o.pivot) || o.pivot.length !== 2 || !o.pivot.every(Number.isFinite) || !/^[A-Za-z0-9_-]+\.png$/.test(o.asset || '')) add('object', `${o.id}: invalid image/pivot`);
    if (o.depthRule !== 'ground-anchor') add('depth', `${o.id}: unsupported depthRule; split layers require a future contract`);
    const bounds = o.renderBounds;
    if (!Array.isArray(bounds) || bounds.length !== 4 || !bounds.every(Number.isFinite) || bounds[2] <= 0 || bounds[3] <= 0) add('object', `${o.id}: invalid render bounds`);
    const info = asset.objectImages?.get(o.asset);
    if (asset.objectImages && !info) add('image', `${o.id}: missing image ${o.asset}`);
    if (info) {
      if (!info.transparent) add('image', `${o.id}: foreground requires transparency`);
      if (info.hasVisiblePixels === false) add('image', `${o.id}: invisible foreground obstruction`);
      if (o.pivot?.[0] < 0 || o.pivot?.[1] < 0 || o.pivot?.[0] > info.width || o.pivot?.[1] > info.height) add('object', `${o.id}: pivot outside image`);
      if (bounds && (bounds[0] !== -o.pivot?.[0] || bounds[1] !== -o.pivot?.[1] || bounds[2] !== info.width || bounds[3] !== info.height)) add('object', `${o.id}: render bounds must match pivot and image`);
    }
  }
  // Validate source navigation and authored footprints together, never infer collision from colors.
  if (cellsOk && !issues.some(i => ['object', 'metadata'].includes(i.category))) {
    const localWorld = {block: () => ({asset})};
    const reachable = new Set(), queue = [];
    const pass = (x, y) => canStand(localWorld, x * 16 + 8, y * 16 + 8);
    if (pass(0, 0)) { queue.push([0, 0]); reachable.add('0,0'); }
    for (let index = 0; index < queue.length; index++) {
      const [x, y] = queue[index];
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, key = `${nx},${ny}`;
        if (nx >= 0 && ny >= 0 && nx < 32 && ny < 32 && !reachable.has(key) && pass(nx, ny)) {
          // Check the route between centers too: a thin authored footprint can block it.
          let clear = true;
          for (let step = 1; step < 8; step++) if (!canStand(localWorld, x * 16 + 8 + dx * step * 2, y * 16 + 8 + dy * step * 2)) { clear = false; break; }
          if (clear) { reachable.add(key); queue.push([nx, ny]); }
        }
      }
    }
    const portals = {north: [16, 0], east: [31, 16], south: [16, 31], west: [0, 16]};
    for (const [direction, cell] of Object.entries(portals)) if (!reachable.has(cell.join(','))) add('connectivity', `${direction} exit is disconnected`);
    const anchorIds = new Set();
    for (const spawn of m.spawnAnchors) {
      if (!spawn || !spawn.id || anchorIds.has(spawn.id) || !Number.isFinite(spawn.u) || !Number.isFinite(spawn.v) || spawn.u < 0 || spawn.u >= 512 || spawn.v < 0 || spawn.v >= 512) { add('spawn', 'Invalid/duplicate spawn anchor'); continue; }
      anchorIds.add(spawn.id);
      if (!canStand(localWorld, spawn.u, spawn.v) || !reachable.has(`${Math.floor(spawn.u / 16)},${Math.floor(spawn.v / 16)}`)) add('spawn', `${spawn.id}: blocked or disconnected spawn`);
    }
    for (const pad of m.buildPads) {
      const r = pad?.rect;
      if (!pad?.id || !Array.isArray(r) || r.length !== 4 || !r.every(Number.isFinite) || r[0] < 0 || r[1] < 0 || r[2] <= 0 || r[3] <= 0 || r[0] + r[2] > 512 || r[1] + r[3] > 512 || !Array.isArray(pad.tags)) add('build-pad', 'Invalid build pad rectangle/tags');
    }
  }
  if (asset.groundInfo) {
    const {width, height, pixels} = asset.groundInfo;
    if (width !== 512 || height !== 288) add('image', 'Ground image must be 512×288');
    else if (pixels) {
      let mismatch = null, alpha = false;
      const signatureValid = !issues.some(i => ['edge', 'corner', 'mask'].includes(i.category));
      for (let y = 0; y < 288; y++) for (let x = 0; x < 512; x++) {
        const i = (y * 512 + x) * 4; if (pixels[i + 3] !== 255) alpha = true;
        if (signatureValid && (x < 32 || x >= 480 || y < 18 || y >= 270) &&
            (asset.templates ? templatePixel(asset.templates, m, x, y) : canonicalPixel(m.roadMask, x, y)).some((n, k) => pixels[i + k] !== n)) mismatch ||= `${x},${y}`;
      }
      if (alpha) add('image', 'Ground must be opaque');
      if (mismatch) add('seam-pixels', `Canonical collar/corner pixel mismatch at ${mismatch}`);
    }
  }
  return issues;
}
export function validatePair(a, b, direction) {
  const opposite = {east: 'west', west: 'east', north: 'south', south: 'north'}[direction];
  if (!opposite) throw new Error('Invalid connector direction');
  const issues = [];
  if (a.edges?.[direction] !== b.edges?.[opposite]) issues.push({category: 'seam', message: `${a.id} ${direction} ≠ ${b.id} ${opposite}`});
  const pairs = {east: [[1, 0], [2, 3]], west: [[0, 1], [3, 2]], north: [[0, 3], [1, 2]], south: [[3, 0], [2, 1]]}[direction];
  for (const [i, j] of pairs) if (a.corners?.[i] !== b.corners?.[j]) issues.push({category: 'corner', message: `${a.id}/${b.id}: corner mismatch`});
  return issues;
}
export function validateLayout(blocks) {
  const issues = [], locations = new Map();
  for (const b of blocks) {
    const key = `${b.x},${b.y}`;
    if (locations.has(key)) issues.push({category: 'layout', message: `Duplicate block ${key}`});
    locations.set(key, b);
  }
  for (const b of blocks) for (const [dx, dy, direction] of [[1, 0, 'east'], [0, 1, 'south']]) {
    const neighbor = locations.get(`${b.x + dx},${b.y + dy}`);
    if (neighbor) issues.push(...validatePair(b.asset.manifest, neighbor.asset.manifest, direction));
  }
  return issues;
}
