#include "../firmware/include/BattleAnimation.h"
#include <Game.h>
#include <cassert>
#include <iostream>
int main() {
    BattleAnimation a; assert(a.frame(0)==-1); a.start(1000);
    assert(a.frame(1000)==0 && a.frame(1099)==0);
    assert(a.frame(1100)==1 && a.frame(1179)==1);
    assert(a.frame(1180)==2 && a.frame(1279)==2);
    assert(a.frame(1280)==3 && a.frame(1479)==3 && a.frame(1480)==-1);
    a.start(UINT32_MAX-50); assert(a.frame(49)==1 && a.frame(429)==-1);
    pq::Game game(123); game.encounter(0);
    if(game.attack(1000)) a.start(1000);
    assert(a.frame(1000)==0);
    if(game.attack(1100)) a.start(1100); // rejected cooldown must not restart
    assert(a.frame(1100)==1);
    assert(game.attack(1650));
    // Accepted finishing blow still animates even when event becomes Victory.
    if(game.attack(2300)) a.start(2300);
    assert(game.state().monsterHp==0 && a.frame(2300)==0);
    std::cout<<"PASS: animation timing, wraparound, rejected cooldown and finishing blow\n";
}
