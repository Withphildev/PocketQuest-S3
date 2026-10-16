import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {BATTLE_BINDINGS,battleShortcut,battleActionAllowed,PadReader} from '../route/controls.js';
import {RouteGame,ROUTE} from '../route/game.js';
const fake=(pressed=[],axes=[0,0])=>({id:'DualSense test',index:0,connected:true,mapping:'standard',axes,buttons:Array.from({length:16},(_,i)=>({pressed:pressed.includes(i)}))});
function game(id='patrol'){const g=new RouteGame();for(const n of ROUTE){if(n.id===id)break;g.cleared.add(n.id);}assert(g.start(id));return g;}
test('owner face mapping is direct, independent of movement and needs no confirmation',()=>{
 assert.deepEqual(BATTLE_BINDINGS,{0:'attack',1:'guard',2:'run',3:'item'});
 for(const [i,key]of Object.entries(BATTLE_BINDINGS)){const reader=new PadReader();reader.read([fake()]);assert.equal(battleShortcut(reader.read([fake([+i],[1,0])]).edges),key);assert.equal(battleShortcut(reader.read([fake([+i])]).edges),null);}
 for(const edges of [[],[7],[12],[13],[14],[15],[4],[5]])assert.equal(battleShortcut(edges),null);
 assert.equal(battleShortcut([3,0]),'attack'); // Raw bindings; BattlePress resolves gesture precedence.
});
test('connect/hold/background/busy-consumed edges cannot repeat turns',()=>{
 const r=new PadReader();assert.equal(battleShortcut(r.read([fake([0])]).edges),null);r.read([fake()]);assert.equal(battleShortcut(r.read([fake([0])]).edges),'attack');
 assert.equal(battleShortcut(r.read([fake([0])]).edges),null);r.read([fake([0])],false);assert.equal(battleShortcut(r.read([fake([0])]).edges),null);
});
test('all four shortcuts execute existing game rules in a single command',()=>{
 for(const [i,key]of Object.entries(BATTLE_BINDINGS)){const g=game(),before={...g.hero};assert(battleActionAllowed(key,g.hero));assert(g.act(battleShortcut([+i])));
  if(key==='attack'){assert.equal(g.hero.focus,before.focus);assert.equal(g.battle.enemies[0].hp,19);}
  if(key==='guard')assert.equal(g.hero.hp,before.hp-3);
  if(key==='run')assert.equal(g.result.type,'escape');
  if(key==='item')assert.equal(g.hero.potions,before.potions-1);
 }
});
test('boss escape, empty potions and empty focus are blocked, not remapped to another action',()=>{
 const boss=game('captain');assert(!battleActionAllowed('run',boss.hero,true));assert(!boss.act('run'));assert.equal(boss.battle.round,1);
 boss.hero.focus=0;assert(!battleActionAllowed('skill',boss.hero,true));assert(!boss.act('skill'));
 boss.hero.potions=0;assert(!battleActionAllowed('item',boss.hero,true));assert(!boss.act('item'));assert(battleActionAllowed('guard',boss.hero,true));assert(boss.act('guard'));assert.equal(boss.hero.focus,1);
});
test('app highlights direct action and movement never changes battle action; touch Attack remains',async()=>{
 const app=await readFile(new URL('../route/app.js',import.meta.url),'utf8'),html=await readFile(new URL('../route/index.html',import.meta.url),'utf8');
 assert(app.includes('const key=battlePress.read(state.edges'));assert(app.includes('padAction=actionKeys.indexOf(key);markPadAction()'));
 assert(!app.includes('lastNav'));assert(!app.includes('actionKeys[padAction]'));assert(app.includes("['attack','Attack · X']"));assert(app.includes('Run unavailable during a boss fight'));
 assert(html.includes('No separate confirmation or R2 required'));assert(html.includes('never select battle actions'));
});
