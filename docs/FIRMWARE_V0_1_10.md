# v0.1.10 — Dire Wolf hardware-review build

2026-10-14. Adds reference-guided silver/white, blue-eyed chibi dire wolf artwork and encounters. No device accessed, flashed or erased. No GitHub push, Release, Phase 2B or production scenery work performed. Source is the existing c0a7c6b base plus local development changes; delivery manifest records the dirty working tree.

## Gameplay

The first five wins are slimes. Next encounters at victory counts 5, 7, 9 and so on are dire wolves, alternating with slimes. Existing saves use their accumulated wins for the next encounter. An in-progress legacy slime remains a slime. Restarting/retrying does not reroll the enemy. Active and defeated wolves retain their identity until the next encounter.

Tier remains min(victories / 5, 5). Slime HP remains 18 + 6*tier and damage 3 + tier. Wolf HP is 26 + 6*tier and damage 4 + tier: the first wolf has 32 HP / 5 damage; the cap is 56 HP / 9 damage. XP remains 12 per win. Automatic healing, player growth, motion/button attacks, enemy interval (1800ms), attack cooldown (650ms) and existing 420ms lunge timing are unchanged. The faster-feeling lunge is intentionally deferred for owner review. Goblins and slime color variants are not added.

The read-only WebUI reports the stored active enemy kind/name alongside HP and tier. It continues using the same device-authoritative saved/live progression model, with no browser RPG, remote attack or save editing.

## Artwork and reproducibility

Imagegen was used with the owner's wolf reference to author one transparent 1923x818 atlas. Exact prompts and source are retained in web/artwork-sources/dire-wolf. This is a first hardware-review candidate, not production-approved sprite art.

Eight west-facing frames: two idle, defensive pose, three attack poses, hurt and defeated. The defensive frame is included for reuse; there is no new blocking mechanic. Deterministic preparation uses one common uniform scale, nearest-neighbor sampling and transparent padding, not independent frame stretching. Native frames are 64x48 with pivot (32,42); atlas is 256x96. LCD RGB565 plus binary alpha mask occupies 52,224 bytes inside the application. Source SHA-256: e8370a338433cb17058254f3e3386f2b1329e8bc9d0d92f4b1e2a78f698d4016.

Run with Pillow 12.3.0 from the project root:

```sh
python3 web/tools/prepare-wolf.py web/artwork-sources/dire-wolf/source.png web/build/dire-wolf
python3 web/tools/test-wolf.py web/build/dire-wolf
```

Preparation also needs web/build/slime-blue/SlimeBlueSprites.h (the existing tested masked-run template) and web/build/nova-female-v2/Nova-female-v2-east-idle-0.png (preview only). These dependencies accompany the sprite ZIP with their project-relative paths. Copy the generated DireWolfSprites.h to firmware/include/art before rebuilding. The PNGs and JSON can be reused in the browser, but browser-world wolf behavior/four-direction animations are not implemented. The preview GIF cycles poses; it is not gameplay footage. Anchor consistency and animation feel still require visual/hardware approval.

## Save compatibility

Save record size remains 60 bytes, with format 2 / rules 3 storing enemy kind at byte 52. Valid format-1 rules-1/2 saves migrate without resetting progress. Tests cover mixed-format slots and interrupted writes. See SAVE_FORMAT.md. **Do not downgrade to v0.1.9 or earlier after this build writes a save.** Older firmware cannot read format 2 and will lock writing rather than overwrite it.

## Verification

- PlatformIO ESP32-S3 build PASS.
- Core regressions with address/undefined-behavior sanitizers: 1,867 assertions PASS, including wolf unlocks/stats, active/defeated identity, legacy migration, mixed slots and torn writes.
- Existing browser renderer: 30 tests PASS.
- Wolf preparation: eight frame dimensions/alpha, atlas geometry, every RGB565/mask bit, compiled header identity and deterministic regeneration PASS.
- Host LCD mock: all eight masked draws match expected pixels; full existing lunge stays in LCD bounds PASS.
- Hero API C++/Node tests PASS, including wolf live/saved identity; portal hostname/DNS source-contract checks PASS.
- Build/partition checks and merged segment contents/offsets/padding verification PASS.

Physical display, timing, balance, saves/restart, motion, networking under load and runtime RAM/PSRAM have not been retested by Codex. Owner verification is required; host checks are not physical gameplay tests.

## Delivery and separate storage measurements

PocketQuest-S3-v0.1.10-Dire-Wolf.factory.bin: flash at **0x0000 without full erase** using ESP Launchpad. Routine update for the existing initialized PocketQuest layout, not a clean-install package. Verified segments: bootloader 0x0, partition table 0x8000, boot_app0 0xE000, application 0x10000. Image ends before saves at 0x4F0000. No save or asset filesystem image is included; NVS padding can reset other settings. Chip-derived Wi-Fi credentials remain repeatable. No partition changes or autoformat.

SHA-256: 44462dd29d63c719204672bbed7e2dc04b50ea7864f8d5c4ce86ee142c9b28fd.

| Measurement | Bytes / result |
| --- | --- |
| Application BIN | 1,520,416 (1.45 MiB) |
| Application partition headroom | 3,591,392 |
| Embedded RGB565/mask artwork, within application | 207,026 |
| Embedded dashboard, within application | 11,490 |
| Modeled illustrated asset payload, not flashed | 1,112,700 |
| Modeled LittleFS allocation | 1,351,680 / 2,097,152 = 64.45% |
| Modeled asset space remaining | 745,472 |
| Allocation including engineering fixtures | 1,429,504 = 68.16%; 667,648 free |
| Complete factory BIN including padding | 1,585,952 (1.51 MiB) |

Asset model uses asset-storage-budget.py --female-v2 --sword --slime --wolf, with readback checks. Neither profile reaches the 75% review warning. These are host filesystem models, not device telemetry. Do not double-count embedded artwork/dashboard as assets-partition allocation.

## Owner review

1. Flash at 0x0000, no full erase. Confirm existing progression restores.
2. At five total wins, start the next battle and confirm Dire Wolf; subsequent encounters alternate slime/wolf.
3. Check left-facing wolf idle, attack lunge, hurt and defeated poses against Nova's right-facing sword swing. Report scale, ground alignment, flicker or timing issues.
4. Restart during a wounded wolf battle and after a wolf victory; confirm enemy identity, HP and progress restore without duplicate XP.
5. Check WebUI live enemy name and saved progression after SAVED. Check motion and face attacks, M5 screen switching, splash/Wi-Fi/QR and battery remain intact.

Stop for owner review before adding goblins or changing combat timing/balance further.
