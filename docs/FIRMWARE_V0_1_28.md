# v0.1.28 — Direct Controls

Owner-authorized exact mapping replaces the prior directional action menu. Sites skill used locally; no hosted deployment, source push/Release, physical flash/erase or device access.

## Controls

| Input | During battle |
| --- | --- |
| Cross (X), standard index0 | Highlight and immediately use Power Strike |
| Circle, index1 | Highlight and immediately use Guard |
| Square, index2 | Highlight and immediately use Run |
| Triangle, index3 | Highlight and immediately use Potion |
| D-pad / left stick | No battle action selection or movement |
| L1/R1 | Previous/next living target, unchanged |
| L2 | Fullscreen toggle, unchanged |

No R2 action or second confirmation was added. Normal Attack stays on-screen: all four face buttons were assigned explicitly by the owner. X retains engage/depart/result handling outside battle. Movement uses D-pad/stick only in exploration. Each face action selects its matching button outline before the accepted-turn transaction. Held controls, initial connection, focus loss and busy playback retain release-to-arm/one-edge protections; simultaneous face presses dispatch at most one action.

Boss Run is still prohibited. Empty focus/potions are still prohibited. The client highlights the requested action and gives a local explanatory status instead of silently substituting another action or sending a disallowed command. Guard restores focus under existing authoritative rules. Disabled on-screen controls remain disabled. Local status does not award XP, damage, saves or resources.

No difficulty, core combat, save format4/rules4, phone framing, artwork, music or partition changes. The Gentle Glade remains on hold. The slow initial load is **not fixed by this pass**: current browser payload is1178882 compressed bytes and includes eager image loading/validation. Caching and loading-progress improvements remain separate follow-up work; no unsupported timing improvement is claimed.

## Tests and limits

117 browser tests pass, including standard face indices, one-press actual demo-rule execution for all four actions, no D-pad/stick/trigger action routing, held/background suppression, blocked boss escape, empty resources and source wiring for immediate highlighting.5132 sanitized core assertions, handheld animation tests,48 fixed-route C++/JS intent cases and189 journey policy cases/567 actual C++ responses pass. Firmware build, actual browser payload/gzip/hash/import graph/CSP checks, branding, portal and whitespace checks pass.

Physical PS5 button behavior is not verified. Fresh visual preview was blocked by the browser tool's local-file URL policy; no bypass was attempted and no new visual QA claim is made. Phone layout math and prior regressions remain covered by automated tests. Owner should verify all four physical buttons in normal/fullscreen battles and check Guard after focus exhaustion, potion use, ordinary escape, and blocked boss escape.

## Manual update

`PocketQuestMini-S3-v0.1.28-Direct-Controls.factory.bin` — **flash0x0000 without full erase**.

| Measurement | Bytes |
| --- | ---: |
| Actual application BIN | 2,769,776 |
| Application capacity / headroom | 5,111,808 / 2,342,032 |
| Complete factory BIN with padding | 2,835,312 |
| Static RAM build allocation | 52,832 |
| Embedded browser gzip payload | 1,178,882 |
| Illustrated stored library payload | 1,228,987 |
| Modeled illustrated LittleFS | 1,552,384 (74.02%) |
| Modeled with engineering fixtures | 1,601,536 (76.37%) |

75% warning remains active with fixtures. Modeled free544768 bytes illustrated-only /495616 with fixtures out of2MiB. These future-filesystem estimates are not physical flash usage; current assets are embedded in the application and must not be counted twice. No new artwork/audio.

Factory SHA256 `161860acdce522dc66ad159fbf8259be4832e53a53368d04add90d689758b22c`.

Verified offsets: bootloader0x0000, partitions0x8000, boot_app0 0xE000, app0x10000. Image ends before saves0x4F0000/assets0x5F0000; no filesystems included/initialized. Padding includes NVS, so unrelated settings are not guaranteed preserved. Never full-erase for a routine update; do not downgrade to v0.1.21 or earlier after format4 saves. Manifest records dirty-tree provenance from checkpoint c0a7c6be9374d0a9269bc3247d6bad147e6b3627, not a newly committed/published release.

Offline review HTML is isolated demo progress. Owner downloads/flashes/tests. Stop for review; load-time work remains pending.
