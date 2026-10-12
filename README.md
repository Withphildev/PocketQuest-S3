# PocketQuest

A pocket-sized fantasy RPG for the M5Stack StickS3, featuring motion combat, procedural exploration, and a connected browser adventure.

## Two connected experiences

- **Pocket adventure:** standalone StickS3 encounters using gentle motion or button combat, with persistent shared character progression. The Phase 1 prototype works without Wi-Fi or a phone.
- **Browser adventure (planned):** a Chrome RPG with continuous exploration, deterministic seeded wilderness, modular elevated three-quarter scenery, and aggregate autonomous settlements. Oakwood will be an intentionally authored starting village. The StickS3 remains authoritative for shared game state.

## Hardware

M5Stack StickS3: ESP32-S3-PICO-1-N8R8, 8 MiB flash, 8 MiB octal PSRAM, 135 × 240 LCD (240 × 135 landscape), BMI270 IMU, and Face/M5 buttons. Phase 1 runtime diagnostics confirmed flash/PSRAM capacity, landscape dimensions, BMI270 detection, and the separate save filesystem. See the [hardware report](docs/HARDWARE_INSTALLATION_REPORT.md).

## Current status — Phase 1 firmware v0.1.0 + Phase 2A renderer study

First standalone prototype, v0.1.0. Runs without Wi-Fi or a phone. Includes a splash, geometric player/slime placeholders, idle animation, motion and button attacks, HP, XP, levels, and two CRC-checked save snapshots.

The firmware compiles and 1,330 host assertions pass. An approved clean installation on the owner's dedicated StickS3 succeeded. The owner confirmed the splash/player display, button attacks, gentle motion attacks, progression to Level 2 / 24 XP, and that progression surviving restart. This is an **owner-verified hardware smoke-test baseline**, not a production-ready release. Detailed timing, false-positive rates, endurance, and physical power-cut recovery remain unverified.

Two cosmetic protagonists are approved: **Nova (Female)** with long indigo-purple hair, and **Nova (Male)** with short, tousled indigo-purple hair. Equipment, abilities, and progression are shared. [Character specifications](docs/CHARACTERS.md) are included. The browser study offers both temporary geometric appearances; production sprites and firmware/persistent character selection are **not implemented**.

The [Phase 2A browser prototype](web/README.md) demonstrates Canvas 2D scrolling, seeded scenery, independent collision, foreground occlusion, and a local scenery validator. Build/run details and limitations are in the [Phase 2A report](docs/PHASE2A_REPORT.md). Owner visual review is required before Phase 2B; this is not the full browser RPG.

[Phase 2A.1 calibration](docs/PHASE2A_1_REPORT.md) adds a two-block path view, independent character-render scaling, combined debug overlays, and external collar/corner templates. [Artwork handoff requirements](docs/VISUAL_ASSET_REQUIREMENTS.md) define the representative reference pack; intended fantasy artwork and final projection/scale approval remain pending.

Approved style: [Option C — Hybrid Zelda Exploration + HD-2D Fantasy Presentation](docs/VISUAL_DESIGN.md). Four-direction exploration and smooth camera following meet elevated three-quarter fantasy pixel art, chibi Nova characters, and selective lighting/depth/atmosphere, within Canvas 2D. Production scenery awaits owner visual-prototype approval.

The annotated `v0.1.0` Git tag marks this source baseline. No GitHub Release is published for this milestone. Development firmware downloads are delivered directly in Codex for owner-managed ESP Launchpad testing; see the [delivery workflow](docs/FIRMWARE_DELIVERY.md). Factory binaries use **flash address 0x0000**. Builds never automatically flash the device.

## Build and host tests

From the project root:

```sh
sh tools/test-host.sh
cd firmware
pio run -e m5stack-sticks3
cd ..
python3 tools/check-build.py
```

Requires Clang with address/undefined-behavior sanitizers for host tests and PlatformIO for firmware. Dependencies are pinned: pioarduino 55.03.39, Arduino-ESP32 3.3.9 through that platform, M5Unified 0.2.25, M5GFX 0.2.32. Build-only commands do not install firmware on a device.

## Prototype controls

Landscape orientation, blue Face button at the left:

