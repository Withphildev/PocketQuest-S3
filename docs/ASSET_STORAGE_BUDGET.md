# PocketQuest asset storage budget — measured calibration snapshot

Owner approved this report and the unchanged partition layout on 2026-10-12.
At each major milestone, track application binary size, asset payload, modeled filesystem
allocation and factory BIN size separately. Warn when modeled asset allocation exceeds
75% of the 2 MiB partition (1,572,864 bytes); this is a review trigger, not an automatic limit.
Lossless PNG optimization is deferred: adoption requires identical decoded dimensions,
RGBA pixels and transparency. Future deliveries must distinguish clean installs from
verified save-preserving updates. This approval does not authorize Phase 2B or device flashing.

No device access, firmware build, partition changes, artwork changes, or production scenery generation.
Measurements use the current validated Sunlit halves, preserved fantasy tree, and both Nova candidates.
1 MiB = 1,048,576 bytes; 1 KiB = 1,024 bytes.

| Payload | Stored bytes | Approximate KiB |
| --- | ---: | ---: |
| Two 512×288 ground PNGs | 754,497 | 736.8 |
| One transparent tree PNG | 28,913 | 28.2 |
| Both Novas, 32 individual frame PNGs | 97,935 | 95.6 |
| Navigation/manifests, road mask, unchanged validation templates | 57,875 | 56.5 |
| Browser HTML, CSS, all current JS modules, gzip | 23,231 | 22.7 |
| Total illustrated payload | 962,451 | 939.9 |
| Optional engineering fixtures | 38,350 | 37.5 |

JSON is compacted losslessly and text is gzip-compressed. PNG data is unchanged. No lossy
palette conversion, image resizing, or alpha modifications were performed for this measurement.
Future device serving must support gzip response headers/MIME types, paths and catalog adaptations.
This is an inventory and capacity experiment, not a deployable browser package.

## Filesystem capacity experiment

The asset partition is 2,097,152 bytes (2 MiB). An isolated in-memory LittleFS model using
littlefs-python 0.19.0 writes every selected file and checks byte-identical readback.
Representative geometry: 4096-byte blocks ×512, 128-byte read/program, 512-byte cache,
128-byte lookahead. These are model parameters, not on-device filesystem telemetry.

| Storage scenario | Payload | Modeled allocated blocks | Modeled free | Used |
| --- | ---: | ---: | ---: | ---: |
| Illustrated assets + browser code (68 files) | 962,451 B | 1,085,440 B (1.04 MiB) | 1,011,712 B (0.96 MiB) | 51.76% |
| Above + selectable engineering fixtures (88 files) | 1,000,801 B | 1,163,264 B (1.11 MiB) | 933,888 B (0.89 MiB) | 55.47% |

Both model write/readback checks pass. Real device allocation can differ; leave headroom for
metadata, updates, additional files and fragmentation rather than treating every free byte as art budget.

## What not to store twice

Keep either the master ground or its halves, not both; this model retains the halves used by the
existing renderer. Master duplicate costs 707,039 bytes. Keep either individual Nova frames or
their atlases; current loader uses individual frames. Two duplicate atlas exports cost 92,639 bytes.
High-resolution generated sources, 4× review images, diagnostic reports, ZIP archives and rejected
artwork are development artifacts, not device assets. Shared template registry remains included.

The standalone HTML preview is 2,701,801 bytes (2.58 MiB), including base64-embedded assets and
duplicate development files. It cannot fit uncompressed in the 2 MiB asset partition. Gzip of that
single file measures 1,931,020 bytes (1.84 MiB), but that leaves substantially less room than a clean
external-asset package. Do not use the desktop preview size as the optimized device asset budget.

## Firmware, payload and factory download are different measurements

Measured Phase 1 application binary remains 651,936 bytes (0.62 MiB), unchanged. Its partition
capacity is 5,111,808 bytes (4.875 MiB). Browser/device integration has not been built, so no new
application size is claimed. The 1 MiB saves partition is separate and untouched.

The earlier 2–4 MiB merged-binary guess was too imprecise for this layout. A complete 2 MiB asset
filesystem placed at 0x5F0000 makes a contiguous factory file starting at 0x0000 extend to
0x7F0000: 8,323,072 bytes, or 7.9375 MiB, even when most intervening partition bytes are padding.
This is a hypothetical address calculation, not a newly created firmware binary. Save storage
preservation/initialization needs a separate installation plan; never assume padding preserves it.

## Recommendation

Keep the partition layout unchanged. Current candidates fit with useful headroom. Ground artwork
dominates the payload (~78% of illustrated stored bytes), so reuse scenery families/foreground assets,
avoid duplicate exports, and track each new unique ground image. Atlas loading could reduce file
count/overhead later, but is not needed now. Measure any lossless optimization before considering
palette reduction or a partition change. Future Oakwood/buildings, additional scenery, gameplay UI,
audio and world save growth are not represented by this snapshot.

## Reproduce

From outputs/PocketQuest/web, with littlefs-python 0.19.0 installed:

```
python tools/asset-storage-budget.py /absolute/output/PocketQuest-Asset-Storage-Budget.json
```

The script reads source files, models a filesystem in memory, and writes only the requested JSON report.
Detailed inventory, source hashes and explicit limitations are included in that report.
