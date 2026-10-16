"""Host package/source checks, not physical HTTP/flash tests."""
from pathlib import Path
import base64,gzip,hashlib,json,re
root=Path(__file__).resolve().parent.parent
header=(root/'firmware/include/RoutePage.h').read_text()
array=header.split('kRouteGzip[] PROGMEM = {',1)[1].split('};',1)[0]
data=bytes(int(v,16) for v in re.findall(r'0x([0-9a-f]{2})',array))
manifest=json.loads((root/'web/build/route-delivery/manifest.json').read_text())
assert data==(root/'web/build/route-delivery/route.html.gz').read_bytes()
raw=gzip.decompress(data);html=raw.decode()
assert len(data)==manifest['gzipBytes'] and len(raw)==manifest['rawBytes']
assert hashlib.sha256(data).hexdigest()==manifest['gzipSHA256']
assert hashlib.sha256(raw).hexdigest()==manifest['rawSHA256']
assert 'id="device-route"' in html and 'Shared hero' in html
assert 'href="/"' in html and 'id="music"' in html and 'id="interact"' in html
assets=json.loads(html.split('id="embedded-assets">',1)[1].split('</script>',1)[0])
imports=json.loads(html.split('<script type="importmap">',1)[1].split('</script>',1)[0])['imports']
assert len(assets)==105
assert all(n in assets for n in ['rest.json','Oakwood-Rest-Background.png','Nova-female-rest-0.png','Nova-male-rest-1.png'])
for name,content in assets.items():
    decoded=base64.b64decode(content,validate=True)
    if name.endswith('.png'):assert decoded.startswith(b'\x89PNG\r\n\x1a\n'),name
    else:json.loads(decoded)
for key,url in imports.items():
    assert url.startswith('data:text/javascript;base64,')
    source=base64.b64decode(url.split(',',1)[1],validate=True).decode()
    for specifier in re.findall(r"from ['\"]([^'\"]+)['\"]",source):assert specifier in imports,(key,specifier)
assert all(name in imports for name in ['pq/route/app.js','pq/route/game.js','pq/route/music.js','pq/route/controls.js'])
portal=(root/'firmware/include/QuestPortal.h').read_text()
route=portal.split('server_.on("/play",HTTP_GET',1)[1].split('server_.onNotFound',1)[0]
assert '"Content-Encoding","gzip"' in route and '"Content-Security-Policy",kRouteCsp' in route
assert 'kRouteGzip),kRouteGzipSize' in route and 'send_P(' in route
assert "script-src 'unsafe-inline' data:" in manifest['csp'] and "connect-src 'self'" in manifest['csp']
assert 'href="/play"' in (root/'firmware/include/HeroPage.h').read_text()
app=root/'firmware/.pio/build/m5stack-sticks3/firmware.bin'
if app.exists():
    assert app.read_bytes().count(data)==1,'Rebuild firmware: actual application must contain current gzip bytes exactly once'
assert 'X-PQ-Token' in portal and 'pq::routeOrigin(' in portal and 'server_.args()!=3' in portal
print(f'PASS: gzip/header/hash/105 assets/import graph/CSP/GET page + protected command wiring and actual app payload ({len(data)} bytes)')
