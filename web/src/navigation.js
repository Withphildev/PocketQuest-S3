import {BLOCK, CELL, blockAt} from './world.js';
export const PLAYER_RADIUS = 6;
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
export function pointInPolygon(x, y, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [ax, ay] = polygon[i], [bx, by] = polygon[j];
    if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) inside = !inside;
  }
  return inside;
}
export function circlePolygon(x, y, r, polygon) {
  if (pointInPolygon(x, y, polygon)) return true;
  return polygon.some(([ax, ay], i) => {
    const [bx, by] = polygon[(i + 1) % polygon.length];
    const dx = bx - ax, dy = by - ay;
    const t = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1);
    return (x - ax - t * dx) ** 2 + (y - ay - t * dy) ** 2 < r * r;
  });
}
export function canStand(world, u, v, radius = PLAYER_RADIUS) {
  const first = blockAt(u - radius, v - radius), last = blockAt(u + radius, v + radius);
  for (let by = first.y; by <= last.y; by++) for (let bx = first.x; bx <= last.x; bx++) {
    const {asset} = world.block(bx, by), x = u - bx * BLOCK, y = v - by * BLOCK;
    const cells = asset.navigation.cells;
    for (let cy = Math.max(0, Math.floor((y - radius) / CELL)); cy <= Math.min(31, Math.floor((y + radius) / CELL)); cy++)
      for (let cx = Math.max(0, Math.floor((x - radius) / CELL)); cx <= Math.min(31, Math.floor((x + radius) / CELL)); cx++) {
        if (cells[cy][cx] === 1) continue;
        const dx = x - clamp(x, cx * CELL, (cx + 1) * CELL), dy = y - clamp(y, cy * CELL, (cy + 1) * CELL);
        if (dx * dx + dy * dy < radius * radius) return false;
      }
    for (const object of asset.manifest.objects)
      if (circlePolygon(x, y, radius, object.collision)) return false;
  }
  return true;
}
export function movePlayer(world, player, dx, dy) {
  if (![dx, dy].every(Number.isFinite)) throw new Error('Invalid movement');
  const steps = Math.ceil(Math.hypot(dx, dy) / 3);
  if (steps > 4096) throw new Error('Movement exceeds sweep budget');
  for (let i = 0; i < steps; i++) {
    if (canStand(world, player.u + dx / steps, player.v)) player.u += dx / steps;
    if (canStand(world, player.u, player.v + dy / steps)) player.v += dy / steps;
  }
  return player;
}
