#pragma once
#include "HeroStatus.h"
#include <Route.h>
namespace pq {
inline std::string routeStatusJson(const State &s,uint64_t sequence,const char *token,bool writable,bool durable,const char *error){
    char hero[17];std::snprintf(hero,sizeof(hero),"%016llX",static_cast<unsigned long long>(s.worldSeed));
    const auto &r=s.route;
    return "{\"schemaVersion\":3,\"deviceAuthoritative\":true,\"heroId\":"+jsonText(hero)+",\"token\":"+jsonText(token)+
      ",\"revision\":"+jsonText(std::to_string(s.revision).c_str())+",\"sequence\":"+jsonText(std::to_string(sequence).c_str())+
      ",\"writable\":"+(writable?"true":"false")+",\"durable\":"+(durable?"true":"false")+",\"error\":"+jsonText(error)+
      ",\"xp\":"+std::to_string(s.xp)+",\"level\":"+std::to_string(s.level)+",\"hp\":"+std::to_string(r.hp)+",\"maxHp\":"+std::to_string(routeMaxHp(s.level))+
      ",\"handheldHp\":"+std::to_string(s.hp)+",\"handheldBattle\":"+(s.phase==Phase::Battle?"true":"false")+
      ",\"phase\":"+std::to_string(static_cast<unsigned>(r.phase))+",\"cleared\":"+std::to_string(r.cleared)+",\"encounter\":"+std::to_string(r.encounter)+
      ",\"target\":"+std::to_string(r.target)+",\"focus\":"+std::to_string(r.focus)+",\"potions\":"+std::to_string(r.potions)+",\"round\":"+std::to_string(r.round)+
      ",\"enemyHp\":["+std::to_string(r.enemyHp[0])+","+std::to_string(r.enemyHp[1])+"]"+
      ",\"journey\":{\"outing\":"+std::to_string(s.journey.outing)+",\"section\":"+std::to_string(s.journey.section)+
      ",\"tier\":"+std::to_string(s.journey.tier)+",\"highest\":"+std::to_string(s.journey.highest)+",\"mode\":"+std::to_string(s.journey.mode)+
      ",\"chestOpened\":"+std::to_string(s.journey.chestOpened)+",\"chestPresent\":"+(chestExists(s)?"true":"false")+
      ",\"chestPosition\":"+std::to_string(chestPosition(s))+",\"chestPotion\":"+(chestPotion(s)?"true":"false")+
      ",\"position\":"+std::to_string(journeyPosition(s))+",\"enemyMaxHp\":"+std::to_string(routeEnemyHp(s))+",\"damage\":"+std::to_string(routeHit(s))+"}}";
}
inline bool routeBase(const std::string &s,uint64_t &out){
    if(s.empty()||s.size()>20||(s.size()>1&&s[0]=='0'))return false;uint64_t n=0;
    for(char c:s){if(c<'0'||c>'9'||n>(UINT64_MAX-(c-'0'))/10)return false;n=n*10+(c-'0');}out=n;return true;
}
inline int routeCode(const std::string &s){const char *names[]={"start","attack","skill","guard","item","run","continue","camp","depart","return","advance","chest"};for(int i=0;i<12;i++)if(s==names[i])return i;return -1;}
inline bool routeOrigin(std::string host,std::string origin){
    for(auto &c:host)if(c>='A'&&c<='Z')c+=32;
    for(auto &c:origin)if(c>='A'&&c<='Z')c+=32;
    if(host!="pocketquest"&&host!="192.168.4.1"&&host!="pocketquest:80"&&host!="192.168.4.1:80")return false;
    if(host.size()>3&&host.substr(host.size()-3)==":80")host.resize(host.size()-3);
    return origin=="http://"+host||origin=="http://"+host+":80";
}
}
