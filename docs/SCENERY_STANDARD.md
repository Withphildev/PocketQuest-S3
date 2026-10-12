# PocketQuest — proposed scenery standard v0.1

Phase 0 authoring contract for review. Exact values below are recommendations to validate with four prototype families, not instructions to commission a production library. Approved art direction: warm, detailed fantasy pixel art, elevated three-quarter view, reusable large scenes, separate growing-settlement buildings.

## 1. Geometry and camera

Use a parallel/orthographic ground projection with no vanishing point and no diagonal isometric grid. Local world coordinates are `(u,v)`, increasing east and south. A chunk has footprint `[0,512) × [0,512)` world units.

Projection into a base image: `x = u`, `y = v × 9/16`. Therefore each chunk's ground image is exactly **512 × 288 pixels**. Chunk `(cx,cy)` begins on the projected ground plane at `(512×cx,288×cy)`. The compression corresponds to about 34.2° above the ground plane. This is a technical interpretation of the approved elevated perspective, subject to master-scene review.

World coordinate units and image pixels are deliberately different. Movement/collision use world coordinates; sprites attach by their feet to projected positions. Render the local neighborhood relative to the camera to avoid large-coordinate precision loss. Do not let export crops move a chunk's ground origin.

| Asset | Required source/export contract |
| --- | --- |
| Ground/background | 512 × 288, opaque, no sprite/UI baked into it |
| Object/foreground | Transparent image up to 512 × 512; explicit pivot, ground anchor, depth key, footprint |
| Character prototype | 32 × 48 frame canvas; foot pivot (16,44), body approximately 36 px tall |
| Scenery navigation | 32 × 32 cells, each 16 × 16 world units, projected cell 16 × 9 px |
| Ground boundary collar | 32 world units inward: 32 px on E/W, 18 px on N/S |
| Corner template | 32 × 18 ground pixels per corner |
| Typical small building pad | 128 × 128 world units = 128 × 72 projected px; size declared per building |

No rotation or mirroring of complete scenes initially: those operations change lighting, connector orientation, and object faces. Ground has no elevation in v0.1; mountains/cliffs need an extended geometry contract.

Supply a lossless PNG master in sRGB. Deployment may use a measured browser-compatible optimized export. Backgrounds must share a fixed palette and exposure. Use diffuse neutral daytime shading with light from upper-left; browser tint supplies day/night. Do not bake sunset color gradients, vignettes, perspective convergence, directional fog, or hard light patches into individual block edges.

## 2. Boundaries must be supplied templates

Codex/art tooling should provide reusable collar and corner artwork before production. ChatGPT generates scene interiors using these references; the final compositor preserves the actual template pixels. “Match the edge” in a text prompt is not a substitute for preserving geometry and pixels.

The edge descriptor contains axis, biome/material, elevation (zero in v0.1), socket kind, center/width, collar-template version, and corner IDs. Neighbor edges use the same descriptor. N/S socket position is measured west-to-east; E/W position is measured north-to-south. Opposite edges match in that same ordering, not reversed.

Initial sockets:

| Kind | Geometry | Navigation |
| --- | --- | --- |
| meadow-open-v1 | Flat shared grass collar | Entire shared boundary walkable |
| meadow-road-v1 | Same grass; centered road spans world interval [224,288) | Road and grass walkable; road visually distinct |
| forest-closed-v1 | Reserved for a later complete authored family | Must not be mixed with open meadow by name alone |

Road crossing at N/S edges is 64 image pixels wide, centered at x=256. Road crossing at E/W edges is 36 image pixels high, centered at y=144: world interval [224,288) projects to [126,162). Roads taper/curve only beyond the protected collar. Corners remain shared meadow, with no road exiting through them.

Collars have matching surface texture, road width, texture phase, slope, palette, and collision surface labels. Adjacent pixel rows need not be copies of one another; they must be neighboring slices of one shared continuous collar texture. Exact approved slices are recorded and checked by hash. Corner pixels belong to the canonical corner template and take precedence where collars intersect. Do not independently paint four corners after matching edges.

No trunks, building walls, water banks, steep shadows, or impassable objects in the collar. Initially keep object ground footprints at least 48 world units from the edge; tall visual canopies may extend outside the footprint if their render bounds are declared. An overhanging object belongs to exactly one chunk and renders once. Prefetch accounts for these bounds.

Flowing rivers require paired width/bank/depth/flow descriptors and path connectivity; they are not implemented by the generic word “river.” The prototype pond is entirely internal, at least 64 world units from edges. Bridges require walkable deck metadata over blocked water and correct shore entrances. Cliffs and biome changes require separate transition blocks.

## 3. Four artistic families and connector coverage

Use the master specification's names here; earlier chat examples used different numbers. Freeze IDs only after this registry is accepted.

| Family | Scene | Initial use |
| --- | --- | --- |
| F001 | Forest clearing | Open meadow boundary; settlement pad |
| F002 | Forest path | N/S and E/W authored configurations |
| F003 | Forest pond | Internal water, meadow boundary; no flowing river |
| F004 | Forest crossroads | Four road exits; central junction |

