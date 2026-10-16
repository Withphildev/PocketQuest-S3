#pragma once
#include "Game.h"
#include "Journey.h"
namespace pq {
enum class RouteCommand : uint8_t { Start,Attack,Skill,Guard,Item,Run,Continue,Camp,Depart,Return,Advance,Chest };
enum class RouteResult { Applied,Duplicate,Conflict,Invalid,Busy };
inline uint16_t routeMaxHp(uint16_t level){return 40+4*(level-1);}
inline unsigned routeCount(unsigned encounter){return encounter==1?2:1;}
inline uint16_t routeEnemyMax(unsigned encounter){constexpr uint16_t hp[]={16,24,32,64};return encounter<4?hp[encounter]:0;}
inline int routeFrontier(uint8_t cleared){for(int i=0;i<4;i++)if(!(cleared&(1<<i)))return i;return -1;}
inline bool validRoute(const State &s){
    const auto &r=s.route;
    if(static_cast<unsigned>(r.phase)>4 || r.encounter>3 || r.focus>3 || r.potions>2 || r.target>=routeCount(r.encounter) || !r.round || r.hp>routeMaxHp(s.level))return false;
    if(r.cleared!=0&&r.cleared!=1&&r.cleared!=3&&r.cleared!=7&&r.cleared!=15)return false;
    if(!validJourney(s))return false;
    if(r.lastCommand!=255&&(r.lastCommand>11||r.lastBase>=s.revision||r.lastTarget>3))return false;
    if(r.lastCommand!=255&&r.lastCommand!=0&&r.lastTarget>((r.lastCommand==1||r.lastCommand==2)?1:0))return false;
    if(r.lastCommand==255&&(r.lastBase!=UINT64_MAX||r.lastTarget!=0))return false;
    if(r.enemyHp[0]>routeEnemyHp(s)||r.enemyHp[1]>(r.encounter==1?routeEnemyHp(s):0))return false;
    const bool living=r.enemyHp[0]||r.enemyHp[1];
    const bool frontier=s.journey.outing?r.cleared==0:routeFrontier(r.cleared)==r.encounter;
    if(r.phase==RoutePhase::Battle)return r.hp>0&&living&&r.enemyHp[r.target]>0&&frontier&&s.phase!=Phase::Battle;
    if(r.phase==RoutePhase::Victory)return !living&&r.hp>0&&(s.journey.outing?r.cleared==1:bool(r.cleared&(1<<r.encounter)));
    if(r.phase==RoutePhase::Defeat)return !r.hp&&living&&frontier;
    if(r.phase==RoutePhase::Escape)return r.hp>0&&living&&frontier;
    return !living&&r.hp>0;
}
// A candidate is copied by the coordinator, saved/read back, THEN published.
// The command contains no client XP, damage, HP, level or cleared-state fields.
inline RouteResult routeCommand(State &s,uint64_t base,RouteCommand command,uint8_t target){
    const auto code=static_cast<uint8_t>(command);auto &r=s.route;
    if(!validState(s)||code>11||target>3)return RouteResult::Invalid;
    if(base==r.lastBase&&code==r.lastCommand&&target==r.lastTarget)return RouteResult::Duplicate;
    if(base!=s.revision||s.revision==UINT64_MAX)return RouteResult::Conflict;
    if(s.phase==Phase::Battle)return RouteResult::Busy;
    auto &j=s.journey;
    if(command==RouteCommand::Depart){
        if(target||r.phase!=RoutePhase::Explore||j.mode||j.outing==UINT32_MAX)return RouteResult::Invalid;
        ++j.outing;j.section=0;j.tier=j.highest>1?j.highest-1:1;j.mode=1;j.chestOpened=0;
        r.cleared=0;r.encounter=journeyEncounter(s);r.target=0;r.round=1;
    }else if(command==RouteCommand::Return){
        if(target||!j.outing||j.mode!=1||r.phase==RoutePhase::Battle||r.phase==RoutePhase::Defeat)return RouteResult::Invalid;
        j.mode=2;r.phase=RoutePhase::Explore;r.enemyHp[0]=r.enemyHp[1]=0;r.target=0;
    }else if(command==RouteCommand::Advance){
        if(target||!j.outing||j.mode!=1||r.phase!=RoutePhase::Explore||!r.cleared||j.section==UINT32_MAX)return RouteResult::Invalid;
        ++j.section;j.chestOpened=0;if(j.section%3==0&&j.tier<kJourneyMaxTier)++j.tier;
        if(j.tier>j.highest)j.highest=j.tier;
        r.cleared=0;r.encounter=journeyEncounter(s);r.round=1;
    }else if(command==RouteCommand::Chest){
        if(target||j.mode!=1||r.phase!=RoutePhase::Explore||!r.cleared||!chestExists(s)||j.chestOpened)return RouteResult::Invalid;
        if(chestPotion(s)&&r.potions<2)++r.potions;
        else {if(r.hp==routeMaxHp(s.level))return RouteResult::Invalid;r.hp=static_cast<uint16_t>(r.hp+8>routeMaxHp(s.level)?routeMaxHp(s.level):r.hp+8);}
        j.chestOpened=1;
    }else if(command==RouteCommand::Start){
        if(r.phase!=RoutePhase::Explore)return RouteResult::Invalid;
        if(j.outing){if(j.mode!=1||r.cleared||target)return RouteResult::Invalid;}
        else {if(routeFrontier(r.cleared)!=target)return RouteResult::Invalid;r.encounter=target;}
        r.target=0;r.round=1;r.phase=RoutePhase::Battle;
        r.enemyHp[0]=routeEnemyHp(s);r.enemyHp[1]=r.encounter==1?routeEnemyHp(s):0;
    }else if(command==RouteCommand::Camp){
        if(target)return RouteResult::Invalid;
        r.phase=RoutePhase::Explore;r.hp=routeMaxHp(s.level);r.focus=3;r.potions=2;
        r.enemyHp[0]=r.enemyHp[1]=0;r.target=0;
        if(j.outing)j.mode=0;
    }else if(command==RouteCommand::Continue){
        if(target||(r.phase!=RoutePhase::Victory&&r.phase!=RoutePhase::Escape))return RouteResult::Invalid;
        r.phase=RoutePhase::Explore;r.enemyHp[0]=r.enemyHp[1]=0;r.target=0;
    }else{
        if(r.phase!=RoutePhase::Battle)return RouteResult::Invalid;
        if(command==RouteCommand::Attack||command==RouteCommand::Skill){
            if(target>=routeCount(r.encounter)||!r.enemyHp[target]||(command==RouteCommand::Skill&&!r.focus))return RouteResult::Invalid;
        }else if(target)return RouteResult::Invalid;
        if(command==RouteCommand::Run){
            if(r.encounter==3)return RouteResult::Invalid;
            r.phase=RoutePhase::Escape;
        }else{
            if(r.round==UINT16_MAX||(command==RouteCommand::Item&&!r.potions))return RouteResult::Invalid;
            if(command==RouteCommand::Attack||command==RouteCommand::Skill){
                const unsigned damage=(command==RouteCommand::Skill?22:11)+s.level*2;
                if(command==RouteCommand::Skill)--r.focus;
                r.enemyHp[target]=r.enemyHp[target]>damage?r.enemyHp[target]-damage:0;
            }else if(command==RouteCommand::Guard){if(r.focus<3)++r.focus;}
            else if(command==RouteCommand::Item){--r.potions;r.hp=static_cast<uint16_t>(r.hp+18>routeMaxHp(s.level)?routeMaxHp(s.level):r.hp+18);}
            if(!r.enemyHp[0]&&!r.enemyHp[1]){
                constexpr unsigned rewards[]={12,24,12,36};const unsigned xp=rewards[r.encounter];
                s.xp=s.xp>UINT32_MAX-xp?UINT32_MAX:s.xp+xp;
                if(s.victories<UINT32_MAX)++s.victories;
                const auto level=levelForXp(s.xp);if(level>s.level){s.level=level;r.hp=routeMaxHp(level);}
                // Cozy recovery is part of the same durable victory transaction.
                // It is not granted again by Continue, reload, or duplicate commands.
                r.hp=static_cast<uint16_t>(r.hp+6>routeMaxHp(s.level)?routeMaxHp(s.level):r.hp+6);
                if(j.outing)r.cleared=1;else r.cleared|=1<<r.encounter;
                r.phase=RoutePhase::Victory;
            }else{
                for(unsigned i=0;i<routeCount(r.encounter);i++)if(r.enemyHp[i]){
                    unsigned hit=routeHit(s)*(r.encounter==3&&r.round%3==0?2:1);
                    if(command==RouteCommand::Guard)hit=(hit+1)/2;
                    r.hp=r.hp>hit?r.hp-hit:0;
                    if(!r.hp){r.phase=RoutePhase::Defeat;break;}
                }
                ++r.round;r.target=r.enemyHp[0]?0:1;
            }
        }
    }
    r.lastBase=base;r.lastCommand=code;r.lastTarget=target;++s.revision;
    return RouteResult::Applied;
}
}
