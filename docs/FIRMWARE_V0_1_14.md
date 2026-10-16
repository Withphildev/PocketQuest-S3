# v0.1.14 — device-authoritative shared hero

2026-10-14. Owner approved connecting the browser adventure to the real StickS3 hero. This build shares XP/level and persists ordered route progress, browser HP/focus/potions, enemies, round, result and command receipt. The device owns battle resolution, not the browser. Sites skill used in local-only mode for client integration/QA; no hosting, new artwork, device access/flashing, GitHub push, Release or repository split. Source remains c0a7c6b plus local development changes.

## Install and use

PocketQuest-S3-v0.1.14-Shared-Hero.factory.bin: **flash address 0x0000, NO full erase**. Routine update for existing initialized layout; partitions unchanged and no filesystem images included. Join the same chip-derived hotspot, open http://PocketQuest and choose Play woodland adventure (/play). Reload old game tabs: an already open v0.1.13 page remains a local demo until replaced.

**SAVE MIGRATION / NO DOWNGRADE:** old format-1/2 saves retain hero seed, XP, level, victories, handheld HP and enemy state; new unplayed browser route initializes with full browser HP for the current level. The first new checkpoint writes format 3, 84 bytes, versus previous 60. After that, do not downgrade to v0.1.13 or earlier. Older versions lock writes on this unsupported format. No automatic erase/format, backward migration or save-reset shortcut.

1. Finish any active handheld battle before starting browser play; the browser shows a message and locks actions while it is active.
2. Browser loads actual device XP/level and saved route. Every accepted command is written/read back before success is published. Victory XP affects the same hero shown on the dashboard and handheld.
3. Browser and handheld combat have **separate HP pools**, explicitly labeled. Browser HP uses the prior 40+4*(level-1) curve; handheld stays 30+4*(level-1). XP, level and total victory count are shared. Browser victories do not alter handheld HP or award a second handheld reward. Focus/potions remain browser-combat resources.
4. During an active browser battle handheld attacks/ticks/tuning are paused, including after reboot. Navigation still works. Hold the physical Face button to abandon the browser fight and rest via a persisted Camp command. This awards no XP and opens no gate. Once idle, standalone combat works again.
5. Reload/reconnect restores the saved battle/result and cleared nodes without awarding again. Current walking position returns to the start; cleared gates remain open. Appearance selection is visual only and not persisted. Route is finite (84 browser XP total); no replay farming of cleared nodes or expanded quest/inventory systems.

Touch/keyboard/browser PS5 mappings, music and mandatory encounter gates remain. Physical gamepad/audio/phone tests are still required for this build; owner's earlier v0.1.12 success is not generalized. Plain-HTTP gamepad restrictions and synchronous initial page-transfer latency remain possible on other setups.

## Device protocol / authority

- GET /api/route returns schema 1, stable seed-derived heroId, per-boot random 128-bit token, revision/sequence as decimal strings, writable/durable/error indicators, actual shared XP/level, separate HP values and saved route/battle state. Reads don't write flash.
- POST /api/route/command accepts exactly base, action and target form fields. No client XP/HP/damage/level/cleared-mask save payload. Commands: start, attack, skill, guard, item, run, continue, camp. The device enforces route order, phase/target/resource bounds, damage, enemy responses, boss telegraph rounds and rewards (12/24/12/36).
- Each command carries exact expected global revision. A competing/stale client gets 409 plus latest authoritative state. Valid retry of the last base/action/target returns success without another write/reward; older commands are stale, not reapplied. Multiple tabs may observe/control the same hero, but stale turns cannot both apply. This is not an exclusive per-client lease.
- Candidate copies are saved/read back before Game publication. Reward, cleared bit and dedup receipt are in the same CRC snapshot. If write/readback is uncertain, no success is claimed; all further writes and physical combat freeze until reboot loads the newest valid snapshot. Browser locks on disconnect and obtains fresh authority before allowing another action; it does not blindly resend or synthesize XP.
- Accepted writes are rate-limited to 350ms; client spaces sends by at least 400ms. Button holds cannot become repeated commands. GET polling is 1.5s; command/read requests are serialized and time out after 8s. Every browser action writes a small snapshot: physical flash wear/latency under sustained play remains a hardware endurance consideration, not a measured guarantee.
- Only HTTP_POST on the explicit command route mutates state. Requires exact trusted Host/Origin (PocketQuest or 192.168.4.1, optional :80), per-boot X-PQ-Token, form MIME and strict bounded fields. Missing/null/foreign Origin, old token, duplicate/unknown fields or extra reward values are rejected. No permissive CORS, cloud or external asset traffic; /play CSP now permits connect-src self for these endpoints.
- Origin/custom-header defenses follow the [OWASP CSRF guidance](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html). These are browser CSRF/conflict safeguards, **not strong user authentication**: hotspot credentials are predictable, HTTP isn't application-encrypted, and any trusted client on that network can read the token and play valid turns. Not a public/Internet service or an anti-cheat platform. Device controls route order/battles, not walking coordinates; movement presentation remains client-side.

## Saves and compatibility

Core rules remain 4; save schema advances to 3. Offsets 0–55 retain the handheld record. Bytes 56–79 add browser phase/mask/encounter/resources/target/HP/enemy HP/round and last command base/type/target; CRC is at 80–83. See SAVE_FORMAT.md. Formats 1/2 accept only their existing 60-byte shapes and migrate deterministically. Unknown future formats lock the store. Both alternating snapshot slots remain in the same saves partition.

