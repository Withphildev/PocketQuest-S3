"""Deterministic LCD encoding of owner art; no illustration edits or device access."""
from pathlib import Path
import argparse, hashlib, json
from PIL import Image

p=argparse.ArgumentParser();p.add_argument('splash',type=Path);a=p.parse_args()
root=Path(__file__).resolve().parent.parent
out=root/'firmware/include/art';out.mkdir(parents=True,exist_ok=True)
source=Image.open(a.splash).convert('RGB')
# Uniform fit; black padding avoids stretching or cropping any artwork.
fit=source.copy();fit.thumbnail((240,135),Image.Resampling.LANCZOS)
splash=Image.new('RGB',(240,135));splash.paste(fit,((240-fit.width)//2,(135-fit.height)//2))
splash.save(out/'Splash-240x135.png')
def header(name,images,pivot):
    w,h=images[0].size;pixels=[];mask=[]
    for im in images:
        data=list(im.convert('RGBA').get_flattened_data())
        pixels.extend(((r>>3)<<11)|((g>>2)<<5)|(b>>3) for r,g,b,alpha in data)
        for n in range(0,len(data),8):
            mask.append(sum((1<<(7-j)) for j,v in enumerate(data[n:n+8]) if v[3]>=128))
    s='#pragma once\n#include <Arduino.h>\nnamespace '+name+' {\n'
    s+=f'constexpr int width={w}, height={h}, frames={len(images)}, pivotX={pivot[0]}, pivotY={pivot[1]};\n'
    for typ,label,values in [('uint16_t','pixels',pixels),('uint8_t','mask',mask)]:
        s+=f'static const {typ} {label}[] PROGMEM = {{\n'
        s+='\n'.join(','.join(hex(v) for v in values[n:n+24])+',' for n in range(0,len(values),24))+'\n};\n'
    s+='''template<class Display> void draw(Display &d,int frame,int groundX,int groundY) {
    if(frame<0 || frame>=frames) return;
    for(int y=0;y<height;y++) for(int x=0;x<width;) {
        int n=frame*width*height+y*width+x;
        if(!(pgm_read_byte(mask+n/8)&(1<<(7-n%8)))) {++x;continue;}
        uint16_t color=pgm_read_word(pixels+n);int start=x++;
        while(x<width) {n=frame*width*height+y*width+x;
            if(!(pgm_read_byte(mask+n/8)&(1<<(7-n%8))) || pgm_read_word(pixels+n)!=color) break;
            ++x;
        }
        d.fillRect(groundX-pivotX+start,groundY-pivotY+y,x-start,1,color);
    }
}
}\n'''
    (out/(name+'.h')).write_text(s)
    return len(pixels)*2+len(mask)
sword=root/'web/build/nova-sword'
attack=[Image.open(sword/f'Nova-female-v2-attack-east-{i}.png') for i in range(4)]
idle=Image.open(root/'web/build/nova-female-v2/Nova-female-v2-east-idle-0.png')
sizes={'splash':header('pq_splash',[splash],(0,0)),
       'attack':header('pq_battle_attack',attack,(40,56)),
       'idle':header('pq_battle_idle',[idle],(16,44))}
report={'sourcePath':str(a.splash.resolve().relative_to(root)),
        'sourceDimensions':source.size,'fittedDimensions':fit.size,'canvas':[240,135],
        'sourceSHA256':hashlib.sha256(a.splash.read_bytes()).hexdigest(),'encodedBytes':sizes,
        'note':'RGB565 plus binary alpha >=128; uniform fit and padding, original preserved.'}
(out/'preparation.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
