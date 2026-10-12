# Phase 2A.2 — functional integration delivered; illustrated artwork pending

This is the explicitly authorized fallback deliverable, **not completion of the first playable illustrated Sunlit Forest**. Option A values are preserved unchanged: 1024×288 master, two 512×288 blocks, 512×512 logical footprints, x=u/y=9v/16, 36-pixel Y=126–161 E/W opening, mask 10, 32×32 navigation, Canvas 2D. No Phase 2B or production approval.

## Completed source/tooling

- Existing Scenery Lab accepts an exactly opaque 1024×288 Sunlit master, splits it once at X=512 without resizing, and offers both split PNG downloads. It refuses master+halves ambiguity, wrong dimensions, and nonopaque ground.
- Sunlit imports require existing exact template registry plus an independently authored binary road mask. Outer and center protected openings and absence of N/S road exits are checked. Exactly two F002/mask-10 manifests must reference Left/Right PNGs. Existing source/corner/collision/reachability validation remains unchanged; no fallback scenery substitution.
- Optional nova.json loads both protagonists' four static 32×48 transparent frames, pivot [16,44]. Invalid assets fail rather than distort. Rendering uses the same feet, depth key, collision and visual scale. No usable approved sprite frames exist yet, so default Nova remains labeled geometric placeholders. Imported static frames have no walking animation; original geometric placeholder walk animation remains.
- Character scale starts at 1.5×; camera follow starts enabled; fit-two-block/debug controls remain. Movement input is now four-direction, not diagonal, following the approved Zelda-style direction.
- Reproducible `web/tools/export-integration-fixture.mjs` packages existing engineering imagery as a test-only master import, semantic road mask, exact shared collar/corner PNGs, independent navigation, and transparent tree/cabin/rock/fence metadata. Its README and browser status explicitly say NOT illustrated Sunlit artwork. It is not a new forest-art substitute or production asset set. Distinct large/medium trees are supported generically but their artwork remains pending.
- Exact artist handoff: SUNLIT_ASSET_REQUEST.md. No renderer redesign, 3D engine, settlement/quest system, device connection or save changes.

## Artwork attempt / failure

The imagegen skill's built-in tool was used to request one intentionally authored opaque 1024×288 ground-only master in the Sunlit reference style. It returned **2078×757**. The candidate is therefore rejected before scenery import; no stretching/cropping was done to make it pass. Painted road alignment, exact templates and visual projection have not been certified for this rejected candidate. No calibration-ready ground master or illustrated split PNGs are delivered. Original supplied reference is unchanged.

Prompt used:

> Create ONE new intentionally authored calibration ground master for PocketQuest Sunlit Forest, not a crop or edit of the supplied reference. Requested exact output 1024 x 288 pixels, opaque PNG. Style reference: the previous Sunlit Forest image in this conversation, lush emerald fantasy pixel art, warm sunlight, golden-brown dirt path, moss, colorful tiny wildflowers, selective HD-2D detail. Elevated three-quarter PARALLEL presentation not strict isometric, no vanishing point or size falloff. Ground layer ONLY: absolutely no trees, trunks, buildings, fences, logs, large rocks or foreground props; just grass flowers tiny pebbles and ground textures. Continuous straight EAST-WEST path across full width, exact vertical opening from Y=126 through Y=161 at left edge, center X=512 and right edge. Road precisely 36 pixels high in collars x=0..31,480..543,992..1023, interior can gently vary. No other exits. Clear passable grass along all other edges and corners. Need two adjacent 512x288 blocks split once at X=512; no text, no grid, no UI, no character, no framing border. This is a calibration candidate, not production art. Pixel-exact dimensions are critical; do not stretch an existing artwork to fit.

The failed candidate is retained outside Git as a clearly named review output, not referenced by the prototype. No finished foreground or Nova artwork was generated or claimed approved.

## Verification

`npm --prefix web test`: **23 tests pass**, including 5 added integration tests for master dimensions/alpha, road openings at every outer/center collar, binary mask/no additional exits, both Nova identities/frame dimensions/pivots, external frame loading, and no-resize foot-pivot rendering. Existing scenery validation, deterministic generation, seam traversal, collision/depth/camera tests remain passing.

`npm --prefix web run build`: succeeds; new offline deliverable PocketQuest-S3-Phase2A.2.html. `sh tools/test-host.sh`: **1,330 assertions pass**. No firmware build or flash. Firmware/core/include source is unchanged from v0.1.0. World generation, navigation, scene sorting and the original validator source are unchanged.

Local browser QA used the Sites skill local-only workflow and **actual imported engineering fixture files**, not the prior flattened reference display. Verified: master split download controls, distinct Left/Right selections, valid exact templates/corners, traversal from (440,256) to approximately (651,256), entering block (1,0) with camera following, tree behind checkpoint (100,125) versus front (100,191), and trunk collision stopping northward movement near (127,181). Debug overlays and overview camera tested. These screenshots prove fixture integration only, not Sunlit artistic quality. The generated 2078×757 image was explicitly imported as a master and rejected with “Sunlit master/mask must be 1024×288; source preserved”; movement pauses on validation failure. Browser JSON validation report captured for the valid imported fixture.

No production Nova frame browser test is claimed; no approved usable frames exist. Pure loader/renderer tests cover the code path. Direct file:// opening was not separately automated; local HTTP verification exercised the standalone bundle.

## Remaining limits / owner review

Need intentionally authored dimension-correct illustrated ground, coherent exact templates, authored mask matching its actual road, navigation/foreground metadata, transparent large/medium tree/rock/fence art and optional 32×48 Nova frames. Single-anchor sorting cannot handle every complex overhang. Existing checkpoint coordinates are for engineering objects; imported art may need manual movement. Road-mask validation trusts authored semantic labels; it does not automatically recognize dirt pixels or prove visual seam quality. Placeholder-only screenshots cannot approve perspective or final character scale.

Next step: owner/ChatGPT supply the exact asset-request package. Import it without weakening validation, then review artistic perspective, scale, lighting, seams, collision and occlusion. Stop for owner review; Phase 2B remains unauthorized.
