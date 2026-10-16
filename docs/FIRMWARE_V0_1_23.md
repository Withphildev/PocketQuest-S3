# v0.1.23 — Road Flow

Owner requested two small adjustments after reviewing v0.1.22. No gameplay rebalance, new assets, chest loot or fullscreen work in this pass. Sites skill used locally for browser implementation/QA; no hosted publication, Git commit/push/Release or physical device access.

## Changes

- Removed Continue exploring button. Saved victory and escape results automatically call the existing Continue transaction before exploration controls unlock. This includes reloading a pending saved result. A legacy fixed-route boss still returns to Oakwood through its existing branch, now automatically; new journey bosses resume the road. Defeat retains the explicit Return to Oakwood action.
- No browser-local reward mutation. Core combat, reward/save/receipt logic is unchanged. Busy, unavailable, disconnected, unwritable, hidden or inactive pages do not automatically transition; reconnect/foreground resumes after authoritative state returns. If a command outcome is uncertain, no local result is guessed and the existing recovery lock remains.
- Oakwood direction sign is now drawn only in the first outward section (section index0) of each outing. It is absent from later repeated sections and the peaceful return stretch. Left exits and Head home remain available everywhere. Oakwood rest art itself is preserved, including when returning home.
- Owner reports PS5 controller works on their setup. Fullscreen was NOT enabled in v0.1.22 and remains pending; no controller/fullscreen changes in this pass.

## Manual-flash download

**PocketQuestMini-S3-v0.1.23-Road-Flow.factory.bin — flash at 0x0000 WITHOUT FULL ERASE.** SHA256 `0349d0abc2ce6728baf2264cdc52183d41e3a8c5b4b2ec3910a2f1a294d02b12`.

Routine update from v0.1.22: save format4/rules4, snapshot paths and partition layout unchanged. Older formats1/2/3 remain readable as before. **Do not downgrade to v0.1.21 or earlier after format4 saves.** Mini splash/2500ms flow, handheld combat, credentials and http://PocketQuest unchanged. No device flashed/erased/tested physically.

Merged segments verified byte-for-byte: bootloader0x0000, partitions0x8000, boot_app0 0xE000, app0x10000. Erased-value padding, endpoints, copied bytes and SHA256 checked. Ends before saves0x4F0000/assets0x5F0000; no filesystem images. NVS padding can overwrite unrelated settings. Not a clean-install initializer.

## Four storage measurements

| Measurement | Bytes |
| --- | ---: |
| Application BIN | 2,761,840 (2.63 MiB) |
| Factory BIN including padding | 2,827,376 (2.70 MiB) |
| Illustrated stored asset payload model | 1,223,027 |
| Illustrated modeled filesystem | 1,536,000 / 2,097,152 (73.24%) |
| Model including engineering fixtures | 1,585,152 (75.59%) |

Application grew 400 bytes versus v0.1.22. App partition headroom2,349,968 bytes; unchanged2816 KiB development-ceiling headroom121,744. Browser gzip1,170,941 bytes/105 assets. Static RAM52,832 bytes, not runtime heap/PSRAM telemetry. Illustrated model free561,152; with fixtures512,000. Fixture-inclusive 75% review warning remains active. This is a future filesystem model, not physical usage: current assets are embedded in the app and not separately installed into the assets partition. No image changes or repartition.

## Validation

- Firmware build, current-gzip/app payload, version/partition/merged-image checks PASS.
- 88 browser tests PASS, including auto-resume eligibility/locks, one-time rewards, escaped encounter gate preservation, authoritative restored/uncertain continuation, entrance-only marker and UI wiring.
- 5,132 sanitized core assertions, handheld animation tests, 48 original combat-intent parity cases and 189 journey policy/adapter cases with567 actual-C++ response comparisons PASS. Core and save implementation unchanged by this pass.
- Hero JSON/restart/persistence reporting, friendly URL/credential wiring, branding/header bounds and git diff --check PASS.
- Synthetic C++ browser QA: fought both Wolves using two Power Strikes, then returned automatically to EXPLORE/sequence7/shared XP36 without pressing Continue. Walked into section2, inspected its entrance without the repeated sign, then left through its left edge to the saved peaceful return path. No captured console errors. Screenshot uses synthetic state, not physical device evidence.

Owner test: flash without erase, reconnect/reload /play; win an ordinary/boss battle and walk immediately without an extra button; Run should resume with the original encounter still blocking progress; check first entrance sign only, later left exits, and existing saves/controller/touch behavior. Physical tests pending. Offline review is isolated and resets on reload, with no real device XP/saves.

Build: `python3 tools/build-route-page.py`; `pio run -d firmware`; `node --test web/tests/*.test.mjs`; `sh tools/test-host.sh`; `python3 tools/test-route-package.py`; `python3 tools/prepare-delivery.py --version 0.1.23 --feature Road-Flow --boot-app0 /absolute/path/to/pinned/boot_app0.bin`.
