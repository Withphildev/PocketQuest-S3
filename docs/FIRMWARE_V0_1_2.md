# PocketQuest-S3 v0.1.2 — Four Screens

Development build, 2026-10-12. Based on the locally available PocketPal-S3 reference screen flow (Splash → ConnectionInfo → WifiQr → app); PocketPal was not modified. Owner-approved difference: short M5 cycles screens, leaving Face dedicated to combat. The remote GitHub fetch was unavailable; the existing local reference source was inspected instead.

## Controls and flow

1. Illustrated splash: 2,500 ms from completion of splash drawing, then automatically Wi-Fi information. Button events during splash are discarded. Timing is loop-driven; a slow operation can delay a transition, never shorten its minimum.
2. Wi-Fi information: real local hotspot SSID, password, and http://192.168.4.1 connection page. M5 short press opens QR.
3. QR: Wi-Fi joining payload, not a browser URL. M5 short press opens mini-game.
4. Mini-game: female Nova's right-facing sword animation against the existing slime. Face starts encounters/attacks; motion attacks also work here. M5 short press returns to Wi-Fi information.

Hold M5 for one second changes motion sensitivity without also advancing a screen. It works after the splash. Serial 'd' toggles debug; '?' prints diagnostics. Combat input is gated to mini-game only; a navigation event cannot also trigger an attack. IMU sampling/calibration and network servicing continue on all screens. Runtime combat/animation time pauses offscreen, preventing unseen enemy damage and preserving pending attack cooldowns. Save format, combat rules, XP, leveling and filesystem layout remain unchanged.

## Connection behavior and limits

PocketQuest-XXXX is a WPA-protected AP, with a 12-character random hexadecimal password generated on each restart and displayed on the device. No home Wi-Fi credentials, hardcoded shared password, or device-specific secret is committed. Restart requires reconnecting with the new password (phones may need to forget/rejoin the SSID). Hotspot has no Internet. Wildcard DNS and a small read-only HTTP connection landing page are included; no remote combat controls, save mutations, browser forest assets, or browser RPG are served. Use the numeric URL if automatic captive-portal discovery does not open the page. Wi-Fi remains on in mini-game and may increase battery consumption.

QR uses the installed M5GFX encoder, version 4, 33×33 modules. A 123×123 pixel white box contains 3-pixel modules and a four-module quiet zone. Network characters are restricted to generated hex and the fixed SSID prefix, avoiding QR escaping ambiguity. Host encoding/capacity checks pass; actual phone scan reliability remains an owner hardware test.

## Verified delivery

PocketQuest-S3-v0.1.2-Four-Screens.factory.bin — **flash at 0x0000**. Routine save-preserving update for the existing PocketQuest layout, **without full erase**. Verified file ends before saves at 0x4F0000; neither saves nor assets filesystem is included. NVS padding is included, so NVS settings may be overwritten. The pre-existing save filesystem is required; firmware never autoformats it. This is not a clean-install filesystem package.

Offsets verified byte-for-byte: bootloader 0x0000, partitions 0x8000, boot_app0 0xE000, application 0x10000. Partition CSV and compiled table match. Padding is 0xFF. Copy SHA-256: 06094604d023ba0ed70ac2aed6a99b8601db792c3f353496c9dc4512a5a1de9d. Delivery manifest identifies the base commit and uncommitted working-tree state; no GitHub Release was published.

## Build, tests, storage

Target PlatformIO build PASS. Static RAM: 52,280 bytes (16.0% of declared internal RAM), not runtime free heap/PSRAM telemetry. The app growth reflects Wi-Fi, HTTP/DNS, and QR support, not additional scenery.

- Core host regression: 1,330 assertions pass (combat, motion, saves/recovery).
- Screen flow: 2,500 ms boundary, discarded splash input, three-screen M5 cycle, uint32 wraparound, offscreen paused-clock policy pass.
- Battle animation: timings, wraparound, rejected cooldown and finishing-blow tests pass.
- Battle assets: every RGB565 pixel/mask and deterministic regeneration pass.
- Wi-Fi QR: actual library encoder accepts full payload in version 4; quiet-zone geometry pass.
- Build/partition budget and merged image contents/offsets/hash checks pass; git diff whitespace check passes.

| Measurement | Bytes / usage |
| --- | --- |
| Application BIN | 1,394,768 (1.33 MiB); 3,717,040 bytes partition headroom |
| Embedded splash/idle/attack art | 115,634, already counted in application |
| Browser asset inventory, not included in BIN | 1,067,058 |
| Modeled browser LittleFS allocation, not device telemetry | 1,282,048 / 2 MiB = 61.13%; 815,104 free |
| Modeled allocation with engineering fixtures | 1,359,872 = 64.84%; 737,280 free |
| Factory BIN including padding | 1,460,304 (1.39 MiB) |

No 75% modeled asset warning. No partition changes or new filesystem image. Browser source unchanged in this milestone; the storage model was rerun, not browser functionality expanded.

## Owner testing required

No physical device was accessed or flashed. Verify splash duration, M5 forward cycle and held-button behavior; join hotspot, open numeric URL, scan QR on a phone; confirm Face/motion do nothing offscreen and combat pauses there; check Nova animation, slime combat, XP/leveling, save status and restored progress after restart. Actual AP startup, QR scanning, free RAM/PSRAM, battery use and gameplay/display performance are not verified yet. Stop for owner review before further feature work.

Reproduce: pio run -d firmware; sh tools/test-host.sh; Python/Pillow tools/test-battle-art.py; compile tools/test-screen-flow.cpp and tools/test-battle-animation.cpp with core/PocketQuestCore/src/Game.cpp and core include path; compile tools/test-wifi-qr.c with the installed M5GFX lgfx_qrcode.c and utility include path; python3 tools/check-build.py; tools/prepare-delivery.py --version 0.1.2 --feature Four-Screens --boot-app0 using the pinned framework's tools/partitions/boot_app0.bin.
