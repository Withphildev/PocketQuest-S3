# PocketQuest-S3 v0.1.1 — Nova Sword + Splash

Development firmware prepared 2026-10-12. Owner downloads and flashes manually with Espressif ESP Launchpad. No device was accessed, erased, or flashed during development. Hardware results remain unverified.

## Delivery

File: PocketQuest-S3-v0.1.1-Nova-Sword-Splash.factory.bin

**Flash address: 0x0000. Routine save-preserving update for the existing PocketQuest partition layout; do not full-erase.** The verified contiguous image ends at exclusive address 0x0CB7B0, well before saves at 0x4F0000. Saves and asset filesystem contents are not included or overwritten by this file. Padding includes NVS at 0x9000–0xEFFF, so NVS settings may be lost. Existing save filesystem initialization is required; firmware deliberately does not autoformat it. A clean installation after erasing would need a separate initialization procedure.

Verified segment offsets: bootloader 0x0000, partitions 0x8000, boot_app0 0xE000, application 0x10000. All segments compared byte-for-byte with the merged image; padding checked for 0xFF. Partition table matches source and remains unchanged. SHA-256: 8f8cb73c3448ad8a939863aae4633c4ca7eba7a3fdec57c895fdc89d520c9ffd.

## Changes

- Owner splash source preserved, actual 1672×941; uniformly fit to 240×135 with Lanczos sampling and no deliberate crop, then RGB565 encoded. No new artwork generated.
- Female Nova faces right at the existing battle position. Four sword poses use an 80×64 canvas and (40,56) foot anchor. Idle uses 32×48 with (16,44) anchor.
- Accepted button or motion attacks start the cosmetic 480 ms animation, including a finishing blow. Rejected cooldown attacks do not restart it. Display refresh target changed from 120 to 30 ms; actual timing/performance must be measured on hardware.
- Existing slime placeholder, HP, XP, leveling, motion thresholds, 650 ms combat cooldown, save format, standalone gameplay, and controls retained. No core combat rule or save serialization change.
- Version diagnostic reports v0.1.1. Both protagonists remain part of the approved design; this build uses female Nova only and does not implement character selection.
- Browser world/forest/tree prototype is not bundled or served by this firmware. This is a standalone combat-art update, not Phase 2B or browser integration.

## Tests and measurements

PlatformIO ESP32-S3 target build PASS, M5Unified 0.2.25 / M5GFX 0.2.32 / Arduino 3.3.9. Static RAM report: 28,368 bytes (8.7% of the declared 327,680 bytes); this is not free-heap or PSRAM telemetry. Runtime diagnostics remain available through serial at 115200 baud, '?' for diagnostics and M5-button debug output.

- Core host tests: 1,330 assertions passed, covering combat, saves, interrupted-write recovery, motion.
- New animation tests: phase boundaries, uint32 wraparound, cooldown rejection, finishing-blow animation passed. An initial test assumed too many hits for the existing slime; corrected the test to reflect the unchanged three-hit kill.
- Firmware asset tests: exact splash dimensions, every encoded RGB565 pixel and mask bit, deterministic regeneration passed.
- Existing sword asset tests: 16-frame geometry, transparency, atlas, encoding, regeneration passed.
- Browser regression tests: all 30 passed.
- Delivery checks: application budget, compiled partition table, merged offsets/contents/padding, download copy hash passed.

| Measurement | Result |
| --- | --- |
| Application BIN | 767,920 bytes (0.732 MiB); 4,343,888 bytes application headroom |
| Embedded battle artwork payload | 115,634 bytes: splash 68,850; four attack frames 43,520; idle 3,264 |
| Current browser asset inventory, not flashed | 1,067,058 bytes |
| Modeled browser asset filesystem usage, not device telemetry | 1,282,048 bytes / 2 MiB = 61.13%; 815,104 bytes free |
| Modeled usage with engineering fixtures | 1,359,872 bytes = 64.84%; 737,280 bytes free |
| Complete factory BIN including padding | 833,456 bytes (0.795 MiB) |

Embedded battle assets are already counted in application size; do not add them again as filesystem use. No filesystem image is included. The 75% modeled asset warning threshold is not exceeded. The working tree contains prior uncommitted calibration work; this build is not a clean published commit or GitHub Release. Delivery manifest records the base commit and dirty status.

## Owner hardware checklist

1. Flash at 0x0000 without full erase, then restart normally.
2. Confirm illustrated splash, landscape display, right-facing Nova, and no sprite trails/clipping.
3. Face button starts/attacks an encounter; verify complete sword cycle and slime HP damage, including victory.
4. After motion calibration, try a gentle swing; verify motion attack and cooldown. Avoid forceful swings or striking objects.
5. Verify player HP, XP, leveling and repeated encounters still work.
6. Confirm save status, restart, and verify restored progression.
7. If needed, send serial '?' diagnostics and report free internal RAM/PSRAM, display dimensions and filesystem state. Hardware performance, motion response, save/restart behavior and appearance have not been claimed as passing.

Reproduction: run tools/prepare-battle-art.py with firmware/artwork-sources/PocketQuest-Splash-Owner.png using Python/Pillow; run tools/test-battle-art.py; build with pio run -d firmware; run sh tools/test-host.sh and python3 tools/check-build.py; package with tools/prepare-delivery.py --version 0.1.1 --feature Nova-Sword-Splash --boot-app0 pointing to the pinned framework tools/partitions/boot_app0.bin. Compile tools/test-battle-animation.cpp together with core/PocketQuestCore/src/Game.cpp and the core include directory for timing regression checks.
