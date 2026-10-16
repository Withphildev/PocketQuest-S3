// Browser design-review rules only. No firmware/API/save writes.
export const ENEMIES=Object.freeze({slime:{name:'Slime',hp:16,damage:3},wolf:{name:'Wolf',hp:24,damage:4},goblin:{name:'Goblin',hp:32,damage:6},boss:{name:'Goblin Captain',hp:64,damage:8}});
export const ROUTE=Object.freeze([
  {id:'slime',name:'A rustle in the grass',u:245,v:256,kinds:['slime'],xp:12},
  {id:'wolves',name:'The wolf pair',u:440,v:256,kinds:['wolf','wolf'],xp:24},
  {id:'patrol',name:'Goblin patrol',u:675,v:256,kinds:['goblin'],xp:12},
  {id:'captain',name:'The woodland captain',u:910,v:256,kinds:['boss'],xp:36,boss:true}
]);
export function levelForXp(xp){let level=1;while(level<99&&xp>=10*level*(level+1))level++;return level;}
export class RouteGame {
  constructor(){this.hero={xp:0,level:1,hp:40,focus:3,potions:2};this.cleared=new Set();this.battle=null;this.result=null;this.log=['Leave Oakwood. Approach a visible enemy, then choose Engage.'];}
  maxHp(){return 40+4*(this.hero.level-1);}
  nodes(){return ROUTE;}
  frontier(){return this.nodes().find(n=>!this.cleared.has(n.id))||null;}
  note(message){this.log.push(message);this.log=this.log.slice(-8);}
  start(id){
    if(this.battle||this.result||this.cleared.has(id))return false;
    const node=this.nodes().find(n=>n.id===id);if(!node)return false;
    if(this.frontier()?.id!==id){this.note('Defeat the earlier encounter before advancing along the trail.');return false;}
    this.battle={id,round:1,target:0,enemies:node.kinds.map((kind,i)=>({...ENEMIES[kind],kind,hp:node.enemyMaxHp||ENEMIES[kind].hp,maxHp:node.enemyMaxHp||ENEMIES[kind].hp,damage:node.damage||ENEMIES[kind].damage,id:i})),lastAction:null};
    this.note(`${node.name}. Your turn.`);return true;
  }
  select(index){if(!this.battle||!Number.isInteger(index)||!this.battle.enemies[index]||this.battle.enemies[index].hp<=0)return false;this.battle.target=index;return true;}
  act(action){
    const b=this.battle,h=this.hero;if(!b||!['attack','skill','guard','item','run'].includes(action))return false;
    if(action==='skill'&&h.focus===0){this.note('No focus. Guard to recover one focus.');return false;}
    if(action==='item'&&h.potions===0){this.note('No potions remaining.');return false;}
    if(action==='run'){
      if(this.nodes().find(n=>n.id===b.id).boss){this.note('The captain blocks escape. Fight or return to Oakwood.');return false;}
      this.note('Escaped. No XP awarded.');this.result={type:'escape',xp:0};this.battle=null;return true;
    }
    b.lastAction=action;
    if(action==='attack'||action==='skill'){
      const target=b.enemies[b.target];const damage=(action==='skill'?22:11)+h.level*2;
      if(action==='skill')h.focus--;
      target.hp=Math.max(0,target.hp-damage);this.note(`${action==='skill'?'Power strike':'Sword strike'}: ${target.name} takes ${damage}.`);
      if(b.enemies.every(e=>e.hp===0)){
        const xp=this.nodes().find(n=>n.id===b.id).xp;this.cleared.add(b.id);h.xp=Math.min(4294967295,h.xp+xp);
        const next=levelForXp(h.xp);if(next>h.level){h.level=next;h.hp=this.maxHp();this.note(`Level ${next}! Health restored.`);}
        h.hp=Math.min(this.maxHp(),h.hp+6);this.note('Catch your breath: recover up to 6 HP.');
        this.result={type:'victory',xp,boss:this.nodes().find(n=>n.id===b.id).boss||false};this.battle=null;this.note(`Victory! +${xp} demo XP.`);return true;
      }
    }else if(action==='guard'){h.focus=Math.min(3,h.focus+1);this.note('Guard: incoming damage halved; recover one focus.');}
    else{h.potions--;h.hp=Math.min(this.maxHp(),h.hp+18);this.note('Potion: recover up to 18 HP.');}
    for(const enemy of b.enemies.filter(e=>e.hp>0)){
      const heavy=enemy.kind==='boss'&&b.round%3===0;
      const damage=Math.max(1,Math.ceil(enemy.damage*(heavy?2:1)*(action==='guard'?.5:1)));
      h.hp=Math.max(0,h.hp-damage);this.note(`${enemy.name}${heavy?' heavy strike':''}: ${damage} damage.`);
      if(h.hp===0){this.result={type:'defeat',xp:0};this.battle=null;this.note('Defeated. Return to Oakwood to recover.');return true;}
    }
    b.round++;if(b.enemies[b.target].hp===0)b.target=b.enemies.findIndex(e=>e.hp>0);
    if(b.enemies.some(e=>e.kind==='boss')&&b.round%3===0)this.note('The captain raises its club. A heavy strike is coming!');
    return true;
  }
  continue(){if(!this.result||this.result.type==='defeat')return false;this.result=null;return true;}
  camp(){this.battle=null;this.result=null;this.hero.hp=this.maxHp();this.hero.focus=3;this.hero.potions=2;this.note('Rested at Oakwood. Demo XP and cleared encounters retained.');return true;}
}
