"""Embed existing Nova PNG and dashboard HTML in firmware; no network assets."""
from pathlib import Path
import base64
root=Path(__file__).resolve().parent.parent
html=(root/'webui/index.html').read_text()
png=root/'web/build/nova-female-v2/Nova-female-v2-east-idle-0.png'
html=html.replace('__NOVA_DATA_URI__','data:image/png;base64,'+base64.b64encode(png.read_bytes()).decode())
assert '__NOVA_DATA_URI__' not in html and ')PQHERO"' not in html
(root/'firmware/include/HeroPage.h').write_text('#pragma once\n#include <Arduino.h>\nstatic const char kHeroPage[] PROGMEM = R"PQHERO('+html+')PQHERO";\n')
(root/'webui').mkdir(exist_ok=True)
print(f'Embedded hero page: {len(html.encode())} bytes; PNG {png.stat().st_size} bytes')
