"""Owner-authorized deterministic smaller exports; preserve approved masters.
No generation, palette reduction, alpha thresholding or destructive source edits.
"""
from pathlib import Path
from PIL import Image, ImageOps, __version__
import hashlib,json
web=Path(__file__).resolve().parents[1]
source=web/'artwork-sources/oakwood-rest'
out=web/'build/oakwood-rest';out.mkdir(parents=True,exist_ok=True)
spec={
 'female':{'source':'Nova-Female-Rest.png','sha':'3ff673625af543f7ee08184d637f1bcd193307bf3f7d917a3e6f5e0ebbfb7377','rects':[(220,80,600,820),(875,80,600,820)],'pivots':[(298,570),(292,570)]},
 'male':{'source':'Nova-Male-Rest.png','sha':'b446edb582c6ab55d3f29a3dd2142a000df996ac9d58c9a95217bdf1c1e45bc0','rects':[(175,15,640,860),(977,15,640,860)],'pivots':[(320,610),(323,610)]}}
def save(im,name):
 p=out/name;im.save(p,optimize=True,compress_level=9)
 check=Image.open(p);assert check.convert('RGBA').tobytes()==im.convert('RGBA').tobytes()
 return {'file':name,'pixels':list(im.size),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
bgpath=source/'Oakwood-Background.png'
assert hashlib.sha256(bgpath.read_bytes()).hexdigest()=='107db379e24f3a461b1c59af3f1474d97c244c5634384b10f48be4fcea5308fc'
bg=Image.open(bgpath).convert('RGB');assert bg.size==(1672,941)
# Edge-extend 4 px each side and 2 px each vertical edge: 1680x945.
# No illustration content removed; uniform 32/105 scale yields exactly 512x288.
padded=Image.new('RGB',(1680,945));padded.paste(bg,(4,2))
padded.paste(bg.crop((0,0,1,941)).resize((4,941)),(0,2));padded.paste(bg.crop((1671,0,1672,941)).resize((4,941)),(1676,2))
padded.paste(padded.crop((0,2,1680,3)).resize((1680,2)),(0,0));padded.paste(padded.crop((0,942,1680,943)).resize((1680,2)),(0,943))
background=save(padded.resize((512,288),Image.Resampling.NEAREST),'Oakwood-Rest-Background.png')
manifest={'schemaVersion':1,'background':background['file'],'size':[512,288],'seat':[522*32/105,602*32/105],'frameMs':1400,'characters':{}}
files=[background]
for sex,s in spec.items():
 path=source/s['source'];assert hashlib.sha256(path.read_bytes()).hexdigest()==s['sha']
 im=Image.open(path);assert im.mode=='RGBA' and im.getchannel('A').getextrema()==(0,255)
 solid=im.getchannel('A').point(lambda a:255 if a>=128 else 0)
 # Prove the explicit display windows contain all solid artwork before exporting.
 for y in range(im.height):
  for x in range(im.width):
   if solid.getpixel((x,y)):assert any(rx<=x<rx+w and ry<=y<ry+h for rx,ry,w,h in s['rects'])
 frames=[]
 for i,((x,y,w,h),(px,py)) in enumerate(zip(s['rects'],s['pivots'])):
  assert w%5==0 and h%5==0
  frame=im.crop((x,y,x+w,y+h)).resize((w//5,h//5),Image.Resampling.NEAREST)
  name=f'Nova-{sex}-rest-{i}.png';files.append(save(frame,name))
  frames.append({'file':name,'pivot':[px/5,py/5]})
 manifest['characters'][sex]={'frames':frames,'scale':(540/s['rects'][0][3])*5*32/105}
(out/'rest.json').write_text(json.dumps(manifest,indent=2)+'\n')
report={'pillow':__version__,'sourceBytes':sum(p.stat().st_size for p in source.glob('*.png')),'files':files,'pngBytes':sum(f['bytes'] for f in files),'preparation':'Explicit approved display windows, nearest-neighbor uniform 1/5 sprites; background edge padding then uniform 32/105. Background 1.6x and sprites 2x previous raster dimensions, regenerated from unchanged masters, not upscaled low-resolution exports. PNG encoding lossless relative to exported raster, NOT pixel-identical to high-resolution masters.'}
(out/'preparation.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
