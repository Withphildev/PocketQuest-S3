import {mkdir,writeFile} from 'node:fs/promises';import {resolve} from 'node:path';
import {SCORES,notesAt,stepBeat} from '../route/music.js';
export function midi(mode){
  const score=SCORES[mode];if(!score)throw Error('Unknown score');const events=[];
  const add=(tick,data)=>events.push({tick,data});const text=Buffer.from(`PocketQuestMini - ${score.title} - original lo-fi`),end=score.steps*120;
  add(0,[255,3,text.length,...text]);const tempo=Math.round(60000000/score.bpm);add(0,[255,81,3,tempo>>16&255,tempo>>8&255,tempo&255]);
  add(0,[255,88,4,score.beatsPerBar,2,24,8]);
  add(0,[192,4]);add(0,[193,32]);add(0,[194,11]);
  for(let step=0;step<score.steps;step++){
    const tick=Math.round(stepBeat(step)*240);
    for(const n of notesAt(mode,step)){
      const channel=n.voice==='kick'?9:n.voice==='bass'?1:n.voice==='lead'?2:0;
      add(tick,[144+channel,n.note,Math.min(100,Math.max(15,Math.round(n.velocity*500)))]);
      add(Math.min(end,tick+Math.round(n.duration*score.bpm*240/60)),[128+channel,n.note,0]);
    }
  }
  events.sort((a,b)=>a.tick-b.tick);const bytes=[];let previous=0;
  const vlq=value=>{const result=[value&127];while(value>>=7)result.unshift((value&127)|128);return result;};
  for(const event of events){bytes.push(...vlq(event.tick-previous),...event.data);previous=event.tick;}
  bytes.push(...vlq(end-previous),255,47,0);
  const header=Buffer.from([77,84,104,100,0,0,0,6,0,0,0,1,0,240]);const track=Buffer.alloc(8);track.write('MTrk');track.writeUInt32BE(bytes.length,4);
  return Buffer.concat([header,track,Buffer.from(bytes)]);
}
if(process.argv[1]&&resolve(process.argv[1])===new URL(import.meta.url).pathname){const out=resolve(process.argv[2]||'web/build/route-midi');await mkdir(out,{recursive:true});for(const mode of Object.keys(SCORES)){const data=midi(mode);await writeFile(resolve(out,`PocketQuestMini-${mode}.mid`),data);console.log(`${mode}: ${data.length} bytes`);}}
