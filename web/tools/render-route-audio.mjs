// Optional normalized listening preview; never embedded in firmware.
// Same notes/timing, approximate oscillator/filter rendering (not a soundfont).
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {SCORES,notesAt,scoreSeconds,stepBeat} from '../route/music.js';
export function renderAudio(mode='explore',sampleRate=22050){
 const s=SCORES[mode];if(!s)throw Error('Unknown score');
 const samples=new Float32Array(Math.ceil((scoreSeconds(mode)+.1)*sampleRate));
 for(let step=0;step<s.steps;step++)for(const n of notesAt(mode,step)){
   const start=Math.round(stepBeat(step)*60/s.bpm*sampleRate),count=Math.ceil(n.duration*sampleRate);
   const frequency=440*2**((n.note-69)/12),cutoff=n.voice==='chord'?1100:2200,alpha=1-Math.exp(-2*Math.PI*cutoff/sampleRate);
   let phase=0,filtered=0;
   for(let i=0;i<count&&start+i<samples.length;i++){
     const t=i/sampleRate,hz=n.voice==='kick'?frequency*(35/frequency)**(t/n.duration):frequency;
     phase+=2*Math.PI*hz/sampleRate;
     const wave=n.voice==='lead'||n.voice==='chord'?2/Math.PI*Math.asin(Math.sin(phase)):Math.sin(phase);
     filtered+=alpha*(wave-filtered);
     const gain=t<.018?.0001*(n.velocity/.0001)**(t/.018):n.velocity*(.0001/n.velocity)**((t-.018)/(n.duration-.018));
     samples[start+i]+=filtered*gain;
   }
 }
 let peak=0;for(const v of samples)peak=Math.max(peak,Math.abs(v));
 const wav=Buffer.alloc(44+samples.length*2);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(sampleRate,24);wav.writeUInt32LE(sampleRate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(samples.length*2,40);
 for(let i=0;i<samples.length;i++)wav.writeInt16LE(Math.round(Math.max(-1,Math.min(1,samples[i]*(peak?.72/peak:1)))*32767),44+i*2);
 return wav;
}
if(process.argv[1]&&resolve(process.argv[1])===new URL(import.meta.url).pathname){const mode=process.argv[3]||'explore';const out=resolve(process.argv[2]||`web/build/PocketQuestMini-${mode}.wav`);const wav=renderAudio(mode);await writeFile(out,wav);console.log(`${SCORES[mode].title}: ${scoreSeconds(mode).toFixed(1)} seconds; ${wav.length} preview bytes (not shipped)`);}
