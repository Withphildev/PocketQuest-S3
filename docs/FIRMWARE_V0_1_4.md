# PocketQuest-S3 v0.1.4 — Device Wi-Fi + Large QR

Owner-requested development update, 2026-10-12. No device accessed/flashed. Existing 2.5-second splash, M5 screen cycle, held-M5 sensitivity, Face/motion combat gating, offscreen pause, saves and Nova/slime gameplay preserved.

## Credentials

Generated at runtime from ESP.getEfuseMac(), using the same integer-formatting convention as the PocketBoy reference: SSID PocketQuest- plus the low 16 bits in four uppercase hexadecimal digits; password Quest plus the low 32 bits in eight uppercase hexadecimal digits. Example synthetic chip ID 0x1234E4B1E87C produces PocketQuest-E87C / QuestE4B1E87C. This is a test vector, not a readout of the owner's device.

Credentials no longer depend on random values, Preferences, or NVS. Same hardware and convention produce identical credentials after restart, reflashing, or erasure. Previously stored random passwords are ignored, not manually deleted. Rejoin the hotspot with the newly displayed password after this update. Future firmware must preserve this convention to preserve credentials.

Chip-derived passwords are predictable convenience credentials, not strong security secrets. The truncated identifiers are not guaranteed collision-free across every possible chip; devices sharing the low 16 bits can have the same SSID and those sharing the low 32 bits can share passwords. Normal differing chip suffixes produce differing credentials. No actual device password/MAC embedded in source or delivery notes. The local page remains read-only, without remote gameplay/save commands or Internet access.

## QR and screen layout

QR enlarged from 99×99 to 123×123 pixels at (113,6). Version 4 has 33×33 modules at 3px/module rather than 2px, plus 12px white quiet-zone margins. Left column retains scan instructions, SSID, password, battery and M5 navigation hint. Battery moves to the left on the QR screen only; Wi-Fi information and mini-game retain top-right battery. This avoids obscuring the enlarged code. Large Wi-Fi fonts retained; the 13-character Quest password fits at size 2.

## Verification

PlatformIO ESP32-S3 build PASS. Core host tests: 1,330 assertions PASS. New credential tests verify the example golden vector, repeated generation, differing suffixes and string bounds. Battery/font/QR layout bounds, actual M5GFX QR encoding capacity and four-module quiet zone, screen flow, battle animation, and deterministic battle asset conversion all PASS. Partition-table/source agreement, merged offsets/contents/padding and final copy hash verified; git diff whitespace check PASS. These are automated checks, not physical phone-scan or hardware gameplay claims.

## Delivery and storage

PocketQuest-S3-v0.1.4-Device-WiFi-Large-QR.factory.bin — **flash at 0x0000, without full erase**. Routine save-preserving update for existing PocketQuest layout. File stops before saves at 0x4F0000. No save/asset filesystem initialization included. NVS padding is overwritten, so other settings may reset, but these credentials do not use NVS. Existing save filesystem required; firmware does not autoformat it. Full erase still deletes game saves and requires separate filesystem initialization even though Wi-Fi credentials are reproducible.

Verified offsets: bootloader 0x0000, partitions 0x8000, boot_app0 0xE000, application 0x10000. SHA-256: 4f3f40bce68748424d2c85042955c1e17a40d8c579cf1649d1126665952a4cda. Manifest records base commit and dirty source working tree. No GitHub Release/publication performed.

| Measurement | Result |
| --- | --- |
| Application BIN | 1,405,328 bytes (1.34 MiB); 3,706,480 bytes partition headroom |
| Embedded art payload, already within application | 115,634 bytes, unchanged |
| Browser asset payload, not in factory BIN | 1,067,058 bytes |
| Modeled browser asset filesystem allocation | 1,282,048 bytes (61.13% of 2 MiB), 815,104 free |
| Modeled allocation with engineering fixtures | 1,359,872 bytes (64.84%), 737,280 free |
| Complete factory BIN | 1,470,864 bytes (1.40 MiB) including padding |
| Static RAM build report | 52,384 bytes (16.0%), not runtime heap/PSRAM telemetry |

No asset warning threshold exceeded; no partition change or browser/scenery expansion.

Owner review: confirm displayed chip-derived credentials, phone joining and larger QR scan; normal restart then manual routine reflash should show identical SSID/password; verify all screens/buttons, motion combat and restored progress. Do not full-erase to test credential repeatability. Runtime Wi-Fi, QR scan reliability, display appearance, battery readings and save/restart remain hardware checks not performed by Codex.

Reproduce with pio run -d firmware; run core host tests and tools/check-build.py; compile/run tools/test-device-credentials.cpp, tools/test-battery-ui.cpp, tools/test-screen-flow.cpp and tools/test-battle-animation.cpp (the latter two link core Game.cpp); compile/run tools/test-wifi-qr.c with installed M5GFX QR utility source; Python/Pillow tools/test-battle-art.py. Package with tools/prepare-delivery.py --version 0.1.4 --feature Device-WiFi-Large-QR --boot-app0 pointing to the pinned framework's tools/partitions/boot_app0.bin.
