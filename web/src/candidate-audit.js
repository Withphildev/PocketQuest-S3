export function auditSharedBorders(left, right) {
  if ([left,right].some(i => i.width !== 512 || i.height !== 288 || i.pixels.length !== 512*288*4)) throw new Error('Audit requires exact decoded 512×288 blocks');
  const areas={north:[0,0,512,18],east:[480,0,32,288],south:[0,270,512,18],west:[0,0,32,288],nw:[0,0,32,18],ne:[480,0,32,18],se:[480,270,32,18],sw:[0,270,32,18]};
  return Object.entries(areas).map(([direction,[x,y,w,h]])=>{
    let mismatchedPixels=0;
    for(let v=y;v<y+h;v++)for(let u=x;u<x+w;u++){
      const p=(v*512+u)*4;if([0,1,2,3].some(c=>left.pixels[p+c]!==right.pixels[p+c]))mismatchedPixels++;
    }
    return {direction,mismatchedPixels,pixels:w*h};
  });
}
