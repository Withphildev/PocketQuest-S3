"""Check the staged/released Git tree without printing secret values."""
from pathlib import Path
import argparse,subprocess,re,json,hashlib
root=Path(__file__).resolve().parent.parent
p=argparse.ArgumentParser();p.add_argument('--staged',action='store_true');a=p.parse_args()
files=subprocess.check_output(['git','ls-files','-z'],cwd=root).decode().split('\0');files=[f for f in files if f]
findings=[]
def read(name):return subprocess.check_output(['git','show',(':'+name) if a.staged else ('HEAD:'+name)],cwd=root)
patterns=[r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',r'gh[pousr]_[A-Za-z0-9]{30,}',r'github_pat_[A-Za-z0-9_]{50,}',r'AKIA[A-Z0-9]{16}',r'AIza[A-Za-z0-9_-]{35}',r'xox[baprs]-[A-Za-z0-9-]{20,}']
for name in files:
    path=Path(name)
    if path.suffix.lower() in ['.bin','.elf','.map','.key','.pem','.p12','.pfx','.zip'] or path.name=='.env' or any(s in path.parts for s in ['credentials','secrets','serial-captures','flash-dumps','.pio','node_modules']):findings.append((name,'unnecessary binary/private artifact'));continue
    data=read(name)
    if len(data)>50*1024*1024:findings.append((name,'oversized source file'))
    if path.suffix.lower() not in ['.png','.jpg','.jpeg','.gif','.mp3']:
        text=data.decode('utf8',errors='replace')
        for pattern in patterns:
            if re.search(pattern,text):findings.append((name,'credential signature'))
manifest=json.loads(read('assets/runtime/manifest.json'))
for key,entry in manifest['files'].items():
    name='assets/runtime/'+key
    if name not in files:findings.append((name,'required runtime input not tracked'));continue
    data=read(name)
    if len(data)!=entry['bytes'] or hashlib.sha256(data).hexdigest()!=entry['sha256']:findings.append((name,'runtime input hash mismatch'))
if findings:
    for name,reason in findings:print(f'FAIL: {name}: {reason}')
    raise SystemExit(1)
print(f'PASS: {len(files)} tracked files; no scanned credential signatures/private artifacts; all {len(manifest["files"])} runtime inputs tracked and hash-verified. Pattern scan is not a guarantee against every secret type.')
