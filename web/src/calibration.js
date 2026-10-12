// Presentation-only controls. No collision, speed, seed, or save state changes.
export function characterScale(value) {
  const scale = Number(value);
  if (!Number.isFinite(scale) || scale < .5 || scale > 2) throw new Error('Character render scale must be 0.5–2.0');
  return scale;
}
export function calibrationBlocks(slots, registry) {
  return slots.slice(0, 2).map((slot, x) => {
    const asset = registry.get(slot.value);
    if (!asset) throw new Error('Missing calibration asset');
    return {x, y: 0, asset, roadMask: asset.manifest.roadMask};
  });
}
export function calibrationView(width, height, follow, zoom) {
  if (follow) return {zoom, camera: undefined};
  return {zoom: Math.min(width / 1088, height / 464), camera: {x: 512, y: 144}};
}
export function templatePixel(templates, manifest, x, y) {
  const cornerX = x < 32 ? 'w' : x >= 480 ? 'e' : null;
  const cornerY = y < 18 ? 'n' : y >= 270 ? 's' : null;
  let image, sx, sy;
  if (cornerX && cornerY) {
    const direction = cornerY + cornerX, index = ['nw', 'ne', 'se', 'sw'].indexOf(direction);
    image = templates.corners[manifest.corners[index]][direction];
    sx = cornerX === 'w' ? x : x - 480; sy = cornerY === 'n' ? y : y - 270;
  } else if (cornerX) {
    const direction = cornerX === 'w' ? 'west' : 'east';
    image = templates.edges[manifest.edges[direction]][direction]; sx = cornerX === 'w' ? x : x - 480; sy = y;
  } else {
    const direction = cornerY === 'n' ? 'north' : 'south';
    image = templates.edges[manifest.edges[direction]][direction]; sx = x; sy = cornerY === 'n' ? y : y - 270;
  }
  return image.pixels.subarray((sy * image.width + sx) * 4, (sy * image.width + sx) * 4 + 4);
}
