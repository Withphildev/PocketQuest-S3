#include <Game.h>
#include <Motion.h>
#include <Save.h>
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
    b=bytes; b[4]=2; rewriteCrc(b); CHECK(pq::decode(b,decoded)==pq::DecodeResult::Unsupported);
    b=bytes; b[46]=2; rewriteCrc(b); CHECK(pq::decode(b,decoded)==pq::DecodeResult::Unsupported);
    b=bytes; b[50]=255; rewriteCrc(b); CHECK(pq::decode(b,decoded)==pq::DecodeResult::Invalid);
    b=bytes; b[52]=1; rewriteCrc(b); CHECK(pq::decode(b,decoded)==pq::DecodeResult::Invalid);
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
    cut=stable; cut.bytes[0][4]=2; rewriteCrc(cut.bytes[0]); pq::SaveStore future(cut);
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
int main() {
    gameTests(); serializationTests(); recoveryTests(); motionTests();
    std::cout << "PASS: " << checks << " assertions (combat, serialization, interrupted-write recovery, motion)\n";
}
