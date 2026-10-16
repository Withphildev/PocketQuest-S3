# v0.1.16 — Oakwood Rest

Routine save-preserving development update, owner manual-flash workflow. No device was opened, flashed or erased. No Git commit/push or GitHub Release created.

## Delivery

PocketQuest-S3-v0.1.16-Oakwood-Rest.factory.bin — flash at **0x0000 without full erase**.

Factory: 2,928,016 bytes (2.79 MiB). SHA256: `64eb67b576f47ab5c1854482ea319a045a369f4370ad2208c1f0442472130183`.

Verified bootloader 0x0000, partitions 0x8000, boot_app0 0xE000, application 0x10000; application, constituent offsets and padding match the build. Factory ends before saves at 0x4F0000 and assets at 0x5F0000. No filesystem or initialization images included. NVS is within contiguous padding, so unrelated NVS settings are not guaranteed preserved. Partition table and format-3/rules-4 saves unchanged. Keep existing v0.1.14/v0.1.15 progress, including completed routes. Do not downgrade to v0.1.13 or earlier after format-3 saves.

## Changes

- One Oakwood background shared by both Nova protagonists. Two transparent resting frames each, fixed seated pivots and 1.4-second pose timing. Protagonist selector also changes the rest artwork.
- Pause/resume breathing; reduced-motion preference freezes poses and disables the 450ms entry fade. Code draws fade; no GIF/video/full-scene animation frames.
- Rest, defeat and completed-quest messages. Existing device-authoritative Camp heals and persists BEFORE artwork begins; no new commands/rewards/save fields. Departure is not held until fade/animation finishes. Art decoding failure falls back to the quest board, not a disabled game.
- Existing standalone combat/motion/buttons, browser encounters, hard stops, shared XP, input/music and scenery validation retained. No new route scenery library, village navigation, or gameplay systems.

## Deterministic exports

The approved masters remain untouched in web/artwork-sources/oakwood-rest. Rebuild with pinned Pillow 12.3.0: `python web/tools/prepare-rest.py`. The helper verifies master SHA256, explicit source windows, absence of clipped solid pixels, real source transparency and encoded output pixel readback.

Background: 1672x941 master edge-extended by 4 pixels left/right and 2 top/bottom to 1680x945, then uniformly nearest-neighbor scaled by 4/21 to **320x180**. No illustration content removed. Female windows become **60x82**; male windows **64x86** via uniform 1/10 scaling. Source rectangles/pivots match the approved layered preview. Faint alpha speckles outside display windows are excluded; no alpha threshold applied to exported pixels. Uniform scaling/explicit windows are preparation, not a claim of pixel-identical high-resolution detail.

The 512x288 export trial was 477,942 PNG bytes, too large for the existing application ceiling. The selected lower-resolution set is 182,178 PNG bytes (177.91 KiB), compared with 5,154,168 bytes for masters. That is about 96.5% smaller than the masters, NOT a fair measured comparison against two final-resolution static scenes. Owner should review pixel density on the target phone before considering final art approved.

## Separate storage measurements

| Measurement | Bytes / allocation |
| --- | ---: |
| Actual application BIN | 2,862,480 (2.73 MiB) |
| App partition remaining | 2,249,328 (2.15 MiB) |
| Remaining under 2816 KiB development ceiling | 21,104 |
| Factory BIN including padding | 2,928,016 (2.79 MiB) |
| Embedded browser gzip, included in app | 1,274,896; 105 assets |
| New rest PNGs | 182,178 |
| Future illustrated asset stored payload model | 1,331,085 |
| Modeled illustrated LittleFS allocation | 1,634,304 / 2,097,152 (77.93%) |
| Modeled free space | 462,848 |
| Model including fixtures | 1,712,128 (81.64%), 385,024 free |
| Static RAM | 52,768; not runtime heap/PSRAM telemetry |

**Storage review warning:** both filesystem models exceed the owner's 75% threshold. No partition was changed and no existing artwork was reduced to hide that warning. Rest layers use explicitly authorized smaller export copies. Current assets are embedded in application PROGMEM; the future filesystem model is NOT additional current flash consumption. Before new artwork, review lossless encoding, unused duplicate frames/fixtures and the asset-serving plan. The app partition has room, but its stricter development ceiling is nearly reached and must not be silently raised.

## Verification

- 63 browser tests PASS: rest geometry/drawing, pause/reduced motion/away, bounded fade, messages and no presentation writes/waits, plus all existing route, device adapter, input, music, collision and scenery checks.
- 3,284 sanitized core assertions PASS; gameplay/save implementation unchanged.
- Pinned PlatformIO firmware build PASS.
- Actual C++ hero JSON/Node integration and friendly URL/DNS source checks PASS.
- Gzip/header/hash/105 assets/import graph/CSP/protected command wiring and current actual compiled payload PASS.
- Delivery offset/partition/padding/source/copy/hash checks PASS.
- Browser QA against actual-core synthetic loopback authority: female and male art displayed; selector and pause tested; saved Camp kept shared XP; immediate departure worked without waiting for fade. Screenshot is synthetic QA, not hardware telemetry. New phone touch/controller/music and power-cycle checks remain owner testing.

Rebuild browser: `python3 tools/build-route-page.py`; firmware: `pio run -d firmware`; tests: `sh tools/test-host.sh`, `node --test web/tests/*.test.mjs`, `python3 tools/test-route-package.py`, `python3 tools/check-build.py`. Budget: `web/tools/asset-storage-budget.py <report.json> --female-v2 --sword --slime --wolf --goblin --route` with littlefs-python 0.19.0. Delivery: prepare-delivery.py version 0.1.16, feature Oakwood-Rest and installed pinned framework boot_app0.bin.

## Owner checklist

Flash without erase; reconnect Wi-Fi; reload http://PocketQuest/play so old code is replaced. Verify both Novas on the bench, breathing/pause, departure, defeat/rest messages and retained shared XP/restart persistence. Existing cleared captain remains cleared, not reset. Rest scene is browser-only; StickS3 screen remains standalone combat. No automatic replay/reset. Current walking position and visual protagonist choice remain unsaved. Rest animation is a generated two-pose first pass, not a perfectly hand-registered production loop. Stop for review.
