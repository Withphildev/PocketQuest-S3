# v0.1.19 — Combat Clarity

Owner accepted the v0.1.18 visual result and asked to continue. This is a focused combat-presentation milestone, not a difficulty rebalance or new enemy AI system.

## Changes

- StickS3 enemy animation slowed from **420ms to 640ms**: wind-up 100→160ms, forward approach 80→160ms, close hold 40→60ms, return 200→260ms. Slime, wolf and goblin share this animation controller. Travel remains -100..+4 pixels relative to the original enemy anchor; no screen-layout change.
- Browser enemy-intent panel shows each living enemy's current attack and potential damage, combined threat, Guard outcome and tactical hints. Wolf pair shows 4+4=8, Guard 2+2=4; defeating a wolf removes its threat. Goblin club shows 6, Guard 3. Captain shows 8/4 ordinarily and 16/8 every third round.
- Numbers describe responses if enemies survive the selected turn, not guaranteed HP loss (defeated foes do not respond; escaping avoids a response). The UI is read-only; the device still resolves damage and saves. Captain cadence uses the saved current round and works after reload; no new timing/reflex requirement.
- No new attack/block behavior added to wolves or goblins yet. Existing damage, HP, XP, rewards, leveling, save behavior, collision and handheld 1800ms enemy tick remain unchanged. The slower handheld animation follows the resolved hit; it is NOT a pre-damage warning or dodge window. Attacks may still interrupt cosmetic animation as before.

## Delivery

PocketQuest-S3-v0.1.19-Combat-Clarity.factory.bin — **flash at 0x0000 without full erase**. Factory SHA256: `49ae41389ef6a428c63d577c2a94439d706a96ec9702a73292745fc63d024a5d`.

Routine save-preserving update from v0.1.14–18. Save format 3/rules 4, partitions and current PNG assets unchanged. Existing completed routes stay completed; no replay/reset/reward exploit. Do not downgrade to v0.1.13 or earlier. Verified merged bootloader at 0x0000, partition table 0x8000, boot_app0 0xE000, application 0x10000. Factory stops before saves 0x4F0000/assets 0x5F0000; no filesystem initialization images. NVS lies in contiguous padding, so unrelated NVS settings are not guaranteed preserved. No physical device access, flash or erase; no Git commit/push/Release.

## Four separate storage measurements

| Item | Bytes / allocation |
| --- | ---: |
| Actual application BIN | 2,755,280 (2.63 MiB) |
| Factory BIN including padding | 2,820,816 (2.69 MiB) |
| Illustrated stored asset payload model | 1,220,219 |
| Illustrated filesystem allocation model | 1,531,904 / 2,097,152 (73.05%) |
| Model including engineering fixtures | 1,581,056 (75.39%) |

Illustrated modeled free space 565,248 bytes; with fixtures 516,096. The fixture-inclusive model remains above the owner's 75% warning; illustrated-only remains below. Current assets are embedded in the application, not additionally written into the modeled filesystem. No duplicate storage counting. App partition free: 2,356,528 bytes (2.25 MiB); headroom under unchanged 2816 KiB development ceiling: 128,304 bytes. Browser gzip: 1,167,689 bytes, 105 embedded assets. Static RAM: 52,768 bytes; not runtime heap/PSRAM telemetry. No new artwork and no pixel/alpha changes; existing lossless derivatives retained.

## Verification

- 73 browser tests PASS, including each enemy's ordinary/Guard damage, all captain heavy rounds, reduction from two wolves to one, original slot naming and read-only behavior. Existing route/revisit/input/music/scenery/storage-pipeline tests retained.
- 3,284 sanitized core assertions PASS; core/save implementation unchanged.
- Slower lunge tests PASS: all timing boundaries, frame/offset synchronization, full trajectory LCD bounds, hurt/defeat/reset behavior, unsigned clock wrap, rejected cooldown not extending hurt, and unchanged core damage.
- 48 browser intent predictions match real compiled C++ route responses: four encounters × six rounds × ordinary/Guard responses. Per-enemy integer rounding verified. Integrated into tools/test-host.sh alongside animation tests.
- Firmware build, actual-core hero JSON/Node checks, friendly URL source checks, gzip/header/hash/105 assets/import/CSP/protected command/current application payload, source/compiled partition/size/merged offset/padding/hash checks PASS.
- All 129 source/optimized PNG pairs still pass exact RGBA/alpha/metadata checks.
- Synthetic actual-C++ browser QA: slime cue 3/2 displayed; Power Strike won and persisted +12 shared XP under unchanged rules; continue/walk/start wolf pair displayed separate 4-HP lunges and combined 8/4 threat. Screenshot is synthetic QA, not physical hardware evidence. Goblin/captain intent checked automatically against actual engine, not manually played on device this turn.

Sites skill used for local-only browser presentation and QA. Source originals and unrelated working-tree changes preserved. No production scenery or broader Phase 2B system introduced.

## Owner testing

Flash without erase, reconnect Wi-Fi, reload /play. On StickS3, compare slime/wolf/goblin approach speed; tell us whether 640ms feels calmer without dragging. Damage timing/cooldown remain unchanged. Existing all-cleared browser route will NOT respawn monsters: use PocketQuest-v0.1.19-Combat-Clarity-Review.html for a fresh isolated demo of intent cues, or an unfinished device route. Check wolf-pair threat reduction and captain's third-turn warning; no demo XP sync to the physical hero. Physical controller/phone layout and rest/restart regression remain owner tests. Stop for review before actual enemy-behavior/balance changes.

Rebuild: tools/build-route-page.py; pio run -d firmware; sh tools/test-host.sh; node --test web/tests/*.test.mjs; tools/test-route-package.py; tools/check-build.py. Package prepare-delivery.py --version 0.1.19 --feature Combat-Clarity with pinned framework boot_app0.bin. The lossless derivative workflow from v0.1.18 is unchanged.
