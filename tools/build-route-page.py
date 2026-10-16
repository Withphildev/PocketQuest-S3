"""Rebuild, losslessly gzip and embed browser demo in application flash. No device I/O."""
from pathlib import Path
import gzip,hashlib,json,subprocess,re
root=Path(__file__).resolve().parent.parent
source=root/'web/dist/PocketQuest-Woodland-Route-Review.html'
subprocess.run(['node','web/tools/build-route.mjs',str(source)],cwd=root,check=True)
html=re.sub(r'<div id="progress-notice".*?</div>','<div id="progress-notice" class="notice">Shared hero · connecting to StickS3. Actions are locked until saved device state loads.</div>',source.read_text(),count=1)
html=html.replace('<script type="importmap">','<script id="device-route" type="application/json">{"enabled":true}</script><script type="importmap">',1)
html=html.replace('<main>','<main><p><a href="/" style="color:var(--gold)">← Saved hero dashboard</a></p>',1)
raw=html.encode();data=gzip.compress(raw,compresslevel=9,mtime=0)
assert gzip.decompress(data)==raw
csp="default-src 'none'; img-src data:; style-src 'unsafe-inline'; script-src 'unsafe-inline' data:; connect-src 'self'; media-src 'self'; base-uri 'none'; form-action 'none'"
header='#pragma once\n#include <Arduino.h>\n'
header+='static const char kRouteCsp[] = '+json.dumps(csp)+';\n'
header+='static const unsigned char kRouteGzip[] PROGMEM = {\n'
header+='\n'.join(','.join(f'0x{b:02x}' for b in data[i:i+24])+',' for i in range(0,len(data),24))+'\n};\n'
header+='static constexpr size_t kRouteGzipSize = sizeof(kRouteGzip);\n'
(root/'firmware/include/RoutePage.h').write_text(header)
out=root/'web/build/route-delivery';out.mkdir(parents=True,exist_ok=True)
(out/'route.html.gz').write_bytes(data)
report={'rawBytes':len(raw),'gzipBytes':len(data),'rawSHA256':hashlib.sha256(raw).hexdigest(),'gzipSHA256':hashlib.sha256(data).hexdigest(),'storage':'PROGMEM inside application, no filesystem','path':'/play','csp':csp}
(out/'manifest.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
