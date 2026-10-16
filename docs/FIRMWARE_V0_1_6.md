# PocketQuest-S3 v0.1.6 — Blue Slime

Owner-approved blue slime sprite integration, 2026-10-12. No device accessed, erased or flashed. Source remains local uncommitted work after checkpoint c0a7c6b; no new GitHub Release or source push performed.

## Implemented

Replaces the geometric slime placeholder with eight-frame RGB565/mask artwork, shared with the PNG browser sprite pack. Two idle poses cycle at 300ms/frame. An accepted player attack triggers the slime's hurt pose for 220ms. Enemy damage from Game.tick triggers wind-up/lunge/recovery for 100/120/200ms; damage remains applied at its original tick, not delayed until the animation lunge. Defeated slime stays as a flattened puddle while Phase::Victory is active, including level-up victories and restored victory saves. A new encounter resets the enemy animation. Enemy ground anchor is (186,82); 48×48 frame pivot (24,42). Full scene redraw clears old pixels.

The defensive/block pose remains embedded but is not selected by current combat. No blocking/damage-reduction mechanic invented. Last accepted cosmetic notification wins if hit and enemy attack happen in the same loop; victory presentation takes precedence. Runtime animation uses the existing paused game clock, so screen navigation does not advance combat or enemy poses. The geometric line connecting player/enemy during attacks is removed; Nova's sword animation remains.

HP, monster HP (18), level-1 damage (7), cooldown (650ms), enemy strike interval (1800ms), XP (12/victory), leveling, motion tuning, save format and partition layout unchanged. Button screen flow, 2.5-second splash, battery, chip-derived credentials, large joining QR and http://PocketQuest remain. Dire wolves, goblins, color variants and browser mini-game are not added in this build; the device's browser page is still connection-only.

## Verification

- PlatformIO ESP32-S3 target build PASS; actual Arduino PROGMEM header compiled.
- Core regression: 1,330 assertions PASS, including combat, motion, saves and recovery.
- New SlimeAnimation tests PASS: idle, attack/hurt duration boundaries, defeated precedence, uint32 wraparound, rejected hits, actual enemy damage tick and next encounter reset.
- Eight-frame PNG transparency/geometry/atlas, every LCD pixel/mask, deterministic regeneration PASS.
- C++ host display test PASS: all eight frame draws match full-screen expected pixels at the intended anchor, bounds, invalid-frame guards.
- Firmware embedded header byte-matches the generated/tested export.
- Credential, screen-flow, Nova animation, battery/QR geometry, QR encoder capacity and portal source-contract checks PASS.
- Browser regression: 30 tests PASS.
- Partition/source agreement and merged image contents/offsets/padding/copy hash PASS; git diff whitespace check PASS.

These are automated results, not physical LCD/gameplay/motion/save restart results. Rendering performance, appearance and phone network behavior remain owner tests.

## Delivery

File: PocketQuest-S3-v0.1.6-Blue-Slime.factory.bin. **Flash at 0x0000 without full erase.** Routine save-preserving update for existing PocketQuest layout; image stops before saves at 0x4F0000. Save/asset filesystems not included or overwritten. NVS padding may reset other settings; chip-derived SSID/password remain reproducible. Existing initialized save filesystem required; firmware does not autoformat.

Offsets verified: bootloader 0x0000, partitions 0x8000, boot_app0 0xE000, application 0x10000. SHA-256 fac0717052ea986001ad6784131fa7644b4392a0c70831404fe6513ac0954f1f.

| Measurement | Result |
| --- | --- |
| Application BIN | 1,444,416 bytes (1.38 MiB); 3,667,392 bytes partition headroom |
| New embedded slime data | 39,168 bytes: RGB565 36,864 + masks 2,304 |
| Total embedded image payload, within application | 154,802 bytes |
| Browser eight-frame slime PNG payload | 14,567 bytes; not separately installed in device filesystem |
| Modeled total illustrated browser payload including slime | 1,081,930 bytes |
| Modeled asset filesystem allocation | 1,314,816 / 2 MiB = 62.70%; 782,336 free |
| Allocation with engineering fixtures | 1,392,640 = 66.41%; 704,512 free |
| Factory BIN including padding | 1,509,952 bytes (1.44 MiB) |
| Static RAM build report | 52,392 bytes (16.0%); not runtime heap/PSRAM telemetry |

Below the 75% modeled asset warning threshold; no partition changes. Browser filesystem model is not on-device usage or a deployment. Raw/header/atlas/source/preview duplicates excluded from PNG model. Embedded data is already counted in application, not added again to filesystem usage.

## Owner checklist

Flash routine update, restart normally, confirm blue slime size/idle readability, Face and motion hits show Nova swing and slime recoil, enemy strike shows lunge, final blow shows defeated puddle and correct XP/level. Start next encounter and confirm normal idle restores; switch screens mid-battle and confirm no hidden damage, then return. Confirm saved progression after restart. If sprite trails/clipping or sluggishness occur, report behavior and serial '?' diagnostics. Do not claim this checklist passed until observed.

## Reproduction

```sh
python3 web/tools/prepare-slime.py web/artwork-sources/slime-blue/source-clean.png web/build/slime-blue
python3 web/tools/test-slime.py web/build/slime-blue
cp web/build/slime-blue/SlimeBlueSprites.h firmware/include/art/SlimeBlueSprites.h
c++ -std=c++17 -Icore/PocketQuestCore/src tools/test-slime-animation.cpp core/PocketQuestCore/src/Game.cpp -o /tmp/pocketquest-test-slime-animation
/tmp/pocketquest-test-slime-animation
sh tools/test-host.sh
pio run -d firmware
python3 tools/check-build.py
```

Pillow 12.3.0 and existing Nova idle source preparation required for review GIF generation as documented in BLUE_SLIME_REVIEW.md. Package with tools/prepare-delivery.py --version 0.1.6 --feature Blue-Slime --boot-app0 using the pinned framework tools/partitions/boot_app0.bin. These build commands do not flash hardware.
