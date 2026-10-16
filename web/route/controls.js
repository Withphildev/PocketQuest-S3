export const DEAD_ZONE=.25;
// Standard browser indices: Cross, Circle, Square, Triangle. One press, one action.
export const BATTLE_BINDINGS=Object.freeze({0:'attack',1:'guard',2:'run',3:'item'});
export function battleShortcut(edges){return [0,1,2,3].filter(i=>edges.includes(i)).map(i=>BATTLE_BINDINGS[i])[0]||null;}
export const DOUBLE_TAP_MS=250;
// Poll-driven: no delayed timer can send a command after a focus/battle change.
export class BattlePress {
  constructor(){this.reset();}
  reset(){this.pendingAt=null;this.context=null;this.last=null;}
  read(edges,now,context){
    if(!Number.isFinite(now)){this.reset();return null;}
    if(context!==this.context||this.last!==null&&(now<this.last||now-this.last>750))this.pendingAt=null;
    this.context=context;this.last=now;
    const other=[1,2,3].find(i=>edges.includes(i));
    if(other!==undefined){this.pendingAt=null;return BATTLE_BINDINGS[other];}
    if(edges.includes(0)&&this.pendingAt!==null&&now-this.pendingAt<=DOUBLE_TAP_MS){this.pendingAt=null;return 'skill';}
    if(this.pendingAt!==null&&now-this.pendingAt>=DOUBLE_TAP_MS){this.pendingAt=null;return 'attack';}
    if(edges.includes(0))this.pendingAt=now;
    return null;
  }
}
export function battleActionAllowed(action,hero,boss=false){return action==='skill'?hero.focus>0:action==='item'?hero.potions>0:action==='run'?!boss:action==='attack'||action==='guard';}
export function axis(value){return Number.isFinite(value)?Math.abs(value)>DEAD_ZONE?Math.sign(value):0:0;}
export function padState(pad){
  const down=i=>!!pad.buttons?.[i]?.pressed||(i===6&&(pad.buttons?.[i]?.value||0)>.5);
  let x=Number(down(15))-Number(down(14))||axis(pad.axes?.[0]);
  let y=Number(down(13))-Number(down(12))||axis(pad.axes?.[1]);
  // Four-direction movement; no faster diagonal controller travel.
  if(Math.abs(pad.axes?.[0]||0)>=Math.abs(pad.axes?.[1]||0)){if(x)y=0;}else if(y)x=0;
  const buttons=Array.from({length:16},(_,i)=>down(i));
  return {x,y,buttons,neutral:!x&&!y&&!buttons.some(Boolean)};
}
export class PadReader {
  constructor(){this.reset();}
  reset(){this.key=null;this.armed=false;this.previous=Array(16).fill(false);}
  read(pads,active=true){
    if(!active){this.reset();return {x:0,y:0,edges:[],status:'paused'};}
    const connected=Array.from(pads||[]).filter(p=>p&&p.connected!==false);
    const pad=connected.find(p=>p.mapping==='standard');
    if(!pad){this.reset();return {x:0,y:0,edges:[],status:connected.length?'unmapped':'waiting'};}
    const key=`${pad.index}:${pad.id}`;if(key!==this.key){this.reset();this.key=key;}
    const state=padState(pad);
    if(!this.armed){this.previous=state.buttons;if(state.neutral)this.armed=true;return {x:0,y:0,edges:[],status:'release'};}
    const edges=state.buttons.flatMap((v,i)=>v&&!this.previous[i]?[i]:[]);this.previous=state.buttons;
    return {...state,edges,status:'connected'};
  }
}
// Each finger owns one direction. Releasing one cannot cancel another finger.
export class TouchDirections {
  constructor(){this.points=new Map();}
  down(id,direction){this.points.set(id,direction);}
  up(id){this.points.delete(id);}
  clear(){this.points.clear();}
  directions(){return new Set(this.points.values());}
}