- Face, short press/release: start or retry an encounter; attack during combat.
- Gentle deliberate swing: attack during combat after approximately 0.8 seconds of steady calibration. Return to stillness between swings.
- M5, short press/release: toggle live motion diagnostics.
- M5, hold one second: cycle Light / Normal / Firm swing threshold, saved with the game.
- Serial `?` at 115200 baud: print hardware, partitions, memory, and filesystem status.

The slime has 18 HP. Level-1 attacks deal 7 damage, with a shared 650 ms cooldown for button and motion input. The slime deals 3 HP every 1.8 seconds. Victory gives 12 XP, and the first level-up is at 20 total XP. Starting another encounter restores player HP. Rates are prototype tuning values, not final balancing.

The detector samples at 50 Hz, filters the gravity component, requires consecutive threshold readings, waits for quiet before rearming, and rejects invalid/out-of-range samples. Three thresholds are 0.30g, 0.40g, and 0.60g. They are starting values requiring physical tuning. Button combat works without a usable IMU.

## Persistence and first-install storage

Firmware mounts the `saves` partition with automatic formatting disabled. On two absent snapshot files it initializes a new world and writes both slots. With a damaged or unsupported save, it preserves the files and reports a locked/error state; gameplay in that error session is unsaved. A previous valid snapshot recovers from a torn/corrupt inactive snapshot.

An erased/unformatted save partition cannot mount and reports `NO SAVE FS`. First installation requires an explicitly approved empty LittleFS initialization. Installing an empty image replaces everything in that partition. It is never part of normal updates and must never be written over existing saves. Locally prepared images used for testing are excluded from Git; this repository does not ship firmware or filesystem binaries. See [installation review](docs/INSTALLATION_REVIEW.md) before approving any writes. The build commands above do not flash or erase a device.

Dirty state checkpoints every 30 seconds and on encounter/XP/defeat/threshold milestones. The UI distinguishes `UNSAVED`, `SAVED`, `RESTORED`, `RECOVERED`, and errors. There is no per-sample or per-hit flash write. Abrupt power removal before a checkpoint can lose recent transient state; future browser commands will need durable acknowledgements/journaling.

## Boundaries of Phase 1

The browser RPG, procedural world, Oakwood, settlements, caravans, and offline progression remain planned. The approved seven-day offline cap remains configurable in `FutureTimePolicy` but is not active simulation. Wi-Fi, microphone, and speaker are not started. Large scenery assets are not included or generated.

See [development report](docs/PHASE1_REPORT.md), [save format](docs/SAVE_FORMAT.md), [scenery tool specification](docs/SCENERY_VALIDATOR.md), and [world requirements](docs/WORLD_GENERATION.md).

Phase 0 baseline documents: [architecture](docs/ARCHITECTURE_PHASE0.md) and [scenery standard](docs/SCENERY_STANDARD.md). These and the Phase 1 development/installation notes preserve historical decisions; the hardware report records subsequent testing. Phase 2A is a renderer study; Phase 2B has not started.

## Layout

```text
core/PocketQuestCore/src/    hardware-independent game, motion, save logic
firmware/src/               hardware sampling and placeholder UI
firmware/include/           filesystem/display adapters
web/                       later browser work; contracts only
shared/schemas/            provisional scenery JSON contracts
assets/                    later art sources/exports; empty initially
tests/                     host regression and power-cut fault injection
tools/                     host runner and storage/build checks
docs/                      decisions, formats, installation/test review
release/                   local review binaries only; ignored by Git
```

## License

PocketQuest original source and documentation are licensed under the [MIT License](LICENSE), selected by the owner. Third-party dependencies retain their own licenses and are fetched by PlatformIO rather than vendored here. No production artwork is distributed in this baseline.

## Phase 2A.2 integration status

The browser asset pipeline now accepts a strict Sunlit master and optional static Nova frames. Illustrated Sunlit artwork is still pending; built-in imagery remains explicitly labeled engineering fixtures. See [Phase 2A.2 report](docs/PHASE2A_2_REPORT.md) and [exact art request](docs/SUNLIT_ASSET_REQUEST.md). This is the authorized fallback integration milestone, not production-art approval or Phase 2B.
