import test from 'node:test';import assert from 'node:assert/strict';
import {JourneyGame,journeyNode,journeyHash} from '../route/journey.js';
import {moveAlongRoute} from '../route/movement.js';
import {battleIntent} from '../route/combat-intent.js';
import {readFile} from 'node:fs/promises';
import {validateLayout} from '../src/validation.js';
import {canStand} from '../src/navigation.js';
import {DeviceRouteGame} from '../route/device.js';
const json=async name=>JSON.parse(await readFile(new URL(`../build/validated-ground/${name}`,import.meta.url),'utf8'));
const assets=await Promise.all(['Left','Right'].map(async side=>({manifest:await json(`F002-Sunlit-Forest-${side}.json`),navigation:await json(`F002-Sunlit-Forest-${side}-nav.json`)})));
const blocked={manifest:{objects:[]},navigation:{cells:Array.from({length:32},()=>Array(32).fill(0))}};
const world={block(x,y){return {x,y,asset:y===0?assets[(x%2+2)%2]:blocked};}};
test('seeded encounter/position is stable, varied and boss opportunities are bounded',()=>{
  const kinds=new Set(),positions=new Set();
  for(let section=0;section<100;section++){
    const j={outing:1,section,tier:1};const n=journeyNode(123n,j);
    assert.deepEqual(n,journeyNode(123n,j));assert(n.u>=320&&n.u<=720);assert(canStand(world,n.u,256));assert(canStand(world,n.u-42,256));kinds.add(n.encounter);positions.add(n.u);
    if(section<2)assert(!n.boss);if(section%6===5)assert(n.boss);
    assert.equal(journeyHash(123n,1,section),journeyHash(123n,1,section));
  }
  assert.equal(kinds.size,4);assert(positions.size>50);
  assert.notDeepEqual(journeyNode(123n,{outing:1,section:1,tier:1}),journeyNode(123n,{outing:2,section:1,tier:1}));
});
test('road repeats left/right without weakening existing edge/corner validator',async()=>{
  const blocks=Array.from({length:8},(_,x)=>world.block(x-2,0));
  assert.deepEqual(validateLayout(blocks),[]);
  const {canStand,movePlayer}=await import('../src/navigation.js');
  const player={u:990,v:256};assert(canStand(world,player.u,player.v));movePlayer(world,player,100,0);assert(Math.abs(player.u-1090)<1e-7);assert(canStand(world,player.u,player.v));
});
test('uncleared encounter blocks every depth; cleared scene allows right-edge progress',()=>{
  const g=new JourneyGame();assert(g.depart());const p={u:75,v:256};
  moveAlongRoute(world,g,p,2000,0);assert(p.u<=g.frontier().u-42+1e-7);assert(!g.advance());
  g.cleared.add(g.nodes()[0].id);moveAlongRoute(world,g,p,2000,0);assert(Math.abs(p.u-1024)<1e-7);
  assert(g.advance());assert.equal(g.journey.section,1);assert.equal(g.cleared.size,0);
});
test('road difficulty grows, rested starts one below highest, repeated rest cannot ratchet lower',()=>{
  const g=new JourneyGame();g.hero.xp=60;g.hero.level=3;g.depart();
  for(let i=0;i<12;i++){g.cleared.add(g.nodes()[0].id);assert(g.advance());}
  assert.equal(g.journey.highest,5);assert.equal(g.journey.tier,5);
  const node=g.nodes()[0];assert.equal(node.enemyMaxHp,[16,24,32,64][node.encounter]+8);
  assert(g.returnHome());assert(!g.start(node.id));assert(!g.advance());assert.equal(g.frontier(),null);
  assert(g.camp());assert(g.depart());assert.equal(g.journey.tier,4);assert.equal(g.hero.xp,60);
  g.returnHome();g.camp();g.depart();assert.equal(g.journey.tier,4);assert.equal(g.journey.highest,5);
});
test('tier-scaled battle intent matches demo enemy damage and Guard per hit',()=>{
  const g=new JourneyGame();g.journey.highest=10;g.depart();const node=g.nodes()[0];g.hero.hp=200;
  assert(g.start(node.id));const threat=battleIntent(g.battle),hp=g.hero.hp;
  assert(g.act('guard'));assert.equal(hp-g.hero.hp,threat.guarded);
  assert(g.battle.enemies.every(e=>e.maxHp===node.enemyMaxHp));
});
function packet(j,extra={}){
  const node=journeyNode(123n,j);
  return {schemaVersion:2,deviceAuthoritative:true,heroId:'000000000000007B',token:'A'.repeat(32),revision:'10',sequence:'2',writable:true,durable:true,error:'',xp:60,level:3,hp:48,maxHp:48,handheldHp:38,handheldBattle:false,phase:0,cleared:0,encounter:node.encounter,target:0,focus:3,potions:2,round:1,enemyHp:[0,0],journey:{...j,position:node.u,enemyMaxHp:node.enemyMaxHp,damage:node.damage},...extra};
}
test('device reconnect restores the same section, encounter and tier without reroll/reward',async()=>{
  const saved=packet({outing:8,section:14,tier:5,highest:6,mode:1});let calls=0;
  const g=new DeviceRouteGame(async()=>{calls++;return {ok:true,json:async()=>saved};});
  await g.refresh();const first=g.frontier();await g.refresh();assert.deepEqual(g.frontier(),first);assert.equal(g.hero.xp,60);assert.equal(g.journey.section,14);assert.equal(calls,2);
  assert.throws(()=>g.adopt({...saved,journey:{...saved.journey,position:saved.journey.position+1}}),/mismatch/);
  assert.throws(()=>g.adopt({...saved,journey:null}),/Missing journey/);
});
test('device accepts tier-scaled battle HP and hides encounters on saved return stretch',()=>{
  const j={outing:9,section:5,tier:99,highest:99,mode:1},n=journeyNode(123n,j);
  const g=new DeviceRouteGame();g.adopt(packet(j,{phase:1,enemyHp:[n.enemyMaxHp,0]}));
  assert.equal(g.battle.enemies[0].maxHp,n.enemyMaxHp);assert.equal(battleIntent(g.battle).total,n.damage);
  g.adopt(packet({...j,mode:2}));assert.equal(g.frontier(),null);assert.equal(g.battle,null);assert.equal(g.hero.xp,60);
});
test('new journey commands send no client tier, seed, XP or encounter-stat fields',async()=>{
  const saved=packet({outing:1,section:0,tier:1,highest:1,mode:1});let sent;
  const g=new DeviceRouteGame(async(path,options)=>{sent={path,options};return {ok:true,json:async()=>saved};});g.adopt(saved);
  assert(await g.advance());const body=new URLSearchParams(sent.options.body);assert.deepEqual([...body.keys()],['base','action','target']);assert.equal(body.get('action'),'advance');assert.equal(body.get('target'),'0');
});
