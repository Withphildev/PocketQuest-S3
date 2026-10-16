import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {JourneyGame,journeyChest,journeyNode} from '../route/journey.js';
import {DeviceRouteGame} from '../route/device.js';
import {nearbyChest,canOpenChest,drawChest} from '../route/chests.js';
import {canStand} from '../src/navigation.js';
const ground=await Promise.all(['Left','Right'].map(async side=>({manifest:JSON.parse(await readFile(new URL(`../build/validated-ground/F002-Sunlit-Forest-${side}.json`,import.meta.url))),navigation:JSON.parse(await readFile(new URL(`../build/validated-ground/F002-Sunlit-Forest-${side}-nav.json`,import.meta.url)))})));
const world={block(x,y){return y===0?{x,y,asset:ground[((x%2)+2)%2]}:{asset:{manifest:{objects:[]},navigation:{cells:Array.from({length:32},()=>Array(32).fill(0))}}};}};
test('seeded chest presence/placement/reward deterministic, on navigable path beyond encounter',()=>{
 let count=0,potions=0;const positions=new Set();
 for(let section=0;section<300;section++){const j={outing:1,section,mode:1,chestOpened:0,tier:1},c=journeyChest(123n,j),n=journeyNode(123n,j);assert.deepEqual(journeyChest(123n,j),c);assert(c.u>=n.u+90&&c.u<=960);assert(canStand(world,c.u,c.v));positions.add(c.u);if(c.present){count++;potions+=Number(c.potion);}}
 assert(count>65&&count<140);assert(potions>15&&potions<count-15);assert(positions.size>100);assert(journeyChest(123n,{outing:1,section:0}).present);
});
test('claim waits for encounter, reward clamps, opened state persists and cannot be reclaimed',()=>{
 const g=new JourneyGame();g.depart();const c=g.chest();g.hero.hp=20;g.hero.potions=0;assert(!g.openChest());assert(!canOpenChest(g,c));
 g.cleared.add(g.nodes()[0].id);const before={...g.hero};assert(canOpenChest(g,c));assert(g.openChest());assert.equal(g.journey.chestOpened,1);assert(!g.openChest());assert.equal(g.hero.xp,before.xp);
 assert.equal(g.hero.hp,before.hp+(c.potion?0:8));assert.equal(g.hero.potions,c.potion?1:0);
 const refresh=new JourneyGame();refresh.journey={...g.journey};refresh.hero={...g.hero};refresh.cleared=new Set(g.cleared);assert(refresh.chest().opened);assert(!refresh.openChest());
 assert(g.advance());assert.equal(g.journey.chestOpened,0);assert.notEqual(journeyChest(g.seed,g.journey).id,c.id);
});
test('full supplies leave chest closed, potion overflow heals instead, no chests on peaceful return/home',()=>{
 const g=new JourneyGame();g.depart();g.cleared.add(g.nodes()[0].id);assert(!g.openChest());assert.equal(g.journey.chestOpened,0);
 g.hero.hp=38;assert(g.openChest());assert.equal(g.hero.hp,40);assert.equal(g.hero.potions,2);
 assert(g.returnHome());assert.equal(g.chest(),null);assert(!g.openChest());g.camp();assert.equal(g.chest(),null);
});
test('nearby interaction supports same touch/Space/Cross path without blocking walking',()=>{
 const g=new JourneyGame();g.depart();const c=g.chest();assert.equal(nearbyChest(g,{u:c.u-100,v:c.v}),null);assert.equal(nearbyChest(g,{u:c.u,v:c.v}).id,c.id);
 g.battle={};assert.equal(nearbyChest(g,c),null);g.battle=null;g.result={type:'victory'};assert.equal(nearbyChest(g,c),null);g.result=null;g.journey.chestOpened=1;assert.equal(nearbyChest(g,c),null);
 const calls=[];const ctx=new Proxy({}, {set:(o,k,v)=>{o[k]=v;return true;},get:(o,k)=>o[k]||((...args)=>calls.push([k,...args]))});drawChest(ctx,{opened:false},100,140,1);drawChest(ctx,{opened:true},100,140,1);assert(calls.some(c=>c[0]==='fillText'&&c[1]==='OPENED'));
});
function state(extra={}){const j={outing:1,section:0,tier:1,highest:1,mode:1,chestOpened:0},n=journeyNode(123n,j),c=journeyChest(123n,j);return {schemaVersion:3,deviceAuthoritative:true,heroId:'000000000000007B',token:'A'.repeat(32),revision:'10',sequence:'2',writable:true,durable:true,error:'',xp:12,level:1,hp:20,maxHp:40,phase:0,cleared:1,encounter:n.encounter,target:0,focus:3,potions:0,round:1,enemyHp:[0,0],journey:{...j,position:n.u,enemyMaxHp:n.enemyMaxHp,damage:n.damage,chestPresent:c.present,chestPosition:c.u,chestPotion:c.potion},...extra};}
test('schema3 chest metadata validated and accepted reward always comes from server receipt',async()=>{
 const initial=state(),c=journeyChest(123n,initial.journey),claimed=state({revision:'11',sequence:'3',hp:20+(c.potion?0:8),potions:c.potion?1:0,journey:{...initial.journey,chestOpened:1}}),calls=[];
 const g=new DeviceRouteGame(async(path,options)=>{calls.push([path,options]);return {ok:true,json:async()=>options?.method==='POST'?claimed:initial};});
 assert(await g.refresh());assert(g.chest());assert(await g.openChest());assert(g.chest().opened);assert.equal(g.hero.hp,claimed.hp);assert.equal(g.hero.potions,claimed.potions);assert.equal(new URLSearchParams(calls[1][1].body).get('action'),'chest');assert.equal(new URLSearchParams(calls[1][1].body).get('target'),'0');
 for(const patch of [{chestOpened:2},{chestPosition:1},{chestPresent:false},{chestPotion:!c.potion}])assert.throws(()=>new DeviceRouteGame().adopt(state({journey:{...initial.journey,...patch}})),/Chest rules/);
});
test('failed claim has no local reward or opened flag',async()=>{
 const g=new DeviceRouteGame(async(path,options)=>({ok:!options?.method,json:async()=>state({error:options?.method?'Rejected':''})}));assert(await g.refresh());assert(!await g.openChest());assert.equal(g.hero.hp,20);assert(!g.chest().opened);
});
