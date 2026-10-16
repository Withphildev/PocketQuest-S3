import {ROUTE,ENEMIES} from './game.js';
import {journeyNode,journeyChest} from './journey.js';
const codes=['start','attack','skill','guard','item','run','continue','camp','depart','return','advance','chest'];
export class DeviceRouteGame {
  constructor(fetcher=(...args)=>fetch(...args)){
    this.fetcher=fetcher;this.device=true;this.loaded=false;this.connected=false;this.writable=false;this.pending=false;this.selected=0;
    this.hero={xp:0,level:1,hp:0,focus:0,potions:0};this.cleared=new Set();this.battle=null;this.result=null;this.log=[];
    this.message='Connecting to StickS3. Actions locked until authoritative state arrives.';
  }
  maxHp(){return this.state?.maxHp||40;}
  nodes(){return this.journey?.outing?[journeyNode(BigInt('0x'+this.state.heroId),this.journey)]:ROUTE;}
  frontier(){if(this.journey?.outing&&this.journey.mode!==1)return null;return this.nodes().find(n=>!this.cleared.has(n.id))||null;}
  select(index){if(!this.battle||!Number.isInteger(index)||!this.battle.enemies[index]?.hp)return false;this.selected=index;this.battle.target=index;return true;}
  adopt(s){
    const integer=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
    const decimal=v=>typeof v==='string'&&/^(0|[1-9][0-9]{0,19})$/.test(v)&&BigInt(v)<=18446744073709551615n;
    if(![1,2,3].includes(s?.schemaVersion)||s.deviceAuthoritative!==true||!decimal(s.revision)||!decimal(s.sequence)||!Array.isArray(s.enemyHp)||s.enemyHp.length!==2||s.enemyHp.some(h=>!integer(h,0,260))||!integer(s.encounter,0,3)||!integer(s.phase,0,4)||![0,1,3,7,15].includes(s.cleared)||!/^[A-F0-9]{32}$/.test(s.token)||!/^[A-F0-9]{16}$/.test(s.heroId)||!integer(s.xp,0,4294967295)||!integer(s.level,1,99)||!integer(s.maxHp,40,432)||!integer(s.hp,0,s.maxHp)||!integer(s.focus,0,3)||!integer(s.potions,0,2)||!integer(s.target,0,1)||!integer(s.round,1,65535)||typeof s.writable!=='boolean'||typeof s.durable!=='boolean')throw Error('Invalid device response');
    const j=s.journey;
    if(s.schemaVersion>=2&&!j)throw Error('Missing journey state');
    if(j){
      if(!integer(j.outing,0,4294967295)||!integer(j.section,0,4294967295)||!integer(j.tier,1,99)||!integer(j.highest,j.tier,99)||!integer(j.mode,0,2))throw Error('Invalid journey state');
      if(j.outing){const expected=journeyNode(BigInt('0x'+s.heroId),j);if(expected.encounter!==s.encounter||expected.u!==j.position||expected.enemyMaxHp!==j.enemyMaxHp||expected.damage!==j.damage||s.cleared>1)throw Error('Journey rules mismatch');}
      if(s.schemaVersion===3){const c=journeyChest(BigInt('0x'+s.heroId),j);if(!integer(j.chestOpened,0,1)||j.chestPresent!==c.present||j.chestPosition!==c.u||j.chestPotion!==c.potion||(j.chestOpened&&(!c.present||!s.cleared)))throw Error('Chest rules mismatch');}
    }
    this.state=s;this.journey=j||null;this.loaded=true;this.connected=true;this.writable=s.writable;
    this.hero={xp:s.xp,level:s.level,hp:s.hp,focus:s.focus,potions:s.potions};
    this.cleared=new Set(this.journey?.outing?(s.cleared?[this.nodes()[0].id]:[]):ROUTE.filter((_,i)=>s.cleared&(1<<i)).map(n=>n.id));
    const node=this.journey?.outing?this.nodes()[0]:ROUTE[s.encounter];this.battle=null;this.result=null;
    if(s.phase===1){const enemies=node.kinds.map((kind,i)=>({...ENEMIES[kind],kind,id:i,hp:s.enemyHp[i],maxHp:node.enemyMaxHp||ENEMIES[kind].hp,damage:node.damage||ENEMIES[kind].damage}));if(!enemies[this.selected]?.hp)this.selected=s.target;this.battle={id:node.id,round:s.round,target:this.selected,enemies};}
    if(s.phase>=2)this.result={type:s.phase===2?'victory':s.phase===3?'defeat':'escape',xp:s.phase===2?node.xp:0,boss:!!node.boss};
    this.message=s.error||(!s.writable?'Save unavailable. Restart device to recover; do not erase.':s.handheldBattle?'Finish the active handheld encounter before browser play.':s.durable?`Device saved · sequence ${s.sequence}. Shared XP ${s.xp}.`:'Live hero updated; waiting for handheld checkpoint.');
  }
  async request(path,options){
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8000);
    try{const response=await this.fetcher(path,{cache:'no-store',...options,signal:controller.signal});const s=await response.json();this.adopt(s);return response.ok;}finally{clearTimeout(timeout);}
  }
  async refresh(){
    if(this.pending)return false;this.pending=true;
    try{return await this.request('/api/route');}
    catch{this.connected=false;this.message='Disconnected. Actions locked; reconnecting to the latest device save. No local rewards applied.';return false;}
    finally{this.pending=false;this.onchange?.();}
  }
  async command(action,target=0){
    if(this.pending||!this.connected||!this.writable||!codes.includes(action))return false;
    this.pending=true;
    const base=this.state.revision,token=this.state.token;
    try{
      const wait=Math.max(0,400-(Date.now()-(this.lastSentAt||0)));if(wait)await new Promise(resolve=>setTimeout(resolve,wait));this.lastSentAt=Date.now();
      const ok=await this.request('/api/route/command',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded','X-PQ-Token':token},body:new URLSearchParams({base,action,target:String(target)}).toString()});
      if(ok){this.log.push(`${this.state.durable?'Device saved':'Receipt accepted; handheld checkpoint pending'}: ${action}. XP ${this.hero.xp}.`);this.log=this.log.slice(-8);}return ok;
    }catch{
      this.connected=false;this.message='Command outcome uncertain. Actions locked; fetching authoritative state before any new command. Do not repeat rewards locally.';return false;
    }finally{this.pending=false;this.onchange?.();}
  }
  start(id){return this.command('start',this.journey?.outing?0:ROUTE.findIndex(n=>n.id===id));}
  act(action){return this.command(action,action==='attack'||action==='skill'?this.battle.target:0);}
  camp(){return this.command('camp');}
  continue(){return this.command('continue');}
  depart(){return this.command('depart');}
  returnHome(){return this.command('return');}
  advance(){return this.command('advance');}
  chest(){if(this.state?.schemaVersion!==3||this.journey?.mode!==1)return null;const c=journeyChest(BigInt('0x'+this.state.heroId),this.journey);return c.present?c:null;}
  openChest(){return this.command('chest');}
}
