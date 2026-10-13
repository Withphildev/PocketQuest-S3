import test from 'node:test';
import assert from 'node:assert/strict';
import {validateCharacterManifest, loadCharacters, characterFrame} from '../src/characters.js';
const manifest = () => ({schemaVersion:1,frameSize:[32,48],pivot:[16,44],protagonists:Object.fromEntries(['female','male'].map(sex=>[sex,Object.fromEntries(['north','east','south','west'].map(dir=>[dir,Array.from({length:4},(_,i)=>`${sex}-${dir}-${i}.png`)]))]))});
test('animated manifest requires exactly four valid filenames per direction',()=>{
  validateCharacterManifest(manifest());
  for(const frames of [[],['one.png'],[null,null,null,null],['../bad.png','b.png','c.png','d.png']]) {
    const m=manifest();m.protagonists.female.south=frames;assert.throws(()=>validateCharacterManifest(m));
  }
});
test('32 animated frames load with fixed transparent geometry',async()=>{
  const m=manifest(),names=[];
  const chars=await loadCharacters(async name=>{names.push(name);return name},m,async image=>({width:32,height:48,transparent:true,hasVisiblePixels:true,image}));
  assert.equal(names.length,32);assert.equal(chars.male.west.length,4);
});
test('walking cycles four frames; idle holds passing pose; logical player unchanged',()=>{
  const characters={female:{south:['a','b','c','d']}},p={protagonist:'female',direction:'south',walking:true,u:128,v:160};
  assert.deepEqual([0,140,280,420,560].map(t=>characterFrame(characters,p,t)),['a','b','c','d','a']);
  assert.equal(characterFrame(characters,{...p,walking:false},420),'b');
  assert.equal(p.u,128);assert.equal(p.v,160);
});
test('optional four-frame idle loops load separately and preserve legacy walking behavior',async()=>{
  const m=manifest();m.idle={female:Object.fromEntries(['north','east','south','west'].map(d=>[d,Array.from({length:4},(_,i)=>`idle-${d}-${i}.png`)]))};
  const chars=await loadCharacters(async name=>name,m,async image=>({width:32,height:48,transparent:true,hasVisiblePixels:true,image}));
  const p={protagonist:'female',direction:'south',walking:false};
  assert.equal(characterFrame(chars,p,700).image,'idle-south-2.png');
  assert.equal(characterFrame(chars,{...p,walking:true},280).image,'female-south-2.png');
  assert.equal(characterFrame(chars,{...p,protagonist:'male'},700).image,'male-south-1.png');
  m.idle.female.west=['broken.png'];assert.throws(()=>validateCharacterManifest(m),/idle/);
});
