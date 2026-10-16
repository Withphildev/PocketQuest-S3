# v0.1.32 — Sharper Oakwood

Final owner-authorized visual-polish trial. Owner reports v0.1.31 working on their setup. No physical device accessed/flashed, public Release, Git push or new gameplay scope. Sites skill used locally to check both resting protagonists and departure controls.

## Result

One shared background512×288 (previously320×180), female breathing frames120×164 (previously60×82), male128×172 (previously64×86). Two transparent poses per protagonist, same1.4-second frame interval, seated proportions/pivots, entry fade, pause/reduced motion and immediate departure. Canvas backing resolution matches512×288; rest-only browser scaling and character composition smoothing improves display, without changing the route/battle pixel-art renderer.

All assets regenerated from unchanged high-resolution masters using prepare-rest.py, not by enlarging old small exports. Same explicit source windows and edge padding; no stretching, new illustration, color quantization, audio reduction, or clipping of solid source artwork. Nearest-neighbor raster preparation preserves the established approach; exported PNG encoding and subsequent optimization are lossless relative to the chosen resized raster, not pixel-identical to masters. Every optimizer candidate checks exact decoded RGBA/alpha, dimensions and ancillary metadata. Original master SHA256 checks pass. This is higher-resolution two-pose breathing, not a new multi-frame full-scene animation or promise of matching every detail of the reference screenshot.

The full640×360 trial produced1,639,870-byte browser gzip,457,806 more than v31. That would exceed the explicitly approved4.5MiB engineering app limit, although below the physical partition capacity. Selected512×288 instead; no engineering ceiling or partition changes. Source masters preserved for future higher-capacity variants.

## Delivery

PocketQuestMini-S3-v0.1.32-Sharper-Oakwood.factory.bin — flash at **0x0000 without full erase**. Existing initialized save filesystem required. This routine update includes no saves/assets filesystem image. Segments verified: bootloader0x0000, partition table0x8000, boot_app00xE000, application0x10000. Merged padding/constituents, source/copy hashes and end before saves0x4F0000 verified. NVS is inside padding, so do not promise all NVS settings survive.

SHA256: fbdf3a02cf63180dd0e835c9a1df331e93f85a93b87a74cb4b84fc53f7b94548.

Save format5/rules4, journey/chests/shared XP, physical motion/button combat, chip-derived Wi-Fi, fullscreen/touch/PS5 mappings and original Gentle Glade MP3 unchanged. No downgrade to v0.1.29 or earlier after format5 saves.

## Separate storage measurements

| Measurement | Bytes |
| --- | ---: |
| Actual application BIN | 4,649,904 (4.434 MiB) |
| App capacity | 5,111,808 |
| Remaining physical app space | 461,904 (0.441 MiB) |
| Remaining under4.5MiB engineering ceiling | 68,688 |
| Factory BIN including padding/boot regions | 4,715,440 (4.497 MiB) |
| Browser HTML gzip (inside app, no MP3) | 1,479,459 |
| Five rest PNGs before/after lossless optimization | 477,942 / 475,991 |
| Original MP3, separately app-resident | 1,575,723 |
| Illustrated asset/code stored payload model, excluding audio | 1,525,885 |
| Illustrated modeled LittleFS allocation | 1,859,584 / 2,097,152 (88.67%) |
| With engineering fixtures | 1,908,736 / 2,097,152 (91.02%) |
| Static RAM | 52,896 |

App grew297,392 bytes from v31. Both modeled asset filesystem profiles exceed the owner's75% review threshold:237,568 bytes free illustrated-only,188,416 with fixtures. These are future-layout models, NOT an additional current copy in flash; current artwork/audio live in app PROGMEM. Audio plus illustrated stored payload would total3,101,608 bytes before filesystem overhead, so it does not fit a single2MiB asset filesystem. No migration attempted. Recommend no further large assets without reviewing capacity. Browser decoded rest rasters use roughly0.89MiB instead of0.30MiB, plus decoding/browser overhead; this is phone/browser memory, not StickS3 RAM telemetry. Initial browser gzip is about290KiB larger and may load more slowly over the hotspot; owner test required.

## Verification

- PlatformIO application/factory build PASS; approved engineering and physical partition limits PASS.
-133 browser tests PASS, including exact new background/frame geometry, old/mismatched dimension rejection, seat bounds, canvas/fade extents, both protagonists, pause/away/reduced motion and no presentation save mutations/waits.
-8,357 sanitized core assertions PASS; handheld animation/bounds,48 intent parity cases and189 C++/JS journey/chest cases (567 enemy responses) PASS.
- Original MP3/header/actual app hash checks PASS; same track, unchanged quality.
- Gzip/header/hash/105 assets/import graph/CSP/protected command wiring PASS. Unchanged scenery validator tests PASS.
- Branding, friendly portal contract and freshly rebuilt hero-status/version tests PASS.
- Local disposable C++ authority browser: female and male higher-resolution rest displayed, backing canvas512×288 verified, pause/resume label/state correct, Set out returns to exploration and retains12 shared test XP. Screenshots saved. This is synthetic local QA, not device/phone hardware evidence.

## Reproduce and final owner check

With Pillow12.3.0 run web/tools/prepare-rest.py, then web/tools/optimize-png.py --oxipng PATH_TO_PINNED_10.2.1. Run python3 tools/build-route-page.py; npm test --prefix web; sh tools/test-host.sh; pio run -d firmware -e m5stack-sticks3; python3 tools/test-theme-package.py; python3 tools/test-route-package.py; python3 tools/check-build.py. Package with tools/prepare-delivery.py version0.1.32, feature Sharper-Oakwood and pinned boot_app0.bin. Build does not flash.

Owner: update without full erase; reload /play; check both Novas' sharpness/breathing on the phone, pause/resume and departure, music, load time and retained progress. If approved, freeze features and prepare the separately labeled clean-install release plus save-preserving updates. No final public-release readiness or new clean-install image is claimed by this test package.
