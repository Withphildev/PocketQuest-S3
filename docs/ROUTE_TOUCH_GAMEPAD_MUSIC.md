# PocketQuest — touch, browser controller and lo-fi review

2026-10-14. Owner requested touch-first phone/tablet play, PS5 BT controller support and lo-fi MIDI music. This bounded browser-demo update adds touch ergonomics, standard browser gamepad controls and optional original synthesized loops, plus actual MIDI exports. Sites skill used in local-only mode; no hosting, registration, new artwork, GitHub push, firmware build/flash or real-save writes.

## Deliverable

PocketQuest-Woodland-Touch-Gamepad-Review.html is the new self-contained review file. The prior Woodland-Route-Review.html is retained, not overwritten. Both remain explicitly demo-only, in-memory progression; reload resets demo progress. This is not a factory BIN or a device filesystem deployment. Use a normal browser to open the downloaded HTML. Browser automation tests used loopback HTTP; this tool disallows file-protocol navigation, so no direct-file automation claim is made. Owner previously confirmed the earlier single-file route demo opens on the computer.

## Touch first

- Cross-shaped left D-pad with independent pointer capture/release/cancel handling; one finger releasing cannot cancel another held direction. Keyboard controls retained.
- Separate large right-side Engage button. D-pad is hidden during battle/results, and cannot move Nova during a battle. No jumping or renderer/collision changes.
- Large battle actions (minimum 52px), target-name buttons and tap-to-target directly on visible enemies. Dead enemies cannot be selected. Selected target is highlighted in both canvas and target controls.
- Portrait, landscape and tablet layouts; normal scrolling remains available outside the D-pad. No required hover/keyboard-only action or browser zoom disabling. Input clears on page blur/background, as do held visual states.
- Non-overlapping control panel: a sticky variant was rejected during QA because it could obscure the scenery/status. Current controls stay in document flow.

## Controller connection and mappings

**Pair to the phone/tablet/computer running the browser, not to StickS3.** This uses navigator.getGamepads(), not Web Bluetooth pairing or firmware Bluetooth. OS/browser must expose a standard-mapped controller; unknown mappings are explicitly rejected rather than guessing buttons. Physical DualSense pairing and actual mappings have not been verified by Codex. This is intended PS5 support through the standard browser mapping, not certified Bluetooth compatibility or a PocketBoy firmware port.

| Mode | Controls |
| --- | --- |
| Exploration | Left stick / D-pad moves; Cross engages |
| Battle | Stick/D-pad chooses action; Cross confirms |
| Battle shortcuts | Square Power Strike; Triangle Guard; Circle Run |
| Target | L1 previous / R1 next living enemy |
| Result | Cross continues, or returns to camp after defeat |

Axis dead zone 0.25; four-direction controller movement; menu directions advance once until released. Buttons fire on rising edges, not every frame. Connection, device change, blur/background or disconnection clear state and require a neutral release before enabling input. Holding Cross through reconnect cannot immediately trigger combat. Busy combat animation rejects queued controller actions, and normal battle rules still reject unavailable skill/item/run choices. No controller shortcut silently resets the demo at camp.

Controller access may require a secure context and user interaction, and can be unavailable on ordinary http://PocketQuest / http://192.168.4.1 hotspot pages. The UI reports blocked/unsupported/waiting states and touch/keyboard remain available. This must be resolved in a future device-hosted integration plan, not bypassed by disabling browser security. See the primary [W3C Gamepad specification](https://www.w3.org/TR/gamepad/). Direct controller-to-StickS3 Bluetooth remains a separate, unresolved requirement; no firmware/radio/pairing changes were made.

## Original lo-fi note sequences and MIDI

Three small original four-bar sketches: exploration 72 BPM, battle 88 BPM, boss 100 BPM. The runtime uses these note sequences with filtered triangle/sine oscillators for chord/lead/bass/kick voices and gentle swing. These are synthesized music sketches, not polished mastered recordings or licensed external tracks. No samples, soundfonts, audio downloads or external dependencies.

