import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {restFrame,restFade,restMessage,validateRest,RestScene} from '../route/rest.js';
const folder=new URL('../build/oakwood-rest/',import.meta.url),m=JSON.parse(await readFile(new URL('rest.json',folder),'utf8'));
const images=new Map();
for(const name of [m.background,...Object.values(m.characters).flatMap(c=>c.frames.map(f=>f.file))]){const png=await readFile(new URL(name,folder));assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');images.set(name,{width:png.readUInt32BE(16),height:png.readUInt32BE(20)});}
test('rest frame respects pause, away and reduced motion',()=>{assert.equal(restFrame(0),0);assert.equal(restFrame(1400),1);assert.equal(restFrame(2800),0);for(const key of ['paused','hidden','reduced'])assert.equal(restFrame(1500,{[key]:true}),0);});
test('rest fade is bounded and cannot delay actions',()=>{assert.equal(restFade(0,0),1);assert.equal(restFade(225,0),.5);assert.equal(restFade(900,0),0);assert.equal(restFade(0,0,true),0);});
test('rest assets use shared background and exact validated frame geometry',()=>{assert.equal(validateRest(m,images),m);const bad=structuredClone(m);bad.characters.male.frames.pop();assert.throws(()=>validateRest(bad,images));const missing=new Map(images);missing.delete(m.background);assert.throws(()=>validateRest(m,missing));});
test('higher-resolution rest uses exact export geometry and rejects old or mismatched exports',()=>{
 assert.deepEqual(m.size,[512,288]);assert.deepEqual(m.seat,[522*32/105,602*32/105]);
 for(const [sex,width,height] of [['female',120,164],['male',128,172]])for(const f of m.characters[sex].frames){assert.equal(images.get(f.file).width,width);assert.equal(images.get(f.file).height,height);}
 const old=structuredClone(m);old.size=[320,180];assert.throws(()=>validateRest(old,images));
 const badImages=new Map(images);badImages.set(m.background,{width:320,height:180});assert.throws(()=>validateRest(m,badImages));
 const badSeat=structuredClone(m);badSeat.seat[0]=641;assert.throws(()=>validateRest(badSeat,images));
 const calls=[],ctx={clearRect(...args){calls.push(args);},drawImage(){},fillRect(...args){calls.push(args);}},canvas={getContext(){return ctx;}};
 const scene=new RestScene(canvas,m,images);assert.equal(canvas.width,512);assert.equal(canvas.height,288);scene.enter(0);scene.draw(100,'female');assert.deepEqual(calls,[[0,0,512,288],[0,0,512,288]]);
});
test('both protagonists draw using seated pivots without mutating state',()=>{const calls=[],ctx={clearRect(){},drawImage(...a){calls.push(a);},fillRect(){}};const c={getContext(){return ctx;}};const r=new RestScene(c,m,images);r.enter(0);for(const sex of ['female','male']){r.draw(1500,sex);assert.equal(calls.at(-1)[0],images.get(m.characters[sex].frames[1].file));}assert.equal(restMessage('defeat',false),'A little rest, then another adventure.');assert.equal(restMessage('rest',true),'Home again. The road is safe.');});
test('rest presentation cannot fetch, save, modify XP or introduce waits',async()=>{const s=await readFile(new URL('../route/rest.js',import.meta.url),'utf8');for(const word of ['fetch(','setTimeout(','localStorage','game.camp','game.hero'])assert(!s.includes(word));const app=await readFile(new URL('../route/app.js',import.meta.url),'utf8');assert(app.includes('if(await transact(()=>game.camp())){restReason=reason;home=true;restScene?.enter'));});
