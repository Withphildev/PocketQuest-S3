#include <Arduino.h>
#include <M5Unified.h>
#include <bootloader_random.h>
#include <esp_random.h>
#include <esp_partition.h>
#include <esp_heap_caps.h>
#include <esp_system.h>
#include <Game.h>
#include <Motion.h>
#include <Save.h>
#include <RouteTransaction.h>
#include "Display.h"
#include "FlashSnapshots.h"
#include "ScreenFlow.h"
#include "QuestPortal.h"

namespace {
pq::Game game;
pq::MotionDetector motion;
FlashSnapshots flash;
pq::SaveStore saves(flash);
pq::RouteTransaction routeTransactions;
bool storageHalted=false;
uint32_t routeCommandAt=0;
QuestDisplay display;
ScreenFlow screens;
QuestPortal portal;
uint32_t gameNow=0, gameWall=0;
uint32_t batteryAt=0;
bool storageReady=false, imuReady=false, debugVisible=false, saveError=false;
bool milestonePending=false;
const char *saveStatus="NO STORAGE";
uint64_t savedRevision=0;
pq::State persistedHero;
bool hasPersistedHero=false;
uint32_t lastSave=0, lastFrame=0, lastSample=0, lastDebug=0, bootAt=0, lastAttempt=0;

// Edge-triggered, debounced controls. A long press never also produces a short press.
class Button {
public:
    explicit Button(uint8_t pin) : pin_(pin) {}
    void begin() { pinMode(pin_,INPUT_PULLUP); raw_=down_=digitalRead(pin_)==LOW; suppress_=down_; }
    int poll(uint32_t now) {
        const bool raw=digitalRead(pin_)==LOW;
        if(raw!=raw_) { raw_=raw; changedAt_=now; }
        if(now-changedAt_>=30 && down_!=raw_) {
            down_=raw_;
            if(down_) { pressedAt_=now; held_=false; }
            else { const bool shortPress=!held_ && !suppress_; suppress_=false; return shortPress ? 1 : 0; }
        }
        if(down_ && !held_ && !suppress_ && now-pressedAt_>=1000) { held_=true; return 2; }
        return 0;
    }
private:
    uint8_t pin_; bool raw_=false, down_=false, held_=false, suppress_=false;
    uint32_t changedAt_=0, pressedAt_=0;
};
Button face(11), m5Button(12);

void configureMotion() {
    constexpr float thresholds[]={0.30f,0.40f,0.60f};
    motion.setConfig({thresholds[game.state().motionPreset],pq::kAttackCooldownMs});
    Serial.printf("Motion threshold %.2fg; cooldown %lu ms\n",thresholds[game.state().motionPreset],static_cast<unsigned long>(pq::kAttackCooldownMs));
}
void diagnostics() {
    Serial.printf("PocketQuestMini v1.0.0 Public Release | chip %s rev %u | physical flash %lu bytes\n", ESP.getChipModel(),ESP.getChipRevision(),static_cast<unsigned long>(ESP.getFlashChipSize()));
    Serial.printf("Rules %u | victories %lu | enemy %s tier %u HP %u damage %u\n",game.state().rulesVersion,static_cast<unsigned long>(game.state().victories),pq::enemyName(game.state().enemyKind),static_cast<unsigned>(pq::enemyTier(game.state().victories)+1),pq::enemyMaxHp(game.state().victories,game.state().enemyKind),pq::enemyDamage(game.state().victories,game.state().enemyKind));
    Serial.printf("App image %lu bytes, heap free %lu, internal free/largest %u/%u, PSRAM total/free %lu/%lu\n",
        static_cast<unsigned long>(ESP.getSketchSize()),static_cast<unsigned long>(ESP.getFreeHeap()),
        static_cast<unsigned>(heap_caps_get_free_size(MALLOC_CAP_INTERNAL|MALLOC_CAP_8BIT)),
        static_cast<unsigned>(heap_caps_get_largest_free_block(MALLOC_CAP_INTERNAL|MALLOC_CAP_8BIT)),
        static_cast<unsigned long>(ESP.getPsramSize()),static_cast<unsigned long>(ESP.getFreePsram()));
    Serial.printf("Display %dx%d IMU type %u enabled %u RTC enabled %u reset %u FS %u/%u\n",
        M5.Display.width(),M5.Display.height(),static_cast<unsigned>(M5.Imu.getType()),imuReady,M5.Rtc.isEnabled(),
        static_cast<unsigned>(esp_reset_reason()),static_cast<unsigned>(flash.usedBytes()),static_cast<unsigned>(flash.totalBytes()));
    auto it=esp_partition_find(ESP_PARTITION_TYPE_ANY,ESP_PARTITION_SUBTYPE_ANY,nullptr);
    while(it) {
        const auto *p=esp_partition_get(it); Serial.printf("Partition %s @0x%06lx size 0x%06lx\n",p->label,static_cast<unsigned long>(p->address),static_cast<unsigned long>(p->size));
        it=esp_partition_next(it);
    }
}
bool layoutMatches() {
    const auto *s=esp_partition_find_first(ESP_PARTITION_TYPE_DATA,ESP_PARTITION_SUBTYPE_DATA_SPIFFS,"saves");
    const auto *a=esp_partition_find_first(ESP_PARTITION_TYPE_DATA,ESP_PARTITION_SUBTYPE_DATA_SPIFFS,"assets");
    return ESP.getFlashChipSize()==0x800000 && s && a && s->address==0x4f0000 && s->size==0x100000 && a->address==0x5f0000 && a->size==0x200000;
}
void checkpoint(uint32_t now) {
    if(!storageReady || !saves.writable() || storageHalted || routeTransactions.halted()) return;
    lastAttempt=now;
    if(saves.save(game.state())) {
        persistedHero=game.state();hasPersistedHero=true;
        savedRevision=game.state().revision; lastSave=now; milestonePending=false; saveError=false; saveStatus="SAVED";
        Serial.printf("Saved sequence %llu revision %llu\n",static_cast<unsigned long long>(saves.sequence()),static_cast<unsigned long long>(savedRevision));
    } else { storageHalted=true;saveError=true; saveStatus="RESTART SAVE"; Serial.println("Save uncertain. Writes paused until reboot scans both slots. Do not erase."); }
}
int browserCommand(uint64_t base,uint8_t command,uint8_t target){
    if(!storageReady||!saves.writable()||storageHalted||routeTransactions.halted())return 503;
    const auto &r=game.state().route;const bool retry=r.lastBase==base&&r.lastCommand==command&&r.lastTarget==target;
    const auto now=millis();if(!retry&&routeCommandAt&&now-routeCommandAt<350)return 429;
    const auto result=routeTransactions.apply(game,saves,base,static_cast<pq::RouteCommand>(command),target,gameNow);
    if(result==pq::RouteCommit::StorageError){saveError=true;saveStatus="RESTART SAVE";return 503;}
    if(result==pq::RouteCommit::Conflict)return 409;
    if(result==pq::RouteCommit::Busy)return 423;
    if(result==pq::RouteCommit::Invalid)return 422;
    if(result==pq::RouteCommit::Applied){
        persistedHero=game.state();hasPersistedHero=true;savedRevision=game.state().revision;lastSave=lastAttempt=now;milestonePending=false;saveError=false;saveStatus="SAVED";routeCommandAt=now;
    }
    return 200;
}
bool important(pq::Phase oldPhase) { return game.state().phase!=oldPhase; }
}
void setup() {
    // Enable extra entropy only before M5's ADC/audio initialization; no Wi-Fi needed.
    bootloader_random_enable(); uint64_t seed=0;
    while(seed==0) esp_fill_random(&seed,sizeof(seed));
    bootloader_random_disable(); game=pq::Game(seed);
    auto config=M5.config(); config.serial_baudrate=115200;
    config.internal_mic=false; config.internal_spk=false; config.output_power=false;
    M5.begin(config); M5.Power.setExtOutput(false);
    M5.Display.setRotation(3); M5.Display.setBrightness(70);
    face.begin(); m5Button.begin(); display.begin();
    imuReady=M5.Imu.isEnabled();
    if(layoutMatches()) storageReady=flash.begin();
    if(storageReady) {
        pq::State restored;
        const auto result=saves.load(restored);
        if(result==pq::LoadResult::Loaded) {
            game.restore(restored,millis()); savedRevision=game.state().revision;
            persistedHero=game.state();hasPersistedHero=true;
            saveStatus=saves.recovered() ? "RECOVERED" : "RESTORED";
        } else if(result==pq::LoadResult::NewGame) {
            checkpoint(millis()); if(!saveError) checkpoint(millis());
        } else {
            saveError=true; saveStatus=result==pq::LoadResult::Unsupported ? "SAVE TOO NEW" : "SAVE DAMAGED";
            Serial.println("Save locked. Existing files preserved; this session is unsaved.");
        }
    } else {
        saveError=true; saveStatus="NO SAVE FS";
        Serial.println("Save filesystem/layout unavailable. No formatting attempted. Session is unsaved.");
    }
    portal.routeHandlers([](const char *token,const char *error){
        const bool writable=storageReady&&saves.writable()&&!storageHalted&&!routeTransactions.halted();
        return pq::routeStatusJson(game.state(),saves.sequence(),token,writable,hasPersistedHero&&savedRevision==game.state().revision,(!writable&&!*error)?"Save unavailable; restart to recover. Do not erase.":error);
    },browserCommand);
    configureMotion(); portal.begin(); diagnostics(); lastSave=millis();
    portal.updateHero(game.state(),hasPersistedHero ? &persistedHero : nullptr,saveStatus,storageReady && saves.writable()&&!storageHalted&&!routeTransactions.halted(),saveError,saves.sequence());
    display.updateBattery(); batteryAt=millis();
    gameNow=gameWall=millis(); display.splash(); bootAt=millis(); screens.begin(bootAt);
}
void loop() {
    const uint32_t now=millis(); M5.update();
    portal.loop();
    const bool browserBattle=game.state().route.phase==pq::RoutePhase::Battle;
    const bool locked=storageHalted||routeTransactions.halted();
    if(screens.gaming()&&!browserBattle&&!locked) gameNow+=now-gameWall;
    gameWall=now;
    const int faceEvent=face.poll(now), m5Event=m5Button.poll(now);
    bool swung=false;
    if(imuReady && now-lastSample>=20) {
        lastSample=now; M5.Imu.update(); float x=0,y=0,z=0;
        if(M5.Imu.getAccel(&x,&y,&z)) swung=motion.sample(x,y,z,now);
        else { imuReady=false; Serial.println("IMU unavailable; use Face button."); }
    }
    // IMU calibration continues on all screens; navigation inputs never attack.
    const bool screenChanged=screens.update(now,m5Event==1);
    bool batteryChanged=false;
    if(now-batteryAt>=5000) { batteryAt=now; batteryChanged=display.updateBattery(); }
    if((screenChanged || batteryChanged) && !screens.gaming() && screens.screen()!=ScreenFlow::Screen::Splash) display.connection(portal.ssid().c_str(),portal.password().c_str(),portal.url().c_str(),portal.qr().c_str(),portal.ready(),screens.screen()==ScreenFlow::Screen::Qr);
    if(browserBattle&&faceEvent==2&&!locked)browserCommand(game.state().revision,static_cast<uint8_t>(pq::RouteCommand::Camp),0);
    if(screens.screen()!=ScreenFlow::Screen::Splash && m5Event==2&&!browserBattle&&!locked) { game.cycleMotionPreset(); configureMotion(); milestonePending=true; }
    const auto oldPhase=game.state().phase;
    if(screens.gaming() && !screenChanged && faceEvent==1&&!browserBattle&&!locked) {
        if(game.state().phase==pq::Phase::Battle) { if(game.attack(gameNow)) display.attack(gameNow); }
        else if(game.encounter(gameNow)) display.encounter();
    }
    if(screens.gaming() && !screenChanged && !browserBattle&&!locked&&swung && game.attack(gameNow)) display.attack(gameNow);
    if(screens.gaming() && !screenChanged && !browserBattle&&!locked&&game.tick(gameNow)) display.enemyAttack(gameNow);
    milestonePending=milestonePending || important(oldPhase);
    const bool dirty=game.state().revision!=savedRevision;
    if(dirty && !saveError) saveStatus="UNSAVED";
    if(dirty && (milestonePending || now-lastSave>=30000) && now-lastAttempt>=1500) checkpoint(now);
    portal.updateHero(game.state(),hasPersistedHero ? &persistedHero : nullptr,saveStatus,storageReady && saves.writable()&&!storageHalted&&!routeTransactions.halted(),saveError,saves.sequence());
    if(screens.gaming() && (screenChanged || now-lastFrame>=30)) {
        lastFrame=now; display.frame(game,motion.debug(),imuReady,saveStatus,saveError,saves.sequence(),debugVisible,gameNow);
    }
    if(now-lastDebug>=1000) {
        lastDebug=now;
        if(debugVisible) Serial.printf("motion=%.3fg peak=%.3f calibrated=%u armed=%u rejected=%u HP=%u monster=%u rev=%llu\n",
            motion.debug().energyG,motion.debug().peakG,motion.debug().calibrated,motion.debug().armed,motion.debug().rejected,
            game.state().hp,game.state().monsterHp,static_cast<unsigned long long>(game.state().revision));
    }
    if(Serial.available()) { const char c=Serial.read(); if(c=='?') diagnostics(); if(c=='d') debugVisible=!debugVisible; }
    delay(2);
}
