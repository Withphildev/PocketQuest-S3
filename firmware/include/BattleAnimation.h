#pragma once
#include <cstdint>
// Cosmetic state only; never changes Game damage, cooldown, or saves.
class BattleAnimation {
public:
    void start(uint32_t now) { started_=now; active_=true; }
    int frame(uint32_t now) const {
        const uint32_t elapsed=now-started_;
        if(!active_ || elapsed>=480) return -1;
        return elapsed<100 ? 0 : elapsed<180 ? 1 : elapsed<280 ? 2 : 3;
    }
private:
    uint32_t started_=0;
    bool active_=false;
};
