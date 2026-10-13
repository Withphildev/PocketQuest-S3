# Latest Sunlit Forest reference sheet — technical handoff

Owner status: **artistic direction approved for calibration**, not production-ready assets. This is approval of style, not approval of dimensions, masks, extracted sprites, or collision. Continue Phase 2A.3; no Phase 2B or device changes.

## Actual file and ground geometry

The attachment is **2048×768 RGBA PNG**. Its labels are annotations, not export metadata. Image inspection puts the upper illustrated scenery band at approximately [10,66,2038,387), a **2028×321 inspection region**, with two approximately 1014×321 halves around sheet X=1024. Those bounds are estimates of the visible panel, not certified clean crop coordinates. The center annotation/vertical rule is baked into the sheet.

The intended engine master is 1024×288, split at master X=512. The inspected band has aspect ratio about 6.32:1 versus the required 3.56:1. Filling the contract directly would require incompatible X/Y scaling. Even a hypothetical uniform width fit would be only about 162 pixels high, needing about 126 additional rows of intentionally authored/padded ground. This calculation is diagnostic only: **the reference sheet has not been resized, cropped, stretched, keyed, or modified**.

The panel contains trees/trunks, bushes and substantial boulders baked into the ground illustration. A direct crop would retain baked foreground occluders and the center rule. Padding alone cannot recover ground hidden beneath objects, establish road width, or create shared edge/corner textures. The smallest reliable solution is a separate label-free, ground-only, intentionally authored **1024×288 opaque PNG**, exported from original layers if available; otherwise commission one new calibration master in this approved style. Do not replace it with a crop and claim compatibility.

## Road and perspective

The path looks horizontally continuous in overall composition, but painted width and vertical position vary. There is no authored semantic road mask and no exact source-to-world mapping. Printed “X=512” does not mean the sheet's source seam is X=512. Because the visible panel is not dimension-compatible, neither its edge road nor its center opening can be certified as Y=126–161 in engine coordinates.

For the standalone master, explicitly author the 36-pixel dirt opening Y=[126,162) in outer collars X=[0,32), [992,1024), and the center pair collars X=[480,544). Keep north/south 18-pixel strips and 32×18 corners compatible and clear of solid footprints. Split once, with no independent resize/mirroring. Supply an actual binary road mask matching the painted path; a mask must not be fabricated to disguise mismatched art. Retain x=u, y=9v/16 and 512×512 logical footprints.

The approved warm lighting, emerald foliage, flowers, textured props, visible rock tops and tree trunks support elevated three-quarter fantasy presentation, not strict isometric or a completely overhead finished world. The sheet does not establish a precise camera angle, consistent final prop scale or navigable depth. Review with Nova at 1×/1.5× before assigning final scale; do not independently stretch a wide tree into a tall frame.

## Transparency findings

This file **does contain alpha**, so it is not accurate to call the whole sheet flattened or entirely opaque. Full-sheet alpha extrema are **0–253**; there are 436,009 fully transparent pixels. The inspected ground band has alpha **174–253**, so it is not opaque ground and fails that requirement. No source pixel reaches 255.

Several background gaps between props have alpha 0; underlying RGB at alpha 0 is irrelevant and must not be mistaken for an opaque background. However, some gaps/edges retain low-alpha residue, and some grass/backdrop detail is partly or substantially painted. For example, an inter-prop region [931,464,965,547) contains 2,772 alpha-0 pixels and 50 alpha-1 pixels. Fence-gap sample points have alpha values ranging from 13 to 235; “transparent” in the printed label does not establish clean holes between rails. Do not delete anything just because it looks green or blurred. Preserve real alpha, distinguish deliberate decoration from matte contamination, and inspect on light/dark backgrounds before accepting exports.

Setting every pixel to alpha 255 or chroma-keying green would damage the assets. For the ground request an opaque author export (or an explicitly reviewed composite over an authored opaque ground base); for props request original separate layers with clean alpha. Existing foreground validation permits semitransparent painted pixels, but its visible-pixels/transparent-background checks do not certify freedom from matte contamination.

## Object identification and extraction assessment

The following are **inspection-region sizes**, not independent PNG canvas dimensions. Their bounds are not promised extraction rectangles; several painted regions touch a chosen inspection edge and need more margin.

