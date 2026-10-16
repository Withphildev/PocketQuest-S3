# Oakwood rest-layer review

Owner approved the initial static Oakwood/female Nova resting concept and chose one shared character-free background plus two-pose transparent resting sprites for both Novas rather than two full scene images.

Review assets are stored outside the firmware inventory in sibling output folder `PocketQuest-Oakwood-Rest-v1`. It contains index.html, the shared background, female/male two-frame source atlases, PROMPTS.json and REPORT.md. Originals are high-resolution generated masters totaling 5,154,168 bytes, NOT firmware-ready assets. Do not embed them unchanged: they exceed the 2 MiB asset partition and require explicit storage review/final-size export preparation. There is no measured saving versus two static scenes yet.

Built-in image generation authored the layers; the Sites skill was used for a local-only review page, not hosting or game integration. PNG dimensions, real alpha and display-window bounds passed automated read-only checks. Local-file browser navigation was policy-blocked; visual composite, alignment and breathing playback need owner review. No firmware or saves changed. Keep resting presentation nonblocking; healing/saving remain immediate. Existing scenery validation/road contracts are unaffected.
