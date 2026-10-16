import test from 'node:test';import assert from 'node:assert/strict';
import {SCORES,notesAt,scoreSeconds,stepBeat,stepDuration,LofiMusic} from '../route/music.js';
import {midi} from '../tools/export-route-midi.mjs';
import {renderAudio} from '../tools/render-route-audio.mjs';
test('Lantern Road is an 80-second original AABA waltz, not a short repeated bar',()=>{
 const s=SCORES.explore;assert.equal(s.title,'Lantern Road');assert.equal(s.beatsPerBar,3);assert.equal(s.bars,32);assert.equal(s.steps,192);assert.equal(scoreSeconds('explore'),80);
 assert.deepEqual(s.melody.slice(0,6),s.melody.slice(8,14));assert.notDeepEqual(s.melody.slice(0,8),s.melody.slice(16,24));assert.notDeepEqual(s.melody.slice(0,8),s.melody.slice(24,32));
 assert(new Set(s.melody.map(bar=>bar.join(','))).size>16);
});
test('all extended score notes, durations, timing and loop boundaries remain bounded',()=>{
 for(const [mode,s]of Object.entries(SCORES)){
   assert.equal(s.chords.length,s.bars);assert.equal(s.melody.length,s.bars);assert(s.melody.every(bar=>bar.length===s.beatsPerBar*2));let duration=0;
   for(let step=0;step<s.steps;step++){duration+=stepDuration(mode,step);assert(stepDuration(mode,step)>0);for(const n of notesAt(mode,step)){assert(n.note>=0&&n.note<=127);assert(n.duration>0&&n.duration<5);assert(n.velocity>0&&n.velocity<.2);}assert.deepEqual(notesAt(mode,step),notesAt(mode,step+s.steps));}
   assert(Math.abs(duration-scoreSeconds(mode))<1e-8);assert.equal(stepBeat(s.steps),s.steps/2);assert(scoreSeconds(mode)>35);
 }
});
test('MIDI includes the complete arrangement, tempo, meter, and paired note-offs',()=>{
 for(const [mode,s]of Object.entries(SCORES)){
   const data=midi(mode);let p=22,tick=0,timeSignature=false,tempo=false;const playing=new Map();
   const vlq=()=>{let n=0,b;do{b=data[p++];n=n*128+(b&127);}while(b&128);return n;};
   while(p<data.length){tick+=vlq();const status=data[p++];if(status===255){const type=data[p++],length=vlq();if(type===88){assert.equal(data[p],s.beatsPerBar);timeSignature=true;}if(type===81)tempo=true;if(type===47)assert.equal(tick,s.steps*120);p+=length;}
     else if((status&240)===192)p++;
     else{const pitch=data[p++],velocity=data[p++],key=`${status&15}:${pitch}`;
       if((status&240)===144&&velocity)playing.set(key,(playing.get(key)||0)+1);else{assert(playing.get(key)>0,key);playing.set(key,playing.get(key)-1);}}
   }
   assert(timeSignature&&tempo);assert([...playing.values()].every(n=>n===0));assert.equal(tick,s.steps*120);
 }
});
test('offline listening preview has exact score duration and finite non-clipped PCM',()=>{
 const wav=renderAudio('explore',4000);assert.equal(wav.toString('ascii',0,4),'RIFF');assert.equal(wav.readUInt32LE(24),4000);assert.equal(wav.readUInt32LE(40),(80.1*4000)*2);
 let peak=0;for(let p=44;p<wav.length;p+=2)peak=Math.max(peak,Math.abs(wav.readInt16LE(p)));assert(peak>10000&&peak<32767);
});
test('scheduler wraps at the full arrangement, not the former 32-step phrase',()=>{
 const music=new LofiMusic();music.ctx={state:'running',currentTime:0};music.mode='explore';music.step=191;music.next=0;const calls=[];music.note=n=>calls.push(n);music.schedule();assert.equal(music.step,0);assert(music.next>0);assert(calls.every(n=>n.duration>0));
});
