import test from 'node:test';import assert from 'node:assert/strict';
import {RouteGame,ROUTE} from '../route/game.js';
import {turnFrames,lunge,battleScene,explorationZoom} from '../route/battle-view.js';
import {readFile} from 'node:fs/promises';
function turn(g,action){const original=g.battle,before={...structuredClone(original),hp:g.hero.hp,maxHp:g.maxHp()};assert(g.act(action));const after={hp:g.hero.hp,result:g.result?.type,enemyHp:original.enemies.map(e=>e.hp)};return {before,after,frames:turnFrames(before,after,action)};}
function encounter(id){const g=new RouteGame();for(const n of ROUTE){if(n.id===id)break;g.cleared.add(n.id);}assert(g.start(id));return g;}
test('surviving Slime visibly counters; final blow has no invented retaliation',()=>{
 const g=encounter('slime'),t=turn(g,'attack');assert.equal(g.hero.hp,37);assert.deepEqual(t.frames.map(f=>f.kind),['hero','enemy']);assert.equal(t.frames[1].damage,3);assert.equal(t.frames[1].hp,37);
 const final=turn(g,'attack');assert.equal(final.after.result,'victory');assert.deepEqual(final.frames.map(f=>f.kind),['hero']);assert(final.frames[0].enemies.every(e=>!e.hp));
});
test('each surviving wolf responds separately; defeated wolf does not attack',()=>{
 const g=encounter('wolves'),both=turn(g,'guard');assert.deepEqual(both.frames.slice(1).map(f=>f.hp),[38,36]);assert.deepEqual(both.frames.slice(1).map(f=>f.slot),[0,1]);
 const single=turn(g,'skill');assert.equal(single.frames.length,2);assert.equal(single.frames[1].slot,1);assert.equal(single.frames[1].damage,4);
});
test('goblin, heavy captain, potion and defeat reproduce accepted HP without mutating source',()=>{
 for(const id of ['patrol','captain']){
  const g=encounter(id);g.battle.round=3;g.hero.hp=15;
  const t=turn(g,'item'),snapshot=JSON.stringify(t.before);assert.equal(t.frames.at(-1).hp,g.hero.hp);assert.match(t.frames[1].text,id==='captain'?/Heavy/:/Club/);
  turnFrames(t.before,t.after,'item');assert.equal(JSON.stringify(t.before),snapshot);
  g.hero.hp=1;const dead=turn(g,'guard');assert.equal(dead.after.result,'defeat');assert.equal(dead.frames.at(-1).hp,0);assert.equal(dead.frames[1].damage,1);
 }
});
test('escape and inconsistent receipts never invent enemy hits',()=>{
 const g=encounter('slime'),t=turn(g,'attack');assert.deepEqual(turnFrames(t.before,{...t.after,hp:40},'attack'),[]);
 const escape=turn(g,'run');assert.deepEqual(escape.frames,[]);
});
test('v24 framing fits the complete master without zoom; reduced motion and lunge remain bounded',()=>{
 const end=battleScene();assert.equal(end.groundScale*1024,768);assert(end.groundY+288*end.groundScale<=240);assert.equal(end.heroScale,2.5);assert.equal(end.enemyScale,2.2);assert.equal(end.feetY,165);
 assert.deepEqual(battleScene(0,true),end);assert.deepEqual(battleScene(10000),end);
 for(let t=0;t<=1;t+=.01){assert(lunge(t)>=-8&&lunge(t)<=80);assert.equal(lunge(t,true),0);}assert.equal(lunge(0),0);assert.equal(lunge(1),0);
});
test('exploration fits width AND height so short fullscreen viewports retain the scenery height',()=>{
 for(const [w,h]of [[768,384],[1280,560],[844,132],[844,250],[390,700]]){const z=explorationZoom(w,h);assert(768*z<=w+1e-8);assert(384*z<=h+1e-8);}
});
test('presentation waits for accepted command and holds busy through playback; new MP3 stays deferred',async()=>{
 const app=await readFile(new URL('../route/app.js',import.meta.url),'utf8');
 assert(app.includes('const ok=await game.act(key);if(!ok)return false;'));assert(app.includes('finally{playback=null;}'));assert(app.includes('if(shownBattle())battleDraw(time)'));
 assert(!app.includes('The_Gentle_Glade'));assert(app.includes("striking?4:hurt?6"));
});
