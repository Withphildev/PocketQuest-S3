# PocketQuest-S3 development handoff

Preserve the approved architecture, Phase 1 gameplay, and both Nova designs. Do not treat planned browser/settlement systems or production sprites as implemented.

Phase 2A.2 delivered the authorized functional-integration fallback, not a playable illustrated Sunlit environment. See `docs/PHASE2A_2_REPORT.md` and `docs/SUNLIT_ASSET_REQUEST.md`. Option A locks the existing calibration dimensions and 36-pixel connector for this milestone. The generated ground candidate failed dimensions; engineering fixtures must never be represented as illustrated/approved scenery. Master splitting and optional static Nova imports must preserve exact geometry; do not weaken validation. Stop before Phase 2B.

## Approved exploration style and Phase 2A.1 gate

The owner approved **Option C: Hybrid Zelda Exploration + HD-2D Fantasy Presentation**. Follow `docs/VISUAL_DESIGN.md`: classic Zelda-style four-direction exploration, smooth camera following, intuitive navigation; elevated three-quarter fantasy pixel art with selective HD-2D-inspired lighting/depth/atmosphere; chibi Nova protagonists with readable silhouettes and consistent world scale.

Retain Canvas 2D and prerendered scenery blocks, detailed illustrated ground, and separately anchored foreground objects. Do not introduce a 3D engine, switch to strict isometric projection, or make the finished world look completely overhead. Preserve the existing Phase 1 firmware and Phase 2A systems.

Use the representative two-block forest prototype to review movement, character scale, depth ordering, and seamless connections. 512×288 scenery dimensions remain provisional pending visual calibration. Production scenery generation requires explicit owner approval of the visual prototype; the accepted technical foundation and style decision are not that approval. Stop for review before Phase 2B.

After each successful firmware build intended for owner testing:

1. Run `sh tools/test-host.sh` and `python3 tools/check-build.py`. Do not deliver a failed or untested candidate.
2. Use `tools/prepare-delivery.py` to verify merged image contents/offsets and package a descriptively named `PocketQuest-S3-vVERSION[-Feature].factory.bin` plus its manifest. Supply the pinned framework's `tools/partitions/boot_app0.bin` as the verification input.
3. Provide a directly clickable local `.bin` download in the conversation, explicitly labeled **flash address 0x0000**. Report application and merged sizes, test results, significant changes, and relevant save/partition warnings.
4. The owner downloads, archives previous files in their own `old` folder, and flashes manually with ESP Launchpad. Do not manage that folder or automatically access/flash/erase the StickS3. Explicit later installation authorization is required to change this boundary.
5. Keep generated binaries/manifests out of Git. GitHub stores source and development history; experimental builds do not require a GitHub Release. Do not create a Release unless explicitly requested.

The normal merged image does not include filesystem initialization and stops before the saves partition. Do not add blank saves to routine-update images. A full erase or incompatible partition change requires a separate initialization plan and warning: the current firmware never autoformats save storage. Merged-image padding covers NVS, so do not promise preservation of all settings.

Verify hardware claims from telemetry or owner observations; report unverified behavior explicitly. Never modify the PocketLab, PocketPal, or PocketBoy reference projects.
