# v0.1.8 clean-install recovery — resets all saves

2026-10-13. Owner reports accidental full chip erase, subsequent NO SAVE FS, and unsuccessful recovery by flashing the first application. Owner explicitly approved preparing a clean-install recovery package. No physical device accessed/erased/flashed by Codex. Erased progress cannot be recovered without a backup; this starts a new game.

## Manual installation

File: PocketQuest-S3-v0.1.8-CLEAN-INSTALL-Recovery.factory.bin

**Flash at 0x0000 with ESP Launchpad. Disable full-erase; no additional erase needed.** This single contiguous image includes the latest tested application and an initialized empty save filesystem. It overwrites all game saves and NVS settings. It is NOT a save-preserving routine-update image and must not be reused after new progress is created.

1. Download the file named CLEAN-INSTALL-Recovery, flash it at 0x0000 without full erase, then restart normally.
2. Advance to the mini-game with M5. The first successful initialization should show SAVED, not NO SAVE FS. Firmware creates its two snapshots on this empty mounted filesystem, rather than autoformatting it.
3. Play one encounter, wait for SAVED, restart, and check RESTORED and retained XP/progress. These are owner tests, not outcomes claimed by Codex.
4. If NO SAVE FS remains, send serial '?' output at 115200 baud; do not repeatedly erase or reuse this reset package while attempting to preserve new progress.
5. Future updates use the normal save-preserving factory BIN, never this clean-install package unless deliberately starting over.

Chip-derived Wi-Fi SSID/password remain reproducible despite erase/flashing. New world seed/progress will be generated at startup. Difficulty starts from zero victories. Slime art/lunge, screen flow, hotspot URL and rules-2 difficulty are unchanged from v0.1.8.

## Contents and bounds

| Segment | Offset | Bytes |
| --- | --- | --- |
| Bootloader | 0x0000 | 19,984 |
| Partition table | 0x8000 | 3,072 |
| boot_app0 | 0xE000 | 8,192 |
| v0.1.8 application | 0x10000 | 1,444,848 |
| Initialized empty saves filesystem | 0x4F0000 | 1,048,576 |

Writes range [0x000000,0x5F0000), including padded gaps through the application area and NVS. Ends exactly before assets at 0x5F0000; assets and coredump not included. Assets remain uninitialized after the reported erase, but current firmware does not mount/need the asset filesystem: its graphics and connection landing page are embedded in application flash. No partition change or autoformat firmware change.

Same application bytes as normal v0.1.8, not a newly modified firmware build. Standard tools/prepare-delivery.py rechecks core regressions, build budgets, compiled partition/source agreement, constituent offsets/contents and 0xFF padding. Recovery tool separately verifies the added save image and its exact boundaries. SHA-256 of final file: d09a6c509187fdc5c4cefa9e28d2ee05397add5645bc31c4565a7743d8b68a05. Manifest records the source base commit and local dirty state.

## Filesystem verification

Reuses the original verified initialization artifact release/PocketQuest-v0.1.0.empty-saves.bin, SHA-256 d7ccd1596703bfbfceaf7798c69691162ec2e34f11381dbafb0078978a2c41e5. This is empty LittleFS, not a rules-1 game snapshot; it is valid for new rules-2 saves. Filesystem geometry: 4096-byte blocks × 256, 128-byte read/program and 512-byte cache in host checks. Explicit host mount (autoformat disabled) confirms empty root. On an in-memory copy only, two 60-byte test slot files write/read/remount successfully; those synthetic test files are NOT in the shipped empty image. The packaged save slice separately mounts with empty root. Source/delivery hashes verified; no actual device mount yet observed for this recovery.

Core tests: 1,834 assertions PASS. Normal base image is byte-identical to the previously built/tested v0.1.8. Host FS/package checks PASS. Firmware's existing no-autoformat/save-lock behavior unchanged. Earlier hardware installation established a working save filesystem; this recovery still requires owner hardware verification rather than assuming success.

## Storage checkpoint

- Application: 1,444,848 bytes (1.38 MiB), unchanged; embedded image payload 154,802 bytes already counted within it.
- Added initialized-save image: 1,048,576 bytes; empty host allocation 8,192 bytes, not runtime device telemetry.
- Browser asset payload: 1,081,930 bytes, not installed by this image. Last unchanged model 1,314,816 bytes / 2 MiB (62.70%, 782,336 free), or 1,392,640 with engineering fixtures (66.41%, 704,512 free). Below 75% warning.
- Complete clean-install factory BIN including padding: 6,225,920 bytes (5.9375 MiB). Bigger than normal v0.1.8's 1,510,384 bytes because it spans the gap and entire saves partition, not because application grew.

Reproduction: use Python with littlefs-python 0.19.0 to run tools/prepare-recovery.py --confirm-reset-saves --boot-app0 pointing to pinned framework tools/partitions/boot_app0.bin --output-dir pointing to a deliverable folder. Script verifies the scoped v0.1.8 layout and known initialization hash, refuses differing same-name outputs, and never opens a serial device. This explicit reset option is not for routine updates. No GitHub Release/source push performed.
