#pragma once
#include <cstdint>
#include <cstdio>
struct DeviceCredentials {
    char ssid[17];
    char password[14];
    explicit DeviceCredentials(uint64_t chipId) {
        // Owner-approved PocketBoy-style convention, not a strong secret.
        std::snprintf(ssid,sizeof(ssid),"PocketQuest-%04X",static_cast<unsigned>(chipId&0xffff));
        std::snprintf(password,sizeof(password),"Quest%08X",static_cast<unsigned>(chipId&0xffffffff));
    }
};
