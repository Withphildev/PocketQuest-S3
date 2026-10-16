#ifdef TEST_GOBLIN
#include "../firmware/include/art/GoblinSprites.h"
namespace enemy_art=pq_goblin;
#else
#include "../firmware/include/art/DireWolfSprites.h"
namespace enemy_art=pq_wolf;
#endif
#include "../firmware/include/SlimeAnimation.h"
#include <cassert>
#include <algorithm>
#include <iostream>
struct Display {
    uint16_t pixels[240*135];
    void fillRect(int x,int y,int w,int h,uint16_t c) {
        assert(x>=0 && y>=0 && x+w<=240 && y+h<=135);
        for(int yy=y;yy<y+h;yy++)for(int xx=x;xx<x+w;xx++)pixels[yy*240+xx]=c;
    }
};
int main() {
    Display d;
    for(int f=0;f<8;f++) {
        std::fill(d.pixels,d.pixels+240*135,0x1234);enemy_art::drawFrame(d,f,186,82);
        for(int y=0;y<135;y++)for(int x=0;x<240;x++) {
            uint16_t expected=0x1234;
            if(x>=154 && x<218 && y>=40 && y<88) {
                int n=f*3072+(y-40)*64+x-154;
                if(enemy_art::maskByte(n/8)&(1<<(7-n%8)))expected=enemy_art::pixel(n);
            }
            assert(d.pixels[y*240+x]==expected);
        }
    }
    SlimeAnimation a;a.attack(0);
    for(uint32_t t=0;t<=420;t++)enemy_art::drawFrame(d,a.frame(t,false),186+a.offsetX(t,false),82);
    std::cout<<"PASS: all enemy masked draws match expected pixels; complete lunge stays on LCD\n";
}
