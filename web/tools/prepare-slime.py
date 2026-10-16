"""Prepare blue-slime candidate atlas; deterministic sampling, no repainting."""
from pathlib import Path
from PIL import Image, ImageDraw
import sys,json,hashlib,struct

def bands(values,count):
    gaps=[];start=None
    for n,v in enumerate(values+[True]):
        if not v and start is None:start=n
        if v and start is not None:
            if n-start>=8 and start>0 and n<len(values):gaps.append((n-start,(start+n)//2))
            start=None
    cuts=sorted(p for _,p in sorted(gaps,reverse=True)[:count-1])
    if len(cuts)!=count-1:raise ValueError('Atlas does not have clean separated gutters; illustration correction required')
    return list(zip([0]+cuts,cuts+[len(values)]))

source=Path(sys.argv[1]);out=Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
im=Image.open(source).convert('RGBA');alpha=im.getchannel('A')
assert alpha.getextrema()[0]==0,'Require actual transparent source; no color-keying'
mask=alpha.point(lambda v:255 if v>=128 else 0)
rows=bands([bool(mask.crop((0,y,im.width,y+1)).getbbox()) for y in range(im.height)],2)
cells=[]
for y0,y1 in rows:
    row=mask.crop((0,y0,im.width,y1))
    cols=bands([bool(row.crop((x,0,x+1,y1-y0)).getbbox()) for x in range(im.width)],4)
    for x0,x1 in cols:
        box=mask.crop((x0,y0,x1,y1)).getbbox();assert box
        # Shared cell-center X, base of significant paint Y: no lunge bbox recentering.
        a=(x0+x1)/2;b=y0+box[3]
        cells.append(((x0,y0,x1,y1),(a,b),box))
# One uniform scale for the entire atlas, limited by paint height and anchor extents.
factor=max(max(box[3]-box[1] for _,_,box in cells)/34,
           max(max(abs(rect[0]+box[0]-anchor[0]),abs(rect[0]+box[2]-anchor[0])) for rect,anchor,box in cells)/20)
names=['idle-0','idle-1','block-0','attack-0','attack-1','attack-2','hurt-0','defeated-0']
durations=[300,300,500,100,120,200,500,1000]
frames=[];rgb=bytearray();bits=bytearray();report=[]
atlas=Image.new('RGBA',(192,96))
for index,(name,(rect,anchor,box)) in enumerate(zip(names,cells)):
    x0,y0,x1,y1=rect;a,b=anchor
    frame=im.crop(rect).transform((48,48),Image.Transform.AFFINE,(factor,0,a-x0-24*factor,0,factor,b-y0-42*factor),resample=Image.Resampling.NEAREST)
    bounds=frame.getchannel('A').getbbox();assert bounds and bounds[0]>0 and bounds[1]>0 and bounds[2]<48 and bounds[3]<48,(name,bounds,factor,rect,anchor)
    solid=frame.getchannel('A').point(lambda v:255 if v>=128 else 0).getbbox()
    assert solid and solid[3]<=43,(name,solid)
    assert all(frame.getpixel(p)[3]==0 for p in [(0,0),(47,0),(0,47),(47,47)])
    frame.save(out/f'Slime-Blue-{name}.png',compress_level=9);frames.append(frame)
    atlas.paste(frame,(index%4*48,index//4*48))
    maskbytes=bytearray(288)
    for n,(r,g,blue,opacity) in enumerate(frame.get_flattened_data()):
        rgb.extend(struct.pack('<H',((r>>3)<<11)|((g>>2)<<5)|(blue>>3)))
        if opacity>=128:maskbytes[n//8]|=1<<(7-n%8)
    bits.extend(maskbytes);report.append({'name':name,'sourceRect':rect,'sourceAnchor':anchor,'paintBounds':bounds})
atlas.save(out/'Slime-Blue-Atlas.png',compress_level=9)
contact=Image.new('RGBA',atlas.size,'#273d38');contact.alpha_composite(atlas)
contact.resize((768,384),Image.Resampling.NEAREST).convert('RGB').save(out/'Slime-Blue-Contact-4x.png')
web=Path(__file__).resolve().parents[1]
nova=Image.open(web/'build/nova-female-v2/Nova-female-v2-east-idle-0.png').convert('RGBA')
preview=[]
for name,frame in zip(names,frames):
    scene=Image.new('RGBA',(240,135),'#142d25');d=ImageDraw.Draw(scene)
    d.rectangle((0,87,239,134),fill='#396047');d.text((5,4),'PocketQuest sprite review',fill='#ecd6a0')
    d.text((5,104),'Blue slime: '+name,fill='#ecd6a0');d.text((5,119),'Artwork only - no gameplay changes',fill='#ecd6a0')
    scene.alpha_composite(nova,(28,38));scene.alpha_composite(frame,(162,40))
    preview.append(scene.resize((720,405),Image.Resampling.NEAREST).convert('RGB'))
preview[0].save(out/'Slime-Blue-Battle-Preview.gif',save_all=True,append_images=preview[1:],duration=durations,loop=0,disposal=2)
preview[0].save(out/'Slime-Blue-Battle-Preview.png')
(out/'Slime-Blue.rgb565').write_bytes(rgb);(out/'Slime-Blue.mask1').write_bytes(bits)
header=['#pragma once','#include <stdint.h>','#ifdef ARDUINO','#include <pgmspace.h>','#define PQ_SLIME_STORAGE PROGMEM','#else','#define PQ_SLIME_STORAGE','#endif','namespace pq_slime {','constexpr int width=48,height=48,pivotX=24,pivotY=42,frameCount=8;']
for label,values,kind in [('pixels',struct.unpack('<18432H',rgb),'uint16_t'),('mask',bits,'uint8_t')]:
    header.append(f'static const {kind} {label}[] PQ_SLIME_STORAGE = {{')
    header.extend(','.join(hex(v) for v in values[n:n+24])+',' for n in range(0,len(values),24));header.append('};')
header.extend(['inline uint16_t pixel(int n) {','#ifdef ARDUINO','return pgm_read_word(pixels+n);','#else','return pixels[n];','#endif','}','inline uint8_t maskByte(int n) {','#ifdef ARDUINO','return pgm_read_byte(mask+n);','#else','return mask[n];','#endif','}',
'''template<class Display> void drawFrame(Display &d,int frame,int groundX,int groundY) {
    if(frame<0 || frame>=frameCount) return;
    for(int y=0;y<height;y++) for(int x=0;x<width;) {
        int n=frame*2304+y*width+x;
        if(!(maskByte(n/8)&(1<<(7-n%8)))) {++x;continue;}
        uint16_t color=pixel(n);int start=x++;
        while(x<width) {n=frame*2304+y*width+x;
            if(!(maskByte(n/8)&(1<<(7-n%8))) || pixel(n)!=color) break;
            ++x;
        }
        d.fillRect(groundX-pivotX+start,groundY-pivotY+y,x-start,1,color);
    }
}''','}','#undef PQ_SLIME_STORAGE'])
(out/'SlimeBlueSprites.h').write_text('\n'.join(header)+'\n')
manifest={'schemaVersion':1,'status':'candidate-owner-review-required','enemy':'slime-blue','facing':'west','frameSize':[48,48],'pivot':[24,42],
 'states':{'idle':['idle-0','idle-1'],'block':['block-0'],'attack':['attack-0','attack-1','attack-2'],'hurt':['hurt-0'],'defeated':['defeated-0']},
 'frames':[f'Slime-Blue-{name}.png' for name in names],'previewDurationMs':durations,'hitboxes':None,'blockingMechanicImplemented':False}
(out/'slime.json').write_text(json.dumps(manifest,indent=2)+'\n')
(out/'preparation-report.json').write_text(json.dumps({'sourceSize':im.size,'sourceSHA256':hashlib.sha256(source.read_bytes()).hexdigest(),'inverseScale':factor,'frames':report,'rgbBytes':len(rgb),'maskBytes':len(bits),'note':'Shared uniform nearest-neighbor scale. Cell-center anchors/base inferred from paint require visual review; alpha preserved in PNG.'},indent=2)+'\n')
print(f'Prepared 8 frames, common inverse scale {factor:.4f}, LCD payload {len(rgb)+len(bits)} bytes')
