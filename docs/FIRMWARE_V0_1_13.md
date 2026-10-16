# v0.1.13 — mandatory encounter hard stops

Owner reported v0.1.12 browser demo working on phone with touch, PS5 controller and audible sound, then requested that Nova cannot walk past undefeated monsters. That owner observation is for their setup, not universal compatibility verification by Codex.

## Change

Progression is now strictly **Slime → wolf pair → goblin → captain**. The first uncleared encounter creates a route-wide barrier 42 world units before the monster anchor. Nova may retreat and move vertically, but cannot pass the gate above/below the enemy or diagonally. The shared movement wrapper limits requested X before the unchanged scenery collision sweep. It does not alter navigation metadata, art, scenery validation, projection or the original renderer/generator.

All keyboard/touch/gamepad exploration vectors enter this same wrapper. Battle starts also reject later encounters out of order. The nearby prompt now says the enemy blocks the trail; a short gold dashed marker shows the stop on the path. Engage remains deliberate, not automatic combat. A group gate opens only after all members are defeated. Running, defeat or camp/rest never clear an encounter; leaving camp retains existing cleared progress. Battle/results cannot move Nova. Captain victory opens the route endpoint.

Music, controls, damage/rewards, hero choice, demo-only in-memory browser progress and standalone StickS3 combat/saves unchanged. Format 2 / rules 4 unchanged. Browser rewards still do not write real hero XP. No automatic device flashing or GitHub push/Release; no production artwork. Sites skill used in local-only mode for the bounded browser change and preview verification.

## Delivery

PocketQuest-S3-v0.1.13-Encounter-Hard-Stops.factory.bin: **flash at 0x0000, NO full erase**. Routine save-preserving update for the existing initialized PocketQuest layout, not a clean install. After restart, join Wi-Fi and open http://PocketQuest → Play woodland demo (or /play). Reload any previously open game tab to load the new code.

Verified segment offsets: bootloader 0x0, partitions 0x8000, boot_app0 0xE000, application 0x10000. Image stops before saves at 0x4F0000 and assets at 0x5F0000; no filesystem images included. NVS prefix padding may reset unrelated settings, not repeatable chip-derived credentials. No partition change, format or new save schema. Versions v0.1.10 and earlier still cannot read the existing rules-4 saves.

SHA-256: 0cf5f0e63ba9d19d43c6a10e12f2aae0204d5377b132d3b1994c100488072fb5. Delivery manifest records segment hashes and local dirty source provenance (base c0a7c6b, not newly pushed).

| Storage measurement | Result |
| --- | --- |
| Application BIN | 2,658,768 bytes (2.54 MiB); 2,453,040 bytes partition headroom |
| Actual browser gzip payload inside application | 1,084,229 bytes, not a separate filesystem copy |
| Modeled illustrated asset payload | 1,143,371 bytes; not additionally flashed |
| Modeled asset LittleFS allocation | 1,425,408 = 67.97%; 671,744 free |
| Modeled allocation with engineering fixtures | 1,503,232 = 71.68%; 593,920 free |
| Complete factory BIN including padding | 2,724,304 bytes (2.60 MiB), 672 bytes larger than v0.1.12 |
| Static RAM build report | 52,584 bytes, unchanged; not runtime heap/PSRAM |

Both modeled profiles stay below the 75% review warning. Actual assets remain in application PROGMEM for this build; no on-device assets filesystem readback was performed and no double-counting is intended. Model readback PASS. The assets partition is not required by /play.

## Verification

- PlatformIO ESP32-S3 build PASS (11.89s).
- 49 browser tests PASS: 43 existing plus ordered-start, oversized movement/no tunneling/retreat, full-height/diagonal gates, escape/defeat/rest, partial-group gate and sequential victories/exit tests. Existing scenery validator unchanged.
- 2,000 sanitized core assertions PASS; hero API version/JSON tests and portal contract PASS.
- Actual app contains current browser gzip exactly once; gzip/header/hash/99 assets/import graph/CSP/GET checks PASS.
- Source/compiled partitions, unchanged application ceiling, merged offsets/contents/padding, save boundary and copy hash PASS. Whitespace checks PASS.
- Local HTTP mock with exact packaged gzip/CSP: five-second held touch Right stops at slime; Run/continue plus held keyboard Right still stops there; slime victory/continue plus four-second held Right stops at wolves, not boss. Screenshot PocketQuest-v0.1.13-Gate-Mock.jpg is local browser mock evidence, NOT hardware telemetry.

No new physical device/controller/audio/save/restart test is claimed. Owner's v0.1.12 results are preserved as prior observations, not proof that v0.1.13 has been hardware-tested. Plain-HTTP controller restrictions and initial synchronous page-transfer latency remain possible on other setups; no unrelated input/music changes made.

## Reproduce / owner check

Build with python3 tools/build-route-page.py then pio run -d firmware. Test node --test web/tests/*.test.mjs, sh tools/test-host.sh and python3 tools/test-route-package.py. Package using tools/prepare-delivery.py --version 0.1.13 --feature Encounter-Hard-Stops with the pinned framework boot_app0.bin.

On phone/controller/touch, deliberately hold Right without attacking: Nova must stop at slime. Try moving above/below it, then Run from battle: still blocked. Defeat slime: next stop is wolves. Defeat one wolf only, then escape: pair gate stays closed. Clear pair and goblin in order to reach captain. Verify existing real saved hero restores and browser rewards remain demo-only. Stop for owner review; no flashing performed by Codex.
