"""Deterministic transparent enemy atlas preparation. Optional fourth argument: goblin."""
from pathlib import Path
from PIL import Image,ImageDraw
import sys,json,hashlib,struct
def bands(values,count):
    gaps=[];start=None
    for n,v in enumerate(values+[True]):
        if not v and start is None:start=n
        if v and start is not None:
            if n-start>=4 and start>0 and n<len(values):gaps.append((n-start,(start+n)//2))
            start=None
    cuts=sorted(p for _,p in sorted(gaps,reverse=True)[:count-1])
    if len(cuts)!=count-1:raise ValueError('Sprites need clean illustration gutters')
    return list(zip([0]+cuts,cuts+[len(values)]))
source=Path(sys.argv[1]);out=Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
enemy=sys.argv[3] if len(sys.argv)>3 else 'wolf'
assert enemy in ('wolf','goblin')
prefix,header,namespace,macro,enemyid=('Goblin','GoblinSprites.h','pq_goblin','PQ_GOBLIN','goblin') if enemy=='goblin' else ('Dire-Wolf','DireWolfSprites.h','pq_wolf','PQ_WOLF','dire-wolf')
im=Image.open(source).convert('RGBA');mask=im.getchannel('A').point(lambda a:255 if a>=128 else 0)
assert im.getchannel('A').getextrema()[0]==0
rows=bands([bool(mask.crop((0,y,im.width,y+1)).getbbox()) for y in range(im.height)],2);cells=[]
for y0,y1 in rows:
    row=mask.crop((0,y0,im.width,y1))
    for x0,x1 in bands([bool(row.crop((x,0,x+1,y1-y0)).getbbox()) for x in range(im.width)],4):
        box=mask.crop((x0,y0,x1,y1)).getbbox();assert box
        cells.append(((x0,y0,x1,y1),((x0+x1)/2,y0+box[3]),box))
scale=max(max(b[3]-b[1] for _,_,b in cells)/34,max(max(abs(r[0]+b[0]-a[0]),abs(r[0]+b[2]-a[0])) for r,a,b in cells)/27)
names=['idle-0','idle-1','block-0','attack-0','attack-1','attack-2','hurt-0','defeated-0'];frames=[];report=[];rgb=bytearray();bits=bytearray();atlas=Image.new('RGBA',(256,96))
for f,(name,(r,a,b)) in enumerate(zip(names,cells)):
    x0,y0,x1,y1=r;ax,ay=a
    frame=im.crop(r).transform((64,48),Image.Transform.AFFINE,(scale,0,ax-x0-32*scale,0,scale,ay-y0-42*scale),resample=Image.Resampling.NEAREST)
    bounds=frame.getchannel('A').getbbox();assert bounds and bounds[0]>0 and bounds[1]>0 and bounds[2]<64 and bounds[3]<48,(name,bounds)
    assert all(frame.getpixel(p)[3]==0 for p in [(0,0),(63,0),(0,47),(63,47)])
    frame.save(out/f'{prefix}-{name}.png',compress_level=9);frames.append(frame);atlas.paste(frame,(f%4*64,f//4*48))
    maskbytes=bytearray(384)
    for n,(red,green,blue,alpha) in enumerate(frame.get_flattened_data()):
        rgb.extend(struct.pack('<H',((red>>3)<<11)|((green>>2)<<5)|(blue>>3)))
        if alpha>=128:maskbytes[n//8]|=1<<(7-n%8)
    bits.extend(maskbytes);report.append({'name':name,'sourceRect':r,'sourceAnchor':a,'paintBounds':bounds})
atlas.save(out/f'{prefix}-Atlas.png',compress_level=9)
contact=Image.new('RGBA',atlas.size,'#273d38');contact.alpha_composite(atlas);contact.resize((1024,384),Image.Resampling.NEAREST).convert('RGB').save(out/f'{prefix}-Contact-4x.png')
web=Path(__file__).resolve().parents[1];nova=Image.open(web/'build/nova-female-v2/Nova-female-v2-east-idle-0.png').convert('RGBA');preview=[]
for name,frame in zip(names,frames):
    scene=Image.new('RGBA',(240,135),'#142d25');d=ImageDraw.Draw(scene);d.rectangle((0,87,239,134),fill='#396047')
    d.text((5,4),f'PocketQuest {enemy} art preview',fill='#ecd6a0');d.text((5,104),name+' (pose only)',fill='#ecd6a0')
    scene.alpha_composite(nova,(28,38));scene.alpha_composite(frame,(154,40));preview.append(scene.resize((720,405),Image.Resampling.NEAREST).convert('RGB'))
preview[0].save(out/f'{prefix}-Preview.gif',save_all=True,append_images=preview[1:],duration=[300,300,500,100,120,200,500,1000],loop=0,disposal=2)
(out/f'{prefix}.rgb565').write_bytes(rgb);(out/f'{prefix}.mask1').write_bytes(bits)
# Reuse the tested masked-run implementation with exact new frame geometry/data.
template=(web/'build/slime-blue/SlimeBlueSprites.h').read_text()
head=template[:template.index('static const uint16_t pixels')].replace('pq_slime',namespace).replace('PQ_SLIME',macro).replace('width=48','width=64').replace('pivotX=24','pivotX=32')
tail=template[template.index('inline uint16_t pixel'):].replace('PQ_SLIME',macro).replace('frame*2304','frame*3072')
for label,values,kind in [('pixels',struct.unpack('<24576H',rgb),'uint16_t'),('mask',bits,'uint8_t')]:
    head+=f'static const {kind} {label}[] {macro}_STORAGE = {{\n'+'\n'.join(','.join(hex(v) for v in values[n:n+24])+',' for n in range(0,len(values),24))+'\n};\n'
(out/header).write_text(head+tail)
(out/f'{enemy}.json').write_text(json.dumps({'schemaVersion':1,'enemy':enemyid,'facing':'west','frameSize':[64,48],'pivot':[32,42],'frames':[f'{prefix}-{name}.png' for name in names],'states':{'idle':[0,1],'block':[2],'attack':[3,4,5],'hurt':[6],'defeated':[7]}},indent=2)+'\n')
(out/'preparation-report.json').write_text(json.dumps({'sourceSize':im.size,'sourceSHA256':hashlib.sha256(source.read_bytes()).hexdigest(),'inverseScale':scale,'frames':report,'rgbBytes':len(rgb),'maskBytes':len(bits)},indent=2)+'\n')
print(f'Prepared 8 {enemy} frames, 64x48, uniform inverse scale',scale,'LCD bytes',len(rgb)+len(bits))
