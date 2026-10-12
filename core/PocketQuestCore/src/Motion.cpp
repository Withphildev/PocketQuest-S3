#include "Motion.h"
#include <algorithm>
#include <cmath>
namespace pq {
void MotionDetector::reset() { *this = MotionDetector{}; }
void MotionDetector::setConfig(MotionConfig c) {
    c.thresholdG = std::isfinite(c.thresholdG) ? std::max(0.25f, std::min(0.8f, c.thresholdG)) : 0.4f;
    c.cooldownMs = std::max<uint32_t>(650, c.cooldownMs);
    config_ = c; highSamples_ = 0; quietSamples_ = 0; debug_.armed = false;
}
bool MotionDetector::sample(float x, float y, float z, uint32_t now) {
    debug_.rejected = false;
    const uint32_t dt = now - lastSample_;
    if (sampled_ && dt < 15) return false;
    if (sampled_ && dt > 100) { debug_.armed = false; highSamples_ = 0; quietSamples_ = 0; }
    lastSample_ = now; sampled_ = true;
    const float mag = std::sqrt(x*x + y*y + z*z);
    if (!std::isfinite(mag) || mag < 0.2f || mag > 3.0f) {
        debug_.rejected = true; debug_.armed = false; highSamples_ = 0; quietSamples_ = 0;
        if (!debug_.calibrated) debug_.calibrationSamples = 0;
        return false;
    }
    if (!debug_.calibrated && debug_.calibrationSamples == 0) { gx_ = x; gy_ = y; gz_ = z; }
    const float dx = x-gx_, dy = y-gy_, dz = z-gz_;
    const float dynamic = std::sqrt(dx*dx + dy*dy + dz*dz);
    gx_ += 0.06f * dx; gy_ += 0.06f * dy; gz_ += 0.06f * dz;
    debug_.energyG = debug_.energyG * 0.5f + dynamic * 0.5f;
    debug_.peakG = std::max(debug_.peakG, dynamic);
    if (!debug_.calibrated) {
        if (mag >= 0.85f && mag <= 1.15f && dynamic < 0.12f) ++debug_.calibrationSamples;
        else debug_.calibrationSamples = 0;
        if (debug_.calibrationSamples >= 40) { debug_.calibrated = true; debug_.armed = true; }
        return false;
    }
    if (debug_.energyG < 0.12f) {
        if (quietSamples_ < 13) ++quietSamples_;
        if (quietSamples_ >= 13 && (!attacked_ || now - lastAttack_ >= config_.cooldownMs)) debug_.armed = true;
    } else quietSamples_ = 0;
    if (debug_.armed && debug_.energyG >= config_.thresholdG) ++highSamples_;
    else highSamples_ = 0;
    if (highSamples_ < 2) return false;
    highSamples_ = 0; debug_.armed = false; lastAttack_ = now; attacked_ = true;
    return true;
}
}
