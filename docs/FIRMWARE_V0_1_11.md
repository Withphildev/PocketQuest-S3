# v0.1.11 — Goblins hardware-review build

2026-10-14. Adds the strongest of the three approved enemy families: green, red-eyed chibi goblins with red scarf, brown clothes and spiked club. Preserves existing Nova sword combat, slimes/wolves, motion and face-button attacks, M5 screens, Wi-Fi/QR, battery and read-only shared-hero dashboard. No device accessed/flashed/erased, GitHub push/Release, Phase 2B, production scenery or repository split.

## Encounters and difficulty

Victory counts 0–4 select slime. Counts 5–9 keep the existing wolf/slime alternation. At ten total wins the next enemy is a goblin; thereafter counts 10,13,16,... select goblin, 11,14,17,... slime, and 12,15,18,... wolf. This is the repeating Slime → Wolf → Goblin cycle, entered at the first goblin. Existing in-progress and victory-screen encounters keep their stored identity; the new schedule takes effect only on the next encounter. Users already past ten wins enter at their existing count's cycle position rather than resetting.

Tier remains min(victories / 5, 5). Slime and wolf stats are unchanged. Goblins have 38 + 6*tier HP and 6 + tier damage. At ten wins: slime 30HP/5damage, wolf 38HP/6damage, goblin 50HP/8damage. Goblin cap: 68HP/11damage. Rewards remain 12 XP per victory. Player HP/growth, automatic healing, 1800ms enemy interval, 650ms player cooldown and 420ms lunge are unchanged. No blocking mechanic or new input added; defensive art is reserved for future use. Balance remains provisional pending owner testing.

## Art pipeline and reuse

Built-in imagegen skill/tool used with web/artwork-sources/enemy-references/goblin-reference.png. Exact prompts are saved in web/artwork-sources/goblin/prompts.json and prompts-v2.json. The first generated atlas lacked clean gutters and was rejected, not silently cropped. The selected source-v2.png is genuinely transparent, 1774x887; SHA-256 8cc11533cc559af731dcd02d5b718aa3fcf04d52ba675f4e6114f6388b9427f7.

Eight left-facing frames: two idle, defensive, attack windup/swing/recovery, hurt, defeated. Deterministic extraction uses actual transparent gutters, common uniform inverse scale 11.676470588235293, nearest-neighbor sampling, transparent padding and fixed pivot (32,42). No per-frame stretching or repainting. Frames are 64x48 RGBA PNG, atlas 256x96, LCD data 49,152 RGB565 bytes plus 3,072 alpha-mask bytes (52,224 total). Contact sheet is 4x nearest-neighbor. GIF is a pose-only art preview, not device/gameplay footage. These are calibration candidates, not production-approved artwork; anchor/scale consistency needs owner review.

The PNGs/JSON are reusable in a future WebUI game. Browser-world goblin gameplay, four-direction exploration animations and blocking are not implemented by this firmware update.

Reproduce with Pillow 12.3.0 from project root:

```sh
python3 web/tools/prepare-wolf.py web/artwork-sources/goblin/source-v2.png web/build/goblin goblin
cp web/build/goblin/GoblinSprites.h firmware/include/art/GoblinSprites.h
python3 web/tools/test-wolf.py web/build/goblin goblin
c++ -std=c++17 -DTEST_GOBLIN tools/test-wolf-render.cpp -o /tmp/pq-goblin-render
/tmp/pq-goblin-render
sh tools/test-host.sh
node --test web/tests/*.test.mjs
pio run -d firmware
python3 tools/check-build.py
```

prepare-wolf.py/test-wolf.py now accept optional goblin argument; default wolf outputs remain byte-identical in regression tests. Required existing dependencies: web/build/slime-blue/SlimeBlueSprites.h (masked drawing template), web/build/nova-female-v2/Nova-female-v2-east-idle-0.png (pose preview). Included in sprite ZIP at project-relative paths. tools/test-wolf-render.cpp also needs firmware/include/SlimeAnimation.h.

## Save compatibility and update warning

Format remains 2, 60 bytes, with enemy kind 2 identifying goblin. Rules advance from 3 to 4 so old firmware recognizes an unsupported newer ruleset and locks writes rather than treating goblin records as corruption. Current firmware validates/migrates format-1 rules-1/2 and format-2 rules-3 records while keeping HP, XP, victories, seed and encounter identity. Rules-3 records cannot smuggle goblin kinds. Mixed old/current slots and torn-write fallback are tested. Subsequent normal saves write rules 4.

