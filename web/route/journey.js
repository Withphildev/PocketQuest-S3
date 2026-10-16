import {RouteGame,ROUTE,ENEMIES} from './game.js';
export const MAX_ROAD_TIER=99;
export function journeyHash(seed,outing,section){
  const bits=BigInt(seed);let n=Number((bits^(bits>>32n))&0xffffffffn);
  n^=Math.imul(outing,0x9e3779b9);n^=Math.imul(section,0x85ebca6b);
  n^=n>>>16;n=Math.imul(n,0x7feb352d);n^=n>>>15;n=Math.imul(n,0x846ca68b);n^=n>>>16;return n>>>0;
}
export function journeyNode(seed,j){
  const hash=journeyHash(seed,j.outing,j.section);
  const encounter=j.section>=2&&(j.section%6===5||hash%5===0)?3:hash%3;
  const base=ROUTE[encounter],kind=base.kinds[0];
  return {...base,id:`road-${j.outing}-${j.section}`,u:320+hash%401,v:256,encounter,
    name:encounter===3?'Goblin boss':encounter===1?'Wolves':ENEMIES[kind].name,
    enemyMaxHp:ENEMIES[kind].hp+2*(j.tier-1),damage:ENEMIES[kind].damage+Math.floor((j.tier-1)/3)};
}
export function journeyChest(seed,j){
 const h=journeyHash(BigInt(seed)^0x4348455354n,j.outing,j.section),enemy=journeyNode(seed,j),start=enemy.u+90;
 return {present:!!j.outing&&((j.outing===1&&j.section===0)||h%3===0),u:start+h%(961-start),v:256,potion:(h>>>8)%2===0,opened:!!j.chestOpened,id:`chest-${j.outing}-${j.section}`};
}
// Isolated demo only. Device play never uses this class to award real XP.
export class JourneyGame extends RouteGame {
  constructor(seed=123n){super();this.seed=seed;this.journey={outing:0,section:0,tier:1,highest:1,mode:0,chestOpened:0};}
  chest(){const c=journeyChest(this.seed,this.journey);return this.journey.mode===1&&c.present?c:null;}
  openChest(){const c=this.chest();if(!c||c.opened||!this.cleared.size||this.battle||this.result)return false;
    if(c.potion&&this.hero.potions<2)this.hero.potions++;
    else {if(this.hero.hp===this.maxHp())return false;this.hero.hp=Math.min(this.maxHp(),this.hero.hp+8);}
    this.journey.chestOpened=1;return true;
  }
  nodes(){return this.journey?.outing?[journeyNode(this.seed,this.journey)]:[];}
  frontier(){return this.journey.mode===1?super.frontier():null;}
  depart(){
    const j=this.journey;if(j.mode||this.battle||this.result||j.outing===4294967295)return false;
    j.outing++;j.section=0;j.tier=Math.max(1,j.highest-1);j.mode=1;j.chestOpened=0;this.cleared.clear();return true;
  }
  returnHome(){if(this.journey.mode!==1||this.battle||this.result?.type==='defeat')return false;this.journey.mode=2;this.result=null;return true;}
  advance(){
    const j=this.journey;if(j.mode!==1||this.battle||this.result||!this.cleared.size||j.section===4294967295)return false;
    j.section++;j.chestOpened=0;if(j.section%3===0)j.tier=Math.min(MAX_ROAD_TIER,j.tier+1);j.highest=Math.max(j.highest,j.tier);this.cleared.clear();return true;
  }
  start(id){return this.journey.mode===1&&super.start(id);}
  camp(){super.camp();this.journey.mode=0;return true;}
}
