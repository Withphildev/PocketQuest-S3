# PocketQuestMini v0.1.31 — The Gentle Glade test build

Owner-authorized test integration; not a production release. Sites workflow used locally for the browser changes, without hosting/publication. No physical device accessed, erased or flashed. No Git push or GitHub Release.

## Delivery

PocketQuestMini-S3-v0.1.31-Gentle-Glade.factory.bin, flash at **0x0000** using ESP Launchpad. **Do not full-erase for this update.** Existing initialized saves are required; this is not a clean-install filesystem package. The contiguous image ends at 0x436A00, before saves at 0x4F0000; no saves/assets filesystem included. NVS padding is included, so this does not promise preservation of NVS settings. Bootloader0x0000, partitions0x8000, boot_app00xE000, app0x10000 verified byte-for-byte against merged image. Save format5/rules4 and partitions unchanged. Do not downgrade to v0.1.29 or earlier after format5 writes.

Factory SHA256: ac7822d7fccbcc8b67b176a71a829bfc689052294855288accd8bcd1e422d398.

## Music behavior

The original owner MP3 is unchanged: 1,575,723 bytes, approximately65.36 seconds, SHA256 b43be287312d3c33c9c3a4659dea0c8bc6e2acc353506987955132d46feabc93. Source: web/audio/The-Gentle-Glade.mp3. Reproduce generated PROGMEM with `python3 tools/prepare-theme.py`, then browser gzip with `python3 tools/build-route-page.py`, then `pio run -d firmware -e m5stack-sticks3`.

The browser creates its media player and requests /audio/the-gentle-glade.mp3 only after Enable music. No MP3/base64 in the game HTML. Same recording continues through exploration, ordinary/boss battles and Oakwood; mute/resume retains playhead. Background/focus loss pauses until explicit resume. Native loop is enabled, but an MP3 encoder gap or non-seamless source endpoints may be audible; no seamless-loop claim or new crossfade processing. Volume uses the native media element; some iOS versions reserve effective volume for system controls. Owner phone test required. Legacy original synth scores/tools remain as historical source, not a second active soundtrack. Browser device plays the audio, not the StickS3 speaker.

Firmware serves audio/mpeg with explicit Content-Length, single byte range206 support, suffix/open-ended ranges,416 malformed/unsatisfiable rejection, nosniff and media-src self. No MIME or validator weakening. Retains a shared NetworkClient and pumps at most2048 bytes per main loop using nonblocking socket send; stalled progress times out after15seconds. One concurrent audio transfer; another may receive503 with Retry-After2 and need a user retry. Actual transfer timing, Safari seeking/reconnect behavior and gameplay responsiveness on the physical hotspot remain unverified. No full-song RAM allocation. MP3 uses a one-day browser cache; change the endpoint or cache identity before replacing this recording in a later build.

Offline route builder copies the original MP3 adjacent to the HTML as PocketQuestMini-The-Gentle-Glade.mp3; keep both together when reviewing. Source-module serving needs equivalent /audio routing or the adjacent review build.

## Separate storage measurements

| Measurement | Bytes |
| --- | ---: |
| Application BIN (includes art, browser gzip and audio) | 4,352,512 |
| Application partition capacity | 5,111,808 |
| Remaining application space | 759,296 (0.724 MiB) |
| Original MP3 payload | 1,575,723 |
| Browser HTML gzip, excluding MP3 | 1,182,064 |
| Factory BIN including boot regions/padding | 4,418,048 (4.213 MiB) |
| Static RAM reported by build | 52,896 |
| Modeled illustrated assets/code stored payload, excluding app-resident audio | 1,231,526 |
| Modeled illustrated LittleFS allocation | 1,560,576 / 2,097,152 (74.41%) |
| With engineering fixtures | 1,609,728 / 2,097,152 (76.76%) |

The 75% asset-model warning remains active with fixtures (487,424 bytes free; illustrated-only536,576 free). These are future filesystem models, not another copy currently installed in flash. Adding original audio to that modeled illustrated filesystem would exceed its capacity: payload alone2,807,249 bytes before overhead. This build instead stores audio in the app. No partition change. Owner explicitly approved raising the engineering app ceiling from2816KiB to4608KiB (4.5MiB); the physical app ceiling remains4.875MiB. Actual app usage is85.15%, so future sizable assets need a budget review.

## Verification

- PlatformIO firmware and merged factory build: PASS.
- Browser tests:132/132 PASS, including deferred audio initialization, pause/resume, no mode restart, volume clamps, blocked playback retry, loading/mute race and media-error recovery.
- Core sanitizers:8,357 assertions PASS; handheld animation/bounds checks PASS.
- C++/JS parity:48 intent cases;189 journey/chest cases including567 enemy responses PASS.
- Audio single-range parser bounds/overflow/malformed/suffix tests PASS under address/undefined sanitizers.
- Original file→repo→generated header→actual firmware bytes/hash PASS; MP3 absent from HTML; gzip/import graph/105 artwork assets/CSP/protected command wiring PASS.
- Unchanged scenery-validator tests PASS in browser suite. No scenery/collision/art changes.
- Branding, portal contract and hero-status/version checks PASS.
- Local disposable C++ authority HTTP preview: full audio bytes plus206 bounded/open/suffix and416 responses PASS. This uses a Node HTTP wrapper, not the physical firmware network stack.
- Local browser: explicit Enable shows playing, mute shows Resume, and departure to exploration preserves active theme state. Screenshot saved. No subjective listening-quality claim; no physical phone/gamepad/flash tests performed.

## Owner test before release

1. Flash0x0000 without full erase; verify existing XP, chests and active journey persist. Reload browser /play to get current code.
2. Verify initial load with music off, then enable the theme over the StickS3 hotspot; listen for glitches/volume/loop behavior.
3. Keep music playing during movement, chest claims, normal and boss battles and Oakwood return; check responsive inputs and durable saves.
4. Test touch/PS5 fullscreen, mute/resume and phone background/return. iOS may need system volume controls.
5. Restart/reconnect and confirm saves. Music deliberately requires another gesture after reload; preference/playhead are not persisted.

After owner acceptance: separately prepare a versioned full clean-install package with initialized filesystems and clearly labeled save-preserving updates. That packaging/release is not claimed complete by this development BIN. PocketQuestMini remains standalone; no full-game XP transfer added.
