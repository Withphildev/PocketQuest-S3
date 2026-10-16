# v0.1.15 — A Safe Road Home

Development milestone, 2026-10-15. Owner manually flashes; no physical device was opened, flashed or erased during this work. Previous v0.1.14 shared XP/restart persistence was owner-verified; this build needs new hardware testing.

## Implemented

- Oakwood home/quest board, departure, four ordered woodland encounters, captain victory and return-home welcome. Uses existing artwork; no new village scenery or production assets.
- Quest completion derives from the saved cleared mask (15). The existing encounter rewards total 84 shared XP, including 36 captain XP. No extra claim/turn-in reward, gold, equipment, or new reward endpoint.
- Each browser victory restores up to 6 HP, capped at maximum. Existing level-up full recovery remains. Healing is saved in the same transaction as the reward and cannot repeat on Continue, reload or an identical command retry.
- Free retreat/rest restores browser HP, focus and two potions; retains earned XP and cleared encounters. An unfinished enemy/group resets on retreat. Defeat offers return to Oakwood without loss of XP/levels or cleared gates.
- Existing shared hero, device authority, mandatory stops, collision/scenery validator, motion/button standalone combat, touch/gamepad and opt-in synthesized music retained. Sites skill used for local-only browser implementation/preview, not cloud hosting.

## Save/update behavior

Routine save-preserving update from v0.1.14: flash the factory BIN at **0x0000 without full erase**. Partitions unchanged. Save format remains 3 (84-byte snapshots), rules remain 4. Existing XP, level and route progress are preserved. A previously completed route stays completed and does not grant rewards again. Do not downgrade to v0.1.13 or earlier after format-3 snapshots have been written.

Active battles/results resume from saved device state. Exploration reload begins at the Oakwood board; current walking position and visual protagonist choice are not persisted. Visiting the board after reload does not itself heal—use Return to Oakwood / rest. No real-time offline damage, timers or daily streaks.

Handheld/browser combat HP remain separate; XP/level are shared. Active browser battles pause handheld combat; Hold Face abandons/rests through the saved command. Finish an active handheld encounter before browser actions.

The merged file contains bootloader at 0x0000, partition table at 0x8000, boot_app0 at 0xE000 and application at 0x10000. Ends at 0x29D5A0, before saves at 0x4F0000 and assets at 0x5F0000. No save/asset filesystem image or initialization included. NVS falls inside padding; do not promise all settings survive. Device-derived Wi-Fi convention unchanged.

## Measurements (not physical telemetry)

| Item | Bytes | Notes |
| --- | ---: | --- |
| Application BIN | 2,676,128 | 2.55 MiB; 2,435,680 bytes app headroom |
| Factory BIN including padding | 2,741,664 | 2.61 MiB |
| Embedded browser gzip | 1,088,542 | Already included in application; 99 embedded assets |
| Illustrated asset stored payload | 1,147,145 | Separate future filesystem sizing model |
| Modeled illustrated LittleFS allocation | 1,429,504 | 68.16%; 667,648 bytes free |
| Model including engineering fixtures | 1,507,328 | 71.88%; 589,824 bytes free |
| Static RAM | 52,768 | 16.1%; not runtime heap/PSRAM telemetry |

Neither filesystem model exceeds the owner's 75% review threshold. Text gzip/compaction is lossless; PNG pixels/alpha unchanged. Do not add modeled filesystem usage to the current embedded application's usage: the assets partition is not populated by this update.

Factory SHA256: `534d457e02c9deeedf97fdfdd61ced772ff7608e3aa43d64d3200f189cd04c0c`.

## Verification

- PlatformIO firmware build: PASS (pinned installed framework).
- Sanitized core regression: 3,284 assertions PASS, including bounded one-time recovery, complete four-encounter quest, saved completion, reload and reward deduplication. Existing torn-write/recovery checks retained.
- Browser suite: 58 tests PASS, including quest presentation, recovery, retreat, existing device adapter/input/music, navigation and unchanged scenery checks.
- Protocol bounded parsing/Origin/Host whitelist: PASS.
- Actual C++ hero JSON/Node protocol integration: PASS.
- Friendly URL/DNS source checks: PASS.
- Browser gzip/header/hash, assets/import graph/CSP and actual compiled application payload: PASS.
- Delivery constituent offsets, padding, partition agreement, size ceiling and copy/hash: PASS.
- Browser UI against local synthetic C++ authority: Oakwood loads, depart reveals forest, touch movement reaches mandatory slime, Engage enters saved battle, Return to Oakwood/rest returns to the board without awarding XP. Screenshot is synthetic QA, not physical device evidence. Full new quest/completion is tested automatically, not manually played end-to-end on hardware.
- Git whitespace check: PASS. No commit/push/Release performed; source includes preexisting local development changes based on c0a7c6be9374d0a9269bc3247d6bad147e6b3627.

Build: `python3 tools/build-route-page.py`, `pio run -d firmware`, `sh tools/test-host.sh`, `node --test web/tests/*.test.mjs`, `python3 tools/test-route-package.py`, `python3 tools/check-build.py`. Package with `tools/prepare-delivery.py --version 0.1.15 --feature Safe-Road-Home --boot-app0 <installed-framework>/tools/partitions/boot_app0.bin`.

## Owner test checklist / limits

1. Flash at 0x0000 without erase; reconnect to Wi-Fi and reload /play to replace old cached/open code. Confirm retained hero totals and previous encounter progress.
2. On an unfinished route, depart Oakwood, win a battle and check up-to-6 HP recovery (or full HP on level-up). Reload: no repeated XP/healing.
3. Retreat mid-battle; confirm full rest, retained cleared nodes/XP and fresh enemy on retry.
4. Defeat captain, return home, see welcome/completion. Restart: stays completed, no duplicate reward.
5. Retest phone touch, PS5 controller, music, screen buttons and standalone combat.

Completed saves have no replay/reset button yet; do not erase progress just to retest. The isolated offline review HTML provides a fresh non-device demo for design review. One quest only; no branching paths, shops, loot/equipment, currency, village exploration, repeatable quests, or new enemy behavior. These remain future work. Stop for owner review.
