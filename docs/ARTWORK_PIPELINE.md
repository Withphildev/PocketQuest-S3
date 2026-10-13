# Phase 2A.3 artwork preparation and review

This validates a deterministic preparation workflow, not production scenery. The supplied Sunlit scene remains unapproved. No Phase 2B or hardware changes.

## Reproduce

Use Python 3 with Pillow **12.3.0**. Run from the repository root:

```sh
python3 web/tools/prepare-artwork.py web/artwork-sources/recipe.json web/build/artwork --candidate
python3 web/tools/test-artwork.py
npm --prefix web test
node web/tools/build.mjs --artwork
```

Open the generated standalone `web/dist/PocketQuest-S3-Phase2A.3.html`, or serve it with `npm --prefix web run dev`. Ordinary `npm --prefix web run build` still builds the engineering prototype; illustrated assets require the explicit `--artwork` switch. Source PNGs, recipe and preparation script are also included in the downloadable preparation kit.

From the extracted kit root (without the repository), install the pinned Pillow dependency in your chosen environment, then run:

```sh
python3 tools/prepare-artwork.py artwork-sources/recipe.json prepared-again --candidate
python3 tools/test-artwork.py
```

To import kit assets manually, select PNG/JSON files from `prepared-assets` **excluding the Master PNG** when selecting both halves; alternatively select the Master and exclude both halves. Do not import the separate `assets/F002-east-west.json` recipe-base file—it is only tooling input. The supplied standalone preview already embeds the prepared assets.

## Deterministic operations / approval

The recipe records source SHA256, crop rectangles, uniform rational scales, placements, padding, and explicit crop reasons. No image generation occurs during preparation. Image generation created the one tree source beforehand; its source file is fixed and hash-checked. Non-approved recipes require `--candidate`, rather than being silently treated as approved. The `owner-approved-source` status is an author-recorded provenance claim, not software proof of owner approval; production approval always remains false in this calibration tool.

Pillow nearest-neighbor uniformly scales crop patches. A nonintegral requested scaled size fails instead of rounding X/Y independently. Crop outside source, missing crop reasons, and destinations that stretch or silently clip non-tiled patches fail. Canvas padding is explicit; tiling clips only the last partial repetition at its declared destination. The shipped texture tiles divide the destinations exactly. Inputs are never overwritten. Exact byte reproducibility has been tested twice in the same pinned runtime; Pillow/zlib differences across environments may alter compressed PNG bytes even when pixel hashes agree.

The shipped ground is deliberately **composed from sampled grass and dirt textures of the earlier ground-only generated candidate**, not a cropped conversion of the original detailed forest illustration. Grass crop [200,50,232,86] and dirt crop [200,354,232,390] are scaled by 1/2 into 16×18 patches. Grass tiles the 1024×288 canvas; dirt fills Y=[126,162). This has conspicuous repetition and abrupt road borders. These omissions/composition choices are explicitly recorded; no claim is made that the original scene or all its visual elements have been preserved. This recipe tests technical validity, not finished artistic quality.

The master is split exactly at X=512. Same-direction collars of both halves must agree before template extraction; the tool refuses conflicting templates. One shared registry describes both blocks. All eight edge and four corner PNGs are emitted; unused N/S road templates are provisional texture fixtures only, not proof of a future N/S illustrated block. Existing scenery validator remains unchanged and checks actual output against these references. Road-mask and ground band are composed from the same declared rectangle, not inferred from colors. Camera/perspective and lighting still require visual review.

This first preparation recipe/template exporter specializes in a grass base layer followed by a dirt-band layer. Arbitrary painted scenes or curved roads require explicitly authored semantic masks and shared templates using the existing importer; this script must not invent those classifications. It does not remove baked foregrounds or recover hidden ground. Do not treat any random source crop as automatically valid scenery.

## Independent illustrated tree / placement

The tree source has a complete canopy/trunk/roots and genuine alpha. Only fully transparent margins are trimmed. One uniform affine fit preserves its proportions within a 128×160 transparent canvas (maximum painted fit 112×140); the entire nonzero-alpha bounding box fits without painted clipping. Nearest-neighbor downsampling loses fine detail as expected. Alpha is preserved, not replaced with a color-key background; sampled painted pixels peak at alpha 253 in this output.

