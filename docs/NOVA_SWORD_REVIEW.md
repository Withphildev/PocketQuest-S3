# Female Nova sword animation candidate

Prepared 2026-10-12 for owner review. This is an asset milestone, not a firmware release. No device was flashed or modified. Phase 1 firmware and the world renderer remain unchanged by this work.

## Asset contract

16 transparent PNGs: four directions (south, north, west, east), each with wind-up, swing, follow-through, recovery. Attack frames are 80×64 with ground pivot (40,56); the body remains approximately the existing 32×48 scale. The larger canvas accommodates the sword without shrinking Nova or clipping its sweep. Atlas: 320×256, four columns by four rows. Contact sheet: 960×768, enlarged 3× for review only.

Provisional phase durations: 100, 80, 100, 200 ms (480 ms total). No hitboxes, damage, collision changes, or combat timing changes are implemented. Ground X anchors are manually assigned planted-foot centers; ground Y is inferred from the lowest significant painted boot pixel. Small head, cape, and pose variations may need pixel-level polishing after owner review. These generated candidates are not guaranteed production-quality animation.

Image generation used the imagegen skill with female Nova references, a left-facing correction, and a transparent-gutter spacing correction. Exact prompts are recorded in web/artwork-sources/nova-sword/prompts.json. The final source is preserved as spaced.png, actual dimensions 1254×1254 RGBA, SHA-256 d7d67b66500eb84513a732c8714463dda9955da405c705caed3081e213cb567f. Deterministic preparation uses a shared uniform nearest-neighbor reduction of 5.25, transparent padding, and explicit foot anchors; no nonuniform stretching or warping.

## StickS3 exports

NovaSwordSprites.h contains RGB565 pixels and a separate one-bit transparency mask. NovaSword.rgb565 is little-endian uint16 data; NovaSword.mask1 uses MSB-first bits with alpha >=128 considered visible. RGB565 color quantization and binary alpha are expected LCD format conversions, not lossless PNG optimization. The preview can compare LCD representation with full-alpha PNGs.

The C++ header provides a masked horizontal-run renderer requiring a display with fillRect. For a future right-facing battle animation, frames 12–15 are available:

```cpp
// Future integration example only; not installed in the firmware.
pq_sword::drawFrame(display, 12 + phase, 44, 82);
```

Repaint the background/full scene between frames so old sword pixels do not remain. Trigger animation only from an accepted combat attack when integrating; retain existing damage, cooldown, motion, button, save, and progression behavior. The export's Arduino PROGMEM branch and actual display performance still require a target firmware build and hardware testing.

## Reproduction

From the project root, with Python and Pillow available:

```sh
python3 web/tools/prepare-nova-sword.py web/artwork-sources/nova-sword/spaced.png web/artwork-sources/nova-sword/recipe.json web/build/nova-sword
python3 web/tools/test-nova-sword.py web/build/nova-sword
node web/tools/build-sword-preview.mjs
c++ -std=c++17 web/tools/test-nova-sword.cpp -o /tmp/pocketquest-test-nova-sword
/tmp/pocketquest-test-nova-sword
node --test web/tests/*.test.mjs
node web/tools/test-prepared-ground.mjs web/build/validated-ground
sh tools/test-host.sh
```

The single-file HTML preview embeds attack assets and existing female idle frames. It shows a simulated 240×135 screen enlarged 3×. Sites skill local-preview checks were used for browser inspection; no website was published. This preview is not a firmware binary.

## Verification

- Asset tests PASS: 16 exact-size RGBA frames, transparent corners, atlas reconstruction, all RGB565/mask pixel mappings, byte-identical regeneration.
- C++ host mock PASS: all 16 masked draws fit a 240×135 display at the selected anchor; invalid frames are rejected. This is not an ESP32 or physical LCD test.
- Browser tests: 30 passed, zero failed.
- Unchanged prepared-ground validator: passed road contract, collision, seam movement, and tree depth tests.
- Firmware host tests: 1,330 assertions passed.
- Browser inspection: direction controls and PNG/LCD modes load; front/back/right attack poses inspected, left-facing selection loads; no captured browser errors/warnings. Owner review of the complete cycles remains required.

## Storage checkpoint

| Measurement | Result |
| --- | --- |
| Existing application BIN (unchanged) | 651,936 bytes, about 0.62 MiB |
| New 16 attack PNG payload | 68,542 bytes, about 67 KiB |
| Current illustrated asset inventory including attacks | 1,067,058 bytes |
| Modeled 2 MiB LittleFS use | 1,282,048 bytes, 61.13% |
| Modeled use including engineering fixtures | 1,359,872 bytes, 64.84% |
| Alternate uncompressed LCD pixels + masks | 174,080 bytes, 170 KiB |
| Existing factory BIN (unchanged) | 717,472 bytes |
| New factory BIN | Not built; no firmware integration in this milestone |

The LCD export is an alternative representation, not automatically added alongside PNGs to the filesystem estimate. Compiling all frames into application flash would add approximately 170 KiB of raw asset data before code/alignment effects; only a future build can measure actual application size. The 75% modeled asset warning threshold is not exceeded. Partitions remain unchanged. The storage JSON's standalone-preview field refers to the existing forest review, not this new sword-only HTML.

Next step: owner visual approval, then scoped firmware integration and a tested downloadable factory BIN through the established manual-flashing workflow. No Phase 2B work, production scenery generation, firmware build, GitHub publication, or physical gameplay test was performed here.
