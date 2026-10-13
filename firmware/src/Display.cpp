#include "Display.h"
#include <cstdio>
#include "art/pq_splash.h"
#include "art/pq_battle_attack.h"
#include "art/pq_battle_idle.h"
#include "BatteryUi.h"

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
    auto &d=M5.Display; d.fillScreen(0); pq_splash::draw(d,0,0,0);
}
bool QuestDisplay::updateBattery() {
    const int level=batteryPercent(M5.Power.getBatteryLevel());
    const bool charging=M5.Power.isCharging()==m5::Power_Class::is_charging;
    const bool changed=level!=battery_ || charging!=charging_;
    battery_=level; charging_=charging; return changed;
}
void QuestDisplay::battery(lgfx::LGFXBase &d,uint16_t background,int dx,int dy) {
    const uint16_t color=battery_<0 ? 0x7bef : battery_<=15 ? red : battery_<=35 ? gold : green;
    d.fillRect(174+dx,4+dy,62,16,background); d.setTextSize(1); d.setTextColor(color,background);
    d.setCursor(174+dx,8+dy); if(battery_<0) d.print("--%"); else d.printf("%d%%",battery_);
    if(charging_) d.print("+");
    d.drawRect(211+dx,6+dy,20,12,color); d.fillRect(231+dx,9+dy,3,6,color);
    const int fill=batteryFill(battery_); if(fill) d.fillRect(213+dx,8+dy,fill,8,color);
}
void QuestDisplay::connection(const char *ssid,const char *password,const char *url,const char *qr,bool ready,bool showQr) {
    auto &d=M5.Display; d.fillScreen(0); d.setTextSize(2); d.setTextColor(green,0);
    d.setCursor(6,4); d.print(showQr ? "Wi-Fi QR" : "PocketQuest S3");
    battery(d,0,showQr ? -168 : 0,showQr ? 80 : 0); d.setTextSize(1); d.setTextColor(ink,0);
    if(!ready) { d.setCursor(5,35); d.print("Hotspot failed to start"); }
    else if(showQr) {
        d.setCursor(5,28); d.print("Scan to join");
        d.setCursor(5,46); d.print(ssid);
        d.setCursor(5,64); d.print(password);
        // Larger 3px modules with 12px (four-module) white quiet zone.
        d.qrcode(qr,113,6,123,4,true);
    } else {
        d.setCursor(6,29); d.print("JOIN WI-FI");
        d.setCursor(6,39); d.setTextSize(2); d.setTextColor(gold,0); d.print(ssid);
        d.setTextSize(1); d.setCursor(6,59); d.setTextColor(ink,0); d.print("PASSWORD");
        d.setCursor(6,69); d.setTextSize(2); d.setTextColor(gold,0); d.print(password);
        d.setTextSize(1); d.setCursor(6,94); d.setTextColor(green,0); d.print(url);
        d.setCursor(6,108); d.setTextColor(ink,0); d.print("Local connection / no Internet");
    }
    d.setTextColor(ink,0); d.setCursor(6,122); d.print(showQr ? "M5: mini-game" : "M5: QR  Hold: tune  v0.1.5");
}
void QuestDisplay::frame(const pq::Game &g, const pq::MotionDebug &m, bool imu,
    const char *saveStatus, bool saveError, uint64_t sequence, bool debug, uint32_t now) {
    // Common drawing API supports a PSRAM canvas or direct-screen fallback.
    lgfx::LGFXBase &d=canvasReady_ ? static_cast<lgfx::LGFXBase &>(canvas_) : static_cast<lgfx::LGFXBase &>(M5.Display);
    const auto &s=g.state();
    d.fillScreen(bg); d.setTextSize(1); d.setTextColor(ink,bg); d.setCursor(5,4);
    d.print("PocketQuest"); battery(d,bg); d.setTextColor(ink,bg);
    d.setCursor(5,29); d.printf("Lv%u XP%lu",s.level,static_cast<unsigned long>(s.xp));
    d.setCursor(5,17); d.printf("HP %u/%u",s.hp,pq::maxHp(s.level));
    d.drawRect(79,17,70,8,ink); d.fillRect(80,18,68*s.hp/pq::maxHp(s.level),6,green);
    const int bob=(now/350)%2;
    const int pose=animation_.frame(now);
    if(pose>=0) {
        pq_battle_attack::draw(d,pose,44,82);
    } else pq_battle_idle::draw(d,0,44,82);
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
    d.printf("M5: screens Hold: tune %s",!imu ? "NO IMU" : !m.calibrated ? "CAL" : s.motionPreset==0 ? "LIGHT" : s.motionPreset==1 ? "NORMAL" : "FIRM");
    d.setTextColor(saveError ? red : green,bg); d.setCursor(5,125);
    d.printf("%s #%llu",saveStatus,static_cast<unsigned long long>(sequence));
    if(canvasReady_) canvas_.pushSprite(0,0);
}