| Object, left to right | Inspected region size | Smallest reliable preparation |
| --- | --- | --- |
| Large tree, broad canopy / large roots | ~357×286 | Candidate for alpha-preserving separation. Prefer original tree layer; keep complete canopy/root tips and review grass/flower cluster at base. Need a clean individual render if the layer or clean separation is unavailable. |
| Medium tree, smaller rounded canopy | ~252×244 | Same approach; widen crop margin where foliage touches the inspection boundary. Do not claim its printed 384×384 size is present. |
| Mossy rock group with flowers | ~250×158 | Alpha-separated group may be reusable with its base decoration intact. Removing flowers or separating the individual rocks needs author layers or a new transparent render. |
| Wooden fence with three posts | ~253×135 | Outside silhouette is separable, but rail gaps have nonzero alpha/backdrop residue. Prefer a clean individual transparent export; otherwise manual masking or separately authored artwork is required before clean gameplay use. |
| Tree stump, cut top / flowers | ~227×138 | Candidate alpha-preserving separation as a whole decorated prop. Need a clean export if excluding the ground-flower skirt. |
| Fallen log, cut end / foliage | ~327×138 | Candidate as a whole decorated prop with adequate margins. Removing basal ground/foliage needs layers or new individual artwork. |
| Lantern post / hanging lantern / flowers | ~178×239 | Candidate separation, but thin support edges, lantern light and vegetation require careful alpha review. Prefer separate clean export if preserving glow without background is not possible. |

**No object is yet certified as a clean production cutout.** The sheet's real alpha makes non-destructive trial separation practical for most silhouettes; it does not mean all seven need regeneration. Ask for original individual layers first. A clean fence is the clearest reauthor/export need. If original layers are unavailable, individually generate only the props whose masking or desired removal of base decoration cannot be achieved cleanly. No extraction or generation was performed in this assessment.

Printed dimensions (large tree 512×512, medium 384×384, rock 256×256, fence/log 384×192, stump 256×192, lantern 256×320) are useful requested canvas targets only. All fit the current 512×512 foreground cap, but were not verified as actual files. Add transparent padding to an individual export if needed; do not stretch content to fill its canvas. Record any future uniform scale/crop decisions in the deterministic recipe and obtain visual review.

## Minimum individually authored image set

For the first playable illustrated **calibration**, not a scenery library:

1. **One ground-only master**, F002-Sunlit-Forest-Master.png, exactly opaque 1024×288 with approved connector geometry and no baked solid foregrounds. The pipeline derives Left/Right 512×288 PNGs by exact splitting.
2. **One clean transparent large tree**, independently exported from the source layer or authored in this approved style. Reuse that one asset in both blocks for the first test. The existing Phase 2A.3 tree can remain a clearly labeled test candidate until the owner accepts its style/shape; this sheet's broader canopy is not identical to it.

Thus the minimum is **two standalone art exports**, not seven newly generated props. Exact navigation, mask, registry and placement are additional technical files, not additional illustration commissions. Medium tree, rock and fence are the next optional calibration additions; stump/log/lantern may wait. No new Nova artwork is necessary to test seams/collision/occlusion; geometric female/male placeholders remain clearly labeled. Approved usable Nova sprites remain a separate requirement for artistic character review.

For the tree, author pixel pivot at root contact, block-local ground anchor, independent trunk/root polygon, image dimensions and renderBounds=[-pivotX,-pivotY,width,height], depthRule=ground-anchor. Keep collision within [48,464] world units and leave a safe route behind/in front. Do not infer collision from alpha or make canopy solid. The recipe/editor method is documented in ARTWORK_PIPELINE.md; the reference sheet does not supply these values.

## Existing validator / next pipeline step

The existing Sunlit master validator was invoked with the file's actual PNG dimensions and **rejected 2048×768** with “Sunlit master must be exactly opaque 1024×288; no scaling or cropping to fit.” The independent alpha inspection also establishes a ground-opacity failure. Full scenery validation cannot yet run because no independent manifest/nav/template/road-mask asset set exists. No passed scenery test is claimed for this sheet.

The renderer, validator, 36-pixel opening and Phase 1 functionality are unchanged. Existing Phase 2A.3 work remains available; this adds a technical handoff, not a new preview masquerading as compatible scenery. No build or gameplay retest was needed for this documentation-only assessment.

Next: obtain the two standalone exports above; record source hashes and exact crop/padding/composition decisions; author semantic road mask and nav; prepare one shared eight-edge/four-corner template registry; validate exact collars and corners without relaxing checks; demonstrate center-seam movement and actual tree behind/front traversal in the existing Canvas preview. Artistic-direction approval does not automatically approve any crop, opacity repair, derived connector palette or playable export.

Stop for owner review. No device access, Phase 2B, library generation or GitHub publication.
