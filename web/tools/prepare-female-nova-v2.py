"""Prepare new female candidate without overwriting the previous Nova set.
Deterministic atlas gutter extraction, uniform sampling and baseline padding.
"""
import hashlib, json, sys
from pathlib import Path
from PIL import Image

def bands(values,count):
    gaps=[];start=None
    for n,v in enumerate(values+[True]):
        if not v and start is None:start=n
        if v and start is not None:
            if n-start>=8 and start>0 and n<len(values):gaps.append((n-start,(n+start)//2))
            start=None
    cuts=sorted(p for _,p in sorted(gaps,reverse=True)[:count-1])
    if len(cuts)!=count-1:raise ValueError('Generated atlas has no clean gutters; illustration correction required')
    return list(zip([0]+cuts,cuts+[len(values)]))

source=Path(sys.argv[1]);previous=Path(sys.argv[2]);out=Path(sys.argv[3]);out.mkdir(parents=True,exist_ok=True)
im=Image.open(source).convert('RGBA');mask=im.getchannel('A').point(lambda a:255 if a>=128 else 0)
rows=bands([bool(mask.crop((0,y,im.width,y+1)).getbbox()) for y in range(im.height)],4)
entries=[]
for r,((y0,y1),direction) in enumerate(zip(rows,['south','north','west','east'])):
    row=mask.crop((0,y0,im.width,y1))
    columns=bands([bool(row.crop((x,0,x+1,y1-y0)).getbbox()) for x in range(im.width)],8)
    for c,(x0,x1) in enumerate(columns):
        bbox=mask.crop((x0,y0,x1,y1)).getbbox();assert bbox
        bbox=(max(x0,x0+bbox[0]-2),max(y0,y0+bbox[1]-2),min(x1,x0+bbox[2]+2),min(y1,y0+bbox[3]+2))
        entries.append((r,c,direction,bbox))
factor=max(max((box[2]-box[0])/28,(box[3]-box[1])/40) for _,_,_,box in entries)
manifest=json.loads((previous/'nova.json').read_text());manifest['idle']={'female':{}}
for d in ['south','north','west','east']:manifest['protagonists']['female'][d]=[];manifest['idle']['female'][d]=[]
# Preserve every male frame byte-identically. No generation or resampling of male Nova.
for frames in manifest['protagonists']['male'].values():
    for name in frames:(out/name).write_bytes((previous/name).read_bytes())
atlas=Image.new('RGBA',(256,192));report={'status':'owner-review-candidate','sourceSHA256':hashlib.sha256(source.read_bytes()).hexdigest(),'actualSourceDimensions':list(im.size),'uniformInverseScale':factor,'pivot':[16,44],'frames':[]}
for r,c,direction,box in entries:
    crop=im.crop(box);w,h=crop.size;tx=16-w/(2*factor);ty=44-h/factor
    frame=crop.transform((32,48),Image.Transform.AFFINE,(factor,0,-factor*tx,0,factor,-factor*ty),resample=Image.Resampling.NEAREST)
    bounds=frame.getchannel('A').getbbox();assert bounds and bounds[0]>0 and bounds[2]<32 and bounds[1]>0 and bounds[3]<=44
    action='idle' if c<4 else 'walk';index=c%4;name=f'Nova-female-v2-{direction}-{action}-{index}.png'
    frame.save(out/name,compress_level=9);atlas.paste(frame,(c*32,r*48))
    (manifest['idle']['female'] if action=='idle' else manifest['protagonists']['female'])[direction].append(name)
    report['frames'].append({'name':name,'sourceCrop':list(box),'paintBounds':list(bounds)})
atlas.save(out/'Nova-female-v2-idle-walk-atlas.png',compress_level=9)
atlas.resize((1024,768),Image.Resampling.NEAREST).save(out/'Nova-female-v2-review-4x.png',compress_level=9)
with Image.new('RGB',(1024,768),'#d8ddda') as background:
    big=atlas.resize(background.size,Image.Resampling.NEAREST);background.paste(big,mask=big.getchannel('A'));background.save(out/'Nova-female-v2-contact-review.png',compress_level=9)
(out/'nova.json').write_text(json.dumps(manifest,indent=2)+'\n');(out/'female-v2-preparation-report.json').write_text(json.dumps(report,indent=2)+'\n')
print('Prepared female v2: 16 idle + 16 walk frames; 256×192 atlas; male frames preserved.')
