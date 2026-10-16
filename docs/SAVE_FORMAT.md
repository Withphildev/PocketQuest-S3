# Phase 1 save format and recovery

Format 5 (v0.1.30), explicitly little-endian, 98 bytes per snapshot. Formats 1/2 (60 bytes), format 3 (84 bytes) and format 4 (97 bytes) remain readable through migration. Format 4 preserves its hero, route, journey and receipt and initializes chestOpened=0 without rerolling the section. Format 3 preserves its legacy route/battle and receipt; journey starts unplayed until Depart. CRC32/ISO-HDLC uses reflected polynomial 0xEDB88320, initial 0xFFFFFFFF, final inversion, covering bytes 0–93. It detects corruption, not intentional edits. **Do not downgrade to v0.1.29 or earlier after format-5 writes.**

| Offset | Bytes | Value |
| --- | ---: | --- |
| 0 | 4 | ASCII PQS1 |
| 4 | 2 | Save format version 5 |
| 6 | 2 | Total record bytes, 98 |
| 8 | 8 | Sequence, nonzero, no rollover |
| 16 | 8 | Nonzero random world seed |
| 24 | 8 | Game-state revision |
| 32 | 4 | Total XP |
| 36 | 4 | Victory count |
| 40 | 2 | Level, 1–99, must agree with XP |
| 42 | 2 | Player HP |
| 44 | 2 | Enemy HP, bounded by stored enemy kind and difficulty |
| 46 | 2 | Generator version 1 |
| 48 | 2 | Rules version 4 (v0.1.11) |
| 50 | 1 | Phase: ready=0, battle=1, victory=2, defeat=3 |
| 51 | 1 | Motion preset 0–2 |
| 52 | 1 | Enemy kind: slime=0, dire wolf=1, goblin=2 |
| 53 | 3 | Reserved zero |
| 56 | 1 | Browser route phase: explore=0, battle=1, victory=2, defeat=3, escape=4 |
| 57 | 1 | Legacy ordered mask 0,1,3,7,15; journey current-section cleared 0/1 |
| 58 | 1 | Encounter index 0–3 |
| 59 | 1 | Focus 0–3 |
| 60 | 1 | Potion count 0–2 |
| 61 | 1 | Current enemy target 0–1, bounded by encounter |
| 62 | 2 | Browser combat HP (separate from handheld HP) |
| 64 | 4 | Two uint16 enemy HP values |
| 68 | 2 | Browser round, nonzero |
| 70 | 8 | Last accepted command's base revision, UINT64_MAX if absent |
| 78 | 1 | Last command: start=0,attack=1,skill=2,guard=3,item=4,run=5,continue=6,camp=7,depart=8,return=9,advance=10,chest=11; 255 if absent |
| 79 | 1 | Last command target argument |
| 80 | 4 | Outing counter (0 means legacy/unstarted), no rollover |
| 84 | 4 | Road section index, no rollover |
| 88 | 2 | Current road difficulty tier 1–99 |
| 90 | 2 | Highest reached road tier 1–99; never decreased by rest |
| 92 | 1 | Journey mode: Oakwood=0, outward=1, peaceful return=2 |
| 93 | 1 | Current-section chest opened flag 0/1 |
| 94 | 4 | CRC32 of preceding bytes |

Chests derive presence, position and loot from a separate seeded hash. The first outing's first section has one; later sections use a one-in-three chance. Each is beyond the current encounter, and Chest requires its cleared gate, outward Explore mode, target argument0, an unopened valid chest and useful HP/potion capacity. Potion rewards add1 up to capacity2; otherwise heal up to8 browser HP. Full supplies reject without consuming the chest. Reward and opened flag share the existing atomic snapshot/receipt. Camp/reconnect retain opened state; Depart/Advance change section identity and reset the flag. Old sections cannot be revisited. No XP/gold/equipment rewards are introduced. Browser proximity is a UI rule, not a cryptographic proof of walking: the device validates section/gate/claim identity, not exact player position. Route API schema3 adds validated deterministic chest metadata and makes old cached clients fail closed. Rules version4 is unchanged.

Encounter kind/position are deterministic from seed + outing + section; enemy HP/round/turn state remain serialized. Tier grows every three cleared-and-exited sections, capped99. New outings start max(1,highest−1); reconnect never starts a new outing. Return mode resumes its peaceful stretch. Exact walking position is not saved; reconnect starts at the current section entrance. Depart/Return/Advance/Chest use durable transactions/receipts. No clock/offline simulation or browser-local rewards are introduced. Route API schema3 makes older cached clients fail closed rather than misinterpret current state.

Rules validate HP, level/XP, phase/monster consistency, version, bounds, reserved bytes, and exact record length before modifying the game. Encounter HP is saved; attack/enemy cooldown timestamps are runtime-only and restart from boot time. Restoring does not re-award XP. New worlds use independent hardware randomness rather than a MAC-derived seed.

Snapshot paths are `/pq-a.bin` and `/pq-b.bin` in the explicitly labeled `saves` LittleFS partition. Loading scans both files and selects the highest valid sequence. Equal sequences with different content or mismatched world seeds lock the store rather than guessing. A valid unsupported future version also locks writing even if an older slot is readable. I/O errors lock the store; corrupt inactive content can recover from the other valid slot. Missing both files is the only normal automatic new-game case after a successful filesystem mount.

Writing truncates only the inactive slot, writes/flushes/closes, rereads its bytes, and validates them before promoting its sequence. The active slot remains intact. Power loss after the full valid write but before RAM acknowledgement selects that complete new slot at next boot; a partial write selects the old active slot. A failure never reports a successful save or advances the in-memory committed sequence.

No automatic filesystem formatting or deletion of damaged saves is implemented. Format-1 rules-1/2 records validate their original HP limits and zero reserved bytes before normalizing to rules4 with slime identity. Format-2 rules3 accepts slime/wolf and normalizes to rules4; rules4 recognizes all three enemy kinds. Old hero progress and encounters are retained. Formats1/2 initialize an unplayed browser route with full level-appropriate HP, focus3, potions2 and no receipt. Format3 retains route/receipt with default journey; format4 also retains journey and initializes chestOpened=0. Subsequent ordinary checkpoints/browser commands write format5/rules4. Mixed old/new slots and interrupted migrations use the same recovery rules. **Do not downgrade to v0.1.29 or earlier after new saves:** older firmware rejects format5 and locks writing. Plan backups/rollback rather than erasing progress.

Oversized files and filesystem read errors are reported conservatively. The adapter leaves 64 KiB free before writing. Filesystem metadata consumes much more than the two98-byte payloads; runtime diagnostics report real allocation. Future larger records require a revised version and tested compatibility path.

Handheld milestones retain their existing rate-limited checkpoints; an unexpected power cut can lose pending handheld combat/threshold changes. A displayed `SAVED` sequence is that durability boundary. Browser commands instead copy a candidate, validate revision/action/target, resolve on-device, encode reward plus receipt atomically, write/read back and only then publish success. A lost acknowledgement can be retried with the same base/action/target: the stored receipt returns Duplicate without saving/awarding again. Older receipts are rejected as stale after later commands, never reapplied. Ordinary handheld changes preserve route/receipt fields.

An uncertain browser readback freezes further writes and physical combat until reboot scans both slots: a complete but unacknowledged reward snapshot must not be overwritten with older RAM state. Ordinary checkpoint failures also latch write protection. Full physical LittleFS power-loss behavior still needs device testing; host fault injection tests every truncated final-reward record and complete-write/readback-failure recovery. Exact walking position and protagonist appearance selection are not persisted.
