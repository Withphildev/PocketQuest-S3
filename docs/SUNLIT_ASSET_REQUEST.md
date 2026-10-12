# Phase 2A.2 — exact Sunlit asset request

Option A is approved for this milestone: retain 512×288 ground blocks, 512×512 logical footprints, x=u/y=9v/16, mask 10, 32×32 navigation and E/W opening Y=[126,162). This remains calibration, not permanent production approval. No Phase 2B.

## Missing illustrated ground

Deliver `F002-Sunlit-Forest-Master.png`: exactly opaque sRGB 1024×288. Intentionally author a new ground-only view using the supplied 2048×768 Sunlit illustration as style reference. Lush emerald grass, golden-brown dirt, warm light, moss, tiny flowers/pebbles; no baked trees/buildings/solid rocks/fences/logs. Elevated three-quarter parallel presentation, not strict isometric. Do not stretch or merely crop the old reference. Road opening is Y=126–161 at x=0–31,480–543,992–1023. N/S protected strips are 18 pixels; corners 32×18. Keep lighting and palette consistent.

The browser accepts this master and splits it at X=512 **without resizing**, into `F002-Sunlit-Forest-Left.png` and `F002-Sunlit-Forest-Right.png`. Select either master or halves, not both. Download buttons expose the generated halves. Original files remain unchanged.

Also deliver `F002-Sunlit-Forest-RoadMask.png`: opaque 1024×288 binary RGB black/white semantic mask, white=road, black=other ground. It must describe the actual painted road. Exact opening width is verified at outer and center collars; no north/south road exits. A mask cannot prove agreement with painted artwork; owner review is still required. It is not the collision grid.

## Templates and metadata

Supply `templates.json` using the existing version-1 format in VISUAL_ASSET_REQUIREMENTS.md: eight opaque directional edge PNGs for meadow-open-v1 and meadow-road-v1 (N/S 512×18, E/W 32×288), plus four meadow-corner-v1 directional corner PNGs (32×18). All twelve must be supplied even for this horizontal pair. Use coherent shared slices; do not create independent left/right template sets to conceal discrepancies. Existing exact pixel validation is unchanged. Collar/corner agreement may require deliberate authoring beyond a visually continuous master.

Supply two manifests, `F002-Sunlit-Forest-Left.json` / `F002-Sunlit-Forest-Right.json`, referring to matching PNGs and independent `*-nav.json` files. Both IDs should match their basenames; family F002, roadMask 10, groundPixels [512,288], worldSize [512,512], projection {xScale:1,yNumerator:9,yDenominator:16}. Edge IDs N/S meadow-open-v1, E/W meadow-road-v1; four meadow-corner-v1 corners. nav is 32×32 with 16-unit cells: 0 solid/1 walkable/2 water/3 blocked. All protected cells must be walkable. Include safe spawn anchors and reachable connectors. Do not infer collision from the illustration.

## Foreground requests (calibration only)

| PNG | Suggested provisional canvas / pivot | Required metadata |
| --- | --- | --- |
| Sunlit-Tree-Large.png | 128×160 / [64,148] | Ground anchor, trunk/root polygon, bounds [-64,-148,128,160] |
| Sunlit-Tree-Medium.png | 96×112 / [48,100] | Ground anchor, trunk/root polygon, bounds [-48,-100,96,112] |
| Sunlit-Rock.png | 64×48 / [32,40] | Ground anchor, rock polygon, bounds [-32,-40,64,48] |
| Sunlit-Fence.png | 96×48 / [48,40] | Ground anchor, fence polygon, bounds [-48,-40,96,48] |

These suggested foreground dimensions are not mandates: max 512×512, fully transparent background and visible content. Revise pivot/bounds consistently if size changes. Put base at pivot, no baked ground. Use depthRule ground-anchor; collision polygon uses absolute block-local world coordinates, wholly within [48,464] on both axes. Anchors use world units, not image Y. Keep objects out of road/connection collars. Plan a safe path on both sides of a tree for the priority occlusion demonstration. Existing engineering tree/rock/fence/cabin remain labeled fixtures, not finished forest assets. The generic renderer supports distinct large/medium image references; neither new tree artwork has been delivered.

## Optional Nova sprites

No approved individual usable sprite frames are currently available. The prior character board is a reference, not an import-ready animation atlas. Keep both approved identities/equipment: female long indigo-purple hair, male short tousled indigo-purple hair, brown eyes, green adventurer outfit, teal cloak; identical behavior.

Provide `nova.json`:

```json
{"schemaVersion":1,"frameSize":[32,48],"pivot":[16,44],"protagonists":{"female":{"north":"Nova-Female-North.png","east":"Nova-Female-East.png","south":"Nova-Female-South.png","west":"Nova-Female-West.png"},"male":{"north":"Nova-Male-North.png","east":"Nova-Male-East.png","south":"Nova-Male-South.png","west":"Nova-Male-West.png"}}}
```

Each frame must be exactly 32×48 with transparent background and visible content. Static directional frames are sufficient; no production animation sheets required. Files may share a filename temporarily, but that will not demonstrate four distinct orientations. Importing wrong dimensions fails rather than resizing. Scale starts at 1.5× and remains adjustable 0.5–2; collision radius stays 6. All approved sprites remain pending owner review.

## Loading / review

Select all flat filenames (master OR halves, road mask, manifest/nav JSON, templates and twelve PNGs, foregrounds, optional nova.json/frames) together in the existing Scenery Lab. Nothing uploads to a server. Invalid assets pause movement. Download the JSON validation report; inspect road-mask/art agreement, center seam, tree behind/front, footprint accuracy, both Nova options and camera scrolling. Existing tests alone do not confer artistic approval.

Built-in imagery and the reference kit remain engineering fixtures. They are provided to verify integration while illustrated assets are unavailable, not substituted for the requested Sunlit forest.
