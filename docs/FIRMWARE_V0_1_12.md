# v0.1.12 — all-in-one firmware + browser demo

2026-10-14. Owner requested one downloadable BIN containing the latest touch/gamepad/music route prototype and working StickS3 game. Sites skill used in local-only mode for the dashboard/link and compressed HTTP browser verification. No physical StickS3 accessed/flashed/erased, GitHub push, Release, production scenery, repository split or broad Phase 2B work.

## Owner installation

Download PocketQuest-S3-v0.1.12-All-In-One-Web-Demo.factory.bin. Flash at **0x0000 WITHOUT full erase** using ESP Launchpad. This is a save-preserving routine update for the existing initialized PocketQuest layout, not a clean-install/reset package. No additional asset filesystem flash needed.

After normal restart, join the chip-specific PocketQuest hotspot and open http://PocketQuest. Choose **Play woodland demo**. Direct path: http://PocketQuest/play; numeric fallback http://192.168.4.1/play. The QR still joins Wi-Fi. First game-page load transfers 1,083,556 compressed bytes; allow it to finish before testing. No Internet/CDN/soundfont is needed. Music is OFF until tapped, and plays on the phone/tablet/computer, not the StickS3 speaker. Real hero dashboard remains at / and has a return link from the demo.

Included: prior standalone Nova/slime/wolf/goblin combat, controls, motion/difficulty/XP/level/saves, splash/Wi-Fi/QR/battery/hostname; browser route with both Novas, four encounter nodes, groups/captain, turn-based controls, touch D-pad, target taps, optional original synthesized exploration/battle/boss music, and standard browser gamepad mappings.

**Browser combat is still demo-only.** Serving it from StickS3 does not synchronize its XP or character selection to the real hero. Its progress is in memory and resets on reload. Device /api/hero remains read-only; no remote attack/reward/save API added. The banner now accurately distinguishes device hosting from hero-save integration. Female sword cue, male static battle pose, enlarged goblin boss and other design-demo limits remain as documented in ROUTE_RPG_SLICE.md / ROUTE_TOUCH_GAMEPAD_MUSIC.md.

