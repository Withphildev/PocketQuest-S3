#include "../build/nova-sword/NovaSwordSprites.h"
#include <cassert>
#include <cstdio>
struct MockDisplay {
  uint16_t values[240*135];
  void clear(){for(auto &v:values)v=0x1234;}
  void fillRect(int x,int y,int w,int h,uint16_t c){assert(x>=0&&y>=0&&x+w<=240&&y+h<=135);for(int r=y;r<y+h;r++)for(int p=x;p<x+w;p++)values[r*240+p]=c;}
};
int main(){MockDisplay d;for(int f=0;f<16;f++){d.clear();pq_sword::drawFrame(d,f,44,82);for(int y=0;y<64;y++)for(int x=0;x<80;x++){int n=f*5120+y*80+x;bool visible=pq_sword::maskByte(n/8)&(1<<(7-n%8));assert(d.values[(26+y)*240+4+x]==(visible?pq_sword::pixel(n):0x1234));}}d.clear();pq_sword::drawFrame(d,-1,44,82);pq_sword::drawFrame(d,16,44,82);for(auto v:d.values)assert(v==0x1234);puts("PASS: RGB565 masked draw, all 16 frames, 240x135 bounds, invalid-frame guard");}
