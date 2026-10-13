# Nova walking sprite calibration candidates

Status: generated and integrated for owner review, NOT production-approved sprites.
The original supplied character reference is unchanged. Firmware and scenery geometry,
navigation, shared templates, tree PNG/anchor, collision radius, and validator are unchanged.

## Deliverables and contract

Female Nova has long indigo-purple hair; male Nova has short tousled indigo-purple hair.
Both use teal cloaks, green adventurer clothing, brown boots/belts/satchel and shared sword equipment.
Each has sixteen transparent 32×48 frames, packaged as a 128×192 atlas.
Rows: down/south, up/north, left/west, right/east. Columns: four walking poses.
Every frame uses foot pivot (16,44); idle holds the second pose. Walking advances every
140 ms (560 ms loop). Character scale remains configurable without changing collision.
No attack/hurt/victory animation or device character selection was implemented.

The manifest nova.json names four separate frame PNGs per direction. Existing single-frame
imports remain supported. The renderer's foreground order still uses the logical ground anchor.

## Preparation

Built-in image generation used the supplied sheet as an identity/style reference, not as an
atlas to crop. A targeted correction fixed a wrong-facing female pose; background-extraction
passes requested zero-alpha backgrounds. Generated originals are preserved in
web/artwork-sources/nova. Requested grid coordinates were not assumed correct.

The deterministic preparation tool identifies four rows/columns using transparent gutters
on the alpha≥128 silhouette, crops each silhouette with two-pixel padding, and preserves
all source alpha inside that crop. Very faint outlying alpha beyond the padding is excluded.
It uses a uniform 1/9 nearest-neighbor affine transform, not independent width/height resizing.
Visible bounds are centered horizontally and bottom-aligned to the common foot baseline.
This baseline is inferred from silhouettes, not an artist-authored skeletal foot point.
Preparation report records source SHA256, actual dimensions and all crop/paint bounds.

From the project directory, with Pillow 12.3.0:

```
python3 web/tools/prepare-nova.py web/artwork-sources/nova/female-generated.png web/artwork-sources/nova/male-generated.png web/build/nova
python3 web/tools/test-nova.py web/build/nova
node --test web/tests/*.test.mjs
node web/tools/test-prepared-ground.mjs web/build/validated-ground
node web/tools/build.mjs --ground-validation --nova
```

Open web/dist/PocketQuest-Nova-Sprite-Review.html, select either Nova and move with WASD/arrows.
Normal zoom is 1×; debug overlays default off. Use the tree checkpoint button for occlusion review.

## Verification

29 browser-engine host tests pass, including animated loading, four-frame cycling, idle pose,
legacy static imports and fixed pivot/collision behavior. The unchanged scenery validator passes.
32 image frames pass exact dimensions, transparent corners, unclipped bounds, uniqueness,
atlas reconstruction and deterministic byte-for-byte regeneration.
Phase 1 host core tests pass 1330 assertions; no firmware build or device access occurred.
Browser startup loaded both candidates with no asset failures. Female Nova crossed the center
seam from world (440,256) to (649,256). Male Nova was rendered behind the tree at (100,125)
and walked to (100,197), rendering in front. Normal zoom, overlays off.

## Remaining visual review

These are downsampled illustrated candidates, not hand-authored pixel-perfect production frames.
Fine face/equipment detail is lost at 32×48. Head/cape silhouettes and body proportions vary slightly
between generated poses, so baseline centering can create small lateral jitter. Gait timing,
idle pose, palette cleanup and direction-to-direction size consistency need owner review and
potential manual pixel-art refinement. The second and fourth passing poses are not identical;
distinct frame hashes prove different images, not a polished biomechanically accurate cycle.
Actual Canvas compositing was inspected to avoid mistaking transparent pixels' hidden RGB for
a visible background. No ground, tree, or road artwork was changed for this sprite milestone.
Stop before Phase 2B.