PS5 controller pairs with the device running the browser, not the StickS3. Physical Bluetooth compatibility has not been verified. Gamepad access can be unavailable on plain-HTTP hotspot origins due to browser secure-context restrictions. Touch/keyboard remain available; do not disable browser security. Direct Bluetooth-to-StickS3 remains unresolved. See [W3C Gamepad](https://www.w3.org/TR/gamepad/).

## Packaging / save boundaries

The entire browser demo is losslessly gzip-compressed inside application flash, with a generated PROGMEM header. All 99 embedded assets and module import mappings are included. Decompression occurs in the browser, not the ESP32. Explicit binary length is passed to WebServer::send_P; gzip is not treated as a NUL-terminated string or assembled into a megabyte RAM String. The pinned framework's direct flash-content send path was inspected.

GET /play sends HTML MIME, Content-Encoding gzip, no-store and nosniff. Its CSP permits inline/data modules and data images, but connect-src none: this demo cannot contact the hero API. Dashboard CSP and GET-only API remain separate. The existing portal handler rejects non-GET requests. The generated page adds only a dashboard backlink and hosting-accurate demo banner to the reviewed source.

Firmware WebServer is synchronous. A slow initial page transfer can occupy the firmware loop and delay physical input/game updates during loading; responsiveness and multiple-client behavior must be tested on hardware. Host compilation/HTTP mock checks are not Wi-Fi throughput, watchdog, free-heap or PSRAM validation.

Partitions unchanged. Verified segments: bootloader 0x0000, partition table 0x8000, boot_app0 0xE000, application 0x10000. File ends at exclusive address **0x298F30**, before saves at **0x4F0000** and assets at **0x5F0000**. No blank save/asset filesystems or intervening save-region padding included. Existing NVS lies within prefix padding and may reset unrelated settings; MAC-derived SSID/password remain repeatable. No automatic filesystem formatting.

Save format 2 / rules 4 unchanged from v0.1.11. Prior validated migration paths remain; this update makes no new schema change. v0.1.10 and earlier cannot read rules-4 saves. Missing filesystem after full erase still needs the separate initialization process; do not full-erase for this update.

Factory SHA-256: bc186fa6316eb5aa5a446c5dfa230520556712dd655838d2174f9a624773bb35.

## Four separate storage measurements

| Measurement | Result |
| --- | --- |
| Actual application BIN | 2,658,096 bytes = 2.53 MiB |
| Application partition headroom | 2,453,712 bytes = 2.34 MiB |
| Actual embedded browser gzip payload, already inside application | 1,083,556 bytes = 1.03 MiB |
| Browser HTML uncompressed | 1,537,118 bytes; includes 99 assets |
| Embedded hero dashboard, already inside application | 12,135 bytes |
| Modeled separate illustrated asset payload | 1,142,782 bytes, NOT additionally flashed |
| Modeled separate LittleFS allocation | 1,425,408 / 2,097,152 = 67.97%, 671,744 free |
| Complete factory BIN including padding | 2,723,632 bytes = 2.60 MiB |
| Static RAM build report | 52,584 bytes = 16.0%; not runtime heap/PSRAM |

The assets partition is not populated or required by this build. The separate LittleFS model is retained for future storage planning, not counted as another installed copy of the embedded browser assets. With engineering fixtures modeled allocation is 1,503,232 = 71.68%, 593,920 free; no 75% review warning. Existing partition contents/free space have not been read from the device. The app also remains below the unchanged 2,816 KiB engineering build ceiling; no validator/budget checks weakened.

## Build and verification

- PlatformIO target build PASS, 21.94s. Explicit PROGMEM payload compiled into actual ESP32-S3 application.
- Core host regressions (address/undefined-behavior sanitizers): 2,000 assertions PASS.
- Browser suite: 43 tests PASS. Hero API C++/Node tests and friendly URL/DNS source-contract tests PASS; version reports 0.1.12.
- Package test PASS: generated header byte identity, gzip roundtrip, compressed/raw hashes, 99 PNG/JSON assets, all module import targets, CSP, GET/explicit-size wiring, dashboard link, and exact current gzip found once inside compiled application BIN.
- Compiled/source partition agreement, application ceiling, merged constituent offsets/bytes/padding, save boundary and copied file SHA PASS via delivery tool.
- Local transport mock serves exact compiled-input gzip and firmware-equivalent headers/CSP. Dashboard-to-/play navigation, successful asset validation/rendering, held D-pad, engagement, slime battle/victory and music Enable/Mute verified. No /play console errors observed. Mock /api/hero deliberately returns unavailable, not invented device telemetry.
- Screenshot PocketQuest-v0.1.12-Packaging-Mock.jpg is **local transport mock evidence**, not a physical device capture despite the deployed page's hosting banner. No game progress in that screenshot is a real hero save.
- git diff whitespace PASS. No claims of physical load/animation/network/audio/gamepad/save/restart tests passing.

## Reproduce

From project root with the already prepared art directories from prior milestones:

```sh
python3 tools/build-route-page.py
python3 tools/build-hero-page.py
pio run -d firmware
node --test web/tests/*.test.mjs
python3 tools/test-route-package.py
python3 tools/check-build.py
python3 tools/prepare-delivery.py --version 0.1.12 --feature All-In-One-Web-Demo --boot-app0 /absolute/path/to/pinned/framework/tools/partitions/boot_app0.bin --output-dir /absolute/output/path
```

build-route-page.py runs the existing self-contained builder, modifies only hosting text/backlink, gzips deterministically and writes firmware/include/RoutePage.h plus web/build/route-delivery hashes/payload. The generated header is required for normal PlatformIO compilation. preview-route-package.mjs is an optional loopback HTTP mock, never a device connector. Source base remains c0a7c6b plus local changes; not newly pushed.

## Owner test checklist

1. Flash at 0x0000, no full erase. Confirm saved StickS3 hero progress still restores and standalone buttons/motion/slime/wolf/goblin battles work.
2. Join the same SSID/password. Open http://PocketQuest, confirm real saved hero values, choose Play woodland demo.
3. Let artwork finish loading. Test portrait/landscape touch controls, group targeting, captain, music Enable/Mute/volume and background/resume. Report blank pages, loading problems, resets or stalls with serial '?' diagnostics if available.
4. Return to dashboard: confirm browser victories did not alter real hero XP. Reload /play and confirm its demo restarts as labeled.
5. Restart normally and confirm the actual saved StickS3 hero remains intact. Check display/network responsiveness while another client initially loads the page; do not assume the host mock proves this.
6. Controller pairing is to the browser device and may be blocked on HTTP. Report browser/OS/origin rather than changing security settings. Physical gamepad and speaker audio remain owner checks.

Stop for owner review. No flashing performed by Codex.
