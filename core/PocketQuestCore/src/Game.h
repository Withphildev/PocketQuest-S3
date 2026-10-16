#pragma once
#include <cstdint>

namespace pq {
constexpr uint16_t kGeneratorVersion = 1;
constexpr uint16_t kRulesVersion = 4;
constexpr uint16_t kMonsterMaxHp = 18;
constexpr uint32_t kAttackCooldownMs = 650;
// Configurable policy reserved for Phase 5; no offline simulation in Phase 1.
struct FutureTimePolicy { uint32_t offlineCapSeconds = 7 * 24 * 60 * 60; };
enum class Phase : uint8_t { Ready, Battle, Victory, Defeat };
enum class Event : uint8_t { None, Encounter, Attack, Hurt, Victory, Defeat, LevelUp };
enum class EnemyKind : uint8_t { Slime=0, DireWolf=1, Goblin=2 };
enum class RoutePhase : uint8_t { Explore, Battle, Victory, Defeat, Escape };
struct RouteState {
    RoutePhase phase=RoutePhase::Explore;
    uint8_t cleared=0,encounter=0,focus=3,potions=2,target=0;
    uint16_t hp=40,enemyHp[2]={0,0},round=1;
    uint64_t lastBase=UINT64_MAX;
    uint8_t lastCommand=255,lastTarget=0;
};
struct JourneyState {
    uint32_t outing=0,section=0;
    uint16_t tier=1,highest=1;
    uint8_t mode=0; // 0 Oakwood, 1 outward road, 2 short peaceful return
    uint8_t chestOpened=0; // current outing/section only; old sections cannot be revisited
};
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
    EnemyKind enemyKind = EnemyKind::Slime;
    RouteState route;
    JourneyState journey;
};
uint16_t levelForXp(uint32_t xp);
uint32_t nextLevelXp(uint16_t level);
uint16_t maxHp(uint16_t level);
uint8_t enemyTier(uint32_t victories);
uint16_t enemyMaxHp(uint32_t victories,EnemyKind kind=EnemyKind::Slime);
uint16_t enemyDamage(uint32_t victories,EnemyKind kind=EnemyKind::Slime);
EnemyKind encounterKind(uint32_t victories);
const char *enemyName(EnemyKind kind);
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
