"""Deterministic Pillow preparation. No AI calls; source files never overwritten."""
import argparse
import hashlib
import json
from fractions import Fraction
from pathlib import Path
from PIL import Image, __version__ as pillow_version

def save(image, path):
    image.save(path, format='PNG', optimize=False, compress_level=9)

def compose_layer(source, layer):
    rect = layer['crop']
    if len(rect) != 4 or not all(isinstance(v, int) for v in rect) or not (0 <= rect[0] < rect[2] <= source.width and 0 <= rect[1] < rect[3] <= source.height):
        raise ValueError('Crop must be explicit and within the source')
    if rect != [0, 0, source.width, source.height] and not layer.get('cropReason'):
        raise ValueError('Cropped visual elements require a recorded cropReason')
    scale = Fraction(layer['scale'])
    if scale <= 0:
        raise ValueError('Scale must be one positive uniform rational factor')
    crop = source.crop(rect)
    size = (crop.width * scale, crop.height * scale)
    if any(n.denominator != 1 for n in size):
        raise ValueError('Choose a crop divisible by uniform scale; no independent dimension rounding')
    return crop.resize(tuple(int(n) for n in size), Image.Resampling.NEAREST)

def prepare(recipe_path, out, candidate=False):
    recipe_path = Path(recipe_path).resolve()
    spec = json.loads(recipe_path.read_text())
    if spec.get('status') != 'owner-approved-source' and not candidate:
        raise ValueError('Source is not approved; explicitly use --candidate for review outputs')
    if out.resolve() == recipe_path.parent.resolve():
        raise ValueError('Output directory must be separate from sources')
    out.mkdir(parents=True, exist_ok=True)
    sources, hashes = {}, {}
    for name, entry in spec['sources'].items():
        path = recipe_path.parent / entry['file']
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        if digest != entry['sha256']:
            raise ValueError(f'{name}: source hash changed')
        sources[name] = Image.open(path).convert('RGBA')
        hashes[name] = digest
    ground = Image.new('RGBA', (1024, 288), tuple(spec['padding']))
    for layer in spec['layers']:
        patch = compose_layer(sources[layer['source']], layer)
        x0,y0,x1,y1 = layer['destination']
        if not (0 <= x0 < x1 <= 1024 and 0 <= y0 < y1 <= 288):
            raise ValueError('Composition destination outside master')
        if not layer.get('tile') and (x1-x0,y1-y0) != patch.size:
            raise ValueError('Destination must not stretch or silently clip a non-tiled patch')
        for y in range(y0,y1,patch.height):
            for x in range(x0,x1,patch.width):
                part = patch.crop((0,0,min(patch.width,x1-x),min(patch.height,y1-y)))
                ground.alpha_composite(part,(x,y))
    if ground.getchannel('A').getextrema() != (255,255):
        raise ValueError('Ground is not opaque')
    save(ground,out/'F002-Sunlit-Forest-Master.png')
    halves = [ground.crop((x,0,x+512,288)) for x in [0,512]]
    for side, half in zip(['Left','Right'],halves): save(half,out/f'F002-Sunlit-Forest-{side}.png')
    mask = Image.new('RGBA',(1024,288),(0,0,0,255))
    mask.paste((255,255,255,255),(0,126,1024,162))
    save(mask,out/'F002-Sunlit-Forest-RoadMask.png')
    # Illustrative recipes must author collars coherently BEFORE template extraction.
    # Enforce all same-direction open collars and road collars, not independent per-half registries.
    rects={'north':(0,0,512,18),'east':(480,0,512,288),'south':(0,270,512,288),'west':(0,0,32,288)}
    for direction, rect in rects.items():
        if halves[0].crop(rect).tobytes() != halves[1].crop(rect).tobytes():
            raise ValueError(f'Conflicting {direction} templates; reauthor shared collars')
    templates={'schemaVersion':1,'id':'sunlit-calibration-v1','edges':{},'corners':{'meadow-corner-v1':{}}}
    open_ground = compose_layer(sources[spec['layers'][0]['source']], spec['layers'][0])
    plain = Image.new('RGBA',(512,288))
    for y in range(0,288,open_ground.height):
        for x in range(0,512,open_ground.width): plain.paste(open_ground,(x,y))
    vertical = plain.copy()
    road_patch = compose_layer(sources[spec['layers'][1]['source']], spec['layers'][1])
    for y in range(0,288,road_patch.height):
        for x in range(224,288,road_patch.width): vertical.paste(road_patch,(x,y))
    # Unused N/S road templates are authored texture fixtures, not an approved N/S scene.
    for socket in ['meadow-open-v1','meadow-road-v1']:
        templates['edges'][socket]={}
        for direction,rect in rects.items():
            source=plain if socket=='meadow-open-v1' else vertical if direction in ['north','south'] else halves[0]
            name=f'{socket}-{direction}.png';save(source.crop(rect),out/name);templates['edges'][socket][direction]=name
    for direction,rect in {'nw':(0,0,32,18),'ne':(480,0,512,18),'se':(480,270,512,288),'sw':(0,270,32,288)}.items():
        name=f'corner-{direction}.png';save(halves[0].crop(rect),out/name);templates['corners']['meadow-corner-v1'][direction]=name
    (out/'templates.json').write_text(json.dumps(templates,indent=2)+'\n')
    fg=spec['foreground']; source=sources[fg['source']]
    alpha=source.getchannel('A');bbox=alpha.getbbox()
    if not bbox or alpha.getextrema()[0] != 0: raise ValueError('Foreground needs genuine transparency and visible pixels')
    # Trim transparent margins only; preserve every nonzero-alpha pixel in the fitted bounding box.
    trimmed=source.crop(bbox); width,height=fg['canvas'];px,py=fg['pivot']
    scale=min(Fraction(fg['fit'][0],trimmed.width),Fraction(fg['fit'][1],trimmed.height))
    offset_x=px-float(trimmed.width*scale)/2;offset_y=py-float(trimmed.height*scale)
    if offset_x < 0 or offset_y < 0 or offset_x+float(trimmed.width*scale)>width or py>height: raise ValueError('Foreground would clip painted pixels')
    tree=trimmed.transform((width,height),Image.Transform.AFFINE,(1/float(scale),0,-offset_x/float(scale),0,1/float(scale),-offset_y/float(scale)),Image.Resampling.NEAREST)
    save(tree,out/fg['file'])
    obj={'id':'sunlit-tree','asset':fg['file'],'anchor':fg['anchor'],'pivot':fg['pivot'],'collision':fg['collision'],'renderBounds':[-px,-py,width,height],'depthRule':'ground-anchor'}
    (out/'tree-placement.json').write_text(json.dumps(obj,indent=2)+'\n')
    base=json.loads((recipe_path.parent/spec['manifest']).read_text())
    for side in ['Left','Right']:
        m=dict(base);m['id']=f'F002-Sunlit-Forest-{side}';m['ground']=m['id']+'.png';m['navigation']=dict(base['navigation'],source=m['id']+'-nav.json');m['objects']=[obj]
        (out/(m['id']+'.json')).write_text(json.dumps(m,indent=2)+'\n')
        # Flat walkable surface; solid tree footprint is separate authored metadata.
        (out/m['navigation']['source']).write_text(json.dumps({'schemaVersion':1,'cellWorldSize':16,'cells':[[1]*32 for _ in range(32)]},indent=2)+'\n')
    report={'status':spec['status'],'productionApproved':False,'sources':hashes,'pillow':pillow_version,'layers':spec['layers'],'foreground':dict(fg,trimmedTransparentBBox=bbox,uniformScale=str(scale)), 'notes':['Repeated texture ground is a composed calibration candidate, not the full Sunlit illustration.','Road mask describes authored composition; artist review remains required.','Unused N/S road references are not approved scenery.']}
    report['outputs']={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(out.iterdir()) if p.suffix in ['.png','.json'] and p.name!='preparation-report.json'}
    (out/'preparation-report.json').write_text(json.dumps(report,indent=2)+'\n')
    return report

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('recipe',type=Path);parser.add_argument('output',type=Path);parser.add_argument('--candidate',action='store_true');args=parser.parse_args()
    report=prepare(args.recipe,args.output,args.candidate);print(f'Prepared {len(report["outputs"])} assets; status={report["status"]}; production approval remains false')
