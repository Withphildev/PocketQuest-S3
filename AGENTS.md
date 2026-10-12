# PocketQuest-S3 development handoff

Preserve the approved architecture, Phase 1 gameplay, and both Nova designs. Do not treat planned browser/settlement systems or production sprites as implemented.

After each successful firmware build intended for owner testing:

1. Run `sh tools/test-host.sh` and `python3 tools/check-build.py`. Do not deliver a failed or untested candidate.
2. Use `tools/prepare-delivery.py` to verify merged image contents/offsets and package a descriptively named `PocketQuest-S3-vVERSION[-Feature].factory.bin` plus its manifest. Supply the pinned framework's `tools/partitions/boot_app0.bin` as the verification input.
3. Provide a directly clickable local `.bin` download in the conversation, explicitly labeled **flash address 0x0000**. Report application and merged sizes, test results, significant changes, and relevant save/partition warnings.
4. The owner downloads, archives previous files in their own `old` folder, and flashes manually with ESP Launchpad. Do not manage that folder or automatically access/flash/erase the StickS3. Explicit later installation authorization is required to change this boundary.
5. Keep generated binaries/manifests out of Git. GitHub stores source and development history; experimental builds do not require a GitHub Release. Do not create a Release unless explicitly requested.

The normal merged image does not include filesystem initialization and stops before the saves partition. Do not add blank saves to routine-update images. A full erase or incompatible partition change requires a separate initialization plan and warning: the current firmware never autoformats save storage. Merged-image padding covers NVS, so do not promise preservation of all settings.

Verify hardware claims from telemetry or owner observations; report unverified behavior explicitly. Never modify the PocketLab, PocketPal, or PocketBoy reference projects.
