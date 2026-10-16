// Presentation derived from authoritative cleared encounters; no reward writes.
export function questView(game){
  if(game.journey){const j=game.journey;return {
    complete:false,title:'The woodland journey',heading:'The road is yours to explore',
    story:'Travel right through the Sunlit Forest. Encounters block the trail; turn back left whenever you want one short, peaceful walk home.',
    progress:`Road tier ${j.tier} · highest ${j.highest} · section ${j.section+1}`,
    reward:'Keep earned XP. New outings start one tier below your highest, minimum 1. Optional roadside chests hold healing or a potion.',
    depart:j.mode?'Resume woodland journey':`Set out · tier ${Math.max(1,j.highest-1)}`};}
  const complete=game.cleared.size===4;
  return {
    title:'A Safe Road Home',complete,
    heading:complete?'A warm welcome home':'A little courage, a safer road',
    story:complete?'The woodland road is safe again. Oakwood welcomes Nova home. Thank you, adventurer.':'Travel the Sunlit Forest, clear the road, and face the Goblin Captain. Oakwood will always be here when you need a rest.',
    progress:`${game.cleared.size} of 4 encounters cleared`,
    reward:complete?'Quest complete · 84 route XP earned across four encounters. Rewards are already included in your hero total.':'Route rewards: 84 XP total, including 36 XP for the captain. No extra turn-in reward.',
    depart:complete?'Revisit the woodland':'Continue the woodland quest'
  };
}
// Completion changes presentation, not exploration eligibility. Revisit never
// resets cleared encounters; connectivity/battle/result locks still apply.
export function canDepart(game,locked=false){return !locked&&!game.battle&&!game.result;}
