# PocketQuest — Phase 0 architecture and implementation plan

Review draft, 11 October 2026. Based on the complete PocketQuest Master v0.1 document, the three reference repositories, and manufacturer documentation. This is an architecture recommendation, not authorization to implement the game. The approved game vision is preserved. Proposed dimensions, limits, and time policies below need design review and prototype validation.

## 1. Findings and decision

PocketQuest is technically plausible on StickS3 if Chrome renders the large world and the device owns progression, world changes, settlement calculations, and durable saves. The world can grow through generation, but the number of permanent changes cannot grow without limit.

Three conclusions matter before producing artwork:

- The documented hardware has 8 MiB flash, not 8 MiB available exclusively for artwork. Existing projects already partition this space. An approximately 2 MiB scenery budget is a reasonable initial ceiling, not a proven scene count.
- Large scenery blocks can connect reliably only when they share exact boundary geometry and pixel templates. An image prompt alone cannot enforce this. Collision, foreground occlusion, and settlement footprints must be authored separately.
- The ESP32 RTC does not retain time across a power-on reset. StickS3 has a separate M5PM1 timer that may support elapsed time while the main processor is off and the battery remains connected. Its useful readback and retention behavior must be tested. After complete loss of power, elapsed time requires an external time source; firmware cannot reconstruct it from a saved timestamp alone.

Phase 0 research is complete. Physical-device verification, firmware sizing, timer qualification, and artistic seam acceptance remain explicit gates in the next authorized work. No PocketQuest firmware or browser game has been implemented or flashed.

## 2. Verified hardware and limits of verification

Manufacturer specifications describe the following target; these are documentation-verified, not measurements of the owner's individual unit.

| Item | Specification | Consequence |
| --- | --- | --- |
| Product | M5Stack StickS3, SKU K150 | Do not substitute StickC/Plus hardware assumptions |
| SoC | ESP32-S3-PICO-1-N8R8, dual-core Xtensa LX7, up to 240 MHz | Arduino/ESP-IDF support |
| Flash | 8 MiB = 8,388,608 bytes | Shared by boot code, firmware, assets, saves, and reserved space |
| External RAM | 8 MiB Octal PSRAM | Volatile; not additional save capacity |
| Internal SRAM | 512 KiB, plus 16 KiB RTC SRAM | Total silicon capacity, not available heap |
| LCD | ST7789P3, 135 × 240 | 240 × 135 landscape; full RGB565 buffer is 64,800 bytes |
| IMU | BMI270, accelerometer and gyroscope | Motion attack input, with calibration and cooldown |
| Game buttons | GPIO11 and GPIO12 | Separate from power/reset button behavior |
| Wireless | 2.4 GHz Wi-Fi; Bluetooth LE supported by SoC | Local access point; controllers can pair to the phone |
| Power | M5PM1; 250 mAh battery | Qualification must distinguish sleep from main-processor shutdown |
| Audio | ES8311 codec, microphone, speaker amplifier | Short generated tones initially; microphone need not run |

