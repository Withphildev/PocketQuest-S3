#include "../firmware/include/RouteStatus.h"
#include <iostream>
int main(){
    unsigned count=0;
    for(uint64_t seed:{123ull,0xfedcba9876543210ull,0xffffffffffffffffull})
    for(uint32_t outing:{1u,7u,UINT32_MAX})
    for(uint32_t section:{0u,1u,2u,5u,6u,30u,UINT32_MAX})
    for(uint16_t tier:{uint16_t(1),uint16_t(50),uint16_t(99)}){
        pq::State s;s.worldSeed=seed;s.journey={outing,section,tier,tier,1};s.route.encounter=pq::journeyEncounter(s);
        if(!pq::validState(s))return 1;
        auto loss=[&](pq::RouteCommand command,bool heavy){
            auto battle=s;battle.xp=UINT32_MAX;battle.level=99;battle.hp=pq::maxHp(99);battle.route.hp=pq::routeMaxHp(99);
            if(pq::routeCommand(battle,0,pq::RouteCommand::Start,0)!=pq::RouteResult::Applied)return -1;
            if(heavy)battle.route.round=3;
            if(pq::routeCommand(battle,battle.revision,command,0)!=pq::RouteResult::Applied)return -1;
            return int(pq::routeMaxHp(99)-battle.route.hp);
        };
        auto row=pq::routeStatusJson(s,1,"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",true,true,"");row.pop_back();
        std::cout<<row<<",\"ordinaryLoss\":"<<loss(pq::RouteCommand::Item,false)<<",\"guardLoss\":"<<loss(pq::RouteCommand::Guard,false)<<",\"heavyLoss\":"<<loss(pq::RouteCommand::Item,true)<<"}"<<'\n';++count;
    }
    return count==189?0:2;
}
