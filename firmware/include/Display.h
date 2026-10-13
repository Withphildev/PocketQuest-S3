#pragma once
#include <M5Unified.h>
#include <Game.h>
#include <Motion.h>
#include "BattleAnimation.h"

class QuestDisplay {
public:
    void begin();
    void splash();
    bool updateBattery();
    void connection(const char *ssid, const char *password, const char *url, const char *qr, bool ready, bool showQr);
    void attack(uint32_t now) { animation_.start(now); }
    void frame(const pq::Game &game, const pq::MotionDebug &motion, bool imu,
               const char *saveStatus, bool saveError, uint64_t sequence, bool debug, uint32_t now);
private:
    M5Canvas canvas_{&M5.Display};
    bool canvasReady_ = false;
    BattleAnimation animation_;
    int battery_=-1;
    bool charging_=false;
    void battery(lgfx::LGFXBase &display, uint16_t background, int dx=0, int dy=0);
};