Edit `foreground` in `web/artwork-sources/recipe.json` to assign:

- `canvas` / `fit`: output pixels and maximum painted fit; do not use independent X/Y scale.
- `pivot`: [64,148] pixels, the chosen root-contact reference in the output image.
- `anchor`: [128,160] block-local world units. Its rendered ground point is [128,90] because Y=9v/16.
- `collision`: [[114,146],[142,146],[142,174],[114,174]], an authored trunk/root footprint in world units. It is not derived from alpha. Decorative root tips outside this polygon are currently walkable; owner must review whether to enlarge it.

Generated `tree-placement.json` and both manifests contain the image reference, anchor, pivot, polygon, bounds [-64,-148,128,160], and `depthRule=ground-anchor`. The placement record is independent JSON; navigation is separately stored 32×32 walkable ground data, with the polygon providing solid tree collision. Keep all collision coordinates within [48,464]; the unchanged validator rejects protected-edge obstructions, invalid bounds and unreachable spawns. Preview overlays show the polygon and anchor. Re-run preparation after edits and inspect the feet/root alignment visually; the initial pivot is an authored estimate, not detected automatically.

The same one tree is reused in each block to exercise adjacency. This is not a production forest library. Nova remains geometric female/male placeholders; no approved 32×48 sprites were supplied.

## Validation results

Four pipeline tests pass: explicit crop acknowledgment; uniform scaling/no independent rounding; non-approved source gate; byte-identical repeated preparation, exact opaque ground dimensions, exact master/half pixel reconstruction, and transparent visible tree dimensions. Existing 23 web tests pass. Phase 1 host core tests pass 1,330 assertions. The Canvas renderer, existing scenery validator, world generator, navigation and Phase 1 source remain unchanged.

Browser QA of actual prepared PNGs: exact templates/corners/navigation report no failures; move from (440,256) to approximately (611,256) crosses into block (1,0) with camera follow. At (100,125), the illustrated canopy covers Nova. Holding S moves Nova to about (100,195), where she draws in front; this is actual movement, not solely checkpoint teleporting. The collision footprint remains separate, with the same engine and previously tested polygon behavior. Screenshots document these views. A downloaded JSON validation report records the candidate status and no failures. No production-quality, hardware or approved-character-sprite test is claimed.

## Remaining art requirements

Owner must approve source artwork and the desired crop/composition before declaring an asset approved. Need less repetitive intentionally illustrated ground, softer road/grass transitions that retain exact 36-pixel connector collars, consistent atmosphere/light, approved tree scale/pivot/root collision, medium tree/rock/fence assets, and approved Nova frames. N/S transition examples and larger scene variety remain unqualified. The original Sunlit reference needs layered reauthoring if all its composition and foregrounds must be retained; this pipeline cannot reconstruct hidden ground or infer painted obstacle semantics. Stop for owner review before Phase 2B.

Tree-generation prompt (built-in imagegen, transparent_background=true):

> Use case: stylized-concept. Asset type: ONE independent transparent foreground tree for PocketQuest, not a scene or library. Generate a lush emerald fantasy oak tree with warm sunlit yellow-green highlights, rich dark green canopy, visible brown textured trunk and small roots. Match colorful detailed fantasy pixel-art Sunlit Forest atmosphere, selective HD-2D detail, elevated three-quarter parallel view, NOT strict isometric. Whole tree centered, all canopy/root tips inside image, generous fully transparent margin around every side. Base roots clearly visible at bottom center; tree trunk must remain visible. No ground patch, flowers, grass, background, characters, text, UI or cast shadow spreading beyond roots. Genuine transparent alpha background. Single illustrated tree only, readable silhouette intended for later uniform downsampling into approximately 128x160 transparent canvas. Not production-approved art.

The imagegen skill supplied only that candidate tree source. The Sites skill guided local-only preview verification. The owner-authorized deterministic crop/pad/composition pipeline is ordinary image processing, not AI image editing or library generation.
