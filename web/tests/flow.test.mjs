import test from 'node:test';import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {canAutoResume,showOakwoodMarker} from '../route/flow.js';
import {JourneyGame} from '../route/journey.js';
import {DeviceRouteGame} from '../route/device.js';
test('only unlocked victory/escape results auto-resume, never defeat or a live battle',()=>{
  for(const type of ['victory','escape']){assert(canAutoResume({result:{type}}));assert(!canAutoResume({result:{type}},true));}
  for(const result of [null,{type:'defeat'}])assert(!canAutoResume({result}));
  assert(!canAutoResume({battle:{},result:null}));
});
test('automatic victory continuation retains earned XP and cannot award it twice',()=>{
  const g=new JourneyGame();g.depart();g.hero.xp=4294967295;g.hero.level=99;g.hero.hp=g.maxHp();
  const node=g.nodes()[0];g.start(node.id);while(g.battle)g.act('attack');
  const before={xp:g.hero.xp,hp:g.hero.hp,cleared:[...g.cleared]};assert(canAutoResume(g));assert(g.continue());assert(!canAutoResume(g));assert(!g.continue());
  assert.deepEqual({xp:g.hero.xp,hp:g.hero.hp,cleared:[...g.cleared]},before);assert.equal(g.frontier(),null);
});
test('automatic escape continuation does not remove the encounter gate',()=>{
  const g=new JourneyGame();g.depart();const before=g.frontier();g.start(before.id);g.act('run');assert(canAutoResume(g));g.continue();assert.equal(g.hero.xp,0);assert.equal(g.frontier().id,before.id);assert.equal(g.cleared.size,0);
});
test('Oakwood sign is restricted to the initial outward section, never later or returning',()=>{
  assert(showOakwoodMarker({outing:1,section:0,mode:1}));
  assert(showOakwoodMarker({outing:9,section:0,mode:1}));
  for(const mode of [0,2])assert(!showOakwoodMarker({outing:1,section:0,mode}));
  for(const section of [1,2,10,4294967295])assert(!showOakwoodMarker({outing:1,section,mode:1}));
  assert(!showOakwoodMarker(null));assert(!showOakwoodMarker({outing:0,section:0,mode:0}));
});
test('restored device victory continues through the API, never a local reward mutation',async()=>{
  const calls=[],packet={schemaVersion:1,deviceAuthoritative:true,heroId:'000000000000007B',token:'A'.repeat(32),revision:'10',sequence:'2',writable:true,durable:true,error:'',xp:12,level:1,hp:40,maxHp:40,handheldHp:30,handheldBattle:false,phase:2,cleared:1,encounter:0,target:0,focus:3,potions:2,round:1,enemyHp:[0,0]};
  const g=new DeviceRouteGame(async(path,options)=>{calls.push({path,body:new URLSearchParams(options.body)});return {ok:true,json:async()=>({...packet,phase:0,revision:'11',sequence:'3'})};});
  g.adopt(packet);assert(canAutoResume(g));assert(await g.continue());assert(!canAutoResume(g));assert.equal(g.hero.xp,12);assert.equal(calls.length,1);assert.equal(calls[0].body.get('action'),'continue');assert.deepEqual([...calls[0].body.keys()],['base','action','target']);
});
test('uncertain continuation locks actions; reconnect retries only the saved transition',async()=>{
  const packet={schemaVersion:1,deviceAuthoritative:true,heroId:'000000000000007B',token:'A'.repeat(32),revision:'10',sequence:'2',writable:true,durable:true,error:'',xp:12,level:1,hp:40,maxHp:40,handheldHp:30,handheldBattle:false,phase:2,cleared:1,encounter:0,target:0,focus:3,potions:2,round:1,enemyHp:[0,0]};
  const g=new DeviceRouteGame(async()=>{throw Error('lost response');});g.adopt(packet);assert(!await g.continue());assert(!g.connected);assert(!canAutoResume(g,!g.connected));assert.equal(g.hero.xp,12);
  g.fetcher=async()=>({ok:true,json:async()=>packet});assert(await g.refresh());assert(canAutoResume(g));assert.equal(g.hero.xp,12);
});
test('app wires automatic transitions and entrance-only marker, without continue-exploring button',async()=>{
  const app=await readFile(new URL('../route/app.js',import.meta.url),'utf8');
  assert(!app.includes("'Continue exploring'"));assert(app.includes('if(showOakwoodMarker(game.journey))'));
  assert(app.includes('if(canAutoResume(game,busy||unavailable()||!active||document.hidden))continueGame()'));
  // Left edge continues to return home from every section, not only at the sign.
  assert(app.includes('if(dx<0&&player.u<=10)camp()'));
});
