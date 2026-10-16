#include "Save.h"
#include "Route.h"
#include <limits>
namespace pq {
uint32_t crc32(const uint8_t *p, size_t size) {
    uint32_t crc = 0xffffffffu;
    for (size_t i=0; i<size; ++i) {
        crc ^= p[i];
        for (int b=0; b<8; ++b) crc = (crc >> 1) ^ ((crc & 1) ? 0xedb88320u : 0u);
    }
    return ~crc;
}
static void put(std::vector<uint8_t> &b, uint64_t n, unsigned width) {
    for (unsigned i=0; i<width; ++i) b.push_back(static_cast<uint8_t>(n >> (8*i)));
}
static uint64_t get(const std::vector<uint8_t> &b, size_t &p, unsigned width) {
    uint64_t n=0; for (unsigned i=0; i<width; ++i) n |= uint64_t(b[p++]) << (8*i); return n;
}
std::vector<uint8_t> encode(const Snapshot &s) {
    if (!validState(s.state) || s.sequence == 0) return {};
    std::vector<uint8_t> b; b.reserve(kSnapshotBytes);
    put(b, 0x31535150, 4); // "PQS1"
    put(b, kSaveFormat, 2); put(b, kSnapshotBytes, 2); put(b, s.sequence, 8);
    put(b, s.state.worldSeed, 8); put(b, s.state.revision, 8);
    put(b, s.state.xp, 4); put(b, s.state.victories, 4);
    put(b, s.state.level, 2); put(b, s.state.hp, 2); put(b, s.state.monsterHp, 2);
    put(b, s.state.generatorVersion, 2); put(b, s.state.rulesVersion, 2);
    put(b, static_cast<uint8_t>(s.state.phase), 1); put(b, s.state.motionPreset, 1);
    put(b,static_cast<uint8_t>(s.state.enemyKind),1);put(b,0,3); // active encounter + reserved
    const auto &r=s.state.route;
    put(b,static_cast<uint8_t>(r.phase),1);put(b,r.cleared,1);put(b,r.encounter,1);
    put(b,r.focus,1);put(b,r.potions,1);put(b,r.target,1);put(b,r.hp,2);
    put(b,r.enemyHp[0],2);put(b,r.enemyHp[1],2);put(b,r.round,2);
    put(b,r.lastBase,8);put(b,r.lastCommand,1);put(b,r.lastTarget,1);
    const auto &j=s.state.journey;
    put(b,j.outing,4);put(b,j.section,4);put(b,j.tier,2);put(b,j.highest,2);put(b,j.mode,1);
    put(b,j.chestOpened,1);
    put(b, crc32(b.data(), b.size()), 4); return b;
}
DecodeResult decode(const std::vector<uint8_t> &b, Snapshot &out) {
    if (b.size() < 20 || b.size() > 4096) return DecodeResult::Invalid;
    size_t p=0;
    if (get(b,p,4) != 0x31535150) return DecodeResult::Invalid;
    const auto version = get(b,p,2); const auto length = get(b,p,2);
    if (length != b.size()) return DecodeResult::Invalid;
    size_t tail=b.size()-4;
    if (get(b,tail,4) != crc32(b.data(), b.size()-4)) return DecodeResult::Invalid;
    if (version < 1 || version > kSaveFormat) return DecodeResult::Unsupported;
    if (b.size() != (version==kSaveFormat ? kSnapshotBytes : version==4?97:version==3?84:60)) return DecodeResult::Invalid;
    Snapshot s;
    s.sequence=get(b,p,8); s.state.worldSeed=get(b,p,8); s.state.revision=get(b,p,8);
    s.state.xp=static_cast<uint32_t>(get(b,p,4)); s.state.victories=static_cast<uint32_t>(get(b,p,4));
    s.state.level=static_cast<uint16_t>(get(b,p,2)); s.state.hp=static_cast<uint16_t>(get(b,p,2));
    s.state.monsterHp=static_cast<uint16_t>(get(b,p,2));
    s.state.generatorVersion=static_cast<uint16_t>(get(b,p,2)); s.state.rulesVersion=static_cast<uint16_t>(get(b,p,2));
    s.state.phase=static_cast<Phase>(get(b,p,1)); s.state.motionPreset=static_cast<uint8_t>(get(b,p,1));
    const auto kind=get(b,p,1);
    if(get(b,p,3)!=0 || s.sequence==0) return DecodeResult::Invalid;
    if(s.state.generatorVersion!=kGeneratorVersion) return DecodeResult::Unsupported;
    if(version==1) {
        if(kind!=0) return DecodeResult::Invalid;
        if(s.state.rulesVersion!=1 && s.state.rulesVersion!=2) return DecodeResult::Unsupported;
        if(s.state.monsterHp>(s.state.rulesVersion==1 ? kMonsterMaxHp : enemyMaxHp(s.state.victories))) return DecodeResult::Invalid;
        s.state.enemyKind=EnemyKind::Slime;
        s.state.rulesVersion=kRulesVersion;
    } else {
        if(s.state.rulesVersion==3) {
            if(kind>1) return DecodeResult::Invalid;
            s.state.rulesVersion=kRulesVersion;
        }
        if(s.state.rulesVersion!=kRulesVersion) return DecodeResult::Unsupported;
        s.state.enemyKind=static_cast<EnemyKind>(kind);
    }
    if(version<3)s.state.route.hp=routeMaxHp(s.state.level);
    if(version>=3){
        auto &r=s.state.route;
        r.phase=static_cast<RoutePhase>(get(b,p,1));r.cleared=get(b,p,1);r.encounter=get(b,p,1);
        r.focus=get(b,p,1);r.potions=get(b,p,1);r.target=get(b,p,1);r.hp=get(b,p,2);
        r.enemyHp[0]=get(b,p,2);r.enemyHp[1]=get(b,p,2);r.round=get(b,p,2);
        r.lastBase=get(b,p,8);r.lastCommand=get(b,p,1);r.lastTarget=get(b,p,1);
    }
    if(version>=4){
        auto &j=s.state.journey;
        j.outing=get(b,p,4);j.section=get(b,p,4);j.tier=get(b,p,2);j.highest=get(b,p,2);j.mode=get(b,p,1);
    }
    if(version>=5)s.state.journey.chestOpened=get(b,p,1);
    if (!validState(s.state)) return DecodeResult::Invalid;
    out=s; return DecodeResult::Ok;
}
LoadResult SaveStore::load(State &out) {
    writable_=false; recovered_=false; active_=-1; sequence_=0;
    Snapshot snapshots[2]; ReadResult reads[2]; DecodeResult results[2]; std::vector<uint8_t> raw[2];
    for (unsigned i=0; i<2; ++i) {
        reads[i]=storage_.read(i,raw[i]); results[i]=reads[i] == ReadResult::Ok ? decode(raw[i],snapshots[i]) : DecodeResult::Invalid;
    }
    // Never overwrite a valid future-version save, even if the other slot is older.
    if (results[0] == DecodeResult::Unsupported || results[1] == DecodeResult::Unsupported) return LoadResult::Unsupported;
    if (reads[0] == ReadResult::Error || reads[1] == ReadResult::Error) return LoadResult::Fault;
    const bool a=results[0] == DecodeResult::Ok, b=results[1] == DecodeResult::Ok;
    if (!a && !b) {
        if (reads[0] == ReadResult::Missing && reads[1] == ReadResult::Missing) { writable_=true; return LoadResult::NewGame; }
        return LoadResult::Fault; // preserve damaged files for owner recovery
    }
    if (a && b && (snapshots[0].state.worldSeed != snapshots[1].state.worldSeed ||
        (snapshots[0].sequence == snapshots[1].sequence && raw[0] != raw[1]))) return LoadResult::Fault;
    active_=a && (!b || snapshots[0].sequence >= snapshots[1].sequence) ? 0 : 1;
    sequence_=snapshots[active_].sequence; out=snapshots[active_].state;
    recovered_=(!a && reads[0] != ReadResult::Missing) || (!b && reads[1] != ReadResult::Missing);
    writable_=true; return LoadResult::Loaded;
}
bool SaveStore::save(const State &state) {
    if (!writable_ || sequence_ == std::numeric_limits<uint64_t>::max()) return false;
    const unsigned slot=active_ == 0 ? 1 : 0;
    const auto bytes=encode({state,sequence_+1}); if (bytes.empty()) return false;
    if (!storage_.write(slot,bytes)) return false;
    std::vector<uint8_t> check; Snapshot verified;
    if (storage_.read(slot,check) != ReadResult::Ok || check != bytes || decode(check,verified) != DecodeResult::Ok) return false;
    active_=static_cast<int>(slot); sequence_=verified.sequence; return true;
}
}
