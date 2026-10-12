# Deferred world and settlement requirements

Phase 1 implements standalone combat only. Oakwood remains an intentionally designed starting village integrated into the procedural world. Reserve its location/footprint and connector contract before generating surrounding wilderness. The wilderness is derived from a random persisted seed, coordinates, and immutable generator version. Do not randomly replace Oakwood with an ordinary clearing.

Preserve canonical shared edges/corners, independent generation order, signed-coordinate floor division, fixed numeric asset IDs, seed-plus-deltas persistence, and golden test vectors. Initial technical road masks are 0,5,10,15, with F001 clearing, F002 path, F003 pond, F004 crossroads. The approved projection is provisional: world 512×512 to ground image 512×288, 32×32 navigation, separate foreground objects.

Future settlement modules remain independent of display/combat: autonomous aggregate settlers and stewards, priorities, resources, construction, population, local reserves, caravans, quests, and elapsed-time progression. Individual NPC positions are browser presentation rather than the authoritative simulation. The offline progression cap defaults to seven days and must remain configurable; no time credit or settlement simulation is implemented yet.

Later time work must qualify the M5PM1 countdown and retained power conditions, distinguish actual power loss from deep sleep, reconcile browser time exactly once, prevent repeated capped credit, and treat missing time explicitly. Phase 1 does not claim offline timekeeping has been solved on hardware.
