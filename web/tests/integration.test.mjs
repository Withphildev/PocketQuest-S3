import test from 'node:test';
import assert from 'node:assert/strict';
import {validateMaster, validateRoadMask} from '../src/sunlit.js';
import {validateCharacterManifest, validateCharacterImage, loadCharacters} from '../src/characters.js';
import {Renderer} from '../src/renderer.js';
const master = () => { const pixels = new Uint8Array(1024 * 288 * 4); for(let i=3;i<pixels.length;i+=4) pixels[i]=255; return {width:1024,height:288,pixels}; };
const mask = () => { const m=master(); for(let y=126;y<162;y++) for(let x=0;x<1024;x++) {const p=(y*1024+x)*4;m.pixels[p]=m.pixels[p+1]=m.pixels[p+2]=255;} return m; };
const manifest = () => ({schemaVersion:1,frameSize:[32,48],pivot:[16,44],protagonists:Object.fromEntries(['female','male'].map(sex=>[sex,Object.fromEntries(['north','east','south','west'].map(dir=>[dir,`${sex}-${dir}.png`]))]))});
test('master contract rejects incorrect generated/reference dimensions and nonopaque ground',()=>{
  validateMaster(master()); for(const [width,height] of [[2048,768],[2078,757],[1024,384],[512,288]]) assert.throws(()=>validateMaster({...master(),width,height}));
  const bad=master(); bad.pixels[3]=254; assert.throws(()=>validateMaster(bad),/opaque/);
});
test('semantic road mask enforces all outer and center collars and no N/S exits',()=>{
  validateRoadMask(mask()); for(const x of [0,31,480,511,512,543,992,1023]){const bad=mask();bad.pixels[(126*1024+x)*4]=bad.pixels[(126*1024+x)*4+1]=bad.pixels[(126*1024+x)*4+2]=0;assert.throws(()=>validateRoadMask(bad),/opening/);}
  const bad=mask();bad.pixels[(50*1024+200)*4]=127;assert.throws(()=>validateRoadMask(bad),/binary/);
  const exit=mask();exit.pixels[200*4]=exit.pixels[200*4+1]=exit.pixels[200*4+2]=255;assert.throws(()=>validateRoadMask(exit),/north\/south/);
});
test('both Nova protagonists require four frames, fixed size and fixed pivot',()=>{
  validateCharacterManifest(manifest());const m=manifest();delete m.protagonists.male.west;assert.throws(()=>validateCharacterManifest(m),/male\/west/);
  assert.throws(()=>validateCharacterManifest({...manifest(),pivot:[16,48]}));assert.throws(()=>validateCharacterManifest({...manifest(),frameSize:[64,96]}));
  validateCharacterImage({width:32,height:48,transparent:true,hasVisiblePixels:true});
  for(const change of [{width:64},{transparent:false},{hasVisiblePixels:false}]) assert.throws(()=>validateCharacterImage({width:32,height:48,transparent:true,hasVisiblePixels:true,...change}));
});
test('external Nova files load independently of scenery and reject malformed frames',async()=>{
  const names=[];const chars=await loadCharacters(async name=>{names.push(name);return name},manifest(),async image=>({width:32,height:48,transparent:true,hasVisiblePixels:true,image}));
  assert.equal(names.length,8);assert.equal(chars.male.west.image,'male-west.png');
  await assert.rejects(loadCharacters(async()=>null,manifest(),async()=>({width:33,height:48,transparent:true,hasVisiblePixels:true})),/32×48/);
});
test('renderer draws imported Nova at (16,44) foot pivot with no resize or collision mutation',()=>{
  const calls=[],r=Object.create(Renderer.prototype);r.ctx={drawImage:(...args)=>calls.push(args)};r.characters={female:{south:{image:'frame'}}};
  const p={protagonist:'female',direction:'south',u:128,v:125};r.nova(10,20,p,0);
  assert.deepEqual(calls,[['frame',-6,-24]]);assert.deepEqual(p,{protagonist:'female',direction:'south',u:128,v:125});
});
