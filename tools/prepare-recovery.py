"""Explicit clean-install recovery package. NEVER opens or flashes a device.

Requires littlefs-python 0.19.0. Not for routine updates: resets all saves.
"""
import argparse, hashlib, json, subprocess, sys, tempfile
from pathlib import Path
from littlefs import LittleFS, UserContext

def require(ok,message):
    if not ok:raise ValueError(message)

def mount_image(data):
    fs=LittleFS(context=UserContext(buffer=bytearray(data)),mount=False,
        block_size=4096,block_count=256,read_size=128,prog_size=128,cache_size=512,lookahead_size=128)
    fs.mount() # Explicit mount: never allow constructor autoformat to conceal a bad image.
    return fs

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--boot-app0',type=Path,required=True)
    p.add_argument('--output-dir',type=Path,required=True)
    p.add_argument('--confirm-reset-saves',action='store_true',required=True)
    args=p.parse_args();root=Path(__file__).resolve().parent.parent
    version=json.loads((root/'core/PocketQuestCore/library.json').read_text())['version']
    require(version=='0.1.8','Recovery is scoped to the owner-approved v0.1.8 build')
    source=root/'release/PocketQuest-v0.1.0.empty-saves.bin'
    empty=source.read_bytes();digest=hashlib.sha256(empty).hexdigest()
    require(len(empty)==0x100000,'Wrong save filesystem size')
    require(digest=='d7ccd1596703bfbfceaf7798c69691162ec2e34f11381dbafb0078978a2c41e5','Previously verified initialization source changed')
    fs=mount_image(empty);require(fs.listdir('/')==[],'Initialization source contains files')
    initial_used=fs.used_block_count*4096
    # Test mount/write/read/remount on an in-memory COPY, never the shipped empty data.
    for slot in ('a','b'):
        with fs.open('/pq-'+slot+'.bin','wb') as handle:handle.write(bytes(range(60)))
    simulated=bytes(fs.context.buffer);fs.unmount()
    fs=mount_image(simulated)
    for slot in ('a','b'):
        with fs.open('/pq-'+slot+'.bin','rb') as handle:require(handle.read()==bytes(range(60)),'Host filesystem roundtrip failed')
    fs.unmount()
    with tempfile.TemporaryDirectory(prefix='pocketquest-recovery-') as tmp:
        # Standard verifier checks the base app, partition table, offsets and padding.
        subprocess.run([sys.executable,str(root/'tools/prepare-delivery.py'),'--version',version,
            '--feature','Recovery-Base','--boot-app0',str(args.boot_app0.resolve()),'--output-dir',tmp],cwd=root,check=True)
        base_path=Path(tmp)/f'PocketQuest-S3-v{version}-Recovery-Base.factory.bin'
        base=base_path.read_bytes();manifest=json.loads(base_path.with_suffix('.json').read_text())
    partitions=json.loads(subprocess.check_output([sys.executable,str(root/'tools/check-build.py')],cwd=root,text=True))['partitions']
    saves=next(row for row in partitions if row['name']=='saves')
    assets=next(row for row in partitions if row['name']=='assets')
    require(saves['offset']==0x4f0000 and saves['size']==len(empty) and assets['offset']==0x5f0000,'Unexpected layout')
    require(len(base)<saves['offset'],'Base overlaps saves')
    merged=base+bytes([255])*(saves['offset']-len(base))+empty
    require(len(merged)==assets['offset'],'Recovery must end immediately before assets')
    require(merged[:len(base)]==base and merged[saves['offset']:]==empty,'Recovery segments differ')
    require(all(v==255 for v in merged[len(base):saves['offset']]),'Incorrect app-to-saves padding')
    fs=mount_image(merged[saves['offset']:]);require(fs.listdir('/')==[],'Packaged filesystem is not empty');fs.unmount()
    output=args.output_dir.resolve();output.mkdir(parents=True,exist_ok=True)
    target=output/f'PocketQuest-S3-v{version}-CLEAN-INSTALL-Recovery.factory.bin'
    require(not target.exists() or target.read_bytes()==merged,'Refuse to replace differing recovery file')
    target.write_bytes(merged);sha=hashlib.sha256(merged).hexdigest()
    require(hashlib.sha256(target.read_bytes()).hexdigest()==sha,'Recovery copy hash mismatch')
    manifest.update({'file':target.name,'bytes':len(merged),'sha256':sha,'packageType':'clean-install-recovery',
        'savePreserving':False,'saveResetAuthorized':True,'writtenRange':['0x000000','0x5f0000 (exclusive)'],
        'assetFilesystemIncluded':False,'emptySaveFilesystemHostUsedBytes':initial_used,
        'filesystemChecks':'Explicit host mount of source and packaged slice; empty root; copied 60-byte slot file write/read/remount PASS',
        'hardwareVerification':'Not performed; owner flashes manually and verifies SAVED/RESTORED',
        'warning':'DESTRUCTIVE TO ALL GAME SAVES. Resets saves and NVS; padding spans the application gap. Not a routine update. No full erase required. Assets/coredump not included.'})
    manifest['segments'].append({'name':'initialized-empty-saves','offset':'0x4f0000','bytes':len(empty),'sha256':digest})
    target.with_suffix('.json').write_text(json.dumps(manifest,indent=2)+'\n')
    print(json.dumps(manifest,indent=2));print(f'DOWNLOAD: {target}\nFLASH ADDRESS: 0x0000\nWARNING: CLEAN INSTALL — ALL SAVES RESET')

if __name__=='__main__':main()
