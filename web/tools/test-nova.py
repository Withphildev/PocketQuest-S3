from PIL import Image
from pathlib import Path
import hashlib, json, subprocess, sys, tempfile
root=Path(sys.argv[1]); manifest=json.loads((root/'nova.json').read_text())
names=[name for sex in manifest['protagonists'].values() for frames in sex.values() for name in frames]
assert len(names)==32 and len(set(names))==32
hashes=[]
for name in names:
    image=Image.open(root/name).convert('RGBA'); assert image.size==(32,48)
    assert all(image.getpixel(pos)[3]==0 for pos in [(0,0),(31,0),(0,47),(31,47)])
    alpha=image.getchannel('A');assert alpha.getextrema()[1]>0
    bounds=alpha.getbbox();assert bounds[0]>0 and bounds[2]<32 and bounds[1]>0 and bounds[3]<=44
    hashes.append(hashlib.sha256(image.tobytes()).hexdigest())
assert len(set(hashes))==32, 'Duplicate frames'
for sex in ['female','male']:
    atlas=Image.open(root/f'Nova-{sex}-walking-atlas.png')
    assert atlas.size==(128,192)
    for r,d in enumerate(['south','north','west','east']):
        for c,n in enumerate(manifest['protagonists'][sex][d]):
            assert atlas.crop((c*32,r*48,(c+1)*32,(r+1)*48)).tobytes()==Image.open(root/n).tobytes()
with tempfile.TemporaryDirectory() as tmp:
    sources=Path(__file__).resolve().parents[1]/'artwork-sources/nova'
    subprocess.run([sys.executable,str(Path(__file__).with_name('prepare-nova.py')),str(sources/'female-generated.png'),str(sources/'male-generated.png'),tmp],check=True)
    for p in root.iterdir():
        if p.suffix in ['.png','.json']:assert p.read_bytes()==(Path(tmp)/p.name).read_bytes(),p.name
print('PASS: 32 unique transparent frames, 32×48 geometry, unclipped bounds, exact atlas reconstruction, reproducible bytes')
