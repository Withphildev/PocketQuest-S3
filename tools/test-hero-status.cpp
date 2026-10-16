#include "../firmware/include/HeroStatus.h"
#include <Save.h>
#include <cassert>
#include <iostream>
#include <limits>
int main() {
    pq::Game g(123);pq::State saved=g.state();
    std::cout<<pq::heroStatusJson(g.state(),&saved,"SAVED",true,false,2,"boot-a")<<'\n';
    g.encounter(0);g.attack(0);g.attack(650);g.attack(1300);
    assert(saved.xp==0 && g.state().xp==12);
    std::cout<<pq::heroStatusJson(g.state(),&saved,"UNSAVED",true,false,2,"boot-a")<<'\n';
    const auto bytes=pq::encode({g.state(),3});pq::Snapshot snapshot;assert(pq::decode(bytes,snapshot)==pq::DecodeResult::Ok);
    saved=snapshot.state;
    std::cout<<pq::heroStatusJson(g.state(),&saved,"SAVED",true,false,snapshot.sequence,"boot-a")<<'\n';
    pq::Game restarted;assert(restarted.restore(snapshot.state,0));
    std::cout<<pq::heroStatusJson(restarted.state(),&saved,"RESTORED",true,false,3,"boot-b")<<'\n';
    std::cout<<pq::heroStatusJson(g.state(),nullptr,"NO SAVE FS",false,true,0,"boot-c")<<'\n';
    g.encounter(2000);g.attack(2000);g.attack(2650);g.attack(3300);assert(g.state().xp==24 && saved.xp==12);
    std::cout<<pq::heroStatusJson(g.state(),&saved,"SAVE FAILED",true,true,3,"boot-a")<<'\n';
    auto max=saved;max.xp=UINT32_MAX;max.victories=UINT32_MAX;max.level=99;max.hp=pq::maxHp(99);max.revision=UINT64_MAX;
    std::cout<<pq::heroStatusJson(max,&max,"SAVED",true,false,UINT64_MAX,"boot-max")<<'\n';
    std::cout<<pq::heroStatusJson(g.state(),&saved,"quote\"slash\\newline\n",true,true,3,"boot-a")<<'\n';
    auto wolf=saved;wolf.victories=5;wolf.xp=60;wolf.level=3;wolf.hp=pq::maxHp(3);wolf.phase=pq::Phase::Battle;wolf.enemyKind=pq::EnemyKind::DireWolf;wolf.monsterHp=32;
    assert(pq::validState(wolf));
    std::cout<<pq::heroStatusJson(wolf,&wolf,"SAVED",true,false,20,"boot-wolf")<<'\n';
    auto goblin=wolf;goblin.enemyKind=pq::EnemyKind::Goblin;goblin.victories=10;goblin.monsterHp=50;
    assert(pq::validState(goblin));
    std::cout<<pq::heroStatusJson(goblin,&goblin,"SAVED",true,false,21,"boot-goblin")<<'\n';
}
