# PocketQuestMini — naming update

Follow-up v0.1.21: owner has now supplied the replacement Mini splash without Pip; it is integrated using the existing uniform LCD export. The pending-art wording below records the v0.1.20 transition, not the current splash. See FIRMWARE_V0_1_21.md.

Owner approved 2026-10-15. Existing GitHub repository renamed in place to https://github.com/Withphildev/PocketQuestMini-S3 (repository ID 1415043378, public, default branch main); local origin updated. No repository split, history reset, source push or GitHub Release.

Current browser titles/header, saved-hero dashboard, handheld text headers, serial banner, README and future routine delivery filenames use PocketQuestMini. Version 0.1.20 distinguishes the changed build. The local checkout, core library/namespace, historical reports and source artwork filenames retain their existing names to avoid breaking references.

Compatibility preserved: format 3/rules 4, snapshot filenames/magic, partitions, device-derived PocketQuest-XXXX SSID / QuestXXXXXXXX password, http://PocketQuest, APIs, combat rules, progression and all artwork pixels. No physical device access or flashing. Existing completed route stays cleared.

The owner is preparing replacement splash artwork titled PocketQuest Mini without Pip. The current splash remains intact until supplied; this build is a transitional text rebrand, not a new-art release.

Future routine delivery: PocketQuestMini-S3-vVERSION[-Feature].factory.bin, flash at 0x0000 without full erase. Do not downgrade format-3 saves to v0.1.13 or earlier. Normal factory images omit save/asset filesystem initialization; NVS padding may overwrite unrelated settings.

The approved endless-journey design (randomized encounters/bosses/chests, highest-road-tier-minus-one new outing, retained XP, short safe home path) and PocketBoy-style controller fullscreen remain future work. This naming change implements none of those systems.
