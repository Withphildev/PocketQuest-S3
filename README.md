# PocketQuestMini

A cozy pocket-sized fantasy RPG for the M5Stack StickS3, featuring motion combat and a connected browser adventure.

## Public release — v1.0.0

[Download v1.0.0](https://github.com/Withphildev/PocketQuestMini-S3/releases/tag/v1.0.0). Target: **M5Stack StickS3 with 8 MiB flash and 8 MiB PSRAM only**. This is the first public Mini release, based on the owner's accepted v0.1.32 game. PocketQuestMini is standalone; transfer to a future full PocketQuest game is not implemented.

Choose exactly one firmware package, both flashed at **0x0000**:

| Package | Use | Effect |
| --- | --- | --- |
| `PocketQuestMini-S3-v1.0.0-CLEAN-INSTALL.factory.bin` | New device, erased device, or deliberate fresh start | **Resets all firmware, saves and settings.** Includes initialized empty save/asset filesystems. |
| `PocketQuestMini-S3-v1.0.0-UPDATE.factory.bin` | Existing working PocketQuest installation with the same partition layout | Preserves game-save region; **do not full-erase**. NVS settings may reset. Does not repair missing save filesystems. |

See the [installation/update guide](docs/PUBLIC_INSTALLATION.md), [release notes](docs/RELEASE_V1_0_0.md), manifests and SHA256SUMS supplied with the release. No cloud, account or Internet is needed to play. Join the device-specific Wi-Fi displayed on the StickS3, then open `http://PocketQuest/play`; use `http://192.168.4.1/play` if name resolution fails. Enable music explicitly in the browser. Pair a PS5 controller to the phone/tablet/computer, **not** the StickS3. Touch controls remain available where the browser blocks gamepads or native fullscreen.

The owner accepted the development game's music, battles, controls and sharper Oakwood scene on their setup. Automated clean-install image checks are not a new physical clean-flash test. Known limits include browser-dependent fullscreen/gamepad/volume support, unsaved exact walking position/appearance selection, and finite flash headroom. Saves use format5/rules4; **do not downgrade to v0.1.29 or earlier** after writing these saves.

Repository: [Withphildev/PocketQuestMini-S3](https://github.com/Withphildev/PocketQuestMini-S3). Renamed from PocketQuest-S3 without creating a new repository. See [rebrand notes](docs/REBRAND_POCKETQUESTMINI.md). The working checkout remains `outputs/PocketQuest` to preserve existing tooling and file links.

## Two connected experiences

- **Pocket adventure:** standalone StickS3 encounters using gentle motion or button combat, with persistent shared character progression. The Phase 1 prototype works without Wi-Fi or a phone.
- **Browser adventure:** illustrated woodland exploration, mandatory encounters, turn-based battles, controller/touch/keyboard controls, music, and Oakwood resting. StickS3 validates actions and saves shared XP/level; browser combat HP is separate from handheld HP.

The continuous woodland journey has seeded encounters and optional loot chests, varied spacing, boss opportunities, increasing difficulty and a short safe return to Oakwood. New outings start one tier below the highest reached (minimum1), retaining XP. Disconnecting resumes the current section/battle without rerolling it; exact walking position is not saved. PocketQuest Adventures remains a separate future concept.

## Hardware

M5Stack StickS3: ESP32-S3-PICO-1-N8R8, 8 MiB flash, 8 MiB octal PSRAM, 135 × 240 LCD (240 × 135 landscape), BMI270 IMU, and Face/M5 buttons. Phase 1 runtime diagnostics confirmed flash/PSRAM capacity, landscape dimensions, BMI270 detection, and the separate save filesystem. See the [hardware report](docs/HARDWARE_INSTALLATION_REPORT.md).

## Development history (historical milestones, not release instructions)

### v0.1.32 Sharper Oakwood

Oakwood now uses a 512×288 shared background and higher-resolution two-frame breathing layers for both Novas, regenerated from preserved masters. This improves detail without altering composition, gameplay or saves. The 640×360 trial exceeded our approved engineering budget, so the shipped version uses the smaller high-detail alternative. App:4,649,904 bytes,461,904 bytes free; no partition changes. See [v0.1.32 report](docs/FIRMWARE_V0_1_32.md). Owner phone/visual acceptance remains before final release packaging.

The original owner-supplied The Gentle Glade MP3 now plays as the overall browser theme, without transcoding. Enable music explicitly; pause/resume and volume controls remain. The song is served separately from the game page and does not restart on battle/Oakwood transitions. It is application-resident, not installed in the asset filesystem. See [v0.1.31 test report](docs/FIRMWARE_V0_1_31.md). Phone listening, looping and concurrent gameplay over the physical hotspot await owner testing; no public release yet.

Occasional seeded chests appear after encounters: +1 potion or up to8 browser HP, with durable opened state and replay-safe claims. The first outing has a discovery chest; full supplies leave it unopened and all chests are optional. Open nearby chests with X, Space or the touch button. See [v0.1.30 report](docs/FIRMWARE_V0_1_30.md). The owner reports v0.1.29 controls and loading working on their setup; no additional initial-loading optimization is claimed.

In browser battles, **single Cross/X attacks; double-tap Cross within250ms uses Power Strike instead**. The single Attack waits250ms to distinguish the gesture; it is not spent before Power. Circle Guard, Square Run and Triangle Potion stay immediate. D-pad/stick move Nova only during exploration, never navigate battle actions. No R2 or second confirmation. Touch Attack/Power stay immediate; L1/R1 select living enemies and L2 toggles fullscreen. Boss Run, empty focus and empty potion restrictions still apply. The owner reports these controls working; [v0.1.29 report](docs/FIRMWARE_V0_1_29.md) remains historical.

Phone fullscreen battles use a compact768×240 composition and concise round/threat/Guard line, reclaiming space from repeated instructions. The complete scenery, target/action buttons, HP and essential toolbar remain visible. No camera zoom/cropping, sprite-art or combat-rule changes. See [v0.1.27 report](docs/FIRMWARE_V0_1_27.md).

The owner-preferred v0.1.24 character scale is restored, retaining the newer counterattack presentation. Battle zoom is removed; the whole two-block background fits without distortion. Exploration also accounts for viewport height to prevent short landscape screens cropping scenery. Fullscreen retains native/CSS fallback controls and aspect-preserving margins where needed. See [v0.1.26 report](docs/FIRMWARE_V0_1_26.md).

Browser battles visibly play each surviving enemy's counterattack after Nova's action, with lunges, attack sprites, damage numbers and HP feedback. The accepted device transaction remains authoritative; presentation does not apply damage or rewards. Existing turn-based rules, saves and artwork remain unchanged. See [v0.1.25 report](docs/FIRMWARE_V0_1_25.md) for the original feedback pass (its enlarged framing is superseded).

Controller detection expands the play area, with L2/fullscreen controls, an always-visible essential HUD and landscape/portrait fallback layouts. Native fullscreen and orientation locking remain browser-dependent. Historical v0.1.24 used synthesized themes; these were replaced by The Gentle Glade in v0.1.31. See [v0.1.24 notes](docs/FIRMWARE_V0_1_24.md).

Victory and escape return to exploration automatically, using the existing durable Continue transaction without an extra button. The Oakwood path sign appears only at the first outward section of each outing; later sections still allow left-exit return. See [v0.1.23 notes](docs/FIRMWARE_V0_1_23.md).

Journey state uses save format5 (98 bytes), migrating formats1/2/3/4 without erasing progress. **Do not downgrade to v0.1.29 or earlier after new saves.** Existing unfinished battles and journey state are retained. See [save specification](docs/SAVE_FORMAT.md). Builds do not flash a device or push source.

The owner-supplied PocketQuest Mini splash (both Novas, no Pip) is now integrated. The original 1672×941 PNG is retained separately; the LCD export uses the established uniform 240×135 fit and RGB565 encoding, without cropping or stretching. Splash duration remains 2.5 seconds. See [v0.1.21 notes](docs/FIRMWARE_V0_1_21.md).

The saved-hero dashboard at `http://PocketQuest` links to device-authoritative gameplay at `/play`. Shared progression uses format5/rules4 and route API schema3 with durable action receipts; [original protocol notes](docs/FIRMWARE_V0_1_14.md) are historical and superseded by current save/chest specifications. Local changes are not automatically pushed by builds.

Current firmware includes the owner-supplied splash, female Nova's right-facing sword animation, four-screen flow (2.5-second splash → Wi-Fi → QR → mini-game), battery display, stable chip-derived Wi-Fi credentials and `http://PocketQuest` hotspot URL. M5 cycles the three post-splash screens; Face/motion combat runs only in the mini-game, with combat paused on connection screens. The owner has reported the recent interface/buttons working well; individual checks not explicitly reported by the owner remain unverified. See [v0.1.5 delivery notes](docs/FIRMWARE_V0_1_5.md) and [checkpoint reproduction](docs/CHECKPOINT_V0_1_5.md).

The browser includes the two-block Sunlit candidate, independent fantasy tree, female/male Nova appearances and layered Oakwood rest scene. Slime, wolf and goblin enemies are implemented. This remains a development game, not a complete RPG or production scenery library. The rebrand and splash update do not alter saves, Wi-Fi SSID/password, hotspot URL or partition layout.

### Original hardware milestone

First standalone prototype, v0.1.0. Runs without Wi-Fi or a phone. Includes a splash, geometric player/slime placeholders, idle animation, motion and button attacks, HP, XP, levels, and two CRC-checked save snapshots.

The firmware compiles and 1,330 host assertions pass. An approved clean installation on the owner's dedicated StickS3 succeeded. The owner confirmed the splash/player display, button attacks, gentle motion attacks, progression to Level 2 / 24 XP, and that progression surviving restart. This is an **owner-verified hardware smoke-test baseline**, not a production-ready release. Detailed timing, false-positive rates, endurance, and physical power-cut recovery remain unverified.

Two cosmetic protagonists are approved: **Nova (Female)** with long indigo-purple hair, and **Nova (Male)** with short, tousled indigo-purple hair. Equipment, abilities, and progression are shared. [Character specifications](docs/CHARACTERS.md) are included. Browser sprite candidates support both appearances; current firmware uses female Nova only. Production-art approval and firmware/persistent character selection are **not implemented**.

The [Phase 2A browser prototype](web/README.md) demonstrates Canvas 2D scrolling, seeded scenery, independent collision, foreground occlusion, and a local scenery validator. Build/run details and limitations are in the [Phase 2A report](docs/PHASE2A_REPORT.md). Owner visual review is required before Phase 2B; this is not the full browser RPG.

[Phase 2A.1 calibration](docs/PHASE2A_1_REPORT.md) adds a two-block path view, independent character-render scaling, combined debug overlays, and external collar/corner templates. [Artwork handoff requirements](docs/VISUAL_ASSET_REQUIREMENTS.md) define the representative reference pack; intended fantasy artwork and final projection/scale approval remain pending.

Approved style: [Option C — Hybrid Zelda Exploration + HD-2D Fantasy Presentation](docs/VISUAL_DESIGN.md). Four-direction exploration and smooth camera following meet elevated three-quarter fantasy pixel art, chibi Nova characters, and selective lighting/depth/atmosphere, within Canvas 2D. Production scenery awaits owner visual-prototype approval.

The annotated `v0.1.0` Git tag marks this source baseline. No GitHub Release is published for this milestone. Development firmware downloads are delivered directly in Codex for owner-managed ESP Launchpad testing; see the [delivery workflow](docs/FIRMWARE_DELIVERY.md). Factory binaries use **flash address 0x0000**. Builds never automatically flash the device.

## Build and host tests

From the project root:

```sh
python3 tools/runtime-inputs.py
python3 tools/build-hero-page.py
python3 tools/prepare-theme.py
python3 tools/build-route-page.py
npm test --prefix web
sh tools/test-host.sh
cd firmware
pio run -e m5stack-sticks3
cd ..
python3 tools/check-build.py
```

Requires Clang with address/undefined-behavior sanitizers for host tests and PlatformIO for firmware. Dependencies are pinned: pioarduino 55.03.39, Arduino-ESP32 3.3.9 through that platform, M5Unified 0.2.25, M5GFX 0.2.32. Build-only commands do not install firmware on a device.

Python3 and Node.js20+ rebuild browser headers from versioned, hash-checked `assets/runtime` inputs; no image generator, local clipboard paths or preexisting ignored build folder is required. `python3 tools/runtime-inputs.py` refuses to overwrite differing local artwork. The original MP3 is in `web/audio`. To regenerate resized/optimized artwork from masters, additionally use Pillow12.3.0 and OxiPNG10.2.1 as documented in the historical art reports. Release packaging needs `pip install -r tools/requirements-release.txt`; see [release reproduction](docs/RELEASE_V1_0_0.md).

## Prototype controls

Landscape orientation, blue Face button at the left:

- Face, short press/release: start or retry an encounter; attack during combat.
- Gentle deliberate swing: attack during combat after approximately 0.8 seconds of steady calibration. Return to stillness between swings.
- M5, short press/release: Wi-Fi → QR → mini-game → Wi-Fi.
- M5, hold one second: cycle Light / Normal / Firm swing threshold, saved with the game.
- Serial `?` at 115200 baud: print hardware, partitions, memory, and filesystem status.
- Serial `d`: toggle live motion diagnostics.

The chip-derived password is convenient and repeatable after reflashing, but predictable rather than a strong secret. Use the hotspot only for this local development connection page. Firmware updates preserve save partition boundaries but overwrite NVS padding; do not full-erase for routine updates.

The slime starts at 18 HP and 3 damage. Every five saved victories increases enemy HP by 6 and damage by 1, capped at 48 HP / 8 damage after 25 wins. Level-1 attacks deal 7 damage, with a shared 650 ms cooldown for button and motion input. Enemy strikes stay 1.8 seconds apart. Victory gives 12 XP, and the first level-up is at 20 total XP. Starting another encounter or leveling up restores player HP. Rates are prototype tuning values, not final balancing. Rules-1 saves load through compatibility handling; old firmware cannot read rules-2 saves after a new checkpoint.

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

PocketQuestMini original source and documentation are licensed under the [MIT License](LICENSE), selected by the owner. Third-party dependencies retain their own licenses and are fetched by PlatformIO rather than vendored here. Historical reports below retain their original names and describe their respective milestones, not the current feature set.

## Phase 2A.2 integration status

The browser asset pipeline now accepts a strict Sunlit master and optional static Nova frames. Illustrated Sunlit artwork is still pending; built-in imagery remains explicitly labeled engineering fixtures. See [Phase 2A.2 report](docs/PHASE2A_2_REPORT.md) and [exact art request](docs/SUNLIT_ASSET_REQUEST.md). This is the authorized fallback integration milestone, not production-art approval or Phase 2B.
