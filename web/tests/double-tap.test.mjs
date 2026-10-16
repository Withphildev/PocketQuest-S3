import test from 'node:test';import assert from 'node:assert/strict';
import {BattlePress,PadReader,DOUBLE_TAP_MS,battleActionAllowed} from '../route/controls.js';
import {RouteGame,ROUTE} from '../route/game.js';
test('single X highlights pending then resolves exactly one Attack at 250ms',()=>{
 const p=new BattlePress();assert.equal(DOUBLE_TAP_MS,250);assert.equal(p.read([0],0,'turn1'),null);assert.equal(p.pendingAt,0);
 assert.equal(p.read([],249,'turn1'),null);assert.equal(p.read([],250,'turn1'),'attack');assert.equal(p.read([],500,'turn1'),null);
});
test('second X at or before deadline returns only Power Strike; late second tap cannot queue another turn',()=>{
 for(const time of [100,249,250]){const p=new BattlePress();p.read([0],0,'turn1');assert.equal(p.read([0],time,'turn1'),'skill');assert.equal(p.read([],time+300,'turn1'),null);}
 const p=new BattlePress();p.read([0],0,'turn1');assert.equal(p.read([0],251,'turn1'),'attack');assert.equal(p.read([],500,'turn1'),null);
});
test('other face actions are immediate and cancel pending X instead of queuing two turns',()=>{
 for(const [i,action]of [[1,'guard'],[2,'run'],[3,'item']]){const p=new BattlePress();p.read([0],0,'turn1');assert.equal(p.read([i],100,'turn1'),action);assert.equal(p.read([],300,'turn1'),null);assert.equal(p.read([0,i],400,'turn1'),action);}
});
test('focus/busy reset, turn/target changes and long frame stalls cancel pending commands',()=>{
 for(const context of ['next-turn','new-target','revision-change']){const p=new BattlePress();p.read([0],0,'turn1');assert.equal(p.read([],300,context),null);}
 const p=new BattlePress();p.read([0],0,'turn1');p.reset();assert.equal(p.read([],300,'turn1'),null);
 p.read([0],400,'turn1');assert.equal(p.read([],1200,'turn1'),null);p.read([0],1300,'turn1');assert.equal(p.read([],1200,'turn1'),null);
});
test('held X does not double tap; released/repressed X produces a single authoritative action request',()=>{
 const fake=down=>({id:'pad',index:0,mapping:'standard',connected:true,axes:[0,0],buttons:Array.from({length:16},(_,i)=>({pressed:i===0&&down}))});
 const r=new PadReader(),p=new BattlePress();r.read([fake(false)]);
 assert.equal(p.read(r.read([fake(true)]).edges,0,'turn1'),null);assert.equal(p.read(r.read([fake(true)]).edges,100,'turn1'),null);
 r.read([fake(false)]);assert.equal(p.read(r.read([fake(true)]).edges,150,'turn1'),'skill');assert.equal(p.read(r.read([fake(true)]).edges,450,'turn1'),null);
 const g=new RouteGame();for(const n of ROUTE){if(n.id==='patrol')break;g.cleared.add(n.id);}g.start('patrol');g.act('skill');assert.equal(g.hero.focus,2);assert.equal(g.battle.enemies[0].hp,8);assert.equal(g.battle.round,2);
});
test('Power with no focus does not fall back to Attack',()=>{
 const p=new BattlePress();p.read([0],0,'turn1');const action=p.read([0],120,'turn1');assert.equal(action,'skill');assert(!battleActionAllowed(action,{focus:0,potions:2}));assert.equal(p.read([],300,'turn1'),null);
});
