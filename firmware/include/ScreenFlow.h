#pragma once
#include <cstdint>
class ScreenFlow {
public:
    enum class Screen { Splash, Wifi, Qr, Game };
    void begin(uint32_t now) { started_=now; screen_=Screen::Splash; }
    bool update(uint32_t now, bool next) {
        if(screen_==Screen::Splash) {
            if(now-started_<2500) return false;
            screen_=Screen::Wifi; return true; // discard splash input
        }
        if(!next) return false;
        screen_=screen_==Screen::Wifi ? Screen::Qr : screen_==Screen::Qr ? Screen::Game : Screen::Wifi;
        return true;
    }
    Screen screen() const { return screen_; }
    bool gaming() const { return screen_==Screen::Game; }
private:
    Screen screen_=Screen::Splash;
    uint32_t started_=0;
};
