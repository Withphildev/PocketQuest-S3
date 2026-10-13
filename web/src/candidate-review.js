import {Renderer} from './renderer.js';
import {inspectImage} from './assets.js';
import {validateAsset,validateLayout} from './validation.js';
import {auditSharedBorders} from './candidate-audit.js';
import {movePlayer} from './navigation.js';
import {calibrationView} from './calibration.js';
const $=id=>document.getElementById(id),embedded=JSON.parse($('candidate-assets').textContent);
const blob=name=>new Blob([Uint8Array.from(atob(embedded[name]),c=>c.charCodeAt(0))],{type:name.endsWith('.png')?'image/png':'application/json'});
const json=async name=>JSON.parse(await blob(name).text());
const base=await json('F002-east-west.json'),tree=await inspectImage(blob('Sunlit-Tree.png')),placement=await json('tree-placement.json');
const registry=[];
for(const [x,name]of ['F002-Sunlit-Forest-Left-CANDIDATE.png','F002-Sunlit-Forest-Right-CANDIDATE.png'].entries()){
  const manifest=structuredClone(base);manifest.id=`F002-review-${x}`;manifest.ground=name;manifest.objects=[placement];
  manifest.navigation.source=`review-${x}-nav.json`;manifest.spawnAnchors=[{id:'review',u:440,v:256}];
  // Explicitly provisional diagnostic surface. Not a production navigation export.
  const asset={manifest,groundInfo:await inspectImage(blob(name)),objectImages:new Map([['Sunlit-Tree.png',tree]]),navigation:{schemaVersion:1,cellWorldSize:16,cells:Array.from({length:32},()=>Array(32).fill(1))}};
  registry.push({x,y:0,roadMask:10,asset});
}
const borders=auditSharedBorders(registry[0].asset.groundInfo,registry[1].asset.groundInfo);
const issues=registry.flatMap(b=>validateAsset(b.asset));issues.push(...validateLayout(registry));
$('failures').textContent=issues.map(i=>`${i.category}: ${i.asset||''} ${i.message}`).join('\n')+'\n\nShared-template contradictions:\n'+borders.map(b=>`${b.direction}: ${b.mismatchedPixels}/${b.pixels} differing pixels`).join('\n');
$('validation').textContent='NOT VALIDATOR-APPROVED · missing templates, road mask and authored ground navigation. Baseline palette pixel checks fail; shared-border contradictions also prevent one compatible template set.';
const world={block:(x,y)=>registry.find(b=>b.x===x&&b.y===y)||{asset:{manifest:{objects:[]},navigation:{cells:Array.from({length:32},()=>Array(32).fill(0))}}}};
const player={u:440,v:256,protagonist:'female',direction:'south',walking:false},renderer=new Renderer($('world')),keys=new Set();let previous=0;
const aliases={w:'north',ArrowUp:'north',s:'south',ArrowDown:'south',a:'west',ArrowLeft:'west',d:'east',ArrowRight:'east'};
addEventListener('keydown',e=>{if(['INPUT','SELECT'].includes(e.target.tagName))return;if(aliases[e.key]){e.preventDefault();keys.add(aliases[e.key]);}});addEventListener('keyup',e=>keys.delete(aliases[e.key]));addEventListener('blur',()=>keys.clear());
for(const [id,u,v]of [['behind',100,125],['front',100,195],['seam',512,256]])$(id).onclick=()=>{player.u=u;player.v=v;keys.clear();};
$('report').onclick=()=>{const data={status:'diagnostic-only-invalid-candidates',sceneValid:false,issues,sharedBorders:borders,navigation:'provisional all-walkable ground plus explicit tree polygon; baked rocks/ledges NOT mapped',tree:placement};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='PocketQuest-candidate-review.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
function tick(time){const dt=Math.min((time-(previous||time))/1000,.05);previous=time;
  let dx=Number(keys.has('east'))-Number(keys.has('west')),dy=Number(keys.has('south'))-Number(keys.has('north'));if(dx)dy=0;
  player.walking=$('sandbox').checked&&!!(dx||dy);if(player.walking){player.direction=dx?dx>0?'east':'west':dy>0?'south':'north';movePlayer(world,player,dx*190*dt,dy*190*dt);}
  player.protagonist=$('nova').value;const scale=Number($('scale').value);$('scale-value').textContent=scale+'×';
  const view=calibrationView($('world').clientWidth,$('world').clientHeight,$('follow').checked,1.5);
  renderer.draw(registry,player,{...view,characterScale:scale,grid:$('debug').checked,seams:$('debug').checked},time);
  $('position').textContent=`Feet ${Math.round(player.u)},${Math.round(player.v)} · diagnostic tree collision only · painted rock/ledge collision UNKNOWN`;
  if($('opening').checked){const ctx=renderer.ctx,ratio=Math.min(devicePixelRatio||1,2),camera=view.camera||{x:player.u,y:player.v*9/16},ox=Math.round($('world').clientWidth/2-camera.x*view.zoom),oy=Math.round($('world').clientHeight/2-camera.y*view.zoom);ctx.save();ctx.setTransform(ratio,0,0,ratio,0,0);ctx.translate(ox,oy);ctx.scale(view.zoom,view.zoom);ctx.fillStyle='#4cdbef44';ctx.fillRect(0,126,1024,36);ctx.strokeStyle='#4cdbef';ctx.strokeRect(0,126,1024,36);ctx.restore();}
  requestAnimationFrame(tick);
}requestAnimationFrame(tick);
