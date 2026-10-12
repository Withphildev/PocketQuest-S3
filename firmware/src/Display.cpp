#include "Display.h"
#include <cstdio>

namespace {
constexpr uint16_t bg=0x08a3, ink=0xef7d, green=0x6ed6, gold=0xfe48, red=0xf28c;
const char *eventText(pq::Event e) {
    switch(e) {
        case pq::Event::Encounter: return "A woodland slime appears!";
        case pq::Event::Attack: return "Strike!";
        case pq::Event::Hurt: return "Slime hit -3 HP";
        case pq::Event::Victory: return "Victory! +12 XP";
        case pq::Event::LevelUp: return "Level up! +12 XP";
        case pq::Event::Defeat: return "Rest, then try again";
        default: return "A small adventure awaits";
    }
}
}
void QuestDisplay::begin() {
    canvas_.setColorDepth(16);
    canvasReady_ = canvas_.createSprite(240,135) != nullptr;
}
void QuestDisplay::splash() {
    auto &d=M5.Display; d.fillScreen(bg); d.setTextColor(gold,bg); d.setTextSize(2);
    d.setCursor(24,35); d.print("PocketQuest"); d.setTextSize(1); d.setTextColor(ink,bg);
    d.setCursor(29,68); d.print("A little world. A big quest.");
    d.setCursor(39,94); d.print("Phase 1 prototype v0.1.0");
}
void QuestDisplay::frame(const pq::Game &g, const pq::MotionDebug &m, bool imu,
    const char *saveStatus, bool saveError, uint64_t sequence, bool debug, uint32_t now) {
    // Common drawing API supports a PSRAM canvas or direct-screen fallback.
    lgfx::LGFXBase &d=canvasReady_ ? static_cast<lgfx::LGFXBase &>(canvas_) : static_cast<lgfx::LGFXBase &>(M5.Display);
    const auto &s=g.state();
    d.fillScreen(bg); d.setTextSize(1); d.setTextColor(ink,bg); d.setCursor(5,4);
    d.printf("PocketQuest  Lv%u  XP%lu",s.level,static_cast<unsigned long>(s.xp));
    d.setCursor(5,17); d.printf("HP %u/%u",s.hp,pq::maxHp(s.level));
    d.drawRect(79,17,70,8,ink); d.fillRect(80,18,68*s.hp/pq::maxHp(s.level),6,green);
    const int bob=(now/350)%2;
    const bool flash=now-g.eventAt()<180 && g.event()==pq::Event::Hurt;
    // Original geometric placeholders; no external assets.
    d.fillRect(36,60+bob,14,15,flash ? red : green);
    d.fillRect(33,52+bob,20,12,gold); d.fillRect(36,49+bob,14,5,green);
    d.fillRect(37,55+bob,2,2,bg); d.fillRect(46,55+bob,2,2,bg);
    d.fillRect(36,75+bob,5,7,ink); d.fillRect(45,75+bob,5,7,ink);
    d.drawLine(57,58,57,80,ink); d.drawLine(53,67,61,67,gold);
    if(s.monsterHp) {
        d.fillCircle(186,70+bob,15,green); d.fillRect(171,70+bob,31,13,green);
        d.fillRect(177,68+bob,3,3,bg); d.fillRect(191,68+bob,3,3,bg);
        d.setCursor(165,42); d.printf("Slime %u",s.monsterHp);
        if(now-g.eventAt()<180 && (g.event()==pq::Event::Attack)) d.drawLine(68,64,165,64,gold);
    } else { d.setCursor(157,64); d.print(s.phase==pq::Phase::Victory ? "VICTORY" : "Woodland"); }
    d.drawLine(5,87,235,87,0x3268);
    d.setTextColor(g.event()==pq::Event::Defeat ? red : gold,bg); d.setCursor(5,91); d.print(eventText(g.event()));
    d.setTextColor(ink,bg); d.setCursor(5,103);
    if(debug) d.printf("IMU %.2fg P%.2f %s",m.energyG,m.peakG,m.calibrated ? (m.armed ? "ARM" : "WAIT") : "CAL");
    else d.print(s.phase==pq::Phase::Battle ? "Face: attack / gentle swing" : "Face: rest + next encounter");
    d.setCursor(5,114);
    if(!imu) d.setTextColor(red,bg);
    d.printf("M5: debug Hold: tune %s",!imu ? "NO IMU" : !m.calibrated ? "CAL" : s.motionPreset==0 ? "LIGHT" : s.motionPreset==1 ? "NORMAL" : "FIRM");
    d.setTextColor(saveError ? red : green,bg); d.setCursor(5,125);
    d.printf("%s #%llu",saveStatus,static_cast<unsigned long long>(sequence));
    if(canvasReady_) canvas_.pushSprite(0,0);
}
