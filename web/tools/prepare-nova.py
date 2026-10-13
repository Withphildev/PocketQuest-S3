"""Deterministically package generated atlas candidates, preserving source alpha.
Find transparent gutters rather than trusting requested image-generator geometry.
No repainting, mirroring, warping, or background color-keying.
"""
import hashlib, json, math, sys
from pathlib import Path
from PIL import Image

def bands(values, count):
    gaps=[]; start=None
    for n,v in enumerate(values+[1]):
        if not v and start is None: start=n
        if v and start is not None:
            if n-start>=8 and start>0 and n<len(values): gaps.append((n-start,(start+n)//2))
            start=None
    cuts=sorted(p for _,p in sorted(gaps,reverse=True)[:count-1])
    if len(cuts)!=count-1: raise ValueError('Cannot identify four separated sprites; new illustration required')
    return list(zip([0]+cuts,cuts+[len(values)]))

out=Path(sys.argv[3]);out.mkdir(parents=True,exist_ok=True)
manifest={'schemaVersion':1,'frameSize':[32,48],'pivot':[16,44],'protagonists':{}}
report={'status':'calibration-candidates-not-production-approved','scale':'uniform 1/9 nearest-neighbor affine transform','frames':[],'sources':{}}
for sex,filename in zip(['female','male'],sys.argv[1:3]):
    source=Path(filename); im=Image.open(source).convert('RGBA')
    report['sources'][sex]={'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'size':list(im.size)}
    mask=im.getchannel('A').point(lambda a:255 if a>=128 else 0)
    rows=bands([mask.crop((0,y,im.width,y+1)).getbbox() is not None for y in range(im.height)],4)
    atlas=Image.new('RGBA',(128,192)); manifest['protagonists'][sex]={}
    for r,((y0,y1),direction) in enumerate(zip(rows,['south','north','west','east'])):
        rowmask=mask.crop((0,y0,im.width,y1))
        columns=bands([rowmask.crop((x,0,x+1,y1-y0)).getbbox() is not None for x in range(im.width)],4)
        names=[]
        for c,(x0,x1) in enumerate(columns):
            box=mask.crop((x0,y0,x1,y1)).getbbox();assert box
            box=(max(x0,x0+box[0]-2),max(y0,y0+box[1]-2),min(x1,x0+box[2]+2),min(y1,y0+box[3]+2))
            crop=im.crop(box); w,h=crop.size
            if w/9>28 or h/9>42: raise ValueError('Sprite exceeds common undistorted scale')
            # Sampling uses exactly the same ratio on both axes, with transparent padding.
            tx=16-w/18;ty=44-h/9
            frame=crop.transform((32,48),Image.Transform.AFFINE,(9,0,-9*tx,0,9,-9*ty),resample=Image.Resampling.NEAREST)
            alpha=frame.getchannel('A');assert alpha.getextrema()[0]==0 and alpha.getextrema()[1]>0
            bounds=alpha.getbbox();assert bounds[0]>0 and bounds[2]<32 and bounds[1]>0 and bounds[3]<=44
            name=f'Nova-{sex}-{direction}-{c}.png'; frame.save(out/name,compress_level=9);names.append(name)
            atlas.paste(frame,(c*32,r*48))
            report['frames'].append({'name':name,'sourceCrop':box,'paintBounds':list(bounds),'pivot':[16,44]})
        manifest['protagonists'][sex][direction]=names
    atlas.save(out/f'Nova-{sex}-walking-atlas.png',compress_level=9)
    atlas.resize((512,768),Image.Resampling.NEAREST).save(out/f'Nova-{sex}-review-4x.png',compress_level=9)
(out/'nova.json').write_text(json.dumps(manifest,indent=2)+'\n')
(out/'nova-preparation-report.json').write_text(json.dumps(report,indent=2)+'\n')
print('Prepared 32 transparent 32×48 frames; two 128×192 atlases; pivot (16,44).')
