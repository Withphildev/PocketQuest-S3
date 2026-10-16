#include "Game.h"
#include "Route.h"
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
uint8_t enemyTier(uint32_t victories) { return static_cast<uint8_t>(std::min<uint32_t>(victories/5,5)); }
uint16_t enemyMaxHp(uint32_t victories,EnemyKind kind) { return static_cast<uint16_t>((kind==EnemyKind::Goblin ? 38 : kind==EnemyKind::DireWolf ? 26 : kMonsterMaxHp)+6*enemyTier(victories)); }
uint16_t enemyDamage(uint32_t victories,EnemyKind kind) { return static_cast<uint16_t>((kind==EnemyKind::Goblin ? 6 : kind==EnemyKind::DireWolf ? 4 : 3)+enemyTier(victories)); }
EnemyKind encounterKind(uint32_t victories) {
    if(victories>=10) {
        const auto slot=(victories-10)%3;
        return slot==0 ? EnemyKind::Goblin : slot==1 ? EnemyKind::Slime : EnemyKind::DireWolf;
    }
    return victories>=5 && (victories-5)%2==0 ? EnemyKind::DireWolf : EnemyKind::Slime;
}
const char *enemyName(EnemyKind kind) { return kind==EnemyKind::Goblin ? "Goblin" : kind==EnemyKind::DireWolf ? "Dire Wolf" : "Slime"; }
bool validState(const State &s) {
    const bool phaseOk = static_cast<uint8_t>(s.phase) <= static_cast<uint8_t>(Phase::Defeat);
    return phaseOk && validRoute(s) && s.worldSeed != 0 && s.level == levelForXp(s.xp) && s.level >= 1 && s.level <= 99 &&
        s.generatorVersion == kGeneratorVersion && s.rulesVersion == kRulesVersion && s.motionPreset <= 2 &&
        (s.enemyKind==EnemyKind::Slime || s.enemyKind==EnemyKind::DireWolf || s.enemyKind==EnemyKind::Goblin) &&
        s.hp <= maxHp(s.level) && s.monsterHp <= enemyMaxHp(s.victories,s.enemyKind) &&
        (s.phase != Phase::Battle || (s.hp > 0 && s.monsterHp > 0)) &&
        (s.phase != Phase::Defeat || (s.hp == 0 && s.monsterHp > 0)) &&
        (s.phase != Phase::Victory || (s.monsterHp == 0 && s.hp > 0)) &&
        (s.phase != Phase::Ready || (s.monsterHp == 0 && s.hp > 0));
}
Game::Game(uint64_t seed) { state_.worldSeed = seed; }
void Game::emit(Event event, uint32_t now) { event_ = event; eventAt_ = now; ++state_.revision; }
bool Game::restore(const State &s, uint32_t now) {
    State compatible=s;
    if(compatible.rulesVersion==3 && (compatible.enemyKind==EnemyKind::Slime || compatible.enemyKind==EnemyKind::DireWolf)) compatible.rulesVersion=kRulesVersion;
    if((compatible.rulesVersion==1 || compatible.rulesVersion==2) && compatible.enemyKind==EnemyKind::Slime &&
       compatible.monsterHp<=(compatible.rulesVersion==1 ? kMonsterMaxHp : enemyMaxHp(compatible.victories))) compatible.rulesVersion=kRulesVersion;
    if (!validState(compatible)) return false;
    state_ = compatible; lastEnemy_ = lastAttack_ = now; attacked_ = true; event_ = Event::None;
    return true;
}
bool Game::encounter(uint32_t now) {
    if (state_.phase == Phase::Battle || state_.route.phase==RoutePhase::Battle) return false;
    state_.enemyKind=encounterKind(state_.victories);
    state_.hp = maxHp(state_.level); state_.monsterHp = enemyMaxHp(state_.victories,state_.enemyKind); state_.phase = Phase::Battle;
    lastEnemy_ = now; attacked_ = false; emit(Event::Encounter, now); return true;
}
bool Game::attack(uint32_t now) {
    if (state_.route.phase==RoutePhase::Battle || state_.phase != Phase::Battle || (attacked_ && now - lastAttack_ < kAttackCooldownMs)) return false;
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
    if (state_.route.phase==RoutePhase::Battle || state_.phase != Phase::Battle || now - lastEnemy_ < 1800) return false;
    // One strike per update: no burst of overdue attacks after a slow flash write.
    const auto damage=enemyDamage(state_.victories,state_.enemyKind);
    lastEnemy_ = now; state_.hp = state_.hp > damage ? state_.hp - damage : 0;
    if (state_.hp == 0) { state_.phase = Phase::Defeat; emit(Event::Defeat, now); }
    else emit(Event::Hurt, now);
    return true;
}
void Game::cycleMotionPreset() { state_.motionPreset = (state_.motionPreset + 1) % 3; ++state_.revision; }
}
