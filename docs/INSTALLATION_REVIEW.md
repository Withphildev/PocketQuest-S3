# Installation review — STOP before device writes

No device has been flashed, erased, repartitioned, or otherwise modified by this work. The owner must approve installation separately. These are review notes, not an instruction to run an upload now.

## Before requesting installation approval

1. Identify the exact connected StickS3 and serial port. Confirm ESP32-S3, physical flash capacity, and current firmware identity using read-only inspection.
2. Back up the full flash to an owner-approved local location, record its SHA-256 and device identity, and verify the backup is readable. Preserve any existing project saves and explain that changing the partition table can make them inaccessible.
3. Read back the current partition table at 0x8000 and compare its addresses, sizes, and labels with `firmware/partitions.csv`. Do not infer the installed layout from this build or a reference repository. A layout change requires explicit approval for that change, not just routine app replacement.
4. Decide whether this is a first installation or an update of an already compatible PocketQuest installation. Confirm exactly which flash regions will be written and whether save initialization is necessary.
5. Present the verified backup, differences, exact binaries/offsets, and preservation plan to the owner. Wait for approval before any write, upload, format, erase, or partition change.

## Review artifacts

| Binary in `release/` | Intended address | Meaning |
| --- | --- | --- |
| `PocketQuest-v0.1.0.app.bin` | 0x10000 | Application only; suitable for an approved update after confirming compatible layout |
| `PocketQuest-v0.1.0.bootloader.bin` | 0x000000 | Bootloader; not a routine save-preserving app update |
| `PocketQuest-v0.1.0.partitions.bin` | 0x008000 | New partition table; can change interpretation of existing flash |
| `PocketQuest-v0.1.0.factory.bin` | 0x000000 | Merged bootloader/table/boot_app0/application image, including padded gaps |
| `PocketQuest-v0.1.0.empty-saves.bin` | 0x4F0000 | Exactly 1 MiB empty LittleFS image; destructive to all contents of that save partition |

The factory image does **not** include saves or assets. Its padded gaps can overwrite old NVS; never treat it as an ordinary app update. Its name does not imply a complete 8 MiB image. Do not erase the chip as a default installation step.

The empty-save image is for an explicitly approved first initialization only. Never write it on a normal update or over existing saves. LittleFS block size is 4096 bytes. Local image inspection succeeded, but compatibility with the firmware's LittleFS mount must still be verified on hardware. If mounting fails, firmware reports `NO SAVE FS` and remains unsaved; it does not format automatically.

## Physical acceptance checklist after approval

- Check startup log: flash 8,388,608 bytes; PSRAM total 8,388,608 bytes; landscape display 240 × 135; BMI270 detected. Capture actual partition addresses and memory readings.
- Check splash, idle animation, text clipping, color, orientation, frame stability, and direct-display fallback. Canvas payload is 64,800 bytes; actual allocation overhead/location must be measured.
- Face button starts a slime encounter and attacks on release. Holding buttons must not repeat attacks; an M5 long press must not also toggle diagnostics. Verify GPIO11/12 behavior on this unit.
- Test stillness, walking, slow tilt, pickup, pocket movement, gentle swings, and fast/forceful movement across Light/Normal/Firm presets. Record misses and false positives. Do not require forceful shaking; prefer the button if gentle motion is unreliable. Use a wrist strap and avoid swinging near people or objects.
- Confirm shared 650 ms cooldown, clear hit feedback, 18-HP slime, player damage, defeat/retry, victory XP, and level-up after two victories.
- Confirm first initialization writes both snapshots, reboot restores HP/XP/encounter/seed/preset, and subsequent writes alternate slots. Observe `UNSAVED` until a successful checkpoint.
- Verify mounted filesystem usage and free space; neither assets nor other partitions should change during gameplay. Test repeated sessions for heap/PSRAM loss.
- On a backed-up disposable test state only, test interruptions around checkpoints and corruption of one snapshot. Recovery must retain a valid snapshot and avoid duplicate rewards. Test both-bad and unsupported saves remain preserved/read-only. Host byte-cut tests are not physical power-cut proof.
- Test absent/unformatted filesystem, unavailable IMU, and simulated write failures. Confirm visible errors and working button combat. Write failures currently retry no faster than 1.5 seconds; observe this during fault testing before deciding whether a longer backoff is needed.
- Verify USB reconnect, battery/power-button behavior, restart, and normal app-only update preserves saves. No elapsed-time progression is promised in this prototype.

Do not approve broad production-art generation or full browser development from firmware compilation alone. Scenery still needs the proposed seam/navigation visual prototype and owner camera/scale review.
