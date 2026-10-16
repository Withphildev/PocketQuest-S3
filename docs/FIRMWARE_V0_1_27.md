# v0.1.27 — Phone Battles

Owner supplied a phone screenshot showing the battle very small. This corrects the responsive composition, not combat difficulty. Sites skill used locally; no hosted deployment, Git push/Release, physical device access, flash or erase.

## Cause and fix

v0.1.26 fitted a768×384 composition into a shallow phone canvas. Repeated toolbar instructions, stage title, turn status, long intent and two control rows left little height, scaling the whole composition down. Merely changing camera zoom would crop art again.

The battle composition is now768×240, removing unused internal vertical space while fitting the entire1024×288 ground uniformly at0.75 (Y12..228). Sprite scales stay Nova2.5 / ordinary enemy2.2 / boss existing1.45 multiplier, feetY165. Labels, damage text and hitboxes follow the compact layout. Viewport math and inverse touch mapping share the new dimensions. No new art, stretch or cover-crop.

Fullscreen battles hide repeated stage-title/turn-instruction/noncritical fullscreen-hint lines. A concise line shows round, maximum incoming damage, guarded damage, Your turn and explicit HEAVY STRIKE warning. Full intent remains in normal view and the intent title. Playback text appears in that same live status area. All target/action buttons, HP/focus/potions, Home, music, Exit and native fullscreen control remain available. Actions retain44px minimum height; actual measured rows48px. Disconnect/save/handheld-conflict warnings are not hidden. The critical warning line may deliberately reduce scene height until resolved. Exploration/Oakwood layouts and native fullscreen permission handling are unchanged.

## Verification

- 112 browser tests pass, including compact viewport fitting, actual PNG attack-frame bounds throughout lunges, normal/rotated pointer mapping, complete ground bounds, warning/control wiring and prior scenery/gameplay tests.
- 5132 sanitized core assertions, handheld animation checks,48 fixed-route parity cases and189 journey cases/567 C++ responses pass. PlatformIO build, actual browser payload/gzip/hash/import graph/CSP checks, branding/portal and whitespace checks pass.
- At900×418, local browser shell fills900×418, canvas900×255, threat line21px and target/action rows48px each, ending atY418. The fitted illustrated scene is816px wide versus approximately280px in the owner screenshot. This is roughly2.9× wider, not a claim of testing the physical phone.
- At844×390 canvas is844×227 and actions end atY390. Rotated390×844 fallback stays within bounds, with correct inverse pointer mapping covered by tests. Viewport override reset after QA.
- Disposable local C++ authority: accepted sword attack damages Wolf1 HP24→11 and NovaHP40→32. Existing animation rules remain covered by unit/parity tests; no physical PS5/phone/hardware save/restart test claimed. Local resized-browser background/focus can skip optional presentation, as designed; it does not skip resolved damage. Review screenshot shows synthetic progress.

## Delivery

`PocketQuestMini-S3-v0.1.27-Phone-Battles.factory.bin`: **flash0x0000 without full erase**.

| Measurement | Bytes |
| --- | ---: |
| Actual application BIN | 2,769,200 |
| Application capacity / headroom | 5,111,808 / 2,342,608 |
| Complete factory BIN with padding | 2,834,736 |
| Static RAM build allocation | 52,832 |
| Embedded browser gzip payload | 1,178,306 |
| Illustrated stored library payload | 1,228,406 |
| Modeled illustrated LittleFS | 1,552,384 (74.02%) |
| Modeled including fixtures | 1,601,536 (76.37%) |

75% warning remains active with engineering fixtures. Modeled free544,768 bytes illustrated-only /495,616 with fixtures out of2MiB. Current browser assets are embedded in the application; modeled future-filesystem values are not physical telemetry or additional actual flash usage. No new PNG/audio or partition change.

Factory SHA256 `44f8cf9ccee1f6cdb8921331d5ce43c8bf8f26aa84dbf60a2259ab3383c7dcbe`.

Verified bootloader0x0000, partition table0x8000, boot_app0 0xE000, application0x10000. Image stops before saves0x4F0000/assets0x5F0000 and includes neither filesystem. Padding covers NVS, so unrelated settings are not guaranteed preserved. Save format4/rules4 unchanged; no downgrade to v0.1.21 or earlier after new saves. Dirty-tree source checkpoint c0a7c6be9374d0a9269bc3247d6bad147e6b3627 is recorded in manifest; no new publication implied.

Handheld gameplay, difficulty and current synth themes unchanged. The Gentle Glade remains deferred. Offline review is isolated demo progress. Owner downloads/flashes/tests; stop for review.
