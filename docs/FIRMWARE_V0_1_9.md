# v0.1.9 — Shared Hero WebUI milestone

2026-10-14. Local-only device dashboard, not a cloud Site or the full browser RPG. Sites skill used for local preview/browser QA; no hosting registration/publication. No physical device accessed/flashed. No repository split, GitHub source push or Release performed. Latest source base remains c0a7c6b with local changes recorded in delivery manifest.

## Shared progression contract

Join PocketQuest hotspot and open http://PocketQuest (fallback http://192.168.4.1). Page is embedded in application flash, with female Nova artwork embedded as PNG data URI; no Internet assets/dependencies or assets filesystem required. Character selector is not implemented.

GET /api/hero returns schemaVersion 1, firmwareVersion, deviceAuthoritative=true, per-boot ID, stable hero ID (16-hex world seed), live state, last successfully persisted saved state or null, and persistence status/availability/error/dirty/sequence. State includes level, cumulative XP, current/max HP, victories, enemy tier/HP, phase, rules version, XP into level/span and revision. Uint64 snapshot sequence/revision serialize as decimal strings to avoid JavaScript precision loss. Max level 99 displays a full bar rather than attempting to divide by zero or invent level 100. Hero identity changes after deliberate game reset, not browser reconnect.

Main loop caches persistedHero only after SaveStore save/write/readback success or successful startup load. HTTP polls copy/read existing state in RAM, do not write flash or change Game. The hero card renders that persisted snapshot; a distinct live panel can show battle XP/HP before the next checkpoint. No fake promise of instant durable saves: existing milestones, 30-second background checkpoint and retry limits unchanged. Startup legacy-rule normalization is reflected in decoded saved state; no save schema/rules change in this update (rules remain 2).

The page polls sequentially every 1.5 seconds after a request completes, uses no-store fetches, 2.5-second abort timeout, a busy guard and manual refresh button. No overlapping refreshes, localStorage, IndexedDB, service worker, cloud sync, progression merge, remote save edit or attack command. Latest API response is authoritative even if progress is lower after deliberate reset. Reconnect/restart fetches the device again; per-boot ID indicates restart. Missing storage, damaged/unsupported/save failures are prominent warnings; lack of saved snapshot shows blanks, never live XP mislabeled as saved. Disconnect dims stale values and explicitly says they are not synchronized. Reconnection replaces stale values.

API and page headers are no-store with nosniff, no permissive CORS. Only GET is allowed; other methods return 405, unknown /api routes return 404. Existing non-API paths serve the page for captive-portal compatibility. CSP restricts assets to the inline page/data portrait and same-origin API; no external requests. The hotspot still has the approved predictable chip-derived credentials: not strong authentication. This milestone exposes read-only hero status to devices on that hotspot, not remote mutation or Internet access.

## Preservation and limitations

StickS3 combat, difficulty, lunge speed, automatic healing, saved rules, buttons, 2.5-second splash, large QR, battery and hostname/credentials unchanged. Offline standalone battles still work. This proves the shared progression read path; no browser adventure/exploration, battle controls, wolf/goblin unlocks, male selection, inventory, quests or cloud functionality added. HTTP/DNS servicing shares the firmware loop; actual latency under phone/multiple-client load and runtime memory/PSRAM still require hardware testing.

## Verification

- Final PlatformIO ESP32-S3 build PASS; embedded HTML/portrait header compiled.
- Core regressions: 1,834 assertions PASS. Existing browser renderer regressions: 30 tests PASS.
- C++/Node dashboard tests use actual Game battle rewards and encode/decode restart snapshots. Verify pending XP12 vs saved XP0, saved XP12 after checkpoint, identical hero/save after restart, missing storage=null saved, save failure with live XP24 vs saved XP12, max-level/uint64 values, JSON escaping and GET-only/no-browser-storage source contracts. PASS.
- Portal hostname/DNS/update wiring source-contract checks PASS. They are not physical network tests.
- Browser QA against a loopback mock serving the actual embedded page: saved, pending, missing filesystem, save failure, reboot, maximum level, disconnected and recovery scenarios visibly verified. Synthetic fixture banner clearly marks mock, not live telemetry. Desktop and 390px phone layout checked; 390px content width equals viewport, including maximum numbers. Saved screenshot is mock evidence, not an actual StickS3 capture.
- Build/partition budget, compiled table/source agreement, merged offsets/contents/padding and copied hash PASS; whitespace check PASS.

