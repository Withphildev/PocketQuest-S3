# Phase 1 save format and recovery

Format 1, explicitly little-endian, 60 bytes per snapshot. CRC32/ISO-HDLC uses reflected polynomial 0xEDB88320, initial 0xFFFFFFFF, final inversion. The checksum covers bytes 0–55, including header and sequence. It detects corruption, not intentional edits.

| Offset | Bytes | Value |
| --- | ---: | --- |
| 0 | 4 | ASCII PQS1 |
| 4 | 2 | Save format version 1 |
| 6 | 2 | Total record bytes, 60 |
| 8 | 8 | Sequence, nonzero, no rollover |
| 16 | 8 | Nonzero random world seed |
| 24 | 8 | Game-state revision |
| 32 | 4 | Total XP |
| 36 | 4 | Victory count |
| 40 | 2 | Level, 1–99, must agree with XP |
| 42 | 2 | Player HP |
| 44 | 2 | Slime HP, 0–18 |
| 46 | 2 | Generator version 1 |
| 48 | 2 | Rules version 1 |
| 50 | 1 | Phase: ready=0, battle=1, victory=2, defeat=3 |
| 51 | 1 | Motion preset 0–2 |
| 52 | 4 | Reserved zero |
| 56 | 4 | CRC32 of preceding bytes |

Rules validate HP, level/XP, phase/monster consistency, version, bounds, reserved bytes, and exact record length before modifying the game. Encounter HP is saved; attack/enemy cooldown timestamps are runtime-only and restart from boot time. Restoring does not re-award XP. New worlds use independent hardware randomness rather than a MAC-derived seed.

Snapshot paths are `/pq-a.bin` and `/pq-b.bin` in the explicitly labeled `saves` LittleFS partition. Loading scans both files and selects the highest valid sequence. Equal sequences with different content or mismatched world seeds lock the store rather than guessing. A valid unsupported future version also locks writing even if an older slot is readable. I/O errors lock the store; corrupt inactive content can recover from the other valid slot. Missing both files is the only normal automatic new-game case after a successful filesystem mount.

Writing truncates only the inactive slot, writes/flushes/closes, rereads its bytes, and validates them before promoting its sequence. The active slot remains intact. Power loss after the full valid write but before RAM acknowledgement selects that complete new slot at next boot; a partial write selects the old active slot. A failure never reports a successful save or advances the in-memory committed sequence.

No automatic filesystem formatting, deletion of damaged saves, or schema migration is implemented. Oversized files and filesystem read errors are reported conservatively. The adapter leaves 64 KiB free before writing. Filesystem metadata consumes much more than the two 60-byte payloads; runtime diagnostics report real allocation. Future larger state records and migrations require a revised version and tested compatibility path.

Phase 1's periodic snapshots replace the Phase 0 future journal design for this small milestone. No browser commands or externally acknowledged transactions exist yet. Important milestones are saved with rate limiting; an unexpected power cut can lose pending combat/threshold changes. A displayed `SAVED` sequence is the durability boundary. Full power-loss behavior of LittleFS metadata still needs device testing; host fault injection tests the store's torn-file logic.
