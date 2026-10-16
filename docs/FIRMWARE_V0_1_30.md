# v0.1.30 — Roadside Chests

Owner authorized occasional randomized chests, then the song in a later pass. Owner reports v0.1.29 controls and loading working on their setup. No loading changes or audio integration in this milestone. Sites skill used locally for browser implementation/QA; no hosted publication, source push/Release, physical device access, erase or flash.

## Gameplay

Each outward road section has at most one optional chest. First outing/section0 guarantees a discovery chest; otherwise deterministic1/3 probability. A separate salted world-seed/outing/section hash chooses position and reward. Chests lie90–640 units beyond the encounter, no farther thanX960, on the validated road centerlineV256. Reconnect never rerolls them. No chests appear on the peaceful return/home screen.

Clear the encounter, walk close and press X, Space or the Open chest touch button. No new controller mapping. Rewards: potion chest adds1 up to capacity2; healing chest restores up to8 browser HP. A potion chest heals instead if the pouch is full. If neither benefit fits, the chest stays unopened and says Supplies full. Chests never block the road; skipping/advancing is allowed. They award no XP, gold, items/equipment beyond the existing potion counter, or difficulty changes. Small Canvas pixel chest icon has closed/open states, no new PNG or generated production art. Existing scenery patches/seams are unchanged.

## Authority and persistence

New command11 Chest uses existing Origin/token/revision/target checks and durable transaction. Device derives chest presence/reward itself, requires outward Explore, current encounter cleared, unopened chest, target0 and useful capacity. Reward and opened flag are serialized together with the accepted receipt. Duplicate/lost responses cannot re-award; stale/new claims on an opened chest reject. Uncertain readback halts further writes until reboot as before. Browser proximity is a navigation/UI rule; device does not claim to prove exact walking position (same limitation as existing encounter-start position).

**Save format5 is98 bytes. Formats1–4 migrate without erasing hero, XP, journey, active battles or receipts.** Format4 initializes the new flag unopened. Current-section flag persists on reconnect/rest; it resets on Advance/Depart because those create a different chest identity. Old sections cannot be revisited, so no unbounded list of collected chests is needed. Returning home refills supplies under existing rules; no XP farm is added.

**Do not downgrade to v0.1.29 or earlier after this version writes saves.** Old firmware cannot read format5 and locks writing; do not erase to work around that. Route API schema3 includes validated chest metadata; reload the browser after updating. Cached old clients reject the schema instead of misinterpreting it.

Standalone battle/motion controls, double-X browser controls, phone battle composition, current synth music, scene validation and partitions remain unchanged. The Gentle Glade is not embedded.

## Tests

- 129 browser tests passed, including300 seeded chest/navigation samples, variation, clamping, no replay, full supplies, peaceful return, common interaction path, schema validation and accepted/rejected authoritative receipts.
- 8357 sanitized core assertions passed, including all98 truncated chest-migration writes, full-write/readback-failure recovery, duplicate retry/reboot, v4 active-battle/hero/receipt migration, both reward types, full supplies, gate/mode/target rejection and seeded bounds.
- 189 C++/JS journey/chest generation cases and567 real C++ enemy response comparisons passed;48 fixed-route intent cases and handheld animation regressions passed.
- PlatformIO build, compiled partitions, actual gzip/app payload/hash/import graph/CSP checks, hero snapshot/restart JSON, bounded protocol/Origin checks, branding/portal and whitespace checks passed.
- Disposable actual C++ authority browser: existing fixture completes legacy route through real saved actions, then new outing. Clear wolves; HP38/48. Walk to chestX888, collect via touch; HP46/48 and unchangedXP108. Reconnect, walk back: OPENED, HP46/48 retained, no collect button. Screenshot uses synthetic progress, not owner's hardware save.

Physical StickS3/phone/PS5 behavior and real LittleFS power-cut recovery for this milestone remain owner tests. First chest can legitimately stay closed when level-up/victory recovery has already filled all supplies. Palette/icon are functional placeholders, not new approved production art. Stop for owner review before song integration.

## Delivery and storage

`PocketQuestMini-S3-v0.1.30-Roadside-Chests.factory.bin` — **flash0x0000 without full erase**.

| Measurement | Bytes |
| --- | ---: |
| Actual application BIN | 2,773,808 |
| Application capacity / headroom | 5,111,808 / 2,338,000 |
| Complete factory BIN with padding | 2,839,344 |
| Static RAM allocation | 52,832 |
| Embedded browser gzip | 1,181,433 |
| Illustrated library stored payload | 1,230,780 |
| Modeled illustrated LittleFS | 1,556,480 (74.22%) |
| Modeled including engineering fixtures | 1,605,632 (76.56%) |

75% review warning remains active including fixtures. Modeled free540672 bytes illustrated-only /491520 with fixtures out of2MiB. Model is not physical telemetry; actual browser assets are inside the application and should not be double-counted as filesystem contents. No new PNG/audio payload.

Factory SHA256 `212e1d6b2f7d53b29ecdab08ae4841e82cb8269b1ad751ec532cbddd57c7827f`.

Verified offsets: bootloader0x0000, partition table0x8000, boot_app0 0xE000, app0x10000. Image ends before saves0x4F0000/assets0x5F0000, includes no filesystem image and never initializes/erases saves. Padding includes NVS, so unrelated settings are not guaranteed preserved. Manifest records dirty-tree provenance from checkpoint c0a7c6be9374d0a9269bc3247d6bad147e6b3627, not a newly published commit. Offline review HTML is isolated demo progress. Owner downloads/flashes/tests.
