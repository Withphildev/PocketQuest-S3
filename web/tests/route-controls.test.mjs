import test from 'node:test';import assert from 'node:assert/strict';
import {PadReader,TouchDirections,padState,axis} from '../route/controls.js';
import {notesAt,SCORES,LofiMusic} from '../route/music.js';import {midi} from '../tools/export-route-midi.mjs';
const fake=(pressed=[],axes=[0,0],mapping='standard')=>({id:'test controller',index:0,connected:true,mapping,axes,buttons:Array.from({length:16},(_,i)=>({pressed:pressed.includes(i)}))});
test('gamepad dead zone and four-way mapping',()=>{
  assert.equal(axis(.24),0);assert.equal(axis(NaN),0);assert.equal(axis(-.8),-1);
  assert.deepEqual([padState(fake([],[.5,.9])).x,padState(fake([],[.5,.9])).y],[0,1]);
  assert.equal(padState(fake([14])).x,-1);assert.equal(padState(fake([12])).y,-1);
});
test('held buttons do not trigger on connect; edges only once per press',()=>{
  const p=new PadReader();assert.deepEqual(p.read([fake([0])]).edges,[]);p.read([fake([0])]);p.read([fake()]);
  assert.deepEqual(p.read([fake([0])]).edges,[0]);assert.deepEqual(p.read([fake([0])]).edges,[]);p.read([fake()]);assert.deepEqual(p.read([fake([2])]).edges,[2]);
});
test('disconnect, background and unknown mappings cannot retain movement or actions',()=>{
  const p=new PadReader();p.read([fake()]);assert.equal(p.read([fake([],[1,0])]).x,1);assert.equal(p.read([]).x,0);
  assert.equal(p.read([fake([],[],'')]).status,'unmapped');p.read([fake()]);assert.equal(p.read([fake([0])],false).status,'paused');assert.deepEqual(p.read([fake([0])]).edges,[]);
  assert.equal(p.read([fake([],[1,0])]).x,0);p.read([fake()]);assert.equal(p.read([fake([],[1,0])]).x,1);
});
test('multiple touch pointers release independently and clear on cancellation',()=>{
  const t=new TouchDirections();t.down(1,'east');t.down(2,'north');assert.deepEqual([...t.directions()],['east','north']);t.up(1);assert.deepEqual([...t.directions()],['north']);t.down(3,'north');t.up(2);assert(t.directions().has('north'));t.clear();assert.equal(t.directions().size,0);
});
test('original scores are bounded, deterministic and have valid MIDI exports',()=>{
  for(const mode of Object.keys(SCORES)){
    for(let s=0;s<32;s++){assert.deepEqual(notesAt(mode,s),notesAt(mode,s));for(const n of notesAt(mode,s)){assert(n.note>=0&&n.note<=127);assert(n.duration>0&&n.duration<5);assert(n.velocity>0&&n.velocity<1);}}
    const data=midi(mode);assert.equal(data.subarray(0,4).toString(),'MThd');assert.equal(data.readUInt16BE(10),1);assert.equal(data.readUInt16BE(12),240);assert.equal(data.subarray(14,18).toString(),'MTrk');assert.equal(data.readUInt32BE(18),data.length-22);assert.deepEqual([...data.subarray(-3)],[255,47,0]);
  }
});
test('music creates nothing before opt-in; one scheduler; pause stops voices; volume bounded',async()=>{
  let created=0,started=0,stopped=0;const param=()=>({value:0,setValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(v){this.value=v;}});
  const node=()=>({gain:param(),frequency:param(),connect(){},disconnect(){},start(){started++;},stop(){stopped++;}});
  const ctx={state:'suspended',currentTime:0,destination:{},createGain:node,createOscillator:node,createBiquadFilter:node,async resume(){this.state='running';},async suspend(){this.state='suspended';}};
  const music=new LofiMusic(()=>{created++;return ctx;});assert.equal(created,0);assert.equal(music.timer,null);
  await music.start();assert.equal(created,1);assert(started>0);music.setVolume(4);assert.equal(music.volume,1);music.setVolume(-4);assert.equal(music.volume,0);
  music.setMode('boss');assert.equal(music.mode,'boss');await music.start();assert.equal(created,1);await music.pause();assert.equal(music.timer,null);assert.equal(ctx.state,'suspended');assert(stopped>0);
});
