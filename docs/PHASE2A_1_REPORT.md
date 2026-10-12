# Phase 2A.1 — visual-calibration rig

Instruction supplement: the owner has approved [Option C — Hybrid Zelda Exploration + HD-2D Fantasy Presentation](VISUAL_DESIGN.md). This fixes the intended exploration/presentation direction while retaining provisional 512×288 dimensions and the owner-approval gate for production scenery. Recording the decision does not change prototype code or constitute visual-prototype approval.

Completed for owner review, not visual-direction approval. Browser package 0.2.1; firmware v0.1.0 unchanged. No physical device access, firmware build/flash, production artwork generation, full scenery library, RPG systems, hosted deployment, or Phase 2B work.

## Changes

Default two-block E/W forest path, with two distinct imported-reference slots, fitted overview, and optional existing follow-camera/zoom. Logical pair 1024×512, projected ground 1024×288. The existing 2×2 lab and seeded world remain available. No strict isometric switch or projection change.

Nova render scale 0.5×–2×, pivoted at the feet. Logical collision radius remains 6, speed/seed/depth unchanged. Combined debug toggle controls seams plus collision; original independent toggles remain. Debug foot ellipse is deliberately unscaled. Tree/building checkpoint buttons alternate safe behind/front positions for repeatable occlusion checks; they are explicit calibration jumps, not gameplay abilities.

External opaque directional/corner templates replace the hard-coded placeholder palette only when `templates.json` is supplied. Metadata compatibility, dimensions, opacity, and per-pixel collar checks remain enforced. Imported art remains preview-only. A reference kit crops existing engineering PNGs into authoring templates; it generates no new intended fantasy artwork. Exact requirements and projection limitations are in `VISUAL_ASSET_REQUIREMENTS.md`.

## Verification

Browser tests: **18 passed**, zero failures (12 original + 6 calibration tests). Added tests cover exact two-block arrangement, scale limits/unchanged collision/depth, safe tree/cabin checkpoints and ordering, fixed overview/follow view, renderer foot-centered transforms/debug geometry, and external-palette templates with corrupt-border/unknown-corner rejection. Phase 1 host runner: **1,330 assertions passed**. Static/self-contained build passed.

Browser-observed: two path blocks visible together; 1.5× scale label reports nominal 54 px; master debug toggle checks/unchecks both overlays. Cabin occludes Nova at `(360,330)` and Nova draws in front at `(360,410)` with an unchanged foot ellipse. Full external reference kit imports left/right manifests, ground/nav, foregrounds, and template registry successfully; both IDs appear in the two-block selector, validation passes, and warning/error logs were empty. Tree checkpoint/order safety is tested automatically; visual tree checks are recorded separately if performed. Previously verified tree occlusion from Phase 2A is not presented as new-art acceptance.

Further browser observations: imported two-block movement reached `(573,256)` in block `(1,0)` from `(440,256)` across the central seam. At tree checkpoints `(100,125)` and `(100,191)`, screenshots show canopy occlusion behind and Nova visibly in front at render scale 1.5×. These verify the current placeholder/import-kit geometry, not the intended future fantasy artwork.

World generation, navigation, and projection/depth-planning modules remain unchanged from Phase 2A. Firmware/core/original host tests remain unchanged from the Phase 1 tag. Owner's manual firmware-delivery workflow remains intact, with no binary needed for this browser milestone.

## Limitations and next review

The shipped scene still uses intentionally crude prior placeholders; it cannot approve the intended fantasy style. Owner/ChatGPT should prepare a small continuous master and separate foreground references according to the handoff before final perspective/scale approval. Template agreement does not prove that the supplied templates themselves join aesthetically; view the seam with overlays off and on.

9/16 ground compression cannot enforce artist camera, scale, slope, or lighting. No ground elevation or strict-isometric mapping. Single ground-anchor depth cannot handle all roofs/interiors/bridges; split layers remain rejected. Large visual Nova scales can overlap obstacles while feet remain logically valid. Overview fit multiplies the apparent sprite size, so compare actual follow-camera/native zoom as well.

Registry currently requires all open/road directions plus four corners, uses existing compatibility IDs, and retains 512×512 image limits. Checkpoint coordinates are authored for placeholders; imported layouts may require manual placement. No streaming/endurance/phone art-quality qualification. Self-contained artifact is verified over HTTP; direct file opening remains an owner check under the browser tool's protocol restrictions.

Recommended next step: load the two reference blocks and foregrounds, choose Nova scale, review perspective and both seam/occlusion cases, then approve or revise the provisional asset contract. Stop until owner review; Phase 2B has not started.
