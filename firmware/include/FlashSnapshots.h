#pragma once
#include <Arduino.h>
#include <LittleFS.h>
#include <Save.h>

class FlashSnapshots : public pq::SnapshotStorage {
public:
    bool begin() { ready_ = fs_.begin(false, "/pqsaves", 4, "saves"); return ready_; }
    pq::ReadResult read(unsigned slot, std::vector<uint8_t> &bytes) override {
        bytes.clear();
        if (!ready_ || slot > 1) return pq::ReadResult::Error;
        const char *name = path(slot);
        if (!fs_.exists(name)) return pq::ReadResult::Missing;
        File file = fs_.open(name, FILE_READ);
        if (!file) return pq::ReadResult::Error;
        const size_t size = file.size();
        // Preserve oversized/unrecognized files; do not allocate unbounded RAM.
        if (size > 4096) { file.close(); return pq::ReadResult::Error; }
        bytes.resize(size);
        const size_t read = size ? file.read(bytes.data(), size) : 0;
        file.close(); return read == size ? pq::ReadResult::Ok : pq::ReadResult::Error;
    }
    bool write(unsigned slot, const std::vector<uint8_t> &bytes) override {
        if (!ready_ || slot > 1 || bytes.size() != pq::kSnapshotBytes) return false;
        if (fs_.totalBytes() - fs_.usedBytes() < 64 * 1024) return false;
        File file = fs_.open(path(slot), FILE_WRITE);
        if (!file) return false;
        const bool ok = file.write(bytes.data(), bytes.size()) == bytes.size();
        file.flush(); file.close(); return ok;
    }
    size_t usedBytes() { return ready_ ? fs_.usedBytes() : 0; }
    size_t totalBytes() { return ready_ ? fs_.totalBytes() : 0; }
private:
    const char *path(unsigned slot) const { return slot == 0 ? "/pq-a.bin" : "/pq-b.bin"; }
    fs::LittleFSFS fs_;
    bool ready_ = false;
};
