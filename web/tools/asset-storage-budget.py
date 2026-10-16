"""Read-only asset sizing plus isolated in-memory LittleFS capacity model.
Does not generate firmware, change assets, or access the physical device.
Run with littlefs-python 0.19.0 installed.
"""
import gzip, hashlib, json, sys
from pathlib import Path
from littlefs import LittleFS
from png_assets import asset_bytes

web=Path(__file__).resolve().parents[1]
ground=web/'build/validated-ground';nova=web/'build'/('nova-female-v2' if '--female-v2' in sys.argv else 'nova')
files=[]
def add(path,group,name=None):
    data=asset_bytes(path,optimized='--original-png' not in sys.argv)
    if path.suffix=='.json':data=(json.dumps(json.loads(data),separators=(',',':'))+'\n').encode()
    packed=gzip.compress(data,compresslevel=9,mtime=0) if path.suffix in ['.json','.js','.css','.html'] else data
    files.append({'name':name or path.name,'group':group,'source':str(path.relative_to(web)),
                  'originalBytes':path.stat().st_size,'payloadBytes':len(data),'storedBytes':len(packed),
                  'sha256':hashlib.sha256(data).hexdigest(),'data':packed})
for half in ['Left','Right']:add(ground/f'F002-Sunlit-Forest-{half}.png','ground')
add(ground/'Sunlit-Tree.png','tree')
manifest=json.loads((nova/'nova.json').read_text())
for section in [manifest['protagonists'],manifest.get('idle',{})]:
    for sex in section.values():
        for frames in sex.values():
            for name in frames:add(nova/name,'nova')
for p in ground.iterdir():
    if p.name in ['F002-Sunlit-Forest-Left.json','F002-Sunlit-Forest-Right.json','F002-Sunlit-Forest-Left-nav.json','F002-Sunlit-Forest-Right-nav.json','templates.json','F002-Sunlit-Forest-RoadMask.png'] or p.name.startswith(('corner-','meadow-')):add(p,'validation-metadata')
add(nova/'nova.json','validation-metadata')
if '--sword' in sys.argv:
    attack=web/'build/nova-sword';a=json.loads((attack/'nova-attack.json').read_text())
    for names in a['directions'].values():
        for name in names:add(attack/name,'sword-png')
    add(attack/'nova-attack.json','validation-metadata')
if '--slime' in sys.argv:
    slime=web/'build/slime-blue';m=json.loads((slime/'slime.json').read_text())
    for name in m['frames']:add(slime/name,'slime-png')
    add(slime/'slime.json','validation-metadata')
if '--wolf' in sys.argv:
    wolf=web/'build/dire-wolf';m=json.loads((wolf/'wolf.json').read_text())
    for name in m['frames']:add(wolf/name,'wolf-png')
    add(wolf/'wolf.json','validation-metadata')
if '--goblin' in sys.argv:
    goblin=web/'build/goblin';m=json.loads((goblin/'goblin.json').read_text())
    for name in m['frames']:add(goblin/name,'goblin-png')
    add(goblin/'goblin.json','validation-metadata')
add(web/'index.html','browser-code');add(web/'style.css','browser-code')
if '--route' in sys.argv:
    for name in ['index.html','game.js','app.js','controls.js','music.js','theme.js','movement.js','device.js','quest.js','rest.js','combat-intent.js','journey.js','flow.js','fullscreen.js','battle-view.js','chests.js']:add(web/'route'/name,'route-prototype','route-'+name)
    rest=web/'build/oakwood-rest';m=json.loads((rest/'rest.json').read_text())
    for name in ['rest.json',m['background'],*[f['file'] for c in m['characters'].values() for f in c['frames']]]:add(rest/name,'oakwood-rest')
for p in sorted((web/'src').glob('*.js')):add(p,'browser-code')
# Current app retains selectable engineering fixtures. Budget these too, separately.
for p in sorted((web/'assets').iterdir()):
    if p.suffix in ['.json','.png']:add(p,'engineering-fixtures','engineering-'+p.name)
