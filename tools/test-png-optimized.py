"""Independently recheck every optimized derivative against its untouched source."""
from pathlib import Path
import sys,json,hashlib
from io import BytesIO
from PIL import Image
from PIL.PngImagePlugin import PngInfo
root=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root/'web/tools'))
import importlib.util
spec=importlib.util.spec_from_file_location('optimizer',root/'web/tools/optimize-png.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
report=json.loads((module.OUT/'manifest.json').read_text());total=0
for key,e in report['files'].items():
    source=(module.WEB/key).read_bytes();candidate=(module.OUT/key).read_bytes()
    assert hashlib.sha256(source).hexdigest()==e['sourceSHA256']
    assert hashlib.sha256(candidate).hexdigest()==e['optimizedSHA256']
    dimensions,rgba,alpha,_=module.verify(source,candidate)
    assert list(dimensions)==e['size']
    assert hashlib.sha256(rgba).hexdigest()==e['rgbaSHA256']
    assert hashlib.sha256(alpha).hexdigest()==e['alphaSHA256']
    assert len(candidate)<=len(source)
    total+=len(source)-len(candidate)
assert total==report['savedBytes']
def png(im):
    stream=BytesIO();im.save(stream,format='PNG');return stream.getvalue()
original=Image.new('RGBA',(2,2),(10,20,30,0));raw=png(original)
for mode in ['hidden-rgb','alpha','dimensions']:
    altered=original.copy()
    if mode=='hidden-rgb':altered.putpixel((0,0),(11,20,30,0))
    elif mode=='alpha':altered.putpixel((0,0),(10,20,30,1))
    else:altered=altered.resize((4,4))
    try:module.verify(raw,png(altered))
    except ValueError:pass
    else:raise AssertionError('Accepted lossy '+mode)
metadata=PngInfo();metadata.add_text('author','must preserve');stream=BytesIO();original.save(stream,format='PNG',pnginfo=metadata)
try:module.verify(stream.getvalue(),raw)
except ValueError:pass
else:raise AssertionError('Accepted changed metadata')
print(f'PASS: {len(report["files"])} PNG source/derivative pairs, exact RGBA/alpha/metadata, {total} bytes saved; rejects hidden RGB, alpha and dimension changes')
