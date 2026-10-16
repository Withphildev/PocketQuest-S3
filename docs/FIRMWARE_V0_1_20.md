# v0.1.20 — PocketQuestMini rebrand

GitHub repository renamed in place to https://github.com/Withphildev/PocketQuestMini-S3, verified public/main with the same repository ID 1415043378. Local origin updated; existing Git history retained. No source commit/push or GitHub Release this turn. Prior uncommitted development work remains intact and is included in the local firmware build; repository rename alone does not publish it.

Browser route/dashboard titles and headers, handheld text headers and serial banner now use PocketQuestMini. Wi-Fi information header retains large PocketQuest text with smaller Mini suffix (ending x162 before battery x174); battle header fits at native font size. Sites skill used for local browser branding only; no hosted deployment. Source/package/header checks were automated; no new visual browser or physical-device test was performed.

The original splash still includes Pip and the old title, pending the owner's replacement image. No art generated, altered or removed. Historical reports and working checkout outputs/PocketQuest retain their original paths. Core library remains PocketQuestCore for compatibility. Future routine delivery names use PocketQuestMini-S3.

## Download and compatibility

PocketQuestMini-S3-v0.1.20-Rebrand.factory.bin — flash at **0x0000 without full erase**. SHA256: `3e6fd573416219af2d6aa0e2edad942ad299668f4cac91ff7b120e9b160f8bde`.

Save-preserving routine update from v0.1.14–19, not a clean-install initializer. Format 3/rules 4, snapshot files, partitions, combat, XP/progression, Wi-Fi SSID PocketQuest-XXXX / password QuestXXXXXXXX and http://PocketQuest are unchanged. Do not downgrade to v0.1.13 or earlier. Verified bootloader 0x0000, partition table 0x8000, boot_app0 0xE000, application 0x10000 with source-byte/hash/padding checks. Image ends before saves 0x4F0000/assets 0x5F0000; no filesystem images. NVS padding can overwrite unrelated settings. No device accessed, flashed or erased.

## Four storage measurements

| Measurement | Bytes |
| --- | ---: |
| Application BIN | 2,755,344 (2.63 MiB) |
| Factory BIN with padding | 2,820,880 (2.69 MiB) |
| Illustrated stored asset payload model | 1,220,220 |
| Illustrated modeled filesystem | 1,531,904 / 2,097,152 (73.05%) |
| Model with engineering fixtures | 1,581,056 (75.39%) |

Illustrated model free 565,248 bytes, with fixtures 516,096; fixture-inclusive 75% review warning remains active. This is a future filesystem model, not physical usage: current assets are embedded in application, not separately installed into the asset filesystem. Application partition headroom 2,356,464 bytes; separate unchanged 2816 KiB engineering ceiling headroom 128,240. Browser gzip 1,167,692 bytes, 105 assets. Static RAM 52,768 bytes, not measured runtime heap/PSRAM.

## Validation

Firmware build PASS. 73 browser tests PASS; 3,284 sanitized core assertions PASS; animation trajectory/timing and 48 actual-C++/browser intent parity cases PASS. Hero JSON/restart/unsaved handling, legacy Wi-Fi/friendly URL, battery/header bounds, current gzip/package/application payload, merged-image and version/partition checks PASS. Rebrand-specific test verifies Mini titles, legacy credentials/URL and future filename convention. git diff --check PASS. Existing save/core/gameplay implementation not changed by the rebrand.

Browser review file PocketQuestMini-v0.1.20-Review.html is an isolated fresh offline demo, not real device progression. Endless road, random encounters/bosses/chests, new outing difficulty persistence and controller fullscreen remain future work. Owner hardware/phone review pending.
