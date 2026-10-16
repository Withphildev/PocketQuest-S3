#pragma once
#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <esp_random.h>
#include "DeviceCredentials.h"
#include "HeroStatus.h"
#include "HeroPage.h"
#include "RoutePage.h"
#include "RouteStatus.h"
#include "ThemeAudio.h"
#include "AudioRange.h"
#include <lwip/sockets.h>
#include <cerrno>
#include <functional>
// Device-authoritative game commands; one bounded, cooperative audio transfer.
class QuestPortal {
public:
    void routeHandlers(std::function<std::string(const char*,const char*)> status,std::function<int(uint64_t,uint8_t,uint8_t)> command){routeStatus_=status;routeCommand_=command;}
    void begin() {
        const DeviceCredentials credentials(ESP.getEfuseMac());
        ssid_=credentials.ssid; password_=credentials.password;
        WiFi.mode(WIFI_AP);
        ready_=WiFi.softAP(ssid_.c_str(),password_.c_str());
        if(!ready_) return;
        char boot[9];snprintf(boot,sizeof(boot),"%08lX",static_cast<unsigned long>(esp_random()));bootId_=boot;
        char token[33];for(unsigned i=0;i<4;i++)snprintf(token+i*8,9,"%08lX",static_cast<unsigned long>(esp_random()));routeToken_=token;
        const char *keys[]={"Origin","X-PQ-Token","Content-Type","Content-Length","Range"};server_.collectHeaders(keys,5);
        dns_.start(53,"*",WiFi.softAPIP());
        server_.on("/api/hero",HTTP_GET,[this]() {
            headers();
            const auto json=pq::heroStatusJson(live_,hasSaved_ ? &saved_ : nullptr,status_.c_str(),available_,error_,sequence_,bootId_.c_str());
            server_.send(200,"application/json",json.c_str());
        });
        server_.on("/play",HTTP_GET,[this]() {
            headers();
            server_.sendHeader("Content-Encoding","gzip");
            server_.sendHeader("Content-Security-Policy",kRouteCsp);
            // Explicit binary length: never strlen gzip or copy the full page to RAM.
            server_.send_P(200,"text/html; charset=utf-8",reinterpret_cast<const char *>(kRouteGzip),kRouteGzipSize);
        });
        server_.on("/audio/the-gentle-glade.mp3",HTTP_GET,[this](){
            server_.sendHeader("X-Content-Type-Options","nosniff");
            server_.sendHeader("Accept-Ranges","bytes");
            server_.sendHeader("Cache-Control","public, max-age=86400");
            const auto range=pq::audioRange(server_.header("Range").c_str(),kThemeAudioSize);
            if(range.status==416){server_.sendHeader("Content-Range",String("bytes */")+kThemeAudioSize);server_.send(416,"text/plain","");return;}
            if(audioClient_&&audioClient_.connected()){server_.sendHeader("Retry-After","2");server_.send(503,"text/plain","Audio transfer busy. Retry shortly.");return;}
            if(range.status==206)server_.sendHeader("Content-Range",String("bytes ")+range.first+"-"+range.last+"/"+kThemeAudioSize);
            // Retain a shared client handle after WebServer releases its reference.
            // Explicit length prevents chunking; body is pumped without blocking below.
            audioClient_=server_.client();audioOffset_=range.first;audioEnd_=range.last+1;audioProgress_=millis();
            server_.setContentLength(audioEnd_-audioOffset_);server_.send(range.status,"audio/mpeg","");
        });
        server_.on("/api/route",HTTP_GET,[this](){routeReply(200,"");});
        server_.on("/api/route/command",HTTP_POST,[this](){
            if(!pq::routeOrigin(server_.hostHeader().c_str(),server_.header("Origin").c_str())||server_.header("X-PQ-Token")!=routeToken_){routeReply(403,"Origin/token rejected. Reload the game.");return;}
            String type=server_.header("Content-Type");const int semicolon=type.indexOf(';');if(semicolon>=0)type=type.substring(0,semicolon);type.trim();
            if(type!="application/x-www-form-urlencoded"||server_.header("Content-Length").toInt()>160||server_.args()!=3){routeReply(400,"Invalid command body.");return;}
            bool baseFound=false,actionFound=false,targetFound=false;
            for(int i=0;i<server_.args();i++){const auto name=server_.argName(i);if(name=="base"&&!baseFound)baseFound=true;else if(name=="action"&&!actionFound)actionFound=true;else if(name=="target"&&!targetFound)targetFound=true;else{routeReply(400,"Unknown or duplicate field.");return;}}
            uint64_t base=0;const int code=pq::routeCode(server_.arg("action").c_str());const auto target=server_.arg("target");
            if(!baseFound||!actionFound||!targetFound||!pq::routeBase(server_.arg("base").c_str(),base)||code<0||target.length()!=1||target[0]<'0'||target[0]>'3'){routeReply(400,"Invalid command.");return;}
            const int status=routeCommand_?routeCommand_(base,code,target[0]-'0'):503;
            routeReply(status,status==200?"":status==409?"State changed. Latest device state restored.":status==423?"Finish the handheld battle first.":status==429?"Please wait briefly before the next action.":status==503?"Save unavailable. Restart to recover; do not erase.":"Action rejected by device rules.");
        });
        server_.onNotFound([this]() {
            headers();
            if(server_.method()!=HTTP_GET) {server_.send(405,"text/plain","Method not allowed");return;}
            if(server_.uri().startsWith("/api/")||server_.uri().startsWith("/audio/")) {server_.send(404,"text/plain","Unknown resource");return;}
            server_.sendHeader("Content-Security-Policy","default-src 'none'; img-src data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'");
            server_.send_P(200,"text/html; charset=utf-8",kHeroPage);
        });
        server_.begin();
    }
    void loop() { if(ready_) { dns_.processNextRequest(); server_.handleClient(); pumpAudio(); } }
    bool ready() const { return ready_; }
    const String &ssid() const { return ssid_; }
    const String &password() const { return password_; }
    void updateHero(const pq::State &live,const pq::State *saved,const char *status,bool available,bool error,uint64_t sequence) {
        live_=live;hasSaved_=saved!=nullptr;if(saved) saved_=*saved;
        status_=status;available_=available;error_=error;sequence_=sequence;
    }
    // Wildcard hotspot DNS resolves this name locally; no Internet DNS required.
    String url() const { return "http://PocketQuest"; }
    String qr() const { return String("WIFI:T:WPA;S:")+ssid_+";P:"+password_+";H:false;;"; }
private:
    WebServer server_{80}; DNSServer dns_;
    NetworkClient audioClient_;
    size_t audioOffset_=0,audioEnd_=0;uint32_t audioProgress_=0;
    void pumpAudio(){
        if(audioOffset_>=audioEnd_)return;
        if(!audioClient_.connected()||millis()-audioProgress_>15000){audioClient_.stop();audioOffset_=audioEnd_;return;}
        const size_t left=audioEnd_-audioOffset_,count=left>2048?2048:left;
        const int sent=::send(audioClient_.fd(),kThemeAudio+audioOffset_,count,MSG_DONTWAIT);
        if(sent>0){audioOffset_+=sent;audioProgress_=millis();}
        else if(sent<0&&errno!=EAGAIN&&errno!=EWOULDBLOCK&&errno!=EINTR){audioClient_.stop();audioOffset_=audioEnd_;}
        if(audioOffset_==audioEnd_)audioClient_=NetworkClient(); // release only; queued bytes drain before FIN
    }
    String ssid_, password_;
    String routeToken_;
    std::function<std::string(const char*,const char*)> routeStatus_;
    std::function<int(uint64_t,uint8_t,uint8_t)> routeCommand_;
    bool ready_=false;
    pq::State live_,saved_;
    bool hasSaved_=false,available_=false,error_=true;
    uint64_t sequence_=0;
    String status_="STARTING",bootId_;
    void headers() {server_.sendHeader("Cache-Control","no-store");server_.sendHeader("X-Content-Type-Options","nosniff");}
    void routeReply(int code,const char *error){headers();server_.sendHeader("Content-Security-Policy","default-src 'none'");const auto json=routeStatus_?routeStatus_(routeToken_.c_str(),error):"{}";server_.send(code,"application/json",json.c_str());}
};
