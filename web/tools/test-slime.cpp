#include "../build/slime-blue/SlimeBlueSprites.h"
#include <cassert>
#include <algorithm>
#include <iostream>
struct Display {
    uint16_t pixels[240*135]; int fills=0;
    void fillRect(int x,int y,int w,int h,uint16_t color) {
        assert(x>=0 && y>=0 && x+w<=240 && y+h<=135);++fills;
        for(int yy=y;yy<y+h;yy++)for(int xx=x;xx<x+w;xx++)pixels[yy*240+xx]=color;
    }
};
int main() {
    Display d;
    for(int f=0;f<8;f++) {
        std::fill(d.pixels,d.pixels+240*135,0x1234);
        pq_slime::drawFrame(d,f,186,82);
        for(int y=0;y<135;y++)for(int x=0;x<240;x++) {
            uint16_t expected=0x1234;
            if(x>=162 && x<210 && y>=40 && y<88) {
                int n=f*2304+(y-40)*48+x-162;
                if(pq_slime::maskByte(n/8)&(1<<(7-n%8)))expected=pq_slime::pixel(n);
            }
            assert(d.pixels[y*240+x]==expected);
        }
    }
    int before=d.fills;pq_slime::drawFrame(d,-1,186,82);pq_slime::drawFrame(d,8,186,82);assert(d.fills==before);
    std::cout<<"PASS: 8 masked LCD frame draws, full screen comparison, bounds and invalid-frame guards\n";
}
