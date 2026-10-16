#pragma once
#include "Route.h"
#include "Save.h"
namespace pq {
enum class RouteCommit { Applied,Duplicate,Conflict,Invalid,Busy,StorageError };
class RouteTransaction {
public:
    bool halted()const{return halted_;}
    RouteCommit apply(Game &game,SaveStore &store,uint64_t base,RouteCommand command,uint8_t target,uint32_t now){
        if(halted_||!store.writable())return RouteCommit::StorageError;
        State candidate=game.state();
        switch(routeCommand(candidate,base,command,target)){
            case RouteResult::Duplicate:return RouteCommit::Duplicate;
            case RouteResult::Conflict:return RouteCommit::Conflict;
            case RouteResult::Invalid:return RouteCommit::Invalid;
            case RouteResult::Busy:return RouteCommit::Busy;
            case RouteResult::Applied:break;
        }
        // A failed readback can mean a complete snapshot already reached flash.
        // Freeze ALL further writes until reboot scans both slots. Never overwrite
        // that uncertain committed receipt with the older in-memory state.
        if(!store.save(candidate)||!game.restore(candidate,now)){halted_=true;return RouteCommit::StorageError;}
        return RouteCommit::Applied;
    }
private:bool halted_=false;
};
}
