# Scenery validation and preview tool specification

Historical Phase 1 specification below. Phase 2A implements a bounded browser scenery lab; see `web/README.md` and `PHASE2A_REPORT.md` for supported contracts/tests and remaining production-tool work. Dynamic settlement overlays, split layers, contact sheets, and production export are still deferred.

Phase 1 preparation only. No browser RPG, preview tool, template artwork, or production scenery has been implemented. Dimensions remain provisional pending visual prototype review.

The smallest useful tool has a batch validator and one offline browser preview page. It loads a local folder selected by the owner, reads the block manifests, uses native Canvas 2D, and makes no external network requests. A minimal package needs two adjacent compatible scenes for a seam check; four scenes permit corner validation. The tool never needs the StickS3 to inspect art.

## Inputs and contract

See `shared/schemas/scenery.schema.json` and `navigation.schema.json` for machine-readable shape constraints. Geometry semantics are validated beyond JSON Schema.

- Ground PNG: opaque 512 × 288, sRGB, derived from 512 × 512 world footprint using x=u, y=9v/16.
- Navigation: 32 rows of 32 cells; 0=solid, 1=walkable, 2=water, 3=reserved/nonwalkable. Row order is north to south, columns west to east. Runtime export packs four cells per byte, first cell in least-significant two bits.
- Foreground objects: transparent image, pixel pivot, world ground anchor, collision polygon, depth rule, and declared render bounds. Missing alpha or inconsistent pivot is an error.
- Socket mask: N=1/E=2/S=4/W=8; Phase 1 preparation allows only 0,5,10,15. Edge names must agree with actual road bits.
- Edges: E/W 32-pixel collar, N/S 18-pixel collar; crossing road interval [224,288) world units; E/W image crossing [126,162). Exact collar slices come from shared reference templates, not independent generated borders.
- Corners: NW,NE,SE,SW template IDs and associated pixel hashes. Shared vertex signatures must agree in every supported 2×2 arrangement.
- Family IDs: F001 clearing, F002 path, F003 pond, F004 crossroads. A family may have distinct immutable configuration IDs.
- Building pads, NPC/resource spawns, entrances, interaction zones, and stable IDs belong to metadata, not painted labels in the scene.

Ground-only masks are insufficient for bridges, buildings, and tall objects. The tool combines source surfaces with authored collision polygons and dynamic building footprints; a character's feet define its location, not its head or canopy silhouettes.

Corner IDs in the block manifest resolve through a shared template registry containing canonical pixel slices and hashes, ordered NW/NE/SE/SW. That registry and its artwork are not supplied in Phase 1. Before enabling `split-front-back`, extend the provisional object contract with explicit front/back assets and their pivots/bounds; the single-asset form currently only fully specifies `ground-anchor`. The later validator must reject split objects missing those layers. Do not generate production artwork against that unresolved extension.

## Batch validator

Reject invalid file paths, missing/duplicate IDs, unsupported format versions, wrong dimensions, unrecognized surfaces, invalid masks, out-of-bounds anchors, nonzero initial elevation, missing required foreground metadata, and template/hash mismatches. Validate both sides of each edge and canonical corner descriptors. Use a shared deterministic coordinate convention so opposite-edge arrays do not get reversed accidentally.

Flood-fill walkable components with the radius-six-world-unit foot collider. Check boundary crossing clearance, roads joining the correct components, accessible spawn/door/build pads, and whether a proposed settlement overlay blocks required exits. A closed cell cannot be reclassified as passable just because the painted road appears plausible.

Output a human-readable report plus JSON listing asset ID, issue category, filename, coordinate, expected/actual value, compressed bytes, estimated decoded bytes, and severity. Schema failures block preview selection; visual seam judgments remain an owner/art review responsibility. Pixel collars should validate against their canonical slices, not require neighboring boundary rows to be identical.

## Preview MVP

Show a configurable 2×2 arrangement with:

1. Native-pixel and 2×/3× integer zoom; pan and optional character camera following.
2. Border/collar/corner highlighting, block IDs, socket labels, and a before/after overlay toggle.
3. Collision heatmap, footprints, doorway/spawn markers, and reachable-component colors.
4. Keyboard/touch movement of a placeholder character using swept foot collision across boundaries.
5. Ground-anchor depth ordering and tall-object overhang; a tree/building test traverses both front and rear.
6. Asset sizes and decoded-cache estimate. No arbitrary smoothing that conceals seams.

No quests, economy, seed-generated world, content editing, account, or deployment is needed for this first tool. After 2×2 acceptance, expand to a scrolling 3×3 neighborhood and automatic compatible-pair/corner contact sheets.

## Acceptance fixtures for the later implementation

Include valid clear/path/pond/crossroads metadata plus intentionally broken dimensions, road width, mismatched corners, invalid cell values, duplicate anchors, blocked exit, invisible obstruction, bad canopy pivot, and missing files. The validator must identify the specific failure and location. Preview must show deliberate seam defects rather than silently correcting them. Production art remains gated on approved camera/scale and all required edge combinations.
