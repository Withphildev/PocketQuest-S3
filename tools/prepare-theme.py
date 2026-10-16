"""Embed the original recording byte-for-byte; no encoding or device I/O."""
from pathlib import Path
import hashlib,json
root=Path(__file__).resolve().parent.parent
source=root/'web/audio/The-Gentle-Glade.mp3'
data=source.read_bytes()
header='#pragma once\n#include <Arduino.h>\nstatic const unsigned char kThemeAudio[] PROGMEM = {\n'
header+='\n'.join(','.join(f'0x{b:02x}' for b in data[i:i+24])+',' for i in range(0,len(data),24))+'\n};\n'
header+='static constexpr size_t kThemeAudioSize = sizeof(kThemeAudio);\n'
(root/'firmware/include/ThemeAudio.h').write_text(header)
report={'source':'web/audio/The-Gentle-Glade.mp3','bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'encoding':'original MP3, unchanged','path':'/audio/the-gentle-glade.mp3','storage':'application PROGMEM; not asset filesystem'}
(root/'web/audio/manifest.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
