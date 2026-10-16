"""Verified public release packages. NEVER flashes hardware.
Clean image resets all 8 MiB; UPDATE stops before saves. Explicit packaging consent required.
"""
from pathlib import Path
import argparse,hashlib,json,subprocess,sys,tempfile
from littlefs import LittleFS,UserContext
root=Path(__file__).resolve().parent.parent
sha=lambda data:hashlib.sha256(data).hexdigest()
def check(ok,message):
    if not ok:raise ValueError(message)
def mount(data):
    fs=LittleFS(context=UserContext(buffer=bytearray(data)),mount=False,block_size=4096,block_count=len(data)//4096,read_size=128,prog_size=128,cache_size=512,lookahead_size=128)
    fs.mount();return fs
def empty_fs(size):
    fs=LittleFS(block_size=4096,block_count=size//4096,read_size=128,prog_size=128,cache_size=512,lookahead_size=128)
    check(fs.listdir('/')==[],'New filesystem not empty');fs.unmount();data=bytes(fs.context.buffer)
    check(len(data)==size,'Wrong filesystem capacity')
    fs=mount(data);check(fs.listdir('/')==[],'Cannot explicitly mount empty filesystem')
    payload=bytes(range(98))
    for slot in ['a','b']:
        with fs.open('/pq-'+slot+'.bin','wb') as f:f.write(payload)
    fs.unmount();copy=bytes(fs.context.buffer);fs=mount(copy)
    for slot in ['a','b']:
        with fs.open('/pq-'+slot+'.bin','rb') as f:check(f.read()==payload,'98-byte slot roundtrip failed')
    fs.unmount();return data
def write(path,data):
    check(not path.exists() or path.read_bytes()==data,'Refuse to overwrite a different release artifact: '+path.name)
    path.write_bytes(data);check(sha(path.read_bytes())==sha(data),'Copy verification failed')
def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--boot-app0',type=Path,required=True);p.add_argument('--output-dir',type=Path,required=True);p.add_argument('--confirm-clean-install-package',action='store_true',required=True);a=p.parse_args()
    version=json.loads((root/'core/PocketQuestCore/library.json').read_text())['version'];out=a.output_dir.resolve();out.mkdir(parents=True,exist_ok=True)
    check(not subprocess.check_output(['git','status','--porcelain'],cwd=root,text=True).strip(),'Commit tested source before packaging release')
    subprocess.run([sys.executable,str(root/'tools/prepare-delivery.py'),'--version',version,'--feature','UPDATE','--boot-app0',str(a.boot_app0.resolve()),'--output-dir',str(out)],cwd=root,check=True)
    prefix=f'PocketQuestMini-S3-v{version}'
    update=out/f'{prefix}-UPDATE.factory.bin';base=update.read_bytes();info=json.loads(update.with_suffix('.json').read_text())
    check(len(base)<=0x4f0000,'UPDATE reaches save storage')
    save=empty_fs(0x100000);assets=empty_fs(0x200000)
    check(save==empty_fs(0x100000) and assets==empty_fs(0x200000),'Filesystem images not deterministic')
    clean=bytearray(b'\xff'*0x800000);clean[:len(base)]=base;clean[0x4f0000:0x5f0000]=save;clean[0x5f0000:0x7f0000]=assets
    for offset,data in [(0,base),(0x4f0000,save),(0x5f0000,assets)]:check(bytes(clean[offset:offset+len(data)])==data,'Clean segment mismatch')
    check(all(v==255 for v in clean[len(base):0x4f0000]),'App padding mismatch')
    check(all(v==255 for v in clean[0x7f0000:]),'Coredump padding mismatch')
    for data in [bytes(clean[0x4f0000:0x5f0000]),bytes(clean[0x5f0000:0x7f0000])]:
        fs=mount(data);check(fs.listdir('/')==[],'Packaged filesystem not empty');fs.unmount()
    info.update({'packageType':'save-preserving-update','savePreserving':True,'writtenEndExclusive':hex(len(base)),'saveFormat':5,'rulesVersion':4,'requiresExistingSaveFilesystem':True,'warning':'Use only with the same PocketQuest partition layout. NO full erase. NVS padding overwritten; saves/assets not written. No downgrade to v0.1.29 or earlier.'})
    update.with_suffix('.json').write_text(json.dumps(info,indent=2)+'\n')
    cleanpath=out/f'{prefix}-CLEAN-INSTALL.factory.bin';write(cleanpath,bytes(clean))
    ci={**info,'file':cleanpath.name,'bytes':len(clean),'sha256':sha(clean),'packageType':'clean-install','savePreserving':False,'requiresExistingSaveFilesystem':False,'writtenEndExclusive':'0x800000','segments':info['segments']+[{'name':'initialized-empty-saves','offset':'0x4f0000','bytes':len(save),'sha256':sha(save)},{'name':'initialized-empty-assets','offset':'0x5f0000','bytes':len(assets),'sha256':sha(assets)}],'warning':'DESTROYS ALL PREVIOUS FIRMWARE, SAVES, FILESYSTEMS AND SETTINGS. New or deliberately reset StickS3 only. Artwork/music are in application, asset filesystem is empty.','filesystemChecks':'Fresh explicit mount; empty root; copied 98-byte two-slot write/read/remount; deterministic bytes; actual packaged slices remounted.','hardwareVerification':'v0.1.32 gameplay/visuals accepted by owner; v1.0.0 clean-install packaging host-verified, not physically flashed by agent.'}
    cleanpath.with_suffix('.json').write_text(json.dumps(ci,indent=2)+'\n')
    sums=''.join(f'{sha(p.read_bytes())}  {p.name}\n' for p in sorted(out.glob(f'{prefix}-*.factory.bin')))
    write(out/'SHA256SUMS.txt',sums.encode())
    print(json.dumps({'version':version,'updateBytes':len(base),'cleanBytes':len(clean),'sourceCommit':info['sourceCommit'],'flashAddress':'0x0000','cleanSHA256':sha(clean),'updateSHA256':sha(base)},indent=2))
if __name__=='__main__':main()
