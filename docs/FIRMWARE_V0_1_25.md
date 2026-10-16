# v0.1.25 — Battle Feedback

Development candidate, 2026-10-16. No hardware access, flash, erase, repository push or GitHub Release. Sites skill used for local browser implementation/QA only; no hosted deployment.

## Diagnosis and changes

The combat engine already applies damage from each surviving enemy after a valid player action. A monster killed by that action cannot counterattack. The old browser renderer only drew idle enemy frames; the accepted turn updated HP instantly with no visible retaliation. At higher hero levels a one-hit victory can also legitimately have no response. Damage rules are unchanged: these remain turn-based battles, not autonomous timed enemy attacks.

The browser now waits for a successful command receipt, then plays a read-only turn presentation: Nova's attack/Guard/potion, followed by each surviving enemy's attack sprite and 720ms lunge, guarded/ordinary damage text and HP feedback. Actions stay locked through playback. No local damage, XP, rewards or save writes are added; failed/uncertain receipts do not animate invented outcomes. Potion and boss-heavy explanations match current rules. Defeated enemies cannot attack and responses stop when Nova is defeated. Final authoritative state is restored when playback ends. Busy locks also prevent automatic victory continuation from skipping the final-blow presentation.

Battle entry now eases to a closer scenery crop (2.25×), with Nova at 3.4× sprite scale and ordinary enemies at 3×. Boss uses the existing enlarged goblin placeholder. The heavy dark overlay is replaced by a light tint. Terrain remains the unchanged illustrated ground; no stretched/repainted PNGs or new background art. Uniform canvas letterboxing and rotated-pointer targeting remain intact. Reduced-motion mode uses the final framing immediately, removes lunges/hit blinking, and shortens presentation phases. This is presentation, not an added dodge window.

The Gentle Glade remains selected for future overall music but is explicitly on hold. Existing synth music, controller/fullscreen, standalone gameplay, 2500ms splash, Wi-Fi, partition table and format-4/rules-4 saves remain unchanged. No chest or difficulty changes.

## Verified checks

- 107 browser tests passed, including Slime counter/final-blow behavior, wolf-group sequencing, Guard, potion, Goblin/Captain heavy strikes, defeat clipping, receipt mismatch handling, pure snapshot nonmutation, zoom/lunge bounds, reduced motion and existing scenery/control/save-adapter regressions.
- 5,132 sanitized core assertions passed. Handheld animation/lunge checks passed. 48 fixed-route C++/JS intent cases and 189 journey policy cases with 567 real C++ response comparisons passed.
- Actual core hero status/reward/snapshot/restart checks passed. PlatformIO build, actual app package/gzip/hash/import graph/CSP/command wiring, branding, portal and whitespace checks passed.
- Disposable local C++ authority browser test: wolves entered close-up battle; ordinary Attack changed Wolf1 HP24→11 and Nova HP40→32; Guard displayed separate 2-damage wolf responses. Controls were disabled while these phases played. Attack pose/lunge was visually observed. Screenshot uses synthetic local progress, not the owner's save.

Physical StickS3, phone, PS5 and restart tests for this version remain unverified. Existing ground calibration patches/seams become more apparent when enlarged; no artwork repair is claimed. Playback does not animate combat that happened in another tab or while disconnected. Audio is unchanged and was not auditioned.

## Manual delivery

`PocketQuestMini-S3-v0.1.25-Battle-Feedback.factory.bin` — **flash address 0x0000, without full erase**.

| Measurement | Bytes |
| --- | ---: |
| Actual application BIN | 2,768,624 |
| Application partition capacity | 5,111,808 |
| Application headroom | 2,343,184 |
| Complete factory BIN including padding | 2,834,160 |
| Static RAM allocation | 52,832 |
| Embedded browser gzip payload | 1,177,726 |
| Illustrated library stored payload | 1,227,974 |
| Modeled illustrated filesystem allocation | 1,552,384 / 2,097,152 (74.02%) |
| Modeled allocation including fixtures | 1,601,536 / 2,097,152 (76.37%) |

75% review warning remains active with engineering fixtures; illustrated-only is approaching the threshold. Modeled free space: 544,768 bytes illustrated-only, 495,616 including fixtures. Model includes the existing optional sword/enemy library, both Novas, validation data, rest layers and browser modules, with losslessly optimized PNGs. It is a future in-memory LittleFS capacity model, not physical flash telemetry. Current assets remain inside the application, not a separately populated asset filesystem; do not double-count the embedded payload.

Factory SHA-256: `5bc7e11b55dcc788888477b37436bbcf342d7900131305f63e19a54599ed84c0`.

Verified bootloader at0x0000, partition table at0x8000, boot_app0 at0xE000 and application at0x10000. Factory ends before saves0x4F0000 and assets0x5F0000; neither filesystem is included or initialized. Padding covers NVS, so unrelated settings are not guaranteed preserved. Existing saves are retained by the routine-update boundary; never full-erase for this update. Do not downgrade to v0.1.21 or earlier after format-4 writes. Manifest records dirty working-tree provenance from source checkpoint c0a7c6be9374d0a9269bc3247d6bad147e6b3627, not a newly published commit.

Offline review HTML is an isolated in-memory demo and cannot modify device progress. Firmware delivery follows owner downloads → owner flashes → owner tests. Stop for review.
