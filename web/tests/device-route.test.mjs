import test from 'node:test';import assert from 'node:assert/strict';import {DeviceRouteGame} from '../route/device.js';
const state=(extra={})=>({schemaVersion:1,deviceAuthoritative:true,heroId:'000000000000007B',token:'A'.repeat(32),revision:'10',sequence:'2',writable:true,durable:true,error:'',xp:60,level:3,hp:48,maxHp:48,handheldHp:38,handheldBattle:false,phase:0,cleared:0,encounter:0,target:0,focus:3,potions:2,round:1,enemyHp:[0,0],...extra});
const response=(s,ok=true)=>({ok,async json(){return s;}});
test('device mode loads real level/XP and durable route; refresh cannot award XP',async()=>{
 let calls=0;const g=new DeviceRouteGame(async(path)=>{calls++;assert.equal(path,'/api/route');return response(state());});
 assert(!g.loaded);await g.refresh();assert.equal(g.hero.xp,60);assert.equal(g.hero.level,3);assert.equal(g.maxHp(),48);assert.equal(calls,1);await g.refresh();assert.equal(g.hero.xp,60);
});
test('commands contain only exact revision/action/target; no client reward values',async()=>{
 let request;const g=new DeviceRouteGame(async(path,options)=>{request={path,options};return response(state({revision:'18446744073709551614',phase:1,enemyHp:[16,0]}));});
 g.adopt(state({revision:'18446744073709551613'}));assert(await g.start('slime'));const body=new URLSearchParams(request.options.body);
 assert.deepEqual([...body.keys()],['base','action','target']);assert.equal(body.get('base'),'18446744073709551613');assert.equal(request.options.headers['X-PQ-Token'],'A'.repeat(32));assert.equal(request.options.method,'POST');assert(g.battle);
});
test('lost final response never applies a local reward or blindly resends; GET recovers save',async()=>{
 let committed=false,posts=0;const g=new DeviceRouteGame(async(path)=>{if(path.endsWith('command')){posts++;committed=true;throw Error('response lost');}return response(state(committed?{xp:72,revision:'11',phase:2,cleared:1}:{}));});
 g.adopt(state({phase:1,enemyHp:[3,0]}));assert(!await g.act('attack'));assert.equal(g.hero.xp,60);assert(!g.connected);assert(!await g.act('attack'));assert.equal(posts,1);
 await g.refresh();assert.equal(g.hero.xp,72);assert.equal(g.result.type,'victory');assert.equal(posts,1);assert(g.cleared.has('slime'));
});
test('stale client adopts conflicting authority without inventing success',async()=>{
 const g=new DeviceRouteGame(async()=>response(state({revision:'12',xp:72,phase:2,cleared:1,error:'State changed'}),false));g.adopt(state({phase:1,enemyHp:[3,0]}));assert(!await g.act('attack'));assert.equal(g.hero.xp,72);assert.match(g.message,/State changed/);
});
test('restart restores wounded group/boss, completed nodes and shared progress',()=>{
 const g=new DeviceRouteGame();g.adopt(state({phase:1,encounter:1,cleared:1,enemyHp:[0,13],target:1,round:4,hp:25,focus:1,potions:1}));assert.equal(g.battle.target,1);assert.equal(g.battle.enemies[1].hp,13);assert.equal(g.hero.hp,25);assert.equal(g.frontier().id,'wolves');
 const reloaded=new DeviceRouteGame();reloaded.adopt(g.state);assert.deepEqual(reloaded.hero,g.hero);assert.equal(reloaded.battle.round,4);assert.equal(reloaded.hero.xp,60);
});
test('missing storage and malformed data lock commands; older API is not a fallback',async()=>{
 const g=new DeviceRouteGame(async()=>response({schemaVersion:0}));assert(!await g.refresh());assert(!g.connected);assert(!await g.camp());
 g.adopt(state({writable:false,error:'Restart save'}));assert(!await g.start('slime'));assert.match(g.message,/Restart/);
 assert.throws(()=>g.adopt(state({revision:'18446744073709551616'})));assert.throws(()=>g.adopt(state({hp:999})));assert.throws(()=>g.adopt(state({cleared:2})));
});
