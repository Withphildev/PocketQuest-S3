"""Read-only build and partition budget report; does not touch any device."""
from pathlib import Path
import json
import struct

root = Path(__file__).resolve().parent.parent
build = root / "firmware/.pio/build/m5stack-sticks3"
rows = []
for raw in (root / "firmware/partitions.csv").read_text().splitlines():
    if not raw.strip() or raw.lstrip().startswith("#"):
        continue
    name, kind, subtype, offset, size, *_ = [x.strip() for x in raw.split(",")]
    rows.append({"name": name, "offset": int(offset, 0), "size": int(size, 0)})
assert rows[0]["offset"] == 0x9000
assert rows[1]["offset"] == 0x10000
for previous, current in zip(rows, rows[1:]):
    assert previous["offset"] + previous["size"] <= current["offset"]
assert rows[-1]["offset"] + rows[-1]["size"] == 0x800000
binary = (build / "partitions.bin").read_bytes()
parsed = []
for offset in range(0, len(binary), 32):
    entry = binary[offset:offset + 32]
    if len(entry) < 32 or entry[:2] != b"\xaa\x50":
        break
    magic, kind, subtype, address, size, label, flags = struct.unpack("<HBBII16sI", entry)
    parsed.append({"name": label.split(b"\0")[0].decode(), "offset": address, "size": size})
assert parsed == rows, "Generated binary partition table differs from source"
sizes = {name: (build / name).stat().st_size for name in
         ("bootloader.bin", "partitions.bin", "firmware.bin", "firmware.factory.bin")}
assert sizes["firmware.bin"] <= 2816 * 1024, "Phase 0 firmware ceiling exceeded"
assert sizes["firmware.bin"] <= rows[1]["size"]
assert sizes["firmware.factory.bin"] < 8_000_000
print(json.dumps({"partitions": rows, "artifactBytes": sizes,
                  "applicationHeadroomBytes": rows[1]["size"] - sizes["firmware.bin"],
                  "note": "Compiled layout, not physical device readback. Saves/assets not in factory image."}, indent=2))
