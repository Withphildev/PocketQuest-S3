#include <Game.h>
#include <Motion.h>
#include <Save.h>
#include <RouteTransaction.h>
#include <cmath>
#include <cstdlib>
#include <iostream>
#include <limits>
#include <string>
#include <vector>

unsigned checks=0;
#define CHECK(x) do { ++checks; if(!(x)) { std::cerr << "FAIL line " << __LINE__ << ": " << #x << '\n'; std::exit(1); } } while(0)
struct MemoryStorage : pq::SnapshotStorage {
    std::vector<uint8_t> bytes[2]; bool exists[2]={false,false};
    int tear=-1; bool failRead=false, failWrite=false, silentTear=false;
    pq::ReadResult read(unsigned slot,std::vector<uint8_t> &out) override {
        if(failRead) return pq::ReadResult::Error;
        out=bytes[slot]; return exists[slot] ? pq::ReadResult::Ok : pq::ReadResult::Missing;
    }
    bool write(unsigned slot,const std::vector<uint8_t> &in) override {
        if(failWrite) return false;
        exists[slot]=true;
        bytes[slot]=tear<0 ? in : std::vector<uint8_t>(in.begin(),in.begin()+tear);
        return tear<0 || silentTear;
    }
};
void rewriteCrc(std::vector<uint8_t> &b) {
    const auto crc=pq::crc32(b.data(),b.size()-4);
    for(unsigned i=0;i<4;++i) b[b.size()-4+i]=static_cast<uint8_t>(crc>>(8*i));
}
void legacyWire(std::vector<uint8_t> &b,uint8_t version,uint8_t rules){
    b.resize(60);b[4]=version;b[6]=60;b[48]=rules;b[49]=0;rewriteCrc(b);
}
void gameTests() {
    pq::Game game(123); CHECK(pq::validState(game.state())); CHECK(!game.attack(0));
    CHECK(game.encounter(0)); CHECK(!game.encounter(1));
    CHECK(game.attack(0)); CHECK(game.state().monsterHp==11); const auto rev=game.state().revision;
    CHECK(!game.attack(649)); CHECK(game.state().revision==rev);
    CHECK(game.attack(650)); CHECK(game.attack(1300)); CHECK(game.state().phase==pq::Phase::Victory);
    CHECK(game.state().xp==12 && game.state().victories==1); CHECK(!game.attack(3000)); CHECK(!game.tick(3000));
    CHECK(game.encounter(4000)); CHECK(game.tick(5800)); CHECK(game.state().hp==27);
    CHECK(game.attack(5800)); CHECK(game.attack(6450)); CHECK(game.attack(7100));
    CHECK(game.state().xp==24 && game.state().level==2 && game.state().hp==34);
    CHECK(game.event()==pq::Event::LevelUp);
    CHECK(game.encounter(9000));
    for(uint32_t t=10800;t<35000;t+=1800) game.tick(t);
    CHECK(game.state().phase==pq::Phase::Defeat && game.state().hp==0);
    CHECK(!game.attack(36000)); CHECK(game.encounter(36000)); CHECK(game.state().hp==34);
    pq::Game restored; CHECK(restored.restore(game.state(),100)); CHECK(!restored.attack(749)); CHECK(restored.attack(750));
    pq::Game wrap(8); CHECK(wrap.encounter(0xfffffff0u)); CHECK(wrap.attack(0xfffffff0u));
    CHECK(!wrap.attack(100)); CHECK(wrap.attack(650));
    CHECK(pq::levelForXp(19)==1 && pq::levelForXp(20)==2 && pq::levelForXp(60)==3);
    CHECK(pq::levelForXp(std::numeric_limits<uint32_t>::max())==99);
    const auto before=game.state().revision; game.cycleMotionPreset(); CHECK(game.state().revision==before+1);
}
void serializationTests() {
    pq::Game game(0x0123456789abcdefULL); game.encounter(0); game.attack(0);
    const auto bytes=pq::encode({game.state(),42}); CHECK(bytes.size()==pq::kSnapshotBytes);
    CHECK(bytes[0]=='P' && bytes[1]=='Q' && bytes[2]=='S' && bytes[3]=='1');
    CHECK(bytes[8]==42 && bytes[16]==0xef && bytes[23]==0x01);
    pq::Snapshot decoded; CHECK(pq::decode(bytes,decoded)==pq::DecodeResult::Ok);
    CHECK(decoded.sequence==42 && decoded.state.worldSeed==game.state().worldSeed);
    CHECK(pq::encode(decoded)==bytes);
    const uint8_t reference[]={'1','2','3','4','5','6','7','8','9'};
    CHECK(pq::crc32(reference,9)==0xcbf43926u);
    for(size_t n=0;n<bytes.size();++n) { auto b=std::vector<uint8_t>(bytes.begin(),bytes.begin()+n); CHECK(pq::decode(b,decoded)==pq::DecodeResult::Invalid); }
    for(size_t i=0;i<bytes.size();++i) for(unsigned bit=0;bit<8;++bit) {
        auto b=bytes; b[i]^=1u<<bit; CHECK(pq::decode(b,decoded)==pq::DecodeResult::Invalid);
    }
    auto b=bytes; b.push_back(0); CHECK(pq::decode(b,decoded)==pq::DecodeResult::Invalid);
    b=bytes; b[4]=pq::kSaveFormat+1; rewriteCrc(b); CHECK(pq::decode(b,decoded)==pq::DecodeResult::Unsupported);
    b=bytes; b[46]=2; rewriteCrc(b); CHECK(pq::decode(b,decoded)==pq::DecodeResult::Unsupported);
    b=bytes; b[50]=255; rewriteCrc(b); CHECK(pq::decode(b,decoded)==pq::DecodeResult::Invalid);
    b=bytes; b[52]=255; rewriteCrc(b); CHECK(pq::decode(b,decoded)==pq::DecodeResult::Invalid);
    b=bytes; b[40]=99; rewriteCrc(b); CHECK(pq::decode(b,decoded)==pq::DecodeResult::Invalid);
    auto state=game.state(); state.worldSeed=0; CHECK(pq::encode({state,1}).empty());
    CHECK(pq::encode({game.state(),0}).empty());
}
void recoveryTests() {
    pq::Game game(123); pq::State out;
    MemoryStorage storage; pq::SaveStore store(storage);
    CHECK(!store.save(game.state())); CHECK(store.load(out)==pq::LoadResult::NewGame);
    CHECK(store.save(game.state())); CHECK(store.save(game.state())); CHECK(store.sequence()==2);
    game.encounter(0); CHECK(store.save(game.state())); CHECK(store.sequence()==3);
    pq::SaveStore reboot(storage); CHECK(reboot.load(out)==pq::LoadResult::Loaded); CHECK(out.phase==pq::Phase::Battle && reboot.sequence()==3);
    const auto stable=storage;
    // Every byte boundary of an interrupted inactive-slot write preserves the active save.
    for(int n=0;n<static_cast<int>(pq::kSnapshotBytes);++n) {
        auto cut=stable; pq::SaveStore writer(cut); CHECK(writer.load(out)==pq::LoadResult::Loaded);
        cut.tear=n; game.attack(static_cast<uint32_t>(n)*700);
        CHECK(!writer.save(game.state()));
        pq::SaveStore restart(cut); CHECK(restart.load(out)==pq::LoadResult::Loaded);
        CHECK(restart.sequence()==3 && out.monsterHp==18); CHECK(restart.recovered());
    }
    auto cut=stable; pq::SaveStore silent(cut); CHECK(silent.load(out)==pq::LoadResult::Loaded);
    cut.tear=30; cut.silentTear=true; CHECK(!silent.save(game.state())); CHECK(silent.sequence()==3);
    cut=stable; cut.bytes[0][20]^=1; pq::SaveStore corrupt(cut); CHECK(corrupt.load(out)==pq::LoadResult::Loaded);
    CHECK(corrupt.sequence()==2 && corrupt.recovered());
    cut.bytes[1][20]^=1; pq::SaveStore both(cut); CHECK(both.load(out)==pq::LoadResult::Fault && !both.writable());
    cut=stable; cut.failRead=true; pq::SaveStore readFail(cut); CHECK(readFail.load(out)==pq::LoadResult::Fault);
    cut=stable; cut.bytes[0][4]=pq::kSaveFormat+1; rewriteCrc(cut.bytes[0]); pq::SaveStore future(cut);
    CHECK(future.load(out)==pq::LoadResult::Unsupported && !future.save(game.state()));
    cut=stable; cut.bytes[0]=pq::encode({pq::Game(999).state(),3}); pq::SaveStore wrongWorld(cut); CHECK(wrongWorld.load(out)==pq::LoadResult::Fault);
    cut=stable; cut.bytes[1]=pq::encode({pq::Game(123).state(),3}); pq::SaveStore tie(cut); CHECK(tie.load(out)==pq::LoadResult::Fault);
    cut=stable; pq::SaveStore failed(cut); CHECK(failed.load(out)==pq::LoadResult::Loaded); cut.failWrite=true; CHECK(!failed.save(game.state())); CHECK(failed.sequence()==3);
    // Missing second snapshot is a valid first-save state, not corruption.
    MemoryStorage first; first.exists[0]=true; first.bytes[0]=pq::encode({pq::Game(42).state(),1});
    pq::SaveStore one(first); CHECK(one.load(out)==pq::LoadResult::Loaded && !one.recovered());
    // Power loss after complete write, before caller acknowledgement: newest valid wins on reboot.
    first.exists[1]=true; first.bytes[1]=pq::encode({pq::Game(42).state(),2});
    pq::SaveStore committed(first); CHECK(committed.load(out)==pq::LoadResult::Loaded && committed.sequence()==2);
}
void motionTests() {
    pq::MotionDetector motion; uint32_t t=0; unsigned swings=0;
    auto sample=[&](float x,float y,float z){ t+=20; if(motion.sample(x,y,z,t)) ++swings; };
    for(int i=0;i<100;++i) sample(0,0,1); CHECK(motion.debug().calibrated && swings==0);
    sample(0.8f,0,1); sample(0.8f,0,1); sample(0.8f,0,1); CHECK(swings==1);
    for(int i=0;i<20;++i) sample((i%2) ? 0.8f : -0.8f,0,1); CHECK(swings==1);
    for(int i=0;i<100;++i) sample(0,0,1); CHECK(motion.debug().armed);
    sample(-0.8f,0,1); sample(-0.8f,0,1); sample(-0.8f,0,1); CHECK(swings==2);
    pq::MotionDetector tilt; uint32_t at=0;
    for(int i=0;i<60;++i) {at+=20; CHECK(!tilt.sample(0,0,1,at));}
    for(int i=0;i<100;++i) {at+=20; const float a=i*0.008f; CHECK(!tilt.sample(std::sin(a),0,std::cos(a),at));}
    CHECK(!tilt.sample(std::numeric_limits<float>::quiet_NaN(),0,1,at+20)); CHECK(tilt.debug().rejected);
    CHECK(!tilt.sample(0,0,5,at+40)); CHECK(tilt.debug().rejected);
    pq::MotionDetector spike; at=0;
    for(int i=0;i<60;++i) { at+=20; CHECK(!spike.sample(0,0,1,at)); }
    at+=20; CHECK(!spike.sample(0.8f,0,1,at));
    for(int i=0;i<20;++i) { at+=20; CHECK(!spike.sample(0,0,1,at)); }
    // Moving startup never skips calibration.
    pq::MotionDetector moving;
    for(int i=0;i<100;++i) CHECK(!moving.sample(i%2 ? 0.8f : -0.8f,0,1,i*20));
    CHECK(!moving.debug().calibrated);
    // Gap followed by movement cannot combine high samples from before/after stall.
    pq::MotionDetector gap; at=0;
    for(int i=0;i<60;++i) { at+=20; CHECK(!gap.sample(0,0,1,at)); }
    CHECK(!gap.sample(0.8f,0,1,at+20)); CHECK(!gap.sample(0.8f,0,1,at+500));
    CHECK(!gap.debug().armed);
}
void difficultyTests() {
    const uint32_t wins[]={0,4,5,9,10,14,15,19,20,24,25,30,std::numeric_limits<uint32_t>::max()};
    for(const auto count:wins) {
        const auto tier=std::min(count/5,5u);
        CHECK(pq::enemyTier(count)==tier);
        CHECK(pq::enemyMaxHp(count)==18+6*tier);
        CHECK(pq::enemyDamage(count)==3+tier);
    }
    pq::Game history(777);uint32_t now=0;
    MemoryStorage storage; pq::SaveStore store(storage);pq::State loaded;
    CHECK(store.load(loaded)==pq::LoadResult::NewGame);
    for(uint32_t count=0;count<30;count++) {
        CHECK(history.state().victories==count);CHECK(history.encounter(now));
        CHECK(history.state().monsterHp==pq::enemyMaxHp(count,history.state().enemyKind));
        const auto hp=history.state().hp;
        CHECK(!history.tick(now+1799));CHECK(history.tick(now+1800));
        CHECK(history.state().hp==hp-pq::enemyDamage(count,history.state().enemyKind));now+=1800;
        while(history.state().phase==pq::Phase::Battle) {now+=650;CHECK(history.attack(now));}
        CHECK(history.state().xp==(count+1)*12);CHECK(history.state().victories==count+1);
        CHECK(store.save(history.state()));pq::SaveStore reboot(storage);
        CHECK(reboot.load(loaded)==pq::LoadResult::Loaded);
        CHECK(loaded.victories==count+1 && loaded.rulesVersion==pq::kRulesVersion);
        CHECK(history.restore(loaded,now));
    }
    // Real legacy wire layout, valid CRC: load without raising existing monster HP.
    auto old=history.state();old.enemyKind=pq::EnemyKind::Slime;old.phase=pq::Phase::Battle;old.hp=pq::maxHp(old.level);old.monsterHp=11;
    auto wire=pq::encode({old,100});CHECK(wire.size()==pq::kSnapshotBytes);
    legacyWire(wire,1,1);pq::Snapshot migrated;
    CHECK(pq::decode(wire,migrated)==pq::DecodeResult::Ok);
    CHECK(migrated.state.rulesVersion==pq::kRulesVersion && migrated.state.monsterHp==11 && migrated.state.victories==30);
    CHECK(migrated.state.xp==old.xp && migrated.state.worldSeed==old.worldSeed && migrated.sequence==100);
    storage.bytes[0]=wire;storage.exists[0]=true;storage.exists[1]=false;
    pq::SaveStore upgraded(storage);CHECK(upgraded.load(loaded)==pq::LoadResult::Loaded);
    CHECK(upgraded.save(loaded));pq::SaveStore restart(storage);
    CHECK(restart.load(loaded)==pq::LoadResult::Loaded && loaded.monsterHp==11 && loaded.victories==30);
    CHECK(history.restore(loaded,now));CHECK(history.tick(now+1800));
    CHECK(history.state().hp==old.hp-8);
    auto invalidOld=wire;invalidOld[44]=19;rewriteCrc(invalidOld);
    CHECK(pq::decode(invalidOld,migrated)==pq::DecodeResult::Invalid);
    auto future=wire;future[48]=4;rewriteCrc(future);
    CHECK(pq::decode(future,migrated)==pq::DecodeResult::Unsupported);
    storage.bytes[0]=future;CHECK(restart.load(loaded)==pq::LoadResult::Unsupported && !restart.writable());
    auto legacy=old;legacy.rulesVersion=1;CHECK(history.restore(legacy,now));
    CHECK(history.state().rulesVersion==pq::kRulesVersion);legacy.monsterHp=19;CHECK(!history.restore(legacy,now));
    auto current=old;current.monsterHp=49;CHECK(!pq::validState(current));
}
void wolfTests() {
    using E=pq::EnemyKind;
    CHECK(pq::encounterKind(4)==E::Slime && pq::encounterKind(5)==E::DireWolf);
    CHECK(pq::encounterKind(6)==E::Slime && pq::encounterKind(7)==E::DireWolf);
    CHECK(pq::enemyMaxHp(5,E::DireWolf)==32 && pq::enemyDamage(5,E::DireWolf)==5);
    CHECK(pq::enemyMaxHp(UINT32_MAX,E::DireWolf)==56 && pq::enemyDamage(UINT32_MAX,E::DireWolf)==9);
    pq::State s;s.worldSeed=123;s.victories=5;s.xp=60;s.level=3;s.hp=pq::maxHp(s.level);
    pq::Game g;CHECK(g.restore(s,0));CHECK(g.encounter(0));CHECK(g.state().enemyKind==E::DireWolf);
    CHECK(g.attack(0));const auto wounded=g.state();CHECK(wounded.monsterHp==21);
    auto bytes=pq::encode({wounded,10});CHECK(bytes[4]==pq::kSaveFormat && bytes[52]==1 && bytes.size()==pq::kSnapshotBytes);
    pq::Snapshot restored;CHECK(pq::decode(bytes,restored)==pq::DecodeResult::Ok);
    CHECK(restored.state.enemyKind==E::DireWolf && restored.state.monsterHp==21);
    CHECK(g.restore(restored.state,100));CHECK(g.tick(1900));CHECK(g.state().hp==s.hp-5);
    CHECK(g.attack(1900) && g.attack(2550));CHECK(g.state().phase==pq::Phase::Victory);
    CHECK(g.state().victories==6 && g.state().xp==72 && g.state().enemyKind==E::DireWolf);
    CHECK(pq::decode(pq::encode({g.state(),11}),restored)==pq::DecodeResult::Ok);
    CHECK(g.restore(restored.state,0) && g.state().enemyKind==E::DireWolf);
    CHECK(g.encounter(100) && g.state().enemyKind==E::Slime);
    // Pre-wolf format-1/rules-2 battle remains slime, even at a wolf-selection count.
    auto legacy=s;legacy.phase=pq::Phase::Battle;legacy.monsterHp=24;
    auto wire=pq::encode({legacy,1});legacyWire(wire,1,2);
    CHECK(pq::decode(wire,restored)==pq::DecodeResult::Ok);
    CHECK(restored.state.enemyKind==E::Slime && restored.state.monsterHp==24 && restored.state.rulesVersion==pq::kRulesVersion);
    wire[52]=1;rewriteCrc(wire);CHECK(pq::decode(wire,restored)==pq::DecodeResult::Invalid);
    wire[52]=0;rewriteCrc(wire);
    MemoryStorage mixed;mixed.exists[0]=mixed.exists[1]=true;mixed.bytes[0]=wire;mixed.bytes[1]=bytes;
    pq::SaveStore migrating(mixed);CHECK(migrating.load(s)==pq::LoadResult::Loaded && s.enemyKind==E::DireWolf && migrating.sequence()==10);
    mixed.bytes[1].resize(20);pq::SaveStore interrupted(mixed);
    CHECK(interrupted.load(s)==pq::LoadResult::Loaded && s.enemyKind==E::Slime && interrupted.recovered());
    auto future=bytes;future[4]=pq::kSaveFormat+1;rewriteCrc(future);MemoryStorage memory;memory.exists[0]=true;memory.bytes[0]=future;
    pq::SaveStore locked(memory);CHECK(locked.load(s)==pq::LoadResult::Unsupported && !locked.writable());
}
void goblinTests() {
    using E=pq::EnemyKind;
    CHECK(pq::encounterKind(9)==E::DireWolf && pq::encounterKind(10)==E::Goblin);
    for(uint32_t n=10;n<100;n+=3) {
        CHECK(pq::encounterKind(n)==E::Goblin);
        CHECK(pq::encounterKind(n+1)==E::Slime);
        CHECK(pq::encounterKind(n+2)==E::DireWolf);
    }
    CHECK(pq::enemyMaxHp(10,E::Goblin)==50 && pq::enemyDamage(10,E::Goblin)==8);
    CHECK(pq::enemyMaxHp(UINT32_MAX,E::Goblin)==68 && pq::enemyDamage(UINT32_MAX,E::Goblin)==11);
    CHECK(std::string(pq::enemyName(E::Goblin))=="Goblin");
    pq::State s;s.worldSeed=765;s.victories=10;s.xp=120;s.level=pq::levelForXp(s.xp);s.hp=pq::maxHp(s.level);
    pq::Game g;CHECK(g.restore(s,0) && g.encounter(0));CHECK(g.state().enemyKind==E::Goblin);
    CHECK(g.tick(1800) && g.state().hp==s.hp-8);
    CHECK(g.attack(1800));const auto wounded=g.state();CHECK(wounded.monsterHp==37);
    auto wire=pq::encode({wounded,20});pq::Snapshot restored;
    CHECK(wire.size()==pq::kSnapshotBytes && wire[4]==pq::kSaveFormat && wire[48]==4 && wire[52]==2);
    CHECK(pq::decode(wire,restored)==pq::DecodeResult::Ok && restored.state.monsterHp==37);
    CHECK(g.restore(restored.state,0) && g.state().enemyKind==E::Goblin);
    CHECK(!g.attack(649) && g.attack(650) && g.attack(1300) && g.attack(1950));
    CHECK(g.state().phase==pq::Phase::Victory && g.state().victories==11 && g.state().xp==132);
    CHECK(g.state().enemyKind==E::Goblin);
    CHECK(pq::decode(pq::encode({g.state(),21}),restored)==pq::DecodeResult::Ok);
    CHECK(g.restore(restored.state,0) && g.state().enemyKind==E::Goblin);
    CHECK(g.encounter(1) && g.state().enemyKind==E::Slime);
    // v0.1.10 rules-3 records retain their actual encounter, even at goblin counts.
    auto wolf=wounded;wolf.enemyKind=E::DireWolf;wolf.monsterHp=20;
    auto old=pq::encode({wolf,19});legacyWire(old,2,3);
    CHECK(pq::decode(old,restored)==pq::DecodeResult::Ok);
    CHECK(restored.state.enemyKind==E::DireWolf && restored.state.rulesVersion==pq::kRulesVersion && restored.state.monsterHp==20);
    wolf.rulesVersion=3;CHECK(g.restore(wolf,0));wolf.enemyKind=E::Goblin;CHECK(!g.restore(wolf,0));
    auto bad=old;bad[52]=2;rewriteCrc(bad);CHECK(pq::decode(bad,restored)==pq::DecodeResult::Invalid);
    bad=wire;bad[52]=3;rewriteCrc(bad);CHECK(pq::decode(bad,restored)==pq::DecodeResult::Invalid);
    bad=wire;bad[48]=5;rewriteCrc(bad);CHECK(pq::decode(bad,restored)==pq::DecodeResult::Unsupported);
    MemoryStorage memory;memory.exists[0]=memory.exists[1]=true;memory.bytes[0]=old;memory.bytes[1]=wire;
    pq::SaveStore store(memory);CHECK(store.load(s)==pq::LoadResult::Loaded && s.enemyKind==E::Goblin && store.sequence()==20);
    memory.bytes[1].resize(20);pq::SaveStore torn(memory);
    CHECK(torn.load(s)==pq::LoadResult::Loaded && s.enemyKind==E::DireWolf && torn.recovered());
    // Goblin defeat and retry remain deterministic; runtime clocks restart safely.
    CHECK(g.restore(wounded,0));for(uint32_t t=1800;g.state().phase==pq::Phase::Battle;t+=1800) CHECK(g.tick(t));
    CHECK(g.state().phase==pq::Phase::Defeat && g.state().enemyKind==E::Goblin);
    CHECK(pq::decode(pq::encode({g.state(),22}),restored)==pq::DecodeResult::Ok);
    CHECK(g.restore(restored.state,0) && g.encounter(0) && g.state().enemyKind==E::Goblin && g.state().monsterHp==50);
}
void sharedHeroTests(){
    using C=pq::RouteCommand;using R=pq::RouteCommit;
    MemoryStorage memory;pq::SaveStore store(memory);pq::State out;CHECK(store.load(out)==pq::LoadResult::NewGame);
    pq::Game g(987);pq::RouteTransaction tx;CHECK(store.save(g.state()));
    auto apply=[&](C c,uint8_t target=0){return tx.apply(g,store,g.state().revision,c,target,0);};
    CHECK(apply(C::Start,3)==R::Invalid);CHECK(apply(C::Start,0)==R::Applied);
    CHECK(g.state().route.phase==pq::RoutePhase::Battle&&g.state().route.hp==40);
    CHECK(apply(C::Attack)==R::Applied);CHECK(g.state().route.enemyHp[0]==3&&g.state().route.hp==37);
    const auto before=g.state();const auto base=before.revision;
    CHECK(apply(C::Attack)==R::Applied);CHECK(g.state().xp==12&&g.state().victories==1&&g.state().route.cleared==1);
    CHECK(tx.apply(g,store,base,C::Attack,0,0)==R::Duplicate);CHECK(g.state().xp==12);
    CHECK(tx.apply(g,store,base,C::Skill,0,0)==R::Conflict);
    pq::SaveStore restarted(memory);CHECK(restarted.load(out)==pq::LoadResult::Loaded);pq::Game reboot;CHECK(reboot.restore(out,0));pq::RouteTransaction fresh;
    CHECK(fresh.apply(reboot,restarted,base,C::Attack,0,0)==R::Duplicate&&reboot.state().xp==12);
    CHECK(apply(C::Continue)==R::Applied);CHECK(apply(C::Start,1)==R::Applied);CHECK(apply(C::Skill,1)==R::Applied);
    CHECK(g.state().route.enemyHp[1]==0&&g.state().route.cleared==1);CHECK(apply(C::Run)==R::Applied);CHECK(apply(C::Continue)==R::Applied);CHECK(apply(C::Start,2)==R::Invalid);
    CHECK(apply(C::Camp)==R::Applied);CHECK(g.encounter(0));CHECK(apply(C::Start,1)==R::Busy);
    while(g.state().phase==pq::Phase::Battle)g.attack(static_cast<uint32_t>(g.state().revision*650));
    CHECK(g.state().xp==24&&g.state().route.cleared==1);CHECK(apply(C::Start,1)==R::Applied);
    CHECK(g.state().level==2);CHECK(apply(C::Skill,0)==R::Applied);CHECK(apply(C::Skill,1)==R::Applied);CHECK(g.state().xp==48&&g.state().route.cleared==3);
    CHECK(apply(C::Continue)==R::Applied);CHECK(apply(C::Camp)==R::Applied);CHECK(apply(C::Start,2)==R::Applied);
    while(g.state().route.phase==pq::RoutePhase::Battle)CHECK(apply(C::Attack)==R::Applied);
    CHECK(g.state().route.cleared==7&&g.state().xp==60);CHECK(apply(C::Continue)==R::Applied);CHECK(apply(C::Camp)==R::Applied);CHECK(apply(C::Start,3)==R::Applied);
    CHECK(apply(C::Run)==R::Invalid);CHECK(apply(C::Guard)==R::Applied);CHECK(apply(C::Guard)==R::Applied);auto hp=g.state().route.hp;CHECK(apply(C::Guard)==R::Applied);CHECK(g.state().route.hp==hp-8);
    CHECK(apply(C::Camp)==R::Applied);CHECK(g.state().route.cleared==7);
    // Every possible torn final reward write: prior snapshot/receipt stays usable.
    for(int cut=0;cut<static_cast<int>(pq::kSnapshotBytes);cut++){
        MemoryStorage m;pq::SaveStore s(m);CHECK(s.load(out)==pq::LoadResult::NewGame);CHECK(s.save(before));pq::Game battle;CHECK(battle.restore(before,0));pq::RouteTransaction t;m.tear=cut;
        CHECK(t.apply(battle,s,base,C::Attack,0,0)==R::StorageError&&t.halted());CHECK(battle.state().xp==0);
        CHECK(t.apply(battle,s,base,C::Attack,0,0)==R::StorageError);
        m.tear=-1;pq::SaveStore recover(m);CHECK(recover.load(out)==pq::LoadResult::Loaded&&out.xp==0);
        CHECK(battle.restore(out,0));pq::RouteTransaction retry;CHECK(retry.apply(battle,recover,base,C::Attack,0,0)==R::Applied);CHECK(battle.state().xp==12);
    }
    // Full durable write with failed readback: no acknowledgement, but reboot
    // finds its receipt and a retry cannot award again.
    struct Ambiguous:MemoryStorage{bool failAfterWrite=false;bool write(unsigned slot,const std::vector<uint8_t>& b)override{const bool ok=MemoryStorage::write(slot,b);if(failAfterWrite)failRead=true;return ok;}} ambiguous;
    pq::SaveStore a(ambiguous);CHECK(a.load(out)==pq::LoadResult::NewGame);CHECK(a.save(before));pq::Game original;CHECK(original.restore(before,0));pq::RouteTransaction uncertain;ambiguous.failAfterWrite=true;
    CHECK(uncertain.apply(original,a,base,C::Attack,0,0)==R::StorageError);CHECK(original.state().xp==0);
    ambiguous.failRead=false;ambiguous.failAfterWrite=false;pq::SaveStore reload(ambiguous);CHECK(reload.load(out)==pq::LoadResult::Loaded&&out.xp==12);CHECK(original.restore(out,0));pq::RouteTransaction dedup;
    CHECK(dedup.apply(original,reload,base,C::Attack,0,0)==R::Duplicate&&original.state().xp==12);
    // Real previous v0.1.13 wire shape migrates with hero and encounter intact.
    auto old=pq::encode({before,20});legacyWire(old,2,4);pq::Snapshot migration;CHECK(pq::decode(old,migration)==pq::DecodeResult::Ok);CHECK(migration.state.xp==before.xp&&migration.state.worldSeed==before.worldSeed&&migration.state.route.cleared==0);
    auto invalid=g.state();invalid.route.cleared=2;CHECK(!pq::validState(invalid));invalid=g.state();invalid.route.lastBase=invalid.revision;CHECK(!pq::validState(invalid));
}
void cozyQuestTests(){
    using C=pq::RouteCommand;using R=pq::RouteCommit;
    MemoryStorage memory;pq::SaveStore store(memory);pq::State state;
    CHECK(store.load(state)==pq::LoadResult::NewGame);
    pq::Game game(123);state=game.state();state.route.hp=20;CHECK(game.restore(state,0));CHECK(store.save(state));
    pq::RouteTransaction tx;
    auto apply=[&](C c,uint8_t target=0){return tx.apply(game,store,game.state().revision,c,target,0);};
    CHECK(apply(C::Start)==R::Applied);CHECK(apply(C::Attack)==R::Applied);CHECK(game.state().route.hp==17);
    const auto base=game.state().revision;
    CHECK(apply(C::Attack)==R::Applied);CHECK(game.state().route.hp==23);
    CHECK(tx.apply(game,store,base,C::Attack,0,0)==R::Duplicate);CHECK(game.state().route.hp==23);
    pq::SaveStore restarted(memory);CHECK(restarted.load(state)==pq::LoadResult::Loaded);CHECK(state.route.hp==23&&state.route.cleared==1);
    CHECK(apply(C::Continue)==R::Applied);CHECK(game.state().route.hp==23);
    for(uint8_t encounter=1;encounter<4;encounter++){
        CHECK(apply(C::Camp)==R::Applied);CHECK(apply(C::Start,encounter)==R::Applied);
        while(game.state().route.phase==pq::RoutePhase::Battle){const uint8_t target=game.state().route.enemyHp[0]?0:1;CHECK(apply(C::Attack,target)==R::Applied);}
        CHECK(game.state().route.phase==pq::RoutePhase::Victory);CHECK(apply(C::Continue)==R::Applied);
    }
    CHECK(game.state().xp==84&&game.state().route.cleared==15);
    CHECK(apply(C::Camp)==R::Applied);CHECK(game.state().route.hp==pq::routeMaxHp(game.state().level));
    pq::SaveStore finalLoad(memory);CHECK(finalLoad.load(state)==pq::LoadResult::Loaded);CHECK(state.xp==84&&state.route.cleared==15);
    CHECK(game.restore(state,0));CHECK(apply(C::Start,3)==R::Invalid);CHECK(apply(C::Continue)==R::Invalid);
    CHECK(apply(C::Camp)==R::Applied);CHECK(game.state().xp==84&&game.state().route.cleared==15);
}
void journeyTests(){
    using C=pq::RouteCommand;using R=pq::RouteCommit;
    pq::Game game(123);MemoryStorage memory;pq::SaveStore store(memory);pq::State loaded;
    CHECK(store.load(loaded)==pq::LoadResult::NewGame);CHECK(store.save(game.state()));
    pq::RouteTransaction tx;
    auto apply=[&](C c,uint8_t target=0){return tx.apply(game,store,game.state().revision,c,target,0);};
    CHECK(apply(C::Advance)==R::Invalid);CHECK(apply(C::Return)==R::Invalid);
    const auto base=game.state().revision;CHECK(apply(C::Depart)==R::Applied);
    const auto first=pq::encode({game.state(),1});
    CHECK(tx.apply(game,store,base,C::Depart,0,0)==R::Duplicate);
    CHECK(pq::encode({game.state(),1})==first&&game.state().journey.outing==1);
    CHECK(apply(C::Depart)==R::Invalid);CHECK(apply(C::Advance)==R::Invalid);
    CHECK(apply(C::Start,1)==R::Invalid);CHECK(apply(C::Start)==R::Applied);
    CHECK(apply(C::Return)==R::Invalid);
    CHECK(apply(C::Guard)==R::Applied);
    pq::SaveStore reboot(memory);CHECK(reboot.load(loaded)==pq::LoadResult::Loaded);
    CHECK(loaded.route.round==game.state().route.round&&loaded.route.hp==game.state().route.hp);
    CHECK(loaded.journey.outing==1&&loaded.journey.mode==1&&pq::validState(loaded));
    CHECK(apply(C::Camp)==R::Applied);CHECK(game.state().journey.mode==0);
    CHECK(apply(C::Depart)==R::Applied&&game.state().journey.outing==2);
    // Elevated hero fixture permits a long deterministic road without artificial healing.
    auto strong=game.state();strong.xp=UINT32_MAX;strong.level=99;strong.hp=pq::maxHp(99);strong.route.hp=pq::routeMaxHp(99);
    CHECK(game.restore(strong,0));
    for(unsigned section=0;section<40;section++){
        CHECK(game.state().journey.section==section);
        CHECK(pq::journeyPosition(game.state())>=320&&pq::journeyPosition(game.state())<=720);
        const auto before=game.state().xp;CHECK(apply(C::Start)==R::Applied);
        while(game.state().route.phase==pq::RoutePhase::Battle)CHECK(apply(C::Attack,game.state().route.enemyHp[0]?0:1)==R::Applied);
        CHECK(game.state().route.phase==pq::RoutePhase::Victory);
        CHECK(game.state().xp==before); // saturation, never wraps
        const auto rewardBase=game.state().route.lastBase;
        CHECK(tx.apply(game,store,rewardBase,C::Attack,game.state().route.lastTarget,0)==R::Duplicate);
        CHECK(apply(C::Continue)==R::Applied);CHECK(apply(C::Start)==R::Invalid);
        CHECK(apply(C::Advance)==R::Applied);
        CHECK(game.state().journey.tier==1+(section+1)/3);
        CHECK(game.state().journey.highest==game.state().journey.tier);
        CHECK(pq::validState(game.state()));
    }
    const auto high=game.state().journey.highest;const auto xp=game.state().xp;
    CHECK(apply(C::Return)==R::Applied&&game.state().journey.mode==2);
    CHECK(apply(C::Advance)==R::Invalid&&apply(C::Start)==R::Invalid&&apply(C::Depart)==R::Invalid);
    CHECK(apply(C::Camp)==R::Applied&&apply(C::Depart)==R::Applied);
    CHECK(game.state().journey.tier==high-1&&game.state().xp==xp);
    CHECK(apply(C::Return)==R::Applied&&apply(C::Camp)==R::Applied&&apply(C::Depart)==R::Applied);
    CHECK(game.state().journey.tier==high-1&&game.state().journey.highest==high);
    auto capped=game.state();capped.journey.tier=capped.journey.highest=99;capped.journey.section=2;
    capped.route.encounter=pq::journeyEncounter(capped);capped.route.cleared=1;
    CHECK(game.restore(capped,0));CHECK(apply(C::Advance)==R::Applied&&game.state().journey.tier==99);
    capped=game.state();capped.journey.section=UINT32_MAX;capped.route.encounter=pq::journeyEncounter(capped);capped.route.cleared=1;
    CHECK(game.restore(capped,0));CHECK(apply(C::Advance)==R::Invalid);
    // Actual v3 (84-byte) snapshot with an unfinished legacy battle migrates intact.
    pq::State legacy;legacy.worldSeed=123;CHECK(pq::routeCommand(legacy,0,C::Start,0)==pq::RouteResult::Applied);
    auto old=pq::encode({legacy,20});old.resize(84);old[4]=3;old[6]=84;rewriteCrc(old);
    pq::Snapshot migration;CHECK(pq::decode(old,migration)==pq::DecodeResult::Ok);
    CHECK(migration.state.route.phase==pq::RoutePhase::Battle&&migration.state.route.enemyHp[0]==16);
    CHECK(!migration.state.journey.outing&&migration.state.revision==legacy.revision);
    for(int cut=0;cut<static_cast<int>(pq::kSnapshotBytes);cut++){
        MemoryStorage m;m.exists[0]=true;m.bytes[0]=old;pq::SaveStore migrating(m);
        CHECK(migrating.load(loaded)==pq::LoadResult::Loaded);m.tear=cut;
        CHECK(!migrating.save(loaded));m.tear=-1;pq::SaveStore scan(m);
        CHECK(scan.load(loaded)==pq::LoadResult::Loaded&&loaded.route.enemyHp[0]==16&&!loaded.journey.outing);
    }
    auto invalid=game.state();invalid.journey.tier=0;CHECK(!pq::validState(invalid));
    invalid=game.state();invalid.journey.mode=3;CHECK(!pq::validState(invalid));
    // Every interrupted road-boundary checkpoint retains its prior section/tier.
    auto boundary=game.state();boundary.journey.section=2;boundary.journey.tier=boundary.journey.highest=1;
    boundary.route.encounter=pq::journeyEncounter(boundary);boundary.route.cleared=1;
    for(int cut=0;cut<static_cast<int>(pq::kSnapshotBytes);cut++){
        MemoryStorage m;pq::SaveStore saved(m);CHECK(saved.load(loaded)==pq::LoadResult::NewGame);CHECK(saved.save(boundary));
        pq::Game moving;CHECK(moving.restore(boundary,0));pq::RouteTransaction transaction;m.tear=cut;
        CHECK(transaction.apply(moving,saved,boundary.revision,C::Advance,0,0)==R::StorageError&&transaction.halted());
        CHECK(moving.state().journey.section==2&&moving.state().journey.highest==1);
        m.tear=-1;pq::SaveStore recovering(m);CHECK(recovering.load(loaded)==pq::LoadResult::Loaded);
        CHECK(loaded.journey.section==2&&loaded.journey.highest==1&&loaded.xp==boundary.xp);
    }
}
void chestTests(){
    using C=pq::RouteCommand;using R=pq::RouteCommit;
    pq::State ready;ready.worldSeed=123;ready.journey.outing=1;ready.journey.mode=1;
    ready.route.encounter=pq::journeyEncounter(ready);ready.route.hp=20;ready.route.potions=0;
    CHECK(pq::chestExists(ready));CHECK(pq::chestPosition(ready)>pq::journeyPosition(ready)+42);
    auto blocked=ready;CHECK(pq::routeCommand(blocked,0,C::Chest,0)==pq::RouteResult::Invalid);
    ready.route.cleared=1;CHECK(pq::validState(ready));
    const auto original=pq::encode({ready,1});
    auto collect=[&](pq::State s){CHECK(pq::routeCommand(s,s.revision,C::Chest,0)==pq::RouteResult::Applied);return s;};
    const auto opened=collect(ready);CHECK(opened.journey.chestOpened==1&&opened.xp==ready.xp&&opened.victories==ready.victories);
    CHECK(opened.route.hp==ready.route.hp+(pq::chestPotion(ready)?0:8));CHECK(opened.route.potions==(pq::chestPotion(ready)?1:0));
    auto replay=opened;CHECK(pq::routeCommand(replay,ready.revision,C::Chest,0)==pq::RouteResult::Duplicate);
    CHECK(pq::routeCommand(replay,replay.revision,C::Chest,0)==pq::RouteResult::Invalid);
    CHECK(pq::encode({replay,1})==pq::encode({opened,1}));
    blocked=ready;CHECK(pq::routeCommand(blocked,0,C::Chest,1)==pq::RouteResult::Invalid);
    blocked=ready;blocked.journey.mode=2;CHECK(pq::routeCommand(blocked,0,C::Chest,0)==pq::RouteResult::Invalid);
    blocked=ready;blocked.route.hp=40;blocked.route.potions=2;CHECK(pq::routeCommand(blocked,0,C::Chest,0)==pq::RouteResult::Invalid);CHECK(!blocked.journey.chestOpened);
    blocked=ready;blocked.route.hp=38;blocked.route.potions=2;auto healed=collect(blocked);CHECK(healed.route.hp==40&&healed.route.potions==2);
    auto next=opened;CHECK(pq::routeCommand(next,next.revision,C::Advance,0)==pq::RouteResult::Applied);CHECK(!next.journey.chestOpened&&next.journey.section==1);
    // v4 migration preserves hero, current road, combat state and receipt; no reroll.
    auto v4=original;v4.resize(97);v4[4]=4;v4[6]=97;rewriteCrc(v4);pq::Snapshot decoded;
    CHECK(pq::decode(v4,decoded)==pq::DecodeResult::Ok);CHECK(!decoded.state.journey.chestOpened);
    CHECK(decoded.state.worldSeed==ready.worldSeed&&decoded.state.route.hp==20&&decoded.state.journey.outing==1);
    CHECK(pq::encode({decoded.state,1})==original);
    auto active=ready;active.route.cleared=0;CHECK(pq::routeCommand(active,0,C::Start,0)==pq::RouteResult::Applied);
    auto oldBattle=pq::encode({active,10});oldBattle.resize(97);oldBattle[4]=4;oldBattle[6]=97;rewriteCrc(oldBattle);
    CHECK(pq::decode(oldBattle,decoded)==pq::DecodeResult::Ok);CHECK(decoded.state.route.phase==pq::RoutePhase::Battle&&!decoded.state.journey.chestOpened);
    CHECK(decoded.state.journey.outing==active.journey.outing&&decoded.state.route.lastBase==active.route.lastBase&&decoded.state.route.enemyHp[0]==active.route.enemyHp[0]);
    for(uint64_t seed=1;seed<=16;++seed){auto reward=ready;reward.worldSeed=seed;reward.route.encounter=pq::journeyEncounter(reward);const auto claimed=collect(reward);CHECK(claimed.route.potions==(pq::chestPotion(reward)?1:0));CHECK(claimed.route.hp==(pq::chestPotion(reward)?20:28));}
    // Every interrupted claim restores the old unopened state and old reward balance.
    for(int cut=0;cut<static_cast<int>(pq::kSnapshotBytes);++cut){
        MemoryStorage m;m.exists[0]=true;m.bytes[0]=v4;pq::SaveStore store(m);pq::State state;CHECK(store.load(state)==pq::LoadResult::Loaded);
        pq::Game game;CHECK(game.restore(ready,0));pq::RouteTransaction tx;m.tear=cut;
        CHECK(tx.apply(game,store,ready.revision,C::Chest,0,0)==R::StorageError&&tx.halted());
        CHECK(game.state().route.hp==ready.route.hp&&!game.state().journey.chestOpened);
        m.tear=-1;pq::SaveStore reboot(m);CHECK(reboot.load(state)==pq::LoadResult::Loaded);CHECK(pq::encode({state,1})==original);
    }
    MemoryStorage m;pq::SaveStore store(m);pq::State state;CHECK(store.load(state)==pq::LoadResult::NewGame);CHECK(store.save(ready));
    pq::Game game;CHECK(game.restore(ready,0));pq::RouteTransaction tx;m.failRead=true;
    CHECK(tx.apply(game,store,0,C::Chest,0,0)==R::StorageError&&tx.halted());
    m.failRead=false;pq::SaveStore reboot(m);CHECK(reboot.load(state)==pq::LoadResult::Loaded);CHECK(state.journey.chestOpened==1);
    CHECK(game.restore(state,0));pq::RouteTransaction retry;CHECK(retry.apply(game,reboot,0,C::Chest,0,0)==R::Duplicate);
    CHECK(retry.apply(game,reboot,state.revision,C::Chest,0,0)==R::Invalid);
    for(uint64_t seed=0;seed<64;++seed)for(uint32_t section=0;section<24;++section){
        auto s=ready;s.worldSeed=seed;s.journey.section=section;s.route.encounter=pq::journeyEncounter(s);
        CHECK(pq::chestPosition(s)>=pq::journeyPosition(s)+90&&pq::chestPosition(s)<=960);
        if(!pq::chestExists(s)){s.journey.chestOpened=1;CHECK(!pq::validState(s));}
    }
}
int main() {
    gameTests(); serializationTests(); recoveryTests(); motionTests(); difficultyTests(); wolfTests(); goblinTests();sharedHeroTests();cozyQuestTests();journeyTests();chestTests();
    std::cout << "PASS: " << checks << " assertions (combat, serialization, interrupted-write recovery, motion)\n";
}
