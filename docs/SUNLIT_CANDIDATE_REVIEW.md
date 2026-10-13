# Sunlit Forest calibration candidates — renderer compatibility review

Status: visually representative candidates, **not validator-passing playable scenery**. Continue Phase 2A.3 only. No source artwork corrections, stretching, device operations, Phase 2B, or production scenery generation were performed.

## Verified input

The ZIP contains master, Left, Right, contract overlay and a explanatory README. Instructions/claims in its README were treated as candidate provenance, not extra authorization.

| File | Verified dimensions | Result |
| --- | --- | --- |
| Master-CANDIDATE | 1024×288 | Fully opaque RGB / decoded alpha 255 |
| Left-CANDIDATE | 512×288 | Pixel-exact master crop [0,0,512,288) |
| Right-CANDIDATE | 512×288 | Pixel-exact master crop [512,0,1024,288) |
| Contract overlay | 1024×288 | Visual guide only; never used as game ground |

The provided split is correct and does not need resizing. The adjacent halves reconstruct the continuous master without lost/repeated pixels. That establishes the internal image split, **not** repeatable shared border/corner compatibility or matching collision data.

The reference looks substantially closer to the desired elevated three-quarter fantasy presentation: visible rock tops, raised mossy edges, richly detailed foliage and warm sunlight. No strict isometric conversion is recommended. The prior reported uniform resize/crop is already baked into these candidates; this review preserves their supplied pixels without another crop or resampling.

## Remaining failures

The painted dirt path visibly extends above/below the mandated cyan Y=126–161 strip at the connection collars. No semantic road mask is supplied, so exact painted boundaries are a visual assessment, not a certified color-segmentation measurement.

Both blocks use the same prescribed socket/corner IDs, but their corresponding protected textures differ. Pixel-exact shared-template comparisons give:

| Corresponding region, Left versus Right | Differing pixels |
| --- | --- |
| North 512×18 | 9,212 / 9,216 |
| East 32×288 | 9,216 / 9,216 |
| South 512×18 | 9,212 / 9,216 |
| West 32×288 | 9,216 / 9,216 |
| Each NW/NE/SE/SW corner 32×18 | 576 / 576 |

These are same-direction comparisons, not a demand that every adjacent boundary pixel be identical across the road. They demonstrate that a single existing directional template registry cannot match both candidates unchanged. Assigning independent left/right registries or ignoring corner checks would conceal the incompatibility and is not allowed. Reauthor shared collars before deriving templates.

The unchanged scenery validator also reports baseline protected-pixel mismatches at [0,0] for each block. That baseline uses engineering colors because no external templates exist; different artistic colors are not inherently a failure once a **compatible** authored registry is supplied. However, the independently measured shared-border contradictions remain even with a custom palette. No validator relaxation is proposed.

Raised rocks/ledges remain baked into the ground. Some lie near protected edges. Their solid footprints and occlusion requirements are absent; all-walkable ground would incorrectly let Nova pass through them. There are no supplied manifests, road mask, nav grids, or template registry.

## Minimum artwork corrections (retain the overall scene)

1. **Repaint connector collars, not the whole path.** At master X=[0,32), [480,544), [992,1024), make dirt occupy exactly Y=[126,162). Replace surplus dirt above/below with coherent grass/flowers and blend toward the wider interior path outside those protected collars. Interior road width may vary. Preserve perspective, light and overall composition; do not vertically compress it.
2. **Author shared protected edge/corner artwork.** Match N/S 18-pixel strips, E/W 32-pixel strips and four 32×18 corners to one compatible directional registry. Keep these strips passable and free of solid rock/trunk/wall footprints. Move or replace raised objects intruding there. This is a bounded border edit, not a full-ground redesign.
3. **Resolve raised ground objects.** For boulders/ledges Nova must walk behind, supply separate transparent foreground exports and fill the underlying ground. Objects intended solely as flat ground decoration can remain, but must not imply a solid raised obstacle while being traversable. Authored blocked nav may represent non-occluding terrain, but cannot itself repair baked foreground depth. Owner/artist must decide which shapes are solid and occluding; the engine cannot infer this from pixels.

After those edits, split the corrected master once at X=512 and add the actual road mask, independent 32×32 collision grids, foreground polygons/anchors and one shared eight-edge/four-corner template set. These metadata files are technical authoring, not additional scenery-library images. Keep the existing transparent tree rather than generating another tree for this test. Correcting the master changes both half exports; do not separately repaint/rescale halves afterward.

## Browser review and tree integration

`PocketQuest-Sunlit-Candidate-Review.html` embeds the supplied Left/Right pixels unchanged and the previous `Sunlit-Tree.png` (128×160), pivot [64,148], ground anchor [128,160], independent collision polygon [[114,146],[142,146],[142,174],[114,174]]. It uses the existing Renderer, movement/collision functions and ground-anchor depth ordering. The same tree is reused in the second block. The renderer/validator source is untouched.

This is an **isolated diagnostic viewer**, not a bypass install into the approved asset registry. It displays explicit failed-scene status and the actual validator/border audit. Movement is disabled by default. An explicitly labeled optional tree-only sandbox uses a provisional walkable surface plus the tree polygon: painted rocks/ledges have UNKNOWN collision. This sandbox cannot be cited as a passed whole-scene collision or connector test. No approved world-generation asset is replaced.

Controls: overview/follow camera, 0.5–2× character scale, female/male geometric Nova placeholders, required-road-band guide, protected seams/provisional grid, tree behind/front positions, center-seam position, optional WASD/arrows sandbox and JSON failure-report download. Supplied contract overlay is separately viewable, never baked onto game ground. No production Nova frames are claimed.

Verified in the local browser: scene renders, failed validation is explicit, independent illustrated tree covers Nova at (100,125); actual S-key diagnostic movement reaches approximately (100,193), where Nova draws in front. Camera follow and overview work. This qualifies only tree integration and visual comparison, not the invalid scene's complete playability. Build succeeds; **26 web tests pass**, including exact shared-border audit and entry-point syntax checks. An initial preview syntax error was corrected before final verification. Phase 1 sources and existing renderer/validator remain unchanged; no firmware build or flash was performed.

Rebuild from repository root (after the existing tree preparation output is available):

```sh
node web/tools/build-candidate-review.mjs /absolute/path/to/extracted/candidates
```

The Sites skill was used for local-only browser verification. Input ZIP/images were not modified; original assets stay outside the game registry. No GitHub publication was performed. Stop for owner review before artistic correction work or Phase 2B.
