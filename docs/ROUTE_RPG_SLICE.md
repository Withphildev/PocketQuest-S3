# PocketQuestMini — illustrated route RPG, first review slice

Naming update, 2026-10-15: owner authorized PocketQuestMini and repository PocketQuestMini-S3, superseding the historical retain-name decision below. This document otherwise describes the original review slice; current device integration is documented in FIRMWARE_V0_1_14.md and later reports. Endless-road/random-loot systems are not implemented by the rebrand.

Owner decision: 2026-10-14. Retain PocketQuest-S3 and existing artwork; replace the immediate freely roaming Zelda-style gameplay target with horizontal elevated-three-quarter route exploration, visible encounters and separate turn-based battles. Not a platformer, art-perspective replacement, repository split or rename. A larger PocketQuest Adventures concept remains deferred. No production scenery or broad Phase 2B systems implemented.

## Play the slice

Open outputs/PocketQuest-Woodland-Route-Review.html in the browser. It is a self-contained offline HTML with embedded assets/modules; no server, Internet, dependency installation or device connection is required. This is a **design-review demo**, not a firmware update. Source template web/route/index.html requires the build step; use the generated HTML, not the template directly.

Arrow keys/WASD or touch arrows move Nova. Approach a visible enemy, then press Engage (or Space with the canvas focused). Exploration uses the existing Renderer, movePlayer, collision metadata, asset loading and unchanged validator. Both Sunlit blocks remain 512x288 / 512x512 logical, with the original 36px E–W opening, shared templates and tree anchors. Route bounds reject movement outside this two-block strip; the camera follows horizontally. Debug overlays stay off. The older calibration prototype/generator are preserved separately.

Four visible encounters: lone slime, wolf pair, goblin patrol, goblin captain. Normal encounters can be bypassed while walking, but all three must be cleared to unlock the captain. No new branch artwork or full illustrated Oakwood village. Oakwood is currently a return/rest action. Rest restores HP/focus/two potions and keeps demo XP/cleared nodes. Cleared encounters cannot be farmed again in the same session; reload intentionally starts a fresh demo.

## Provisional browser battle rules

Both Novas share rules/progression. Level starts at 1, HP 40, focus 3, potions 2. Level thresholds use the existing 10*L*(L+1) curve; max HP is 40+4*(level-1). Browser HP/damage/rewards are design-test values, not the firmware rules or a new save format.

| Enemy | HP | Damage each response |
| --- | ---: | ---: |
| Slime | 16 | 3 |
| Dire wolf | 24 | 4 |
| Goblin | 32 | 6 |
| Captain placeholder | 64 | 8; 16 on every third response |

Attack deals 11+2*level to the selected enemy. Power Strike deals 22+2*level and costs 1 focus. Guard halves incoming damage (rounded up) and restores 1 focus, capped at 3. Potion heals up to 18 HP, consumes one potion and uses a turn. Each surviving enemy responds once per valid player action. Invalid/unavailable actions do not advance turns. Run always escapes ordinary encounters without reward; unavailable against the captain. Return/rest remains a deliberate prototype escape/reset action even in battle, without awarding XP or clearing enemies.

Rewards: slime 12, wolf pair 24, patrol 12, captain 36 demo XP. Victory rewards resolve once, before dismissing results. Defeat returns to Oakwood; retry starts a fresh encounter. Every third captain response is a heavy strike, visibly warned before the player chooses their action. Level-up restores HP. No random drops, money, inventory/equipment system, quests or party combat.

Female sword artwork is used for a short player attack cue. Male battle uses his existing east-facing pose, not female animation. Enemy idle/defeated display is rudimentary; full staged enemy attacks, damage/hurt animation and polished transitions remain future work. Captain uses enlarged goblin art, not a newly authored boss. The same two ground blocks serve exploration and battle without artwork distortion. No new art generated or existing art permanently altered.

## Save/authority boundary — intentionally NOT connected

Prominent banner: demo progress only; not connected to StickS3. Progress is in memory only, with no localStorage/IndexedDB, API requests, device credentials or writes. Reload starts at zero demo XP. Existing firmware v0.1.11 and its read-only /api/hero dashboard are unchanged. Nothing in this prototype transfers XP to/from the real hero. Selection is a demo visual choice, not a persisted firmware character-selection feature.

Before integrating browser play, the device must own the battle session and resolve commands, never accept client-reported XP, damage, victories or arbitrary save blobs. Proposed next gate:

