import {BLOCK, project} from './world.js';
export function visibleBlocks(player, width, height, zoom) {
  const p = project(player.u, player.v), margin = 512;
  const result = [];
  for (let y = Math.floor((p.y - height / zoom / 2 - margin) / 288); y <= Math.floor((p.y + height / zoom / 2 + margin) / 288); y++)
    for (let x = Math.floor((p.x - width / zoom / 2 - margin) / BLOCK); x <= Math.floor((p.x + width / zoom / 2 + margin) / BLOCK); x++) result.push({x, y});
  return result;
}
export function screenPosition(u, v, camera, width, height, zoom) {
  const p = project(u, v);
  return {x: (p.x - camera.x) * zoom + width / 2, y: (p.y - camera.y) * zoom + height / 2};
}
export function depthOrder(blocks, player) {
  const list = [{type: 'player', id: 'nova', depth: player.v, u: player.u, v: player.v}];
  for (const b of blocks) for (const object of b.asset.manifest.objects) list.push({type: 'object',
    id: `${b.x},${b.y}/${object.id}`, depth: b.y * BLOCK + object.anchor[1],
    u: b.x * BLOCK + object.anchor[0], v: b.y * BLOCK + object.anchor[1], object});
  return list.sort((a, b) => a.depth - b.depth || a.id.localeCompare(b.id, 'en'));
}
