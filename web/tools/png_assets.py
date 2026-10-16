"""Read verified derivative PNGs; reject stale originals or altered derivatives."""
from pathlib import Path
import hashlib,json
WEB=Path(__file__).resolve().parents[1]
MANIFEST=WEB/'build/png-optimized/manifest.json'
def asset_bytes(path,optimized=True):
    path=Path(path);original=path.read_bytes()
    if not optimized or path.suffix!='.png' or not MANIFEST.exists():return original
    report=json.loads(MANIFEST.read_text())
    if report.get('schemaVersion')!=1:raise ValueError('Invalid PNG optimization manifest')
    key=path.resolve().relative_to(WEB).as_posix();entry=report['files'].get(key)
    if entry is None:return original
    if hashlib.sha256(original).hexdigest()!=entry['sourceSHA256']:raise ValueError(f'Stale optimized source: {key}; rerun optimize-png.py')
    derivative=WEB/'build/png-optimized'/key
    data=derivative.read_bytes()
    if hashlib.sha256(data).hexdigest()!=entry['optimizedSHA256'] or len(data)>len(original):raise ValueError(f'Corrupt optimized PNG: {key}')
    return data
