#pragma once
#include <Game.h>
#include <string>
#include <cstdio>
namespace pq {
inline std::string jsonText(const char *value) {
    std::string out="\"";
    for(const unsigned char *p=reinterpret_cast<const unsigned char *>(value);*p;++p) {
        if(*p=='"' || *p=='\\') {out+='\\';out+=static_cast<char>(*p);}
        else if(*p<32) {char escaped[7];std::snprintf(escaped,sizeof(escaped),"\\u%04x",*p);out+=escaped;}
        else out+=static_cast<char>(*p);
    }
    return out+'"';
}
inline std::string heroStateJson(const State &s) {
    const auto base=s.level<=1 ? 0 : nextLevelXp(s.level-1);
    return "{\"revision\":"+jsonText(std::to_string(s.revision).c_str())+
        ",\"level\":"+std::to_string(s.level)+",\"xp\":"+std::to_string(s.xp)+
        ",\"hp\":"+std::to_string(s.hp)+",\"maxHp\":"+std::to_string(maxHp(s.level))+
        ",\"victories\":"+std::to_string(s.victories)+",\"enemyTier\":"+std::to_string(enemyTier(s.victories)+1)+
        ",\"monsterHp\":"+std::to_string(s.monsterHp)+",\"enemyKind\":"+std::to_string(static_cast<unsigned>(s.enemyKind))+",\"enemyName\":"+jsonText(enemyName(s.enemyKind))+",\"phase\":"+std::to_string(static_cast<unsigned>(s.phase))+
        ",\"rulesVersion\":"+std::to_string(s.rulesVersion)+",\"xpIntoLevel\":"+std::to_string(s.level>=99 ? 0 : s.xp-base)+
        ",\"xpLevelSpan\":"+std::to_string(s.level>=99 ? 0 : nextLevelXp(s.level)-base)+"}";
}
inline std::string heroStatusJson(const State &live,const State *saved,const char *status,bool available,bool error,uint64_t sequence,const char *bootId) {
    char heroId[17];std::snprintf(heroId,sizeof(heroId),"%016llX",static_cast<unsigned long long>(live.worldSeed));
    return "{\"schemaVersion\":1,\"firmwareVersion\":\"1.0.0\",\"deviceAuthoritative\":true,\"bootId\":"+jsonText(bootId)+
        ",\"heroId\":"+jsonText(heroId)+",\"live\":"+heroStateJson(live)+",\"saved\":"+(saved ? heroStateJson(*saved) : "null")+
        ",\"persistence\":{\"status\":"+jsonText(status)+",\"available\":"+(available ? "true" : "false")+
        ",\"error\":"+(error ? "true" : "false")+",\"dirty\":"+(!saved || saved->revision!=live.revision ? "true" : "false")+
        ",\"sequence\":"+jsonText(std::to_string(sequence).c_str())+"}}";
}
}
