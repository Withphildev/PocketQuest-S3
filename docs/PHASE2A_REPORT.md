# Phase 2A development report

Implementation and available tests complete; owner visual review pending. Browser package 0.2.0; StickS3 firmware remains v0.1.0. No hardware access, erase, flashing, firmware build/download, GitHub Release, or hosted deployment in this phase. Stop before Phase 2B.

## Delivered

Continuous Canvas 2D exploration and camera following, four-direction animated Nova placeholder, normalized/swept movement, pointer/touch controls, and separate deterministic generation/navigation/depth/render/validation/file-I/O modules. Exact configurations only: F001/0, F002/5 and /10, F003/0, F004/15. Bits N=1/E=2/S=4/W=8.

Five ground configurations plus transparent tree/cabin/rock/fence PNGs have independent collision sources, anchors, polygons, bounds, and ground-v ordering. Nine PNGs total: 34,920 compressed bytes. No production art library. Scenery lab includes local file loading, neighboring 2×2 arrangement, seams/collars, pixel/dimension checks, edge/corner compatibility, collision/footprint overlays, radius-clearance flood-fill/spawn/exit checks, movement/occlusion preview, and report export. Invalid layouts remain visible with movement paused.

Dependency-free static build plus self-contained HTML review download. See `web/README.md`. The Sites skill's local workflow guided preview/packaging; no hosting registration or publication was needed for this repository-scoped prototype.

## Tests and build

`cd web && npm test`: **12 tests passed**, zero failures. Covers actual PNG/nav/object assets, seed golden vectors, reverse visit order, 1,600 blocks across four seeds with east/south neighbor checks, negative floor division, crossings in both axes, water independent of artwork, no collision tunneling, object/diagonal-radius collision, front/back depth, camera continuity, malformed inputs, corrupt collar pixels, missing/opaque foregrounds, incompatible seams, and blocked/disconnected spawns/exits.

`npm run build`: passed; static `web/dist` and self-contained HTML emitted. JS syntax checks passed. Local server returned HTTP 200. Packaged embedded modules/images loaded in the browser over HTTP.

Phase 1 regression runner: **1,330 assertions passed** with sanitizers. Git comparison against `v0.1.0` found no changes to firmware, portable C++ core, original host tests, or runner. No firmware binary was needed or produced. Manual ESP Launchpad workflow remains in place.

## Browser observations

- Built-ins validate/render. Holding east changed `(256,440)` in block `(0,0)` to approximately `(637,440)` in `(1,0)` with camera-follow motion, not scene teleport.
- Southward movement likewise reached approximately `(256,630)` in `(0,1)`. Both temporary Nova appearances were selectable. At `(99,125)` the tree canopy obscured Nova; moving to `(99,191)` rendered Nova in front, confirming the front/back switch visually.
- Clearing east of crossroads visibly reported `F004-crossroads east ≠ F001-clearing west`, without path substitution.
- Collision overlay works. Importing local clearing manifest/ground/navigation plus all four foreground images produced a valid neighboring preview; warning/error logs were empty during that check.
- Self-contained HTML loads over HTTP. Direct `file://` testing was blocked by browser protocol policy, which was not bypassed. Owner should test downloaded HTML in Chrome.
- Validation-report download completed successfully. A negative seed produced an explicit uint32-range failure; restoring seed 323 cleared the failure and resumed a valid scene.

Logic tests/observations do not establish final art quality, phone performance, endurance, or exhaustive interaction acceptance.

## Limitations and next review

Oakwood is reserved, not implemented. No RPG combat, persistent deltas, quests, settlements, caravans, offline progression, or device connection. Prototype uint32 seed is not a future 64-bit device-seed transport/cross-platform strategy.

Only `ground-anchor` occlusion is accepted; split layers are rejected pending their contract. Production collar artwork/hash registries need visual approval/versioning. No full JSON Schema engine, polygon self-intersection checks, dynamic settlement transaction checks, or art editing pipeline. Imported files require flat local names.

Roads are straight rows/columns, not general routing. Five configurations repeat with fixed object placements; coordinates are bounded to one million blocks. Assets preload: production streaming, phone touch comfort, decoding, and memory endurance are unmeasured.

Owner review: compare zoom/scale, cross seams, navigate around pond/trunks/fences, check both sides of trees/buildings, load custom files, and mismatch roads. Approve perspective/character scale and occlusion layers before production art or Phase 2B authorization.
