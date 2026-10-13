from PIL import Image
from pathlib import Path
import json, hashlib, subprocess, sys, tempfile
root=Path(sys.argv[1]);web=Path(__file__).resolve().parents[1]
m=json.loads((root/'nova.json').read_text());atlas=Image.open(root/'Nova-female-v2-idle-walk-atlas.png');assert atlas.size==(256,192)
hashes=[]
for r,d in enumerate(['south','north','west','east']):
    for c,name in enumerate(m['idle']['female'][d]+m['protagonists']['female'][d]):
        i=Image.open(root/name);assert i.size==(32,48) and i.mode=='RGBA'
        assert all(i.getpixel(p)[3]==0 for p in [(0,0),(31,0),(0,47),(31,47)])
        box=i.getchannel('A').getbbox();assert box and box[0]>0 and box[2]<32 and box[1]>0 and box[3]<=44
        assert i.tobytes()==atlas.crop((c*32,r*48,(c+1)*32,(r+1)*48)).tobytes()
        hashes.append(hashlib.sha256(i.tobytes()).hexdigest())
for frames in m['protagonists']['male'].values():
    for name in frames:assert (root/name).read_bytes()==(web/'build/nova'/name).read_bytes()
with tempfile.TemporaryDirectory() as tmp:
    subprocess.run([sys.executable,str(Path(__file__).with_name('prepare-female-nova-v2.py')),str(web/'artwork-sources/nova-female-v2/spaced.png'),str(web/'build/nova'),tmp],check=True)
    for p in root.iterdir():
        if p.suffix in ['.png','.json']:assert p.read_bytes()==(Path(tmp)/p.name).read_bytes(),p.name
print(f'PASS: 32 female frames ({len(set(hashes))} distinct), exact geometry/alpha/bounds/atlas, unchanged male frames, reproducible bytes')
