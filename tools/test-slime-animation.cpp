#include "../firmware/include/SlimeAnimation.h"
#include <Game.h>
#include <cassert>
#include <iostream>
#include "../firmware/include/art/SlimeBlueSprites.h"
struct BoundsDisplay {
    void fillRect(int x,int y,int w,int h,uint16_t) {
        assert(x>=0 && y>=0 && x+w<=240 && y+h<=135);
    }
};
int main() {
    SlimeAnimation a;assert(a.frame(0,false)==0 && a.frame(300,false)==1);
    a.attack(1000);assert(a.frame(1000,false)==3 && a.frame(1159,false)==3);
    assert(a.frame(1160,false)==4 && a.frame(1379,false)==4);
    assert(a.frame(1380,false)==5 && a.frame(1639,false)==5);
    assert(a.frame(1640,false)==1);
    a.hurt(1500);assert(a.frame(1500,false)==6 && a.frame(1719,false)==6);
    assert(a.frame(1720,false)!=6);assert(a.frame(1500,true)==7);
    a.attack(UINT32_MAX-50);assert(a.frame(49,false)==3);
    a.reset();assert(a.frame(49,false)==0);
    pq::Game g(123);g.encounter(0);
    if(g.attack(0)) a.hurt(0);
    assert(a.frame(0,false)==6);
    if(g.attack(100)) a.hurt(100);assert(a.frame(220,false)==0); // rejected attack did not extend hurt
    if(g.tick(1800)) a.attack(1800);assert(a.frame(1800,false)==3 && g.state().hp==27);
    assert(g.attack(1900) && g.attack(2550));assert(g.state().phase==pq::Phase::Victory);
    assert(a.frame(2550,true)==7);
    g.encounter(2700);a.reset();assert(a.frame(2700,false)==1);
    assert(a.offsetX(2700,false)==0);a.attack(1000);
    assert(a.offsetX(1000,false)==0 && a.offsetX(1159,false)==3);
    assert(a.offsetX(1160,false)==4 && a.offsetX(1320,false)==-100);
    assert(a.offsetX(1379,false)==-100 && a.offsetX(1380,false)==-100);
    assert(a.offsetX(1510,false)==-50 && a.offsetX(1639,false)==-1 && a.offsetX(1640,false)==0);
    BoundsDisplay display;
    for(uint32_t t=1000;t<=1700;t++) {
        const int x=186+a.offsetX(t,false);assert(x>=86 && x<=190);
        pq_slime::drawFrame(display,a.frame(t,false),x,82);
        assert(a.offsetX(t,true)==0);
    }
    a.hurt(1100);assert(a.offsetX(1100,false)==0);
    a.attack(UINT32_MAX-99);assert(a.offsetX(60,false)==4 && a.offsetX(220,false)==-100);
    a.reset();assert(a.offsetX(220,false)==0);
    std::cout<<"PASS: lunge trajectory, stationary hurt/defeat/reset, timer wrap and all LCD bounds\n";
    std::cout<<"PASS: idle/attack/hurt/defeated, boundaries, wrap, rejected hits and new encounter\n";
}
