"""Deterministic attack asset packaging. Does not change firmware or combat.
Pillow 12.3.0. Recipe supplies artist-review foot anchors; never center on sword bounds.
"""
import base64, hashlib, json, struct, sys
from pathlib import Path
from PIL import Image

def bands(values,count):
    gaps=[];start=None
    for n,v in enumerate(values+[True]):
        if not v and start is None:start=n
        if v and start is not None:
            if n-start>=3 and start>0 and n<len(values):gaps.append((n-start,(n+start)//2))
            start=None
    cuts=sorted(p for _,p in sorted(gaps,reverse=True)[:count-1])
    if len(cuts)!=count-1:raise ValueError('Sprites overlap; new illustration spacing needed')
    return list(zip([0]+cuts,cuts+[len(values)]))

source=Path(sys.argv[1]);recipe=json.loads(Path(sys.argv[2]).read_text());out=Path(sys.argv[3]);out.mkdir(parents=True,exist_ok=True)
im=Image.open(source).convert('RGBA');assert list(im.size)==recipe['sourceSize']
assert hashlib.sha256(source.read_bytes()).hexdigest()==recipe['sourceSHA256']
mask=im.getchannel('A').point(lambda a:255 if a>=128 else 0)
rows=bands([bool(mask.crop((0,y,im.width,y+1)).getbbox()) for y in range(im.height)],4)
atlas=Image.new('RGBA',(320,256));frames=[];rgbdata=bytearray();maskdata=bytearray()
report={'sourceSize':list(im.size),'sourceSHA256':recipe['sourceSHA256'],'frameSize':[80,64],'pivot':[40,56],'inverseScale':recipe['inverseScale'],'frames':[]}
manifest={'schemaVersion':1,'protagonist':'female','frameSize':[80,64],'pivot':[40,56],'bodyFrameSize':[32,48],'bodyPivot':[16,44],'directionOrder':['south','north','west','east'],'phases':['wind-up','swing','follow-through','recovery'],'durationMs':[100,80,100,200],'hitboxes':None,'directions':{}}
for r,((y0,y1),d) in enumerate(zip(rows,manifest['directionOrder'])):
    row=mask.crop((0,y0,im.width,y1));cols=bands([bool(row.crop((x,0,x+1,y1-y0)).getbbox()) for x in range(im.width)],4)
    manifest['directions'][d]=[]
    for c,(x0,x1) in enumerate(cols):
        box=mask.crop((x0,y0,x1,y1)).getbbox();assert box
        a,b=recipe['anchors'][r][c]
        if recipe.get('anchorBaselineFromPaintBottom'):b=y0+box[3]
        assert x0<a<x1 and y0<b<=y1
        crop=im.crop((x0,y0,x1,y1));f=recipe['inverseScale']
        frame=crop.transform((80,64),Image.Transform.AFFINE,(f,0,a-x0-40*f,0,f,b-y0-56*f),resample=Image.Resampling.NEAREST)
        # Detect clipping of all significant source paint, not just the resized output.
        for x,y in [(box[0],box[1]),(box[2],box[3])]:assert 1<(x+x0-a)/f+40<79 and 1<(y+y0-b)/f+56<63, (d,c,box)
        name=f'Nova-female-v2-attack-{d}-{c}.png';frame.save(out/name,compress_level=9);frames.append(frame);manifest['directions'][d].append(name);atlas.paste(frame,(c*80,r*64))
        raw=bytearray();bits=bytearray(640)
        for n,(red,green,blue,alpha) in enumerate(frame.get_flattened_data()):
            value=((red>>3)<<11)|((green>>2)<<5)|(blue>>3)
            raw.extend(struct.pack('<H',value))
            if alpha>=128:bits[n//8]|=1<<(7-n%8)
        rgbdata.extend(raw);maskdata.extend(bits)
        report['frames'].append({'name':name,'sourceRect':[x0,y0,x1,y1],'sourceAnchor':[a,b],'paintBounds':list(frame.getchannel('A').getbbox())})
atlas.save(out/'Nova-Female-v2-Sword-Atlas.png',compress_level=9)
preview=atlas.resize((960,768),Image.Resampling.NEAREST);bg=Image.new('RGB',preview.size,'#cad2c9');bg.paste(preview,mask=preview.getchannel('A'));bg.save(out/'Nova-Female-v2-Sword-Contact.png',compress_level=9)
(out/'nova-attack.json').write_text(json.dumps(manifest,indent=2)+'\n');(out/'preparation-report.json').write_text(json.dumps(report,indent=2)+'\n')
(out/'NovaSword.rgb565').write_bytes(rgbdata);(out/'NovaSword.mask1').write_bytes(maskdata)
header=['#pragma once','#include <stdint.h>','#ifdef ARDUINO','#include <pgmspace.h>','#define PQ_SWORD_STORAGE PROGMEM','#else','#define PQ_SWORD_STORAGE','#endif','namespace pq_sword {','constexpr int width=80, height=64, pivotX=40, pivotY=56, frameCount=16;','constexpr uint16_t durationMs[4]={100,80,100,200};']
for name,data,fmt in [('pixels',struct.unpack('<81920H',rgbdata),'uint16_t'),('mask',maskdata,'uint8_t')]:
    header.append(f'static const {fmt} {name}[{len(data)}] PQ_SWORD_STORAGE = {{')
    for i in range(0,len(data),16):header.append(','.join(hex(v) for v in data[i:i+16])+',')
    header.append('};')
header.extend(['inline uint16_t pixel(int n) {','#ifdef ARDUINO','return pgm_read_word(pixels+n);','#else','return pixels[n];','#endif','}','inline uint8_t maskByte(int n) {','#ifdef ARDUINO','return pgm_read_byte(mask+n);','#else','return mask[n];','#endif','}',
'''template<class Display> void drawFrame(Display &d,int frame,int groundX,int groundY) {
  if(frame<0 || frame>=frameCount)return;
  const int base=frame*5120;
  for(int y=0;y<64;y++)for(int x=0;x<80;) {
    int n=base+y*80+x;
    if(!(maskByte(n/8)&(1<<(7-n%8)))){++x;continue;}
    const uint16_t color=pixel(n);const int start=x++;
    while(x<80){n=base+y*80+x;if(!(maskByte(n/8)&(1<<(7-n%8)))||pixel(n)!=color)break;++x;}
    d.fillRect(groundX-pivotX+start,groundY-pivotY+y,x-start,1,color);
  }
}''','}','#undef PQ_SWORD_STORAGE'])
(out/'NovaSwordSprites.h').write_text('\n'.join(header)+'\n')
print(f'Prepared 16 attack frames; RGB565 {len(rgbdata)} bytes + mask {len(maskdata)} bytes. Firmware unchanged.')
