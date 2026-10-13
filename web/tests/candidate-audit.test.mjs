import test from 'node:test';import assert from 'node:assert/strict';import {auditSharedBorders}from '../src/candidate-audit.js';
import {execFileSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
const image=()=>({width:512,height:288,pixels:new Uint8Array(512*288*4)});
test('shared border audit reports exact directional/corner contradictions without relaxing validators',()=>{const a=image(),b=image();assert.ok(auditSharedBorders(a,b).every(v=>v.mismatchedPixels===0));b.pixels[0]=1;const differences=auditSharedBorders(a,b);for(const d of ['north','west','nw'])assert.equal(differences.find(v=>v.direction===d).mismatchedPixels,1);assert.equal(differences.find(v=>v.direction==='east').mismatchedPixels,0);});
test('shared border audit rejects incorrect dimensions',()=>assert.throws(()=>auditSharedBorders({...image(),width:1024},image())));
test('candidate browser entry parses',()=>execFileSync(process.execPath,['--check',fileURLToPath(new URL('../src/candidate-review.js',import.meta.url))]));