**Do not downgrade to v0.1.10 or earlier after this update writes saves.** This is a forward upgrade, not a bidirectional migration. No partition change, reset, automatic format or filesystem initialization is added.

## Verification

- PlatformIO ESP32-S3 build PASS; static RAM 52,584 bytes (16.0%), not runtime heap/PSRAM measurement.
- Sanitized core regression suite: 2,000 assertions PASS, including 30 sequential wins, goblin unlock/cycle/stats, combat cooldown/damage/XP, wounded/victorious/defeated goblin save/restore, deterministic retry, rules-3 migration, malformed records, mixed slots and torn-write recovery.
- Existing Canvas world/scenery validator regressions: 30 tests PASS, unchanged requirements.
- Both goblin and wolf deterministic regeneration/PNG dimensions/alpha/atlas/every RGB565+mask bit/firmware header identity PASS.
- Host LCD mock goblin masked draws and full lunge bounds PASS.
- Hero API actual C++/Node JSON checks PASS including goblin kind/name/HP/version, saved/live separation and read-only contract. Portal hostname/DNS source checks PASS.
- Screen flow (2500ms splash, M5 cycle and paused game clock), enemy animation priorities/lunge bounds/timing/rejected attacks PASS.
- Build/partition source agreement and merged factory segment contents/offsets/padding/hash verification required by delivery tool; delivery manifest records result.

No physical gameplay or restart/network/RAM diagnostics claimed. Owner must check animation, speed, difficulty and actual persistence on the StickS3.

## Delivery and storage

Download PocketQuest-S3-v0.1.11-Goblins.factory.bin; **flash address 0x0000, no full erase**. Routine save-preserving update for the existing initialized PocketQuest layout, not a clean-install image. Segments: bootloader 0x0, partitions 0x8000, boot_app0 0xE000, application 0x10000. No save/assets filesystem image included, and merged image stops before saves at 0x4F0000. Padding covers NVS, so unrelated settings may reset; MAC-derived credentials remain repeatable.

Factory SHA-256: 03edfc9146976166682b6c43b1dffe1428c6362411409636e9dde0451f08ea88. The adjacent factory JSON records segment hashes and source provenance. Source remains c0a7c6b plus local development changes, not newly pushed. Merged verification completed successfully.

| Measurement | Result |
| --- | --- |
| Application BIN | 1,573,056 bytes (1.50 MiB); 3,538,752 bytes partition headroom |
| Embedded RGB565/mask artwork, inside application | 259,250 bytes |
| Embedded dashboard, inside application | 11,490 bytes |
| Modeled illustrated browser asset payload, not flashed | 1,129,768 bytes |
| Modeled LittleFS allocation | 1,392,640 / 2,097,152 = 66.41% |
| Modeled asset space remaining | 704,512 bytes |
| Allocation with engineering fixtures | 1,470,464 = 70.12%; 626,688 free |
| Complete factory BIN including padding | 1,638,592 bytes (1.56 MiB) |

Model command: asset-storage-budget.py --female-v2 --sword --slime --wolf --goblin; payload readback PASS. Both profiles stay below the 75% review trigger. PNGs are unchanged; modeled JSON compacting/text gzip assumptions remain. Embedded LCD art/dashboard must not be double-counted as filesystem allocation. These are modeled assets, not a flashed asset partition or on-device telemetry.

## Owner checklist

1. Routine flash at 0x0000 without full erase; confirm existing saved progress restores.
2. Complete the current encounter; at ten or more wins, confirm the cycle's goblin/slime/wolf progression.
3. Compare goblin HP/damage and feel with wolves/slimes. Check idle, club windup/swing/recovery, hurt and defeated art; report scale/alignment/clipping or flicker.
4. Restart during a wounded goblin battle and after victory/defeat; confirm enemy identity/progress without duplicate XP. Confirm WebUI enemy name and saved hero progression after SAVED.
5. Verify face/motion attack, M5 switching, splash/Wi-Fi/QR/battery still work. Do not erase as a troubleshooting shortcut.

Stop for owner review before further balance or browser gameplay work.
