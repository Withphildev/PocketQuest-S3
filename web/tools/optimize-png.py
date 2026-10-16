"""Reproducible lossless derivative PNG pipeline. Never overwrites artwork.
Requires Pillow==12.3.0 and official oxipng 10.2.1. No alpha/scale/strip flags.
"""
from pathlib import Path
from PIL import Image
from io import BytesIO
from concurrent.futures import ThreadPoolExecutor
import argparse,hashlib,json,subprocess,tempfile,struct,zlib
WEB=Path(__file__).resolve().parents[1]
OUT=WEB/'build/png-optimized'
sha=lambda b:hashlib.sha256(b).hexdigest()
def properties(data):
    if not data.startswith(b'\x89PNG\r\n\x1a\n') or data[24] not in [1,2,4,8]:raise ValueError('Only <=8-bit PNG inputs are supported; refuse implicit 16-bit conversion')
    im=Image.open(BytesIO(data));im.load()
    if im.n_frames!=1 or im.mode not in ['RGB','RGBA','L','LA','P','1']:raise ValueError('Unsupported source PNG')
    # Preserve ancillary display/metadata chunks byte-for-byte. tRNS is checked
    # through exact RGBA equality instead, permitting lossless palette encoding.
    chunks=[];at=8
    while at<len(data):
        n=struct.unpack('>I',data[at:at+4])[0];kind=data[at+4:at+8];body=data[at+8:at+8+n]
        assert zlib.crc32(kind+body)&0xffffffff==struct.unpack('>I',data[at+8+n:at+12+n])[0]
        if kind[0]&32 and kind!=b'tRNS':chunks.append((kind,body))
        at+=n+12
    assert at==len(data)
    rgba=im.convert('RGBA')
    return im.size,rgba.tobytes(),rgba.getchannel('A').tobytes(),chunks
def verify(source,candidate):
    a,b=properties(source),properties(candidate)
    if a!=b:raise ValueError('PNG dimensions/RGBA/alpha/metadata changed')
    return a
def main():
    parser=argparse.ArgumentParser();parser.add_argument('--oxipng',type=Path,required=True);args=parser.parse_args()
    binary=args.oxipng.resolve();version=subprocess.check_output([str(binary),'--version'],text=True).strip()
    if version!='oxipng 10.2.1':raise ValueError('Use pinned oxipng 10.2.1')
    sources=[]
    for folder in ['validated-ground','nova-female-v2','nova-sword','slime-blue','dire-wolf','goblin','oakwood-rest']:
        sources.extend(p for p in (WEB/'build'/folder).glob('*.png') if 'Master' not in p.name and 'atlas' not in p.name)
    sources.extend((WEB/'assets').glob('*.png'))
    OUT.mkdir(parents=True,exist_ok=True)
    def optimize(path):
        raw=path.read_bytes();best=raw;method='original';rejected=0
        with tempfile.TemporaryDirectory(prefix='pq-png-') as folder:
            for flags in [[],['--nx']]:
                candidate=Path(folder)/('nx.png' if flags else 'default.png')
                subprocess.run([str(binary),'-o','4','-q',*flags,'--out',str(candidate),str(path)],check=True,capture_output=True)
                data=candidate.read_bytes() if candidate.exists() else raw
                try:verify(raw,data)
                except ValueError:rejected+=1;continue
                if len(data)<len(best):best=data;method='oxipng -o 4'+(' --nx' if flags else '')
        size,rgba,alpha,_=verify(raw,best)
        key=path.relative_to(WEB).as_posix();dest=OUT/key;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(best)
        verify(raw,dest.read_bytes())
        return key,{'sourceSHA256':sha(raw),'optimizedSHA256':sha(best),'sourceBytes':len(raw),'optimizedBytes':len(best),'savedBytes':len(raw)-len(best),'size':size,'rgbaSHA256':sha(rgba),'alphaSHA256':sha(alpha),'method':method,'rejectedCandidates':rejected}
    with ThreadPoolExecutor(max_workers=3) as pool:files=dict(sorted(pool.map(optimize,sorted(sources))))
    report={'schemaVersion':1,'optimizer':version,'optimizerSHA256':sha(binary.read_bytes()),'policy':'Exact dimensions, all decoded RGBA bytes including hidden RGB, alpha and ancillary metadata. Smaller only. Original files untouched. No --alpha, --scale16 or --strip.','files':files,'sourceBytes':sum(e['sourceBytes'] for e in files.values()),'optimizedBytes':sum(e['optimizedBytes'] for e in files.values()),'savedBytes':sum(e['savedBytes'] for e in files.values()),'changedFiles':sum(e['savedBytes']>0 for e in files.values())}
    (OUT/'manifest.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({k:v for k,v in report.items() if k!='files'},indent=2))
if __name__=='__main__':main()
