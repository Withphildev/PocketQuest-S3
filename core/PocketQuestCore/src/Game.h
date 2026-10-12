#pragma once
#include <cstdint>

namespace pq {
constexpr uint16_t kGeneratorVersion = 1;
constexpr uint16_t kRulesVersion = 1;
constexpr uint16_t kMonsterMaxHp = 18;
constexpr uint32_t kAttackCooldownMs = 650;
// Configurable policy reserved for Phase 5; no offline simulation in Phase 1.
struct FutureTimePolicy { uint32_t offlineCapSeconds = 7 * 24 * 60 * 60; };
enum class Phase : uint8_t { Ready, Battle, Victory, Defeat };
enum class Event : uint8_t { None, Encounter, Attack, Hurt, Victory, Defeat, LevelUp };
struct State {
    uint64_t worldSeed = 0;
    uint64_t revision = 0;
    uint32_t xp = 0;
    uint32_t victories = 0;
    uint16_t level = 1;
    uint16_t hp = 30;
    uint16_t monsterHp = 0;
    uint16_t generatorVersion = kGeneratorVersion;
    uint16_t rulesVersion = kRulesVersion;
    Phase phase = Phase::Ready;
    uint8_t motionPreset = 1;
};
uint16_t levelForXp(uint32_t xp);
uint32_t nextLevelXp(uint16_t level);
uint16_t maxHp(uint16_t level);
bool validState(const State &state);
class Game {
public:
    explicit Game(uint64_t seed = 0);
    const State &state() const { return state_; }
    bool restore(const State &state, uint32_t now);
    bool encounter(uint32_t now);
    bool attack(uint32_t now);
    bool tick(uint32_t now);
    void cycleMotionPreset();
    Event event() const { return event_; }
    uint32_t eventAt() const { return eventAt_; }
private:
    void emit(Event event, uint32_t now);
    State state_;
    Event event_ = Event::None;
    uint32_t eventAt_ = 0;
    uint32_t lastAttack_ = 0;
    uint32_t lastEnemy_ = 0;
    bool attacked_ = false;
};
}
