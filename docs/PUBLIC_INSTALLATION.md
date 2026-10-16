# PocketQuestMini-S3 installation and updates

Only for the M5Stack StickS3, 8 MiB flash / 8 MiB PSRAM. Not StickC, StickC Plus, other S3 boards or a PS5-connected ESP32. Never flash another connected board accidentally. The PS5 controller pairs with the browser device instead.

## Choose the correct image

Both merged images flash at **0x0000**. Do not flash a merged factory image at0x10000. Compare the file SHA256 against release SHA256SUMS.txt before flashing.

- **CLEAN-INSTALL:** for a new/erased device or intentional reset. Writes the entire8MiB, replacing previous applications, saves, filesystems and settings. Contains initialized empty saves at0x4F0000 and empty assets at0x5F0000. Current artwork, browser and music are inside the application, not the empty asset partition. This package alone is sufficient after an erase; do not follow it with the update image.
- **UPDATE:** for a working PocketQuestMini/PocketQuest installation with this exact partition table. Stops before saves at0x4F0000; no blank filesystem image included. **Do not enable full erase.** NVS lies within merged padding and settings there may reset. Game snapshots in the dedicated saves region remain untouched. This cannot fix `NO SAVE FS` after a full erase; only a clean installation can recreate it, losing previous progress.

If preserving progress matters and you are unsure of the installed layout, do not flash until you have checked it. There is no in-game save backup/export feature. Use caution with third-party flash tools: an erase-all operation destroys saves regardless of the chosen file. No OTA updater is included; small future updates are versioned manual flash packages, not binary delta patches.

## Manual flashing

1. Download exactly one appropriate factory BIN from this repository's GitHub Release and verify its checksum.
2. Connect only the intended StickS3 and put it in download/flashing mode using the device's documented procedure.
3. In your ESP Launchpad/manual serial flashing tool, select that port, choose the BIN and address **0x0000**. For UPDATE, disable full erase. CLEAN-INSTALL is destructive even if full erase is disabled because it writes every flash region.
4. Flash, then restart normally. Do not hold the download-mode control during normal boot.
5. Check the2.5-second splash, device-specific Wi-Fi information, QR screen and mini-game. M5 cycles Wi-Fi→QR→mini-game. Face starts/attacks; gentle deliberate motion also attacks in the mini-game.
6. Join the displayed Wi-Fi from your phone/tablet/computer. A hotspot with no Internet is expected; remain connected. Open `http://PocketQuest` or fallback `http://192.168.4.1`, then Play woodland adventure. Reload the page after every firmware update.
7. Check that existing XP/progress remain after an UPDATE and a normal restart. A clean installation begins a new hero. The firmware deliberately does not autoformat a damaged/missing save filesystem.

Optional installed esptool5.x example, replacing `YOUR_SERIAL_PORT` with the positively identified StickS3 port:

```sh
esptool --chip esp32s3 --port YOUR_SERIAL_PORT write-flash 0x0000 PocketQuestMini-S3-v1.0.0-UPDATE.factory.bin
```

No erase-all step for updates. The command does not upload any filesystem separately. Substitute the CLEAN-INSTALL filename only when you intentionally accept complete data loss.

## Play and compatibility

Touch/keyboard controls work without a controller. A browser-standard PS5 gamepad maps single X=Attack, double X within250ms=Power Strike, Circle=Guard, Square=Run, Triangle=Potion. D-pad/stick move Nova in exploration only; L1/R1 change living target, L2 toggles fullscreen. X also engages/opens nearby chests outside battle. Some browsers require a secure context or user gesture for gamepads, audio or native fullscreen; fallback controls remain available. iOS volume may be system-controlled.

The Gentle Glade downloads from the StickS3 only after Enable music. It continues through exploration/battles/Oakwood; leaving/backgrounding pauses until resume. The first download may take time. One audio transfer is served at a time; another listener may need to retry. The original MP3 loop is not guaranteed gapless.

Progression is device-authoritative. Browser/handheld HP are separate but XP/level are shared. Browser battle pauses handheld combat. Exact walking position and chosen appearance are not saved. Save format5 reads formats1–4; **do not downgrade to v0.1.29 or earlier after new writes**. No cloud account, cross-device save transfer or full PocketQuest XP export is implemented.

The MAC-derived SSID/password are stable per chip but predictable, not strong security secrets. The local hotspot is not intended for untrusted/shared networks. Never post your device's actual password/serial diagnostics in a public bug report.

## Verification scope

Owner accepted the game through v0.1.32 on their hardware/browser. v1.0.0 changes release/version labeling and packaging, not game rules. The clean image has deterministic host-generated filesystems, explicit mount/read/write/remount tests and byte/offset checks. The agent did not physically erase or flash a device for this release; fresh v1.0.0 installation and other phone/browser combinations are not claimed hardware-tested.
