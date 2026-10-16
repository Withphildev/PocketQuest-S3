# v0.1.22 — Woodland Journey foundation

Owner authorized proceeding with the agreed plan and asked whether multiple changes can be bundled. This first related bundle implements the continuous road, deterministic varied encounters/spacing, boss opportunities, increasing road difficulty, saved journeys and short safe return. Treasure chests and controller fullscreen remain subsequent bundles. No new art or enemy-AI tactics. Sites skill used for local browser implementation/verification; no website hosting/publication, Git commit/push/Release, or physical device access.

## Implemented loop

- Set out from Oakwood; enter each forest section on the left, travel right. Existing 1024×288 illustrated ground (two 512×288 blocks), shared edge/corner registry, 36px connectors, navigation, foreground anchors/occlusion and validator remain unchanged. Repeated instances reference the same assets; no extra scenery PNGs or per-section content files. Camera scrolls; section crossing shifts local coordinates by one master width without resetting the artwork phase. Movement is briefly held for the durable boundary checkpoint, then held controls continue.
- Current section has one encounter: Slime, Wolves (two Wolves), Goblin, or Goblin boss using existing Goblin Captain artwork/rules. Kind and position (x320–720) come from explicit 32-bit hashing of the saved world seed, outing number and section. First two sections are ordinary. Later sections have seeded boss opportunities (hash modulo5), with a guaranteed boss at every sixth section. This randomizes appearance timing, NOT a roster of new boss species/art. Repetition can occur; no anti-streak rules yet.
- Every undefeated encounter blocks forward progress across the full road depth. No advance before victory and Continue. Section-exit commands award no XP; victory awards the existing 12/24/12/36 encounter rewards atomically. XP saturates safely; no chest/currency/equipment system or new reward claims.
- Road tier rises every three cleared/exited sections, cap99. Enemy HP increases by2 per tier; per-enemy damage increases by1 per3 tiers. Per-enemy Guard rounding and captain third-round heavy strike remain. These are provisional balancing choices, not owner-tested final difficulty. Road tier is separate from Nova's shared level/XP.
- Left exit or Head home switches to one clear 1024-unit return stretch. Walk left to A Moment in Oakwood; no enemy or extra rewards on this stretch. Finish returning home button can skip the walk. Rest restores browser HP/focus/two potions, retaining XP/highest tier. An active battle can still be explicitly abandoned to immediate rest (also physical Hold Face); this is an emergency exit, not walking past the enemy.
- New outings start max(1, highest road tier−1). Repeated rest does not ratchet highest downward. Disconnect/reload does NOT create a new outing: same section/kind/position/tier or active battle/return mode resumes. Exact walking coordinates/appearance are not saved per frame; exploration resumes at its section entrance. No offline clock/simulation added. Browser combat HP remains separate from handheld HP; shared XP/level unchanged.

## Save migration and download

**PocketQuestMini-S3-v0.1.22-Woodland-Journey.factory.bin — flash at 0x0000 WITHOUT FULL ERASE.** SHA256 `4d840337dc89e8cb34e69118c41ad394d091f2c65f13654a5f04fc3f2216eeb8`.

Routine update, not a clean-install initializer. Save format4 is97 bytes, rules4 unchanged. Reads formats1/2/3; real format3 legacy battle/receipt/hero fields migrate intact with unplayed journey defaults. Finish or abandon an existing old battle, then explicitly Set out from Oakwood to switch from fixed-route cleared-mask state to journey current-section state. Earned XP, level, world seed and handheld state are retained. Old fixed-route completion does not prevent new outings; replayable new journeys are now deliberately authorized. Legacy route progress is replaced only on explicit Depart, not on decode.

**Do not downgrade to v0.1.21 or earlier after format4 writes.** Older firmware locks out the newer save rather than converting it. No erase/automatic format performed. Snapshot paths and partitions unchanged. Outing/section uint32 counters do not wrap; requests reject at exhaustion. Highest/current tier bounds and derived encounter consistency are validated.

Route API schema2 includes journey metadata; old cached clients reject it instead of interpreting a journey as the original four-node quest. Reload the page after updating. New Depart/Return/Advance commands contain only base revision/action/target and use the existing origin/token checks, action throttling, durable write/readback and receipt/conflict/uncertain-save protection. No client-provided tier, damage, seed or XP fields accepted.

