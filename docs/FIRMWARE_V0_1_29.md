# v0.1.29 — Cross Tap Controls

Owner-approved mapping: single Cross/X Attack; double-tap X Power Strike; Circle Guard; Square Run; Triangle Potion. D-pad/stick move Nova only in exploration, never choose battle actions. L1/R1 targets, L2 fullscreen and outside-battle X context behavior remain unchanged. No R2 or separate confirmation added.

## Gesture behavior

First X highlights Attack, then waits250ms. A second press edge within that window (release X between presses) replaces it with one Power Strike, consuming one existing action/turn, not Attack followed by Power. A single X resolves once at the deadline, including if held; holding cannot produce repeat edges. On-screen Attack/Power still execute immediately with one touch.

Circle/Square/Triangle are immediate and cancel any pending X. Simultaneous face inputs yield at most one action. Pending taps are poll-driven, not background command timers, and tied to battle, round, target and device revision. Input clear, busy transactions, focus loss, disconnect, context changes and long frame gaps cancel them. A second tap arriving after the deadline cannot queue another turn. Device authority, busy locks and existing resource/boss restrictions remain intact. No-focus Power gives a message instead of silently becoming Attack.

250ms is an initial tuning value needing the owner's physical PS5 comfort test. This small single-Attack delay is necessary to distinguish the gestures without spending two turns. The first tap highlights Attack; a recognized second tap highlights Power Strike.

## Verification and unchanged scope

123 browser tests pass: single/double/boundary/late taps, held/release edge handling, no queued extra turn, other-face precedence, cancellation, one actual demo Power action, no-focus rejection and previous renderer/scenery/input/authority regressions.5132 sanitized core assertions, handheld animation tests,48 fixed-route parity cases and189 journey policy cases/567 real C++ responses pass. PlatformIO build, actual app package/gzip/hash/import graph/CSP, branding, portal and whitespace checks pass.

No physical PS5, phone, save/restart or hardware test claimed. Fresh browser visual QA not performed; the prior tool local-file URL restriction was not bypassed. Existing phone layout is unchanged and automated regressions pass. Sites skill used for local source/package workflow, not publication. No device flash/erase, Git push or Release.

Saves format4/rules4, partitions, core combat/difficulty, phone composition, art, current synth music and standalone behavior unchanged. The Gentle Glade and load-time optimization remain deferred. Current /play gzip is1179545 bytes; no loading-speed improvement claimed.

## Manual update and storage

`PocketQuestMini-S3-v0.1.29-Cross-Tap.factory.bin` — **flash0x0000 without full erase**.

| Measurement | Bytes |
| --- | ---: |
| Actual application BIN | 2,770,448 |
| Application capacity / headroom | 5,111,808 / 2,341,360 |
| Complete factory BIN including padding | 2,835,984 |
| Static RAM | 52,832 |
| Illustrated stored library payload | 1,229,441 |
| Modeled illustrated LittleFS | 1,552,384 (74.02%) |
| Modeled including fixtures | 1,601,536 (76.37%) |

75% review warning remains active including fixtures. Modeled free544768 bytes illustrated-only /495616 including fixtures out of2MiB. These are future-filesystem capacity models, not physical telemetry; current assets remain embedded in the application and must not be double-counted. No new PNG/audio.

Factory SHA256 `d1bd6b7be1fda912d6be6243f3e7b537065c26bf0e26b70b36714cb77483d8e1`.

Verified bootloader0x0000, partitions0x8000, boot_app0 0xE000, app0x10000. Factory stops before saves0x4F0000/assets0x5F0000; no filesystem image included or initialized. Padding includes NVS, so unrelated settings are not guaranteed preserved. Do not full-erase for this routine update or downgrade to v0.1.21 or earlier after format4 writes. Manifest records dirty-tree provenance from checkpoint c0a7c6be9374d0a9269bc3247d6bad147e6b3627, not a new published commit.

Offline review HTML is isolated demo progress. Owner downloads/flashes/tests; stop for review.
