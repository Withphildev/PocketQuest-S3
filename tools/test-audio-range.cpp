#include "AudioRange.h"
#include <cassert>
#include <iostream>
int main(){
  auto check=[](const char*h,int status,size_t first,size_t last){const auto r=pq::audioRange(h,100);assert(r.status==status);if(status!=416){assert(r.first==first);assert(r.last==last);}};
  check("",200,0,99);check(nullptr,200,0,99);check("bytes=0-",206,0,99);check("bytes=5-8",206,5,8);check("bytes=99-999",206,99,99);check("bytes=-5",206,95,99);check("bytes=-999",206,0,99);
  for(const char*h:{"bytes=100-","bytes=3-2","bytes=-0","bytes=-","bytes=","bytes=1","bytes=1-2,3-4","bytes=1-2x","items=0-1","bytes=9999999999999999999999999999999999-"})check(h,416,0,0);
  assert(pq::audioRange("",0).status==416);std::cout<<"PASS: audio byte range parsing, rejection and overflow bounds\n";
}
