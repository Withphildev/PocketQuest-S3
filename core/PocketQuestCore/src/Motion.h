#pragma once
#include <cstdint>
namespace pq {
struct MotionConfig { float thresholdG = 0.40f; uint32_t cooldownMs = 650; };
struct MotionDebug {
    float energyG = 0;
    float peakG = 0;
    uint16_t calibrationSamples = 0;
    bool calibrated = false;
    bool armed = false;
    bool rejected = false;
};
class MotionDetector {
public:
    // Acceleration in g. Caller samples at 50 Hz, not display refresh rate.
    bool sample(float x, float y, float z, uint32_t now);
    void setConfig(MotionConfig config);
    void reset();
    const MotionDebug &debug() const { return debug_; }
private:
    MotionConfig config_;
    MotionDebug debug_;
    float gx_ = 0, gy_ = 0, gz_ = 1;
    uint32_t lastSample_ = 0, lastAttack_ = 0;
    uint16_t quietSamples_ = 0;
    uint8_t highSamples_ = 0;
    bool sampled_ = false, attacked_ = false;
};
}
