export const BLOCK = 512, CELL = 16, GRID = 32, Y_SCALE = 9 / 16;
export const DIRECTIONS = Object.freeze({north: 1, east: 2, south: 4, west: 8});
export const SUPPORTED_MASKS = Object.freeze([0, 5, 10, 15]);
export const GENERATOR_VERSION = 1;
export const VARIANTS = Object.freeze({0: ['F001-clearing', 'F003-pond'],
  5: ['F002-north-south'], 10: ['F002-east-west'], 15: ['F004-crossroads']});

// Explicit unsigned 32-bit operations: stable across JS runtimes and generation order.
export function hash(seed, x, y, domain = 0) {
  let n = (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca77) ^ domain) >>> 0;
  n ^= n >>> 16; n = Math.imul(n, 0x7feb352d);
  n ^= n >>> 15; n = Math.imul(n, 0x846ca68b);
  return (n ^ (n >>> 16)) >>> 0;
}
export function parseSeed(text) {
  if (!/^(0|[1-9][0-9]{0,9})$/.test(String(text)) || Number(text) > 0xffffffff)
    throw new Error('Seed must be an unsigned 32-bit integer (0–4294967295).');
  return Number(text);
}
export function blockAt(u, v) { return {x: Math.floor(u / BLOCK), y: Math.floor(v / BLOCK)}; }
export function project(u, v) { return {x: u, y: v * Y_SCALE}; }
export function chooseBlock(seed, x, y) {
  if (![seed, x, y].every(Number.isInteger) || seed < 0 || seed > 0xffffffff ||
      Math.abs(x) > 1000000 || Math.abs(y) > 1000000) throw new Error('World coordinate/seed out of bounds');
  const vertical = x === 0 || hash(seed, x, 0, 11) % 4 === 0;
  const horizontal = y === 0 || hash(seed, 0, y, 23) % 4 === 0;
  const roadMask = (vertical ? 5 : 0) | (horizontal ? 10 : 0);
  const candidates = VARIANTS[roadMask];
  return {x, y, roadMask, assetId: candidates[hash(seed, x, y, 37) % candidates.length],
    generatorVersion: GENERATOR_VERSION, reservedOakwood: x === 0 && y === 0};
}
export class World {
  constructor(seed, registry) { this.seed = parseSeed(seed); this.registry = registry; }
  block(x, y) {
    const block = chooseBlock(this.seed, x, y), asset = this.registry.get(block.assetId);
    if (!asset || asset.manifest.roadMask !== block.roadMask)
      throw new Error(`Missing exact scenery configuration ${block.assetId}; no fallback allowed`);
    return {...block, asset};
  }
}
// No firmware save transport or world-delta persistence is implemented here.
// World/asset lookup is independent of Canvas and future settlement simulation.
