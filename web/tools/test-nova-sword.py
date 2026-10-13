from PIL import Image
from pathlib import Path
import json, struct, sys, tempfile, subprocess
root=Path(sys.argv[1]);web=Path(__file__).resolve().parents[1];m=json.loads((root/'nova-attack.json').read_text());names=sum(m['directions'].values(),[])
assert len(names)==16 and m['frameSize']==[80,64] and m['pivot']==[40,56]
rgb=(root/'NovaSword.rgb565').read_bytes();mask=(root/'NovaSword.mask1').read_bytes();assert len(rgb)==163840 and len(mask)==10240
atlas=Image.open(root/'Nova-Female-v2-Sword-Atlas.png');assert atlas.size==(320,256)
for f,name in enumerate(names):
    im=Image.open(root/name);assert im.size==(80,64) and im.mode=='RGBA'
    assert all(im.getpixel(p)[3]==0 for p in [(0,0),(79,0),(0,63),(79,63)])
    assert im.tobytes()==atlas.crop((f%4*80,f//4*64,(f%4+1)*80,(f//4+1)*64)).tobytes()
    for i,(r,g,b,a) in enumerate(im.get_flattened_data()):
        n=f*5120+i;assert struct.unpack_from('<H',rgb,n*2)[0]==((r>>3)<<11)|((g>>2)<<5)|(b>>3)
        assert bool(mask[n//8]&(1<<(7-n%8)))==(a>=128)
with tempfile.TemporaryDirectory() as tmp:
    subprocess.run([sys.executable,str(Path(__file__).with_name('prepare-nova-sword.py')),str(web/'artwork-sources/nova-sword/spaced.png'),str(web/'artwork-sources/nova-sword/recipe.json'),tmp],check=True)
    for p in root.iterdir():assert p.read_bytes()==(Path(tmp)/p.name).read_bytes(),p.name
print('PASS: 16 PNGs, alpha/dimensions/atlas, complete RGB565 + mask mapping, deterministic regeneration')
