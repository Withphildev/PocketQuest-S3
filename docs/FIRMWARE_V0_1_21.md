# v0.1.21 — Mini Splash

Owner supplied replacement splash, 2026-10-15: both Novas, PocketQuest Mini title, no Pip. Original PNG preserved as firmware/artwork-sources/PocketQuestMini-Splash-Owner.png; previous PocketQuest-Splash-Owner.png retained. Actual dimensions 1672×941. Master SHA256 `2a03bb49a3a7efffe2764f644ff72b0193a7bdf3ea58b6220740903e3660ab08`.

Existing prepare-battle-art.py uses Pillow 12.3.0 to uniformly downsample to 240×135 with Lanczos, with black padding if needed, never stretching or cropping. RGB565 conversion reduces color precision for the LCD; it is not lossless preservation of the full-resolution illustration. Original master untouched, no AI generation/edit. Source dimensions, source-relative path and hash recorded in firmware/include/art/preparation.json. Regeneration test now uses the recorded source instead of hardcoding the former splash. Existing Nova idle/attack headers regenerate identically. Splash storage is unchanged: 68,850 bytes including its mask.

2500ms splash and Wi-Fi → QR → mini-game flow unchanged. No gameplay, save format, partitions, Wi-Fi credentials/URL, browser or controller behavior changes. Endless-road systems/fullscreen remain future work. Source not committed/pushed; no GitHub Release. No physical device accessed, flashed or erased.

## Owner download

PocketQuestMini-S3-v0.1.21-Mini-Splash.factory.bin — **flash at 0x0000 without full erase**. Routine save-preserving update from v0.1.14–20, not a clean-install initializer. SHA256 `66161346dc7799f6ffcf59cb83a5de3cc1615ac5386707baf1f6737abb61d855`.

Merged source/offset/padding/hash checks verify bootloader 0x0000, partitions 0x8000, boot_app0 0xE000, application 0x10000. Ends before saves 0x4F0000/assets 0x5F0000; no filesystem images. NVS padding can overwrite unrelated settings. Format 3/rules 4 unchanged; do not downgrade to v0.1.13 or earlier.

## Four storage measurements

| Measurement | Bytes |
| --- | ---: |
| Application BIN | 2,755,344 (2.63 MiB) |
| Factory BIN with padding | 2,820,880 (2.69 MiB) |
| Illustrated stored asset payload model | 1,220,220 |
| Illustrated modeled filesystem | 1,531,904 / 2,097,152 (73.05%) |
| Model including engineering fixtures | 1,581,056 (75.39%) |

Sizes unchanged from v0.1.20. App partition headroom 2,356,464 bytes; headroom under unchanged 2816 KiB development ceiling 128,240. Static RAM 52,768 bytes, not runtime heap/PSRAM telemetry. Illustrated model free 565,248 bytes; fixture-inclusive 516,096. Fixture-inclusive model remains above 75% warning. Assets are currently embedded in application, not additionally installed into the modeled asset filesystem. Browser gzip unchanged at 1,167,692 bytes / 105 assets.

## Verification

- Build PASS; merged-image delivery checks PASS.
- Every generated LCD RGB565 pixel and mask checked against prepared images; deterministic regeneration and source hash PASS.
- Screen-flow test PASS: 2500ms boundary, ignored splash input, M5 cycle, timer wrap, offscreen combat pause.
- 73 browser tests, 3,284 sanitized core assertions, animation tests and 48 actual-C++/browser combat intent parity cases PASS.
- Hero JSON/restart/unsaved handling, rebrand/header bounds/legacy credentials, friendly URL and current package/application payload checks PASS.
- Native-size 240×135 exported preview inspected: complete composition and Mini title visible. This is source/export inspection, not physical LCD validation.
- git diff --check PASS.

Rebuild with bundled Pillow 12.3.0: prepare-battle-art.py firmware/artwork-sources/PocketQuestMini-Splash-Owner.png; test-battle-art.py; pio run -d firmware; prepare-delivery.py --version 0.1.21 --feature Mini-Splash with pinned framework boot_app0.bin.

Owner test: flash without erase, restart normally, confirm new splash legibility and 2.5-second duration, then unchanged Wi-Fi/QR/buttons/combat and saved XP. Physical tests pending.
