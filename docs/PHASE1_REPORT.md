# PocketQuest Phase 1 development report

Status: implementation and host verification complete; ready for owner review before physical testing. No physical device writes were performed. Existing PocketLab, PocketPal, and PocketBoy source projects were used only as references and were not modified.

No existing PocketQuest source repository was found in the inspected project locations, so this is a separate source project under `outputs/PocketQuest`. No GitHub repository, push, PR, or deployment was created. The supplied Phase 1 authorization is the implementation scope; Phase 0 documents remain the baseline and are copied into `docs/` for reference.

## Implemented milestones

| Milestone | Implementation | Verification |
| --- | --- | --- |
| Structure and dependencies | Portable C++ core, hardware adapters, future web/contracts/assets folders; pinned PlatformIO and M5 libraries | Firmware build passed |
| Player and encounter | PocketQuest splash, geometric player, idle bob, one woodland slime, HP, XP, levels, visible hit/result feedback | Core tests passed; visual output awaits device |
| Motion/button combat | BMI270 via M5Unified; 50 Hz gravity filtering, calibration, two-reading threshold, quiet rearm, shared cooldown; debounced Face alternative | Synthetic motion tests passed; real-world comfort/false-positive rate unmeasured |
| Persistent game state | Explicit 60-byte versioned encoding, CRC32, sequence/revision, alternating snapshots, readback before promotion, no autoformat | Corruption and interrupted-write host tests passed; LittleFS power-cut behavior awaits device |
| Storage and diagnostics | Separate saves/assets, runtime layout guard, serial partition/heap/PSRAM/IMU/filesystem reports | Source and compiled partition map agree; physical capacity/layout not yet verified |
| Scenery preparation | JSON contracts, connection/collision rules, smallest useful offline validator/preview specification | JSON syntax inspected; schema semantic/fixture execution belongs to later validator work |

## Build and storage results

Release candidate: v0.1.0. Build environment `m5stack-sticks3` completed successfully using pioarduino 55.03.39 / Arduino-ESP32 3.3.9, M5Unified 0.2.25, M5GFX 0.2.32. No warnings or failures requiring a source repair were reported in the completed build.

| Measurement | Result |
| --- | ---: |
| PlatformIO application section usage | 651,539 bytes / 5,111,808 (12.7%) |
| Actual application `.bin` file | 651,936 bytes |
| Application partition headroom by binary size | 4,459,872 bytes |
| Phase 0 firmware ceiling | 2,883,584 bytes (2,816 KiB); passed |
| Static RAM reported by PlatformIO | 28,360 / 327,680 bytes (8.7%) |
| Bootloader file | 19,984 bytes |
| Partition table file | 3,072 bytes |
| Merged factory file | 717,472 bytes |
| Separate empty-save image | 1,048,576 bytes |
| Snapshot payload | 60 bytes each; 120 bytes for two, excluding filesystem metadata |
| Production scenery/browser asset payload | None in Phase 1 |

Section usage and binary file sizes differ because of image headers/alignment. Static RAM is not free runtime heap, and 327,680 is the linker's available RAM region, not the chip's total SRAM. Physical internal heap, PSRAM allocation, fragmentation, and save filesystem usage remain unmeasured; startup and Serial `?` report these after separately approved installation.

| Partition | Offset | Reserved size |
| --- | --- | --- |
| NVS | 0x009000 | 24 KiB |
| Factory application | 0x010000 | 4,992 KiB |
| Saves | 0x4F0000 | 1,024 KiB |
| Assets | 0x5F0000 | 2,048 KiB |
| Coredump | 0x7F0000 | 64 KiB |

The final partition ends exactly at 0x800000 (8 MiB). `tools/check-build.py` checked overlap, source-versus-generated binary entries, application ceiling, and file sizes. This is compiled-layout evidence, not a readback of the owner's current device. The runtime guard checks physical flash size and save/asset addresses before mounting saves.

## Host test results

`sh tools/test-host.sh` passed **1,330 assertions**, compiled with Clang C++17, warnings-as-errors, AddressSanitizer, and UndefinedBehaviorSanitizer. No sanitizer failures were observed.

- Combat cooldown, timer wrap, HP, victory/defeat, XP thresholds, saturation, level-up, and restore validation.
- Serialization golden bytes, standard CRC vector, round-trip, all truncation lengths, and every single-bit corruption across the 60-byte snapshot.
- All 60 incomplete byte-cut positions while replacing the inactive snapshot; valid newest selection, damaged newest fallback, and completed-write-before-ack restart.
- Both damaged files, future save/rules versions, conflicting seeds/sequences, and storage read/write faults preserve existing state rather than formatting or overwriting unknown saves.
- Synthetic stillness, slow tilt, deliberate swing, quiet rearm, sustained motion, spikes, invalid values, startup movement, and sampling gaps.

The fault-injection storage double models file-byte outcomes, not ESP32 flash sectors, LittleFS metadata, battery loss, or filesystem driver behavior. Those require the backed-up hardware acceptance tests in `INSTALLATION_REVIEW.md`. Recent changes can be lost before a successful checkpoint; no transaction journal is claimed.

## Preserved later requirements

The device remains authoritative. Chrome RPG, deterministic seeded wilderness, intentionally authored Oakwood, autonomous aggregate settlements, stewards, priorities, reserves, caravans, quests, and elapsed-time progression remain planned, not removed or implemented. `FutureTimePolicy` preserves a configurable seven-day cap; there is no elapsed-time simulation or invented clock continuity in Phase 1.

Scenery remains provisional: 512 × 288 ground pixels, 512 × 512 world footprint, parallel 9/16 vertical projection, 32 × 32 navigation cells, anchored transparent foregrounds, families F001–F004, masks 0/5/10/15. No production art or full browser game was generated. See `SCENERY_VALIDATOR.md`, the schemas, and the copied Phase 0 scenery standard.

## Remaining risks and recommendation

The source can be compiled and host-tested now, but physical display, IMU units/axes, thresholds, GPIO behavior, flash capacity/current layout, PSRAM, power behavior, and actual filesystem interruption recovery are not yet proven. The library pins match the inspected reference build configuration; hardware tests are still required.

Recommended next step: owner reviews this report and installation plan. Then perform approved read-only identity/layout inspection and backup, present the exact write plan, and obtain explicit installation approval. Stop here until that approval. After the standalone prototype is accepted, build the small scenery seam/navigation preview before producing forest artwork.
