# PocketQuest-S3 v0.1.3 — Screen Polish

2026-10-12 development update. The owner reports v0.1.2 buttons working well; retain the approved M5 screen cycling, Face attack, held-M5 sensitivity tuning, 2.5-second splash and offscreen combat pause. No physical device accessed/flashed in this milestone.

## Presentation

PocketBoy-S3 local reference src/main.cpp inspected for exact layout: default font at text size 2 for title/SSID/password, size 1 for labels/status, top-right battery percentage and icon. Remote GitHub fetch was unavailable; local reference was used without modifying it.

PocketQuest Wi-Fi information now matches those sizes and label positions. PocketQuest S3 title ends before the battery region. Numeric browser address remains http://192.168.4.1 (no hostname added). Small labels/status identify the connection-only page, not a browser RPG.

Battery percentage and icon appear on Wi-Fi, QR, and mini-game screens. Read from M5.Power at startup and every five seconds; unknown is --%, low <=15% red, <=35% yellow, otherwise green. Charging adds '+'. Splash art stays untouched. Game XP/level moved to a separate line to avoid battery overlap.

QR moved to (137,29), 99×99, below header, leaving battery readable. Actual M5GFX encoder version 4: 33 modules, 2px/module with 16px white margins, satisfying four-module quiet zone. This is smaller than v0.1.2's QR and requires phone scan review; no validation requirement was weakened.

## Device-specific credentials

SSID remains PocketQuest-XXXX, using the chip identifier's four-hex suffix as in the reference naming style. This is a device suffix, not a global uniqueness guarantee for all possible devices. Password is randomly generated on first startup, then saved in the device's pqwifi NVS namespace. It stays the same across normal restarts when NVS is writable. Validation accepts only the generated 12-character uppercase hex format. Storage failures are reported to serial, with an ephemeral random password fallback. No real device secrets or shared password embedded in source.

Deliberate security difference: PocketBoy derives its password from the chip ID; PocketQuest uses a stored random password instead of a guessable MAC-derived value. **Factory flashing overwrites NVS padding, so a new password is expected after flashing this or a future factory BIN.** Rejoin using the displayed password; phones may need to forget the old network. Runtime credential persistence has not yet been physically tested.

## Verification and delivery

PlatformIO target build PASS. Battery clamp/fill and default-font bounding checks PASS. Screen-flow, battle-animation and deterministic RGB565 asset checks PASS. Actual M5GFX QR encoder accepts full Wi-Fi payload and quiet-zone geometry checks PASS. Core regression: 1,330 assertions PASS. Compiled partition table/source comparison, merged segments/padding and copy-hash verification PASS. git diff whitespace check PASS.

File: PocketQuest-S3-v0.1.3-Screen-Polish.factory.bin. **Flash address 0x0000. Routine save-preserving update for existing PocketQuest partition layout; do not full-erase.** Image stops before saves at 0x4F0000; saves/assets filesystem are not included or overwritten. NVS settings/credentials may be overwritten. Existing save filesystem required, no automatic formatting. Offsets: bootloader 0x0000, partitions 0x8000, boot_app0 0xE000, application 0x10000. SHA-256: 040d4095f9737ed510ca61129625fbf770bc683a6b00f8c968911d9abb9de7cb.

| Measurement | Result |
| --- | --- |
| Application BIN | 1,408,880 bytes (1.34 MiB); 3,702,928 bytes partition headroom |
| Embedded image payload, counted within application | 115,634 bytes, unchanged |
| Browser asset payload, not in BIN | 1,067,058 bytes |
| Modeled browser filesystem allocation | 1,282,048 bytes (61.13% of 2 MiB), 815,104 free |
| Modeled allocation with engineering fixtures | 1,359,872 bytes (64.84%), 737,280 free |
| Factory BIN including padding | 1,474,416 bytes (1.41 MiB) |
| Static RAM build report | 52,432 bytes (16.0%); not runtime heap/PSRAM telemetry |

No partition changes, asset warning threshold not exceeded. Browser prototype unchanged, no scenery library/Phase 2B work. Sources remain in the existing dirty working tree; manifest records base commit and dirty status. No GitHub Release created.

Owner tests: confirm Wi-Fi title/SSID/password legible and unclipped; percentage/charging icon reflects device, including unplugged/plugged behavior; scan repositioned QR; connect and open numeric browser address; restart without reflashing and verify the password remains stable; confirm existing M5/Face/motion/game/save behavior. Battery accuracy, QR scan reliability, NVS retention and physical display/gameplay performance remain unverified.

Reproduce build/delivery as v0.1.2, using version 0.1.3 and feature Screen-Polish. Additional regression: compile/run tools/test-battery-ui.cpp; rebuild/run tools/test-wifi-qr.c against installed M5GFX QR utility source. Battery tests are geometry/calculation checks, not a claim of physical display inspection.
