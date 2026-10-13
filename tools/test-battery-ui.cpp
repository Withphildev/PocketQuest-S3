#include "../firmware/include/BatteryUi.h"
#include <cassert>
#include <iostream>
int main() {
    assert(batteryPercent(-1)==-1 && batteryPercent(0)==0);
    assert(batteryPercent(101)==100 && batteryFill(-1)==0);
    assert(batteryFill(0)==0 && batteryFill(1)==1 && batteryFill(100)==16);
    for(int i=0;i<=100;i++) assert(batteryFill(i)>=0 && batteryFill(i)<=16);
    // Classic default font dimensions used by both PocketBoy and PocketQuest.
    assert(6+14*6*2<=174); // title ends before battery region
    assert(6+16*6*2<=240); // PocketQuest-XXXX SSID
    assert(6+13*6*2<=240); // Quest + eight hex characters
    assert(69+8*2<=94); // password ends before browser URL
    assert(113+123<=240 && 6+123<=135); // QR box
    assert(6+13*6<=113); // QR footer is left of code
    std::cout<<"PASS: battery clamp/fill and default-font connection layout bounds\n";
}
