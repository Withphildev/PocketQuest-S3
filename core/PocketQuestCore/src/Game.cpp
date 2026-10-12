#include "Game.h"
#include <algorithm>
#include <limits>

namespace pq {
uint32_t nextLevelXp(uint16_t level) { return 10u * level * (level + 1u); }
uint16_t levelForXp(uint32_t xp) {
    uint16_t level = 1;
    while (level < 99 && xp >= nextLevelXp(level)) ++level;
    return level;
}
uint16_t maxHp(uint16_t level) { return static_cast<uint16_t>(30 + 4 * (level - 1)); }
bool validState(const State &s) {
    const bool phaseOk = static_cast<uint8_t>(s.phase) <= static_cast<uint8_t>(Phase::Defeat);
    return phaseOk && s.worldSeed != 0 && s.level == levelForXp(s.xp) && s.level >= 1 && s.level <= 99 &&
        s.generatorVersion == kGeneratorVersion && s.rulesVersion == kRulesVersion && s.motionPreset <= 2 &&
        s.hp <= maxHp(s.level) && s.monsterHp <= kMonsterMaxHp &&
        (s.phase != Phase::Battle || (s.hp > 0 && s.monsterHp > 0)) &&
        (s.phase != Phase::Defeat || (s.hp == 0 && s.monsterHp > 0)) &&
        (s.phase != Phase::Victory || (s.monsterHp == 0 && s.hp > 0)) &&
        (s.phase != Phase::Ready || (s.monsterHp == 0 && s.hp > 0));
}
Game::Game(uint64_t seed) { state_.worldSeed = seed; }
void Game::emit(Event event, uint32_t now) { event_ = event; eventAt_ = now; ++state_.revision; }
bool Game::restore(const State &s, uint32_t now) {
    if (!validState(s)) return false;
    state_ = s; lastEnemy_ = lastAttack_ = now; attacked_ = true; event_ = Event::None;
    return true;
}
bool Game::encounter(uint32_t now) {
    if (state_.phase == Phase::Battle) return false;
    state_.hp = maxHp(state_.level); state_.monsterHp = kMonsterMaxHp; state_.phase = Phase::Battle;
    lastEnemy_ = now; attacked_ = false; emit(Event::Encounter, now); return true;
}
bool Game::attack(uint32_t now) {
    if (state_.phase != Phase::Battle || (attacked_ && now - lastAttack_ < kAttackCooldownMs)) return false;
    attacked_ = true; lastAttack_ = now;
    const uint16_t damage = static_cast<uint16_t>(5 + state_.level * 2);
    state_.monsterHp = state_.monsterHp > damage ? state_.monsterHp - damage : 0;
    if (state_.monsterHp != 0) { emit(Event::Attack, now); return true; }
    const uint16_t oldLevel = state_.level;
    state_.xp = state_.xp > std::numeric_limits<uint32_t>::max() - 12
        ? std::numeric_limits<uint32_t>::max() : state_.xp + 12;
    if (state_.victories != std::numeric_limits<uint32_t>::max()) ++state_.victories;
    state_.level = levelForXp(state_.xp); state_.phase = Phase::Victory;
    if (state_.level > oldLevel) state_.hp = maxHp(state_.level);
    emit(state_.level > oldLevel ? Event::LevelUp : Event::Victory, now); return true;
}
bool Game::tick(uint32_t now) {
    if (state_.phase != Phase::Battle || now - lastEnemy_ < 1800) return false;
    // One strike per update: no burst of overdue attacks after a slow flash write.
    lastEnemy_ = now; state_.hp = state_.hp > 3 ? state_.hp - 3 : 0;
    if (state_.hp == 0) { state_.phase = Phase::Defeat; emit(Event::Defeat, now); }
    else emit(Event::Hurt, now);
    return true;
}
void Game::cycleMotionPreset() { state_.motionPreset = (state_.motionPreset + 1) % 3; ++state_.revision; }
}
