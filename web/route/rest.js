// Presentation only. No hero state, timers, rewards, fetches or save mutations.
export function restFrame(now,{paused=false,reduced=false,hidden=false}={}){return paused||reduced||hidden?0:Math.floor(Math.max(0,now)/1400)%2;}
export function restFade(now,entered,reduced=false){return reduced?0:Math.max(0,Math.min(1,1-(now-entered)/450));}
export function restMessage(reason,complete){return complete?'Home again. The road is safe.':reason==='defeat'?'A little rest, then another adventure.':'Take a breath. The road can wait.';}
export function validateRest(m,images){
 if(m?.schemaVersion!==1||m.size?.join()!=='512,288'||m.seat?.length!==2||m.seat.some((n,i)=>!Number.isFinite(n)||n<0||n>m.size[i])||m.frameMs!==1400)throw Error('Invalid rest manifest');
 const bg=images.get(m.background);if(!bg||bg.width!==512||bg.height!==288)throw Error('Invalid rest background');
 for(const sex of ['female','male']){const c=m.characters?.[sex];if(c?.frames?.length!==2||!Number.isFinite(c.scale)||c.scale<=0||c.scale>2)throw Error('Invalid resting character');
  for(const f of c.frames){const im=images.get(f.file);if(!im||im.width!==(sex==='female'?120:128)||im.height!==(sex==='female'?164:172)||f.pivot?.length!==2||f.pivot.some((n,i)=>!Number.isFinite(n)||n<0||n>[im.width,im.height][i]))throw Error('Invalid rest frame');}
 }return m;
}
export class RestScene{
 constructor(canvas,manifest,images){this.canvas=canvas;this.manifest=validateRest(manifest,images);canvas.width=manifest.size[0];canvas.height=manifest.size[1];this.images=images;this.entered=0;this.last='';}
 enter(now){this.entered=now;this.last='';}
 draw(now,sex,options={}){const m=this.manifest,index=restFrame(now,options),fade=restFade(now,this.entered,options.reduced),key=`${sex}:${index}:${fade}`;if(key===this.last)return;this.last=key;
  const c=m.characters[sex]||m.characters.female,f=c.frames[index],im=this.images.get(f.file),ctx=this.canvas.getContext('2d');
  ctx.clearRect(0,0,...m.size);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(this.images.get(m.background),0,0);
  ctx.drawImage(im,m.seat[0]-f.pivot[0]*c.scale,m.seat[1]-f.pivot[1]*c.scale,im.width*c.scale,im.height*c.scale);
  if(fade){ctx.fillStyle=`rgba(5,12,8,${fade})`;ctx.fillRect(0,0,...m.size);}
 }
}
