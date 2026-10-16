import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';import {resolve,relative,sep} from 'node:path';
const sha=data=>createHash('sha256').update(data).digest('hex');
export async function pngAssets(web){
 let manifest;try{manifest=JSON.parse(await readFile(resolve(web,'build/png-optimized/manifest.json'),'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
 if(manifest&&manifest.schemaVersion!==1)throw Error('Invalid PNG optimization manifest');
 return async path=>{const raw=await readFile(path),key=relative(web,path).split(sep).join('/'),e=manifest?.files[key];if(!e)return raw;
  if(sha(raw)!==e.sourceSHA256)throw Error(`Stale optimized source: ${key}; rerun optimize-png.py`);
  const data=await readFile(resolve(web,'build/png-optimized',key));
  if(sha(data)!==e.optimizedSHA256||data.length>raw.length)throw Error(`Corrupt optimized PNG: ${key}`);
  return data;
 };
}
