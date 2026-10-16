import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {RouteGame,ROUTE,levelForXp} from '../route/game.js';
import {canStand,movePlayer} from '../src/navigation.js';
import {moveAlongRoute,ENCOUNTER_STANDOFF} from '../route/movement.js';
// Isolate later battle rules without awarding earlier encounter rewards.
const unlock=(g,id)=>{for(const n of ROUTE){if(n.id===id)break;g.cleared.add(n.id);}};
const json=async name=>JSON.parse(await readFile(new URL(`../build/validated-ground/${name}`,import.meta.url),'utf8'));
const blocks=await Promise.all(['Left','Right'].map(async side=>({asset:{manifest:await json(`F002-Sunlit-Forest-${side}.json`),navigation:await json(`F002-Sunlit-Forest-${side}-nav.json`)}})));
const world={block(x,y){return y===0&&x>=0&&x<2?blocks[x]:{asset:{navigation:{cells:Array.from({length:32},()=>Array(32).fill(0))},manifest:{objects:[]}}};}};
test('route spawn, encounters and center seam use unchanged navigation',()=>{
  assert(canStand(world,75,256));for(const n of ROUTE)assert(canStand(world,n.u,n.v),n.id);
  const p={u:75,v:256};movePlayer(world,p,850,0);assert(Math.abs(p.u-925)<1e-8);assert.equal(p.v,256);
  movePlayer(world,p,0,-1000);assert(p.v>0);assert(canStand(world,p.u,p.v));
});
test('visible encounters cannot start twice, rewards happen once, cleared nodes stay cleared',()=>{
  const g=new RouteGame();assert(!g.start('unknown'));assert(g.start('slime'));assert(!g.start('wolves'));assert(!g.select(9));
  assert(g.act('attack'));assert.equal(g.hero.hp,37);assert(g.act('attack'));assert.equal(g.result.type,'victory');assert.equal(g.hero.xp,12);
  assert(!g.act('attack'));assert(!g.start('slime'));assert(g.continue());assert(!g.start('slime'));assert.equal(g.hero.xp,12);
});
test('target selection and surviving enemy turns in a group',()=>{
  const g=new RouteGame();unlock(g,'wolves');g.start('wolves');assert(g.select(1));g.act('skill');assert.equal(g.battle.enemies[1].hp,0);assert.equal(g.battle.enemies[0].hp,24);assert.equal(g.hero.hp,36);assert.equal(g.battle.target,0);
  assert(!g.select(1));assert(!g.select(1.5));g.act('skill');assert.equal(g.result.xp,24);assert.equal(g.hero.level,2);assert.equal(g.hero.hp,44);
});
test('guard, focus exhaustion, potion inventory and invalid action do not invent turns',()=>{
  const g=new RouteGame();unlock(g,'patrol');g.start('patrol');g.hero.focus=0;assert(!g.act('skill'));assert.equal(g.battle.round,1);assert(!g.act('invalid'));assert.equal(g.battle.round,1);
  g.act('guard');assert.equal(g.hero.focus,1);assert.equal(g.hero.hp,37);g.act('item');assert.equal(g.hero.potions,1);assert.equal(g.hero.hp,34);
  g.hero.potions=0;assert(!g.act('item'));assert.equal(g.battle.round,3);
});
test('run grants no XP, rest preserves demo progress, defeat retries a fresh enemy',()=>{
  const g=new RouteGame();unlock(g,'wolves');g.start('wolves');assert(g.act('run'));assert.equal(g.result.type,'escape');assert.equal(g.hero.xp,0);assert(!g.cleared.has('wolves'));g.continue();unlock(g,'patrol');g.start('patrol');g.hero.hp=1;g.act('guard');assert.equal(g.result.type,'defeat');assert(!g.continue());g.camp();assert.equal(g.hero.hp,40);assert.equal(g.hero.potions,2);g.start('patrol');assert.equal(g.battle.enemies[0].hp,32);
});
test('boss gated by completed encounters; heavy attack telegraphed and guard mitigates it',()=>{
  const g=new RouteGame();assert(!g.start('captain'));for(const n of ROUTE.filter(n=>!n.boss)){assert(g.start(n.id));while(g.battle)g.act('attack');assert.equal(g.result.type,'victory');g.continue();g.camp();}
  assert(g.start('captain'));assert(!g.act('run'));g.act('guard');g.act('guard');assert.equal(g.battle.round,3);assert.match(g.log.at(-1),/heavy strike/);const hp=g.hero.hp;g.act('guard');assert.equal(g.hero.hp,hp-8);
  while(g.battle){g.act('skill');if(g.battle&&g.hero.focus===0)g.act('guard');}assert.equal(g.result.type,'victory');assert(g.result.boss);assert.equal(g.hero.xp,84);assert.equal(g.cleared.size,4);
  const xp=g.hero.xp;g.camp();assert.equal(g.hero.xp,xp);assert.equal(g.cleared.size,4);assert.equal(levelForXp(84),3);
});
test('prototype cannot contact device or persist invented rewards',async()=>{
  const app=await readFile(new URL('../route/app.js',import.meta.url),'utf8');const core=await readFile(new URL('../route/game.js',import.meta.url),'utf8');
  assert(!/localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|WebSocket|\/api\//.test(app+core));
  assert(app.includes('validateLayout(blocks)'));assert(app.includes('moveAlongRoute(world'));assert(app.includes('new Renderer(canvas)'));
});
test('all encounters must be defeated in order, including direct start requests',()=>{
  const g=new RouteGame();assert.equal(g.frontier().id,'slime');for(const id of ['wolves','patrol','captain'])assert(!g.start(id));assert.equal(g.hero.xp,0);
});
test('oversized rightward movement stops before the first enemy and can retreat',()=>{
  const g=new RouteGame(),p={u:75,v:256};const limit=ROUTE[0].u-ENCOUNTER_STANDOFF;
  assert(moveAlongRoute(world,g,p,1000000,0).blocked);assert(Math.abs(p.u-limit)<1e-6);assert(canStand(world,p.u,p.v));
  for(let frame=0;frame<100;frame++)moveAlongRoute(world,g,p,6,0);assert(Math.abs(p.u-limit)<1e-6);
  moveAlongRoute(world,g,p,-50,0);assert(p.u<limit-49);assert.equal(g.hero.xp,0);
});
test('route-wide gate cannot be bypassed above, below or diagonally',()=>{
  const g=new RouteGame();const emptyWorld={block(){return {asset:{navigation:{cells:Array.from({length:32},()=>Array(32).fill(1))},manifest:{objects:[]}}};}};
  for(const v of [-1000,0,100,256,500,1000]){const p={u:75,v};moveAlongRoute(emptyWorld,g,p,1000,50);assert(p.u<=203+1e-6);}
  for(const v of [225,256,280]){const p={u:75,v};moveAlongRoute(world,g,p,850,80);assert(p.u<=203+1e-6);assert(canStand(world,p.u,p.v));}
});
test('escape, defeat and camp do not open a route gate',()=>{
  const g=new RouteGame(),p={u:75,v:256};g.start('slime');g.act('run');g.continue();moveAlongRoute(world,g,p,900,0);assert(p.u<=203+1e-6);
  g.start('slime');g.hero.hp=1;g.act('guard');assert.equal(g.result.type,'defeat');g.camp();assert.equal(g.frontier().id,'slime');assert(!g.cleared.has('slime'));assert(!g.start('wolves'));
});
test('defeating only one member of a group cannot open its gate',()=>{
  const g=new RouteGame();unlock(g,'wolves');g.start('wolves');g.act('skill');assert.equal(g.battle.enemies[0].hp,0);assert.equal(g.frontier().id,'wolves');g.act('run');g.continue();
  const p={u:300,v:256};moveAlongRoute(world,g,p,900,0);assert(Math.abs(p.u-398)<1e-6);assert(!g.cleared.has('wolves'));
});
test('each victory opens only the next section and boss victory unlocks the exit',()=>{
  const g=new RouteGame(),p={u:75,v:256};
  for(const n of ROUTE){moveAlongRoute(world,g,p,1000,0);assert(Math.abs(p.u-(n.u-42))<1e-6);assert.equal(g.frontier().id,n.id);assert(g.start(n.id));
    const u=p.u;moveAlongRoute(world,g,p,1000,100);assert.equal(p.u,u);
    while(g.battle)g.act('attack');assert.equal(g.result.type,'victory');moveAlongRoute(world,g,p,1000,0);assert.equal(p.u,u);g.continue();g.camp();
  }
  assert.equal(g.frontier(),null);moveAlongRoute(world,g,p,1000,0);assert(Math.abs(p.u-1004)<1e-6);assert.equal(g.hero.xp,84);
});
