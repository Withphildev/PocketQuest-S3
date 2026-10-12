# PocketQuest — official exploration style

Owner-approved decision, recorded 2026-10-11: **Option C — Hybrid Zelda Exploration + HD-2D Fantasy Presentation**.

This is the project's visual/gameplay direction, not a claim that production art, lighting effects, or the final presentation are already implemented. It supplements the Phase 0 baseline and Phase 2A.1 calibration instructions; it does not authorize a renderer redesign or Phase 2B.

## Approved direction

- **Movement:** classic Zelda-style four-direction exploration, smooth camera following, and intuitive navigation.
- **Visuals:** elevated three-quarter fantasy pixel art, enhanced selectively with HD-2D-inspired lighting, depth, and atmosphere.
- **Rendering:** Canvas 2D with prerendered scenery blocks. No 3D engine.
- **Characters:** chibi proportions, readable silhouettes, and consistent world scale. Support both Nova (Female), long indigo-purple hair, and Nova (Male), short tousled indigo-purple hair. Their equipment, abilities, and progression remain shared.
- **Scenery:** detailed illustrated ground layers, with separately anchored foreground trees, buildings, rocks, and other objects for collision and depth ordering.
- **Perspective:** avoid strict isometric projection and a finished world that looks completely overhead. Ground-coordinate math alone does not establish the artistic viewpoint; representative artwork must demonstrate it.

Selective atmosphere should support readability, not conceal incompatible seams, incorrect scale, or navigation problems. The HD-2D influence is a presentation target within the existing 2D architecture, not permission to replace it with a 3D pipeline.

## Visual-calibration acceptance gate

Use the upcoming representative two-block forest artwork in the existing calibration rig to verify:

1. Four-direction exploration, intuitive navigation, and smooth camera following.
2. Chibi Nova scale/silhouette relative to the path, trees, and buildings, for both protagonists.
3. Correct behind/in-front depth ordering with independently anchored foregrounds.
4. Continuous scenery connections and movement across the block boundary, with debug overlays both hidden and visible.
5. Elevated three-quarter presentation and restrained lighting/atmosphere at intended viewing sizes.

The current **512×288 ground dimensions remain provisional pending visual calibration**. The 512×512 footprint and 9/16 compression remain the current engineering test contract, not final artistic approval. If representative art exposes a mismatch, present a proposed contract change for owner review rather than silently switching perspective or warping artwork.

Preserve all working Phase 1 firmware and Phase 2A functionality. The shipped placeholders demonstrate the rig, not the selected finished style. Owner/ChatGPT reference-art preparation is distinct from production-library generation: **do not begin production scenery generation until the owner explicitly approves the visual prototype**.

See [artwork handoff requirements](VISUAL_ASSET_REQUIREMENTS.md), [calibration report](PHASE2A_1_REPORT.md), and [Nova specifications](CHARACTERS.md). Stop for owner review before Phase 2B.
