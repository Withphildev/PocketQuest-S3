export const MASTER = 'F002-Sunlit-Forest-Master.png';
export const HALVES = ['F002-Sunlit-Forest-Left.png', 'F002-Sunlit-Forest-Right.png'];
export function validateMaster(info) {
  if (info.width !== 1024 || info.height !== 288 || info.pixels.some((v, i) => i % 4 === 3 && v !== 255)) throw new Error('Sunlit master must be exactly opaque 1024×288; no scaling or cropping to fit');
}
// Semantic mask is authored separately, not inferred from the illustration.
export function validateRoadMask(info) {
  validateMaster(info);
  for (let y = 0; y < 288; y++) for (let x = 0; x < 1024; x++) {
    const p = (y * 1024 + x) * 4, value = info.pixels[p];
    if (![0, 255].includes(value) || info.pixels[p + 1] !== value || info.pixels[p + 2] !== value) throw new Error('Road mask must be opaque binary black/white');
    if ((x < 32 || (x >= 480 && x < 544) || x >= 992) && (value === 255) !== (y >= 126 && y < 162)) throw new Error(`Road opening mismatch at ${x},${y}; require Y=126–161`);
    if ((y < 18 || y >= 270) && value !== 0) throw new Error('Road mask must not add north/south exits');
  }
}
async function inspectMaster(blob) {
  const image = await createImageBitmap(blob), canvas = document.createElement('canvas');
  if (image.width !== 1024 || image.height !== 288) { image.close(); throw new Error('Sunlit master/mask must be 1024×288; source preserved'); }
  canvas.width = 1024; canvas.height = 288; const ctx = canvas.getContext('2d', {willReadFrequently:true}); ctx.drawImage(image, 0, 0);
  const info = {width:1024, height:288, pixels:ctx.getImageData(0,0,1024,288).data}; image.close(); return {canvas, info};
}
export async function splitMaster(blob) {
  const {canvas, info} = await inspectMaster(blob); validateMaster(info); const result = new Map();
  for (let side = 0; side < 2; side++) {
    const half = document.createElement('canvas'); half.width = 512; half.height = 288;
    half.getContext('2d').drawImage(canvas, side * 512, 0, 512, 288, 0, 0, 512, 288);
    const png = await new Promise(resolve => half.toBlob(resolve, 'image/png')); if (!png) throw new Error('PNG split failed'); result.set(HALVES[side], png);
  }
  return result;
}
export async function inspectRoadMask(blob) { const {info} = await inspectMaster(blob); validateRoadMask(info); }
