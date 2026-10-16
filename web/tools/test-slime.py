from pathlib import Path
from PIL import Image
import sys,json,struct,tempfile,subprocess
root=Path(sys.argv[1]);web=Path(__file__).resolve().parents[1]
m=json.loads((root/'slime.json').read_text());assert m['frameSize']==[48,48] and m['pivot']==[24,42]
assert len(m['frames'])==8 and set(m['states'])=={'idle','block','attack','hurt','defeated'}
atlas=Image.open(root/'Slime-Blue-Atlas.png');assert atlas.size==(192,96)
rgb=(root/'Slime-Blue.rgb565').read_bytes();bits=(root/'Slime-Blue.mask1').read_bytes()
assert len(rgb)==36864 and len(bits)==2304
for f,name in enumerate(m['frames']):
    im=Image.open(root/name);assert im.mode=='RGBA' and im.size==(48,48)
    assert all(im.getpixel(p)[3]==0 for p in [(0,0),(47,0),(0,47),(47,47)])
    assert im.tobytes()==atlas.crop((f%4*48,f//4*48,f%4*48+48,f//4*48+48)).tobytes()
    for i,(r,g,b,a) in enumerate(im.get_flattened_data()):
        n=f*2304+i;assert struct.unpack_from('<H',rgb,n*2)[0]==((r>>3)<<11)|((g>>2)<<5)|(b>>3)
        assert bool(bits[n//8]&(1<<(7-n%8)))==(a>=128)
gif=Image.open(root/'Slime-Blue-Battle-Preview.gif');assert gif.size==(720,405) and gif.n_frames==8
with tempfile.TemporaryDirectory() as tmp:
    subprocess.run([sys.executable,str(web/'tools/prepare-slime.py'),str(web/'artwork-sources/slime-blue/source-clean.png'),tmp],check=True)
    for p in root.iterdir():assert p.read_bytes()==(Path(tmp)/p.name).read_bytes(),p.name
print('PASS: 8 frames, transparent geometry, exact atlas, LCD conversion, 240x135-equivalent preview, deterministic regeneration')
