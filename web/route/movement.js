import {movePlayer} from '../src/navigation.js';
export const ENCOUNTER_STANDOFF=42;
// Route-wide progress gate, independent of Y, scenery collision, or input source.
// Limit the requested movement BEFORE the existing collision sweep: no tunneling
// and no post-move teleport to a possibly obstructed location.
export function moveAlongRoute(world,game,player,dx,dy){
  if(![dx,dy].every(Number.isFinite))throw Error('Invalid movement');
  if(game.battle||game.result)return {blocked:false};
  const journey=!!game.journey?.outing;
  const frontier=game.frontier(),limit=frontier?frontier.u-ENCOUNTER_STANDOFF:journey?1024:1004;
  const allowedX=Math.max(journey?0:20,Math.min(limit,player.u+dx))-player.u;
  movePlayer(world,player,allowedX,dy);
  return {blocked:!!frontier&&dx>0&&player.u>=limit-1e-6,frontier};
}
