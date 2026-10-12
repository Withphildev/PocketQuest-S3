#pragma once
#include <M5Unified.h>
#include <Game.h>
#include <Motion.h>

class QuestDisplay {
public:
    void begin();
    void splash();
    void frame(const pq::Game &game, const pq::MotionDebug &motion, bool imu,
               const char *saveStatus, bool saveError, uint64_t sequence, bool debug, uint32_t now);
private:
    M5Canvas canvas_{&M5.Display};
    bool canvasReady_ = false;
};
