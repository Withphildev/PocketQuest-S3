# Approved selectable protagonists

PocketQuest has two selectable protagonists, both named Nova:

- Nova (Female): long indigo-purple hair.
- Nova (Male): short, tousled indigo-purple hair.

Both use the same adventurer equipment, combat abilities, balance, and progression. Selection is cosmetic, not a difficulty or statistics choice. Preserve both designs in future StickS3 and browser character-selection systems. The owner's supplied character board is visual direction, not an already validated production sprite sheet.

The v0.1.0 hardware prototype retains its existing geometric placeholder player. It does not yet implement character selection or persist a protagonist identifier. A later version must introduce a stable cosmetic character ID in the versioned save contract with an explicit migration; it must not reinterpret existing bytes silently. Production sprites should be separately authored and checked at native display scale.

Phase 2A browser study offers temporary female/male geometric appearances for scale/movement review only, with identical collision and movement. This is not production artwork, firmware character selection, persisted selection, or a change to the Phase 1 save format.
