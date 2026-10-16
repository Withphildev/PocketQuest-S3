import test from 'node:test';
import assert from 'node:assert/strict';
import {RouteGame,ROUTE} from '../route/game.js';
import {questView,canDepart} from '../route/quest.js';
import {DeviceRouteGame} from '../route/device.js';
import {moveAlongRoute} from '../route/movement.js';
import {readFile} from 'node:fs/promises';
test('quest board follows saved completion without applying rewards',()=>{
  const g=new RouteGame();assert.equal(questView(g).complete,false);
  for(const n of ROUTE){g.camp();assert(g.start(n.id));while(g.battle)g.act('attack');assert.equal(g.result.type,'victory');g.continue();}
  const xp=g.hero.xp;assert.equal(xp,84);assert(questView(g).complete);
  for(let i=0;i<10;i++){g.camp();assert(questView(g).complete);assert.equal(g.hero.xp,xp);assert(!g.start('captain'));}
});
test('completed quest permits peaceful revisit without encounters or rewards',()=>{
  const g=new RouteGame();for(const n of ROUTE){g.camp();g.start(n.id);while(g.battle)g.act('attack');g.continue();}
  assert.equal(questView(g).depart,'Revisit the woodland');assert(canDepart(g));
  const before=JSON.stringify({hero:g.hero,cleared:[...g.cleared]});
  const world={block(){return {asset:{navigation:{cells:Array.from({length:32},()=>Array(32).fill(1))},manifest:{objects:[]}}};}};
  const player={u:75,v:256};for(let i=0;i<10;i++)moveAlongRoute(world,g,player,100,0);
  assert(Math.abs(player.u-1004)<1e-8);assert.equal(g.frontier(),null);
  for(const n of ROUTE)assert(!g.start(n.id));
  assert.equal(JSON.stringify({hero:g.hero,cleared:[...g.cleared]}),before);
  g.camp();assert(canDepart(g));assert.equal(g.hero.xp,84);assert.equal(g.cleared.size,4);
});
test('completed device save can revisit after reload without a reward command',()=>{
  const g=new DeviceRouteGame(()=>{throw Error('Revisit must not send a command');});
  g.adopt({schemaVersion:1,deviceAuthoritative:true,heroId:'000000000000007B',token:'A'.repeat(32),revision:'50',sequence:'8',writable:true,durable:true,error:'',xp:84,level:3,hp:48,maxHp:48,handheldHp:38,handheldBattle:false,phase:0,cleared:15,encounter:3,target:0,focus:3,potions:2,round:1,enemyHp:[0,0]});
  assert(canDepart(g));assert.equal(questView(g).depart,'Revisit the woodland');assert.equal(g.frontier(),null);assert.equal(g.hero.xp,84);
  assert(!canDepart(g,true));g.result={type:'victory'};assert(!canDepart(g));g.result=null;g.battle={};assert(!canDepart(g));
});
test('all input paths share peaceful return and completion is not a departure lock',async()=>{
  const app=await readFile(new URL('../route/app.js',import.meta.url),'utf8');
  assert(app.includes("$('depart').disabled=!canDepart(game,busy||unavailable())"));
  assert(app.includes('function depart(){if(!canDepart(game,busy||unavailable()))return;'));
  assert(app.includes("if(!game.battle&&!game.result&&questView(game).complete)return camp()"));
  assert(app.includes("$('interact').onclick=engage"));assert(app.includes("else engage();"));
});
test('victory recovery is bounded and not repeated on continue',()=>{
  const g=new RouteGame();g.hero.hp=20;g.start('slime');g.act('attack');assert.equal(g.hero.hp,17);g.act('attack');assert.equal(g.hero.hp,23);
  assert(g.continue());assert.equal(g.hero.hp,23);assert(!g.continue());assert.equal(g.hero.hp,23);
});
test('retreat preserves XP and gates while restoring supplies',()=>{
  const g=new RouteGame();g.start('slime');g.act('attack');g.act('attack');g.continue();const xp=g.hero.xp;
  g.start('wolves');g.act('attack');g.camp();assert.equal(g.hero.xp,xp);assert.equal(g.frontier().id,'wolves');assert.equal(g.hero.hp,g.maxHp());assert.equal(g.hero.potions,2);assert(!questView(g).complete);
});
