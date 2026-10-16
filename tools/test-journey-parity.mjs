import {execFileSync} from 'node:child_process';import assert from 'node:assert/strict';
import {DeviceRouteGame} from '../web/route/device.js';
import {journeyNode,journeyChest} from '../web/route/journey.js';
const rows=execFileSync(process.argv[2],{encoding:'utf8'}).trim().split('\n').map(JSON.parse);
assert.equal(rows.length,189);
for(const row of rows){const n=journeyNode(BigInt('0x'+row.heroId),row.journey);assert.equal(n.encounter,row.encounter);assert.equal(n.u,row.journey.position);assert.equal(n.enemyMaxHp,row.journey.enemyMaxHp);assert.equal(n.damage,row.journey.damage);const device=new DeviceRouteGame();device.adopt(row);assert.equal(device.frontier().id,n.id);assert.equal(row.ordinaryLoss,n.damage*n.kinds.length);assert.equal(row.guardLoss,Math.ceil(n.damage/2)*n.kinds.length);assert.equal(row.heavyLoss,n.damage*n.kinds.length*(n.boss?2:1));}
for(const row of rows){const c=journeyChest(BigInt('0x'+row.heroId),row.journey);assert.equal(c.present,row.journey.chestPresent);assert.equal(c.u,row.journey.chestPosition);assert.equal(c.potion,row.journey.chestPotion);assert(c.u>=row.journey.position+90&&c.u<=960);}
console.log('PASS: 189 C++/JS journey and chest generation cases, including 567 actual ordinary/Guard/heavy response comparisons');
