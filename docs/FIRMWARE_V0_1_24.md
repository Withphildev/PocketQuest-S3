# v0.1.24 — Play Mode & Music

Development candidate, 2026-10-16. No physical device was accessed, flashed or erased. No source push or GitHub Release. Sites skill was used for the local browser implementation and preview; no hosted deployment.

## Changes

- Standard controller detection expands a screen-filling play layout. L2 toggles; Exit/Escape leaves. Native fullscreen and landscape locking are best effort; a manual Hide browser bars control supports browsers requiring a direct tap. CSS fallback and whole-shell portrait rotation retain HUD, Home, music, targets and battle actions. Touch arrows remain available without a connected controller. This is not kiosk locking.
- Uniform battle scaling and inverse rotated touch coordinates avoid stretching or mismatched targets. Background settings are hidden from keyboard navigation while immersive mode is active.
- Original lo-fi exploration theme “Lantern Road”: 72 BPM, 3/4, 32 bars, 80 seconds, recurring A phrase, variation, contrasting B and return. Original battle “Small Courage”: 88 BPM, 16 bars, 43.64 seconds. Original boss “Keeper of the Grove”: 100 BPM, 16 bars, 38.4 seconds. The supplied Zelda reference was not transcribed; its melody/arrangement is not included.
- Complete note-data arrangements are synthesized by WebAudio; no soundfonts, samples or listening WAVs are embedded. Music remains opt-in with mute, volume and background pause.
- Optional full-length MIDI exporter and offline WAV renderer provide review outputs. WAV is a normalized approximation of the browser synth, not a recording of device playback.

No PNG, save/core combat/journey rules or partition changes. Format 4/rules 4 remains current. Chests are deferred. Handheld behavior, 2.5-second splash, credentials and friendly URL are preserved.

## Delivery and storage

Routine-update file: `PocketQuestMini-S3-v0.1.24-Play-Mode-Music.factory.bin`, flash at **0x0000 without full erase** using ESP Launchpad. Saves/assets are not included. Image ends at 0x2B3690, before saves at 0x4F0000 and assets at 0x5F0000. Padding includes NVS, so preservation of all unrelated settings is not promised. Do not downgrade to v0.1.21 or earlier after format-4 saves.

| Measurement | Bytes |
| --- | ---: |
| Actual application BIN | 2,766,480 |
| Application partition | 5,111,808 |
| Application headroom | 2,345,328 |
| Complete factory BIN including padding | 2,832,016 |
| Static RAM build allocation | 52,832 |
| Gzipped embedded browser payload | 1,175,571 |
| Illustrated asset payload inventory | 1,226,383 |
| Modeled illustrated filesystem allocation | 1,548,288 / 2,097,152 (73.83%) |
| Modeled allocation with engineering fixtures | 1,597,440 / 2,097,152 (76.17%) |

75% storage review warning remains active with fixtures; illustrated-only model is also approaching the threshold. Modeled free space is 548,864 bytes illustrated-only, 499,712 with fixtures. This is a conservative future-filesystem model, not actual device telemetry. Assets currently reside in the embedded application payload; do not add that payload twice when counting actual flash. Review WAV/MIDI files are not shipped on the StickS3.

Factory SHA-256: `fd5aefe1d860977b271d3596e174364f412070b3974279e1ad43df3fe5a01906`.

Verified segment offsets: bootloader 0x0000, partition table 0x8000, framework boot_app0 0xE000, application 0x10000. Manifest records each segment hash and dirty working-tree provenance from source checkpoint `c0a7c6be9374d0a9269bc3247d6bad147e6b3627`; this is not a newly committed release.

## Verification

- PlatformIO StickS3 build and build/partition checks passed.
- 101 browser tests passed: complete music/MIDI/WAV structure, scheduler full-loop boundaries, fullscreen failure/race/exit handling, analog L2 release-to-arm, rotated touch mapping, and existing renderer/scenery/gameplay regressions.
- 5,132 sanitized core assertions passed; handheld lunge/animation bounds and timing checks passed.
- 48 fixed-route intent parity cases and 189 journey policy cases, including 567 actual C++ response comparisons, passed.
- Actual host-engine hero JSON/save/restart checks passed. Gzip/header/hash/import graph/CSP/command wiring and actual app payload checks passed; branding/portal checks and diff whitespace checks passed.
- Local browser using a disposable C++ authority: native fullscreen entered/exited, essential controls remained available, music synth started and theme switched. Tested landscape 844×390 and portrait 390×844 layout geometry; viewport overrides reset afterward. Screenshot uses synthetic local progress, not the owner's hardware save.

Physical PS5 connection/L2 behavior, real phone fullscreen/orientation/touch targeting, real hardware restart and listening quality have **not** been verified for this version. Browser permissions and platform fullscreen restrictions vary. Owner should audition the theme for phrasing, repetition and volume, then test controller/touch exploration and battles on the StickS3 hotspot. Music preview is approximately 80 seconds plus a short tail; reloadable offline review HTML remains an isolated, unsynchronized demo.

## Reproduction

Run `npm test` in `web`, `sh tools/test-host.sh`, the existing PlatformIO build, `python3 tools/test-route-package.py`, then `tools/prepare-delivery.py` with the pinned framework boot_app0 input. Use `node web/tools/export-route-midi.mjs` and `node web/tools/render-route-audio.mjs` for optional review exports (consult their CLI arguments). Never automatically flash hardware.

Stop for owner review. Chest loot is the next separate gameplay candidate; no new production scenery or Phase 2B systems were introduced.
