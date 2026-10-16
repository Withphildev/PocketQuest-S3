# v0.1.18 — Lossless Assets

Owner verified v0.1.17 woodland revisiting and authorized the next storage milestone. This update changes PNG encoding and build tooling, not artwork pixels or gameplay. All originals remain untouched; saves, partitions, progression, resting layers and standalone combat are preserved.

## Delivery

**PocketQuest-S3-v0.1.18-Lossless-Assets.factory.bin — flash at 0x0000 without full erase.** Factory size 2,819,840 bytes (2.69 MiB). SHA256 `3f600a5d41aa935a206b1407cb80c1e4e1a13aa7223c48b2e1cf9ceef551c5a3`.

Routine save-preserving update from v0.1.14–17, not a clean-install initializer. Merged inputs verified: bootloader 0x0000, partitions 0x8000, boot_app0 0xE000, application 0x10000; segment bytes/padding/source hashes match. Ends before saves at 0x4F0000 and assets at 0x5F0000. No filesystem images included; NVS lies in padding, so unrelated NVS settings are not guaranteed preserved. Save format remains 3/rules 4; do not downgrade to v0.1.13 or earlier. No physical device accessed/flashed/erased, no Git commit/push/Release.

## Measured before / after

| Measurement | v0.1.17 / original PNGs | v0.1.18 / optimized PNGs | Saved |
| --- | ---: | ---: | ---: |
| Actual application BIN | 2,862,768 | 2,754,304 | 108,464 bytes (105.92 KiB) |
| Actual factory BIN including padding | 2,928,304 | 2,819,840 | 108,464 |
| Embedded browser gzip | 1,275,179 | 1,166,722 | 108,457 |
| Illustrated stored asset payload model | 1,331,300 | 1,219,403 | 111,897 |
| Illustrated LittleFS allocation model | 1,638,400 (78.12%) | 1,527,808 (72.85%) | 110,592 |
| LittleFS model including fixtures | 1,716,224 (81.84%) | 1,576,960 (75.20%) | 139,264 |

New app partition headroom: 2,357,504 bytes (2.25 MiB). Headroom under the separate unchanged 2816 KiB engineering ceiling: 129,280 bytes (126.25 KiB). Static RAM 52,768 bytes unchanged; not measured runtime heap/PSRAM.

Illustrated model now has 569,344 bytes free in the 2 MiB assets partition. With engineering fixtures: 520,192 free. **75% warning clears for illustrated-only but remains active with fixtures:** allocation is 4,096 bytes above the review threshold. No fixture deletion or partition change was performed. These are future filesystem models, NOT populated filesystem/device telemetry. Current browser/images are in app PROGMEM and must not be double-counted against the filesystem model.

PNG optimizer inventory: 129 source/derivative pairs; 127 smaller, 2 retained original bytes; aggregate 1,845,342 → 1,640,782 bytes (204,560 saved). That inventory includes unshipped contact/review PNGs and engineering material; its total is NOT claimed as delivered game savings. The actual package and modeled payload comparisons above isolate the relevant savings. Forest left/right together account for 95,692 PNG bytes saved. No unique asset/frame removed. StickS3's existing C++ sprite/splash tables are unchanged, not PNG-recompressed by this pipeline.

## Safety and repeatability

Official OxiPNG 10.2.1 downloaded to the task work directory from [its tagged release](https://github.com/oxipng/oxipng/releases/tag/v10.2.1). Archive SHA256 verified against the GitHub release asset digest: `7039fcfc78e8aa1ed2b57d848057a0296f082e92b3e1807ac65402d10d926764` (Apple arm64 archive). Executable SHA256 recorded: `275a2049091caf576be74b838df4675fbb179c9f2d118cec44ea1521e54fc45e`. No tool executable ships in firmware/repository.

The [official manual](https://github.com/oxipng/oxipng/blob/v10.2.1/MANUAL.txt) explains why `--alpha` is deliberately excluded: that option changes hidden RGB values. We also exclude `--scale16` and metadata stripping. Try `-o 4` and conservative `-o 4 --nx`; select only a smaller result after independent decode checks. Lossless PNG representation/filter/deflate changes are allowed, including exact color-type/palette reduction; lossy palette quantization is not used.

Checks compare dimensions, every decoded RGBA byte (including RGB where alpha=0), every alpha byte and ancillary metadata byte-for-byte; CRCs checked. Supports single-frame <=8-bit PNGs, rejects unsupported inputs rather than implicitly converting 16-bit images. Optimized PNGs are kept separately under web/build/png-optimized with a per-source SHA, output SHA, RGBA SHA, alpha SHA, sizes, method and metadata-preservation policy. Input files are never overwritten. Saved output is redecoded and checked again. If neither candidate improves size, the derivative contains the original bytes.

The current route packager and filesystem model use a shared manifest contract. Source-hash drift or corrupt derivative bytes fails the build; no silently stale image is substituted. Missing manifest/entry uses the original PNG safely. Thus a fresh checkout can still build without OxiPNG, but reproducing this smaller artifact requires regenerating the verified derivative inventory. The older workshop/standalone art previews continue using original images. Do not directly overwrite exported artwork with optimized files: keep the preparation and compression stages distinct.

## Rebuild

1. Prepare approved source/export assets as before.
2. With Pillow==12.3.0, run `python web/tools/optimize-png.py --oxipng /absolute/path/to/oxipng` (pinned 10.2.1).
3. `python tools/test-png-optimized.py` independently rechecks all source/derivative pairs.
4. `python3 tools/build-route-page.py`; `pio run -d firmware`.
5. `node --test web/tests/*.test.mjs`; `sh tools/test-host.sh`; `python3 tools/test-route-package.py`; `python3 tools/check-build.py`.
6. Run asset-storage-budget.py with `--female-v2 --sword --slime --wolf --goblin --route`; add `--original-png` for a same-source baseline. Requires littlefs-python 0.19.0.
7. prepare-delivery.py version 0.1.18, feature Lossless-Assets and pinned Arduino framework boot_app0.bin.

Per-file proof is delivered in PocketQuest-S3-v0.1.18-PNG-Optimization.json; paired storage reports show identical inventories with only encoding changed. Newer preparation runs change source hashes: rerun compression before packaging.

## Verification and owner review

- Independent 129-pair exact dimensions/RGBA/alpha/metadata/CRC/hash verification PASS. Negative tests reject altered hidden RGB, alpha, dimensions and metadata.
- 69 browser tests PASS, including manifest fallback, smaller derivative adoption and stale/corrupt inventory rejection; all existing scenery/collision/input/music/progression tests retained.
- 3,284 sanitized core assertions PASS.
- Firmware build, actual-core hero JSON tests, friendly URL source checks, gzip/header/hash/105 assets/import graph/CSP/protected command wiring/actual app payload, partition/size/merged-offset/padding/copy checks PASS.
- Browser compatibility against synthetic actual-C++ save authority: optimized forest/scenery validation loaded; both rest protagonists rendered; male selection/pause and peaceful revisit succeeded; no browser console errors. Screenshot is synthetic QA, not physical-device validation. Sites skill used for local-only compatibility QA; no hosting/publication.

Owner test: flash without erase, reload device /play, check forest, transparent trees, both Novas, rest poses, enemies on an unfinished route/handheld, movement and persistent XP. No visual change expected. Keep previous BIN archived. Stop for review; no new art or gameplay balancing introduced.
