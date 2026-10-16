// Original owner-supplied recording. No request until an explicit user gesture.
export const THEME_TITLE='The Gentle Glade';
export class ThemeMusic {
  constructor(url,factory=()=>new Audio()) {this.url=url;this.factory=factory;this.volume=.25;this.audio=null;this.wanted=false;this.generation=0;this.onstate=()=>{};}
  async start() {
    const generation=++this.generation;this.wanted=true;
    if(!this.audio){
      const a=this.audio=this.factory();a.preload='none';a.loop=true;a.volume=this.volume;
      for(const event of ['playing','waiting','error'])a.addEventListener(event,()=>{
        if(!this.wanted)return;
        if(event==='error'){this.wanted=false;this.generation++;this.failed=true;a.pause();this.onstate('error');}
        else this.onstate(event);
      });
      a.src=this.url;
    }
    if(this.failed){this.failed=false;this.audio.load();}
    this.onstate('loading');
    try {await this.audio.play();if(generation!==this.generation){if(!this.wanted)this.audio.pause();return false;}return this.wanted;}
    catch(error){if(generation!==this.generation)return false;this.wanted=false;throw error;}
  }
  async pause(){this.wanted=false;this.generation++;this.audio?.pause();}
  setVolume(value){this.volume=Math.max(0,Math.min(1,Number.isFinite(value)?value:0));if(this.audio)this.audio.volume=this.volume;}
  // One overall theme: battle, boss and Oakwood never reset the playhead.
  setMode(){}
}
