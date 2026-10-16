#pragma once
#include <cstdint>
// Cosmetic notifications only. Damage/cooldowns remain authoritative in Game.
class SlimeAnimation {
public:
    void reset() { mode_=Mode::Idle; }
    void hurt(uint32_t now) { mode_=Mode::Hurt; started_=now; }
    void attack(uint32_t now) { mode_=Mode::Attack; started_=now; }
    int frame(uint32_t now,bool defeated) const {
        if(defeated) return 7;
        const uint32_t elapsed=now-started_;
        if(mode_==Mode::Hurt && elapsed<220) return 6;
        if(mode_==Mode::Attack && elapsed<640) return elapsed<160 ? 3 : elapsed<380 ? 4 : 5;
        return (now/300)%2;
    }
    int offsetX(uint32_t now,bool defeated) const {
        if(defeated || mode_!=Mode::Attack) return 0;
        const uint32_t elapsed=now-started_;
        if(elapsed>=640) return 0;
        // Small wind-up back, then slide toward Nova, hold, and return home.
        if(elapsed<160) return static_cast<int>(4*elapsed/160);
        if(elapsed<320) return 4-static_cast<int>(104*(elapsed-160)/160);
        if(elapsed<380) return -100;
        return -100+static_cast<int>(100*(elapsed-380)/260);
    }
private:
    enum class Mode { Idle,Hurt,Attack };
    Mode mode_=Mode::Idle;
    uint32_t started_=0;
};