Music starts OFF. Tap Enable music to create/resume the AudioContext, then Mute/Resume and volume remain accessible. Volume starts at 25%. Exploration/battle/boss changes switch the score and clear previous voices. Blur/background clears the scheduler, stops voices and suspends audio; returning requires a deliberate Resume music tap. Browser audio initialization failures produce a visible retry message, not a game failure. Use the primary [Web Audio specification](https://www.w3.org/TR/webaudio/) for the underlying API. Browser/device interruption behavior and speaker/headphone sound require owner tests.

PocketQuest-Lofi-MIDI contains real Standard MIDI format-0 exports (240 PPQ, one track, channel programs for electric piano/bass/vibraphone and channel-10 kick). The exports share the authored score but are not a general-purpose MIDI parser/player or soundfont engine. General MIDI instruments will sound different from the lightweight browser synth. MIDI sizes: explore 422, battle 488, boss 486 bytes; 1,396 total. Exports are for editing/reuse and are not needed by runtime playback.

## Build / tests

From project root (existing prepared asset dependencies from ROUTE_RPG_SLICE.md unchanged):

```sh
node web/tools/build-route.mjs /absolute/path/PocketQuest-Woodland-Touch-Gamepad-Review.html
node web/tools/export-route-midi.mjs /absolute/path/PocketQuest-Lofi-MIDI
node --test web/tests/*.test.mjs
sh tools/test-host.sh
```

New code: web/route/controls.js and music.js; existing route app/template extended. MIDI exporter: web/tools/export-route-midi.mjs. No firmware files changed by this milestone.

- 43 browser tests PASS: all previous route/scenery tests plus six controller/touch/score/synth tests. Fake controller snapshots test dead zone, four-way mapping, held-on-connect release gate, one edge per press, unsupported maps, disconnect/background clearing. Touch tests cover independent fingers/cancel. Synth mocks test no context before opt-in, bounded volume, mode switching, pause/voices and one scheduler. MIDI header/length/end and authored note ranges checked.
- Existing sanitized core suite: 2,000 assertions PASS. JavaScript syntax / git whitespace checks PASS.
- Actual browser UI: held on-screen D-pad reaches slime and wolf encounters; Engage opens battle; large actions resolve a slime victory; tapping wolf #2 on the canvas selects its target button. Music Enable initializes running playback status, battle changes score, volume changes and Mute work without console errors. This is API/UI validation, not a listening-quality assessment.
- Responsive checks: portrait 390x844, landscape 844x390 and tablet 768x1024. Content width equals viewport in all three. Landscape/tablet battle buttons measured 52px minimum; portrait target/actions visually checked. Temporary viewport override restored after tests.
- PocketQuest-Touch-Battle.jpg captures the narrow-screen battle UI/selected target, not device telemetry.

Not verified: physical multi-touch/scroll interactions on iOS/Android, landscape phone ergonomics on real hardware, DualSense over actual Bluetooth/USB, audible musical quality, external audio interruption behavior, Safari/Chrome cross-device compatibility, or gameplay served from a plain-HTTP StickS3 hotspot. No claims that these hardware tests passed.

## Separate storage measurements

| Measurement | Result |
| --- | --- |
| Application BIN | Last v0.1.11 measured 1,573,056 bytes; unchanged, not rebuilt |
| Modeled illustrated browser payload with route controls/music | 1,142,782 bytes |
| Modeled LittleFS allocation | 1,425,408 / 2,097,152 = 67.97%; 671,744 bytes free |
| Factory BIN with padding | Existing v0.1.11 is 1,638,592 bytes; unchanged |

With legacy engineering fixtures: 1,503,232 bytes = 71.68%, 593,920 free. Neither exceeds 75%. Current route source (HTML/app/game/controls/music) is 32,320 raw / 13,014 gzip bytes. Actual self-contained HTML is 1,537,003 bytes including base64 assets/module data; not the modeled deployable module/assets filesystem. Exports/source/review duplicates are excluded, no new scenery/images or soundfonts added. MIDI exports are not runtime payload. Model readback PASS; not physical free-space telemetry. Deployment needs asset-path/module packaging and an appropriate server; do not treat this review HTML as the modeled filesystem.

## Owner review

Open the new review HTML on computer, then try a phone/tablet. Check held directions release immediately, page scrolling outside controls, target taps, portrait/landscape buttons and no accidental double attacks. Pair DualSense to that browser device, press a button to expose it, release all controls, then test movement/Cross/Square/Triangle/Circle/L1/R1. If controller access is blocked, retain touch and report browser/origin; do not alter security settings. Enable music at low volume, compare exploration/battle loops, mute, switch away and resume. Stop for feedback before any real hero reward/device integration.
