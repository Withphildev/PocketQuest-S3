# PocketQuestMini v1.0.0

First public release of the cozy standalone PocketQuestMini, based on the owner's accepted v0.1.32 baseline. No new game mechanics in this release pass.

- Standalone motion/button combat against Slime, Wolves and Goblins, XP/leveling and persistent snapshots.
- Illustrated, continuous woodland browser journey, mandatory randomized encounters, turn-based battles, bosses, optional chests and a short safe return to Oakwood.
- Shared device-authoritative XP/level; separate browser/handheld HP. No accounts or Internet required.
- Touch, keyboard and browser-standard PS5 controls, including single/double X actions and fullscreen fallback.
- Both Nova browser appearances, higher-resolution layered breathing rest scene, original The Gentle Glade background music and Mini splash.
- Stable chip-derived Wi-Fi credentials, QR connection screen, battery display and friendly PocketQuest hostname.

## Downloads — both at0x0000

**CLEAN-INSTALL resets ALL firmware, saves and settings. UPDATE requires a working existing save filesystem and NO FULL ERASE.** See PUBLIC_INSTALLATION.md. Never use the clean file as a save-preserving update.

Release includes two merged BINs, per-image JSON manifests, SHA256SUMS.txt, installation guide, these notes, MIT license and dependency notices. GitHub automatically supplies the tagged project source. No physical flashing is performed by release tooling.

Save format5/rules4 and partitions unchanged from v0.1.32. Do not downgrade to v0.1.29 or earlier. No OTA/delta updater, cloud transfer, complete PocketQuest game or production scenery library implied. Small follow-up releases can use the UPDATE package with compatible saves.

## Build from published source

Install Python3, Node.js20+, Clang and PlatformIO. Dependencies pinned by firmware/platformio.ini. No npm packages required for the buildless browser.

```sh
python3 tools/runtime-inputs.py
python3 tools/build-hero-page.py
python3 tools/prepare-theme.py
python3 tools/build-route-page.py
npm test --prefix web
sh tools/test-host.sh
pio run -d firmware -e m5stack-sticks3
python3 tools/check-build.py
python3 tools/test-route-package.py
python3 tools/test-theme-package.py
```

Prepared raster/navigation inputs are versioned in assets/runtime with SHA256 checks; restore does not require image generation and refuses differing local artwork. Original artwork and resizing/PNG-optimization scripts remain available. Generated headers, PlatformIO output, temporary review pages, BINs and local credentials are excluded from source control.

For public packages, from a clean committed checkout, install pinned requirements in an isolated Python environment and run:

```sh
python -m pip install -r tools/requirements-release.txt
python tools/prepare-release.py --boot-app0 PATH_TO_PINNED_FRAMEWORK_BOOT_APP0_BIN --output-dir release/v1.0.0 --confirm-clean-install-package
```

This explicit flag authorizes creation of a destructive clean-install **file**, not hardware access. Source commit/dirty flag, per-segment hashes/offsets and image sizes are recorded. Routine UPDATE verifier reruns host regression/partition checks. Clean package initializes1MiB saves and2MiB assets, explicitly mounts each packaged slice and exercises a98-byte two-slot write/read/remount on disposable copies. It writes exactly8MiB; artwork/audio remain app-resident. An independent clean checkout build is required before publication.

## Tests and limits

133 browser tests and8,357 core assertions, animation bounds and C++/JS parity tests form the accepted baseline. Release packaging checks are additional. Owner verified prior game/music/controller/touch/rest behavior on their setup; the new clean-install package is host-verified, not newly hardware-flashed by the agent. Browser restrictions, initial hotspot load time, MP3 loop gap and system-controlled iOS volume remain documented limitations.

The application remains under the4.5MiB engineering ceiling inside its4.875MiB partition, leaving roughly451KiB physical app headroom. Artwork+browser model exceeds the75% review threshold of the separate2MiB asset partition; current assets/audio are embedded in the app, not duplicated there. No partition change or quiet quality reduction. Avoid additional large assets without a new storage review. Exact release measurements and checksums are in the attached manifests.
