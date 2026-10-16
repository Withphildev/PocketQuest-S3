#include "../firmware/include/RouteStatus.h"
#include <cassert>
#include <iostream>
int main(){
 uint64_t n=0;assert(pq::routeBase("18446744073709551615",n)&&n==UINT64_MAX);
 for(const auto *s:{"","-1","1e3","1.0","01","18446744073709551616"," 1","1\n"})assert(!pq::routeBase(s,n));
 assert(pq::routeOrigin("PocketQuest","http://pocketquest"));assert(pq::routeOrigin("192.168.4.1:80","http://192.168.4.1"));
 assert(!pq::routeOrigin("pocketquest.evil","http://pocketquest.evil"));assert(!pq::routeOrigin("pocketquest","null"));assert(!pq::routeOrigin("pocketquest","http://evil"));assert(!pq::routeOrigin("evil","http://evil"));assert(!pq::routeOrigin("pocketquest","http://pocketquest.evil"));
 assert(pq::routeCode("attack")==1&&pq::routeCode("awardXP")==-1);
 std::cout<<"PASS: bounded uint64, command whitelist, exact Origin/Host checks\n";
}
