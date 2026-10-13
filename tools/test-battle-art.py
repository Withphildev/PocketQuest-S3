"""Check every generated LCD pixel/mask against PNGs and repeatability."""
from pathlib import Path
from PIL import Image
import re, subprocess, sys, hashlib
root=Path(__file__).resolve().parent.parent;out=root/'firmware/include/art'
sources={'pq_splash':[out/'Splash-240x135.png'],
 'pq_battle_idle':[root/'web/build/nova-female-v2/Nova-female-v2-east-idle-0.png'],
 'pq_battle_attack':[root/f'web/build/nova-sword/Nova-female-v2-attack-east-{i}.png' for i in range(4)]}
for name,paths in sources.items():
    text=(out/(name+'.h')).read_text()
    values=[]
    for label in ['pixels','mask']:
        block=re.search(label+r'\[\] PROGMEM = \{(.*?)\};',text,re.S).group(1)
        values.append([int(v,16) for v in re.findall(r'0x[0-9a-f]+',block)])
    rgba=[pixel for p in paths for pixel in Image.open(p).convert('RGBA').get_flattened_data()]
    assert len(values[0])==len(rgba) and len(values[1])*8==len(rgba)
    for n,(r,g,b,a) in enumerate(rgba):
        assert values[0][n]==((r>>3)<<11)|((g>>2)<<5)|(b>>3)
        assert bool(values[1][n//8]&(1<<(7-n%8)))==(a>=128)
    if name=='pq_splash':assert Image.open(paths[0]).size==(240,135)
before={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in out.iterdir()}
subprocess.run([sys.executable,str(root/'tools/prepare-battle-art.py'),str(root/'firmware/artwork-sources/PocketQuest-Splash-Owner.png')],check=True,stdout=subprocess.DEVNULL)
assert before=={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in out.iterdir()}
print('PASS: splash size, all LCD pixels/masks, deterministic regeneration')
