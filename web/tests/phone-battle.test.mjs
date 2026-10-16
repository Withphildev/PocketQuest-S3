import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {battleViewport,BATTLE_WIDTH,BATTLE_HEIGHT,canvasPoint} from '../route/fullscreen.js';
import {battleScene,lunge} from '../route/battle-view.js';
test('compact battle removes empty space, increasing height-limited phone scene scale by 60%',()=>{
 for(const [w,h]of [[900,140],[844,180],[844,250]]){
  const view=battleViewport(w,h),old=Math.min(w/768,h/384);assert(view.scale>=old*1.59);assert(view.x>=0&&view.y>=0);
  assert(BATTLE_WIDTH*view.scale<=w+1e-8&&BATTLE_HEIGHT*view.scale<=h+1e-8);
 }
 assert.equal(BATTLE_HEIGHT,240);
});
test('complete scenery and every attack sprite stay in compact frame during lunges',async()=>{
 const scene=battleScene();assert.equal(scene.groundY,12);assert.equal(scene.groundY+288*scene.groundScale,228);
 const cases=[['nova-sword/Nova-female-v2-attack-east-1.png',140,165,[40,56],2.5,'hero'],['nova-female-v2/Nova-male-east-1.png',140,165,[16,44],2.5,'hero']];
 for(const [folder,prefix,pivot,scale]of [['slime-blue','Slime-Blue',[24,42],2.2],['dire-wolf','Dire-Wolf',[32,42],2.2],['goblin','Goblin',[32,42],2.2*1.45]])for(const x of [490,635])cases.push([`${folder}/${prefix}-attack-1.png`,x,180,pivot,scale,'enemy']);
 for(const [file,x,y,pivot,scale,who]of cases){const bytes=await readFile(new URL(`../build/${file}`,import.meta.url)),w=bytes.readUInt32BE(16),h=bytes.readUInt32BE(20);
  for(let t=0;t<=1;t+=.01){const shift=lunge(t)*(who==='hero'?.4:-1),left=x+shift-pivot[0]*scale,top=y-pivot[1]*scale;
   assert(left>=0&&left+w*scale<=BATTLE_WIDTH,`${file} horizontal`);assert(top>=0&&top+h*scale<=BATTLE_HEIGHT,`${file} vertical`);}
 }
});
test('compact viewport normal and rotated pointer mapping selects same enemy',()=>{
 const w=900,h=250,view=battleViewport(w,h),local={x:view.x+635*view.scale,y:view.y+165*view.scale};
 const normal=canvasPoint(local.x,local.y,{left:0,top:0,width:w,height:h},w,h);
 const rotated=canvasPoint(h-local.y,local.x,{left:0,top:0,right:h,width:h,height:w},w,h,true);
 for(const p of [normal,rotated]){assert(Math.abs((p.x-view.x)/view.scale-635)<1e-8);assert(Math.abs((p.y-view.y)/view.scale-165)<1e-8);}
});
test('fullscreen battle condenses repeated instructions, not actions or critical save errors',async()=>{
 const html=await readFile(new URL('../route/index.html',import.meta.url),'utf8'),app=await readFile(new URL('../route/app.js',import.meta.url),'utf8');
 assert(html.includes('#play-notice:not(.critical)'));assert(html.includes('.intent-full{display:none}'));assert(html.includes('.intent-compact{display:inline}'));
 assert(app.includes("classList.toggle('in-battle',!!b)"));assert(app.includes('HEAVY STRIKE'));assert(app.includes('Guard: ${intent.guarded} HP'));assert(app.includes('!game.connected||!game.writable||game.state?.handheldBattle'));
});
