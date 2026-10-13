#include "../firmware/include/DeviceCredentials.h"
#include <cassert>
#include <cstring>
#include <iostream>
int main() {
    DeviceCredentials a(0x1234E4B1E87CULL),again(0x1234E4B1E87CULL),other(0x1234E4B1E87DULL);
    assert(!std::strcmp(a.ssid,"PocketQuest-E87C"));
    assert(!std::strcmp(a.password,"QuestE4B1E87C"));
    assert(!std::strcmp(a.ssid,again.ssid) && !std::strcmp(a.password,again.password));
    assert(std::strcmp(a.ssid,other.ssid) && std::strcmp(a.password,other.password));
    DeviceCredentials zero(0),max(UINT64_MAX);
    assert(std::strlen(zero.ssid)==16 && std::strlen(max.password)==13);
    assert(!std::strcmp(zero.password,"Quest00000000"));
    std::cout<<"PASS: credential golden vector, repeatability, different chip suffixes and bounds\n";
}
