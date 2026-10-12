// Test-only import fixture: existing engineering artwork, NOT authored Sunlit scenery.
import './export-calibration-kit.mjs';
import {readFileSync, writeFileSync, cpSync, mkdirSync, unlinkSync} from 'node:fs';
import {inflateSync, deflateSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),out=`${root}/build/integration-fixture`;
mkdirSync(out,{recursive:true});cpSync(`${root}/build/calibration-kit`,out,{recursive:true});
function crc(b){let c=0xffffffff;for(const v of b){c^=v;for(let i=0;i<8;i++)c=(c>>>1)^(c&1?0xedb88320:0);}return(c^0xffffffff)>>>0;}
function chunk(type,data){const t=Buffer.from(type),h=Buffer.alloc(4),c=Buffer.alloc(4);h.writeUInt32BE(data.length);c.writeUInt32BE(crc(Buffer.concat([t,data])));return Buffer.concat([h,t,data,c]);}
function png(name,width,height,pixels){const header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=6;const rows=Buffer.alloc(height*(width*4+1));for(let y=0;y<height;y++)pixels.copy(rows,y*(width*4+1)+1,y*width*4,(y+1)*width*4);writeFileSync(`${out}/${name}`,Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]));}
const b=readFileSync(`${root}/assets/F002-east-west.png`),parts=[];for(let p=8;p<b.length;){const n=b.readUInt32BE(p);if(b.toString('ascii',p+4,p+8)==='IDAT')parts.push(b.subarray(p+8,p+8+n));p+=n+12;}
const scan=inflateSync(Buffer.concat(parts)),ground=Buffer.alloc(1024*288*4),mask=Buffer.alloc(ground.length);
for(let y=0;y<288;y++){if(scan[y*2049]!==0)throw Error('Only bundled filter-0 fixture supported');for(const x of [0,512])scan.copy(ground,(y*1024+x)*4,y*2049+1,(y+1)*2049);for(let x=0;x<1024;x++){const p=(y*1024+x)*4;mask[p]=mask[p+1]=mask[p+2]=(y>=126&&y<162)?255:0;mask[p+3]=255;}}
png('F002-Sunlit-Forest-Master.png',1024,288,ground);png('F002-Sunlit-Forest-RoadMask.png',1024,288,mask);
for(const side of ['Left','Right']){const m=JSON.parse(readFileSync(`${root}/assets/F002-east-west.json`));m.id=`F002-Sunlit-Forest-${side}`;m.ground=`${m.id}.png`;m.navigation.source=`${m.id}-nav.json`;writeFileSync(`${out}/${m.id}.json`,JSON.stringify(m,null,2)+'\n');cpSync(`${root}/assets/F002-east-west-nav.json`,`${out}/${m.navigation.source}`);}
writeFileSync(`${out}/art-status.json`,JSON.stringify({status:'engineering-fixture'})+'\n');
for(const side of ['left','right'])for(const ext of ['.json','.png','-nav.json'])unlinkSync(`${out}/F002-reference-${side}${ext}`);
writeFileSync(`${out}/README.txt`,'ENGINEERING IMPORT FIXTURE ONLY. Not illustrated Sunlit artwork, not approved scenery. Master joins unchanged existing test grounds. Import all PNG/JSON files together to test exact split, template validation, nav, collision and occlusion. No Nova sprite art is supplied.\n');
console.log(`Test-only master import fixture: ${out}`);
