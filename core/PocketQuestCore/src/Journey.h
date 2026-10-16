#pragma once
#include "Game.h"
namespace pq {
constexpr uint16_t kJourneyMaxTier=99;
// Explicit uint32 arithmetic is mirrored by Math.imul in the browser demo.
inline uint32_t journeyHash(uint64_t seed,uint32_t outing,uint32_t section){
    uint32_t n=static_cast<uint32_t>(seed)^static_cast<uint32_t>(seed>>32);
    n^=outing*0x9e3779b9u;n^=section*0x85ebca6bu;
    n^=n>>16;n*=0x7feb352du;n^=n>>15;n*=0x846ca68bu;n^=n>>16;return n;
}
inline uint8_t journeyEncounter(const State &s){
    const auto h=journeyHash(s.worldSeed,s.journey.outing,s.journey.section);
    // First two sections are ordinary. A boss is guaranteed by section six,
    // with additional seeded surprise opportunities before/after that milestone.
    return s.journey.section>=2&&(s.journey.section%6==5||h%5==0)?3:static_cast<uint8_t>(h%3);
}
inline uint16_t journeyPosition(const State &s){return 320+journeyHash(s.worldSeed,s.journey.outing,s.journey.section)%401;}
inline uint32_t chestHash(const State &s){return journeyHash(s.worldSeed^0x4348455354ull,s.journey.outing,s.journey.section);}
inline bool chestExists(const State &s){return s.journey.outing&&((s.journey.outing==1&&s.journey.section==0)||chestHash(s)%3==0);}
inline uint16_t chestPosition(const State &s){const auto start=journeyPosition(s)+90;return static_cast<uint16_t>(start+chestHash(s)%(961-start));}
inline bool chestPotion(const State &s){return (chestHash(s)>>8)%2==0;}
inline uint16_t routeEnemyHp(const State &s){
    constexpr uint16_t hp[]={16,24,32,64};
    return hp[s.route.encounter]+(s.journey.outing?2*(s.journey.tier-1):0);
}
inline unsigned routeHit(const State &s){
    constexpr unsigned damage[]={3,4,6,8};
    return damage[s.route.encounter]+(s.journey.outing?(s.journey.tier-1)/3:0);
}
inline bool validJourney(const State &s){
    const auto &j=s.journey;
    if(j.mode>2||j.chestOpened>1||(j.chestOpened&&!chestExists(s))||!j.tier||j.tier>kJourneyMaxTier||!j.highest||j.highest>kJourneyMaxTier||j.tier>j.highest)return false;
    if(!j.outing)return !j.mode&&!j.section&&!j.chestOpened&&j.tier==1&&j.highest==1;
    if(j.chestOpened&&!s.route.cleared)return false;
    if(s.route.cleared>1)return false;
    if(j.mode!=1&&(s.route.phase!=RoutePhase::Explore||s.route.enemyHp[0]||s.route.enemyHp[1]))return false;
    return s.route.encounter==journeyEncounter(s);
}
}
