import test from 'node:test';import assert from 'node:assert/strict';
import {PlayScreen,battleViewport,canvasPoint,BATTLE_WIDTH,BATTLE_HEIGHT} from '../route/fullscreen.js';
import {PadReader} from '../route/controls.js';
import {readFile} from 'node:fs/promises';
function fixture({deny=false,lockDeny=false}={}){
 const listeners=new Map(),events=[],counts={native:0,exit:0,lock:0,unlock:0};
 const doc={fullscreenElement:null,addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name)};
 doc.documentElement={async requestFullscreen(){counts.native++;if(deny)throw Error('gesture required');doc.fullscreenElement=this;listeners.get('fullscreenchange')?.();}};
 doc.exitFullscreen=async()=>{counts.exit++;doc.fullscreenElement=null;listeners.get('fullscreenchange')?.();};
 const screen={orientation:{async lock(value){assert.equal(value,'landscape');counts.lock++;if(lockDeny)throw Error('unsupported');},unlock(){counts.unlock++;}}};
 const control=new PlayScreen({doc,screen,onChange:(...args)=>events.push(args)});return {control,doc,counts,listeners,events};
}
test('controller connection expands CSS view without needing native fullscreen; disconnect restores touch view',()=>{
 const f=fixture();f.control.setConnected(true);assert(f.control.active);assert.equal(f.counts.native,0);f.control.setConnected(true);assert.equal(f.events.length,2);f.control.setConnected(false);assert(!f.control.active);assert(!f.control.connected);
});
test('native entry/landscape lock and browser Escape exit are synchronized',async()=>{
 const f=fixture();assert(await f.control.enter());assert.equal(f.counts.lock,1);assert(f.control.owned);
 f.doc.fullscreenElement=null;f.listeners.get('fullscreenchange')();assert(!f.control.active);assert.equal(f.counts.unlock,1);
 await f.control.enter();await f.control.toggle();assert(!f.control.active);assert.equal(f.counts.exit,1);await f.control.dispose();assert.equal(f.listeners.size,0);
});
test('fullscreen/rotation denial keeps CSS play mode and an explicit exit',async()=>{
 const f=fixture({deny:true});await f.control.enter();assert(f.control.active);assert(!f.control.owned);assert.equal(f.counts.lock,0);await f.control.exit();assert(!f.control.active);
 const g=fixture({lockDeny:true});await g.control.enter();assert(g.control.active);assert(g.control.owned);await g.control.exit();assert.equal(g.counts.exit,1);
});
test('late fullscreen permission cannot trap a view exited while request was pending',async()=>{
 const f=fixture();let finish;f.doc.documentElement.requestFullscreen=()=>new Promise(resolve=>{finish=()=>{f.doc.fullscreenElement=f.doc.documentElement;resolve();};});
 const entered=f.control.enter();await f.control.exit();finish();await entered;assert(!f.control.active);assert.equal(f.doc.fullscreenElement,null);
});
test('no native API still has Escape and never exits someone else’s fullscreen',async()=>{
 const f=fixture();delete f.doc.documentElement.requestFullscreen;await f.control.enter();assert(f.control.active);f.listeners.get('keydown')({key:'Escape'});assert(!f.control.active);
 const g=fixture();g.doc.fullscreenElement={other:true};assert(!await g.control.enter());assert.equal(g.counts.exit,0);
});
test('letterbox sizing preserves battle proportions and normal/rotated touch targeting',()=>{
 for(const [w,h]of [[768,384],[1280,240],[844,180],[390,700]]){const v=battleViewport(w,h);assert(v.x>=0&&v.y>=0);assert(BATTLE_WIDTH*v.scale<=w+1e-8&&BATTLE_HEIGHT*v.scale<=h+1e-8);}
 const rect={left:10,top:20,right:210,width:200,height:400};
 assert.deepEqual(canvasPoint(110,220,rect,400,200,true),{x:200,y:100});
 assert.deepEqual(canvasPoint(110,220,rect,200,400,false),{x:100,y:200});
});
test('L2 analog trigger has one edge and still requires release after connection',()=>{
 const pad=value=>({mapping:'standard',connected:true,id:'DualSense test',index:0,axes:[0,0],buttons:Array.from({length:16},(_,i)=>({pressed:false,value:i===6?value:0}))});
 const reader=new PadReader();assert.deepEqual(reader.read([pad(.8)]).edges,[]);reader.read([pad(0)]);assert.deepEqual(reader.read([pad(.8)]).edges,[6]);assert.deepEqual(reader.read([pad(.8)]).edges,[]);
});
test('complete play area contains essential HUD/actions/home/audio/exit, not just canvas',async()=>{
 const html=await readFile(new URL('../route/index.html',import.meta.url),'utf8'),app=await readFile(new URL('../route/app.js',import.meta.url),'utf8');
 const shell=html.split('id="play-shell"',2)[1].split('<aside>',1)[0];
 for(const id of ['play-exit','play-native','play-music','play-home','play-stats','play-notice','home','game','enemy-intent','targets','actions','touch-controls'])assert(shell.includes(`id="${id}"`),id);
 assert(html.includes('body.play-mode.has-pad .controls{display:none}'));assert(html.includes('rotate(90deg)'));
 assert(app.includes('if(state.edges.includes(6)){playScreen.toggle();return;}'));assert(app.includes("if(state.status!=='paused')playScreen.setConnected"));
 assert(app.includes('battleViewport(w,h)'));assert(app.includes('canvasPoint(e.clientX,e.clientY'));
});
