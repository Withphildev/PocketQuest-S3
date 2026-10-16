#pragma once
#include "Game.h"
#include <cstddef>
#include <cstdint>
#include <vector>
namespace pq {
constexpr uint16_t kSaveFormat = 5;
constexpr size_t kSnapshotBytes = 98;
struct Snapshot { State state; uint64_t sequence = 0; };
enum class DecodeResult { Ok, Invalid, Unsupported };
uint32_t crc32(const uint8_t *data, size_t size);
std::vector<uint8_t> encode(const Snapshot &snapshot);
DecodeResult decode(const std::vector<uint8_t> &bytes, Snapshot &out);
enum class ReadResult { Missing, Ok, Error };
class SnapshotStorage {
public:
    virtual ~SnapshotStorage() = default;
    virtual ReadResult read(unsigned slot, std::vector<uint8_t> &bytes) = 0;
    // Writes ONLY the inactive slot. A torn write must leave the active slot intact.
    virtual bool write(unsigned slot, const std::vector<uint8_t> &bytes) = 0;
};
enum class LoadResult { Loaded, NewGame, Fault, Unsupported };
class SaveStore {
public:
    explicit SaveStore(SnapshotStorage &storage) : storage_(storage) {}
    LoadResult load(State &state);
    bool save(const State &state);
    uint64_t sequence() const { return sequence_; }
    bool recovered() const { return recovered_; }
    bool writable() const { return writable_; }
private:
    SnapshotStorage &storage_;
    uint64_t sequence_ = 0;
    int active_ = -1;
    bool recovered_ = false, writable_ = false;
};
}
