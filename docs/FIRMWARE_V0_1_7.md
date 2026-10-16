# PocketQuest-S3 v0.1.7 — Enemy Lunge

2026-10-13. Owner confirmed v0.1.6 working as designed. This update implements only the agreed first step: visual enemy movement during an attack. Difficulty scaling is deferred for separate review. No device accessed/flashed, GitHub push or Release performed.

## Movement

Uses existing 420ms enemy animation, fixed ground Y=82 and home X=186:

- 0–100ms: small backward wind-up, offset 0 to +4 pixels.
- 100–180ms: linear slide toward Nova, offset +4 to -100.
- 180–220ms: hold the extended strike at ground X=86.
- 220–420ms: slide back to home.
- After 420ms: idle at home. Idle/hurt/defeated remain stationary.

Integer interpolation sampled by the existing 30ms display loop; motion smoothness/speed need owner hardware review. Full-scene redraw clears prior sprite position. Existing paused game clock freezes movement on Wi-Fi/QR screens. If a player hit interrupts the attack pose, the hurt pose returns immediately to home; victory/defeated also takes priority at home. These abrupt interruption returns are intentional initial behavior and can be refined after review.

Movement is cosmetic. Damage is still applied when the existing enemy tick accepts a strike, before its animation—not on physical sprite contact. Hit detection, cooldowns, HP/XP/leveling, enemy strike interval, saves, Wi-Fi/QR/battery/screens and sprite artwork unchanged. No new difficulty tiers, recolors, wolves, goblins, blocking mechanic or browser game.

## Verification

Target PlatformIO ESP32-S3 build PASS. Extended SlimeAnimation tests PASS: exact trajectory boundaries, idle/hurt/defeated/reset stationary, timer wrap, all millisecond positions through the complete lunge drawn by the actual sprite header within 240×135 bounds. Existing animation tests and actual combat event wiring pass. Core regression: 1,330 assertions PASS. Browser regression: 30 tests PASS. Masked sprite drawing, credential, screen-flow, Nova animation, battery/QR geometry, QR encoder capacity and portal source-contract checks PASS. Build budget, partition binary/source agreement, merged contents/offsets/padding and copy hash verified; git diff whitespace check PASS. No physical gameplay/visual performance claim.

## Delivery

PocketQuest-S3-v0.1.7-Enemy-Lunge.factory.bin — **flash at 0x0000 without full erase**. Routine save-preserving update for existing PocketQuest layout. Verified image stops before saves at 0x4F0000; save/asset filesystems not included/overwritten. NVS padding may reset other settings; chip-derived Wi-Fi credentials remain reproducible. Existing initialized save filesystem required; no autoformat.

Verified offsets: bootloader 0x0000, partitions 0x8000, boot_app0 0xE000, application 0x10000. SHA-256 4c1bd316b33f88fb4a6b396517ea0493cb4aa1646c354eb7c74e704c019c058f. Manifest records local uncommitted working-tree state after checkpoint c0a7c6b.

| Measurement | Result |
| --- | --- |
| Application BIN | 1,444,528 bytes (1.38 MiB); 3,667,280 bytes partition headroom |
| Embedded image payload | 154,802 bytes, unchanged and already within application |
| Modeled illustrated browser asset payload, not in BIN | 1,081,930 bytes |
| Modeled asset filesystem allocation | 1,314,816 / 2 MiB = 62.70%; 782,336 free |
| Allocation including engineering fixtures | 1,392,640 = 66.41%; 704,512 free |
| Complete factory BIN including padding | 1,510,064 bytes (1.44 MiB) |
| Static RAM build report | 52,392 bytes (16.0%), not free-heap/PSRAM telemetry |

No asset threshold warning or partition change. Compared with v0.1.6: application/factory each +112 bytes, no extra artwork storage. Model not actual device filesystem usage.

Owner review: let the slime attack without pressing Face; check that it approaches Nova then returns cleanly, with no trails/clipping. Hit it during the lunge, defeat it, start another encounter, and switch screens mid-lunge. Confirm existing damage/progression/save behavior. Report whether travel distance or speed should change before adding difficulty scaling. Do not claim this passed until observed.

Reproduce: compile tools/test-slime-animation.cpp with core/PocketQuestCore/src/Game.cpp and core include directory; run host regressions, pio run -d firmware, python3 tools/check-build.py; package with tools/prepare-delivery.py --version 0.1.7 --feature Enemy-Lunge --boot-app0 using the pinned framework tools/partitions/boot_app0.bin. No build command flashes a device.
