#pragma once
#include <cstdint>
inline int batteryPercent(int measured) { return measured<0 ? -1 : measured>100 ? 100 : measured; }
inline int batteryFill(int percent) { return percent<=0 ? 0 : (16*batteryPercent(percent)+99)/100; }
