"""Archive/restore exact prepared artwork inputs for reproducible release builds.
No illustration changes; no network or device I/O. Default restores missing files.
"""
from pathlib import Path
import argparse,hashlib,json,shutil
root=Path(__file__).resolve().parent.parent
web=root/'web';archive=root/'assets/runtime';manifest=archive/'manifest.json'
sha=lambda data:hashlib.sha256(data).hexdigest()
p=argparse.ArgumentParser(description=__doc__);p.add_argument('--capture',action='store_true');args=p.parse_args()
if args.capture:
    paths=set()
    for folder in ['validated-ground','nova-female-v2','nova-sword','slime-blue','dire-wolf','goblin','oakwood-rest']:
        for path in (web/'build'/folder).iterdir():
            if path.suffix in ['.png','.json'] and not any(s in path.name.lower() for s in ['contact','review','preview','atlas']):paths.add(path)
    opt=json.loads((web/'build/png-optimized/manifest.json').read_text())
    paths.add(web/'build/png-optimized/manifest.json')
    for key in opt['files']:
        if key.startswith('build/'):paths.add(web/key)
        paths.add(web/'build/png-optimized'/key)
    files={}
    for path in sorted(paths):
        key=path.relative_to(web).as_posix();data=path.read_bytes();target=archive/key
        target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(path,target)
        files[key]={'bytes':len(data),'sha256':sha(data)}
    manifest.write_text(json.dumps({'schemaVersion':1,'purpose':'Exact prepared raster/navigation inputs; no firmware binaries or browser review exports','files':files},indent=2)+'\n')
else:
    report=json.loads(manifest.read_text());assert report['schemaVersion']==1;files=report['files']
    for key,entry in files.items():
        path=Path(key);assert not path.is_absolute() and '..' not in path.parts and path.parts[0]=='build'
        source=archive/path;data=source.read_bytes();assert len(data)==entry['bytes'] and sha(data)==entry['sha256'],key
        target=web/path
        if target.exists():assert target.read_bytes()==data,f'{key} differs; preserve your local artwork and rebuild/capture intentionally'
        else:target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(source,target)
print(f'PASS: {len(files)} exact runtime inputs {"captured" if args.capture else "restored/verified"}')
