# PocketQuest-S3 v0.1.8 — Combat Difficulty

2026-10-13 development tuning pass. Owner reported v0.1.7 lunge feels slightly fast but explicitly deferred changing it. Lunge trajectory/speed remains byte-for-byte unchanged in SlimeAnimation.h. No device accessed/flashed, GitHub push or Release performed.

## Difficulty policy

Based on the existing saved victories counter, not time or session length. Every five wins adds one tier, capped at five increases. No new counter or save field; no reset of owner progress.

| Display tier | Saved wins | Enemy starting HP | Damage per strike |
| --- | --- | --- | --- |
| T1 | 0–4 | 18 | 3 |
| T2 | 5–9 | 24 | 4 |
| T3 | 10–14 | 30 | 5 |
| T4 | 15–19 | 36 | 6 |
| T5 | 20–24 | 42 | 7 |
| T6 | 25+ | 48 | 8 |

Tier advances for the next encounter after crossing a win boundary. Enemy HP set when a new encounter starts; player attack damage, player HP/level curve, 12 XP per victory, enemy 1800ms strike interval and shared 650ms attack cooldown unchanged. Losses/retries neither increase nor reduce the tier; offline time does nothing. UInt32 maximum victory count safely clamps to T6 without multiplication overflow. Player growth may eventually outpace this capped slime curve; this is initial balancing, not infinite difficulty scaling.

Enemy label displays remaining HP and T1–T6. Hit text reports actual scaled damage, rather than fixed '-3 HP'. Serial '?' diagnostic includes saved victories, rules version, tier, starting HP and enemy damage. Existing saved victories determine difficulty immediately—an experienced save can already be at T6. An old in-progress encounter retains its current remaining monster HP; its incoming damage follows the current saved-win tier, and the next encounter gets the full scaled starting HP.

Only the current blue slime participates. Wolf/goblin sprites, families, unlocking and rewards, slime recolors, blocking and browser combat are not implemented. Preserve intended future relative order: slimes < dire wolves < goblins; this build does not pretend scaling creates new enemy types.

## Save compatibility and rollback warning

Snapshot schema remains format 1, 60 bytes, same CRC and dual-slot recovery layout. Combat rules version advances from 1 to 2 to distinguish the behavior. Decoder accepts and validates legacy rules-1 states (including their original <=18 enemy HP bound), upgrades the in-memory rules marker to 2, and preserves seed, revision, wins, XP, level, player/monster HP, phase, sensitivity and sequence. Normal subsequent checkpoints write rules-2 snapshots. Direct Game.restore also accepts valid legacy states. Unknown future rules still lock writes; corrupt snapshots remain protected by existing recovery handling.

**Do not downgrade to v0.1.7 or earlier after this build writes a save.** Older firmware rejects rules-2 snapshots as unsupported and preserves them, so gameplay will be unsaved/locked rather than resumed. Returning to an older build requires a separate save-backup/migration plan; this update does not perform a downgrade or erase. Migration tests use synthetic MemoryStorage, not the physical owner's files.

## Verification

- Final PlatformIO ESP32-S3 build PASS. Initial target build exposed uint32_t/unsigned type deduction mismatch in std::min; corrected to explicit std::min<uint32_t>, then rebuilt successfully.
- Core suite: **1,834 assertions PASS**, retaining previous regressions plus difficulty boundaries/cap/maximum wins, thirty sequential victories with repeated persistence/restart, actual scaled damage, unchanged XP, legacy CRC-valid save migration, legacy corruption rejection, future-rule write lock and current-state bounds.
- Enemy lunge/LCD bounds, slime animation, Nova animation and screen pause tests recompiled against updated Game.cpp and PASS.
- Device credentials, battery/QR geometry, actual QR encoder capacity, masked sprite drawing and portal source-contract checks PASS.
- Browser regression: 30 tests PASS; no browser gameplay changes.
- Compiled partition/source agreement, firmware budget, merged segment contents/offsets/padding and delivered copy hash PASS; git diff whitespace check PASS.

No physical balance/gameplay/motion/save-restart/phone result claimed. Difficulty parameters are provisional and require owner playtesting.

## Delivery and storage

PocketQuest-S3-v0.1.8-Combat-Difficulty.factory.bin — **flash at 0x0000 without full erase**. Routine update physically preserves the existing saves partition at 0x4F0000; firmware upgrades compatible save rules logically as described above. No save/asset filesystem image included. NVS padding can reset other settings; chip-derived Wi-Fi credentials remain stable. Existing initialized save filesystem required; no autoformat or partition change.

Verified offsets: bootloader 0x0000, partitions 0x8000, boot_app0 0xE000, application 0x10000. SHA-256 19b859aa2fb19b8e21976f234741918284f62f881f7f2001a556d5fe6edfd879. Manifest records uncommitted working tree after c0a7c6b checkpoint.

| Measurement | Result |
| --- | --- |
| Application BIN | 1,444,848 bytes (1.38 MiB); 3,666,960 bytes application headroom |
| Embedded image payload | 154,802 bytes, unchanged/already within application |
| Modeled illustrated browser asset payload, not in BIN | 1,081,930 bytes |
| Modeled asset filesystem allocation | 1,314,816 / 2 MiB = 62.70%; 782,336 free |
| Allocation with engineering fixtures | 1,392,640 = 66.41%; 704,512 free |
| Factory BIN including padding | 1,510,384 bytes (1.44 MiB), +320 bytes versus v0.1.7 |
| Static RAM build report | 52,392 bytes (16.0%); not runtime heap/PSRAM telemetry |

No asset warning threshold exceeded. Model not measured device filesystem usage.

Owner review: confirm saved progress loads, current tier/HP on screen and serial diagnostic, damage displayed matches tier, threshold advances at five-win boundaries, defeat/retry does not ramp difficulty, restart retains wins/tier. Check whether battles feel fair as player levels, and retain the known lunge-speed adjustment for later wolf/goblin testing. Do not erase existing progress just to test low tiers. Stop for review.

Reproduce: sh tools/test-host.sh; pio run -d firmware; python3 tools/check-build.py; compile animation/screen tests against current core; package with tools/prepare-delivery.py --version 0.1.8 --feature Combat-Difficulty --boot-app0 pointing to pinned framework tools/partitions/boot_app0.bin. Build commands never flash hardware.
