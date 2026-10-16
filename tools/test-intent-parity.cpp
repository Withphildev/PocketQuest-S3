#include <Game.h>
#include <Route.h>
#include <cassert>
#include <iostream>
int main(){
 for(uint8_t encounter=0;encounter<4;encounter++)for(uint16_t round=1;round<=6;round++)for(bool guard:{false,true}){
  pq::Game game(123);auto s=game.state();s.route.cleared=(1<<encounter)-1;
  assert(pq::routeCommand(s,s.revision,pq::RouteCommand::Start,encounter)==pq::RouteResult::Applied);
  s.route.round=round;const auto before=s.route.hp;
  // Item at full HP produces an ordinary response without defeating anyone.
  assert(pq::routeCommand(s,s.revision,guard?pq::RouteCommand::Guard:pq::RouteCommand::Item,0)==pq::RouteResult::Applied);
  assert(!s.xp&&s.route.cleared==((1<<encounter)-1));
  std::cout<<'['<<unsigned(encounter)<<','<<round<<','<<(guard?1:0)<<','<<(before-s.route.hp)<<"]\n";
 }
}