groups={}
for f in files:
    g=groups.setdefault(f['group'],{'files':0,'originalBytes':0,'payloadBytes':0,'storedBytes':0})
    g['files']+=1
    for k in ['originalBytes','payloadBytes','storedBytes']:g[k]+=f[k]
profiles={}
for title,selected in [('illustrated-only',[f for f in files if f['group']!='engineering-fixtures']),('with-engineering-fixtures',files)]:
    fs=LittleFS(block_size=4096,block_count=512,read_size=128,prog_size=128,cache_size=512,lookahead_size=128)
    for f in selected:
        with fs.open('/'+f['name'],'wb') as handle:handle.write(f['data'])
    for f in selected:
        with fs.open('/'+f['name'],'rb') as handle:assert handle.read()==f['data']
    used=fs.used_block_count*4096
    profiles[title]={'files':len(selected),'storedPayloadBytes':sum(f['storedBytes'] for f in selected),
                     'modeledLittleFSUsedBytes':used,'modeledFreeBytes':2097152-used,'percentUsed':round(100*used/2097152,2),'readback':'PASS',
                     'storageReviewRequired':used>1572864}
    fs.unmount()
preview=web/'dist'/('PocketQuest-Female-Nova-v2-Review.html' if '--female-v2' in sys.argv else 'PocketQuest-Nova-Sprite-Review.html')
raw=preview.read_bytes() if preview.exists() else None
report={'assetPartitionBytes':2097152,'applicationPartitionBytes':5111808,'optimizedPNG':'--original-png' not in sys.argv,
        'ownerApprovedStoragePolicy':{'approvedDate':'2026-10-12','warningThresholdBytes':1572864,'warningThresholdPercent':75,'trigger':'modeled allocation strictly exceeds threshold','partitionChangeAuthorized':False},
        'phase1ApplicationBinaryBytes':(web.parent/'release/PocketQuest-v0.1.0.app.bin').stat().st_size if (web.parent/'release/PocketQuest-v0.1.0.app.bin').exists() else None,
        'groups':groups,'profiles':profiles,
        'standalonePreview':{'rawBytes':len(raw),'gzipBytes':len(gzip.compress(raw,9,mtime=0))} if raw is not None else {'note':'Historical optional review page not built; omitted, not zero usage'},
        'excludedDuplicates':{'masterPNGBytes':(ground/'F002-Sunlit-Forest-Master.png').stat().st_size,
                              'atlasPNGBytes':sum(p.stat().st_size for p in nova.glob('*atlas.png'))},
        'files':[{k:v for k,v in f.items() if k!='data'} for f in files],
        'limitations':['Sizing model only, not a runnable filesystem deployment or firmware build.',
                      'Text stored gzip, JSON compacted losslessly; future server must provide Content-Encoding: gzip and correct MIME types.',
                      'PNG pixels/alpha unchanged. Separate frames retained for current loader; atlases/master/review exports/source originals excluded.',
                      'LittleFS uses representative 4096-byte blocks, 128-byte read/program, 512-byte cache; not measured on-device filesystem usage.',
                      'Catalog/path adaptations and device HTTP server not implemented. Saves/system partitions untouched.',
                      'Future scenes, new gameplay, buildings, audio, UI, and future save data are not budgeted.']}
audio=web/'audio/The-Gentle-Glade.mp3'
if audio.exists():
    report['applicationResidentAudio']=json.loads((web/'audio/manifest.json').read_text())
    report['audioFilesystemAlternative']={'fitsWithIllustratedPayload':False,'minimumPayloadBytes':profiles['illustrated-only']['storedPayloadBytes']+audio.stat().st_size,'note':'Combined payload alone exceeds 2 MiB before filesystem overhead. Track remains in app; no double-counting in asset filesystem profiles.'}
out=Path(sys.argv[1]);out.write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'groups':groups,'profiles':profiles,'standalonePreview':report['standalonePreview']},indent=2))
for title,profile in profiles.items():
    if profile['storageReviewRequired']:print(f'WARNING: {title} exceeds 75% of asset partition; owner storage review required.')
