# Phase 2A — browser world workshop

Phase 2A.1 adds a two-block forest-path calibration view, independent 0.5×–2× character rendering, a combined debug toggle, safe behind/front tree/building checkpoints, and externally supplied `templates.json` collar/corner references. World generation and logical navigation are unchanged. Start with both blocks in view; enable Follow Nova for scrolling/zoom. Only the first two asset slots are used in calibration mode. See `docs/VISUAL_ASSET_REQUIREMENTS.md` for the exact artwork handoff; no intended visual style is approved merely by the placeholder rig.

Dependency-free Canvas 2D prototype, not the full RPG. No connection to the StickS3. Targets modern Chrome with Canvas, ES modules/import maps, and `createImageBitmap`. PNGs are original code-drawn engineering placeholders, not production art.

## Build and run

From `web/`, with Node 20 or newer:

```sh
npm test
npm run build
npm run dev
```

Open `http://127.0.0.1:4173`; stop the loopback-only server with Ctrl-C. No npm install is needed: there are no dependencies. Static hosting can serve `dist/`, but these commands do not publish a site.

The build emits `dist/PocketQuest-S3-Phase2A.1.html` (plus the older-name alias), a self-contained download with all modules/images embedded, intended for opening in Chrome without a server. It was browser-tested over HTTP; direct file-URL opening is blocked by Codex browser policy and remains an owner check. No external services or network asset requests are needed in that file. `npm run assets` regenerates tracked PNG/JSON placeholders. `node tools/export-calibration-kit.mjs` exports a placeholder-based format kit into `build/calibration-kit`; select all its files in the lab to test external templates.

## Explorer and scenery lab

- Click the world, use WASD/arrows, or hold on-screen movement buttons. Keyboard focus in a form does not move Nova. Movement normalizes diagonals and sweeps in steps no larger than 3 world units.
- Enter a decimal uint32 seed: prototype input, not the device's persisted 64-bit seed or a save migration.
- Toggle seams/collars, collision/footprints, zoom, and temporary female/male Nova appearances. Both share movement/collision. Browser progression and firmware character selection are not implemented.
- Select **2 × 2 scenery validation**, choose NW/NE/SW/SE configurations, and test movement/occlusion. Bad connections remain visible with errors; movement pauses.
- **Load local scenery files** together: flat manifest/navigation JSON and all referenced ground/foreground PNGs. Files stay in the browser, with no server upload. Partial imports remain inspectable but failures block movement. Custom assets use preview mode, never generator substitution. Restore built-ins for wilderness exploration.
- Download validation JSON for asset/category/location messages and ground-size metrics.

## Geometry and modules

`world.js`: deterministic generation/lookup; `navigation.js`: collision; `scene.js`: projection/camera/depth; `renderer.js`: Canvas; `validation.js`: semantic checks; `assets.js`: file/image I/O; `app.js`: input/UI.

Ground: 512×288 PNG, 512×512 footprint, x=u/y=9v/16. Independent navigation: 32×32 cells of 16 world units, only cell 1 passable. Radius-six feet collide with cells and foreground polygons across boundaries. Objects have transparent image, pivot, world ground anchor, absolute block-local footprint, and render bounds `[left,top,width,height]` relative to projected anchor. Depth uses world v of the anchor; Nova uses foot v. Objects render once, with a 512-pixel overhang-prefetch margin.

Connector bits: **N=1, E=2, S=4, W=8**. Supported: F001 clearing/0, F002 path/5 and /10, F003 pond/0, F004 crossroads/15. Unsupported masks/families and missing exact generator IDs are rejected. No rotation, mirroring, bends, or fallback.

Version-1 hash-selected road rows/columns ensure matching exits independently of visit order. Negative coordinates use floor division. Origin `(0,0)` reserves Oakwood but only shows placeholder crossroads, not the village. Dimensions/projection remain provisional.

`canonicalPixel()` is the placeholder template registry: exact grass/road texture phase, width, and corner pixels. N/S collars are 18 px; E/W 32 px; corners NW/NE/SE/SW. Validation flood-fills radius-cleared cells from the open border and checks exits/spawns. Ground and collision do not derive from each other at runtime.

Future world deltas, settlements, caravans, quests, and device-authoritative saves remain separate/deferred. No localStorage progression or autonomous simulation. This is not a complete JSON Schema engine, polygon editor, production template registry, dynamic-overlay validator, or streaming benchmark.
