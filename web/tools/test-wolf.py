from pathlib import Path
from PIL import Image
import sys,json,struct,tempfile,subprocess
out=Path(sys.argv[1]);web=Path(__file__).resolve().parents[1];enemy=sys.argv[2] if len(sys.argv)>2 else 'wolf'
assert enemy in ('wolf','goblin')
prefix,header,folder=('Goblin','GoblinSprites.h','goblin') if enemy=='goblin' else ('Dire-Wolf','DireWolfSprites.h','dire-wolf')
m=json.loads((out/f'{enemy}.json').read_text())
assert m['frameSize']==[64,48] and m['pivot']==[32,42] and len(m['frames'])==8
atlas=Image.open(out/f'{prefix}-Atlas.png');assert atlas.size==(256,96)
rgb=(out/f'{prefix}.rgb565').read_bytes();mask=(out/f'{prefix}.mask1').read_bytes();assert len(rgb)==49152 and len(mask)==3072
for f,name in enumerate(m['frames']):
    im=Image.open(out/name);assert im.mode=='RGBA' and im.size==(64,48)
    assert all(im.getpixel(p)[3]==0 for p in [(0,0),(63,0),(0,47),(63,47)])
    assert im.tobytes()==atlas.crop((f%4*64,f//4*48,f%4*64+64,f//4*48+48)).tobytes()
    for n,(r,g,b,a) in enumerate(im.get_flattened_data()):
        i=f*3072+n;assert struct.unpack_from('<H',rgb,i*2)[0]==((r>>3)<<11)|((g>>2)<<5)|(b>>3)
        assert bool(mask[i//8]&(1<<(7-i%8)))==(a>=128)
assert (web.parent/'firmware/include/art'/header).read_bytes()==(out/header).read_bytes()
with tempfile.TemporaryDirectory() as tmp:
    source='source-v2.png' if enemy=='goblin' else 'source.png'
    subprocess.run([sys.executable,str(web/'tools/prepare-wolf.py'),str(web/'artwork-sources'/folder/source),tmp,enemy],check=True)
    for p in out.iterdir():assert p.read_bytes()==(Path(tmp)/p.name).read_bytes(),p.name
print(f'PASS: 8 {enemy} frames, alpha/atlas/LCD masks, firmware header identity, deterministic regeneration')
