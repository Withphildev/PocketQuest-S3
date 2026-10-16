import {RouteGame,ROUTE} from './game.js';
import {JourneyGame} from './journey.js';
import {loadBuiltins} from '../src/assets.js';
import {Renderer} from '../src/renderer.js';
import {moveAlongRoute} from './movement.js';
import {screenPosition} from '../src/scene.js';
import {validateLayout} from '../src/validation.js';
import {PadReader,TouchDirections,BattlePress,battleActionAllowed} from './controls.js';
import {ThemeMusic,THEME_TITLE} from './theme.js';
import {PlayScreen,battleViewport,canvasPoint,BATTLE_WIDTH,BATTLE_HEIGHT} from './fullscreen.js';
import {DeviceRouteGame} from './device.js';
import {questView,canDepart} from './quest.js';
import {RestScene,restMessage} from './rest.js';
import {battleIntent} from './combat-intent.js';
import {canAutoResume,showOakwoodMarker} from './flow.js';
import {nearbyChest,canOpenChest,drawChest} from './chests.js';
import {turnFrames,lunge,battleScene,explorationZoom} from './battle-view.js';
const $=id=>document.getElementById(id),canvas=$('game');
const deviceMode=!!document.getElementById('device-route');
const game=deviceMode?new DeviceRouteGame():new JourneyGame();
const routeNodes=()=>game.nodes();
const unavailable=()=>deviceMode&&(!game.connected||!game.writable||game.pending||game.state?.handheldBattle);
const player={u:75,v:256,direction:'east',protagonist:'female',walking:false};
const keys=new Set(),held=new TouchDirections(),pad=new PadReader(),battlePress=new BattlePress(),music=new ThemeMusic(deviceMode?'/audio/the-gentle-glade.mp3':'./PocketQuestMini-The-Gentle-Glade.mp3');let loaded,renderer,blocks,world,near=null,busy=false,clock=0,camera={x:384,y:144};
let active=true,padAction=-1,padMove={x:0,y:0},targetRegions=[],musicOn=false,home=true;
let controlHint='',controlHintUntil=0;
let nearChest=null,lootMessage='',lootMessageUntil=0;
let restScene=null,restPaused=false,restReason='rest';const restReduced=matchMedia('(prefers-reduced-motion: reduce)');
let lastJourney=null;
let playback=null;
const shownBattle=()=>playback?.battle||game.battle;
function journeyPosition(){
  const j=game.journey;if(!j?.outing)return;
  if(!lastJourney||lastJourney.outing!==j.outing||lastJourney.section!==j.section){
    if(lastJourney?.outing===j.outing&&j.section===lastJourney.section+1&&j.mode===1){player.u=Math.max(0,player.u-1024);camera.x-=1024;}
    else {player.u=75;player.v=256;camera.x=75;}
    near=null;
  }
  if(j.mode===2&&lastJourney?.mode!==2){player.u=920;player.v=256;camera.x=920;near=null;}
  if(j.mode===0&&lastJourney?.mode!==0)restScene?.enter(performance.now());
  home=j.mode===0;lastJourney={...j};
}
$('rest-pause').onclick=()=>{restPaused=!restPaused;$('rest-pause').textContent=restPaused?'Resume breathing':'Pause breathing';$('rest-pause').setAttribute('aria-pressed',String(restPaused));};
const actionKeys=['attack','skill','guard','item','run'];
function audioStatus(message){$('audio-status').textContent=message;$('music').textContent=musicOn?'Mute music':music.audio?'Resume music':'Enable music';$('music').setAttribute('aria-pressed',String(musicOn));$('play-music').textContent=musicOn?'Mute music':'Enable music';$('play-music').setAttribute('aria-pressed',String(musicOn));}
music.onstate=state=>{if(state==='error'){musicOn=false;audioStatus('Theme unavailable. Tap Resume music to retry.');}else if(musicOn)audioStatus(`${state==='playing'?'Music playing':'Loading music'} · ${THEME_TITLE}.`);};
$('music').onclick=async()=>{try{if(musicOn){musicOn=false;await music.pause();audioStatus('Music muted.');}else{musicOn=true;audioStatus(`Loading music · ${THEME_TITLE}.`);if(await music.start())audioStatus(`Music playing · ${THEME_TITLE}.`);}}catch(e){musicOn=false;audioStatus(`Audio unavailable or paused. Tap to retry. ${e.message}`);}};
$('volume').oninput=e=>music.setVolume(Number(e.target.value)/100);
function clearInput(){keys.clear();held.clear();pad.reset();battlePress.reset();padMove={x:0,y:0};for(const b of document.querySelectorAll('[data-move]'))b.classList.remove('is-held');}
let playHint='L2 toggles the view. Exit or Escape returns to normal.';
function playNotice(){const critical=!!(deviceMode&&(!game.connected||!game.writable||game.state?.handheldBattle)),message=critical?game.message:playHint;$('play-notice').textContent=message;$('play-notice').classList.toggle('critical',critical);$('fullscreen-status').textContent=playHint;$('play-native').hidden=playScreen.owned;}
const playScreen=new PlayScreen({onChange:(enabled,connected)=>{document.body.classList.toggle('play-mode',enabled);document.body.classList.toggle('has-pad',connected);$('fullscreen').textContent=enabled?'Normal view':'Full screen';clearInput();sync();if(enabled)$('play-shell').focus({preventScroll:true});else $('fullscreen').focus({preventScroll:true});},onMessage:message=>{playHint=message;playNotice();}});
$('fullscreen').onclick=()=>playScreen.toggle();$('play-exit').onclick=()=>playScreen.exit();$('play-native').onclick=()=>playScreen.enter(true);
$('play-music').onclick=()=>$('music').click();$('play-home').onclick=()=>camp();
async function loseFocus(){active=false;clearInput();if(musicOn){musicOn=false;audioStatus('Music paused while away. Tap Resume music.');try{await music.pause();}catch{}}}
addEventListener('focus',()=>{active=true;pad.reset();});
addEventListener('blur',loseFocus);document.addEventListener('visibilitychange',()=>{if(document.hidden)loseFocus();else{active=true;pad.reset();}});
function markPadAction(){[...$('actions').querySelectorAll('button')].forEach((b,i)=>b.classList.toggle('pad-selected',i===padAction&&!!shownBattle()));}
function pollPad(){
  let state;try{state=pad.read(navigator.getGamepads?.(),active&&!document.hidden);}catch{state={status:'blocked',x:0,y:0,edges:[]};pad.reset();}
  if(state.status!=='paused')playScreen.setConnected(state.status==='connected'||state.status==='release');
  if(state.edges.includes(6)){playScreen.toggle();return;}
  padMove=state;const descriptions={connected:'Controller: X Attack · double X Power · Circle Guard · Square Run · Triangle Potion. D-pad/stick move only.',release:'Controller detected · release all controls to enable.',waiting:'Controller: pair with this browser device, then press a button.',unmapped:'Controller mapping unsupported. Touch/keyboard remain available.',paused:'Controller paused while page is inactive.',blocked:'Controller unavailable here. Try HTTPS/localhost; use touch controls.'};
  const text=(!navigator.getGamepads||!globalThis.isSecureContext)?'Controller unavailable in this context. Touch/keyboard work; try HTTPS/localhost.':descriptions[state.status];if($('pad-status').textContent!==text)$('pad-status').textContent=text;
  if(state.status!=='connected')battlePress.reset();
  if(busy||unavailable()){if(busy||!game.connected||!game.writable||game.state?.handheldBattle)battlePress.reset();return;}
  if(game.battle){
    if(state.edges.includes(4)||state.edges.includes(5)){const living=game.battle.enemies.filter(e=>e.hp>0).map(e=>e.id),current=living.indexOf(game.battle.target),delta=state.edges.includes(5)?1:living.length-1;game.select(living[(current+delta)%living.length]);sync();}
    const key=battlePress.read(state.edges,performance.now(),`${game.battle.id}:${game.battle.round}:${game.battle.target}:${game.state?.revision||'demo'}`);
    if(battlePress.pendingAt!==null){padAction=0;markPadAction();}
    if(key){padAction=actionKeys.indexOf(key);markPadAction();
      if(battleActionAllowed(key,game.hero,!!routeNodes().find(n=>n.id===game.battle.id)?.boss)){controlHintUntil=0;act(key);}
      else {controlHint=key==='run'?'Run unavailable during a boss fight. Use Guard or a Potion, or Home to rest.':key==='skill'?'No focus for Power Strike. Press Circle to Guard and restore focus.':'No potions remaining. Guard or return Home to rest.';controlHintUntil=performance.now()+2500;sync();setTimeout(()=>sync(),2550);}
    }
  }else{battlePress.reset();if(state.edges.includes(0)){if(home)depart();else if(game.result){if(game.result.type==='defeat')camp();else continueGame();}else engage();}}
}
const images=new Map();const embedded=JSON.parse($('embedded-assets').textContent);
async function image(name){if(!images.has(name)){const im=new Image();im.src='data:image/png;base64,'+embedded[name];await im.decode();images.set(name,im);}return images.get(name);}
function sprite(kind,frame=0){const prefix=kind==='slime'?'Slime-Blue':kind==='wolf'?'Dire-Wolf':'Goblin';return images.get(`${prefix}-${frame===0?'idle-0':frame===1?'idle-1':frame===4?'attack-1':frame===6?'hurt-0':'defeated-0'}.png`);}
function drawSprite(ctx,im,x,y,pivot,scale=1){ctx.drawImage(im,Math.round(x-pivot[0]*scale),Math.round(y-pivot[1]*scale),im.width*scale,im.height*scale);}
function button(label,fn,disabled=false,primary=false){const b=document.createElement('button');b.textContent=label;b.disabled=disabled||busy||unavailable();if(primary)b.className='primary';b.onclick=fn;return b;}
function sync(){
  journeyPosition();
  nearChest=nearbyChest(game,player);
  if(shownBattle()||game.result)home=false;
  const quest=questView(game);
  $('home').hidden=!home;canvas.hidden=home;
  $('rest-message').textContent=restMessage(restReason,quest.complete);
  $('quest-heading').textContent=quest.heading;$('quest-story').textContent=quest.story;
  $('quest-progress').textContent=quest.progress;$('quest-reward').textContent=quest.reward;
  $('depart').textContent=quest.depart;$('depart').disabled=!canDepart(game,busy||unavailable());
  $('hero').textContent=deviceMode&&!game.loaded?'No device hero loaded yet.':`Lv ${game.hero.level} · ${game.hero.xp} ${deviceMode?'shared':'demo'} XP · Browser HP ${playback?.frame.hp??game.hero.hp}/${game.maxHp()} · Focus ${game.hero.focus}/3 · Potions ${game.hero.potions}`;
  $('play-stats').textContent=$('hero').textContent;$('play-home').disabled=busy||unavailable();playNotice();
  if(deviceMode){$('progress-notice').textContent=`Shared hero · ${game.message} Route and browser battle state are saved on StickS3. Browser/handheld combat have separate HP; XP and level are shared. Hold the physical Face button to abandon a browser battle.`;$('progress-notice').style.borderColor=game.connected&&game.writable?'#45614a':'#de9e70';}
  $('log').replaceChildren(...game.log.map(line=>{const li=document.createElement('li');li.textContent=line;return li;}));
  $('route-list').replaceChildren(...routeNodes().map(n=>{const li=document.createElement('li');li.textContent=`${game.cleared.has(n.id)?'✓':'◇'} ${n.name}${n.boss?' · boss':''}`;return li;}));
  $('route-list').hidden=!!game.journey&&game.journey.mode!==1;
  $('actions').replaceChildren();$('targets').replaceChildren();$('camp').disabled=busy||unavailable();$('protagonist').disabled=!!game.battle||busy;
  const b=shownBattle(),r=game.result;$('mode').textContent=home?'OAKWOOD':b?'BATTLE':r?'RESULT':'EXPLORE';
  document.body.classList.toggle('in-battle',!!b);canvas.setAttribute('aria-label',b?'Turn-based battle. Select an enemy and choose an action.':'Forest route. Move with arrow keys or WASD. Use Engage near a visible enemy.');
  $('enemy-intent').hidden=!b;$('enemy-intent').setAttribute('role','status');
  $('touch-controls').hidden=home||!!b||!!r;$('actions').hidden=home||(!b&&!r);
  $('interact').disabled=busy||unavailable()||(!near&&!quest.complete)||!!b||!!r;$('interact').textContent=quest.complete?'Return to Oakwood':near?'Engage':'Approach enemy';
  if(nearChest){$('interact').textContent=canOpenChest(game,nearChest)?'Open chest · X':'Supplies full';$('interact').disabled=busy||unavailable()||!canOpenChest(game,nearChest);}
  for(const control of document.querySelectorAll('[data-move]'))control.disabled=!!b||!!r||busy||unavailable();
  // The overall theme continues across battle, exploration and Oakwood.
  $('scene-name').textContent=home?'Oakwood · a safe place to rest':b?`${routeNodes().find(n=>n.id===b.id).name} · round ${b.round}`:game.journey?.mode===2?'The short road home · walk left':game.journey?.outing?`Sunlit Forest · section ${game.journey.section+1} · tier ${game.journey.tier}`:'A Safe Road Home · Sunlit Forest';
  if(b){
    const intent=battleIntent(b),heavy=intent.threats.some(e=>e.heavy),full=document.createElement('span'),compact=document.createElement('span');
    full.className='intent-full';full.textContent=intent.text;compact.className='intent-compact';compact.textContent=`Round ${b.round} · ${heavy?'HEAVY STRIKE · ':''}Incoming: up to ${intent.total} HP · Guard: ${intent.guarded} HP · Your turn`;
    $('enemy-intent').replaceChildren(full,compact);$('enemy-intent').title=intent.text;$('enemy-intent').style.borderLeftColor=heavy?'#efac79':'#eacb84';
    $('status').textContent=b.enemies.some(e=>e.kind==='boss')&&b.round%3===0?'Heavy strike incoming — consider Guard. Take your time; enemies wait for your action.':'Your turn. No hurry—choose a target and action. Surviving enemies respond after your turn.';
    b.enemies.forEach((e,i)=>{const btn=button(`${e.name} ${i+1} · ${e.hp}/${e.maxHp} HP`,()=>{game.select(i);sync();},e.hp===0);btn.setAttribute('aria-pressed',String(b.target===i));$('targets').append(btn);});
    for(const [key,label]of [['attack','Attack · X'],['skill','Power · X×2 · 1 focus'],['guard','Guard · ○'],['item','Potion · △'],['run','Run · □']])$('actions').append(button(label,()=>act(key),(key==='skill'&&!game.hero.focus)||(key==='item'&&!game.hero.potions)||(key==='run'&&routeNodes().find(n=>n.id===b.id).boss),key==='attack'));
  }else if(r){
    $('status').textContent=r.type==='victory'?`${r.boss?(game.journey?.outing?'Boss defeated! ':'The road is safe! '):'Victory! '}+${r.xp} ${deviceMode?'shared XP · saved on StickS3.':'demo XP.'} Recovered up to 6 HP. ${r.boss?(game.journey?.outing?'Continue the journey, or head home for a rest.':'Return to Oakwood for a warm welcome.'):''}`:r.type==='defeat'?'Nova needs a rest. Return to Oakwood; earned XP and cleared encounters are kept.':'Escaped safely. The encounter remains on the route.';
    if(r.type==='defeat')$('actions').append(button('Return to Oakwood',()=>camp(),false,true));
    else {$('actions').hidden=true;$('status').textContent+=' Returning to exploration automatically…';}
  }else{
    $('status').textContent=home?quest.complete?'Quest complete. Revisit the peaceful woodland whenever you like; progress and rewards stay unchanged.':'Rest here, then continue whenever you like. Device-hosted progress is saved; there is no penalty for being away.':quest.complete?'The woodland road is safe. Explore freely, then use Return to Oakwood (or Space / controller Cross) to rest. No encounters reset and no extra XP is awarded.':near?`${near.name} blocks the trail. Defeat ${near.kinds.map(k=>ENEMY_LABEL[k]).join(' + ')} to pass. Choose Engage.`:'Follow the forest path. Each undefeated encounter blocks the trail; you cannot walk around it.';
    $('actions').append(button(quest.complete?'Return to Oakwood':near?'Engage encounter':'Approach an enemy',()=>engage(),!near&&!quest.complete,true));
  }
  if(game.journey?.outing&&!b&&!r&&!home){
    const returning=game.journey.mode===2;
    $('status').textContent=returning?'A peaceful path home. Walk left to return to A Moment in Oakwood. No enemies, no extra rewards.':near?`${near.name} blocks the road. Defeat the encounter to continue right, or turn back left for home.`:game.frontier()?'Follow the road right. Turn back through the left edge whenever you need a rest.':'This section is clear. Keep walking right; the next stretch awaits.';
  }
  $('camp').textContent=home?'Rest in Oakwood':game.journey?.mode===2?'Finish returning home':game.battle?'Abandon battle / rest':'Head home · short safe path';
  if(nearChest){$('status').textContent=canOpenChest(game,nearChest)?'A roadside chest! Press X, Space, or Open chest to collect supplies.':'Your supplies are full. This optional chest stays closed; you can leave it behind.';}
  if(!b&&!r&&performance.now()<lootMessageUntil)$('status').textContent=lootMessage;
  if(playback){$('status').textContent=playback.frame.text;$('enemy-intent').textContent=playback.frame.text;}
  else if(b&&performance.now()<controlHintUntil){$('status').textContent=controlHint;$('enemy-intent').textContent=controlHint;}
  markPadAction();
}
const ENEMY_LABEL={slime:'Slime',wolf:'Wolf',goblin:'Goblin',boss:'Captain'};
async function transact(fn,keepMovement=false){if(busy||unavailable())return false;busy=true;if(!keepMovement)clearInput();sync();try{return await fn();}finally{busy=false;sync();}}
async function engage(){
  const chest=nearbyChest(game,player);if(chest){if(!canOpenChest(game,chest))return;const before={...game.hero};if(await transact(()=>game.openChest())){const hp=game.hero.hp-before.hp,potions=game.hero.potions-before.potions;lootMessage=`Chest opened · ${potions?'+1 potion':`+${hp} HP`}${deviceMode?' · saved on StickS3.':'. Demo supplies only.'}`;lootMessageUntil=performance.now()+3500;sync();}return;}
  if(!game.battle&&!game.result&&questView(game).complete)return camp();if(!near||!renderer)return;const node=near;if(await transact(()=>game.start(node.id))){padAction=-1;controlHintUntil=0;player.walking=false;sync();}
}
function act(key){if(busy||unavailable()||!game.battle)return;transact(async()=>{
  const original=game.battle,before={...structuredClone(original),hp:game.hero.hp,maxHp:game.maxHp()};
  // The device resolves/persists first. Failed or uncertain commands never animate invented hits.
  const ok=await game.act(key);if(!ok)return false;
  const after={hp:game.hero.hp,result:game.result?.type,enemyHp:game.state?.enemyHp|| (game.battle||original).enemies.map(e=>e.hp)};
  try{for(const frame of turnFrames(before,after,key)){
    if(document.hidden||!active)break;
    playback={battle:{...before,enemies:frame.enemies},frame,at:performance.now()};sync();
    await new Promise(resolve=>setTimeout(resolve,restReduced.matches?160:frame.duration));
  }}finally{playback=null;}return true;
});}
async function camp(){
  if(game.journey?.mode===1&&!game.battle&&game.result?.type!=='defeat')return transact(()=>game.returnHome());
  const reason=game.result?.type==='defeat'?'defeat':'rest';if(await transact(()=>game.camp())){restReason=reason;home=true;restScene?.enter(performance.now());player.u=75;player.v=256;near=null;clearInput();sync();}
}
async function depart(){if(!canDepart(game,busy||unavailable()))return;if(game.journey&&!game.journey.mode){if(!await transact(()=>game.depart()))return;}home=false;near=null;clearInput();sync();}
$('depart').onclick=depart;
async function continueGame(){if(!game.journey?.outing&&game.result?.boss&&game.result.type==='victory')return camp();if(await transact(()=>game.continue())){near=null;sync();}}
$('interact').onclick=engage;
$('camp').onclick=camp;$('protagonist').onchange=e=>{player.protagonist=e.target.value;};
const direction={ArrowLeft:'west',a:'west',ArrowRight:'east',d:'east',ArrowUp:'north',w:'north',ArrowDown:'south',s:'south'};
addEventListener('keydown',e=>{if(/INPUT|SELECT|TEXTAREA|BUTTON/.test(document.activeElement?.tagName))return;const d=direction[e.key]||direction[e.key.toLowerCase()];if(d){e.preventDefault();keys.add(d);}if(e.code==='Space'){e.preventDefault();if(!e.repeat){if(home)depart();else engage();}}});
addEventListener('keyup',e=>{const d=direction[e.key]||direction[e.key.toLowerCase()];if(d)keys.delete(d);});
for(const b of document.querySelectorAll('[data-move]')){
  b.onpointerdown=e=>{if(b.disabled)return;e.preventDefault();b.setPointerCapture(e.pointerId);held.down(e.pointerId,b.dataset.move);b.classList.add('is-held');};
  for(const name of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(name,e=>{held.up(e.pointerId);if(!held.directions().has(b.dataset.move))b.classList.remove('is-held');});
}
canvas.addEventListener('pointerup',e=>{if(!game.battle||busy)return;
  const point=canvasPoint(e.clientX,e.clientY,canvas.getBoundingClientRect(),canvas.clientWidth,canvas.clientHeight,playScreen.active&&matchMedia('(orientation: portrait)').matches);
  const view=battleViewport(canvas.clientWidth,canvas.clientHeight),x=(point.x-view.x)/view.scale,y=(point.y-view.y)/view.scale;
  const region=targetRegions.find(r=>x>=r.x-65&&x<=r.x+65&&y>=r.y-180&&y<=r.y+15);if(region&&game.select(region.index))sync();
});
function battleDraw(time){
  const ctx=canvas.getContext('2d'),w=canvas.clientWidth,h=canvas.clientHeight,ratio=Math.min(devicePixelRatio||1,2);
  canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);ctx.fillStyle='#10261b';ctx.fillRect(0,0,w,h);
  const view=battleViewport(w,h);ctx.setTransform(ratio*view.scale,0,0,ratio*view.scale,ratio*view.x,ratio*view.y);ctx.imageSmoothingEnabled=false;
  const b=shownBattle(),frame=playback?.frame,progress=playback?(time-playback.at)/(restReduced.matches?160:frame.duration):0;
  const scene=battleScene(),groundScale=scene.groundScale;
  ctx.save();ctx.beginPath();ctx.rect(0,0,BATTLE_WIDTH,BATTLE_HEIGHT);ctx.clip();
  ctx.fillStyle='#10261b';ctx.fillRect(0,0,BATTLE_WIDTH,BATTLE_HEIGHT);
  for(const block of blocks.filter(block=>block.x===0||block.x===1))ctx.drawImage(block.asset.groundInfo.image,block.x*512*groundScale,scene.groundY,512*groundScale,288*groundScale);
  ctx.restore();ctx.fillStyle='#07181020';ctx.fillRect(0,0,BATTLE_WIDTH,BATTLE_HEIGHT);
  const attack=frame?.kind==='hero'&&['attack','skill'].includes(frame.action),sex=player.protagonist;
  const im=sex==='female'&&attack?images.get('Nova-female-v2-attack-east-1.png'):images.get(sex==='female'?'Nova-female-v2-east-idle-0.png':'Nova-male-east-1.png');
  const hit=frame?.kind==='enemy'&&progress>.4&&progress<.7;
  ctx.globalAlpha=hit&&!restReduced.matches ? .55 : 1;
  drawSprite(ctx,im,140+(attack?lunge(progress,restReduced.matches)*.4:0),scene.feetY,sex==='female'&&attack?[40,56]:[16,44],scene.heroScale);ctx.globalAlpha=1;
  targetRegions=[];
  b.enemies.forEach((e,i)=>{const x=b.enemies.length===1?570:490+i*145,y=scene.feetY+(i%2)*15;
    const striking=frame?.kind==='enemy'&&frame.slot===e.id,hurt=attack&&frame.target===i;
    if(e.hp>0)targetRegions.push({index:i,x,y});drawSprite(ctx,sprite(e.kind,e.hp===0?7:striking?4:hurt?6:Math.floor(time/350)%2),x-(striking?lunge(progress,restReduced.matches):0),y,e.kind==='slime'?[24,42]:[32,42],e.kind==='boss'?scene.enemyScale*1.45:scene.enemyScale);
    ctx.fillStyle=e.hp===0?'#9caa94':i===b.target?'#ffe2a1':'#eef1dd';ctx.font='16px system-ui';ctx.textAlign='center';ctx.fillText(`${e.name} · ${e.hp} HP`,x,22);if(i===b.target&&e.hp>0)ctx.fillText('▼',x,46);
    if(hurt&&frame.damage)damageText(ctx,`−${frame.damage}`,x,82-progress*20,'#fff0b8');});
  if(hit)damageText(ctx,`−${frame.damage}`,140,85-progress*20,'#ffb5a2');
  ctx.textAlign='left';ctx.fillStyle='#ecddac';ctx.font='16px Georgia';ctx.fillText(`NOVA · ${frame?.hp??game.hero.hp}/${game.maxHp()} HP`,75,205);
  if(frame){ctx.textAlign='center';ctx.font='18px system-ui';ctx.fillText(frame.text,384,235);}
}
function damageText(ctx,text,x,y,color){ctx.save();ctx.font='bold 28px system-ui';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#14241b';ctx.strokeText(text,x,y);ctx.fillStyle=color;ctx.fillText(text,x,y);ctx.restore();}
function loop(time){const dt=Math.min((time-clock)/1000,.04);clock=time;
  if(canAutoResume(game,busy||unavailable()||!active||document.hidden))continueGame();
  pollPad();
  if(home){restScene?.draw(time,player.protagonist,{paused:restPaused,reduced:restReduced.matches,hidden:document.hidden});requestAnimationFrame(loop);return;}
  if(shownBattle())battleDraw(time);
  else{
    player.walking=false;
    if(!game.result&&!busy&&!unavailable()&&active&&!document.hidden){const dirs=new Set([...keys,...held.directions()]);let dx=Number(dirs.has('east'))-Number(dirs.has('west'))||padMove.x,dy=Number(dirs.has('south'))-Number(dirs.has('north'))||padMove.y;
      if(dx||dy){const norm=Math.hypot(dx,dy);player.direction=Math.abs(dx)>=Math.abs(dy)?(dx>0?'east':'west'):(dy>0?'south':'north');const before=[player.u,player.v];moveAlongRoute(world,game,player,dx/norm*145*dt,dy/norm*145*dt);player.walking=before[0]!==player.u||before[1]!==player.v;
        if(game.journey?.outing){if(dx<0&&player.u<=10)camp();else if(dx>0&&player.u>=1024-1e-6&&game.journey.mode===1)transact(()=>game.advance(),true);}
      }
      const frontier=game.frontier(),next=frontier&&Math.hypot(frontier.u-player.u,(frontier.v-player.v)*9/16)<55?frontier:null;if(next?.id!==near?.id){near=next;sync();}
      const nextChest=nearbyChest(game,player);if(nextChest?.id!==nearChest?.id){nearChest=nextChest;sync();}
    }
    camera.x+=((game.journey?.outing?player.u:Math.max(384,Math.min(640,player.u)))-camera.x)*Math.min(1,dt*8);
    const zoom=explorationZoom(canvas.clientWidth,canvas.clientHeight);
    renderer.draw(blocks,player,{zoom,camera,characterScale:1.5,grid:false,seams:false},time);
    const ctx=renderer.ctx,w=canvas.clientWidth,h=canvas.clientHeight;
    if(showOakwoodMarker(game.journey)){
      const exit=screenPosition(25,256,camera,w,h,zoom);ctx.font='13px system-ui';ctx.textAlign='left';ctx.fillStyle='#ffe2a1';ctx.fillText('← OAKWOOD',exit.x,exit.y-45*zoom);
    }
    const frontier=game.frontier();
    const chest=game.chest?.();if(chest){const p=screenPosition(chest.u,chest.v,camera,w,h,zoom);drawChest(ctx,chest,p.x,p.y,zoom);}
    if(frontier){const p=screenPosition(frontier.u-42,frontier.v,camera,w,h,zoom);ctx.save();ctx.strokeStyle='#f2cc7e';ctx.setLineDash([4,5]);ctx.beginPath();ctx.moveTo(p.x,p.y-30*zoom);ctx.lineTo(p.x,p.y+30*zoom);ctx.stroke();ctx.restore();}
    for(const n of game.journey?.mode===2?[]:routeNodes()){if(game.cleared.has(n.id))continue;const p=screenPosition(n.u,n.v,camera,w,h,zoom);drawSprite(ctx,sprite(n.kinds[0],Math.floor(time/350)%2),p.x,p.y,n.kinds[0]==='slime'?[24,42]:[32,42],(n.boss?1.7:1.3)*zoom);if(n.kinds.length>1)drawSprite(ctx,sprite('wolf'),p.x+22*zoom,p.y+12*zoom,[32,42],1.1*zoom);ctx.font='12px system-ui';ctx.textAlign='center';ctx.fillStyle='#fff0b8';ctx.fillText(n.boss?'BOSS':n.kinds.length>1?'WOLVES':n.name.toUpperCase(),p.x,p.y-65*zoom);}
  }
  requestAnimationFrame(loop);
}
try{
  loaded=await loadBuiltins();if(loaded.issues.length)throw new Error(loaded.issues.map(i=>i.message).join('; '));
  blocks=[-1,0,1,2,3].map(x=>({x,y:0,asset:loaded.registry.get(`F002-Sunlit-Forest-${x%2===0?'Left':'Right'}`)}));
  const issues=validateLayout(blocks);if(issues.length)throw new Error(issues.map(i=>i.message).join('; '));
  world={block(x,y){if(y!==0)return {asset:{navigation:{cells:Array.from({length:32},()=>Array(32).fill(0))},manifest:{objects:[]}}};return {x,y:0,asset:loaded.registry.get(`F002-Sunlit-Forest-${x%2===0?'Left':'Right'}`)};}};
  await Promise.all(Object.keys(embedded).filter(n=>/^(Slime-Blue|Dire-Wolf|Goblin)-.*\.png$/.test(n)||n==='Nova-female-v2-east-idle-0.png'||n==='Nova-male-east-1.png'||n==='Nova-female-v2-attack-east-1.png').map(image));
  renderer=new Renderer(canvas);renderer.characters=loaded.characters;
  // Optional presentation cannot block gameplay or durable rest transactions.
  try{const manifest=JSON.parse(atob(embedded['rest.json']));await Promise.all([manifest.background,...Object.values(manifest.characters).flatMap(c=>c.frames.map(f=>f.file))].map(image));restScene=new RestScene($('rest-scene'),manifest,images);restScene.enter(performance.now());$('rest-art').hidden=false;}
  catch{$('rest-art').hidden=true;$('rest-message').textContent='Oakwood is ready. Rest artwork unavailable; gameplay and saves remain available.';}
  if(deviceMode){game.onchange=()=>{const frontier=game.frontier();if(frontier)player.u=Math.min(player.u,frontier.u-42);near=null;sync();};await game.refresh();setInterval(()=>{if(!busy)game.refresh();},1500);}
  if(deviceMode){document.querySelector('footer').textContent='StickS3 saves journey section, road tier, encounters, battles and shared XP. Exact walking position and visual protagonist choice are not saved; reconnect resumes at the current section entrance (or short return path), never rerolling it. No cloud or Internet required.';}
  sync();requestAnimationFrame(loop);
}catch(e){$('status').textContent=`Cannot start: ${e.message}. Asset validation was not bypassed.`;console.error(e);}
