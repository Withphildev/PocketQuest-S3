# Phase 2A.1 artwork handoff — two-block forest path

This is a reference-art calibration gate, not production-library authorization. Target remains elevated three-quarter fantasy, parallel projection, **not strict isometric**. The calibration rig retains engineering placeholders until owner/ChatGPT artwork is supplied. No new production art has been generated.

## Required geometry

| Deliverable | Dimensions / meaning |
| --- | --- |
| Left and right ground PNGs | Each 512×288 opaque sRGB; two adjacent blocks form 1024×288 projected ground |
| Logical footprints | Each 512×512 world units; pair is 1024×512 |
| Projection | x=u, y=9v/16; no x shear, perspective vanishing point, or size falloff |
| Road configuration | F002, mask 10 (E=2 + W=8). N=1, S=4; only masks 0/5/10/15 supported |
| Crossing path | E/W border: image y=[126,162), world v=[224,288); 36-pixel / 64-unit width |
| Protected collars | E/W: 32 px inward; N/S: 18 px inward |
| Corners | 32×18 px, NW/NE/SE/SW ordering |
| Navigation JSON | 32×32 cells, 16-unit cells; 0 solid, 1 walkable, 2 water, 3 reserved/blocked |
| Foreground tree/building PNG | Transparent cutout, max 512×512; no character/UI baked into image |
| Nova eventual source frame | Provisional 32×48 canvas, foot pivot (16,44), roughly 36-pixel visible body at render scale 1 |

Prepare a continuous 1024×288 master ground view, then split exactly at x=512 without recropping, independent resizing, or mirroring. Use shared template pixels for protected borders; no water, trunks, walls, or impassable footprints in the collar. Keep collision footprints within [48,464] on both axes. Separate trees/buildings from ground so their canopies/roofs can occlude Nova. Shadows intended to cover Nova belong in the foreground, not baked ground.

Two distinct manifests may use `F002-reference-left` and `F002-reference-right`, each referencing its own ground/nav files. The existing manifest shape remains in `shared/schemas/scenery.schema.json`. Edges are north/south `meadow-open-v1`, east/west `meadow-road-v1`. Socket names are compatibility identifiers, not requirements to retain the placeholder palette. Corners currently use `meadow-corner-v1`. Imported references are preview-only; they do not replace wilderness generator IDs.

## External template registry

Select all manifests, PNGs, navigation JSON, and optional **templates.json** together. Without this registry, exact placeholder palette/texture validation remains active. To use new art, provide an opaque version-1 registry with flat local filenames:

```json
{
  "schemaVersion": 1,
  "id": "forest-calibration-v1",
  "edges": {
    "meadow-open-v1": {"north":"open-north.png","east":"open-east.png","south":"open-south.png","west":"open-west.png"},
    "meadow-road-v1": {"north":"road-north.png","east":"road-east.png","south":"road-south.png","west":"road-west.png"}
  },
  "corners": {
    "meadow-corner-v1": {"nw":"corner-nw.png","ne":"corner-ne.png","se":"corner-se.png","sw":"corner-sw.png"}
  }
}
```

Each N/S reference is 512×18; E/W 32×288; corner 32×18. All references are opaque. Store actual directional slices, not flipped copies; corners take precedence in overlapping collar areas. Both blocks are checked pixel-by-pixel against these slices, and their metadata/socket/corner signatures must match. Do not extract unrelated templates independently from each block merely to hide mismatches. Derive the registry from approved continuous master artwork; adjoining slices need visual review, not an assumption that boundary rows must be identical.

The current registry requires all eight open/road directions and four corners even for an E/W test; unused road N/S references should be prepared consistently from the same visual system. It accepts only the existing socket/corner IDs; broader transition families need a versioned extension. Pixel validation proves agreement with the supplied templates, **not** that a badly authored template set is visually seamless. Owner review across the center seam is still required.

Foreground metadata: image filename, block-local `[u,v]` ground anchor, pixel pivot, collision polygon in absolute block-local world coordinates, `renderBounds=[-pivotX,-pivotY,width,height]`, and `depthRule="ground-anchor"`. Objects should have fully transparent background pixels and visible painted pixels. Keep palette, light direction, and camera consistent. Shape changes require corresponding authored collision changes; the engine does not infer them from art.

## Scale, overlays, and occlusion review

Character drawing scales 0.5×–2× around the foot anchor, independently of camera zoom. The collision circle remains radius 6 world units; changing scale never changes movement speed, navigation, or depth key. The indicated 36×scale pixels are nominal source-body size; displayed size also depends on zoom/overview fit. Large scales can make the sprite visibly overlap obstacles despite correct unchanged feet collision.

The two-block overview fits the pair; enable **Follow Nova** for normal scrolling/zoom. Debug toggle shows/hides seams plus collision together; separate checkboxes remain. The white foot ellipse is unscaled collision geometry. Repeated tree/building checkpoint clicks explicitly jump between safe behind/front positions for existing placeholders; custom artwork may need manually chosen positions. These jumps are calibration aids, not gameplay abilities.

## Limits of 512×288 projection

The 9/16 compression is a flat-ground mapping (nominal elevation about 34.2°), not proof of the intended visual camera. It cannot enforce an artist's perspective, object scale, illumination, or slope; screenshots with representative art are required before visual approval. Navigation cells project to 16×9 px; sub-cell terrain detail needs authored polygons or a revised contract. Tall objects need transparent layers outside the ground crop. No elevation, cliffs, perspective depth scaling, strict isometric diamond layout, or multi-layer indoor/bridge occlusion is implemented.

Single-anchor depth sorting works for simple trees and cabins, not every complex building/overhang. Split front/back layers remain rejected. Imported images are bounded to 512×512; production streaming/cache/phone performance remains unqualified. If final reference art cannot fit this projection consistently, discuss and approve a contract change before generating a library—do not warp approved art silently.

## Reference kit

From `web/`, run `node tools/export-calibration-kit.mjs`. It exports the existing placeholders, independent nav/metadata, and exact cropped template PNGs into ignored `web/build/calibration-kit`. This is a reproducible format example, **not intended PocketQuest art**. Replace reference artwork and corresponding templates/metadata coherently; load the resulting files together. The exporter only reads bundled filter-0 placeholders, not arbitrary external PNGs.
