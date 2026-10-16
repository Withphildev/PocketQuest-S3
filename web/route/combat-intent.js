import {ENEMIES} from './game.js';
// Read-only explanation of current server rules, not a second combat resolver.
export function enemyIntent(enemy,round){
 if(!enemy.hp)return {name:enemy.name,action:'Defeated',damage:0,guarded:0,heavy:false};
 const heavy=enemy.kind==='boss'&&round%3===0;
 const action=heavy?'Heavy club strike':({slime:'Slime bump',wolf:'Lunge',goblin:'Club strike',boss:'Club strike'})[enemy.kind];
 const damage=(enemy.damage??ENEMIES[enemy.kind].damage)*(heavy?2:1);
 return {name:enemy.name,slot:enemy.id??0,action,damage,guarded:Math.ceil(damage/2),heavy};
}
export function battleIntent(battle){
 const threats=battle.enemies.filter(e=>e.hp>0).map(e=>enemyIntent(e,battle.round));
 const total=threats.reduce((s,e)=>s+e.damage,0),guarded=threats.reduce((s,e)=>s+e.guarded,0);
 const detail=threats.map(e=>`${e.name}${battle.enemies.length>1?' '+(e.slot+1):''}: ${e.action} (${e.damage} HP)`).join(' · ');
 const advice=threats.length>1?'Defeat one wolf to reduce the response.':threats.some(e=>e.heavy)?'Guard can soften the heavy strike.':'Guard also restores one focus.';
 return {threats,total,guarded,text:`Enemy intent · ${detail}. If all survive your action: up to ${total} damage, or ${guarded} with Guard. ${advice}`};
}