1. Versioned device-owned battle session, hero/revision identity, turn number and bounded action/target inputs.
2. Reject stale turns, replayed commands and competing clients; define deterministic retry/response behavior and physical-button interaction. No simultaneous independent reward writers.
3. Device resolves victory once, persists the state, and reports durable vs pending rewards distinctly. Power-loss and retried-final-action tests must prove no duplicate awards.
4. Add deliberate cross-origin/access controls for write endpoints; MAC-derived hotspot passwords are predictable, not strong authorization. Do not turn the read-only dashboard into an arbitrary save editor.
5. Versioned migration for any newly persisted battle/world state; preserve current saves and retain owner manual-flash workflow. Add browser-device integration tests before claiming synchronization.

This is an architecture requirement, not an implemented transport or security claim. No physical device test is claimed.

## Build and verification

No dependencies needed beyond existing Node (>=20). From project root:

```sh
node web/tools/build-route.mjs
node --test web/tests/*.test.mjs
sh tools/test-host.sh
```

Default build: web/dist/PocketQuest-Woodland-Route-Review.html. Optional first argument sets output path. Required existing prepared assets: web/build/validated-ground, nova-female-v2, nova-sword, slime-blue, dire-wolf and goblin. The self-contained HTML can be opened directly. Optional local QA server: PORT=4191 node web/tools/serve.mjs, then /dist/PocketQuest-Woodland-Route-Review.html. It serves only loopback; no Sites registration/hosting/cloud publication.

Sites skill used in local-only mode for the implementation/preview workflow. No new image-generation skill needed; reused existing art. Build artifact contains 99 embedded assets and is 1,520,422 bytes; not a factory BIN or deployable filesystem image.

Verification completed:

- 37 browser tests PASS (30 preserved renderer/scenery tests plus 7 new route tests).
- New tests cover valid spawn/encounter positions, collision bounds, continuous 850-unit center-seam traversal, single rewards, no cleared-node replay, group targeting, enemy responses, focus/guard/potions, escape/defeat/rest, boss gate/telegraph, full demo progression and no device/browser-storage writes.
- Existing sanitized core regressions: 2,000 assertions PASS. Firmware source unchanged; no new firmware compilation or flashing required.
- Browser UI at 526px width: walking, single battle, selecting wolf #2, group victory/level-up, male selection and movement across seam, male goblin battle, captain gate/round warning/Guard, and full route completion verified. Result: four nodes cleared, level 3, 84 demo XP. Screenshot PocketQuest-Route-Completion.jpg is browser-demo evidence, not hardware telemetry.
- Width check: content width 526 equals viewport 526; no horizontal overflow. Narrow-screen camera issue discovered and corrected using a shared 768-unit scene-to-viewport scale. Desktop breakpoints and physical phone touch gameplay not manually verified.
- Browser UI verification used the loopback HTTP preview. Direct file-URL automation is blocked by the browser tool's protocol policy, so direct-file opening remains an owner check; no policy workaround was attempted. The artifact embeds all runtime modules/art and has no external asset dependency.
- JavaScript syntax and git diff whitespace checks PASS. Existing scenery validator was not relaxed and validates loaded assets before play.

## Storage — four separate measurements

| Measurement | Result |
| --- | --- |
| Application BIN | Last measured v0.1.11: 1,573,056 bytes; unchanged, no new build |
| Modeled illustrated asset payload including route code | 1,137,910 bytes |
| Modeled LittleFS allocation | 1,413,120 / 2,097,152 = 67.38%; 684,032 free |
| Complete factory BIN | Existing v0.1.11: 1,638,592 bytes including padding; unchanged |

Including legacy engineering fixtures: 1,490,944 bytes = 71.09%, 606,208 free. Both stay below the 75% review trigger. The route source adds 19,014 raw / 8,142 gzip bytes; no duplicate scenery/enemy PNGs added to the modeled inventory. Model retains the older calibration app as well as the new route prototype. Command: web/tools/asset-storage-budget.py output.json --female-v2 --sword --slime --wolf --goblin --route. Readback PASS.

These are host filesystem models, not on-device free-space readings. The model assumes compact JSON/gzip text and deployable module/asset-path adaptation; the current route demo expects embedded assets. Filesystem packaging/server integration remains unimplemented. Do not copy the large self-contained review HTML into assets and assume the same modeled allocation. Firmware already embeds LCD art/dashboard in its application partition; do not double-count them as browser filesystem allocation.

## Owner review / next step

Review route movement, character scale, regular encounter strategy, group targeting and the captain warning before expanding. Confirm whether the rest/potion cadence and combat pace are fun. Then implement the device-owned battle/action protocol as a separate tested milestone. Oakwood village art, real route branches, quests, production boss art and a larger world remain deferred. No GitHub push or release performed for this slice.
