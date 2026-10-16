# Manual development firmware delivery

For the owner-authorized v1.0.0 public release, see [public installation](PUBLIC_INSTALLATION.md) and [release reproduction](RELEASE_V1_0_0.md). That explicit release authorization permits publishing this milestone only; experimental builds still follow the local/manual workflow below. Current saves are format5/rules4, migrating formats1–4; no downgrade to v0.1.29 or earlier. Older format notes below are historical.

The owner uses ESP Launchpad to download/archive/flash test builds manually, matching the PocketPal-S3 merged-image workflow. Source history lives on GitHub; development binaries are supplied directly in the Codex conversation, not automatically uploaded as GitHub Releases. No automatic hardware flashing is part of a build.

Each new delivery uses `PocketQuestMini-S3-vVERSION[-Feature].factory.bin`, **flash address 0x0000** (not 0x10000), with firmware size, significant changes, automated test results, and any known limitations. Historical PocketQuest-S3 packages retain their names. The owner manages their own `old` archive folder. Never silently replace an archived name with different contents.

## Build, test, verify, package

```sh
cd firmware
pio run -e m5stack-sticks3
cd ..
python3 tools/prepare-delivery.py --version 0.1.0 \
  --boot-app0 "$HOME/.platformio/packages/framework-arduinoespressif32/tools/partitions/boot_app0.bin"
```

Adjust the read-only framework input path if PlatformIO uses a different core directory. The delivery tool reruns host tests and compiled partition/budget checks, then compares every merged segment byte-for-byte with its source: bootloader 0x0000, partitions 0x8000, boot_app0 0xE000, application 0x10000. It verifies erased-value padding, image endpoint before saves, copied artifact SHA-256, and version labeling. The JSON manifest records actual source commit/dirty status and segment offsets/hashes. It does not rebuild firmware itself: run the build immediately before packaging, without modifying source in between.

`release/` is ignored by Git. Link the resulting binary directly in the conversation and repeat **flash address 0x0000** with every download. A local build artifact is not an endorsement for another ESP32 board. Target is M5Stack StickS3 only.

## Save preservation and clean installation

v0.1.22 writes format 4 / rules 4 and reads formats 1/2/3. Do not downgrade to v0.1.21 or earlier after new saves. This is a format migration, not a repartition or reason to erase. See SAVE_FORMAT.md and FIRMWARE_V0_1_22.md.

The normal merged image contains no blank saves or asset filesystem; appending those to every update would erase progression. With the same PocketQuest partition layout and no full-chip erase, the image ends before the saves partition. Existing saves can therefore remain in place, subject to save-format compatibility. Padding does overwrite NVS; this is not a promise to preserve all settings.

An ESP Launchpad full-erase option destroys the save filesystem. First installation, a changed partition layout, or an intentionally erased device needs separately prepared filesystem images and explicit instructions; the current firmware will otherwise show `NO SAVE FS`. It does not autoformat. Do not claim that the routine factory file alone supports a clean-erased first installation. See `INSTALLATION_REVIEW.md` for offsets and risks.

The v0.1.0 delivery is the existing owner-verified Phase 1 baseline. Adding this packaging workflow does not implement Nova sprites, character selection, the browser RPG, or any Phase 2 feature.
