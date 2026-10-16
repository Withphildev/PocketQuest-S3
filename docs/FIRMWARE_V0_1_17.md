# v0.1.17 — Woodland Revisit

Fixes the completed-quest departure dead end reported by the owner. Owner confirmed all four encounters were already cleared; v0.1.16 intentionally disabled departure at that point. This update permits peaceful exploration without resetting the quest or rewarding it twice.

## Delivery and changes

Download PocketQuest-S3-v0.1.17-Woodland-Revisit.factory.bin. **Flash address 0x0000, without full erase.** Routine save-preserving update from v0.1.14–16. After flashing, reconnect to device Wi-Fi and reload http://PocketQuest/play to replace the old open page.

Completed quest board: **Revisit the woodland** is enabled once device state is connected, writable and not busy/in battle/results. Incomplete routes retain their mandatory encounter gates. Cleared route has no monsters, battle starts, reset, or extra XP. Departure/walking changes presentation only; returning uses the existing durable Camp action to rest. The completed route's touch interact button, keyboard Space and controller Cross all return to Oakwood. Side-panel rest remains available. No new input mapping, rewards, save fields or API commands.

Format-3 saves and rules 4 unchanged, as are partitions, PNG assets, standalone combat, shared XP, resting animation and scenery validation. Retain existing all-cleared saves—no erase or replay initialization needed. Downgrading to v0.1.13 or earlier remains unsafe with format-3 snapshots.

## Verified package and measurements

| Item | Measurement |
| --- | ---: |
| Actual app binary | 2,862,768 bytes (2.73 MiB) |
| App partition free | 2,249,040 bytes (2.14 MiB) |
| Headroom under unchanged 2816 KiB development ceiling | 20,816 bytes |
| Factory BIN with padding | 2,928,304 bytes (2.79 MiB) |
| Embedded browser gzip | 1,275,179 bytes; 105 assets |
| Illustrated stored asset payload model | 1,331,300 bytes |
| Modeled illustrated LittleFS usage | 1,638,400 / 2,097,152 (78.12%) |
| Modeled illustrated free space | 458,752 bytes |
| Model including engineering fixtures | 1,716,224 (81.84%); 380,928 free |
| Static RAM | 52,768 bytes; not runtime heap/PSRAM telemetry |

**Storage warning remains active:** modeled asset usage exceeds the owner's 75% threshold. No PNG optimization, quality change or partition change performed in this small fix. The small text growth crosses one allocation block in the model; no extra artwork was added. Current browser/assets remain embedded in app PROGMEM; filesystem figures are a future model, not additional current usage or on-device telemetry. Storage optimization is the recommended next milestone. The development ceiling is separate from the much larger physical app-partition headroom; neither should be silently changed.

Factory SHA256: `c9795e71e05fa93243c9e646d62bcf0203463c44a1e4c6614ac1f1fc090f318b`.

Verified constituent offsets: bootloader 0x0000, partitions 0x8000, boot_app0 0xE000, app 0x10000. Contents/padding/source hashes match. Factory stops before saves (0x4F0000) and assets (0x5F0000); no filesystem image or initialization included. NVS lies in merged padding, so unrelated NVS settings are not guaranteed preserved. No physical device access/flash/erase performed; no Git push/commit/Release created.

## Tests

- 66 browser tests PASS, including completed demo/device save departure, no reward writes, movement through a cleared route, preservation of locks, existing unfinished-route mandatory gates, rest/input/music and unchanged scenery validation.
- 3,284 sanitized core assertions PASS; no production core/save behavior changed.
- Firmware build, actual-core hero JSON tests, portal DNS source checks and current compiled gzip/hash/105-assets/import/CSP/command-wiring checks PASS.
- prepare-delivery host tests, source/compiled partitions, unchanged size ceiling, offsets, padding, boundaries and artifact-copy/hash checks PASS.
- Browser QA: synthetic actual-C++ engine completed all four encounters through durable transactions, then earned one handheld win (96 total fixture XP). Completed board showed Revisit; Nova walked to the east end without monsters, returned through the touch interact button and reloaded. XP stayed 96, all four nodes remained cleared, departure remained available. No command/sequence change for departure/walking; only Camp advanced the snapshot sequence. Screenshot is synthetic-device QA, not evidence of hardware tests. Physical phone/controller/restart confirmation remains owner testing.

Build browser via `python3 tools/build-route-page.py`; firmware `pio run -d firmware`; run `sh tools/test-host.sh`, `node --test web/tests/*.test.mjs`, `python3 tools/test-route-package.py`. Package with prepare-delivery.py version 0.1.17 feature Woodland-Revisit and pinned framework boot_app0.bin. Synthetic completed-route QA uses route-host.cpp `--complete-route` (test tool only, never in firmware).

Sites skill used for local-only browser changes and QA; no hosted Site or cloud service. Existing unrelated local source changes preserved. Stop for owner review; next work is storage optimization, not new scenery.
