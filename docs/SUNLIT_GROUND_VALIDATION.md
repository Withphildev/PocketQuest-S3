# Sunlit ground validation — technical pass, visual review pending

The corrected pair passes the **unchanged** scenery validator and loads into the normal Canvas renderer, not the diagnostic sandbox. Master remains 1024×288, halves 512×288, world footprints 512×512, projection x=u/y=9v/16, mask 10, and E/W connector Y=[126,162). No stretching, resizing, mirroring or new scenery generation was performed. The original candidate and fantasy tree source remain preserved.

## Bounded artwork correction recipe

`web/tools/validate-sunlit-ground.py` performs deterministic, explicitly recorded 1:1 crop/paste composition:

- Use the existing continuous center strip X=[480,544) as the shared E/W collar source. Its inner split remains the original X=512 split. Copy its west/east directional halves to the outer borders so both blocks share the same respective socket templates.
- Replace surplus dirt at Y=[94,126) with unscaled grass sampled from center-strip Y=[62,94), and Y=[162,192) with grass from Y=[194,224). Preserve original dirt pixels inside Y=[126,162). This narrows only the outer/center connection regions; interior road retains its broad appearance.
- Blend the corrected shoulders through 16-pixel transitions immediately outside protected E/W collars. No image geometry is resampled; blending changes colors, not coordinates.
- Reauthor the N/S 18-pixel protected strips with repeated unscaled grass/flower patch [500,60,516,78), plus eight-pixel internal transitions. This removes collision-incompatible border terrain and gives both blocks matching directional/corner pixels. Shared corners have the same sampled pixel phase.
- Split once at X=512 and extract one shared registry only **after** authoring compatible pixels. The exporter refuses conflicting same-direction strips. All eight edge and four corner references are emitted. Unused road N/S references remain format-required swatches, not additional approved scenes.

The source SHA256 is `4ca78c584c32a61ff80b32ed390c2294760c93559b0d958f49f83b806d0c0ed5`. **76,279 / 294,912 pixels (25.9%) changed**. The rest stays pixel-identical. Border replication, visible texture repetition and shoulder blending are real artwork changes and require owner review; this is not a claim that the source is entirely unchanged or artistically finished. The continuous center split passes exact pixel reconstruction, and no artificial divider is added. Visual continuity beyond exact seam agreement still needs owner judgment.

## Collision / raised terrain

The existing fantasy tree PNG is byte-identical, with pivot [64,148], anchor [128,160], and its independent trunk/root polygon. Its canopy remains an independent ground-anchor-sorted foreground layer. The same tree is reused in the second block; no new tree artwork was generated.

Major visible boulder groups and the bottom mossy ledge are treated as **blocked terrain**, not pretend transparent cutouts. Hand-authored projected envelopes are in `ground-preparation-report.json`; overlapping 16×9 projected navigation cells are blocked conservatively. The first/last two grid rows and columns remain passable after collar ground corrections. Tree collision is separate metadata, never inferred from alpha. Interior rocks block movement; the wider road and tested behind/front route remain reachable.

This gives technically valid, conservative collision—not pixel-perfect artistic approval. Blocking full visible envelopes may reject some grass near rocks. Decorative grass/flowers remain traversable. The scene has no implemented elevation/climbing. **Baked rocks do not occlude Nova as foreground layers.** Their conservative envelopes prevent entering/approaching their painted faces closely, but cannot guarantee every scaled sprite overlap looks ideal. True walk-behind rocks or cliffs require individual transparent exports plus newly illustrated, uncovered ground beneath them; that work cannot be reconstructed reliably from this flattened source. It remains explicitly outstanding, rather than claiming all raised-object occlusion is solved.

The semantic road mask has exact connector bands; its wider interior band is a hand-authored approximation, not automatic painted-dirt recognition. Collision does not depend on that mask. Keep the existing source art and review the mask/terrain envelope alignment using debug overlays before approving final gameplay metadata.

## Validation and browser observations

`node web/tools/test-prepared-ground.mjs web/build/validated-ground` passes:

- Both assets and the two-block layout through unchanged scenery validator.
- Exact protected border/corner templates and road-mask opening.
- Pixel-exact master reconstruction from the two halves.
- Movement (440,256) → (640,256) across center boundary.
- Known boulder point and tree trunk block movement; behind/front points remain legal.
- Tree depth ordering flips correctly behind/front.

The regular host web suite passes **26 tests**. Phase 1 host core suite passes **1,330 assertions**. Build succeeds. A test-entry syntax error and an overly strict floating-point equality in the new movement test were corrected before these passing results; the scenery validator was not changed.

The normal browser preview starts with **1× camera zoom**, character render scale 1.5×, camera following, and all debug overlays **off**. Nova remains the labeled geometric female/male placeholder; production sprites are unavailable. Browser verified valid-scene status, movement from block (0,0) at (440,256) into block (1,0) near (640,256), and actual movement from behind the tree (100,125) to in front (100,195). These are regular-engine movement tests, not the prior opt-in sandbox. JSON report downloaded with no validation failures. Rock collision is verified by host tests; exhaustive physical visual/collision inspection is not claimed.

## Reproduce / import

Using the existing pinned Pillow runtime:

```sh
python3 web/tools/validate-sunlit-ground.py SOURCE-CANDIDATE.png web/build/artwork web/assets/F002-east-west.json web/build/validated-ground
node web/tools/test-prepared-ground.mjs web/build/validated-ground
node web/tools/build.mjs --ground-validation
```

The prior tree-preparation folder supplies the unchanged tree and placement file. Use the standalone `PocketQuest-Sunlit-Validated-Ground.html` for owner review. The asset ZIP contains ground master/halves, exact registry/reference PNGs, tree, placement, navigation and reports. For manual import, select halves **or** master, not both; select all other required PNG/JSON files. Do not include source candidates in the import.

The Sites skill guided local-only browser verification. Renderer, world generator, navigation implementation, validator, firmware, saves and physical StickS3 are unchanged. No GitHub publication, production library or Phase 2B. Stop for owner review of the border edits, collision conservatism, tree scale and remaining raised-object artwork.
