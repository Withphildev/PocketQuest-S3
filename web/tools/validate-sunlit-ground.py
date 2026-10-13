"""Bounded collar composition of the owner-reviewed candidate. No resampling."""
import argparse, json, hashlib, shutil
from pathlib import Path
from PIL import Image

def prepare(source, tree_dir, base_path, out):
    original=Image.open(source).convert('RGBA')
    if original.size!=(1024,288) or original.getchannel('A').getextrema()!=(255,255):raise ValueError('Require opaque 1024×288 source')
    out.mkdir(parents=True,exist_ok=True);ground=original.copy()
    # Explicit sampled grass. All composition crops are 1:1, never stretched.
    tile=original.crop((500,60,516,78));grass=Image.new('RGBA',(1024,288))
    for y in range(0,288,18):
        for x in range(0,1024,16):grass.paste(tile,(x,y))
    corrected=original.crop((480,0,544,288))
    corrected.paste(original.crop((480,62,544,94)),(0,94))
    corrected.paste(original.crop((480,194,544,224)),(0,162))
    # Road data retained verbatim in required band; shared source strip remains continuous at X=512.
    ground.paste(corrected,(480,0));ground.paste(corrected.crop((32,0,64,288)),(0,0));ground.paste(corrected.crop((0,0,32,288)),(992,0))
    # Fade only outside protected collars so exact templates remain exact.
    for x in list(range(32,48))+list(range(464,480))+list(range(544,560))+list(range(976,992)):
        nearest=31 if x<48 else 480 if x<480 else 543 if x<560 else 992
        weight=max(0,1-abs(x-nearest)/17)
        for y in list(range(94,126))+list(range(162,192)):
            a=ground.getpixel((nearest,y));b=original.getpixel((x,y));ground.putpixel((x,y),tuple(round(a[c]*weight+b[c]*(1-weight)) for c in range(3))+(255,))
    for y in range(288):
        if y<18 or y>=270:ground.paste(grass.crop((0,y,1024,y+1)),(0,y))
        elif y<26 or y>=262:
            weight=(26-y)/9 if y<26 else (y-261)/9
            for x in range(1024):
                a=grass.getpixel((x,y));b=ground.getpixel((x,y));ground.putpixel((x,y),tuple(round(a[c]*weight+b[c]*(1-weight)) for c in range(3))+(255,))
    # Reapply SAME-direction exact collars after transitions; corner pixel phase is shared.
    ground.paste(ground.crop((480,0,512,288)),(992,0));ground.paste(ground.crop((512,0,544,288)),(0,0))
    def save(im,name):im.save(out/name,format='PNG',compress_level=9,optimize=False)
    save(ground,'F002-Sunlit-Forest-Master.png')
    halves=[ground.crop((x,0,x+512,288)) for x in [0,512]]
    for side,im in zip(['Left','Right'],halves):save(im,f'F002-Sunlit-Forest-{side}.png')
    # Metadata describes road only. Wider interior mask follows conservative hand-authored band.
    mask=Image.new('RGBA',(1024,288),(0,0,0,255))
    for x in range(1024):
        collar=x<32 or 480<=x<544 or x>=992
        mask.paste((255,255,255,255),(x,126 if collar else 108,x+1,162 if collar else 172))
    save(mask,'F002-Sunlit-Forest-RoadMask.png')
    templates={'schemaVersion':1,'id':'sunlit-ground-validation-v1','edges':{},'corners':{'meadow-corner-v1':{}}}
    rects={'north':(0,0,512,18),'east':(480,0,512,288),'south':(0,270,512,288),'west':(0,0,32,288)}
    for direction,rect in rects.items():
        if halves[0].crop(rect).tobytes()!=halves[1].crop(rect).tobytes():raise ValueError(f'{direction}: incompatible shared collar')
    vertical=grass.crop((0,0,512,288))
    # Unused road N/S references are format-required swatches, not additional approved scenery.
    patch=original.crop((500,130,516,148))
    for y in range(0,288,18):
        for x in range(224,288,16):vertical.paste(patch,(x,y))
    for socket in ['meadow-open-v1','meadow-road-v1']:
        templates['edges'][socket]={}
        for direction,rect in rects.items():
            im=grass.crop((0,0,512,288)) if socket=='meadow-open-v1' else vertical if direction in ['north','south'] else halves[0]
            name=f'{socket}-{direction}.png';save(im.crop(rect),name);templates['edges'][socket][direction]=name
    for d,rect in {'nw':(0,0,32,18),'ne':(480,0,512,18),'se':(480,270,512,288),'sw':(0,270,32,288)}.items():
        name=f'corner-{d}.png';save(halves[0].crop(rect),name);templates['corners']['meadow-corner-v1'][d]=name
    (out/'templates.json').write_text(json.dumps(templates,indent=2)+'\n')
    shutil.copyfile(tree_dir/'Sunlit-Tree.png',out/'Sunlit-Tree.png');tree=json.loads((tree_dir/'tree-placement.json').read_text())
    (out/'tree-placement.json').write_text(json.dumps(tree,indent=2)+'\n')
    # Projected visible obstacle envelopes, conservatively blocked as terrain. No invented cutouts.
    obstacles=[[(132,18,262,73),(32,187,150,256),(336,213,439,269),(48,254,464,270)],[(88,18,189,67),(161,226,311,269),(396,247,464,269),(48,254,464,270)]]
    base=json.loads(base_path.read_text())
    for index,side in enumerate(['Left','Right']):
        m=json.loads(json.dumps(base));m['id']=f'F002-Sunlit-Forest-{side}';m['ground']=m['id']+'.png';m['navigation']['source']=m['id']+'-nav.json';m['objects']=[tree];m['spawnAnchors']=[{'id':'arrival','u':440,'v':256}]
        cells=[[1]*32 for _ in range(32)]
        for y in range(2,30):
            for x in range(2,30):
                # Cell rectangles overlapping an authored visible terrain envelope block conservatively.
                if any(x*16<r[2] and (x+1)*16>r[0] and y*9<r[3] and (y+1)*9>r[1] for r in obstacles[index]):cells[y][x]=0
        (out/(m['id']+'.json')).write_text(json.dumps(m,indent=2)+'\n');(out/m['navigation']['source']).write_text(json.dumps({'schemaVersion':1,'cellWorldSize':16,'cells':cells},indent=2)+'\n')
    changed=sum(a!=b for a,b in zip(original.getdata(),ground.getdata()))
    report={'status':'calibration-awaiting-owner-review','sourceSHA256':hashlib.sha256(source.read_bytes()).hexdigest(),'changedPixels':changed,'totalPixels':1024*288,'resize':False,'treeUnchanged':hashlib.sha256((tree_dir/'Sunlit-Tree.png').read_bytes()).hexdigest()==hashlib.sha256((out/'Sunlit-Tree.png').read_bytes()).hexdigest(),'projectedTerrainEnvelopes':obstacles,'limitations':['Baked rocks/ledges are conservative blocked terrain, not independent occluders.','True walk-behind rock occlusion needs new uncovered ground and individual cutouts.','Interior road mask is hand-authored approximation; connector bands are exact.','Patch repetition and border blending require owner visual review.']}
    (out/'ground-preparation-report.json').write_text(json.dumps(report,indent=2)+'\n');return report
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('source',type=Path);p.add_argument('tree_dir',type=Path);p.add_argument('base',type=Path);p.add_argument('out',type=Path);a=p.parse_args();print(json.dumps(prepare(a.source,a.tree_dir,a.base,a.out),indent=2))
