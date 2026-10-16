import {enemyIntent} from './combat-intent.js';
// Read-only playback of an accepted turn. Never awards damage, XP or saves.
export function turnFrames(before,after,action){
  if(action==='run')return [];
  const enemies=before.enemies.map((e,i)=>({...e,hp:after.enemyHp[i]}));
  const frames=[];let hp=before.hp;
  if(action==='item')hp=Math.min(before.maxHp,hp+18);
  frames.push({kind:'hero',action,target:before.target,enemies,hp,duration:380,
    text:action==='guard'?'Nova guards':action==='item'?'Nova drinks a potion':action==='skill'?'Nova uses Power strike':'Nova swings her sword',
    damage:before.enemies[before.target].hp-enemies[before.target].hp});
  if(after.result!=='victory')for(const e of enemies){
    if(!e.hp||hp<=0)continue;
    const intent=enemyIntent(e,before.round),damage=Math.min(hp,action==='guard'?intent.guarded:intent.damage);
    hp-=damage;frames.push({kind:'enemy',slot:e.id,action,target:before.target,enemies,hp,damage,duration:720,
      text:`${e.name} — ${intent.action}: ${damage} damage${action==='guard'?' (Guard)':''}`});
  }
  // A mismatching receipt must not invent a visual combat result.
  if(after.result!=='victory'&&hp!==after.hp)return [];
  return frames;
}
export function lunge(progress,reduced=false){
  if(reduced)return 0;
  const t=Math.max(0,Math.min(1,progress));if(t===0)return 0;
  return t<.2?-8*t/.2:t<.45?-8+88*(t-.2)/.25:t<.6?80:80*(1-(t-.6)/.4);
}
export function battleScene(){
  // Same sprite sizes and full master; remove unused vertical framing on phones.
  return {groundScale:.75,groundY:12,heroScale:2.5,enemyScale:2.2,feetY:165};
}
export function explorationZoom(width,height){return Math.min(width/768,height/384);}
