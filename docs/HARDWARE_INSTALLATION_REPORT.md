# Phase 1 clean installation — validation in progress

Firmware: PocketQuest v0.1.0, application binary 651,936 bytes. Existing build passed; 1,330 host assertions passed. This report supersedes the earlier report's pre-installation status, but does not imply physical gameplay acceptance.

## Target identification and destructive action

The owner explicitly authorized a full wipe of the dedicated development StickS3 and then connected it in flashing mode. Exactly one ESP USB serial device appeared (VID:PID 303A:1001); its port and identity were positively checked before the wipe. Device-specific port/MAC/serial identifiers are omitted from this public report. Esptool identified ESP32-S3-PICO-1 revision v0.2, 8 MiB embedded flash, 8 MiB embedded PSRAM, 40 MHz crystal, quad flash at 3.3 V. Detected flash manufacturer/device: 20/4017. This matches the connected owner-identified StickS3; chip identity alone is not independent evidence of every board peripheral.

Before erasing, the installed partition table was read at 0x8000:

| Old partition | Offset | Size |
| --- | --- | --- |
| nvs | 0x9000 | 0x6000 |
| factory | 0x10000 | 0x4E0000 |
| spiffs | 0x4F0000 | 0x300000 |
| coredump | 0x7F0000 | 0x10000 |

The exact target and old layout were reported before the erase. Full flash erase succeeded in 5.4 seconds. Previous firmware, application data, and filesystems were removed as authorized. No full-flash backup was taken because the owner explicitly waived preservation; the old partition-table read is not a recoverable firmware/save backup. No other connected device was modified.

## Installation results

Esptool v5.3.0 wrote and verified all three regions on this port:

- 0x000000: merged factory firmware, 717,472 bytes; hash verified.
- 0x4F0000: initialized empty LittleFS saves, 1,048,576 bytes; hash verified.
- 0x5F0000: initialized empty LittleFS assets, 2,097,152 bytes; hash verified.

Physical readback of the installed partition table matches the approved partition binary byte-for-byte (3,072 bytes). New layout: NVS 24 KiB; application 4,992 KiB; saves 1,024 KiB; assets 2,048 KiB; coredump 64 KiB; ends at 8 MiB. Application headroom by binary size: 4,459,872 bytes. Initialized filesystem images have been written successfully, but their runtime mounting has not yet been observed.

## Serial observation after flashing

```text
ESP-ROM:esp32s3-20210327
Build:Mar 27 2021
rst:0x15 (USB_UART_CHIP_RESET),boot:0x0 (DOWNLOAD(USB/UART0))
Saved PC:0x40041a79
waiting for download
```

The automatic reset left the unit in download mode. No PocketQuest runtime diagnostics were received yet. The owner has been asked to restart normally with flashing-mode controls released. A final partition readback also left the unit in bootloader mode; normal restart is still required.

## Hardware validation status

- Verified: detected 8 MiB flash, chip-reported embedded 8 MiB PSRAM, successful erase/write hashes, physical partition-table readback.
- Pending: actual runtime PSRAM initialization/free usage, internal heap, mounted filesystem usage, firmware runtime size report, LCD initialization/orientation, splash, player/slime rendering, BMI270 initialization/readings, physical buttons, gentle swing threshold/cooldown, HP/XP/leveling, save creation and restart restoration.
- No physical gameplay tests are claimed as passed. Host tests are not substitutes for these checks. Display/motion/button verification requires owner observations or recordings in addition to serial telemetry.

Both Nova protagonists are preserved in `CHARACTERS.md`; the installed prototype retains the permitted placeholder player and has no selection UI yet.

Next step: normal boot, serial diagnostics, owner-assisted display/button/motion tests, then save/restart validation. No additional erase is needed just to exit download mode.

## Normal boot follow-up

The owner reported that holding the flashing button enabled normal boot, and confirmed the PocketQuest splash and temporary player sprite appeared. This establishes visible startup by owner observation; slime rendering, text/orientation quality, and physical gameplay are not yet confirmed. The reported button sequence differs from the expected release-and-restart instruction and should be clarified during power-control testing.

Live serial subsequently reported:

```text
rst:0x15 (USB_UART_CHIP_RESET),boot:0x2b (SPI_FAST_FLASH_BOOT)
Motion threshold 0.40g; cooldown 650 ms
PocketQuest v0.1.0 | chip ESP32-S3 rev 2 | physical flash 8388608 bytes
App image 651936 bytes, heap free 332392, internal free/largest 332392/278516, PSRAM total/free 8388608/8319004
Display 240x135 IMU type 6 enabled 1 RTC enabled 0 reset 11 FS 8192/1048576
Partition nvs @0x009000 size 0x006000
Partition factory @0x010000 size 0x4e0000
Partition saves @0x4f0000 size 0x100000
Partition assets @0x5f0000 size 0x200000
Partition coredump @0x7f0000 size 0x010000
```

Runtime confirms initialized 8 MiB PSRAM (8,319,004 bytes free), 332,392 bytes free internal heap with largest block 278,516 bytes, landscape display dimensions 240 × 135, and enabled BMI270 (M5Unified IMU enum 6). Saves LittleFS mounts with 8,192 bytes used out of 1,048,576. Assets were flash-verified but are not mounted by this prototype. These are point-in-time readings, not a memory-leak endurance test. RTC reports unavailable, consistent with not relying on it for offline progression.

Button/motion combat and state restoration after a verified gameplay checkpoint still require owner-assisted testing. Filesystem mount and usage alone do not prove save contents or restored XP/HP.

## Owner-assisted gameplay acceptance

After the requested button-combat, two-victory leveling, checkpoint/restart, and gentle-swing checks, the owner reported that it was working. Asked specifically whether both button attacks and gentle swings worked and whether Level 2 / 24 XP remained saved after restarting, the owner confirmed: "it did".

Record as owner-verified passes: physical button attacks, gentle motion attacks, encounter/victory progression to Level 2 / 24 XP, and restoration of that level/XP after restart. These results were reported by the person operating the device, not independently measured through captured combat telemetry. Splash and placeholder player were separately confirmed earlier.

The first playable hardware smoke test is accepted on that evidence. Exact cooldown timing, HP damage/defeat behavior, false-positive rates during walking/pocket movement, all threshold presets, prolonged memory stability, physical power-cut save recovery, and detailed visual/orientation quality remain unverified. Do not infer exhaustive hardware acceptance from this smoke test.

No further flashing or erasing is required for these confirmed checks. Next development review can prioritize motion tuning and the small scenery seam/navigation prototype while preserving the approved full-game scope and both Nova character designs.