Hardware sources: [M5Stack StickS3](https://docs.m5stack.com/en/core/StickS3), [Espressif PICO-1 datasheet](https://documentation.espressif.com/esp32-s3-pico-1_datasheet_en.pdf). M5Stack documents Arduino, ESP-IDF, and PlatformIO development.

No identifiable StickS3 USB serial port was present during this review. Therefore the actual installed partition table, flash ID, usable heap, PSRAM initialization, and individual hardware revision are unmeasured. A source partition CSV is not proof of the partition table currently flashed on a device.

Next hardware report must capture: chip model/revision, detected physical flash capacity, image flash configuration, enumerated partitions with offsets and sizes, PSRAM total/free/largest allocation, internal heap total/free/largest allocation, display dimensions, IMU availability, M5PM1 revision, reset reason, and RTC availability. Obtain flash ID and partition readback without erasing or updating the owner's existing firmware. Diagnostic firmware installation is a separately reviewed next-phase step, after backup.

## 3. Framework and reuse

Recommend PlatformIO + Arduino C++ + M5Unified/M5GFX, with a small platform-independent C++ domain library. Begin from the established StickS3 configuration, not by forking a complete application. The three repositories use pioarduino platform `55.03.39`, the ESP32-S3 devkit board definition, 8 MiB flash, QIO flash, OPI PSRAM, and M5Unified. Pin the actual M5 library versions during the first reproducible build; the reference manifests currently leave M5Unified unpinned.

Current upstream library inspection confirms BMI270 support and StickS3-specific IMU axis transformations. It also shows RTC detection rather than a guaranteed calendar clock on every device. These current upstream details may differ from the versions used in previous builds. Do not copy PocketPal's extra axis rotation without verifying the pinned library and physical landscape orientation. Sources: [IMU driver](https://github.com/m5stack/M5Unified/blob/master/src/utility/IMU_Class.inl), [RTC driver](https://github.com/m5stack/M5Unified/blob/master/src/utility/RTC_Class.inl).

Reuse selectively:

| Reference | Useful patterns | Adaptation for PocketQuest |
| --- | --- | --- |
| PocketLab | AP/DNS portal, QR, battery filtering, display dimming, power profiles, filesystem reserve | Separate power/portal modules; do not bring scanning/BLE tooling into game |
| PocketPal | Domain engine, NVS settings, calibrated motion, physical controls, shared API state, event redraws, device/browser artwork exports | Combat-specific gesture detector; rate-controlled saves; game state independent of artwork |
| PocketBoy | Local Chrome runtime, input handling, export/import, separate save filesystem, temporary-write replacement | Device-authoritative game commands; browser is not the primary save location |

All three derive Wi-Fi credentials from device identity. PocketQuest should instead generate independent random credentials and a random world seed, then persist them. Generate with a documented entropy source enabled; do not assume every invocation of the ESP32 RNG has equal entropy. [Espressif RNG guidance](https://docs.espressif.com/projects/esp-idf/en/stable/esp32s3/api-reference/system/random.html). Recommend a 16-character password from a 32-character unambiguous alphabet, distinct random draws for password, world seed, and world identity. Retrieve/reset credentials through a physical device menu without resetting the world.

Reference snapshots reviewed:

- [PocketLab](https://github.com/Withphildev/PocketLab-StickS3/tree/c42ed1e934a5913a3dc954282de98b9aaa039fb9): v0.16.0.
- [PocketPal](https://github.com/Withphildev/PocketPal-S3/tree/700a80900ca9db1f241d68dbbf446b608c9d0428): v0.8.1.
- [PocketBoy](https://github.com/Withphildev/PocketBoy-S3/tree/612540a751b0df7c42d26db8c9b58d5152056214): v1.0.0.

## 4. Flash partition and storage proposal

Both PocketLab and PocketPal reserve a 0x4E0000 application partition and a 3 MiB filesystem. PocketBoy splits the filesystem space into 1 MiB saves and 2 MiB games. All end at 0x800000 and reserve 64 KiB for coredumps. These are project layouts, not an immutable factory layout. [PocketBoy partition source](https://github.com/Withphildev/PocketBoy-S3/blob/612540a751b0df7c42d26db8c9b58d5152056214/partitions.csv).

Recommend keeping PocketBoy's boundaries initially, repurposing its game partition as packaged scenery. This is a new PocketQuest installation; it does not imply preserving another game's files or importing its save format.

| Region | Offset | Allocated bytes | KiB |
| --- | --- | ---: | ---: |
| Bootloader/table/NVS/alignment region | 0x000000–0x010000 | 65,536 | 64 |
| Factory application | 0x010000 | 5,111,808 | 4,992 |
| Saves, LittleFS | 0x4F0000 | 1,048,576 | 1,024 |
| Assets, LittleFS | 0x5F0000 | 2,097,152 | 2,048 |
| Coredump | 0x7F0000 | 65,536 | 64 |
| Total physical address space | Ends 0x800000 | 8,388,608 | 8,192 |

Within the first 64 KiB, NVS uses offset 0x9000, size 0x6000, as in the references. The build defines the exact bootloader, partition-table, and alignment usage. LittleFS commonly uses a `data,spiffs` partition subtype despite being mounted as LittleFS. Explicitly mount by partition label. [Espressif partition guidance](https://docs.espressif.com/projects/esp-idf/en/stable/esp32s3/api-guides/partition-tables.html).

This proposal has one application slot and no OTA rollback. Recommend USB updates initially. A dual-slot OTA design would compete with the art budget and needs a separate decision before layout is frozen.

Provisional occupied-byte budget, not compiled measurements:

| Contents | Ceiling |
| --- | ---: |
| Firmware, libraries, standalone graphics, generated audio | 2,816 KiB |
| Compressed browser code/UI/rules/manifests embedded in application | 256 KiB |
| Scenery terrain | 1,280 KiB |
| Foreground objects, buildings, browser sprites | 448 KiB |
| Navigation/anchors/asset metadata | 64 KiB |
| Asset filesystem safety/overhead allowance | 256 KiB |
| Save filesystem, including recovery copies/journal/free reserve | 1,024 KiB |
| Boot region and coredump allocation | 128 KiB |
| Total budget including allowances | 6,272 KiB = 6,422,528 bytes |

The application budget is 3,072 KiB inside a 4,992 KiB slot, leaving 1,920 KiB application headroom. Filesystem overhead allowances are provisional: filesystem free-space measurement remains mandatory. Release images should populate assets without overwriting the save region; use explicit update segments rather than a whole-chip padded image that writes across it.

The specification says “under 8 MB.” If this means decimal 8,000,000 bytes, an 8 MiB chip is larger than that number, but occupied content can still stay below it. Recommend reporting both bytes and MiB, enforcing occupied-budget <8,000,000 bytes as well as the physical 0x800000 address boundary. Reserved free capacity is not installed content. A combined download's length/padding is a third metric and must be reported separately.

Do not promise a scene count. With 1,280 KiB for terrain, hypothetical mean sizes of 32/48/64 KiB imply 40/26/20 base images before per-image exceptions. These are arithmetic scenarios, not compression measurements. Foregrounds consume their own budget. Measure a clearing, dense forest, water scene, and building scene at the chosen dimensions before expanding the library.

Start with lossless PNG source masters. Compare PNG and lossless WebP exports for crisp pixel art; test lossy WebP/JPEG only for backgrounds if their seams and detail survive. Stream compressed files from flash to Chrome; do not decode the large world images on StickS3. Use short synthesized audio initially to avoid committing storage to music tracks.

## 5. Runtime architecture and communication

StickS3 owns `GameState`, `WorldGenerator`, `Combat`, `SettlementSimulation`, `TimeService`, and `SaveStore`. Rendering modules consume snapshots and never mutate state directly. Browser owns Canvas drawing, camera, animation, local movement prediction, input, and presentation. Firmware validates commands against the canonical rules and collision metadata. A browser cannot award itself XP, resources, or completed construction by uploading arbitrary state.

Use static offline HTML/CSS/JavaScript modules and Canvas 2D; TypeScript with a small build step is optional. No full engine is justified yet. Chrome loads nearby blocks and prefetches approaching boundaries, using a bounded decoded-image cache and integer-aligned drawing. Request the full Chrome browser rather than relying on a captive-portal mini-browser. No cloud or service worker is required for operation.

Recommend HTTP JSON first, using the existing synchronous server pattern with bounded handlers. Motion combat happens on the device, so it need not wait for HTTP latency. Begin browser state polling at 2 Hz and predicted movement command batches at 5 Hz; measure before increasing. Pause polling when hidden. Serve state with `no-store` and assets by version/content hash. WebSocket is a later measured latency optimization, not a prerequisite.

Suggested API:

| Route | Role |
| --- | --- |
| GET /api/v1/hello | Protocol, world, generator, rules, asset versions; connection/save status |
| POST /api/v1/session | Acquire or reconnect to one browser gameplay lease |
| GET /api/v1/state?afterRevision=… | Compact state changes or bounded snapshot |
| GET /api/v1/chunks?… | Bounded chunk IDs, connectors, relevant deltas and anchors |
| POST /api/v1/commands | Movement, interaction, priority selection; validated by device |
| POST /api/v1/time | Time candidate, not direct world-time assignment |
| GET /api/v1/save/export | Versioned consistent backup from device |
| POST /api/v1/save/import | Validate and stage restore before explicit replacement |

Every command includes world ID, session ID, command sequence, and expected state revision. Deduplicate retried commands; serialize device and browser mutations. Use a boot/session epoch to invalidate stale commands after reboot. One browser has gameplay control; additional browsers may observe. Standalone input still enters the same command queue, with scene/mode rules preventing simultaneous conflicting encounters. Expired commands are rejected with a fresh state, never silently applied twice.

Movement prediction is display-only until accepted. Disconnect stops new persistent browser actions and shows last acknowledged position/save status. Reconnect discards unacknowledged prediction and reads the device's current revision. Do not replay offline gathering purchases or battles automatically. API response distinguishes accepted RAM state from durable save sequence; browser never claims “saved” before durability acknowledgement.

Use bounded messages, origin/host checks, and a physically established local session. Avoid unnecessary binary wire protocols early. Static asset transfers must yield enough for IMU sampling and combat; profile server stalls and use a dedicated network task/implementation only if measured blocking requires it.

## 6. Deterministic procedural world

Use signed integer chunk coordinates, a persisted random seed, generator version, rules version, and numeric asset/block IDs. The device is canonical. Browser requests chunk descriptions initially; duplicating generation in JavaScript is optional later and requires cross-language golden tests.

Each shared edge has one identity independent of traversal:

- Horizontal boundary `(x,y)`: chunk `(x,y)` north and `(x,y-1)` south use the same descriptor.
- Vertical boundary `(x,y)`: chunk `(x,y)` west and `(x-1,y)` east use the same descriptor.
- Corner `(x,y)` is shared by the four incident chunks.

Hash canonical coordinates, seed, version, and a domain tag using explicitly defined integer arithmetic. No global sequential RNG, floating noise differences, or neighbor-placement history. Handle negative coordinates with mathematical floor division. Separate terrain, events, and visual variation RNG streams.

For the initial forest, use a guaranteed connected road skeleton: N/S roads in chunk columns divisible by eight, E/W roads in rows divisible by eight. This creates crossroads at intersections and deterministic continuous routes. Interiors can vary independently. This is an engineering test topology, not a proposed final world aesthetic. Add natural branch networks through deterministic macroregion planning with shared border descriptors later. Use finite bounded regions and a guaranteed fallback; avoid unbounded WFC/backtracking during gameplay.

A library of four arbitrary blocks does not cover all possible four-edge road signatures. The scenery standard therefore uses four artistic families plus validated road configurations. Never select a block whose metadata claims an exit absent from its image. Local ponds have no river edge; flowing rivers, cliffs, biome changes, and elevation need new compatible edge families before being enabled.

Persist only changes, discoveries, settlements, quests, and important event outcomes. Limit discovered records and modifications; a compact discovery bitset still grows with explored area. Initial envelope: 32 settlements, 512 buildings, 64 caravans, 128 quest records, and 2,048 compact permanent-delta records, subject to serialized-size tests. Do not evict quest-critical or player-created records silently. Warn and prevent unsupported new persistent edits when limits are reached; exploration can continue with regenerated terrain.

Pin generator and rules versions for existing worlds. Never reinterpret old block IDs or silently regenerate an established village differently. Retain the old generator/asset contract or perform an explicit tested migration; maintaining versions also consumes flash budget.

## 7. Scenery architecture

The separate `PocketQuest Scenery Standard.md` defines exact proposed dimensions, connectors, navigation, anchors, and acceptance criteria. Key recommendation: 512 × 512 world-unit footprint projected onto a 512 × 288 pixel ground image, with separate transparent objects sorted by their ground anchor. This gives approximately a 34.2° elevated view without a vanishing point or strict isometric grid.

The perspective remains elevated three-quarter. Modular ground geometry needs a parallel projection; converging perspective inside separate blocks creates scale mismatch. Fronts, sides, height, and depth are supplied by consistently drawn objects. Review a reference scene to confirm this technical interpretation matches the approved visual appearance.

Collision grid is 32 × 32 cells per block, each 16 world units. A two-bit surface mask costs 256 bytes; image pixels never determine collision. Buildings and trees have footprints, interaction zones, and foreground layers. A flattened full image cannot correctly place a player both in front of and behind a tree trunk. Authored layers are essential.

At RGBA decode sizes, a 512 × 288 ground image is 589,824 bytes. Nine ground images alone are approximately 5.06 MiB in Chrome; foreground images, backing canvases, and GPU copies add more. Those allocations are on the phone, not the device's PSRAM. A 3 × 3 neighborhood is a starting point, not always enough: compute visible and prefetched chunks from viewport/zoom and tall-object overhang. Start with a 24 MiB estimated decoded-asset cache budget and measure actual memory on the target Android devices.

## 8. Elapsed time without Internet

Separate monotonic game time from UTC labels. Store integer `simulationSeconds`; caravans and construction use that timeline. Wall-clock adjustments must not move simulation time backward.

[Espressif system-time documentation](https://docs.espressif.com/projects/esp-idf/en/stable/esp32s3/api-reference/system/system_time.html) states that the RTC timer can survive sleep and some resets but resets on power-on. Its internal sleep clock can drift. Therefore active runtime, ESP32 deep sleep with its supply retained, M5PM1 shutdown, and battery depletion are distinct cases.

The [M5PM1 power guide](https://docs.m5stack.com/en/arduino/m5sticks3/m5pm1) documents a timer and an L0 mode where only M5PM1 remains powered from the battery. The [M5PM1 header](https://github.com/m5stack/M5PM1/blob/main/src/M5PM1.h) exposes timer registers and retained RAM. The [implementation](https://github.com/m5stack/M5PM1/blob/main/src/M5PM1.cpp) supplies timerSet/timerClear but no public timerGet method. Header versus implementation comments differ on one timer control bit's meaning. These facts support investigating elapsed countdown readback, not declaring a proven clock.

Recommended source hierarchy:

| Situation | Source and behavior |
| --- | --- |
| Main processor running | Monotonic device timer advances game time |
| ESP32 deep sleep, retained power | Retained RTC elapsed value, only with valid retention marker and wake/reset checks |
| Main processor off, M5PM1 still powered | Prefer qualified M5PM1 countdown delta if tests pass; no periodic power-on required |
| Timer unavailable/reset or complete power loss | Browser UTC candidate on next connection, with consistency checks and bounded credit |
| No valid elapsed source and no browser | Continue standalone play; do not fabricate off-time; allow later reconciliation |

M5PM1 qualification must test whether reads return a live remaining count rather than configured reload value, whether countdown survives power-button shutdown and software shutdown, whether initialization rewrites it, read coherency near a second rollover, retention RAM/reset indicators, behavior at expiry, actual drift, and behavior after battery depletion. Use a flag-only timer action; do not unexpectedly wake the device. Test short durations first, then one hour and overnight against an independent clock. Confirm valid range from the shipped firmware instead of trusting conflicting bit-width/range comments. If a library adapter reads timer registers directly, verify its behavior on that hardware revision before release.

Time accounting proposal:

1. Persist a paired checkpoint of game time, external source baseline, source epoch/validity, and credited elapsed amount. Store any retained-power marker with checksum; a marker is evidence only while its backing power domain remains valid.
2. Advance known active/retained elapsed time exactly once. If off-time is unknown, keep an unresolved gap and accumulate known runtime after the gap.
3. On valid browser time, compare UTC seconds with the checkpoint. Subtract runtime and sleep already credited. Apply only the residual missing interval. First-ever browser time establishes an anchor and grants no invented past progress.
4. Reject backward or implausibly changed clocks for automatic credit; show “time could not be verified” and establish a new baseline without rollback. Timezone and daylight-saving changes do not affect UTC epoch seconds.
5. Propose a seven-day maximum per unresolved offline interval. After applying capped credit, advance the external baseline to the observed endpoint and close that interval, so refresh/reconnect cannot repeatedly harvest the discarded excess. This cap is a balancing proposal requiring approval, not an established design rule.
6. Persist new time baseline and settlement state together before acknowledging catch-up. Crash recovery restores the paired transaction; repeated synchronization does not grant time twice.

Phone time works without the phone currently having Internet but is not authenticated. Multiple phones, changed phone clocks, timer drift, and sudden battery loss need regression cases. Local single-player safeguards can reduce accidental exploits, not eliminate deliberate clock/save editing. Fully trustworthy real time after total power loss requires an independent backed clock or trusted external source. A hardware RTC accessory would be an optional scope change, not a hidden requirement. Calendar day/night can use game time regardless of UTC availability.

## 9. Settlement simulation

Use compact aggregate records, not continuous NPC AI: profession counts, stocks, local reserve targets, active construction, housing, population, priority, and event flags. Browser NPC routines are visual effects derived from state.

Use deterministic integer/fixed-point arithmetic with fractional production remainders. Advance by intervals between meaningful changes: food depletion, storage saturation, construction completion, population eligibility, caravan departure/arrival, and scheduled event checks. Calculate linear production over each interval; update rates when an event changes them. Do not multiply a week's initial production rate across a week of building upgrades.

Initial event checks use stable game-time slots and hash of seed/settlement/slot, not number of browser reconnects. Bound work per main-loop slice; long catch-up runs in a staged state and commits coherently. Preserve chronological ordering of transfers across settlements. Cargo is removed once on departure and deposited once on arrival, with unique caravan/event IDs.

Exportable stock is `max(0, stock - survivalReserve - committedConstruction - essentialRepairs)` without double-counting reservations. Building plans must satisfy an authored footprint and reachability test, even if materials are available. Offline event pressure should create assistance opportunities rather than automatically destroy settlements; final rates/consequences are game-design decisions.

Meaningful tests: long-step versus split-step equivalence, exact construction boundaries, food depletion, changing productivity, nonnegative stocks, reserve protection, single cargo delivery, and catch-up replay after an interrupted save. Performance gate is bounded latency at the proposed maximum settlement count on real hardware.

## 10. Durable saves and recovery

Use explicit binary serialization, fixed endianness, integer bounds, versioned sections, payload length, CRC32, and a monotonically increasing save sequence. Do not serialize raw C++ structs with compiler padding. Store world identity/seed, generator/rules versions, player state/location, deltas, settlement/building records, inventory, caravans, quests, and time checkpoints together.

Recommend two independently validated snapshot files on the 1 MiB save filesystem. Write the inactive slot, close/flush, reread and validate, then consider its greater sequence committed. At startup choose the highest fully valid compatible sequence; ignore corrupt/torn files. Preserve the previous slot until another valid checkpoint exists. Fail visibly if neither slot is valid; do not automatically format the save filesystem. In particular, do not copy PocketBoy's format-on-mount-failure option for authoritative PocketQuest saves.

Provisional maximum payload: 256 KiB per snapshot. Two copies consume 512 KiB. Reserve up to 128 KiB for a bounded command journal, 128 KiB migration/import staging, and 256 KiB filesystem overhead/free reserve. Check actual allocation and free space before starting any write. Stream a paused, consistent migration when an additional full snapshot cannot coexist; never erase the last usable version to make room. The allocation is a budget, not proof that every proposed state limit fits.

Checkpoint dirty runtime state about every 30 seconds and at safe mode changes/shutdown. Journal important acknowledged rewards, purchases, and construction choices before durable acknowledgement; batch motion hits rather than writing every sample. Document that unexpected power removal can lose uncheckpointed transient movement/battle state. Measure write rates and power-interruption behavior.

Export a device-produced versioned backup including checksum and world ID. Validate imported bounds, version, seed/world consistency, and all references before replacement. A checksum detects corruption, not malicious editing. Restore stages separately and requires an explicit owner action; the browser cannot overwrite authoritative state during ordinary reconnect.

Freeze partition offsets before release. Update packages write only boot/app/assets segments intentionally; never cover saves or NVS with erased padding. Export before first PocketQuest installation or any layout migration. Preserve old snapshots until save migration succeeds. Factory-image download size and partition compatibility belong in release notes.

## 11. Proposed repository structure

This structure is proposed, not created as game source during Phase 0.

```text
PocketQuest/
  firmware/             PlatformIO, hardware adapters, device UI, portal
  core/                 C++ state, rules, generation, simulation, serialization
  web/src/              Canvas renderer, input, connection and prediction
  shared/               numeric IDs, protocol/schema definitions, golden vectors
  assets/source/        original layered artwork; never shipped wholesale
  assets/export/        optimized scenery, objects and standalone sprites
  tools/                asset validator, packing, flash-size report
  tests/                host tests and browser integration fixtures
  docs/                 architecture, scenery, save format, roadmap, hardware results
```

Generation descriptors and metadata should be authored once and exported into firmware/browser formats. The domain library must compile for host tests without M5/Arduino dependencies. Asset hashes/version checks prevent browser/firmware mismatches after an update.

## 12. Implementation roadmap and gates

| Stage | Work after approval | Exit evidence |
| --- | --- | --- |
| 0 review | Agree architecture, time policy, dimensions, storage interpretation | Approved draft; outstanding measurements visible |
| 1 standalone | Hardware inventory; pinned toolchain; save slots; one character/monster; gentle swing and button attack | Physical play; XP survives restart; interrupted-save recovery; actual flash/RAM report |
| 2 connection | Random credentials, QR, HTTP state/commands, leases, backup/export, time-source experiments | Phone sees same character; retry awards once; reconnect and timer qualification results |
| 3 world proof | Four scenery families with required connectors, placeholder art, camera, collision, chunk prefetch | Traversal-order golden tests; seam/corner/occlusion review; Android memory and decode measurements |
| 4 Oakwood | Home hub, NPCs, merchant, four resources, first quest | Explore/gather/return loop and save restore |
| 5 one outpost | Aggregate settlers, priorities, one construction chain, elapsed-time catch-up | Split/long simulation agreement; power-off progress with identified source; safe unknown-time fallback |
| 6 supply network | Multiple settlements, protected reserves, caravans | No duplicated/lost cargo across catch-up/reboots; bounded performance |
| 7 expansion | Biomes, events, quests, atmosphere, more art | Each new connector family passes geometry/storage gates |

Smallest first playable milestone remains Phase 1: one monster, a deliberate gentle motion attack with cooldown, button fallback, XP/level/health, and restart-safe progress with placeholder graphics. The first end-to-end PocketQuest slice later adds a small forest, an Oakwood return point, wood gathering, one campsite-to-cabin transition, and a coherent device save. These are different milestones; neither requires all long-term systems at once.

Before any large scenery order, complete the Phase 3 seam proof. A small authoring experiment can happen earlier after the technical format is reviewed, using placeholders and a single master reference scene.

## 13. Review decisions and unresolved evidence

Owner/design review decisions:

- Does “under 8 MB” mean occupied content under 8,000,000 bytes, as recommended, or another packaging metric?
- Is USB updating without OTA acceptable initially?
- Does the proposed parallel-projected elevated view match the approved visual intent, including the 512 × 288 ground format?
- Is bounded browser-time catch-up acceptable when retained time is unavailable? Seven days is a proposed cap, with no automatic settlement destruction during absence.
- Are one controlling browser and finite persistent-record limits acceptable initially?

Engineering gates, not questions the owner must solve:

- Physical flash/PSRAM/installed partition verification and reproducible build size.
- M5PM1 timer semantics, retention, expiry, drift, and power-loss qualification.
- Cross-block seams, corner matching, road connectivity, and object occlusion using actual layered art.
- Compressed bytes and decoded memory on the target phone/tablet; AP streaming latency during combat.
- Maximum serialized state, flash-write recovery, and timed simulation performance.

The vision does not need to shrink before these measurements. It does need a bounded first build and evidence at each gate. This document is the Phase 0 handoff for joint review before implementation.
