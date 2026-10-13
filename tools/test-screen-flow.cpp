#include "../firmware/include/ScreenFlow.h"
#include <Game.h>
#include <cassert>
#include <iostream>
int main() {
    using S=ScreenFlow::Screen;
    ScreenFlow f; f.begin(100);
    assert(!f.update(2599,true) && f.screen()==S::Splash);
    assert(f.update(2600,true) && f.screen()==S::Wifi && !f.gaming());
    assert(!f.update(2700,false));
    assert(f.update(2800,true) && f.screen()==S::Qr);
    assert(f.update(2900,true) && f.gaming());
    assert(f.update(3000,true) && f.screen()==S::Wifi);
    f.begin(UINT32_MAX-1000); assert(!f.update(1498,true));
    assert(f.update(1499,false) && f.screen()==S::Wifi);
    // The game clock advances only on the mini-game screen. No offscreen damage.
    pq::Game game(123); game.encounter(0); uint32_t clock=0;
    for(int i=0;i<100;i++) { if(f.gaming()) {clock+=100;game.tick(clock);} }
    assert(game.state().hp==30 && clock==0);
    f.update(2000,true); f.update(2100,true);
    assert(f.gaming()); clock+=1800;game.tick(clock); assert(game.state().hp==27);
    std::cout<<"PASS: 2500ms splash, ignored splash input, M5 cycle, wraparound, paused game clock\n";
}
