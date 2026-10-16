# v0.1.26 — Battle Framing

Owner requested v0.1.24 appearance with the newer battles after finding the v0.1.25 zoom cropped scenery. Local Sites workflow; no deployment, repository push, device access, erase or flash.

## Correction

- Removed animated battle zoom. Restored v0.1.24 Nova scale2.5, ordinary enemies2.2, feetY225 and NovaX140. Boss remains the established larger goblin placeholder.
- Full1024×288 ground master is uniformly fitted at0.75 into the768×384 battle composition, rather than enlarged around an encounter. This is not pixel-identical to v24's partial background: both blocks now fit completely. PNG originals remain untouched. Margins are allowed; no stretch or cover-crop.
- Exploration scale is min(width/768,height/384), rather than width-only. This protects scenery/tree headroom on short fullscreen landscape canvases while preserving world geometry and camera following.
- Preserved accepted-turn Nova/enemy attack animations, sequential responses, Guard/damage/HP feedback, reduced motion, input locks, automatic continuation and save authority.
- Existing fullscreen shell, L2, Exit and native Hide browser bars controls remain unchanged. Native fullscreen requires browser support/permission and may need a tap. Aspect-preserving margins are not a failure to enter fullscreen; removing them by stretching/cropping was not authorized.

Music (including deferred The Gentle Glade), difficulty, sprites, handheld gameplay, saves format4/rules4 and partitions unchanged.

## Verification

108 browser tests pass, including complete-master bounds, height-aware exploration fit, accepted-turn playback and prior scenery/input/fullscreen regressions. 5,132 sanitized core assertions, handheld animation checks,48 fixed-route parity cases,189 journey cases/567 real C++ responses pass. Build, actual browser package/hash/CSP/import checks, branding, portal and whitespace checks pass.

Disposable local actual-engine browser:844×390 fullscreen shell fills viewport; battle canvas and targets/actions remain inside (actions end atY390). Both wolves still counterattack and NovaHP40→32. Native fullscreen verified through :fullscreen DOM selector; default1280×800 screenshot saved after resetting viewport override. No physical phone/PS5/StickS3 behavior claimed. Background calibration seams and existing art limitations remain; they were not repainted.

## Manual firmware delivery

`PocketQuestMini-S3-v0.1.26-Battle-Framing.factory.bin` — **flash0x0000 without full erase**.

| Measurement | Bytes |
| --- | ---: |
| Actual application BIN | 2,768,560 |
| Application capacity / headroom | 5,111,808 / 2,343,248 |
| Factory BIN with padding | 2,834,096 |
| Static RAM | 52,832 |
| Embedded browser gzip | 1,177,665 |
| Illustrated library stored payload | 1,227,959 |
| Illustrated modeled LittleFS | 1,552,384 (74.02%) |
| Including engineering fixtures | 1,601,536 (76.37%) |

75% storage warning still active with fixtures. Modeled free space544,768 bytes illustrated-only /495,616 with fixtures out of2MiB. These are future-filesystem model values, not physical readings; current browser assets reside inside the application and must not be counted twice. No new artwork/audio.

Factory SHA256 `d5cce018cc5100e448d2d75aaff7983bdf51f96648032f8d296da39f516ff51f`.

Verified offsets: bootloader0x0000, partitions0x8000, boot_app0 0xE000, app0x10000. Factory ends before saves0x4F0000 and assets0x5F0000; neither filesystem is included. Padding includes NVS, so unrelated settings are not guaranteed preserved. Do not full-erase and do not downgrade to v0.1.21 or earlier after format4 saves. Manifest retains dirty-tree provenance at source checkpoint c0a7c6be9374d0a9269bc3247d6bad147e6b3627; no new commit/publication implied.

Offline review remains an isolated demo, not device save sync. Owner downloads/flashes/tests. Stop for review.
