// Original PocketQuestMini compositions. No transcription of the supplied
// copyrighted score; only the general idea of a lyrical question/answer phrase.
const A=[
 [76,0,79,76,74,0],[72,0,0,74,76,0],[69,0,72,0,67,0],[71,74,0,72,0,0],
 [76,0,79,81,79,0],[74,0,72,0,71,0],[69,72,0,74,72,0],[71,0,0,67,0,0]
];
const A2=A.map(bar=>[...bar]);A2[6]=[69,0,72,76,74,0];A2[7]=[71,74,0,79,0,0];
const B=[
 [69,0,74,0,76,0],[71,0,74,76,79,0],[77,0,76,0,72,0],[74,0,0,71,0,0],
 [72,0,76,79,76,0],[74,0,71,0,67,0],[69,0,72,74,76,0],[74,0,0,71,0,0]
];
const END=A.map(bar=>[...bar]);END[6]=[74,0,76,74,71,0];END[7]=[72,0,0,0,0,0];
const harmony=[[60,64,67,71],[57,60,64,67],[53,57,60,64],[55,59,62,64]];
const exploreChords=Array.from({length:32},(_,bar)=>bar>=16&&bar<24?[[50,53,57,60],[52,55,59,62],[53,57,60,64],[55,59,62,65]][bar%4]:harmony[bar%4]);
const battlePhrase=[[72,0,76,74,0,72,67,0],[69,0,72,0,74,76,0,0],[65,0,69,72,0,69,67,0],[71,0,74,0,76,74,71,0]];
const bossPhrase=[[74,0,77,0,76,74,69,0],[70,0,74,77,0,74,72,0],[72,0,76,0,79,76,74,0],[69,0,72,74,0,71,69,0]];
const score=(title,bpm,beatsPerBar,melody,chords)=>({title,bpm,beatsPerBar,bars:melody.length,steps:melody.length*beatsPerBar*2,melody,chords});
export const SCORES={
 explore:score('Lantern Road',72,3,[...A,...A2,...B,...END],exploreChords),
 battle:score('Small Courage',88,4,Array.from({length:16},(_,bar)=>{const line=[...battlePhrase[bar%4]];if(bar>=8&&bar<12)line[6]=[76,79,72,74][bar%4];if(bar===15)return [71,0,74,0,72,0,0,0];return line;}),Array.from({length:16},(_,bar)=>[harmony[1],harmony[2],[50,53,57,60],[52,55,59,62]][bar%4])),
 boss:score('Keeper of the Grove',100,4,Array.from({length:16},(_,bar)=>{const line=[...bossPhrase[bar%4]];if(bar>=8&&bar<12)line[2]+=12;if(bar===15)return [69,0,72,0,74,0,0,0];return line;}),Array.from({length:16},(_,bar)=>[[50,53,57,60],[46,50,53,57],[48,52,55,59],[45,48,52,55]][bar%4]))
};
export function scoreSeconds(mode){const s=SCORES[mode];return s.bars*s.beatsPerBar*60/s.bpm;}
// One shared timing model for browser synth, MIDI and the listening preview.
export function stepBeat(step){return Math.floor(step/2)+(step%2?.54:0);}
export function stepDuration(mode,step){return 60/SCORES[mode].bpm*(step%2?.46:.54);}
export function notesAt(mode,step){
  const s=SCORES[mode]||SCORES.explore,stepInLoop=((step%s.steps)+s.steps)%s.steps;
  const width=s.beatsPerBar*2,bar=Math.floor(stepInLoop/width),beat=stepInLoop%width,notes=[],seconds=60/s.bpm;
  if(beat===0)for(const n of s.chords[bar])notes.push({note:n,duration:s.beatsPerBar*seconds*.9,voice:'chord',velocity:.032});
  if(beat===0||beat===width-2)notes.push({note:s.chords[bar][0]-24,duration:seconds*.95,voice:'bass',velocity:.11});
  const phrase=s.melody[bar],pitch=phrase[beat];
  if(pitch){let end=beat+1;while(end<width&&!phrase[end])end++;
    const length=(stepBeat(bar*width+end)-stepBeat(stepInLoop))*seconds;
    notes.push({note:pitch,duration:Math.max(.08,length*.86),voice:'lead',velocity:.055});}
  if(beat===0||(s.beatsPerBar===4&&beat===4))notes.push({note:36,duration:.16,voice:'kick',velocity:.12});
  return notes;
}
export class LofiMusic {
  constructor(contextFactory=()=>new (globalThis.AudioContext||globalThis.webkitAudioContext)()){
    this.factory=contextFactory;this.volume=.25;this.mode='explore';this.timer=null;this.ctx=null;this.voices=new Set();
  }
  async start(){
    if(!this.ctx){this.ctx=this.factory();this.master=this.ctx.createGain();this.master.gain.value=this.volume;this.master.connect(this.ctx.destination);}
    await this.ctx.resume();if(this.ctx.state!=='running')throw Error('Tap Music again to resume audio.');
    this.stopTimer();this.stopVoices();this.step=0;this.next=this.ctx.currentTime+.04;
    this.timer=setInterval(()=>this.schedule(),40);this.schedule();
  }
  stopTimer(){if(this.timer!==null)clearInterval(this.timer);this.timer=null;}
  stopVoices(){for(const osc of this.voices){try{osc.stop();}catch{}}this.voices.clear();}
  async pause(){this.stopTimer();this.stopVoices();if(this.ctx&&this.ctx.state!=='closed')await this.ctx.suspend();}
  setVolume(value){this.volume=Math.max(0,Math.min(1,Number(value)||0));if(this.master)this.master.gain.setTargetAtTime(this.volume,this.ctx.currentTime,.04);}
  setMode(mode){if(!SCORES[mode]||mode===this.mode)return;this.mode=mode;this.step=0;if(this.ctx){this.stopVoices();this.next=this.ctx.currentTime+.04;}}
  schedule(){
    if(!this.ctx||this.ctx.state!=='running')return;
    if(this.next<this.ctx.currentTime)this.next=this.ctx.currentTime+.02;
    for(let budget=0;this.next<this.ctx.currentTime+.15&&budget<8;budget++){
      for(const note of notesAt(this.mode,this.step))this.note(note,this.next);
      this.next+=stepDuration(this.mode,this.step);this.step=(this.step+1)%SCORES[this.mode].steps;
    }
  }
  note({note,duration,voice,velocity},at){
    const ctx=this.ctx,osc=ctx.createOscillator(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();
    osc.type=voice==='chord'||voice==='lead'?'triangle':'sine';filter.type='lowpass';filter.frequency.value=voice==='chord'?1100:2200;
    osc.frequency.setValueAtTime(440*2**((note-69)/12),at);
    if(voice==='kick')osc.frequency.exponentialRampToValueAtTime(35,at+duration);
    gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(velocity,at+.018);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
    osc.connect(filter);filter.connect(gain);gain.connect(this.master);this.voices.add(osc);
    osc.onended=()=>{this.voices.delete(osc);osc.disconnect();filter.disconnect();gain.disconnect();};osc.start(at);osc.stop(at+duration+.02);
  }
}