Handheld milestones retain existing checkpoint cadence; pending handheld changes can still be lost before SAVED. A browser transaction may atomically checkpoint those pending shared hero changes along with its own turn. The response distinguishes durable snapshot from current uncheckpointed handheld values. A duplicate receipt does not mislabel newer pending handheld changes as saved.

## Verification completed

- Final PlatformIO ESP32-S3 build PASS; static RAM 52,768 bytes (16.1%), not runtime heap/PSRAM measurement.
- 3,236 sanitized core assertions PASS. Shared-hero cases cover ordered start/target/resources/boss, handheld XP continuing into route, group completion, mixed old/new wire shapes, saved victories, duplicate final action before/after reboot, stale/different action conflict, every 0–83 byte torn final-reward write, fail-closed retry, complete write with failed readback and receipt recovery without a second award.
- 55 browser tests PASS (previous scenery/navigation/route/input/music regressions plus six device-client tests). Client tests cover real-state load, exact uint64 strings/command whitelist, lost final response and GET recovery without blind resend, stale conflict adoption, saved wounded group, missing storage and malformed responses.
- C++ protocol tests PASS: uint64 overflow/sign/leading-zero rejection, exact trusted origins and command names. Hero JSON/dashboard tests and DNS/source contracts PASS.
- Gzip/header/hash/99 embedded assets/import graph/CSP/protected route wiring and exact final gzip bytes in actual compiled app PASS. Compiled partitions, unchanged build ceiling, merged segments/offsets/padding/save boundary/copy SHA checks PASS. Whitespace checks PASS.
- Actual browser served the embedded page with matching CSP, using a loopback server backed by the actual C++ Game/SaveStore/RouteTransaction engine and synthetic RAM slots. Verified wounded slime (3HP), browser HP37 and round2 survive page reload; a victory adds exactly12 XP. Final seeded check: one actual-engine synthetic handheld win gave12XP, browser loaded12, browser victory gave24XP/level2, reload retained24 without duplicate reward. No /play console errors observed.
- Screenshot PocketQuest-v0.1.14-Shared-Hero-Mock.jpg is **synthetic C++ authority/save evidence, not physical StickS3 telemetry**. Browser navigation to the mock reboot control was blocked; no workaround attempted. Reboot and power-loss semantics were verified in host C++ tests, not claimed as a browser-controlled or physical reboot test.

Not yet verified: real Wi-Fi POST/Origin handling across phone browsers, actual flash latency/endurance/power-loss metadata behavior, device restart persistence/physical abort, simultaneous clients on hardware, runtime heap/PSRAM, real controller/music or responsiveness during page loading. These remain owner hardware checks.

## Storage / delivery

Factory SHA-256: 3a8a694123388688628c6a23c53d765e6c5e85833054412a5f0076a19781cff8.

| Measurement | Result |
| --- | --- |
| Application BIN | 2,674,880 bytes = 2.55 MiB |
| Application partition headroom | 2,436,928 bytes = 2.32 MiB |
| Actual browser gzip inside application | 1,087,316 bytes; raw HTML 1,547,182 |
| Hero dashboard inside application | 12,348 bytes |
| Modeled separate illustrated asset payload | 1,146,065 bytes, not additionally flashed |
| Modeled separate LittleFS allocation | 1,429,504 = 68.16%; 667,648 bytes free |
| Model including engineering fixtures | 1,507,328 = 71.88%; 589,824 free |
| Complete factory BIN including padding | 2,740,416 bytes = 2.61 MiB |

No 75% model warning. Actual browser assets remain PROGMEM, not a populated asset filesystem; don't count the model again as installed flash. No physical flash-space readback was performed. Segments remain bootloader 0x0, partitions 0x8000, boot_app0 0xE000, application 0x10000. Factory ends exclusively at 0x29D0C0, before saves 0x4F0000 and assets 0x5F0000. Prefix NVS padding may reset unrelated settings; chip-derived SSID/password remain repeatable. No filesystem initialization image or full-erase instruction included.

## Reproduce / owner tests

Build tools/build-route-page.py and tools/build-hero-page.py, pio run -d firmware; run sh tools/test-host.sh, node --test web/tests/*.test.mjs, tools/test-route-package.py and check-build.py. Package prepare-delivery.py --version 0.1.14 --feature Shared-Hero using the pinned framework boot_app0.bin. Host protocol/harness compile against the current Game.cpp/Save.cpp; preview-shared-hero.mjs serves loopback-only synthetic authority, never a physical device connector. Offline standalone review HTML remains explicitly a local demo and is not the device-connected /play mode.

1. Routine flash at 0x0000, no erase. Confirm old hero XP/level restored before playing. Do not downgrade afterward.
2. Finish a handheld battle and wait for SAVED; open the adventure and compare shared XP/level. If a handheld fight is active, finish it first.
3. Attack once in browser; reload during battle. Confirm wounded enemy, round, HP/focus/potions restored. Win and compare dashboard/handheld XP after returning.
4. Reload victory screen repeatedly: no additional XP. Try two browser tabs sending commands: stale action must refresh, not duplicate rewards.
5. Restart StickS3 during a saved browser battle and after victory. Confirm state/XP/cleared gate restored. Browser battle should pause handheld combat; Hold Face must abandon/rest without reward and let handheld play resume.
6. Disconnect/reconnect phone Wi-Fi around a command. Actions must lock while disconnected, recover latest device state and never apply local fallback rewards. Report any 403/503/save error with dashboard/serial diagnostics; don't erase as a workaround.

Stop for owner review. No flashing performed by Codex.
