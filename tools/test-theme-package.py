"""Original MP3, generated header, application and web separation checks."""
from pathlib import Path
import hashlib,json,re,gzip,base64
root=Path(__file__).resolve().parent.parent
data=(root/'web/audio/The-Gentle-Glade.mp3').read_bytes()
manifest=json.loads((root/'web/audio/manifest.json').read_text())
assert len(data)==1575723==manifest['bytes']
assert hashlib.sha256(data).hexdigest()==manifest['sha256']=='b43be287312d3c33c9c3a4659dea0c8bc6e2acc353506987955132d46feabc93'
header=(root/'firmware/include/ThemeAudio.h').read_text()
embedded=bytes(int(v,16) for v in re.findall(r'0x([0-9a-f]{2})',header))
assert embedded==data
page=gzip.decompress((root/'web/build/route-delivery/route.html.gz').read_bytes())
assert data not in page and base64.b64encode(data) not in page
assert "media-src 'self'" in json.loads((root/'web/build/route-delivery/manifest.json').read_text())['csp']
app=(root/'firmware/.pio/build/m5stack-sticks3/firmware.bin').read_bytes()
assert app.count(data)==1,'Rebuild firmware: original recording must occur exactly once'
portal=(root/'firmware/include/QuestPortal.h').read_text()
for contract in ['"/audio/the-gentle-glade.mp3",HTTP_GET','"audio/mpeg"','"Accept-Ranges","bytes"','"Content-Range"','MSG_DONTWAIT','pumpAudio();','count=left>2048?2048:left']:
    assert contract in portal,contract
print('PASS: original MP3/hash/header/actual app, separate lazy audio payload, CSP and range/cooperative serving wiring')
