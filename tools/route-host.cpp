// Synthetic in-memory device for browser QA. Runs actual C++ game/save/transactions.
#include "../firmware/include/RouteStatus.h"
#include <RouteTransaction.h>
#include <iostream>
#include <sstream>
struct Memory: pq::SnapshotStorage{
 std::vector<uint8_t> b[2];bool present[2]={false,false};
 pq::ReadResult read(unsigned i,std::vector<uint8_t>&out)override{out=b[i];return present[i]?pq::ReadResult::Ok:pq::ReadResult::Missing;}
 bool write(unsigned i,const std::vector<uint8_t>&in)override{b[i]=in;present[i]=true;return true;}
};
int main(int argc,char **argv){
 Memory memory;pq::SaveStore store(memory);pq::State saved;store.load(saved);pq::Game game(123);store.save(game.state());pq::RouteTransaction tx;unsigned boot=0;
 // Optional QA fixture: complete the route through real persisted engine actions.
 // No synthetic state injection, no device writes and never in the firmware.
 if(argc==2&&std::string(argv[1])=="--complete-route"){
  auto apply=[&](pq::RouteCommand c,uint8_t target=0){return tx.apply(game,store,game.state().revision,c,target,0)==pq::RouteCommit::Applied;};
  for(uint8_t i=0;i<4;i++){
   if(!apply(pq::RouteCommand::Camp)||!apply(pq::RouteCommand::Start,i))return 2;
   while(game.state().route.phase==pq::RoutePhase::Battle)if(!apply(pq::RouteCommand::Attack,game.state().route.enemyHp[0]?0:1))return 3;
   if(game.state().route.phase!=pq::RoutePhase::Victory||!apply(pq::RouteCommand::Continue))return 4;
  }
  if(!apply(pq::RouteCommand::Camp))return 5;
 }
 std::string line;while(std::getline(std::cin,line)){
  std::istringstream input(line);std::string kind,base;unsigned command=0,target=0;int code=200;const char *error="";input>>kind;
  if(kind=="cmd"){
   input>>base>>command>>target;uint64_t rev=0;
   if(!pq::routeBase(base,rev)||command>11||target>3)code=400;
   else{const auto r=tx.apply(game,store,rev,static_cast<pq::RouteCommand>(command),target,0);code=r==pq::RouteCommit::Conflict?409:r==pq::RouteCommit::Invalid?422:r==pq::RouteCommit::Busy?423:r==pq::RouteCommit::StorageError?503:200;}
   if(code!=200)error="HOST MOCK: device rejected stale/invalid/busy command";
  }else if(kind=="reboot"){pq::State restored;if(store.load(restored)==pq::LoadResult::Loaded)game.restore(restored,0);tx=pq::RouteTransaction();++boot;}
  else if(kind=="handheld"){
   if(game.state().route.phase==pq::RoutePhase::Battle)code=423;
   else{game.encounter(0);uint32_t at=0;while(game.state().phase==pq::Phase::Battle){game.attack(at);at+=650;}store.save(game.state());}
  }else if(kind!="get")code=400;
  std::string token(32,static_cast<char>('A'+boot%6));
  std::cout<<"{\"code\":"<<code<<",\"state\":"<<pq::routeStatusJson(game.state(),store.sequence(),token.c_str(),!tx.halted(),true,error)<<"}"<<std::endl;
 }
}
