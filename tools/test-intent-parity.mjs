import {execFileSync} from 'node:child_process';import assert from 'node:assert/strict';
import {ROUTE,ENEMIES} from '../web/route/game.js';import {battleIntent} from '../web/route/combat-intent.js';
assert(process.argv[2],'Pass compiled actual-core parity test');
const rows=execFileSync(process.argv[2],{encoding:'utf8'}).trim().split('\n').map(JSON.parse);assert.equal(rows.length,48);
for(const [encounter,round,guard,actual] of rows){const b={round,enemies:ROUTE[encounter].kinds.map((kind,id)=>({...ENEMIES[kind],kind,id}))};const intent=battleIntent(b);assert.equal(guard?intent.guarded:intent.total,actual,`${encounter}:${round}:${guard}`);}
console.log('PASS: 48 browser intent predictions match real C++ enemy responses, including group Guard rounding and captain heavy cadence');
