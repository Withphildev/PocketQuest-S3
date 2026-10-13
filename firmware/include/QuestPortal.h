#pragma once
#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>
#include "DeviceCredentials.h"
// Connection landing page only; no browser gameplay or remote save mutation.
class QuestPortal {
public:
    void begin() {
        const DeviceCredentials credentials(ESP.getEfuseMac());
        ssid_=credentials.ssid; password_=credentials.password;
        WiFi.mode(WIFI_AP);
        ready_=WiFi.softAP(ssid_.c_str(),password_.c_str());
        if(!ready_) return;
        dns_.start(53,"*",WiFi.softAPIP());
        server_.onNotFound([this]() {
            server_.sendHeader("Cache-Control","no-store");
            server_.send(200,"text/html", "<!doctype html><meta name='viewport' content='width=device-width'><title>PocketQuest-S3</title><h1>PocketQuest-S3</h1><p>You are connected directly to your StickS3.</p><p>v0.1.5: Play Nova's slime battle on the device. M5 cycles screens; Face attacks.</p><p>Open http://PocketQuest while connected to the hotspot. If hostname resolution is unavailable, use http://192.168.4.1.</p><p>Browser adventure integration is not included yet. This hotspot has no Internet access.</p>");
        });
        server_.begin();
    }
    void loop() { if(ready_) { dns_.processNextRequest(); server_.handleClient(); } }
    bool ready() const { return ready_; }
    const String &ssid() const { return ssid_; }
    const String &password() const { return password_; }
    // Wildcard hotspot DNS resolves this name locally; no Internet DNS required.
    String url() const { return "http://PocketQuest"; }
    String qr() const { return String("WIFI:T:WPA;S:")+ssid_+";P:"+password_+";H:false;;"; }
private:
    WebServer server_{80}; DNSServer dns_;
    String ssid_, password_;
    bool ready_=false;
};
