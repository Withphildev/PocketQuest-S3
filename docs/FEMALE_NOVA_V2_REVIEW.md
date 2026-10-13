# Female Nova v2 — owner review candidate

Generated from the new female Nova identity and motion reference sheets with the built-in image-generation tool.
The supplied references and previous sprite candidates are unchanged. No production approval is assumed.
New design: blue-indigo long hair with violet highlights, golden flower clip, large brown eyes,
teal cloak with gold hem and compass/star brooch, green/ivory clothing and brown leather equipment.

## Files and layout

- Female Nova: 32 transparent 32×48 PNG frames; foot pivot (16,44).
- Atlas: 256×192, eight columns ×four rows.
- Rows: down/south, up/north, left/west, right/east.
- First four columns: idle/breathing/blink poses. Last four: walking poses.
- Idle timing 350 ms/frame; walking timing 140 ms/frame. These are provisional visual-review timings.
- `nova.json` references individual frames and optional `idle.female` directions; legacy static/walk imports remain valid.
- Existing sixteen male walking PNGs copied byte-identically into the preview package.

## Preparation and tests

Requested 2048×1536 generation dimensions were not trusted. The preparation report records actual
source dimensions and crops. Initial candidate failed clean-gutter extraction; a targeted spacing
edit separated sprites without changing the intended design. Source originals and exact prompts are retained.
Preparation detects transparent row/column gutters from alpha≥128 silhouettes, adds two-pixel crop
padding, preserves cropped alpha, applies one shared isotropic nearest-neighbor sampling factor to
all female poses, and aligns visible silhouettes to a common centered foot baseline. Very faint alpha
outside the crop padding is excluded; no background color-keying is used. This is generated illustration
converted for a pixel-art target, not individually hand-authored native-resolution pixel animation.

30 browser-engine tests pass, including separate idle loading/cycling and legacy male/static behavior.
Image tests verify 32 distinct female frame images, exact frame size, transparent corners, unclipped
paint bounds, exact atlas reconstruction, byte-identical male frames and reproducible preparation.
Unchanged scenery validator and prepared-ground tests pass. Browser QA at 1× zoom with debug off
loaded both characters without console warnings/errors. Female v2 crossed from (440,256) to (641,256),
was inspected behind the tree at (100,125), then walked to (100,196), appearing in front.
No firmware build, flashing, partition changes, terrain changes, or Phase 2B work occurred.

## Storage

Application binary unchanged: 651,936 bytes. Asset payload model including female idle and walk,
male walking, ground/tree, metadata and gzip browser code: 998,205 bytes (0.95 MiB).
Modeled LittleFS allocation: 1,150,976 bytes (54.88% of the 2 MiB asset partition).
Including engineering fixtures: 1,228,800 bytes (58.59%). Neither exceeds the 75% warning threshold.
Actual device filesystem usage remains unmeasured. No new factory BIN exists for this browser-only change.

## Review limitations

Fine facial/equipment detail is necessarily reduced at 32×48; the high-resolution reference is not
the native sprite. Pose-to-pose hair/body variation and silhouette-based alignment can cause small
jitter; gait polish and blink frequency need owner review. All frames are distinct but this does not
prove a production-quality animation cycle. No attack, hurt, victory or firmware character selector
has been implemented. Existing forest collar/terrain visual limitations remain unchanged.

## Reproduce from the source project

```
python3 web/tools/prepare-female-nova-v2.py web/artwork-sources/nova-female-v2/spaced.png web/build/nova web/build/nova-female-v2
python3 web/tools/test-female-nova-v2.py web/build/nova-female-v2
node --test web/tests/*.test.mjs
node web/tools/build.mjs --ground-validation --nova-v2
python web/tools/asset-storage-budget.py /absolute/output/budget.json --female-v2
```

Preparation/tests require Pillow 12.3.0; storage modeling requires littlefs-python 0.19.0.
Stop for owner visual review before Phase 2B.