These four families are not enough for arbitrary road layouts. Either restrict the generator to supported signatures or author validated road overlays/configurations. Recommend four base scene families plus path overlays on suitable ground, with a 4-bit road mask: N=1, E=2, S=4, W=8. Each actually supported mask is registered with its composed image, navigation, and connected interior routes. This retains large prerendered backgrounds; it does not convert terrain into tiny tiles.

The initial deterministic road skeleton needs masks 0, 5 (N/S), 10 (E/W), and 15 (crossroads). Do not enable bends, dead ends, or three-way junctions until their corresponding combinations exist. Pond and settlement placement is conditional on valid ground and exit routing. For a broader generator, complete and validate all needed masks rather than using misleading metadata to fill gaps.

## 4. Ground, objects, collision, and occlusion

Ground holds low grass, paths, water surface, and decoration that does not hide a character. Trees, tall rocks, roofs, buildings, and tall vegetation need separable transparent objects. Painter ordering uses projected ground-foot y and stable ID, not image top-left. Large structures may need rear/front pieces or an occlusion mask; a single depth key is not enough for a walk-through arch or long wall.

Author navigation as readable JSON or a labeled editor layer. Pack it during build; the source remains easy to inspect. Ground grid uses two bits per cell: 0 blocked/solid, 1 walkable, 2 water/blocked-to-walking, 3 reserved. The 32 × 32 array packs into 256 bytes, row-major, with u increasing across columns and v across rows. No collision is inferred by image color.

Use separate masks/records for bridge deck, road classification, interactions, buildable ground, and dynamic buildings. Conservative cells can serve broad collision; exact footprint polygons refine curved trunks/rocks or door areas when needed. Author the ground-contact footprint, not the whole canopy silhouette. Runtime uses a proposed radius-six-world-unit foot collider and swept movement so fast motion cannot skip blocked cells. Clearance/reachability tests use that radius, including across chunk boundaries.

Every declared exit must connect to the appropriate interior route component. A walkable boundary is not proof of traversable interior. Validate boundary clearance, portal width, connected components, and accessible settlement pads. Buildings may not seal the only route or trap the player.

Store anchors and zones in world coordinates:

- Spawn and NPC anchors: unique ID, u/v, facing, allowed roles, clearance.
- Resource anchors: resource type, footprint, interaction radius, stable identity.
- Entrance anchors: doorway feet, interaction zone, destination, approach direction.
- Build pads: polygon/rectangle, maximum footprint, no-build margin, accessible entrance position, compatible building tags.
- Object records: asset ID, u/v ground pivot, image pivot, depth rule, collision polygon, render bounds.
- Special zones: water, bridge, quest trigger, or reserved landmark; numeric IDs exported for firmware.

A garden/constructed pond uses an overlay and changed surface metadata together. Artwork and collision must update in one accepted construction transaction.

## 5. Example metadata contract

Illustrative authoring record, not a complete executable asset. The referenced masks and images must exist and pass validation before registration.

```json
{
  "schemaVersion": 1,
  "id": "F001-v1",
  "biome": "forest",
  "worldSize": [512, 512],
  "groundPixels": [512, 288],
  "projection": {"xScale": 1, "yNumerator": 9, "yDenominator": 16},
  "ground": "F001-ground.png",
  "roadMask": 0,
  "edges": {
    "north": "meadow-open-v1",
    "east": "meadow-open-v1",
    "south": "meadow-open-v1",
    "west": "meadow-open-v1"
  },
  "corners": ["meadow-corner-v1", "meadow-corner-v1", "meadow-corner-v1", "meadow-corner-v1"],
  "navigation": {"cellWorldSize": 16, "width": 32, "height": 32, "source": "F001-nav.json"},
  "spawnAnchors": [{"id": "arrival", "u": 256, "v": 400}],
  "buildPads": [{"id": "camp", "rect": [192, 192, 128, 128], "tags": ["camp", "small-cabin"]}],
  "objects": [],
  "assetVersion": 1
}
```

The registry adds byte sizes, hashes, template hashes, supported neighbor descriptors, render bounds, and rules version. File paths are authoring conveniences; firmware uses numeric IDs and packed metadata.

## 6. Required authoring handoff

For each family deliver ground PNG, layered transparent objects, navigation source, anchors/build pads, connector configuration, and a contact sheet assembled with approved neighbors. Preserve editable layered masters outside the shipped flash pack. Supply a master scene and a character scale reference before repeating the style.

Engineering acceptance before production:

1. Exact dimensions, projection, asset references, and collar/corner hashes pass validation.
2. Every supported neighboring edge pair and every valid 2 × 2 corner arrangement is assembled and inspected at native pixels and intended phone zoom.
3. Walkable portals and routes pass clearance/reachability checks in all four directions; pond is impassable except declared bridge decks.
4. Player passes in front of and behind objects correctly; canopies remain visible at chunk boundaries without duplication.
5. Settlement overlays preserve exits, doors, and free player space as they grow.
6. Native-resolution compressed images and metadata are measured against the Phase 0 budget. No assumed “25 KB per scene.”
7. Camera crosses block boundaries without fractional-pixel cracks or ordinary loading pauses on the target phone/tablet. Decode/streaming latency and cache memory are recorded.
8. Seed and chunk selection give identical output in different exploration orders, including negative coordinates.

Until these pass, create only the master reference and four prototype families with placeholders where necessary. If the camera or geometry needs changing, revise this contract before generating the library.