## Delivery and storage

PocketQuest-S3-v0.1.9-Shared-Hero-WebUI.factory.bin — **flash at 0x0000 without full erase**. Normal save-preserving update for existing initialized PocketQuest layout, NOT the clean-install reset package. Image ends before saves at 0x4F0000; save/assets filesystems not included/overwritten. NVS padding may reset other settings, not chip-derived credentials. No autoformat or new partition layout. Existing rules-2 saves remain supported; v0.1.7 and earlier cannot read newer-rule saves.

Verified offsets: bootloader 0x0000, partitions 0x8000, boot_app0 0xE000, application 0x10000. SHA-256 a34dd2d7ae5cf02e6944f8c0bdec164896dd8e826f367132f7d6ff5e35955987.

| Measurement | Result |
| --- | --- |
| Application BIN | 1,467,440 bytes (1.40 MiB); 3,644,368 bytes application headroom |
| Existing RGB565/mask art payload | 154,802 bytes, unchanged and within application |
| New embedded dashboard | 11,463 UTF-8 bytes including base64 portrait (PNG original 2,729 bytes); within application, not filesystem |
| Modeled illustrated browser-world asset payload, not flashed | 1,081,930 bytes |
| Modeled asset filesystem allocation | 1,314,816 / 2 MiB = 62.70%; 782,336 free |
| Allocation including engineering fixtures | 1,392,640 = 66.41%; 704,512 free |
| Normal factory BIN including padding | 1,532,976 bytes (1.46 MiB) |
| Static RAM build report | 52,584 bytes (16.0%); not runtime free heap/PSRAM |

No 75% asset warning. Dashboard is not double-counted in modeled asset partition; it is embedded in application. No new filesystem image or clean-install package required for the owner's recovered device.

## Owner end-to-end test

1. Routine flash at 0x0000, no full erase. Check SAVED/RESTORED and existing progression.
2. Join device Wi-Fi, open http://PocketQuest. Verify saved level/XP/HP/victories match latest snapshot, not necessarily transient live HP.
3. With page open, use M5 to mini-game and win a battle. Observe live XP, then saved XP after SAVED checkpoint. Refresh must not grant duplicate rewards.
4. Disconnect Wi-Fi: confirm stale/disconnected warning. Reconnect: confirm latest values replace stale ones.
5. Restart normally, rejoin hotspot if needed, refresh. Verify same saved XP/level/victories; page may note device restart.
6. Report any input lag, save error or missed updates with serial '?' diagnostics. NO SAVE FS requires the separate approved initialization process, not erasing for this update.

These physical checks remain unperformed by Codex. Stop for review before browser gameplay integration.

## Reproduce

From project root, after Nova v2 PNG preparation (or use included generated firmware HeroPage.h):

```sh
python3 tools/build-hero-page.py
c++ -std=c++17 -Icore/PocketQuestCore/src tools/test-hero-status.cpp core/PocketQuestCore/src/Game.cpp core/PocketQuestCore/src/Save.cpp -o /tmp/pocketquest-test-hero-status
node tools/test-hero-status.mjs /tmp/pocketquest-test-hero-status
python3 tools/test-portal-contract.py
sh tools/test-host.sh
node --test web/tests/*.test.mjs
pio run -d firmware
python3 tools/check-build.py
```

tools/preview-hero.mjs serves local-only mock on 127.0.0.1:4180 from embedded header and generated synthetic fixtures; its scenario controls are never in firmware. Stop with Ctrl-C. Package with tools/prepare-delivery.py --version 0.1.9 --feature Shared-Hero-WebUI --boot-app0 using pinned framework tools/partitions/boot_app0.bin. No build/preview/delivery command flashes a device.