Verified merged bootloader0x0000, partitions0x8000, boot_app0 0xE000, application0x10000, including segment bytes, erased-value padding and hashes. Image ends before saves0x4F0000/assets0x5F0000. No filesystem images included. Contiguous NVS padding can overwrite unrelated settings. Hotspot SSID/password, http://PocketQuest, Mini splash/2500ms flow, controls and handheld combat remain unchanged.

## Four storage measurements

| Measurement | Bytes |
| --- | ---: |
| Application BIN | 2,761,440 (2.63 MiB) |
| Factory BIN including padding | 2,826,976 (2.70 MiB) |
| Illustrated stored asset payload model | 1,222,584 |
| Illustrated modeled filesystem | 1,536,000 / 2,097,152 (73.24%) |
| Model with engineering fixtures | 1,585,152 (75.59%) |

Application grew6,096 bytes versus v0.1.21. App partition headroom2,350,368 bytes; headroom under unchanged2816 KiB development ceiling122,144. Browser gzip1,170,541 bytes/105 assets; raw embedded HTML1,664,588. Static RAM52,832 bytes, not measured runtime heap/PSRAM. Illustrated model free561,152 bytes; with fixtures512,000. Fixture-inclusive model still exceeds owner's75% warning; illustrated-only below. Models are future filesystem allocation, not device telemetry: current assets are embedded inside app, not additionally installed in an asset filesystem. No repartition or artwork-quality reduction.

## Verification

- Firmware build and actual-app/package/partition/merged-image checks PASS.
- 81 browser tests PASS: deterministic/varied choices, boss bounds, original scenery connection validator, repeated-world collision crossing, encounter gates, tier growth, repeated-rest floor, scaled intent/Guard, authoritative reconnect/return metadata validation and restricted command payloads, plus existing input/music/rest/scenery/pipeline tests.
- 5,132 sanitized core assertions PASS, including legacy saves/motion/combat, current journey lifecycle, XP saturation, receipt duplicates, tier cap/counter exhaustion, active format3 battle migration, every truncated migration write and every truncated section/tier boundary write. Original uncertain full-write/readback and reward-replay protections retained.
- 189 C++/JS policy/adapter parity cases spanning high64-bit seeds, outing/section extremes and tiers1/50/99, including567 real-C++ ordinary/Guard/heavy response comparisons. Original48 fixed-route intent cases and all handheld lunge tests also PASS.
- Hero JSON/restart/unsaved reporting, Mini branding/header bounds, friendly URL and 129 exact PNG source/derivative RGBA/alpha/metadata checks PASS. git diff --check PASS.
- Synthetic C++ browser QA: Depart → Wolves → two Power Strikes → +24 shared XP/level2 → Continue → section2 Slime → left-exit peaceful path → walk left → Oakwood with XP retained. Final-page reload retained Wolves round2/36HP/12XP after Guard. Held touch movement continued across durable section boundary to the next encounter gate. No browser console errors captured. Screenshot uses synthetic in-memory state, NOT physical hardware evidence. Highest-tier multi-section behavior checked automatically, not manually played to high tiers on a StickS3.

## Owner test / limitations

Flash without erase, reconnect/reload http://PocketQuest/play. Set out; compare encounter pacing and difficulty, fight until section4 to see tier2, head home and set out again. For the one-tier warm-up, reach at least tier3 (section7) and then rest: next outing starts tier2; repeat rest must not lower it again. Reload in a battle and on the road/return path; confirm same encounter/battle and XP. Confirm Mini splash, Wi-Fi/QR/buttons, standalone combat and restart persistence. Physical phone/controller/audio/layout regression and real LittleFS power-cut behavior remain owner hardware checks.

The downloadable offline review is isolated and resets on reload; it does not sync XP or saves to a real device. Existing synthesized music, protagonist layers and touch/controller/keyboard mappings remain; fullscreen is NOT in this build. No new boss designs, chests, item inventories/currency, production scenery library, autonomous settlements or broader PocketQuest Adventures systems.

Rebuild: `python3 tools/build-route-page.py`; `pio run -d firmware`; `sh tools/test-host.sh`; `node --test web/tests/*.test.mjs`; `python3 tools/test-route-package.py`; `python3 tools/prepare-delivery.py --version 0.1.22 --feature Woodland-Journey --boot-app0 /absolute/path/to/pinned/boot_app0.bin`. Stop for owner review of the foundation before chest/fullscreen bundles.
